import { Attachment } from '@prisma/client'
import { MockESignatureProvider } from './mock-esign-provider'

export class ESignatureService {
  private provider: MockESignatureProvider

  constructor() {
    this.provider = new MockESignatureProvider()
  }

  async createSignatureRequest(
    attachment: Attachment,
    signerEmail: string
  ): Promise<any> {
    console.log(
      `[ESignatureService] Creating signature request for document: ${attachment.id}`
    )

    const signatureRequest = await this.provider.createSignatureRequest(
      attachment,
      signerEmail
    )

    console.log(
      `[ESignatureService] Signature request created successfully: ${signatureRequest.id}`
    )

    // In a real application, you would save the signature request to the database.
    return signatureRequest
  }

  async getSignatureRequestStatus(requestId: string): Promise<any> {
    console.log(
      `[ESignatureService] Getting status for signature request: ${requestId}`
    )
    return this.provider.getSignatureRequestStatus(requestId)
  }

  async cancelSignatureRequest(requestId: string): Promise<void> {
    console.log(
      `[ESignatureService] Cancelling signature request: ${requestId}`
    )
    return this.provider.cancelSignatureRequest(requestId)
  }

  async downloadSignedDocument(requestId: string): Promise<Buffer> {
    console.log(
      `[ESignatureService] Downloading signed document for request: ${requestId}`
    )
    return this.provider.downloadSignedDocument(requestId)
  }
}
