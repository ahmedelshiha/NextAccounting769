import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Link from 'next/link'
import { Metadata } from 'next'
import { formatCurrencyFromDecimal } from '@/lib/decimal-utils'
import prisma from '@/lib/prisma'

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const { slug } = (await Promise.resolve(params)) as { slug?: string }
  try {
    const service = await prisma.service.findFirst({ where: { slug }, select: { name: true, description: true } })
    if (!service) return { title: 'Service not found' }
    return {
      title: `${service.name} | Accounting Firm Services`,
      description: service.description || undefined,
    }
  } catch (error) {
    console.error('Error generating metadata for service:', error)
    return { title: 'Service' }
  }
}

export default async function ServicePage({ params }: any) {
  const { slug } = (await Promise.resolve(params)) as { slug?: string }
  if (!slug) return notFound()

  try {
    const hasDb = !!process.env.NETLIFY_DATABASE_URL || !!process.env.DATABASE_URL
    let service = null

    if (hasDb) {
      service = await prisma.service.findFirst({
        where: { slug },
        select: {
          slug: true,
          name: true,
          shortDesc: true,
          description: true,
          features: true,
          price: true,
        },
      })
    }

    // Fallback static services if DB missing or service not found
    const fallbackServices = {
      'bookkeeping': {
        slug: 'bookkeeping',
        name: 'Professional Bookkeeping',
        shortDesc: 'Comprehensive bookkeeping services to keep your financial records accurate and up-to-date.',
        description: 'Comprehensive bookkeeping services to keep your financial records accurate and up-to-date.',
        features: [
          'Monthly financial statements',
          'Accounts payable/receivable management',
          'Bank reconciliation',
          'Expense categorization',
          'QuickBooks setup and maintenance',
          'Monthly financial review calls'
        ],
        price: 299
      },
      'tax-preparation': {
        slug: 'tax-preparation',
        name: 'Tax Preparation & Planning',
        shortDesc: 'Expert tax preparation and strategic planning to minimize your tax liability.',
        description: 'Expert tax preparation and strategic planning to minimize your tax liability.',
        features: [
          'Individual and business tax returns',
          'Tax planning consultations',
          'IRS representation',
          'Quarterly estimated tax payments',
          'Multi-state tax filing',
          'Tax audit support'
        ],
        price: 450
      },
      'payroll': {
        slug: 'payroll',
        name: 'Payroll Management',
        shortDesc: 'Complete payroll processing and compliance management for your business.',
        description: 'Complete payroll processing and compliance management for your business.',
        features: [
          'Bi-weekly or monthly payroll processing',
          'Direct deposit setup',
          'Tax withholding and filing',
          'Employee self-service portal',
          'Workers compensation reporting',
          'Year-end W-2 and 1099 processing'
        ],
        price: 199
      },
      'cfo-advisory': {
        slug: 'cfo-advisory',
        name: 'CFO Advisory Services',
        shortDesc: 'Strategic financial guidance to help your business grow and thrive.',
        description: 'Strategic financial guidance to help your business grow and thrive.',
        features: [
          'Financial strategy development',
          'Cash flow management',
          'Budget planning and analysis',
          'KPI dashboard creation',
          'Investor relations support',
          'Monthly executive reports'
        ],
        price: 1200
      }
    }

    if (!service) {
      const fallback = (fallbackServices as Record<string, { slug: string; name: string; shortDesc: string; description: string; features: string[]; price: number }>)[slug]
      if (!fallback) return notFound()
      service = fallback
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">{service.name}</h1>
            {service.price && (
              <div className="text-lg text-blue-600 mt-2">Starting at {formatCurrencyFromDecimal(service.price)}</div>
            )}
            <p className="mt-4 text-gray-600">{service.shortDesc || service.description}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Overview</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {service.features && Array.isArray(service.features) && (
                    <ul className="list-disc pl-5 space-y-2 mb-6">
                      {service.features.map((f: string, i: number) => (
                        <li key={i} className="text-gray-700">{f}</li>
                      ))}
                    </ul>
                  )}

                  <div className="prose max-w-none">
                    {/* If rich content exists, render it here; fallback to shortDesc */}
                    {service.description}
                  </div>
                </CardContent>
              </Card>
            </div>

            <aside>
              <Card>
                <CardHeader>
                  <CardTitle>Get Started</CardTitle>
                  <CardDescription>Book this service or ask a question</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button asChild className="w-full">
                      <Link href={`/booking?service=${encodeURIComponent(service.slug)}`}>Book This Service</Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <Link href={`/contact?service=${encodeURIComponent(service.slug)}`}>Contact Us</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>More Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {/* List core services with links */}
                    <li><Link href="/services/bookkeeping" className="text-blue-600 hover:underline">Bookkeeping</Link></li>
                    <li><Link href="/services/tax-preparation" className="text-blue-600 hover:underline">Tax Preparation</Link></li>
                    <li><Link href="/services/payroll" className="text-blue-600 hover:underline">Payroll Management</Link></li>
                    <li><Link href="/services/cfo-advisory" className="text-blue-600 hover:underline">CFO Advisory</Link></li>
                  </ul>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading service page:', error)
    return notFound()
  }
}

export async function generateStaticParams() {
  try {
    const services = await prisma.service.findMany({ where: { status: 'ACTIVE' as any }, select: { slug: true } })
    if (services && services.length > 0) return services.map((s) => ({ slug: s.slug }))
  } catch {
    // ignore and fallback to default slugs
  }

  // Fallback to core service slugs
  return [
    { slug: 'bookkeeping' },
    { slug: 'tax-preparation' },
    { slug: 'payroll' },
    { slug: 'cfo-advisory' },
  ]
}
