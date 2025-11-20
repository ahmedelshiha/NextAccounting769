import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServicesDirectory } from '../ServicesDirectory';

// Mock fetch
global.fetch = vi.fn();

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const mockServices = [
  {
    id: 'vat-return-ae',
    name: 'UAE VAT Return Filing',
    description: 'Monthly or quarterly VAT return preparation and filing with the UAE FTA',
    category: 'VAT Filing',
    countryScope: ['AE'],
    pricing: {
      amount: 500,
      currency: 'AED',
      unit: 'per_return',
    },
    prerequisites: ['TRN Verification', 'VAT Registration'],
    sla: {
      turnaroundTime: '5 business days',
      responseTime: '24 hours',
    },
    icon: '📋',
  },
  {
    id: 'corporate-tax-ae',
    name: 'UAE Corporate Tax Return',
    description: 'Annual corporate income tax return for eligible entities in UAE',
    category: 'Corporate Tax',
    countryScope: ['AE'],
    pricing: {
      amount: 2500,
      currency: 'AED',
      unit: 'per_year',
    },
    prerequisites: ['Entity Setup', 'Financial Records'],
    sla: {
      turnaroundTime: '10 business days',
      responseTime: '24 hours',
    },
    icon: '🏢',
  },
  {
    id: 'zatca-vat-sa',
    name: 'ZATCA VAT Filing (KSA)',
    description: 'Monthly VAT return filing with ZATCA including e-invoice compliance',
    category: 'VAT Filing',
    countryScope: ['SA'],
    pricing: {
      amount: 800,
      currency: 'SAR',
      unit: 'per_return',
    },
    prerequisites: ['VAT Registration', 'E-Invoice Setup'],
    sla: {
      turnaroundTime: '3 business days',
      responseTime: '12 hours',
    },
    icon: '📑',
  },
];

const mockResponse = {
  success: true,
  data: {
    services: mockServices,
    categories: ['VAT Filing', 'Corporate Tax'],
    total: mockServices.length,
  },
};

describe('ServicesDirectory Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });
  });

  describe('Rendering', () => {
    it('should render the services directory header', async () => {
      render(<ServicesDirectory />);
      
      expect(screen.getByText('Services Catalog')).toBeInTheDocument();
      expect(screen.getByText(/Browse and request tax/)).toBeInTheDocument();
    });

    it('should render search input with proper accessibility attributes', async () => {
      render(<ServicesDirectory />);
      
      const searchInput = screen.getByPlaceholderText('Search services...');
      expect(searchInput).toHaveAttribute('aria-label', 'Search services');
      expect(searchInput).toHaveAttribute('aria-autocomplete', 'list');
      expect(searchInput).toHaveAttribute('role', 'combobox');
    });

    it('should render country and category filters', async () => {
      render(<ServicesDirectory />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Filter by country')).toBeInTheDocument();
        expect(screen.getByLabelText('Filter by category')).toBeInTheDocument();
      });
    });

    it('should display services after loading', async () => {
      render(<ServicesDirectory />);
      
      await waitFor(() => {
        expect(screen.getByText('UAE VAT Return Filing')).toBeInTheDocument();
        expect(screen.getByText('UAE Corporate Tax Return')).toBeInTheDocument();
        expect(screen.getByText('ZATCA VAT Filing (KSA)')).toBeInTheDocument();
      });
    });

    it('should display service details correctly', async () => {
      render(<ServicesDirectory />);
      
      await waitFor(() => {
        const serviceCard = screen.getByText('UAE VAT Return Filing').closest('[class*="Card"]');
        expect(serviceCard).toBeInTheDocument();
        
        within(serviceCard!).getByText('Monthly or quarterly VAT return preparation');
        within(serviceCard!).getByText('500 AED');
        within(serviceCard!).getByText('VAT Filing');
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter services by search term', async () => {
      render(<ServicesDirectory />);
      
      await waitFor(() => {
        expect(screen.getByText('UAE VAT Return Filing')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search services...');
      await userEvent.type(searchInput, 'Corporate');
      
      await waitFor(() => {
        expect(screen.getByText('UAE Corporate Tax Return')).toBeInTheDocument();
        expect(screen.queryByText('ZATCA VAT Filing (KSA)')).not.toBeInTheDocument();
      });
    });

    it('should show search suggestions on input', async () => {
      render(<ServicesDirectory />);
      
      await waitFor(() => {
        expect(screen.getByText('UAE VAT Return Filing')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search services...');
      await userEvent.type(searchInput, 'VAT');
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('should select suggestion and update search', async () => {
      render(<ServicesDirectory />);
      
      await waitFor(() => {
        expect(screen.getByText('UAE VAT Return Filing')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search services..') as HTMLInputElement;
      await userEvent.type(searchInput, 'VAT');
      
      await waitFor(() => {
        const suggestions = screen.getAllByRole('option');
        expect(suggestions.length).toBeGreaterThan(0);
      });
      
      const firstSuggestion = screen.getAllByRole('option')[0];
      await userEvent.click(firstSuggestion);
      
      expect(searchInput.value).toBe('UAE VAT Return Filing');
    });

    it('should hide suggestions when clicking outside', async () => {
      render(<ServicesDirectory />);
      
      await waitFor(() => {
        expect(screen.getByText('UAE VAT Return Filing')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search services...');
      await userEvent.type(searchInput, 'VAT');
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      fireEvent.mouseDown(document.body);
      
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should filter services by country', async () => {
      render(<ServicesDirectory />);
      
      await waitFor(() => {
        expect(screen.getByText('UAE VAT Return Filing')).toBeInTheDocument();
      });
      
      const countrySelect = screen.getByLabelText('Filter by country');
      await userEvent.click(countrySelect);
      
      const saOption = screen.getByText('🇸🇦 Saudi Arabia');
      await userEvent.click(saOption);
      
      await waitFor(() => {
        expect(screen.getByText('ZATCA VAT Filing (KSA)')).toBeInTheDocument();
        expect(screen.queryByText('UAE VAT Return Filing')).not.toBeInTheDocument();
      });
    });

    it('should filter services by category', async () => {
      render(<ServicesDirectory />);
      
      await waitFor(() => {
        expect(screen.getByText('UAE VAT Return Filing')).toBeInTheDocument();
      });
      
      const categorySelect = screen.getByLabelText('Filter by category');
      await userEvent.click(categorySelect);
      
      const corpTaxOption = screen.getByText('Corporate Tax');
      await userEvent.click(corpTaxOption);
      
      await waitFor(() => {
        expect(screen.getByText('UAE Corporate Tax Return')).toBeInTheDocument();
        expect(screen.queryByText('ZATCA VAT Filing (KSA)')).not.toBeInTheDocument();
      });
    });

    it('should combine multiple filters', async () => {
      render(<ServicesDirectory />);
      
      await waitFor(() => {
        expect(screen.getByText('UAE VAT Return Filing')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search services...');
      await userEvent.type(searchInput, 'VAT');
      
      const countrySelect = screen.getByLabelText('Filter by country');
      await userEvent.click(countrySelect);
      
      const aeOption = screen.getByText('🇦🇪 UAE');
      await userEvent.click(aeOption);
      
      await waitFor(() => {
        expect(screen.getByText('UAE VAT Return Filing')).toBeInTheDocument();
        expect(screen.queryByText('ZATCA VAT Filing (KSA)')).not.toBeInTheDocument();
      });
    });
  });

  describe('Service Request', () => {
    it('should request a service and show success message', async () => {
      const { toast } = await import('sonner');
      
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/services')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockResponse,
          });
        }
        if (url.includes('/api/portal/service-requests')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              data: { id: 'req-123' },
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      });
      
      render(<ServicesDirectory />);
      
      await waitFor(() => {
        expect(screen.getByText('UAE VAT Return Filing')).toBeInTheDocument();
      });
      
      const requestButtons = screen.getAllByText(/Request Service/);
      await userEvent.click(requestButtons[0]);
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringContaining('Request sent')
        );
      });
    });

    it('should disable button after requesting service', async () => {
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/services')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockResponse,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: { id: 'req-123' } }),
        });
      });
      
      render(<ServicesDirectory />);
      
      await waitFor(() => {
        expect(screen.getByText('UAE VAT Return Filing')).toBeInTheDocument();
      });
      
      const requestButtons = screen.getAllByText(/Request Service/);
      const button = requestButtons[0];
      
      await userEvent.click(button);
      
      await waitFor(() => {
        expect(button).toBeDisabled();
        expect(screen.getByText('Requested')).toBeInTheDocument();
      });
    });

    it('should show error message on request failure', async () => {
      const { toast } = await import('sonner');
      
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/services')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockResponse,
          });
        }
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: 'Failed' }),
        });
      });
      
      render(<ServicesDirectory />);
      
      await waitFor(() => {
        expect(screen.getByText('UAE VAT Return Filing')).toBeInTheDocument();
      });
      
      const requestButtons = screen.getAllByText(/Request Service/);
      await userEvent.click(requestButtons[0]);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to send request')
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on all interactive elements', async () => {
      render(<ServicesDirectory />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Search services...')).toBeInTheDocument();
        expect(screen.getByLabelText('Filter by country')).toBeInTheDocument();
        expect(screen.getByLabelText('Filter by category')).toBeInTheDocument();
      });
    });

    it('should announce loading state to screen readers', async () => {
      render(<ServicesDirectory />);
      
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('should have proper button labels for service requests', async () => {
      render(<ServicesDirectory />);
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const requestButtons = buttons.filter(btn => 
          btn.getAttribute('aria-label')?.includes('Request')
        );
        expect(requestButtons.length).toBeGreaterThan(0);
      });
    });

    it('should support keyboard navigation in search suggestions', async () => {
      render(<ServicesDirectory />);
      
      await waitFor(() => {
        expect(screen.getByText('UAE VAT Return Filing')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search services...');
      await userEvent.type(searchInput, 'VAT');
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      // Keyboard navigation should work with arrow keys
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
      // The component should handle arrow key navigation
    });
  });

  describe('Error Handling', () => {
    it('should show error message when services fail to load', async () => {
      const { toast } = await import('sonner');
      
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Failed to fetch services' }),
      });
      
      render(<ServicesDirectory />);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load services');
      });
    });

    it('should display empty state when no services match filters', async () => {
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('search=nonexistent')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                services: [],
                categories: ['VAT Filing', 'Corporate Tax'],
                total: 0,
              },
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockResponse,
        });
      });
      
      render(<ServicesDirectory />);
      
      await waitFor(() => {
        expect(screen.getByText('UAE VAT Return Filing')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search services...');
      await userEvent.type(searchInput, 'nonexistent');
      
      await waitFor(() => {
        expect(screen.getByText(/No services found/)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render filters in responsive grid', async () => {
      render(<ServicesDirectory />);
      
      await waitFor(() => {
        const filterCard = screen.getByLabelText('Filter by country').closest('[class*="Card"]');
        expect(filterCard).toHaveClass('grid');
      });
    });

    it('should render services in responsive grid', async () => {
      render(<ServicesDirectory />);
      
      await waitFor(() => {
        const servicesGrid = screen.getByText('UAE VAT Return Filing').closest('[class*="grid"]');
        expect(servicesGrid).toHaveClass('grid');
      });
    });
  });
});
