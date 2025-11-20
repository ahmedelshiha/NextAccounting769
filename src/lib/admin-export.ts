export function buildExportUrl(query: Record<string, string | undefined>): string {
  const params = new URLSearchParams()
  for (const k of Object.keys(query)) {
    const v = (query as any)[k]
    if (v !== undefined && v !== null && String(v) !== '') params.set(k, String(v))
  }
  return `/api/admin/export?${params.toString()}`
}

export function downloadExport(query: Record<string, string | undefined>): void {
  if (typeof window === 'undefined') {
    throw new Error('downloadExport can only be used in the browser')
  }
  const url = buildExportUrl(query)
  // Use location.href so browsers handle large CSVs and auth cookies
  window.location.href = url
}

export async function fetchExportBlob(query: Record<string, string | undefined>): Promise<Blob> {
  const url = buildExportUrl(query)
  const res = await fetch(url)
  if (!res.ok) throw new Error('Export failed')
  return await res.blob()
}
