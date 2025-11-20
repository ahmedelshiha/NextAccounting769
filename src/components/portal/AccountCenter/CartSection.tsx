'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Trash2, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'

interface CartItem {
  id: string
  serviceId: string
  serviceName: string
  description: string
  price: number
  quantity: number
  currency: string
}

export function CartSection() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [subtotal, setSubtotal] = useState(0)
  const [tax, setTax] = useState(0)
  const [promoCode, setPromoCode] = useState('')
  const [discount, setDiscount] = useState(0)

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/cart')
        if (!response.ok) throw new Error('Failed to fetch cart')
        const data = await response.json()
        setCartItems(data.items || [])
        setSubtotal(data.subtotal || 0)
        setTax(data.tax || 0)
        setDiscount(data.discount || 0)
      } catch (error) {
        toast.error('Failed to load cart')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCart()
  }, [])

  const handleRemoveItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to remove item')
      setCartItems((prev) => prev.filter((item) => item.id !== itemId))
      toast.success('Item removed from cart')
    } catch (error) {
      toast.error('Failed to remove item')
    }
  }

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code')
      return
    }
    try {
      const response = await fetch('/api/cart/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode }),
      })
      if (!response.ok) throw new Error('Invalid promo code')
      const data = await response.json()
      setDiscount(data.discount || 0)
      toast.success('Promo code applied')
    } catch (error) {
      toast.error('Invalid or expired promo code')
    }
  }

  const handleCheckout = async () => {
    try {
      setIsProcessing(true)
      const response = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartItems, promoCode }),
      })
      if (!response.ok) throw new Error('Checkout failed')
      const data = await response.json()
      window.location.href = data.redirectUrl
    } catch (error) {
      toast.error('Failed to process checkout')
      setIsProcessing(false)
    }
  }

  const total = subtotal + tax - discount

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart
          </CardTitle>
          <CardDescription>
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {cartItems.length === 0 ? (
            <div className="py-8 text-center">
              <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">Your cart is empty</p>
              <Button asChild variant="outline">
                <a href="/portal/services">Browse Services</a>
              </Button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{item.serviceName}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">Qty: {item.quantity}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: item.currency,
                        }).format(item.price * item.quantity)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 mt-2"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code */}
              <div className="p-4 border-t pt-4">
                <label className="block text-sm font-medium mb-2">Promo Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  />
                  <Button variant="outline" onClick={handleApplyPromo} size="sm">
                    Apply
                  </Button>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(tax)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Discount</span>
                    <span>
                      -{new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(total)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full h-12 text-lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Proceed to Checkout'
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
