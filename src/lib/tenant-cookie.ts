const COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours

async function getTextEncoder(): Promise<TextEncoder> {
  if (typeof globalThis.TextEncoder !== 'undefined') return new TextEncoder()
  // Node <19 fallback using dynamic import to satisfy ESM lint rules
  const util = await import('util')
  const NodeTextEncoder = (util as any).TextEncoder as typeof TextEncoder
  return new NodeTextEncoder()
}

function toHex(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0')
  return out
}

function fromHex(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) return new Uint8Array()
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16)
  return out
}

async function getSubtleCrypto(): Promise<SubtleCrypto | null> {
  try {
    if (typeof globalThis.crypto !== 'undefined' && (globalThis.crypto as any).subtle) {
      return (globalThis.crypto as any).subtle
    }
  } catch {}

  const proc = (globalThis as any).process
  if (proc?.versions?.node) {
    try {
      // Try node:crypto first (Node.js 16+)
      const nodeCrypto: any = await import('node:crypto')
      const webCrypto = (nodeCrypto as any)?.webcrypto
      if (webCrypto?.subtle) return webCrypto.subtle as SubtleCrypto
    } catch {}

    try {
      // Fallback to crypto
      const nodeCrypto: any = await import('crypto')
      const webCrypto = (nodeCrypto as any)?.webcrypto
      if (webCrypto?.subtle) return webCrypto.subtle as SubtleCrypto
    } catch {}
  }

  return null
}

async function loadNodeCrypto(): Promise<typeof import('crypto') | null> {
  const proc = (globalThis as any).process
  if (!proc?.versions?.node) return null

  try {
    // Try node:crypto first (Node.js 16+)
    return await import('node:crypto') as typeof import('crypto')
  } catch {}

  try {
    // Fallback to crypto
    return await import('crypto') as typeof import('crypto')
  } catch {}

  return null
}

async function hmacSha256(message: string, secret: string): Promise<Uint8Array> {
  const subtle = await getSubtleCrypto()
  const enc = await getTextEncoder()
  const msg = enc.encode(message)
  const keyData = enc.encode(secret)

  if (subtle) {
    const key = await subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const sig = await subtle.sign('HMAC', key, msg)
    return new Uint8Array(sig)
  }

  const nodeCrypto = await loadNodeCrypto()
  if (nodeCrypto?.createHmac) {
    const h = nodeCrypto.createHmac('sha256', secret)
    h.update(message)
    return new Uint8Array(h.digest())
  }

  throw new Error('HMAC computation is not supported in this runtime')
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

export async function signTenantCookie(tenantId: string, userId: string): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET || ''
  const payload = `${tenantId}:${userId}:${Date.now()}`
  const sig = await hmacSha256(payload, secret)
  return `${payload}.${toHex(sig)}`
}

export async function verifyTenantCookie(
  signedCookie: string,
  expectedTenantId?: string | null,
  expectedUserId?: string | null
): Promise<boolean> {
  try {
    if (!signedCookie) return false
    const parts = signedCookie.split('.')
    if (parts.length < 2) return false
    const signatureHex = parts.pop() as string
    const payload = parts.join('.')
    const [tenantId, userId, timestampStr] = payload.split(':')
    if (!tenantId || !timestampStr) return false

    if (expectedTenantId && tenantId !== expectedTenantId) return false
    if (expectedUserId && userId && expectedUserId !== userId) return false

    const secret = process.env.NEXTAUTH_SECRET || ''
    const expectedSig = await hmacSha256(payload, secret)
    const providedSig = fromHex(signatureHex)
    if (!constantTimeEqual(expectedSig, providedSig)) return false

    const ts = Number(timestampStr)
    if (Number.isNaN(ts)) return false
    if (Date.now() - ts > COOKIE_MAX_AGE_MS) return false

    return true
  } catch {
    return false
  }
}
