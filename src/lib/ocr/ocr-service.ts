import { Attachment } from '@prisma/client'
import { MockOcrProvider } from './mock-ocr-provider'

export class OcrService {
  private provider: MockOcrProvider

  constructor() {
    this.provider = new MockOcrProvider()
  }

  async processDocument(attachment: Attachment): Promise<any> {
    console.log(`[OcrService] Processing document: ${attachment.id}`)

    // In a real application, you would download the file from the storage provider
    // and pass it to the OCR provider. For this mock, we'll just pass the attachment metadata.
    const ocrResult = await this.provider.analyzeDocument(attachment)

    console.log(
      `[OcrService] Document processed successfully: ${attachment.id}`
    )

    // Here, you would typically save the OCR result to the database,
    // associating it with the attachment. For now, we'll just return it.
    return ocrResult
  }
}
