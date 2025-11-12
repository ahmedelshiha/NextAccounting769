/**
 * E-Invoicing Types and Interfaces
 * Support for ZATCA (KSA) and ETA (Egypt)
 */

export type EInvoicingStandard = 'ZATCA' | 'ETA'
export type InvoiceType = 'STANDARD' | 'SIMPLIFIED' | 'DEBIT_NOTE' | 'CREDIT_NOTE'
export type InvoiceStatus = 'DRAFT' | 'SIGNED' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED'

/**
 * ZATCA (Saudi Arabia - Zakat, Tax and Customs Authority)
 * Phase 2 Implementation - Full e-invoicing with QR code and digital signature
 */
export interface ZATCAInvoice {
  id: string
  uuid: string // Universally Unique Identifier
  invoiceNumber: string
  invoiceType: InvoiceType
  issueDate: Date
  dueDate?: Date
  
  seller: {
    name: string
    crNumber: string // Commercial Registration number
    taxId: string // VAT Registration number
    address: string
    buildingNumber?: string
    streetName?: string
    cityName?: string
    postalCode?: string
    province?: string
  }
  
  buyer?: {
    name?: string
    crNumber?: string
    taxId?: string
    address?: string
    buildingNumber?: string
    streetName?: string
    cityName?: string
    postalCode?: string
    province?: string
  }
  
  lineItems: Array<{
    id: string
    description: string
    quantity: number
    unitPrice: number
    discount?: number
    taxPercent: number // 15% standard
    taxAmount: number
    lineTotal: number
  }>
  
  totals: {
    subtotal: number
    discountTotal: number
    taxTotal: number
    total: number
  }
  
  paymentTerms?: {
    method: 'CASH' | 'CREDIT_CARD' | 'BANK_TRANSFER' | 'CHEQUE'
    daysUntilDue?: number
  }
  
  status: InvoiceStatus
  qrCode?: string // Base64 encoded QR code
  signature?: string // Digital signature
  certificationUrl?: string // Link to ZATCA certification
  
  metadata?: {
    prevInvoiceHash?: string
    iccId?: string // Interactive Components - for amended invoices
    lineItemCount?: number
  }
  
  createdAt: Date
  submittedAt?: Date
}

/**
 * ETA (Egypt - Tax Authority)
 * E-Invoice and E-Receipt System Implementation
 */
export interface ETAInvoice {
  id: string
  uuid: string
  invoiceNumber: string
  invoiceType: InvoiceType
  documentType: 'INVOICE' | 'DEBIT_NOTE' | 'CREDIT_NOTE' | 'RECEIPT'
  issueDate: Date
  dueDate?: Date
  
  seller: {
    name: string
    taxNumber: string // 9-digit Tax Identification Number
    address: string
    building?: string
    floor?: string
    street?: string
    city?: string
    governorate?: string
    postalCode?: string
    activity?: string
  }
  
  buyer?: {
    name?: string
    taxNumber?: string // Optional for B2C
    address?: string
    building?: string
    floor?: string
    street?: string
    city?: string
    governorate?: string
    postalCode?: string
    identityNumber?: string // National ID or Passport for B2C
  }
  
  lineItems: Array<{
    id: string
    description: string
    itemCode?: string
    quantity: number
    unitPrice: number
    discount?: number
    itemType?: 'GOOD' | 'SERVICE'
    taxType?: 'VAT' | 'STAMP_TAX' | 'OTHER'
    taxPercent: number // Usually 14% for Egypt
    taxAmount: number
    lineTotal: number
  }>
  
  totals: {
    subtotal: number
    discountTotal: number
    taxTotal: number
    total: number
    totalInWords?: string
  }
  
  paymentTerms?: {
    method: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER'
    details?: string
  }
  
  status: InvoiceStatus
  signature?: string // Digital signature (XML-DSig)
  encryptionMethod?: string // Encryption algorithm used
  etaUuid?: string // UUID assigned by ETA system
  etaResponseCode?: string // ETA submission response code
  
  notes?: string
  internalNotes?: string
  
  createdAt: Date
  submittedAt?: Date
}

/**
 * Digital Signature Details
 */
export interface DigitalSignature {
  algorithm: 'SHA256_RSA' | 'SHA256_ECDSA'
  certificateSerial: string
  issuerName: string
  signingTime: Date
  signatureValue: string // Base64 encoded signature
  certificateThumbprint: string
}

/**
 * QR Code Payload (ZATCA)
 */
export interface ZATCAQRPayload {
  sellerName: string
  taxId: string
  invoiceDate: Date
  invoiceAmount: number
  taxAmount: number
  invoiceHash: string // SHA-256 of invoice
  invoiceSignature: string
}

/**
 * E-Invoicing Integration Interface
 */
export interface EInvoicingProvider {
  standard: EInvoicingStandard
  validateInvoice(invoice: ZATCAInvoice | ETAInvoice): ValidationResult
  generateQRCode(invoice: ZATCAInvoice): Promise<string>
  sign(invoice: ZATCAInvoice | ETAInvoice, certificate: CertificateData): Promise<string>
  submit(invoice: ZATCAInvoice | ETAInvoice): Promise<SubmissionResult>
  validateSignature(invoice: ZATCAInvoice | ETAInvoice): Promise<boolean>
  generateXML(invoice: ZATCAInvoice | ETAInvoice): string
}

/**
 * Certificate Management
 */
export interface CertificateData {
  privateKey: string // PEM format
  certificate: string // PEM format
  chain?: string[] // Certificate chain
  password?: string
  algorithm: 'SHA256_RSA' | 'SHA256_ECDSA'
}

/**
 * Validation Result
 */
export interface ValidationResult {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
    severity: 'error' | 'warning'
  }>
}

/**
 * Submission Result
 */
export interface SubmissionResult {
  success: boolean
  message: string
  referenceNumber?: string // ZATCA or ETA reference
  etaUuid?: string // ETA-assigned UUID
  submissionTime?: Date
  errors?: Array<{
    code: string
    message: string
  }>
}

/**
 * Hash Chain (for invoice continuity)
 */
export interface HashChainEntry {
  invoiceId: string
  invoiceHash: string
  previousHash: string
  timestamp: Date
  status: 'valid' | 'broken'
}
