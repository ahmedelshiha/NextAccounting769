import { logger } from '@/lib/logger'
import {
  TaxCalculations,
  EgyptVATFiling,
  EgyptETAFiling,
  ValidationResult,
} from './types'

/**
 * Egypt VAT Workflow
 * - Filing threshold: EGP 500,000 annual turnover
 * - Filing frequency: Monthly
 * - Tax rates: 14%, 10%, or 5% depending on goods/services
 */
export class EgyptVATWorkflow {
  /**
   * Calculate Egypt VAT
   */
  calculateVAT(filing: EgyptVATFiling): TaxCalculations {
    // Assuming standard 14% rate (can be adjusted per item)
    const outputTax = (filing.domesticSales * 14) / 100
    const totalInputTax = filing.inputTaxClaimable
    const netVAT = outputTax - totalInputTax + filing.outputTax

    return {
      grossIncome: filing.domesticSales + filing.exportSales,
      totalDeductions: totalInputTax,
      taxableIncome: filing.domesticSales,
      taxRate: 14,
      taxAmount: Math.max(0, netVAT),
    }
  }

  /**
   * Validate Egypt VAT filing
   */
  validateVATFiling(filing: EgyptVATFiling): ValidationResult {
    const errors: ValidationResult['errors'] = []
    const warnings: string[] = []

    if (filing.domesticSales < 0) {
      errors.push({
        field: 'domesticSales',
        message: 'Domestic sales cannot be negative',
        severity: 'error',
      })
    }

    if (filing.exportSales < 0) {
      errors.push({
        field: 'exportSales',
        message: 'Export sales cannot be negative',
        severity: 'error',
      })
    }

    if (filing.inputTaxClaimable > filing.outputTax) {
      warnings.push('Input tax claim exceeds output tax. Refund may be applicable.')
    }

    const totalTurnover = filing.domesticSales + filing.exportSales

    if (totalTurnover < 500000) {
      warnings.push('Below VAT registration threshold')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Generate VAT summary
   */
  generateSummary(filing: EgyptVATFiling, calculations: TaxCalculations): string {
    return `
Egypt VAT Filing Summary:
- Output Tax (14%): EGP ${filing.outputTax.toFixed(2)}
- Input Tax Claimable: EGP ${filing.inputTaxClaimable.toFixed(2)}
- Net VAT Payable: EGP ${filing.netVATPayable.toFixed(2)}
- Taxable Turnover: EGP ${calculations.grossIncome.toFixed(2)}
    `.trim()
  }
}

/**
 * Egypt E-Tax Authority (ETA) Invoice Filing
 * - Mandatory for e-invoices
 * - Real-time reporting requirement
 */
export class EgyptETAWorkflow {
  /**
   * Validate ETA Invoice
   */
  validateETAInvoice(filing: EgyptETAFiling): ValidationResult {
    const errors: ValidationResult['errors'] = []
    const warnings: string[] = []

    // Validate seller info
    if (!filing.seller.name) {
      errors.push({
        field: 'seller.name',
        message: 'Seller name is required',
        severity: 'error',
      })
    }

    if (!filing.seller.vatNumber) {
      errors.push({
        field: 'seller.vatNumber',
        message: 'Seller VAT number is required',
        severity: 'error',
      })
    }

    // Validate buyer info
    if (!filing.buyer.name) {
      errors.push({
        field: 'buyer.name',
        message: 'Buyer name is required',
        severity: 'error',
      })
    }

    // Validate items
    if (!filing.items || filing.items.length === 0) {
      errors.push({
        field: 'items',
        message: 'At least one item is required',
        severity: 'error',
      })
    }

    for (let i = 0; i < (filing.items?.length || 0); i++) {
      const item = filing.items![i]

      if (!item.description) {
        errors.push({
          field: `items[${i}].description`,
          message: 'Item description is required',
          severity: 'error',
        })
      }

      if (item.quantity <= 0) {
        errors.push({
          field: `items[${i}].quantity`,
          message: 'Quantity must be greater than zero',
          severity: 'error',
        })
      }

      if (item.unitPrice < 0) {
        errors.push({
          field: `items[${i}].unitPrice`,
          message: 'Unit price cannot be negative',
          severity: 'error',
        })
      }
    }

    // Validate dates
    if (
      filing.invoiceDeliveryDate &&
      filing.invoiceDeliveryDate < filing.invoiceIssueDate
    ) {
      errors.push({
        field: 'invoiceDeliveryDate',
        message: 'Delivery date cannot be before issue date',
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
   * Calculate invoice totals
   */
  calculateTotals(filing: EgyptETAFiling): {
    subtotal: number
    totalDiscount: number
    totalTax: number
    total: number
  } {
    const subtotal = filing.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )

    const totalDiscount = filing.items.reduce((sum, item) => sum + (item.discount || 0), 0)

    const totalTax = filing.items.reduce((sum, item) => sum + (item.tax || 0), 0)

    const total = subtotal - totalDiscount + totalTax

    return { subtotal, totalDiscount, totalTax, total }
  }

  /**
   * Generate ETA XML for submission
   */
  generateETAXML(filing: EgyptETAFiling): string {
    const totals = this.calculateTotals(filing)

    const itemsXML = filing.items
      .map(
        (item) => `
    <Item>
      <Description>${this.escapeXML(item.description)}</Description>
      <Quantity>${item.quantity}</Quantity>
      <UnitPrice>${item.unitPrice.toFixed(2)}</UnitPrice>
      <Discount>${(item.discount || 0).toFixed(2)}</Discount>
      <Tax>${(item.tax || 0).toFixed(2)}</Tax>
      <Total>${(item.totalAmount || item.quantity * item.unitPrice - (item.discount || 0) + (item.tax || 0)).toFixed(2)}</Total>
    </Item>`
      )
      .join('')

    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice>
  <InvoiceNumber>${this.escapeXML(filing.invoiceNumber)}</InvoiceNumber>
  <IssueDate>${filing.invoiceIssueDate.toISOString().split('T')[0]}</IssueDate>
  <DeliveryDate>${filing.invoiceDeliveryDate.toISOString().split('T')[0]}</DeliveryDate>
  <Seller>
    <Name>${this.escapeXML(filing.seller.name)}</Name>
    <VATNumber>${filing.seller.vatNumber}</VATNumber>
    <Address>${this.escapeXML(filing.seller.address)}</Address>
  </Seller>
  <Buyer>
    <Name>${this.escapeXML(filing.buyer.name)}</Name>
    <VATNumber>${filing.buyer.vatNumber || ''}</VATNumber>
    <Address>${this.escapeXML(filing.buyer.address)}</Address>
  </Buyer>
  <Items>${itemsXML}
  </Items>
  <Subtotal>${totals.subtotal.toFixed(2)}</Subtotal>
  <TotalDiscount>${totals.totalDiscount.toFixed(2)}</TotalDiscount>
  <TotalTax>${totals.totalTax.toFixed(2)}</TotalTax>
  <Total>${totals.total.toFixed(2)}</Total>
</Invoice>`
  }

  /**
   * Escape XML special characters
   */
  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  /**
   * Generate filing summary
   */
  generateSummary(filing: EgyptETAFiling): string {
    const totals = this.calculateTotals(filing)

    return `
Egypt ETA Invoice Filing Summary:
- Invoice Number: ${filing.invoiceNumber}
- Issue Date: ${filing.invoiceIssueDate.toISOString().split('T')[0]}
- Subtotal: EGP ${totals.subtotal.toFixed(2)}
- Total Discount: EGP ${totals.totalDiscount.toFixed(2)}
- Total Tax: EGP ${totals.totalTax.toFixed(2)}
- Total Amount: EGP ${totals.total.toFixed(2)}
- Items: ${filing.items.length}
    `.trim()
  }
}
