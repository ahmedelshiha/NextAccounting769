import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DollarSign } from 'lucide-react'
import { formatCurrencyFromDecimal } from '@/lib/decimal-utils'

interface Props {
  params: { id: string }
}

// Minimal Booking shape used by this page; aligns with /api/bookings/[id] response
interface Booking {
  id: string
  status: string
  scheduledAt: string | Date
  duration?: number | null
  notes?: string | null
  service: { name: string; price?: any; duration?: number | null }
}

async function fetchBooking(id: string): Promise<Booking | null> {
  // Use internal API to centralize auth, RBAC and response shape
  const res = await fetch(`/api/bookings/${id}`, {
    // Forward cookies so the route can authorize the current user/session
    headers: { cookie: cookies().toString() },
    cache: 'no-store',
  })

  if (res.status === 404) return null
  if (!res.ok) return null

  const data = await res.json()
  return data as Booking
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default async function PortalBookingDetail({ params }: any) {
  const { id } = (await Promise.resolve(params)) as { id?: string }
  if (!id) return notFound()

  // Fetch through API route to avoid direct Prisma access from pages
  const booking = await fetchBooking(id)
  if (!booking) return notFound()

  const scheduled = new Date(booking.scheduledAt)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointment Details</h1>
            <p className="text-gray-600">Details for your scheduled appointment.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/portal/bookings">Back to Appointments</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/portal">Back to Portal</Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between w-full">
              <div>
                <CardTitle className="text-lg">{booking.service?.name}</CardTitle>
                <CardDescription>
                  {formatDate(scheduled)} at {formatTime(scheduled)}
                </CardDescription>
              </div>
              <div className="text-right">
                <Badge className={booking.status ? (booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800') : 'bg-gray-100 text-gray-800'}>
                  {booking.status}
                </Badge>
                {booking.duration != null && (
                  <div className="text-sm text-gray-500 mt-2">{booking.duration} min</div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {booking.service?.price != null && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <DollarSign className="h-4 w-4" />
                  <span>{formatCurrencyFromDecimal(booking.service.price)}</span>
                </div>
              )}

              {booking.notes && (
                <div className="p-3 bg-gray-50 rounded text-sm text-gray-700">
                  {booking.notes}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
