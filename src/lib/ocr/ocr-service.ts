import { logger } from '@/lib/logger'

/**
 * OCR service abstraction for document text extraction and analysis
 * Supports multiple providers: Google Vision, Azure Computer Vision, Tesseract, AWS Textract
 */

export interface OCRProvider {
  extractText(data: Buffer, mimeType: string): Promise<OCRResult>
  analyzeInvoice(data: Buffer): Promise<InvoiceAnalysis>
  analyzeReceipt(data: Buffer): Promise<ReceiptAnalysis>
  classifyDocument(data: Buffer): Promise<DocumentClassification>
}

export interface OCRResult {
  text: string
  confidence: number
  language: string
  rawData?: any
}

export interface InvoiceAnalysis {
  invoiceNumber?: string
  invoiceDate?: string
  dueDate?: string
  vendor?: {
    name?: string
    address?: string
    taxId?: string
  }
  lineItems?: Array<{
    description?: string
    quantity?: number
    unitPrice?: number
    amount?: number
  }>
  subtotal?: number
  tax?: number
  total?: number
  currency?: string
  confidence: number
}

export interface ReceiptAnalysis {
  vendor?: {
    name?: string
    address?: string
  }
  date?: string
  time?: string
  items?: Array<{
    description?: string
    price?: number
  }>
  subtotal?: number
  tax?: number
  total?: number
  currency?: string
  confidence: number
}

export interface DocumentClassification {
  documentType: 'INVOICE' | 'RECEIPT' | 'BANK_STATEMENT' | 'TAX_FORM' | 'CONTRACT' | 'OTHER'
  confidence: number
  suggestedCategory?: string
  extractedTags?: string[]
}

/**
 * Mock OCR Provider - used for development and testing
 */
class MockOCRProvider implements OCRProvider {
  async extractText(data: Buffer, mimeType: string): Promise<OCRResult> {
    // Simulate OCR extraction
    const text = `
      INVOICE NO: INV-2024-001
      Date: February 28, 2024
      
      Bill To:
      Example Business LLC
      123 Main Street
      
      Items:
      - Item 1: $100.00
      - Item 2: $50.00
      
      Total: $150.00
    `

    return {
      text: text.trim(),
      confidence: 0.85,
      language: 'en',
    }
  }

  async analyzeInvoice(data: Buffer): Promise<InvoiceAnalysis> {
    return {
      invoiceNumber: 'INV-2024-001',
      invoiceDate: '2024-02-28',
      dueDate: '2024-03-28',
      vendor: {
        name: 'Example Vendor',
        address: '123 Business St',
        taxId: '12345678',
      },
      lineItems: [
        {
          description: 'Service Item 1',
          quantity: 1,
          unitPrice: 100,
          amount: 100,
        },
      ],
      subtotal: 100,
      tax: 10,
      total: 110,
      currency: 'AED',
      confidence: 0.82,
    }
  }

  async analyzeReceipt(data: Buffer): Promise<ReceiptAnalysis> {
    return {
      vendor: {
        name: 'Retail Store',
        address: '456 Shopping Ave',
      },
      date: '2024-02-28',
      time: '14:30',
      items: [
        { description: 'Item 1', price: 25.5 },
        { description: 'Item 2', price: 15.0 },
      ],
      subtotal: 40.5,
      tax: 2.7,
      total: 43.2,
      currency: 'AED',
      confidence: 0.88,
    }
  }

  async classifyDocument(data: Buffer): Promise<DocumentClassification> {
    return {
      documentType: 'INVOICE',
      confidence: 0.91,
      suggestedCategory: 'Invoices',
      extractedTags: ['invoice', 'vendor-payment', 'business-document'],
    }
  }
}

/**
 * Google Vision OCR Provider (when configured)
 */
class GoogleVisionOCRProvider implements OCRProvider {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async extractText(data: Buffer, mimeType: string): Promise<OCRResult> {
    // TODO: Implement Google Vision API integration
    // https://cloud.google.com/vision/docs/ocr
    throw new Error('Google Vision OCR not yet implemented')
  }

  async analyzeInvoice(data: Buffer): Promise<InvoiceAnalysis> {
    throw new Error('Google Vision OCR not yet implemented')
  }

  async analyzeReceipt(data: Buffer): Promise<ReceiptAnalysis> {
    throw new Error('Google Vision OCR not yet implemented')
  }

  async classifyDocument(data: Buffer): Promise<DocumentClassification> {
    throw new Error('Google Vision OCR not yet implemented')
  }
}

/**
 * Azure Computer Vision Provider (when configured)
 */
class AzureComputerVisionProvider implements OCRProvider {
  private endpoint: string
  private apiKey: string

  constructor(endpoint: string, apiKey: string) {
    this.endpoint = endpoint
    this.apiKey = apiKey
  }

  async extractText(data: Buffer, mimeType: string): Promise<OCRResult> {
    // TODO: Implement Azure Computer Vision API integration
    // https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/
    throw new Error('Azure Computer Vision OCR not yet implemented')
  }

  async analyzeInvoice(data: Buffer): Promise<InvoiceAnalysis> {
    throw new Error('Azure Computer Vision OCR not yet implemented')
  }

  async analyzeReceipt(data: Buffer): Promise<ReceiptAnalysis> {
    throw new Error('Azure Computer Vision OCR not yet implemented')
  }

  async classifyDocument(data: Buffer): Promise<DocumentClassification> {
    throw new Error('Azure Computer Vision OCR not yet implemented')
  }
}

/**
 * AWS Textract Provider (when configured)
 */
class AWSTextractProvider implements OCRProvider {
  private region: string
  private accessKeyId: string
  private secretAccessKey: string

  constructor(region: string, accessKeyId: string, secretAccessKey: string) {
    this.region = region
    this.accessKeyId = accessKeyId
    this.secretAccessKey = secretAccessKey
  }

  async extractText(data: Buffer, mimeType: string): Promise<OCRResult> {
    // TODO: Implement AWS Textract integration
    // https://aws.amazon.com/textract/
    throw new Error('AWS Textract OCR not yet implemented')
  }

  async analyzeInvoice(data: Buffer): Promise<InvoiceAnalysis> {
    throw new Error('AWS Textract OCR not yet implemented')
  }

  async analyzeReceipt(data: Buffer): Promise<ReceiptAnalysis> {
    throw new Error('AWS Textract OCR not yet implemented')
  }

  async classifyDocument(data: Buffer): Promise<DocumentClassification> {
    throw new Error('AWS Textract OCR not yet implemented')
  }
}

/**
 * OCR Service Factory
 */
class OCRService {
  private provider: OCRProvider

  constructor(provider: OCRProvider) {
    this.provider = provider
  }

  async extractText(data: Buffer, mimeType: string): Promise<OCRResult> {
    try {
      logger.info('Starting text extraction', { mimeType, size: data.length })
      const result = await this.provider.extractText(data, mimeType)
      logger.info('Text extraction completed', {
        confidence: result.confidence,
        language: result.language,
        textLength: result.text.length,
      })
      return result
    } catch (error) {
      logger.error('Text extraction failed', { error: String(error) })
      throw error
    }
  }

  async analyzeInvoice(data: Buffer): Promise<InvoiceAnalysis> {
    try {
      logger.info('Starting invoice analysis', { size: data.length })
      const result = await this.provider.analyzeInvoice(data)
      logger.info('Invoice analysis completed', {
        invoiceNumber: result.invoiceNumber,
        total: result.total,
        confidence: result.confidence,
      })
      return result
    } catch (error) {
      logger.error('Invoice analysis failed', { error: String(error) })
      throw error
    }
  }

  async analyzeReceipt(data: Buffer): Promise<ReceiptAnalysis> {
    try {
      logger.info('Starting receipt analysis', { size: data.length })
      const result = await this.provider.analyzeReceipt(data)
      logger.info('Receipt analysis completed', {
        vendor: result.vendor?.name,
        total: result.total,
        confidence: result.confidence,
      })
      return result
    } catch (error) {
      logger.error('Receipt analysis failed', { error: String(error) })
      throw error
    }
  }

  async classifyDocument(data: Buffer): Promise<DocumentClassification> {
    try {
      logger.info('Starting document classification', { size: data.length })
      const result = await this.provider.classifyDocument(data)
      logger.info('Document classification completed', {
        documentType: result.documentType,
        confidence: result.confidence,
        tags: result.extractedTags,
      })
      return result
    } catch (error) {
      logger.error('Document classification failed', { error: String(error) })
      throw error
    }
  }
}

/**
 * Create OCR service with configured provider
 */
export function createOCRService(): OCRService {
  const provider = process.env.OCR_PROVIDER || 'mock'

  let ocrProvider: OCRProvider

  switch (provider.toLowerCase()) {
    case 'google':
      if (!process.env.GOOGLE_VISION_API_KEY) {
        throw new Error('GOOGLE_VISION_API_KEY is required for Google Vision provider')
      }
      ocrProvider = new GoogleVisionOCRProvider(process.env.GOOGLE_VISION_API_KEY)
      break

    case 'azure':
      if (!process.env.AZURE_VISION_ENDPOINT || !process.env.AZURE_VISION_API_KEY) {
        throw new Error(
          'AZURE_VISION_ENDPOINT and AZURE_VISION_API_KEY are required for Azure provider'
        )
      }
      ocrProvider = new AzureComputerVisionProvider(
        process.env.AZURE_VISION_ENDPOINT,
        process.env.AZURE_VISION_API_KEY
      )
      break

    case 'aws':
      if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        throw new Error('AWS credentials are required for AWS Textract provider')
      }
      ocrProvider = new AWSTextractProvider(
        process.env.AWS_REGION,
        process.env.AWS_ACCESS_KEY_ID,
        process.env.AWS_SECRET_ACCESS_KEY
      )
      break

    case 'mock':
    default:
      ocrProvider = new MockOCRProvider()
      break
  }

  return new OCRService(ocrProvider)
}

// Export singleton instance
export const ocrService = createOCRService()
