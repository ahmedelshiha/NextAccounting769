'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CreditCard, Plus, Eye, EyeOff, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface PaymentMethod {
  id: string
  type: 'card' | 'bank'
  lastDigits: string
  brand: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
  createdAt: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  currency: string
  status: 'paid' | 'pending' | 'overdue'
  dueDate: string
  description: string
}

export function WalletSection() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [balance, setBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/wallet')
        if (!response.ok) throw new Error('Failed to fetch wallet data')
        const data = await response.json()
        setPaymentMethods(data.paymentMethods || [])
        setInvoices(data.invoices || [])
        setBalance(data.balance || 0)
      } catch (error) {
        toast.error('Failed to load wallet data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchWalletData()
  }, [])

  const toggleCardVisibility = (cardId: string) => {
    setVisibleCards((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) {
        next.delete(cardId)
      } else {
        next.add(cardId)
      }
      return next
    })
  }

  const handleSetDefault = async (methodId: string) => {
    try {
      const response = await fetch(`/api/wallet/payment-methods/${methodId}/set-default`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to set default')
      setPaymentMethods((prev) =>
        prev.map((m) => ({ ...m, isDefault: m.id === methodId }))
      )
      toast.success('Default payment method updated')
    } catch (error) {
      toast.error('Failed to update default payment method')
    }
  }

  const handleDeletePaymentMethod = async (methodId: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return
    try {
      const response = await fetch(`/api/wallet/payment-methods/${methodId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete')
      setPaymentMethods((prev) => prev.filter((m) => m.id !== methodId))
      toast.success('Payment method deleted')
    } catch (error) {
      toast.error('Failed to delete payment method')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-blue-200 dark:border-blue-700">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">Account Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-blue-900 dark:text-blue-100">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(balance)}
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">Available for payments</p>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your payment cards and accounts</CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setShowAddPayment(!showAddPayment)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Payment
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAddPayment && (
            <div className="p-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 dark:bg-blue-900 dark:border-blue-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Add a new credit card, debit card, or bank account
              </p>
              <Button className="w-full">Complete Payment Setup</Button>
            </div>
          )}

          {paymentMethods.length === 0 ? (
            <div className="py-8 text-center">
              <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No payment methods added yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {method.brand} ending in {method.lastDigits}
                          </p>
                          {method.isDefault && (
                            <Badge variant="outline" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        {method.expiryMonth && method.expiryYear && (
                          <p className="text-xs text-gray-500">
                            Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Added {new Date(method.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!method.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(method.id)}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleCardVisibility(method.id)}
                      >
                        {visibleCards.has(method.id) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900"
                        onClick={() => handleDeletePaymentMethod(method.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>Your firm invoices and billing history</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-6">No invoices yet</p>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <div className="flex-1">
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Due {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: invoice.currency,
                      }).format(invoice.amount)}
                    </p>
                    <Badge
                      variant={
                        invoice.status === 'paid'
                          ? 'outline'
                          : invoice.status === 'overdue'
                            ? 'destructive'
                            : 'secondary'
                      }
                      className="text-xs mt-1"
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
