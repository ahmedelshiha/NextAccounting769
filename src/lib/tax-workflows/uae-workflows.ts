import { logger } from '@/lib/logger'
import {
  TaxCalculations,
  UAEVATFiling,
  UAEESRFiling,
  UAECorporateTaxFiling,
  ValidationResult,
} from './types'

/**
 * UAE VAT Workflow
 * - Filing threshold: AED 375,000 annual turnover
 * - Filing frequency: Monthly
 * - Tax rate: 5%
 */
export class UAEVATWorkflow {
  /**
   * Calculate VAT filing
   */
  calculateVAT(filing: UAEVATFiling): TaxCalculations {
    const { inwardSupplies, outwardSupplies } = filing

    // Calculate output tax (tax on supplies made)
    const outputTax = (outwardSupplies.taxedSupplies * 5) / 100

    // Calculate input tax (tax on purchases)
    const inputTax = inwardSupplies.taxedSupplies * 0.05

    // Net VAT payable
    const netTax = outputTax - inputTax - (filing.recoveryOfInputTax || 0)

    return {
      grossIncome: outwardSupplies.taxedSupplies,
      totalDeductions: inputTax,
      taxableIncome: outwardSupplies.taxedSupplies - inwardSupplies.taxedSupplies,
      taxRate: 5,
      taxAmount: Math.max(0, netTax),
    }
  }

  /**
   * Validate UAE VAT filing
   */
  validateFiling(filing: UAEVATFiling): ValidationResult {
    const errors: ValidationResult['errors'] = []
    const warnings: string[] = []

    // Check supply values
    if (filing.inwardSupplies.taxedSupplies < 0) {
      errors.push({
        field: 'inwardSupplies.taxedSupplies',
        message: 'Taxed supplies cannot be negative',
        severity: 'error',
      })
    }

    if (filing.outwardSupplies.taxedSupplies < 0) {
      errors.push({
        field: 'outwardSupplies.taxedSupplies',
        message: 'Taxed supplies cannot be negative',
        severity: 'error',
      })
    }

    // Check filing registration requirement
    const totalTurnover = filing.outwardSupplies.taxedSupplies +
      filing.outwardSupplies.zeroRatedSupplies +
      filing.outwardSupplies.exemptedSupplies +
      filing.outwardSupplies.outOfScopeSupplies

    if (totalTurnover > 375000 && filing.outputTax === 0) {
      warnings.push('Turnover exceeds VAT registration threshold but no output tax calculated')
    }

    // Check input tax recovery
    if (filing.recoveryOfInputTax && filing.recoveryOfInputTax > filing.inputTax) {
      errors.push({
        field: 'recoveryOfInputTax',
        message: 'Recovery of input tax cannot exceed input tax amount',
        severity: 'error',
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Generate filing summary
   */
  generateSummary(filing: UAEVATFiling, calculations: TaxCalculations): string {
    return `
UAE VAT Filing Summary:
- Output Tax: AED ${calculations.taxAmount.toFixed(2)}
- Input Tax: AED ${filing.inputTax.toFixed(2)}
- Net Tax: AED ${(calculations.taxAmount - filing.inputTax).toFixed(2)}
- Taxable Turnover: AED ${calculations.grossIncome.toFixed(2)}
    `.trim()
  }
}

/**
 * UAE Economic Substance Requirement (ESR) Workflow
 * - Filing frequency: Annually
 * - Must demonstrate economic substance for CE (Cost Effective) businesses
 */
export class UAEESRWorkflow {
  /**
   * Validate ESR filing
   */
  validateESRFiling(filing: UAEESRFiling): ValidationResult {
    const errors: ValidationResult['errors'] = []
    const warnings: string[] = []

    // Check all substance requirements
    const { economicSubstance } = filing

    if (!economicSubstance.businessPurpose) {
      errors.push({
        field: 'economicSubstance.businessPurpose',
        message: 'Business purpose must be documented',
        severity: 'error',
      })
    }

    if (!economicSubstance.managedExecution) {
      warnings.push(
        'Business is not managed in UAE. Ensure it meets CE criteria exceptions.'
      )
    }

    if (!economicSubstance.relevantPeople) {
      warnings.push(
        'No relevant people present in UAE. Document remote management structure.'
      )
    }

    if (!economicSubstance.assetsBusiness) {
      warnings.push('Business assets are not in UAE. Ensure proper documentation.')
    }

    if (!economicSubstance.relevantIncomeEarned) {
      warnings.push(
        'Relevant income is not earned in UAE. Consider DIFC/ADGM alternatives.'
      )
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Generate ESR certification
   */
  generateCertification(filing: UAEESRFiling): string {
    const compliance = [
      filing.economicSubstance.businessPurpose ? '✓ Business purpose documented' : '',
      filing.economicSubstance.managedExecution ? '✓ Managed in UAE' : '✗ Managed remotely',
      filing.economicSubstance.relevantPeople ? '✓ Relevant people present' : '',
      filing.economicSubstance.assetsBusiness ? '✓ Assets in UAE' : '',
      filing.economicSubstance.relevantIncomeEarned ? '✓ Relevant income earned' : '',
    ]
      .filter((item) => item)
      .join('\n')

    return `
UAE ESR Certification:
${compliance}

Findings: ${filing.findings}
    `.trim()
  }
}

/**
 * UAE Corporate Tax Workflow (Phase 1 implementation - 9% tax for profits > AED 375,000)
 */
export class UAECorporateTaxWorkflow {
  /**
   * Calculate Corporate Tax
   */
  calculateCorporateTax(filing: UAECorporateTaxFiling): TaxCalculations {
    const { taxableIncome, taxableProfit } = filing

    // 9% corporate tax on profits exceeding AED 375,000
    const exemptionThreshold = 375000
    const taxableAmount = Math.max(0, taxableProfit - exemptionThreshold)
    const taxAmount = (taxableAmount * 9) / 100

    return {
      grossIncome: taxableIncome,
      totalDeductions: filing.deductions,
      taxableIncome: taxableProfit,
      taxRate: 9,
      taxAmount: taxAmount,
    }
  }

  /**
   * Validate Corporate Tax filing
   */
  validateCorporateTaxFiling(filing: UAECorporateTaxFiling): ValidationResult {
    const errors: ValidationResult['errors'] = []
    const warnings: string[] = []

    if (filing.taxableIncome < 0) {
      errors.push({
        field: 'taxableIncome',
        message: 'Taxable income cannot be negative',
        severity: 'error',
      })
    }

    if (filing.deductions > filing.taxableIncome) {
      errors.push({
        field: 'deductions',
        message: 'Deductions cannot exceed taxable income',
        severity: 'error',
      })
    }

    if (filing.taxableProfit < 375000) {
      warnings.push('Corporate tax applies only on profits exceeding AED 375,000')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Generate Corporate Tax summary
   */
  generateSummary(filing: UAECorporateTaxFiling, calculations: TaxCalculations): string {
    return `
UAE Corporate Tax Filing Summary:
- Taxable Income: AED ${calculations.grossIncome.toFixed(2)}
- Total Deductions: AED ${calculations.totalDeductions.toFixed(2)}
- Taxable Profit: AED ${calculations.taxableIncome.toFixed(2)}
- Tax Rate: ${calculations.taxRate}%
- Tax Payable: AED ${calculations.taxAmount.toFixed(2)}
    `.trim()
  }
}
