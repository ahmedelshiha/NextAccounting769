import { logger } from '@/lib/logger'
import {
  TaxCalculations,
  KSAVATFiling,
  KSAZakatFiling,
  KSAWHTFiling,
  ValidationResult,
} from './types'

/**
 * KSA VAT Workflow
 * - Filing threshold: SAR 375,000 annual turnover
 * - Filing frequency: Monthly
 * - Tax rate: 15%
 */
export class KSAVATWorkflow {
  /**
   * Calculate KSA VAT
   */
  calculateVAT(filing: KSAVATFiling): TaxCalculations {
    const {
      taxableSalesValueDomestic,
      taxableSalesValueExport,
      inputTaxDomestic,
      inputTaxImport,
    } = filing

    // Output tax on domestic sales only (exports are zero-rated)
    const outputTax = (taxableSalesValueDomestic * 15) / 100

    // Input tax
    const totalInputTax = inputTaxDomestic + inputTaxImport

    // Net VAT
    const netVAT = outputTax - totalInputTax + (filing.adjustments || 0)

    return {
      grossIncome: taxableSalesValueDomestic + taxableSalesValueExport,
      totalDeductions: totalInputTax,
      taxableIncome: taxableSalesValueDomestic,
      taxRate: 15,
      taxAmount: Math.max(0, netVAT),
    }
  }

  /**
   * Validate KSA VAT filing
   */
  validateFiling(filing: KSAVATFiling): ValidationResult {
    const errors: ValidationResult['errors'] = []
    const warnings: string[] = []

    if (filing.taxableSalesValueDomestic < 0) {
      errors.push({
        field: 'taxableSalesValueDomestic',
        message: 'Sales value cannot be negative',
        severity: 'error',
      })
    }

    if (filing.inputTaxDomestic < 0 || filing.inputTaxImport < 0) {
      errors.push({
        field: 'inputTax',
        message: 'Input tax cannot be negative',
        severity: 'error',
      })
    }

    // Check VAT registration
    const totalTurnover =
      filing.taxableSalesValueDomestic + filing.taxableSalesValueExport

    if (totalTurnover < 375000) {
      warnings.push('Below VAT registration threshold')
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
  generateSummary(filing: KSAVATFiling, calculations: TaxCalculations): string {
    return `
KSA VAT Filing Summary:
- Output Tax (15%): SAR ${(filing.netVATPayable + filing.inputTaxDomestic + filing.inputTaxImport).toFixed(2)}
- Input Tax: SAR ${(filing.inputTaxDomestic + filing.inputTaxImport).toFixed(2)}
- Net VAT Payable: SAR ${filing.netVATPayable.toFixed(2)}
- Taxable Turnover: SAR ${calculations.grossIncome.toFixed(2)}
    `.trim()
  }
}

/**
 * KSA Zakat Workflow
 * - Filing frequency: Annually
 * - Zakat rate: 2.5%
 * - Applied to qualifying assets
 */
export class KSAZakatWorkflow {
  /**
   * Calculate Zakat
   */
  calculateZakat(filing: KSAZakatFiling): TaxCalculations {
    const { zakat } = filing
    const zakatAmountDue = zakat.zakatAmountDue

    return {
      grossIncome: zakat.capitalAmount,
      totalDeductions: 0,
      taxableIncome: zakat.zakatBase,
      taxRate: 2.5,
      taxAmount: zakatAmountDue,
    }
  }

  /**
   * Validate Zakat filing
   */
  validateZakatFiling(filing: KSAZakatFiling): ValidationResult {
    const errors: ValidationResult['errors'] = []
    const warnings: string[] = []

    const { zakat } = filing

    if (zakat.capitalAmount < 0) {
      errors.push({
        field: 'capitalAmount',
        message: 'Capital amount cannot be negative',
        severity: 'error',
      })
    }

    if (zakat.zakatBase < 0) {
      errors.push({
        field: 'zakatBase',
        message: 'Zakat base cannot be negative',
        severity: 'error',
      })
    }

    if (zakat.zakatBase < 85000) {
      warnings.push(
        'Zakat base is below the Nisab threshold (approximately SAR 85,000 in gold value)'
      )
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Generate Zakat certificate
   */
  generateCertificate(filing: KSAZakatFiling, calculations: TaxCalculations): string {
    return `
KSA Zakat Certificate:
- Capital Amount: SAR ${calculations.grossIncome.toFixed(2)}
- Zakat Base: SAR ${calculations.taxableIncome.toFixed(2)}
- Zakat Rate: ${calculations.taxRate}%
- Zakat Amount Due: SAR ${calculations.taxAmount.toFixed(2)}
- Nisab Status: ${calculations.taxableIncome >= 85000 ? 'Subject to Zakat' : 'Below Nisab Threshold'}
    `.trim()
  }
}

/**
 * KSA Withholding Tax (WHT) Workflow
 * - Filing frequency: Monthly
 * - Applicable to specific transactions
 */
export class KSAWHTWorkflow {
  /**
   * Calculate WHT
   */
  calculateWHT(filing: KSAWHTFiling): TaxCalculations {
    const totalWHT = filing.whtTransactions.reduce(
      (sum, txn) => sum + txn.whtAmount,
      0
    )

    return {
      grossIncome: filing.totalAmount,
      totalDeductions: 0,
      taxableIncome: filing.totalAmount,
      taxRate: 5, // Average WHT rate
      taxAmount: totalWHT,
    }
  }

  /**
   * Validate WHT filing
   */
  validateWHTFiling(filing: KSAWHTFiling): ValidationResult {
    const errors: ValidationResult['errors'] = []
    const warnings: string[] = []

    for (let i = 0; i < filing.whtTransactions.length; i++) {
      const txn = filing.whtTransactions[i]

      if (!txn.vendorName) {
        errors.push({
          field: `whtTransactions[${i}].vendorName`,
          message: 'Vendor name is required',
          severity: 'error',
        })
      }

      if (txn.amount <= 0) {
        errors.push({
          field: `whtTransactions[${i}].amount`,
          message: 'Amount must be greater than zero',
          severity: 'error',
        })
      }

      if (txn.whtPercentage < 0 || txn.whtPercentage > 100) {
        errors.push({
          field: `whtTransactions[${i}].whtPercentage`,
          message: 'WHT percentage must be between 0 and 100',
          severity: 'error',
        })
      }
    }

    if (filing.whtTransactions.length === 0) {
      warnings.push('No WHT transactions reported')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Generate WHT filing summary
   */
  generateSummary(filing: KSAWHTFiling, calculations: TaxCalculations): string {
    const transactionSummary = filing.whtTransactions
      .map((txn) => `  - ${txn.vendorName}: SAR ${txn.whtAmount.toFixed(2)}`)
      .join('\n')

    return `
KSA WHT Filing Summary:
Transactions:
${transactionSummary}

Total Amount: SAR ${filing.totalAmount.toFixed(2)}
Total WHT: SAR ${filing.totalWHT.toFixed(2)}
    `.trim()
  }
}
