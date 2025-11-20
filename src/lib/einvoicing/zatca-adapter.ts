import { createHash, sign, createSign } from 'crypto'
import { logger } from '@/lib/logger'
import {
  ZATCAInvoice,
  EInvoicingProvider,
  ValidationResult,
  SubmissionResult,
  DigitalSignature,
  ZATCAQRPayload,
  CertificateData,
} from './types'

/**
 * ZATCA E-Invoicing Adapter - Phase 2 Implementation
 * Supports QR code generation and digital signatures
 */
export class ZATCAAdapter implements EInvoicingProvider {
  standard = 'ZATCA' as const
  private apiUrl = process.env.ZATCA_API_URL || 'https://api.zatca.gov.sa'
  private apiSecret = process.env.ZATCA_API_SECRET

  /**
   * Validate ZATCA invoice
   */
  validateInvoice(invoice: ZATCAInvoice): ValidationResult {
    const errors: ValidationResult['errors'] = []

    // Validate seller
    if (!invoice.seller.crNumber) {
      errors.push({
        field: 'seller.crNumber',
        message: 'Commercial Registration number is required',
        severity: 'error',
      })
    }

    if (!invoice.seller.taxId) {
      errors.push({
        field: 'seller.taxId',
        message: 'Tax ID (VAT number) is required',
        severity: 'error',
      })
    }

    // Validate invoice number format
    if (!this.isValidInvoiceNumber(invoice.invoiceNumber)) {
      errors.push({
        field: 'invoiceNumber',
        message: 'Invalid invoice number format',
        severity: 'error',
      })
    }

    // Validate line items
    if (!invoice.lineItems || invoice.lineItems.length === 0) {
      errors.push({
        field: 'lineItems',
        message: 'At least one line item is required',
        severity: 'error',
      })
    }

    // Validate tax totals
    const calculatedTax = invoice.lineItems.reduce((sum, item) => sum + item.taxAmount, 0)
    if (Math.abs(calculatedTax - invoice.totals.taxTotal) > 0.01) {
      errors.push({
        field: 'totals.taxTotal',
        message: 'Tax total does not match calculated value',
        severity: 'error',
      })
    }

    // Validate total amount
    const calculatedTotal =
      invoice.totals.subtotal -
      (invoice.totals.discountTotal || 0) +
      invoice.totals.taxTotal

    if (Math.abs(calculatedTotal - invoice.totals.total) > 0.01) {
      errors.push({
        field: 'totals.total',
        message: 'Total amount does not match calculated value',
        severity: 'error',
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate invoice number format (Saudi format: #### or longer)
   */
  private isValidInvoiceNumber(number: string): boolean {
    return /^\d{4,}$/.test(number)
  }

  /**
   * Generate QR Code (ZATCA requirement)
   *
   * PRODUCTION NOTE: This implementation returns base64-encoded payload.
   * For full compliance, integrate with a QR code library (qrcode, qr-image, etc.)
   * and ensure the QR code follows ZATCA specifications.
   */
  async generateQRCode(invoice: ZATCAInvoice): Promise<string> {
    try {
      const payload: ZATCAQRPayload = {
        sellerName: invoice.seller.name,
        taxId: invoice.seller.taxId,
        invoiceDate: invoice.issueDate,
        invoiceAmount: invoice.totals.total,
        taxAmount: invoice.totals.taxTotal,
        invoiceHash: this.hashInvoice(invoice),
        invoiceSignature: invoice.signature || '',
      }

      // Generate base64 encoded QR payload
      const qrData = this.generateQRData(payload)

      // Generate QR code - currently returns base64 encoded payload
      // Production deployments should use a dedicated QR code library
      const qrCode = Buffer.from(qrData).toString('base64')

      logger.info('ZATCA QR code generated', {
        invoiceNumber: invoice.invoiceNumber,
        qrSize: qrCode.length,
        note: 'Generated QR payload - implement with QR library for production'
      })

      return qrCode
    } catch (error) {
      logger.error('Failed to generate ZATCA QR code', {
        invoiceNumber: invoice.invoiceNumber,
        error: String(error),
      })
      throw error
    }
  }

  /**
   * Generate QR data structure
   */
  private generateQRData(payload: ZATCAQRPayload): string {
    const qrData = {
      '1': payload.sellerName,
      '2': payload.taxId,
      '3': payload.invoiceDate.toISOString().split('T')[0],
      '4': payload.invoiceAmount.toFixed(2),
      '5': payload.taxAmount.toFixed(2),
      '6': payload.invoiceHash,
      '7': payload.invoiceSignature,
    }

    return JSON.stringify(qrData)
  }

  /**
   * Hash invoice for integrity verification
   */
  hashInvoice(invoice: ZATCAInvoice): string {
    const invoiceString = JSON.stringify({
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate.toISOString(),
      seller: invoice.seller,
      buyer: invoice.buyer,
      lineItems: invoice.lineItems,
      totals: invoice.totals,
    })

    return createHash('sha256').update(invoiceString).digest('hex')
  }

  /**
   * Sign invoice with digital certificate
   */
  async sign(
    invoice: ZATCAInvoice,
    certificate: CertificateData
  ): Promise<string> {
    try {
      const invoiceXML = this.generateXML(invoice)

      // Create signature
      const signer = createSign('sha256')
      signer.update(invoiceXML)

      // Sign with private key
      const signature = signer.sign(
        {
          key: certificate.privateKey,
          passphrase: certificate.password,
        },
        'base64'
      )

      logger.info('ZATCA invoice signed', {
        invoiceNumber: invoice.invoiceNumber,
        signatureSize: signature.length,
      })

      return signature
    } catch (error) {
      logger.error('Failed to sign ZATCA invoice', {
        invoiceNumber: invoice.invoiceNumber,
        error: String(error),
      })
      throw error
    }
  }

  /**
   * Submit invoice to ZATCA
   *
   * PRODUCTION NOTE: This is a mock implementation. Integration with actual ZATCA API
   * requires:
   * - Valid ZATCA client credentials and API secret
   * - Proper certificate management and digital signing
   * - Error handling for ZATCA-specific status codes
   * - Compliance with ZATCA Phase 2 specifications
   */
  async submit(invoice: ZATCAInvoice): Promise<SubmissionResult> {
    try {
      if (!this.apiSecret) {
        const errorMsg = 'ZATCA API secret not configured - cannot submit in production'
        logger.error('ZATCA submission blocked - missing credentials', {
          invoiceNumber: invoice.invoiceNumber,
          environment: process.env.NODE_ENV,
        })

        // In production, fail loudly
        if (process.env.NODE_ENV === 'production') {
          throw new Error(errorMsg)
        }

        return {
          success: false,
          message: errorMsg,
          errors: [
            {
              code: 'CONFIG_ERROR',
              message: 'ZATCA credentials not set',
            },
          ],
        }
      }

      logger.warn('ZATCA submission: Using mock implementation - integrate with real ZATCA API for production', {
        invoiceNumber: invoice.invoiceNumber,
        standard: this.standard,
        environment: process.env.NODE_ENV,
      })

      // Mock response - will be replaced with actual API call
      return {
        success: true,
        message: 'Invoice submitted to ZATCA (mock)',
        referenceNumber: `ZATCA-${Date.now()}`,
        submissionTime: new Date(),
      }
    } catch (error) {
      logger.error('ZATCA submission failed', {
        invoiceNumber: invoice.invoiceNumber,
        error: String(error),
      })

      return {
        success: false,
        message: 'Failed to submit invoice to ZATCA',
        errors: [
          {
            code: 'SUBMISSION_ERROR',
            message: String(error),
          },
        ],
      }
    }
  }

  /**
   * Validate signature
   *
   * PRODUCTION NOTE: This is a mock implementation. For production:
   * - Implement proper signature verification against ZATCA certificates
   * - Validate cryptographic signatures using public key infrastructure
   * - Ensure compliance with Saudi Arabia e-invoicing standards
   */
  async validateSignature(invoice: ZATCAInvoice): Promise<boolean> {
    try {
      if (!invoice.signature) {
        logger.warn('ZATCA signature validation: Missing signature', {
          invoiceNumber: invoice.invoiceNumber,
        })
        return false
      }

      // Mock validation - checks if signature exists
      // In production, implement proper certificate-based verification
      logger.debug('ZATCA signature validation: Using mock implementation', {
        invoiceNumber: invoice.invoiceNumber,
        hasSignature: !!invoice.signature,
        environment: process.env.NODE_ENV,
      })

      return true
    } catch (error) {
      logger.error('ZATCA signature validation failed', {
        invoiceNumber: invoice.invoiceNumber,
        error: String(error),
      })
      return false
    }
  }

  /**
   * Generate XML invoice
   */
  generateXML(invoice: ZATCAInvoice): string {
    const lineItemsXML = invoice.lineItems
      .map(
        (item) => `
    <LineItem>
      <ID>${item.id}</ID>
      <Description>${this.escapeXML(item.description)}</Description>
      <Quantity>${item.quantity}</Quantity>
      <UnitPrice>${item.unitPrice.toFixed(2)}</UnitPrice>
      <Discount>${(item.discount || 0).toFixed(2)}</Discount>
      <TaxPercent>${item.taxPercent}</TaxPercent>
      <TaxAmount>${item.taxAmount.toFixed(2)}</TaxAmount>
      <LineTotal>${item.lineTotal.toFixed(2)}</LineTotal>
    </LineItem>`
      )
      .join('')

    return `<?xml version="1.0" encoding="UTF-8"?>
<ZATCAInvoice>
  <InvoiceNumber>${this.escapeXML(invoice.invoiceNumber)}</InvoiceNumber>
  <UUID>${invoice.uuid}</UUID>
  <InvoiceType>${invoice.invoiceType}</InvoiceType>
  <IssueDate>${invoice.issueDate.toISOString().split('T')[0]}</IssueDate>
  <Seller>
    <Name>${this.escapeXML(invoice.seller.name)}</Name>
    <CRNumber>${invoice.seller.crNumber}</CRNumber>
    <TaxID>${invoice.seller.taxId}</TaxID>
    <Address>${this.escapeXML(invoice.seller.address)}</Address>
  </Seller>
  ${invoice.buyer ? `
  <Buyer>
    <Name>${this.escapeXML(invoice.buyer.name || '')}</Name>
    <TaxID>${invoice.buyer.taxId || ''}</TaxID>
    <Address>${this.escapeXML(invoice.buyer.address || '')}</Address>
  </Buyer>` : ''}
  <LineItems>${lineItemsXML}
  </LineItems>
  <Totals>
    <Subtotal>${invoice.totals.subtotal.toFixed(2)}</Subtotal>
    <DiscountTotal>${(invoice.totals.discountTotal || 0).toFixed(2)}</DiscountTotal>
    <TaxTotal>${invoice.totals.taxTotal.toFixed(2)}</TaxTotal>
    <Total>${invoice.totals.total.toFixed(2)}</Total>
  </Totals>
</ZATCAInvoice>`
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
}
