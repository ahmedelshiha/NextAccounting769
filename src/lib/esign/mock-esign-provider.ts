import { Attachment } from '@prisma/client'
import { randomUUID } from 'crypto'

const signatureRequests: Map<string, any> = new Map()

export class MockESignatureProvider {
  async createSignatureRequest(
    attachment: Attachment,
    signerEmail: string
  ): Promise<any> {
    console.log(
      `[MockESignatureProvider] Creating signature request for: ${attachment.name}`
    )
    await new Promise((resolve) => setTimeout(resolve, 500))

    const requestId = randomUUID()
    const request = {
      id: requestId,
      documentId: attachment.id,
      signerEmail,
      status: 'pending',
      createdAt: new Date().toISOString(),
      url: `https://example.com/sign/${requestId}`,
    }

    signatureRequests.set(requestId, request)
    console.log(
      `[MockESignatureProvider] Signature request created: ${requestId}`
    )
    return request
  }

  async getSignatureRequestStatus(requestId: string): Promise<any> {
    console.log(
      `[MockESignatureProvider] Getting status for request: ${requestId}`
    )
    await new Promise((resolve) => setTimeout(resolve, 200))

    const request = signatureRequests.get(requestId)

    if (!request) {
      throw new Error('Request not found')
    }

    // In a real implementation, you would download the signed document from the e-signature provider.
    // For this mock, we'll just return a dummy PDF buffer.
    return Buffer.from('dummy pdf content')

    // Simulate status changes
    const now = new Date().getTime()
    const createdAt = new Date(request.createdAt).getTime()
    if (now - createdAt > 30000) {
      request.status = 'completed'
    } else if (now - createdAt > 10000) {
      request.status = 'viewed'
    }

    return request
  }

  async cancelSignatureRequest(requestId: string): Promise<void> {
    console.log(
      `[MockESignatureProvider] Cancelling request: ${requestId}`
    )
    await new Promise((resolve) => setTimeout(resolve, 200))

    const request = signatureRequests.get(requestId)

    if (request) {
      request.status = 'cancelled'
    }
  }

  async downloadSignedDocument(requestId: string): Promise<Buffer> {
    console.log(
      `[MockESignatureProvider] Downloading signed document for request: ${requestId}`
    )
    await new Promise((resolve) => setTimeout(resolve, 200))

    const request = signatureRequests.get(requestId)

    if (!request) {
      throw new Error('Request not found')
    }

    // In a real implementation, you would download the signed document from the e-signature provider.
    // For this mock, we'll just return a dummy PDF buffer.
    return Buffer.from('dummy pdf content')
  }
}
