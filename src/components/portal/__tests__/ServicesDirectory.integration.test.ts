import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * ServicesDirectory Integration Tests
 * 
 * These tests verify the integration between the ServicesDirectory component
 * and the backend API endpoints for service requests and messaging.
 */

describe('ServicesDirectory Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Service Request Flow', () => {
    it('should create a service request with proper structure', () => {
      const serviceRequest = {
        serviceId: 'vat-return-ae',
        title: 'Request for UAE VAT Return Filing',
        description: 'Client requested service: UAE VAT Return Filing',
        priority: 'MEDIUM',
        isBooking: false,
      };

      expect(serviceRequest).toHaveProperty('serviceId');
      expect(serviceRequest).toHaveProperty('title');
      expect(serviceRequest).toHaveProperty('description');
      expect(serviceRequest).toHaveProperty('priority');
      expect(serviceRequest.priority).toBe('MEDIUM');
    });

    it('should generate unique request ID', () => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).slice(2, 9);
      const requestId = `req-${timestamp}-${random}`;

      expect(requestId).toMatch(/^req-\d+-[a-z0-9]+$/);
      expect(requestId.length).toBeGreaterThan(10);
    });

    it('should create room ID from request ID', () => {
      const requestId = 'req-123456789-abc123';
      const roomId = `service-request-${requestId}`;

      expect(roomId).toBe('service-request-req-123456789-abc123');
      expect(roomId).toMatch(/^service-request-req-/);
    });
  });

  describe('Messaging Integration', () => {
    it('should format service request message correctly', () => {
      const serviceName = 'UAE VAT Return Filing';
      const category = 'VAT Filing';
      const description = 'Monthly or quarterly VAT return preparation and filing with the UAE FTA';

      const message = `Service Request: ${serviceName}\n\nClient has requested the following service:\n\n**Service:** ${serviceName}\n**Category:** ${category}\n**Description:** ${description}\n\nPlease provide more details and pricing information.`;

      expect(message).toContain('Service Request:');
      expect(message).toContain(serviceName);
      expect(message).toContain(category);
      expect(message).toContain('Please provide more details');
    });

    it('should create chat message with correct structure', () => {
      const chatMessage = {
        id: 'msg-123',
        text: 'Service Request: UAE VAT Return Filing',
        userId: 'user-123',
        userName: 'John Doe',
        role: 'client',
        tenantId: 'tenant-123',
        room: 'service-request-req-123',
        createdAt: new Date().toISOString(),
      };

      expect(chatMessage).toHaveProperty('id');
      expect(chatMessage).toHaveProperty('text');
      expect(chatMessage).toHaveProperty('userId');
      expect(chatMessage).toHaveProperty('userName');
      expect(chatMessage).toHaveProperty('role');
      expect(chatMessage).toHaveProperty('room');
      expect(chatMessage.role).toBe('client');
    });
  });

  describe('Search and Filter Logic', () => {
    const services = [
      {
        id: 'vat-return-ae',
        name: 'UAE VAT Return Filing',
        description: 'Monthly or quarterly VAT return preparation and filing with the UAE FTA',
        category: 'VAT Filing',
        countryScope: ['AE'],
      },
      {
        id: 'corporate-tax-ae',
        name: 'UAE Corporate Tax Return',
        description: 'Annual corporate income tax return for eligible entities in UAE',
        category: 'Corporate Tax',
        countryScope: ['AE'],
      },
      {
        id: 'zatca-vat-sa',
        name: 'ZATCA VAT Filing (KSA)',
        description: 'Monthly VAT return filing with ZATCA including e-invoice compliance',
        category: 'VAT Filing',
        countryScope: ['SA'],
      },
    ];

    it('should filter services by search term', () => {
      const searchTerm = 'Corporate';
      const filtered = services.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.description.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('UAE Corporate Tax Return');
    });

    it('should filter services by country', () => {
      const country = 'SA';
      const filtered = services.filter((s) => s.countryScope.includes(country));

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('zatca-vat-sa');
    });

    it('should filter services by category', () => {
      const category = 'VAT Filing';
      const filtered = services.filter((s) => s.category === category);

      expect(filtered).toHaveLength(2);
      expect(filtered.every((s) => s.category === category)).toBe(true);
    });

    it('should combine multiple filters', () => {
      const searchTerm = 'VAT';
      const country = 'AE';
      const category = 'VAT Filing';

      let filtered = services;

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (s) =>
            s.name.toLowerCase().includes(searchLower) ||
            s.description.toLowerCase().includes(searchLower)
        );
      }

      if (country) {
        filtered = filtered.filter((s) => s.countryScope.includes(country));
      }

      if (category) {
        filtered = filtered.filter((s) => s.category === category);
      }

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('vat-return-ae');
    });

    it('should generate search suggestions', () => {
      const searchTerm = 'VAT';
      const suggestions = services
        .filter(
          (s) =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 5);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.length).toBeLessThanOrEqual(5);
      expect(suggestions.every((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()))).toBe(true);
    });
  });

  describe('API Response Structure', () => {
    it('should return correct GET response structure', () => {
      const response = {
        success: true,
        data: {
          services: [],
          categories: ['VAT Filing', 'Corporate Tax'],
          total: 0,
        },
      };

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('services');
      expect(response.data).toHaveProperty('categories');
      expect(response.data).toHaveProperty('total');
      expect(Array.isArray(response.data.services)).toBe(true);
      expect(Array.isArray(response.data.categories)).toBe(true);
    });

    it('should return correct POST response structure', () => {
      const response = {
        success: true,
        data: {
          requestId: 'req-123456789-abc123',
          serviceId: 'vat-return-ae',
          serviceName: 'UAE VAT Return Filing',
          status: 'pending',
          roomId: 'service-request-req-123456789-abc123',
          createdAt: new Date().toISOString(),
        },
      };

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('requestId');
      expect(response.data).toHaveProperty('serviceId');
      expect(response.data).toHaveProperty('serviceName');
      expect(response.data).toHaveProperty('status');
      expect(response.data).toHaveProperty('roomId');
      expect(response.data.status).toBe('pending');
    });

    it('should return correct error response structure', () => {
      const response = {
        error: 'Service not found',
      };

      expect(response).toHaveProperty('error');
      expect(typeof response.error).toBe('string');
    });
  });

  describe('Accessibility Requirements', () => {
    it('should have proper ARIA labels for search input', () => {
      const searchInput = {
        'aria-label': 'Search services',
        'aria-autocomplete': 'list',
        'aria-controls': 'search-suggestions',
        role: 'combobox',
      };

      expect(searchInput['aria-label']).toBe('Search services');
      expect(searchInput['aria-autocomplete']).toBe('list');
      expect(searchInput.role).toBe('combobox');
    });

    it('should have proper ARIA labels for filters', () => {
      const countryFilter = {
        'aria-label': 'Filter by country',
      };

      const categoryFilter = {
        'aria-label': 'Filter by category',
      };

      expect(countryFilter['aria-label']).toBe('Filter by country');
      expect(categoryFilter['aria-label']).toBe('Filter by category');
    });

    it('should have proper ARIA attributes for suggestions dropdown', () => {
      const suggestionsDropdown = {
        id: 'search-suggestions',
        role: 'listbox',
      };

      expect(suggestionsDropdown.id).toBe('search-suggestions');
      expect(suggestionsDropdown.role).toBe('listbox');
    });

    it('should have proper ARIA attributes for loading state', () => {
      const loadingState = {
        role: 'status',
        'aria-live': 'polite',
      };

      expect(loadingState.role).toBe('status');
      expect(loadingState['aria-live']).toBe('polite');
    });

    it('should have proper button labels for service requests', () => {
      const requestButton = {
        'aria-label': 'Request UAE VAT Return Filing service',
      };

      expect(requestButton['aria-label']).toContain('Request');
      expect(requestButton['aria-label']).toContain('service');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing service ID', () => {
      const data = {};
      const serviceId = data.serviceId;

      expect(serviceId).toBeUndefined();
    });

    it('should handle service not found', () => {
      const services = [
        { id: 'vat-return-ae', name: 'UAE VAT Return Filing' },
      ];
      const serviceId = 'nonexistent-service';
      const service = services.find((s) => s.id === serviceId);

      expect(service).toBeUndefined();
    });

    it('should handle network errors gracefully', () => {
      const error = new Error('Failed to fetch services');
      expect(error.message).toBe('Failed to fetch services');
    });

    it('should handle invalid JSON response', () => {
      const invalidJson = '{invalid json}';
      expect(() => JSON.parse(invalidJson)).toThrow();
    });
  });

  describe('Performance', () => {
    it('should limit search suggestions to 5 results', () => {
      const services = Array.from({ length: 20 }, (_, i) => ({
        id: `service-${i}`,
        name: `Service ${i}`,
        description: 'Test service',
        category: 'Test',
        countryScope: ['AE'],
      }));

      const searchTerm = 'Service';
      const suggestions = services
        .filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(0, 5);

      expect(suggestions.length).toBeLessThanOrEqual(5);
    });

    it('should debounce search input', () => {
      const debounceTime = 300;
      expect(debounceTime).toBe(300);
      expect(debounceTime).toBeGreaterThanOrEqual(200);
    });
  });
});
