// This is a mock upload provider for demonstration purposes.
// In a real application, this would be replaced with a proper storage provider like S3, Google Cloud Storage, or a similar service.

export const UPLOAD_PROVIDER = 'mock'

export async function uploadFile(
  fileBuffer: Buffer,
  key: string,
  contentType: string
): Promise<{ url: string }> {
  // In a real implementation, you would upload the file to your storage provider here.
  // For this mock, we'll just log the action and return a dummy URL.
  console.log(
    `[MockUploadProvider] Uploading file: ${key} (${contentType}, ${fileBuffer.length} bytes)`
  )

  // Simulate a delay to mimic a real upload
  await new Promise((resolve) => setTimeout(resolve, 500))

  const url = `/mock-uploads/${key}`

  console.log(`[MockUploadProvider] File available at: ${url}`)

  return { url }
}

export async function deleteFile(key: string): Promise<void> {
  console.log(`[MockUploadProvider] Deleting file: ${key}`)
  await new Promise((resolve) => setTimeout(resolve, 200))
  console.log(`[MockUploadProvider] File deleted: ${key}`)
}
