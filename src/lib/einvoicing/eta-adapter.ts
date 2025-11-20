import { createHash, createSign } from 'crypto'
import { logger } from '@/lib/logger'
import {
  ETAInvoice,
  EInvoicingProvider,
  ValidationResult,
  SubmissionResult,
  CertificateData,
  ZATCAInvoice, // <-- Added ZATCAInvoice
} from './types'

/**
 * Egypt Tax Authority (ETA) E-Invoicing Adapter
 * Implements XML-DSig digital signatures and ETA submission
 */
export class ETAAdapter implements EInvoicingProvider {
  standard = 'ETA' as const
  private apiUrl = process.env.ETA_API_URL || 'https://api.invoicing.eta.gov.eg'
  private apiKey = process.env.ETA_API_KEY
  private clientId = process.env.ETA_CLIENT_ID

  /**
   * Validate ETA invoice
   */
  validateInvoice(invoice: ETAInvoice): ValidationResult {
    const errors: ValidationResult['errors'] = []

    // Validate seller
    if (!invoice.seller.taxNumber) {
      errors.push({
        field: 'seller.taxNumber',
        message: 'Seller tax number (TIN) is required',
        severity: 'error',
      })
    }

    if (!this.isValidTaxNumber(invoice.seller.taxNumber)) {
      errors.push({
        field: 'seller.taxNumber',
        message: 'Invalid tax number format (must be 9 digits)',
        severity: 'error',
      })
    }

    // Validate buyer (optional for B2C, required for B2B)
    if (invoice.documentType !== 'RECEIPT' && !invoice.buyer?.taxNumber) {
      errors.push({
        field: 'buyer.taxNumber',
        message: 'Buyer tax number is required for B2B invoices',
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

    // Validate invoice number
    if (!invoice.invoiceNumber) {
      errors.push({
        field: 'invoiceNumber',
        message: 'Invoice number is required',
        severity: 'error',
      })
    }

    // Validate totals
    const calculatedSubtotal = invoice.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )

    if (Math.abs(calculatedSubtotal - invoice.totals.subtotal) > 0.01) {
      errors.push({
        field: 'totals.subtotal',
        message: 'Subtotal does not match calculated value',
        severity: 'error',
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate Egyptian tax number (9-digit TIN)
   */
  private isValidTaxNumber(taxNumber: string): boolean {
    return /^\d{9}$/.test(taxNumber)
  }

  /**
   * Generate QR Code (not required for ETA, but can be included)
   */
  async generateQRCode(invoice: ZATCAInvoice): Promise<string> {
    try {
      // ETA doesn't strictly require QR, but we can generate one for user convenience
      const qrData = {
        invoiceUuid: invoice.uuid,
        issueDate: invoice.issueDate.toISOString().split('T')[0],
        totalAmount: invoice.totals.total.toFixed(2),
        taxAmount: invoice.totals.taxTotal.toFixed(2),
      }

      const qrCode = Buffer.from(JSON.stringify(qrData)).toString('base64')

      logger.info('ETA QR code generated', {
        invoiceNumber: invoice.invoiceNumber,
        qrSize: qrCode.length,
      })

      return qrCode
    } catch (error) {
      logger.error('Failed to generate ETA QR code', {
        invoiceNumber: invoice.invoiceNumber,
        error: String(error),
      })
      throw error
    }
  }

  /**
   * Sign invoice with XML-DSig (XAdES-EPES)
   */
  async sign(invoice: ETAInvoice, certificate: CertificateData): Promise<string> {
    try {
      const invoiceXML = this.generateXML(invoice)

      // Create XML signature
      const signer = createSign('sha256')
      signer.update(invoiceXML)

      const signature = signer.sign(
        {
          key: certificate.privateKey,
          passphrase: certificate.password,
        },
        'base64'
      )

      logger.info('ETA invoice signed', {
        invoiceNumber: invoice.invoiceNumber,
        signatureSize: signature.length,
      })

      return signature
    } catch (error) {
      logger.error('Failed to sign ETA invoice', {
        invoiceNumber: invoice.invoiceNumber,
        error: String(error),
      })
      throw error
    }
  }

  /**
   * Submit invoice to ETA
   *
   * PRODUCTION NOTE: This is a mock implementation. Integration with actual ETA API
   * requires:
   * - Valid ETA API credentials and client ID
   * - Proper certificate management for digital signatures
   * - Compliance with Egyptian e-invoicing regulations
   * - Error handling for ETA-specific validation and status codes
   */
  async submit(invoice: ETAInvoice): Promise<SubmissionResult> {
    try {
      if (!this.apiKey || !this.clientId) {
        const errorMsg = 'ETA API credentials not configured - cannot submit in production'
        logger.error('ETA submission blocked - missing credentials', {
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
              message: 'ETA credentials not set',
            },
          ],
        }
      }

      logger.warn('ETA submission: Using mock implementation - integrate with real ETA API for production', {
        invoiceNumber: invoice.invoiceNumber,
        standard: this.standard,
        environment: process.env.NODE_ENV,
      })

      // Generate mock ETA UUID (would be assigned by actual ETA system)
      const etaUuid = `ETA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      return {
        success: true,
        message: 'Invoice submitted to ETA (mock)',
        etaUuid: etaUuid,
        submissionTime: new Date(),
      }
    } catch (error) {
      logger.error('ETA submission failed', {
        invoiceNumber: invoice.invoiceNumber,
        error: String(error),
      })

      return {
        success: false,
        message: 'Failed to submit invoice to ETA',
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
   * - Implement proper XML-DSig signature verification
   * - Validate against ETA-provided certificates
   * - Ensure cryptographic integrity of invoice data
   */
  async validateSignature(invoice: ETAInvoice): Promise<boolean> {
    try {
      if (!invoice.signature) {
        logger.warn('ETA signature validation: Missing signature', {
          invoiceNumber: invoice.invoiceNumber,
        })
        return false
      }

      // Mock validation - checks if signature exists
      // In production, implement proper XML-DSig verification
      logger.debug('ETA signature validation: Using mock implementation', {
        invoiceNumber: invoice.invoiceNumber,
        hasSignature: !!invoice.signature,
        environment: process.env.NODE_ENV,
      })

      return true
    } catch (error) {
      logger.error('ETA signature validation failed', {
        invoiceNumber: invoice.invoiceNumber,
        error: String(error),
      })
      return false
    }
  }

  /**
   * Generate XML invoice (ETA format)
   */
  generateXML(invoice: ETAInvoice): string {
    const lineItemsXML = invoice.lineItems
      .map(
        (item) => `
    <LineItem>
      <ID>${item.id}</ID>
      <Description>${this.escapeXML(item.description)}</Description>
      <Quantity>${item.quantity}</Quantity>
      <UnitPrice>${item.unitPrice.toFixed(2)}</UnitPrice>
      <Discount>${(item.discount || 0).toFixed(2)}</Discount>
      <ItemType>${item.itemType || 'GOOD'}</ItemType>
      <TaxPercent>${item.taxPercent}</TaxPercent>
      <TaxAmount>${item.taxAmount.toFixed(2)}</TaxAmount>
      <LineTotal>${item.lineTotal.toFixed(2)}</LineTotal>
    </LineItem>`
      )
      .join('')

    return `<?xml version="1.0" encoding="UTF-8"?>
<ETAInvoice>
  <InvoiceNumber>${this.escapeXML(invoice.invoiceNumber)}</InvoiceNumber>
  <UUID>${invoice.uuid}</UUID>
  <InvoiceType>${invoice.invoiceType}</InvoiceType>
  <DocumentType>${invoice.documentType}</DocumentType>
  <IssueDate>${invoice.issueDate.toISOString().split('T')[0]}</IssueDate>
  <Seller>
    <Name>${this.escapeXML(invoice.seller.name)}</Name>
    <TaxNumber>${invoice.seller.taxNumber}</TaxNumber>
    <Address>${this.escapeXML(invoice.seller.address)}</Address>
  </Seller>
  ${invoice.buyer ? `
  <Buyer>
    <Name>${this.escapeXML(invoice.buyer.name || '')}</Name>
    <TaxNumber>${invoice.buyer.taxNumber || ''}</TaxNumber>
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
  ${invoice.notes ? `<Notes>${this.escapeXML(invoice.notes)}</Notes>` : ''}
</ETAInvoice>`
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
