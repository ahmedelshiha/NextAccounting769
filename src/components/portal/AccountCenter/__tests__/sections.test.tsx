import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'
import { ProfileSection } from '../ProfileSection'
import { WalletSection } from '../WalletSection'
import { CartSection } from '../CartSection'
import { DocumentsSection } from '../DocumentsSection'
import { FeedbackSection } from '../FeedbackSection'
import { SupportSection } from '../SupportSection'
import { AboutSection } from '../AboutSection'

// Mock next-auth
vi.mock('next-auth/react', async () => {
  const actual = await vi.importActual('next-auth/react')
  return {
    ...actual,
    useSession: () => ({
      data: {
        user: {
          id: 'user_1',
          email: 'test@example.com',
          name: 'Test User',
        },
      },
      status: 'authenticated',
    }),
  }
})

// Mock fetch globally
global.fetch = vi.fn()

const mockSession = {
  user: {
    id: 'user_1',
    email: 'test@example.com',
    name: 'Test User',
  },
}

describe('Phase 2.4 Settings Sections', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ProfileSection', () => {
    it('renders profile section with form fields', () => {
      render(
        <SessionProvider session={mockSession}>
          <ProfileSection />
        </SessionProvider>
      )

      expect(screen.getByText('Profile Information')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    })

    it('enables edit mode on button click', () => {
      render(
        <SessionProvider session={mockSession}>
          <ProfileSection />
        </SessionProvider>
      )

      const editButton = screen.getByRole('button', { name: /edit profile/i })
      fireEvent.click(editButton)

      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Save Changes')).toBeInTheDocument()
    })

    it('displays avatar with user initial', () => {
      render(
        <SessionProvider session={mockSession}>
          <ProfileSection />
        </SessionProvider>
      )

      expect(screen.getByText('T')).toBeInTheDocument()
    })
  })

  describe('WalletSection', () => {
    it('renders wallet section with payment methods', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          paymentMethods: [
            {
              id: 'pm_1',
              type: 'card',
              lastDigits: '4242',
              brand: 'Visa',
              expiryMonth: 12,
              expiryYear: 2025,
              isDefault: true,
              createdAt: new Date().toISOString(),
            },
          ],
          invoices: [],
          balance: 2500,
        }),
      })

      render(
        <SessionProvider session={mockSession}>
          <WalletSection />
        </SessionProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Account Balance')).toBeInTheDocument()
      })
    })

    it('displays balance correctly formatted', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          paymentMethods: [],
          invoices: [],
          balance: 2500.0,
        }),
      })

      render(
        <SessionProvider session={mockSession}>
          <WalletSection />
        </SessionProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('$2,500.00')).toBeInTheDocument()
      })
    })
  })

  describe('CartSection', () => {
    it('renders cart with items', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 'cart_1',
              serviceName: 'VAT Filing',
              description: 'Monthly VAT return',
              price: 299.99,
              quantity: 1,
              currency: 'USD',
            },
          ],
          subtotal: 299.99,
          tax: 15,
          discount: 0,
        }),
      })

      render(
        <SessionProvider session={mockSession}>
          <CartSection />
        </SessionProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('VAT Filing')).toBeInTheDocument()
      })
    })

    it('shows empty cart message when no items', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [],
          subtotal: 0,
          tax: 0,
          discount: 0,
        }),
      })

      render(
        <SessionProvider session={mockSession}>
          <CartSection />
        </SessionProvider>
      )

      await waitFor(() => {
        expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument()
      })
    })
  })

  describe('DocumentsSection', () => {
    it('renders documents list', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          documents: [
            {
              id: 'doc_1',
              name: 'Tax Return.pdf',
              type: 'pdf',
              size: 1024000,
              uploadedAt: new Date().toISOString(),
              isStarred: false,
              category: 'Tax Return',
            },
          ],
        }),
      })

      render(
        <SessionProvider session={mockSession}>
          <DocumentsSection />
        </SessionProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Tax Return.pdf')).toBeInTheDocument()
      })
    })

    it('shows storage usage', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          documents: [],
        }),
      })

      render(
        <SessionProvider session={mockSession}>
          <DocumentsSection />
        </SessionProvider>
      )

      await waitFor(() => {
        expect(screen.getByText(/storage usage/i)).toBeInTheDocument()
      })
    })
  })

  describe('FeedbackSection', () => {
    it('renders feedback form with rating stars', () => {
      render(
        <SessionProvider session={mockSession}>
          <FeedbackSection />
        </SessionProvider>
      )

      expect(screen.getByText(/rate your experience/i)).toBeInTheDocument()
      const stars = screen.getAllByRole('button')
      expect(stars.length).toBeGreaterThan(0)
    })

    it('enables submit when rating and comment provided', () => {
      render(
        <SessionProvider session={mockSession}>
          <FeedbackSection />
        </SessionProvider>
      )

      const textarea = screen.getByPlaceholderText(/what could we improve/i)
      expect(textarea).toBeInTheDocument()
    })
  })

  describe('SupportSection', () => {
    it('renders support tickets', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tickets: [
            {
              id: 'tkt_1',
              ticketNumber: 'TK-2024-001',
              subject: 'Help needed',
              status: 'open',
              priority: 'high',
              createdAt: new Date().toISOString(),
              lastUpdated: new Date().toISOString(),
            },
          ],
        }),
      })

      render(
        <SessionProvider session={mockSession}>
          <SupportSection />
        </SessionProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Help needed')).toBeInTheDocument()
      })
    })

    it('allows creating new support ticket', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tickets: [] }),
      })

      render(
        <SessionProvider session={mockSession}>
          <SupportSection />
        </SessionProvider>
      )

      await waitFor(() => {
        const newTicketBtn = screen.getByRole('button', { name: /new ticket/i })
        expect(newTicketBtn).toBeInTheDocument()
      })
    })
  })

  describe('AboutSection', () => {
    it('renders app version information', () => {
      render(
        <SessionProvider session={mockSession}>
          <AboutSection />
        </SessionProvider>
      )

      expect(screen.getByText(/about taxhub/i)).toBeInTheDocument()
      expect(screen.getByText(/2.4.0/)).toBeInTheDocument()
    })

    it('displays features list', () => {
      render(
        <SessionProvider session={mockSession}>
          <AboutSection />
        </SessionProvider>
      )

      expect(screen.getByText(/multi-country tax compliance/i)).toBeInTheDocument()
      expect(screen.getByText(/arabic language support/i)).toBeInTheDocument()
    })

    it('shows open source licenses', () => {
      render(
        <SessionProvider session={mockSession}>
          <AboutSection />
        </SessionProvider>
      )

      expect(screen.getByText(/open source licenses/i)).toBeInTheDocument()
      expect(screen.getByText('Next.js')).toBeInTheDocument()
      expect(screen.getByText('React')).toBeInTheDocument()
    })
  })
})
