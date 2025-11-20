'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface SupportTicket {
  id: string
  ticketNumber: string
  subject: string
  status: 'open' | 'in-progress' | 'waiting' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  lastUpdated: string
  sla?: string
}

export function SupportSection() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/support/tickets')
        if (!response.ok) throw new Error('Failed to fetch tickets')
        const data = await response.json()
        setTickets(data.tickets || [])
      } catch (error) {
        toast.error('Failed to load support tickets')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTickets()
  }, [])

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!subject.trim() || !description.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, description }),
      })

      if (!response.ok) throw new Error('Failed to create ticket')

      const data = await response.json()
      setTickets((prev) => [data.ticket, ...prev])
      toast.success('Support ticket created')
      setSubject('')
      setDescription('')
      setShowNewTicket(false)
    } catch (error) {
      toast.error('Failed to create support ticket')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusIcon = (status: SupportTicket['status']) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in-progress':
      case 'waiting':
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-orange-600" />
    }
  }

  const getStatusLabel = (status: SupportTicket['status']) => {
    const labels = {
      open: 'Open',
      'in-progress': 'In Progress',
      waiting: 'Waiting',
      resolved: 'Resolved',
    }
    return labels[status]
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
      {/* New Ticket Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Help & Support</CardTitle>
              <CardDescription>Get help from our support team</CardDescription>
            </div>
            <Button
              onClick={() => setShowNewTicket(!showNewTicket)}
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              New Ticket
            </Button>
          </div>
        </CardHeader>
        {showNewTicket && (
          <CardContent>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-1">
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What is this about?"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe your issue in detail..."
                  className="w-full px-3 py-2 border rounded-lg resize-none dark:bg-gray-800 dark:border-gray-700"
                  rows={4}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowNewTicket(false)
                    setSubject('')
                    setDescription('')
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Ticket'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Support Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Your Support Tickets</CardTitle>
          <CardDescription>Track the status of your support requests</CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="py-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                No support tickets yet. We are here to help!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(ticket.status)}
                        <h4 className="font-medium truncate">{ticket.subject}</h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Ticket #{ticket.ticketNumber}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Created {new Date(ticket.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex gap-2 justify-end mb-2">
                        <Badge
                          variant={
                            ticket.status === 'resolved'
                              ? 'outline'
                              : ticket.priority === 'high'
                                ? 'destructive'
                                : 'secondary'
                          }
                          className="text-xs"
                        >
                          {getStatusLabel(ticket.status)}
                        </Badge>
                      </div>
                      {ticket.sla && (
                        <p className="text-xs text-gray-500">SLA: {ticket.sla}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Other Ways to Get Help</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="/help"
            className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-center"
          >
            <div className="font-medium mb-1">Help Center</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Browse articles and guides</p>
          </a>
          <a
            href="mailto:support@example.com"
            className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-center"
          >
            <div className="font-medium mb-1">Email Support</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">support@example.com</p>
          </a>
          <a
            href="tel:+1234567890"
            className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-center"
          >
            <div className="font-medium mb-1">Phone Support</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">+1 (234) 567-890</p>
          </a>
          <div className="p-4 border rounded-lg text-center">
            <div className="font-medium mb-1">Live Chat</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Monday-Friday 9am-5pm</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
