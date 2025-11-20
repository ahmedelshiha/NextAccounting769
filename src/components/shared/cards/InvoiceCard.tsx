'use client'

import React from 'react'
import { Invoice } from '@/types/shared/entities/invoice'
import { usePermissions } from '@/lib/use-permissions'
import { PERMISSIONS } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Mail, Trash2, DollarSign, Calendar, CheckCircle2 } from 'lucide-react'
import { ComponentVariant, CardComponentProps } from '../types'
import { formatDate, formatRelativeTime, formatCurrency } from '@/lib/shared/formatters'

interface InvoiceCardProps extends CardComponentProps<Invoice> {
  /** The invoice to display */
  data: Invoice
  /** Display variant */
  variant?: ComponentVariant
  /** Called when card is clicked */
  onClick?: () => void
  /** Called to download invoice */
  onDownload?: (id: string) => void
  /** Called to send invoice */
  onSend?: (id: string) => void
  /** Called to delete invoice */
  onDelete?: (id: string) => void
  /** Called to initiate payment */
  onPay?: (id: string) => void
  /** Is loading */
  loading?: boolean
  /** Show action buttons */
  showActions?: boolean
}

/**
 * InvoiceCard Component
 *
 * Displays invoice information in a card format.
 * Portal variant: View invoice details, pay online, download
 * Admin variant: Full management including sending and deletion
 * Compact variant: Minimal display for lists
 *
 * @example
 * ```tsx
 * // Portal usage
 * <InvoiceCard invoice={invoice} variant="portal" onPay={handlePay} />
 *
 * // Admin usage
 * <InvoiceCard invoice={invoice} variant="admin" onSend={handleSend} />
 * ```
 */
export default function InvoiceCard({
  data: invoice,
  variant = 'portal',
  onClick,
  onDownload,
  onSend,
  onDelete,
  onPay,
  loading = false,
  showActions = true,
  className = '',
}: InvoiceCardProps) {
  const { has } = usePermissions()
  const canDeleteInvoice = has(PERMISSIONS.INVOICES_DELETE)
  const canSendInvoice = has(PERMISSIONS.INVOICES_SEND)

  if (!invoice) return null

  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    SENT: 'bg-blue-100 text-blue-800',
    VIEWED: 'bg-purple-100 text-purple-800',
    PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    REFUNDED: 'bg-teal-100 text-teal-800',
    OVERDUE: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  }

  const isPaid = invoice.status === 'PAID'
  const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date() && !isPaid

  // Compact variant
  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 transition-colors cursor-pointer ${className}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`Invoice ${invoice.invoiceNumber}`}
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">Invoice {invoice.invoiceNumber}</p>
          <p className="text-xs text-gray-500">
            {formatCurrency(invoice.total || 0, invoice.currency || 'USD')}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <Badge className={statusColors[invoice.status] || 'bg-gray-100 text-gray-800'}>
            {invoice.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>
    )
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDownload && !loading) {
      onDownload(invoice.id)
    }
  }

  const handleSend = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onSend && canSendInvoice && !loading) {
      onSend(invoice.id)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete && canDeleteInvoice && !loading) {
      onDelete(invoice.id)
    }
  }

  const handlePay = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onPay && !loading && !isPaid) {
      onPay(invoice.id)
    }
  }

  const invoiceDate = invoice.invoiceDate ? new Date(invoice.invoiceDate) : null
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null

  return (
    <Card
      className={`overflow-hidden transition-all hover:shadow-md cursor-pointer ${className}`}
      onClick={onClick}
      role="article"
      aria-label={`Invoice ${invoice.invoiceNumber}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg">Invoice {invoice.invoiceNumber}</CardTitle>
            {invoice.client && (
              <CardDescription className="text-sm">
                {invoice.client.name}
              </CardDescription>
            )}
          </div>
          <Badge className={statusColors[invoice.status] || 'bg-gray-100 text-gray-800'}>
            {invoice.status === 'OVERDUE' && <AlertCircle className="h-3 w-3 mr-1" />}
            {invoice.status === 'PAID' && <CheckCircle2 className="h-3 w-3 mr-1" />}
            {invoice.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Amount */}
        <div className="flex items-baseline gap-2 text-2xl font-bold text-gray-900 pt-2 border-t">
          <span>{formatCurrency(invoice.total || 0, invoice.currency || 'USD')}</span>
          {invoice.amountPaid != null && invoice.amountPaid > 0 && (
            <span className="text-sm text-green-600">
              ({formatCurrency(invoice.amountPaid, invoice.currency || 'USD')} paid)
            </span>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {invoiceDate && (
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Issued</p>
                <p className="font-medium">{formatDate(invoiceDate, 'short')}</p>
              </div>
            </div>
          )}
          {dueDate && (
            <div className={`flex items-center gap-2 ${isOverdue ? 'text-red-700' : 'text-gray-700'}`}>
              <Calendar className="h-4 w-4" />
              <div>
                <p className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                  {isOverdue ? 'OVERDUE' : 'Due'}
                </p>
                <p className="font-medium">{formatDate(dueDate, 'short')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Line Items (Summary) */}
        {invoice.lineItems && invoice.lineItems.length > 0 && (
          <div className="pt-2 border-t space-y-1 text-sm">
            <p className="text-xs font-medium text-gray-600">Items ({invoice.lineItems.length})</p>
            {invoice.lineItems.slice(0, 2).map((item, idx) => (
              <div key={idx} className="flex justify-between text-gray-700">
                <span className="truncate">{item.description || `Item ${idx + 1}`}</span>
                <span className="font-medium ml-2">
                  {formatCurrency(item.lineTotal || 0, invoice.currency || 'USD')}
                </span>
              </div>
            ))}
            {invoice.lineItems.length > 2 && (
              <p className="text-xs text-gray-500">+{invoice.lineItems.length - 2} more items</p>
            )}
          </div>
        )}

        {/* Notes (Admin) */}
        {variant === 'admin' && invoice.notes && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-gray-600 mb-1">Notes</p>
            <p className="text-sm text-gray-700 line-clamp-2">{invoice.notes}</p>
          </div>
        )}

        {/* Payment Status */}
        {variant === 'portal' && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Payment Status</span>
              <span
                className={`text-sm font-semibold ${isPaid ? 'text-green-600' : isOverdue ? 'text-red-600' : 'text-gray-600'}`}
              >
                {isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="pt-2 border-t space-y-2">
            {variant === 'admin' ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownload}
                  disabled={loading}
                  className="flex-1"
                  aria-label={`Download invoice ${invoice.invoiceNumber}`}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                {invoice.status !== 'PAID' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSend}
                    disabled={!canSendInvoice || loading}
                    className="flex-1"
                    aria-label={`Send invoice ${invoice.invoiceNumber}`}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Send
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={!canDeleteInvoice || loading || invoice.status === 'PAID'}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  aria-label={`Delete invoice ${invoice.invoiceNumber}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownload}
                  disabled={loading}
                  className="flex-1"
                  aria-label={`Download invoice ${invoice.invoiceNumber}`}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                {!isPaid && (
                  <Button
                    size="sm"
                    onClick={handlePay}
                    disabled={loading}
                    className="flex-1"
                    aria-label={`Pay invoice ${invoice.invoiceNumber}`}
                  >
                    <DollarSign className="h-4 w-4 mr-1" />
                    Pay Now
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {invoice.updatedAt && (
          <div className="text-xs text-gray-500 text-right pt-1">
            Updated {formatRelativeTime(new Date(invoice.updatedAt))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Import Alert icon for type checking
import { AlertCircle } from 'lucide-react'
