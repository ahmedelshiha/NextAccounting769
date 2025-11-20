import { z } from 'zod'

/**
 * Document Classification Service
 * Automatically categorizes and tags documents for better organization
 * Detects document types, extracts key information, and flags for anomalies
 */

export const DocumentClassificationSchema = z.object({
  documentId: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.number(),
  classification: z.object({
    category: z.enum([
      'INVOICE', 'RECEIPT', 'BILL', 'PURCHASE_ORDER',
      'CONTRACT', 'AGREEMENT', 'TERMS',
      'FINANCIAL_STATEMENT', 'TAX_RETURN', 'BANK_STATEMENT',
      'PAYROLL', 'TIMESHEET', 'EXPENSE_REPORT',
      'ID_DOCUMENT', 'LICENSE', 'CERTIFICATE', 'REGISTRATION',
      'EMAIL', 'CORRESPONDENCE', 'MEMO',
      'OTHER'
    ]),
    confidence: z.number().min(0).max(1), // 0 to 1 confidence score
    tags: z.array(z.string()),
    description: z.string(),
  }),
  extractedData: z.record(z.string(), z.any()).optional(), // Key-value pairs extracted from document
  anomalies: z.array(z.object({
    type: z.enum(['unusual_amount', 'missing_field', 'format_error', 'date_mismatch', 'duplicate']),
    severity: z.enum(['low', 'medium', 'high']),
    description: z.string(),
  })).optional(),
  linkedEntities: z.array(z.object({
    type: z.enum(['VENDOR', 'CUSTOMER', 'EMPLOYEE', 'ENTITY', 'PROJECT']),
    identifier: z.string(),
    confidence: z.number(),
  })).optional(),
  expiryDate: z.date().optional(),
  requiredReview: z.boolean().default(false),
  classificationMetadata: z.object({
    method: z.enum(['ml_model', 'rule_based', 'manual']).default('rule_based'),
    processedAt: z.date(),
    processingTimeMs: z.number(),
  }),
})

export type DocumentClassification = z.infer<typeof DocumentClassificationSchema>

/**
 * Rule-based classifier for document types (fallback when ML not available)
 */
export function classifyDocumentByRules(
  fileName: string,
  content?: string,
  fileSize?: number
): DocumentClassification['classification'] {
  const nameLower = fileName.toLowerCase()
  const contentLower = content?.toLowerCase() || ''

  // Financial documents
  if (nameLower.includes('invoice') || contentLower.includes('invoice') || nameLower.includes('inv')) {
    return {
      category: 'INVOICE',
      confidence: 0.95,
      tags: ['financial', 'billable', 'vendor'],
      description: 'Invoice document - record of sale or service',
    }
  }

  if (nameLower.includes('receipt') || contentLower.includes('receipt') || nameLower.includes('rcpt')) {
    return {
      category: 'RECEIPT',
      confidence: 0.90,
      tags: ['financial', 'expense', 'proof_of_purchase'],
      description: 'Receipt - proof of payment',
    }
  }

  if (nameLower.includes('bill') || contentLower.includes('bill') || nameLower.includes('exp')) {
    return {
      category: 'BILL',
      confidence: 0.90,
      tags: ['financial', 'payable', 'vendor'],
      description: 'Bill - expense document from vendor',
    }
  }

  if (nameLower.includes('po') || nameLower.includes('purchase order') || contentLower.includes('purchase order')) {
    return {
      category: 'PURCHASE_ORDER',
      confidence: 0.92,
      tags: ['financial', 'order', 'procurement'],
      description: 'Purchase order - request for goods/services',
    }
  }

  // Legal/Contract documents
  if (nameLower.includes('contract') || nameLower.includes('agreement') || contentLower.includes('party agrees')) {
    return {
      category: 'CONTRACT',
      confidence: 0.88,
      tags: ['legal', 'binding', 'terms'],
      description: 'Contract or agreement document',
    }
  }

  // Tax/Accounting
  if (nameLower.includes('tax return') || nameLower.includes('1040') || nameLower.includes('tax_return')) {
    return {
      category: 'TAX_RETURN',
      confidence: 0.93,
      tags: ['tax', 'annual', 'compliance'],
      description: 'Tax return filing',
    }
  }

  if (nameLower.includes('financial statement') || nameLower.includes('p&l') || nameLower.includes('balance sheet')) {
    return {
      category: 'FINANCIAL_STATEMENT',
      confidence: 0.91,
      tags: ['financial', 'accounting', 'reporting'],
      description: 'Financial statement - income statement, balance sheet, or cash flow',
    }
  }

  if (nameLower.includes('bank statement') || nameLower.includes('statement') && nameLower.includes('bank')) {
    return {
      category: 'BANK_STATEMENT',
      confidence: 0.90,
      tags: ['financial', 'bank', 'reconciliation'],
      description: 'Bank statement - monthly account activity',
    }
  }

  // Payroll
  if (nameLower.includes('payroll') || nameLower.includes('w2') || nameLower.includes('1099')) {
    return {
      category: 'PAYROLL',
      confidence: 0.92,
      tags: ['hr', 'payroll', 'employee'],
      description: 'Payroll document - wages and withholding',
    }
  }

  if (nameLower.includes('timesheet') || nameLower.includes('time sheet')) {
    return {
      category: 'TIMESHEET',
      confidence: 0.90,
      tags: ['hr', 'time_tracking', 'payroll'],
      description: 'Employee timesheet',
    }
  }

  // ID/Compliance
  if (nameLower.includes('id') || nameLower.includes('passport') || nameLower.includes('license') && !nameLower.includes('software')) {
    return {
      category: 'ID_DOCUMENT',
      confidence: 0.85,
      tags: ['compliance', 'identity', 'kyc'],
      description: 'Identification document',
    }
  }

  // Certificates
  if (nameLower.includes('certificate') || nameLower.includes('cert') && !nameLower.includes('certifi')) {
    return {
      category: 'CERTIFICATE',
      confidence: 0.88,
      tags: ['compliance', 'certification'],
      description: 'Certificate - qualification or compliance proof',
    }
  }

  // Communications
  if (nameLower.includes('email') || nameLower.endsWith('.eml') || nameLower.endsWith('.msg')) {
    return {
      category: 'EMAIL',
      confidence: 0.95,
      tags: ['communication', 'correspondence'],
      description: 'Email message',
    }
  }

  // Default
  return {
    category: 'OTHER',
    confidence: 0.3,
    tags: [],
    description: 'Unclassified document',
  }
}

/**
 * Extracts key data from different document types
 */
export function extractDocumentData(
  classification: DocumentClassification['classification'],
  content?: string
): Record<string, any> {
  const extracted: Record<string, any> = {}

  if (!content) return extracted

  const lines = content.split('\n')

  // Extract amounts (common pattern for financial docs)
  const amountRegex = /(?:total|amount|balance|sum|cost|price)[\s:$]*([0-9,]+\.?\d{0,2})/gi
  const amounts = content.match(amountRegex) || []
  if (amounts.length > 0) {
    extracted.amounts = amounts
  }

  // Extract dates
  const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{1,2}-\d{1,2})/g
  const dates = content.match(dateRegex) || []
  if (dates.length > 0) {
    extracted.dates = dates
    // For invoices/receipts, first date is usually document date
    if (['INVOICE', 'RECEIPT', 'BILL'].includes(classification.category)) {
      extracted.documentDate = dates[0]
    }
  }

  // Extract email addresses
  const emailRegex = /([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g
  const emails = content.match(emailRegex) || []
  if (emails.length > 0) {
    extracted.emails = [...new Set(emails)] // Unique emails
  }

  // Extract phone numbers
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g
  const phones = content.match(phoneRegex) || []
  if (phones.length > 0) {
    extracted.phoneNumbers = phones
  }

  // Type-specific extraction
  switch (classification.category) {
    case 'INVOICE':
    case 'RECEIPT':
    case 'BILL':
      // Extract vendor/customer names (typically near top)
      const headerLines = lines.slice(0, 10)
      const possibleCompany = headerLines.find(line => line.trim().length > 10 && line.trim().length < 100)
      if (possibleCompany) {
        extracted.vendor = possibleCompany.trim()
      }
      break

    case 'BANK_STATEMENT':
      extracted.statementType = 'bank_statement'
      // Look for account number pattern
      const accountRegex = /account\s*#?\s*:?\s*([0-9]{6,})/i
      const accountMatch = content.match(accountRegex)
      if (accountMatch) {
        extracted.accountNumber = accountMatch[1]
      }
      break

    case 'TAX_RETURN':
      // Extract tax year if available
      const yearRegex = /(?:20\d{2}|tax year|year ended|for the year)/i
      const yearMatch = content.match(yearRegex)
      if (yearMatch) {
        extracted.taxYear = yearMatch[0]
      }
      break
  }

  return extracted
}

/**
 * Detects anomalies in documents
 */
export function detectAnomalies(
  classification: DocumentClassification['classification'],
  extractedData: Record<string, any>,
  fileName: string
): DocumentClassification['anomalies'] {
  const anomalies: DocumentClassification['anomalies'] = []

  // Check for unusually large amounts
  if (extractedData.amounts && extractedData.amounts.length > 0) {
    const amounts = extractedData.amounts.map((a: string) => {
      const match = a.match(/([0-9,]+\.?\d{0,2})/);
      return match ? parseFloat(match[1].replace(/,/g, '')) : 0
    }).filter((a: number) => a > 0)

    if (amounts.length > 0) {
      const maxAmount = Math.max(...amounts)
      // Flag if amount exceeds 50,000 (threshold can be adjusted)
      if (maxAmount > 50000) {
        anomalies.push({
          type: 'unusual_amount',
          severity: 'medium',
          description: `Large amount detected: ${maxAmount}`,
        })
      }
    }
  }

  // Check for missing fields in financial documents
  if (['INVOICE', 'RECEIPT', 'BILL'].includes(classification.category)) {
    if (!extractedData.amounts || extractedData.amounts.length === 0) {
      anomalies.push({
        type: 'missing_field',
        severity: 'high',
        description: 'No amount found in financial document',
      })
    }
    if (!extractedData.vendor) {
      anomalies.push({
        type: 'missing_field',
        severity: 'medium',
        description: 'Vendor/customer information not found',
      })
    }
  }

  // Check for suspicious file names
  if (fileName.includes('test') || fileName.includes('draft') || fileName.includes('temp')) {
    anomalies.push({
      type: 'format_error',
      severity: 'low',
      description: 'File name suggests temporary or draft document',
    })
  }

  return anomalies
}

/**
 * Matches document to entities (vendors, customers, employees)
 */
export function linkDocumentToEntities(
  extractedData: Record<string, any>,
  _knownEntities: Array<{ type: string; identifier: string; names: string[] }> = []
): DocumentClassification['linkedEntities'] {
  const links: DocumentClassification['linkedEntities'] = []

  // For now, basic matching on extracted vendor/customer names
  if (extractedData.vendor) {
    // In production, would match against actual entity database
    links.push({
      type: 'VENDOR',
      identifier: extractedData.vendor,
      confidence: 0.6, // Low confidence for rule-based matching
    })
  }

  return links
}

/**
 * Main classification function
 */
export function classifyDocument(
  fileName: string,
  content?: string,
  fileSize?: number,
  knownEntities?: Array<{ type: string; identifier: string; names: string[] }>
): DocumentClassification {
  const startTime = Date.now()

  // Classify document
  const classification = classifyDocumentByRules(fileName, content, fileSize)

  // Extract data
  const extractedData = extractDocumentData(classification, content)

  // Detect anomalies
  const anomalies = detectAnomalies(classification, extractedData, fileName)

  // Link to entities
  const linkedEntities = linkDocumentToEntities(extractedData, knownEntities)

  // Determine if requires review
  const requiredReview =
    (anomalies && anomalies.some(a => a.severity === 'high')) ||
    classification.confidence < 0.7 ||
    (!linkedEntities || linkedEntities.length === 0)

  // Check for expiry dates in ID documents
  let expiryDate: Date | undefined
  if (['ID_DOCUMENT', 'LICENSE', 'CERTIFICATE'].includes(classification.category)) {
    if (extractedData.dates && extractedData.dates.length > 0) {
      // Last date is often expiry for ID documents
      const lastDate = extractedData.dates[extractedData.dates.length - 1]
      try {
        expiryDate = new Date(lastDate)
      } catch {
        // Date parsing failed, leave undefined
      }
    }
  }

  return {
    documentId: '', // Will be filled by caller
    fileName,
    mimeType: fileName.split('.').pop() || 'unknown',
    fileSize: fileSize || 0,
    classification,
    extractedData,
    anomalies,
    linkedEntities,
    expiryDate,
    requiredReview,
    classificationMetadata: {
      method: 'rule_based',
      processedAt: new Date(),
      processingTimeMs: Date.now() - startTime,
    },
  }
}
