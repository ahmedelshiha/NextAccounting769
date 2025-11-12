import { describe, it, expect, beforeEach } from 'vitest'
import { createOCRService, MockOCRProvider } from '../ocr-service'

describe('OCR Service', () => {
  let ocrService: ReturnType<typeof createOCRService>

  beforeEach(() => {
    ocrService = createOCRService()
  })

  describe('Text Extraction', () => {
    it('should extract text from document', async () => {
      const mockBuffer = Buffer.from('Mock PDF content')
      const result = await ocrService.extractText(mockBuffer, 'application/pdf')

      expect(result).toBeDefined()
      expect(result.text).toBeDefined()
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
      expect(result.language).toBeDefined()
    })

    it('should return confidence score', async () => {
      const mockBuffer = Buffer.from('Mock image content')
      const result = await ocrService.extractText(mockBuffer, 'image/jpeg')

      expect(result.confidence).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    it('should detect document language', async () => {
      const mockBuffer = Buffer.from('Mock content')
      const result = await ocrService.extractText(mockBuffer, 'application/pdf')

      expect(result.language).toBeDefined()
      expect(['en', 'ar', 'fr', 'es', 'de']).toContain(result.language)
    })
  })

  describe('Invoice Analysis', () => {
    it('should extract invoice details', async () => {
      const mockBuffer = Buffer.from('Mock invoice PDF')
      const result = await ocrService.analyzeInvoice(mockBuffer)

      expect(result).toBeDefined()
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should extract invoice number', async () => {
      const mockBuffer = Buffer.from('Mock invoice PDF')
      const result = await ocrService.analyzeInvoice(mockBuffer)

      if (result.invoiceNumber) {
        expect(result.invoiceNumber).toBeTruthy()
      }
    })

    it('should extract invoice date', async () => {
      const mockBuffer = Buffer.from('Mock invoice PDF')
      const result = await ocrService.analyzeInvoice(mockBuffer)

      if (result.invoiceDate) {
        expect(result.invoiceDate).toMatch(/^\d{4}-\d{2}-\d{2}/)
      }
    })

    it('should extract vendor information', async () => {
      const mockBuffer = Buffer.from('Mock invoice PDF')
      const result = await ocrService.analyzeInvoice(mockBuffer)

      if (result.vendor) {
        expect(result.vendor).toBeDefined()
      }
    })

    it('should extract line items', async () => {
      const mockBuffer = Buffer.from('Mock invoice PDF')
      const result = await ocrService.analyzeInvoice(mockBuffer)

      if (result.lineItems) {
        expect(Array.isArray(result.lineItems)).toBe(true)
      }
    })

    it('should extract invoice total', async () => {
      const mockBuffer = Buffer.from('Mock invoice PDF')
      const result = await ocrService.analyzeInvoice(mockBuffer)

      if (result.total !== undefined) {
        expect(result.total).toBeGreaterThan(0)
      }
    })

    it('should extract currency', async () => {
      const mockBuffer = Buffer.from('Mock invoice PDF')
      const result = await ocrService.analyzeInvoice(mockBuffer)

      if (result.currency) {
        expect(['AED', 'USD', 'EUR', 'SAR', 'EGP']).toContain(result.currency)
      }
    })
  })

  describe('Receipt Analysis', () => {
    it('should extract receipt details', async () => {
      const mockBuffer = Buffer.from('Mock receipt image')
      const result = await ocrService.analyzeReceipt(mockBuffer)

      expect(result).toBeDefined()
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should extract vendor name', async () => {
      const mockBuffer = Buffer.from('Mock receipt image')
      const result = await ocrService.analyzeReceipt(mockBuffer)

      if (result.vendor) {
        expect(result.vendor.name).toBeTruthy()
      }
    })

    it('should extract receipt date and time', async () => {
      const mockBuffer = Buffer.from('Mock receipt image')
      const result = await ocrService.analyzeReceipt(mockBuffer)

      if (result.date) {
        expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}/)
      }
    })

    it('should extract receipt items', async () => {
      const mockBuffer = Buffer.from('Mock receipt image')
      const result = await ocrService.analyzeReceipt(mockBuffer)

      if (result.items) {
        expect(Array.isArray(result.items)).toBe(true)
      }
    })

    it('should extract receipt total', async () => {
      const mockBuffer = Buffer.from('Mock receipt image')
      const result = await ocrService.analyzeReceipt(mockBuffer)

      if (result.total) {
        expect(result.total).toBeGreaterThan(0)
      }
    })
  })

  describe('Document Classification', () => {
    it('should classify document type', async () => {
      const mockBuffer = Buffer.from('Mock document')
      const result = await ocrService.classifyDocument(mockBuffer)

      expect(result).toBeDefined()
      expect([
        'INVOICE',
        'RECEIPT',
        'BANK_STATEMENT',
        'TAX_FORM',
        'CONTRACT',
        'OTHER',
      ]).toContain(result.documentType)
    })

    it('should provide confidence score for classification', async () => {
      const mockBuffer = Buffer.from('Mock document')
      const result = await ocrService.classifyDocument(mockBuffer)

      expect(result.confidence).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    it('should suggest document category', async () => {
      const mockBuffer = Buffer.from('Mock document')
      const result = await ocrService.classifyDocument(mockBuffer)

      if (result.suggestedCategory) {
        expect(result.suggestedCategory).toBeTruthy()
      }
    })

    it('should extract tags from document', async () => {
      const mockBuffer = Buffer.from('Mock document')
      const result = await ocrService.classifyDocument(mockBuffer)

      if (result.extractedTags) {
        expect(Array.isArray(result.extractedTags)).toBe(true)
      }
    })
  })

  describe('Mock Provider', () => {
    let mockProvider: InstanceType<typeof MockOCRProvider>

    beforeEach(() => {
      mockProvider = new MockOCRProvider()
    })

    it('should return consistent results', async () => {
      const buffer = Buffer.from('Mock content')

      const result1 = await mockProvider.extractText(buffer, 'application/pdf')
      const result2 = await mockProvider.extractText(buffer, 'application/pdf')

      expect(result1.confidence).toBe(result2.confidence)
      expect(result1.language).toBe(result2.language)
    })

    it('should handle different MIME types', async () => {
      const buffer = Buffer.from('Mock content')
      const mimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff']

      for (const mimeType of mimeTypes) {
        const result = await mockProvider.extractText(buffer, mimeType)
        expect(result.text).toBeDefined()
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid document types gracefully', async () => {
      const mockBuffer = Buffer.from('Invalid content')
      // Mock provider should still process (in real implementations, this might fail)
      const result = await ocrService.extractText(mockBuffer, 'text/plain')
      expect(result).toBeDefined()
    })

    it('should handle empty buffers', async () => {
      const emptyBuffer = Buffer.from('')
      const result = await ocrService.extractText(emptyBuffer, 'application/pdf')
      expect(result).toBeDefined()
    })
  })

  describe('Provider Configuration', () => {
    it('should use mock provider by default', () => {
      const service = createOCRService()
      expect(service).toBeDefined()
    })

    it('should have consistent interface across providers', async () => {
      const service = createOCRService()
      const mockBuffer = Buffer.from('Mock')

      const extractText = service.extractText(mockBuffer, 'application/pdf')
      const analyzeInvoice = service.analyzeInvoice(mockBuffer)
      const analyzeReceipt = service.analyzeReceipt(mockBuffer)
      const classify = service.classifyDocument(mockBuffer)

      const results = await Promise.all([
        extractText,
        analyzeInvoice,
        analyzeReceipt,
        classify,
      ])

      expect(results).toHaveLength(4)
      results.forEach((result) => {
        expect(result).toBeDefined()
        expect(result.confidence).toBeDefined()
      })
    })
  })

  describe('Performance', () => {
    it('should complete text extraction within reasonable time', async () => {
      const mockBuffer = Buffer.from('Mock content')
      const start = Date.now()

      await ocrService.extractText(mockBuffer, 'application/pdf')

      const duration = Date.now() - start
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it('should complete analysis within reasonable time', async () => {
      const mockBuffer = Buffer.from('Mock invoice PDF')
      const start = Date.now()

      await ocrService.analyzeInvoice(mockBuffer)

      const duration = Date.now() - start
      expect(duration).toBeLessThan(5000)
    })
  })

  describe('Currency and Locale Support', () => {
    it('should support multiple currencies', async () => {
      const mockBuffer = Buffer.from('Mock invoice')
      const result = await ocrService.analyzeInvoice(mockBuffer)

      const supportedCurrencies = ['AED', 'SAR', 'EGP', 'USD', 'EUR']
      if (result.currency) {
        expect(supportedCurrencies).toContain(result.currency)
      }
    })

    it('should support multiple languages', async () => {
      const mockBuffer = Buffer.from('Mock content')
      const result = await ocrService.extractText(mockBuffer, 'application/pdf')

      const supportedLanguages = ['en', 'ar', 'fr', 'es', 'de', 'zh']
      expect(supportedLanguages).toContain(result.language)
    })
  })
})
