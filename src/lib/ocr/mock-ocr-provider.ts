import { Attachment } from '@prisma/client'

export class MockOcrProvider {
  async analyzeDocument(attachment: Attachment): Promise<any> {
    console.log(
      `[MockOcrProvider] Analyzing document: ${attachment.id} (${attachment.name})`
    )

    // Simulate a delay to mimic a real OCR process
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // In a real implementation, you would use a third-party OCR service to analyze the document.
    // For this mock, we'll return some dummy data based on the file name.
    const extractedData = this.extractMockData(attachment.name || '')

    console.log(
      `[MockOcrProvider] Analysis complete for document: ${attachment.id}`
    )

    return {
      provider: 'mock',
      extractedData,
    }
  }

  private extractMockData(fileName: string): any {
    if (fileName.toLowerCase().includes('invoice')) {
      return {
        documentType: 'invoice',
        invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`,
        totalAmount: (Math.random() * 1000).toFixed(2),
        vendor: 'Mock Vendor Inc.',
        date: new Date().toISOString().split('T')[0],
      }
    }

    if (fileName.toLowerCase().includes('receipt')) {
      return {
        documentType: 'receipt',
        totalAmount: (Math.random() * 200).toFixed(2),
        store: 'Mock Store',
        date: new Date().toISOString().split('T')[0],
      }
    }

    return {
      documentType: 'other',
      text: 'This is a mock OCR result for a generic document.',
    }
  }
}
