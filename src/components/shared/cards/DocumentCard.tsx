'use client'

import React from 'react'
import { Document } from '@/types/shared/entities/document'
import { usePermissions } from '@/lib/use-permissions'
import { PERMISSIONS } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Download,
  Trash2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Star,
} from 'lucide-react'
import { ComponentVariant, CardComponentProps } from '../types'
import { formatDate, formatFileSize, formatRelativeTime } from '@/lib/shared/formatters'

interface DocumentCardProps extends CardComponentProps<Document> {
  /** The document to display */
  data: Document
  /** Display variant */
  variant?: ComponentVariant
  /** Called when card is clicked */
  onClick?: () => void
  /** Called to download document */
  onDownload?: (id: string) => void
  /** Called to delete document */
  onDelete?: (id: string) => void
  /** Called to star/favorite document */
  onStar?: (id: string, starred: boolean) => void
  /** Is loading */
  loading?: boolean
  /** Show action buttons */
  showActions?: boolean
  /** Is starred */
  starred?: boolean
}

/**
 * DocumentCard Component
 *
 * Displays document information in a card format.
 * Portal variant: Download, star, view metadata
 * Admin variant: Full management including deletion
 * Compact variant: Minimal display for lists
 *
 * @example
 * ```tsx
 * // Portal usage
 * <DocumentCard document={doc} variant="portal" onDownload={handleDownload} />
 *
 * // Admin usage
 * <DocumentCard document={doc} variant="admin" onDelete={handleDelete} />
 * ```
 */
export default function DocumentCard({
  data: document,
  variant = 'portal',
  onClick,
  onDownload,
  onDelete,
  onStar,
  loading = false,
  showActions = true,
  starred = false,
  className = '',
}: DocumentCardProps) {
  const { has } = usePermissions()
  const canDeleteDocument = has(PERMISSIONS.DOCUMENTS_DELETE)
  const canViewDocument = has(PERMISSIONS.DOCUMENTS_READ)

  if (!document || !canViewDocument) return null

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    SCANNING: 'bg-blue-100 text-blue-800',
    SCANNED: 'bg-blue-50 text-blue-700',
    CLEAN: 'bg-green-100 text-green-800',
    INFECTED: 'bg-red-100 text-red-800',
    ERROR: 'bg-orange-100 text-orange-800',
    ARCHIVED: 'bg-gray-100 text-gray-800',
  }

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <FileText className="h-6 w-6" />
    if (mimeType.includes('pdf')) return <FileText className="h-6 w-6 text-red-600" />
    if (mimeType.includes('image')) return <FileText className="h-6 w-6 text-blue-600" />
    if (mimeType.includes('video')) return <FileText className="h-6 w-6 text-purple-600" />
    return <FileText className="h-6 w-6" />
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDownload && !loading && document.status !== 'INFECTED' && document.status !== 'ERROR') {
      onDownload(document.id)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete && canDeleteDocument && !loading) {
      onDelete(document.id)
    }
  }

  const handleStar = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onStar && !loading) {
      onStar(document.id, !starred)
    }
  }

  const uploadedDate = document.uploadedAt ? new Date(document.uploadedAt) : null

  // Compact variant
  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 transition-colors cursor-pointer ${className}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`Document: ${document.filename}`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="text-gray-400 flex-shrink-0">{getFileIcon(document.mimeType)}</div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{document.filename}</p>
            <p className="text-xs text-gray-500">{formatFileSize(document.size || 0)}</p>
          </div>
        </div>
        <Badge className={statusColors[document.status] || 'bg-gray-100 text-gray-800'}>
          {document.status}
        </Badge>
      </div>
    )
  }

  return (
    <Card
      className={`overflow-hidden transition-all hover:shadow-md cursor-pointer ${className}`}
      onClick={onClick}
      role="article"
      aria-label={`Document: ${document.filename}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="text-gray-400 flex-shrink-0 pt-1">
              {getFileIcon(document.mimeType)}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{document.filename}</CardTitle>
              <CardDescription className="text-xs">
                {formatFileSize(document.size || 0)}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {starred && (
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" aria-label="Starred" />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Status Section */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Badge className={statusColors[document.status] || 'bg-gray-100 text-gray-800'}>
              {document.status === 'SCANNING' && <span className="mr-1">Scanning...</span>}
              {document.status === 'SCANNED' && (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              )}
              {document.status === 'CLEAN' && (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              )}
              {(document.status === 'INFECTED' || document.status === 'ERROR') && (
                <AlertCircle className="h-3 w-3 mr-1" />
              )}
              {document.status}
            </Badge>
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-2 text-sm text-gray-600">
          {document.uploader && (
            <div>
              <p className="text-xs font-medium text-gray-500">Uploaded by</p>
              <p>{document.uploader.name || 'Unknown'}</p>
            </div>
          )}
          {uploadedDate && (
            <div>
              <p className="text-xs font-medium text-gray-500">Uploaded</p>
              <p>
                {formatDate(uploadedDate, 'long')} ({formatRelativeTime(uploadedDate)})
              </p>
            </div>
          )}
          {document.category && (
            <div>
              <p className="text-xs font-medium text-gray-500">Category</p>
              <p>{document.category}</p>
            </div>
          )}
          {document.description && (
            <div>
              <p className="text-xs font-medium text-gray-500">Description</p>
              <p className="line-clamp-2">{document.description}</p>
            </div>
          )}
        </div>

        {/* Admin Info */}
        {variant === 'admin' && (
          <div className="pt-2 border-t space-y-2 text-sm text-gray-600">
            {document.scannerResult && (
              <div>
                <p className="text-xs font-medium text-gray-500">Scan Result</p>
                <p>{document.scannerResult}</p>
              </div>
            )}
            {document.mimeType && (
              <div>
                <p className="text-xs font-medium text-gray-500">File Type</p>
                <p>{document.mimeType}</p>
              </div>
            )}
            {document.version != null && (
              <div>
                <p className="text-xs font-medium text-gray-500">Version</p>
                <p>v{document.version}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="pt-2 border-t flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              disabled={loading || document.status === 'INFECTED' || document.status === 'ERROR'}
              className="flex-1"
              aria-label={`Download ${document.filename}`}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            {variant === 'portal' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleStar}
                disabled={loading}
                className="px-2"
                aria-label={starred ? 'Unstar document' : 'Star document'}
              >
                <Star
                  className={`h-4 w-4 ${starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`}
                />
              </Button>
            )}
            {variant === 'admin' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                disabled={!canDeleteDocument || loading}
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                aria-label={`Delete ${document.filename}`}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
