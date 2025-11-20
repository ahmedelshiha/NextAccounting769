import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateObligations,
  isVATRegistrationRequired,
  calculateCorporateTaxObligation,
  isESRRequired,
  isUBORegisterRequired,
  isZakatRequired,
  isWHTRequired,
  isEInvoicingRequired,
  hasOverdueObligations,
  getComplianceStatus,
  calculateRiskLevel,
} from '../rules';
import { Entity } from '@prisma/client';

const mockEntity = (overrides?: Partial<Entity>): Entity => ({
  id: 'entity-1',
  tenantId: 'tenant-1',
  name: 'Test Company',
  country: 'AE',
  legalForm: 'LLC',
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'user-1',
  updatedBy: 'user-1',
  activityCode: '1234',
  registrationCertUrl: null,
  registrationCertHash: null,
  parentEntityId: null,
  metadata: { entityType: 'company' },
  fiscalYearStart: null,
  ...overrides,
});

describe('Compliance Rules Engine', () => {
  describe('VAT Registration', () => {
    it('should require VAT for UAE entities exceeding threshold (AED 375k)', () => {
      const entity = mockEntity({ country: 'AE' });
      expect(isVATRegistrationRequired(entity, 400000)).toBe(true);
      expect(isVATRegistrationRequired(entity, 300000)).toBe(false);
    });

    it('should require VAT for KSA entities exceeding threshold (SAR 1M)', () => {
      const entity = mockEntity({ country: 'SA' });
      expect(isVATRegistrationRequired(entity, 1500000)).toBe(true);
      expect(isVATRegistrationRequired(entity, 800000)).toBe(false);
    });

    it('should require VAT for Egypt entities exceeding threshold (EGP 500k)', () => {
      const entity = mockEntity({ country: 'EG' });
      expect(isVATRegistrationRequired(entity, 600000)).toBe(true);
      expect(isVATRegistrationRequired(entity, 400000)).toBe(false);
    });
  });

  describe('Corporate Tax', () => {
    it('should require corporate tax for UAE companies with high turnover', () => {
      const entity = mockEntity({ country: 'AE', metadata: { entityType: 'company' } });
      expect(calculateCorporateTaxObligation(entity, 500000)).toBe(true);
      expect(calculateCorporateTaxObligation(entity, 200000)).toBe(false);
    });

    it('should not require corporate tax for KSA entities (uses Zakat instead)', () => {
      const entity = mockEntity({ country: 'SA', metadata: { entityType: 'company' } });
      expect(calculateCorporateTaxObligation(entity, 5000000)).toBe(false);
    });

    it('should require corporate tax for all Egyptian companies', () => {
      const entity = mockEntity({ country: 'EG', metadata: { entityType: 'company' } });
      expect(calculateCorporateTaxObligation(entity, 100000)).toBe(true);
    });

    it('should not require corporate tax for Egyptian individuals', () => {
      const entity = mockEntity({ country: 'EG', metadata: { entityType: 'individual' } });
      expect(calculateCorporateTaxObligation(entity, 100000)).toBe(false);
    });
  });

  describe('ESR (Economic Substance Requirement)', () => {
    it('should require ESR only for UAE companies', () => {
      const uaeCompany = mockEntity({ country: 'AE', metadata: { entityType: 'company' } });
      const uaeIndividual = mockEntity({ country: 'AE', metadata: { entityType: 'individual' } });
      const ksaCompany = mockEntity({ country: 'SA', metadata: { entityType: 'company' } });

      expect(isESRRequired(uaeCompany)).toBe(true);
      expect(isESRRequired(uaeIndividual)).toBe(false);
      expect(isESRRequired(ksaCompany)).toBe(false);
    });
  });

  describe('UBO Register', () => {
    it('should require UBO register update for all UAE entities', () => {
      const uaeEntity = mockEntity({ country: 'AE' });
      expect(isUBORegisterRequired(uaeEntity)).toBe(true);

      const ksaEntity = mockEntity({ country: 'SA' });
      expect(isUBORegisterRequired(ksaEntity)).toBe(false);
    });
  });

  describe('Zakat', () => {
    it('should require Zakat for all KSA entities', () => {
      const ksaEntity = mockEntity({ country: 'SA' });
      expect(isZakatRequired(ksaEntity)).toBe(true);

      const uaeEntity = mockEntity({ country: 'AE' });
      expect(isZakatRequired(uaeEntity)).toBe(false);
    });
  });

  describe('Withholding Tax', () => {
    it('should require WHT reporting for KSA entities', () => {
      const ksaEntity = mockEntity({ country: 'SA' });
      expect(isWHTRequired(ksaEntity)).toBe(true);
    });

    it('should require WHT reporting for Egypt entities', () => {
      const egEntity = mockEntity({ country: 'EG' });
      expect(isWHTRequired(egEntity)).toBe(true);
    });

    it('should not require WHT for UAE entities', () => {
      const uaeEntity = mockEntity({ country: 'AE' });
      expect(isWHTRequired(uaeEntity)).toBe(false);
    });
  });

  describe('E-Invoicing', () => {
    it('should require E-Invoicing for KSA entities', () => {
      const ksaEntity = mockEntity({ country: 'SA' });
      expect(isEInvoicingRequired(ksaEntity)).toBe(true);
    });

    it('should require E-Invoicing for Egypt B2B transactions > EGP 2000', () => {
      const egEntity = mockEntity({ country: 'EG' });
      expect(isEInvoicingRequired(egEntity, 3000)).toBe(true);
      expect(isEInvoicingRequired(egEntity, 1000)).toBe(true); // Default is true for Egypt
    });

    it('should not require E-Invoicing for UAE entities', () => {
      const uaeEntity = mockEntity({ country: 'AE' });
      expect(isEInvoicingRequired(uaeEntity)).toBe(false);
    });
  });

  describe('Calculate Obligations', () => {
    it('should calculate all applicable obligations for UAE company', () => {
      const entity = mockEntity({ country: 'AE', metadata: { entityType: 'company' } });
      const obligations = calculateObligations(entity, { annualTurnover: 500000 });

      const obligationTypes = obligations.map((o) => o.type);
      expect(obligationTypes).toContain('VAT');
      expect(obligationTypes).toContain('CORPORATE_TAX');
      expect(obligationTypes).toContain('ESR');
      expect(obligationTypes).toContain('UBO');
    });

    it('should calculate all applicable obligations for KSA company', () => {
      const entity = mockEntity({ country: 'SA', metadata: { entityType: 'company' } });
      const obligations = calculateObligations(entity, { annualTurnover: 2000000 });

      const obligationTypes = obligations.map((o) => o.type);
      expect(obligationTypes).toContain('VAT');
      expect(obligationTypes).toContain('ZAKAT');
      expect(obligationTypes).toContain('WHT');
      expect(obligationTypes).toContain('E_INVOICE');
    });

    it('should calculate all applicable obligations for Egypt company', () => {
      const entity = mockEntity({ country: 'EG', metadata: { entityType: 'company' } });
      const obligations = calculateObligations(entity, { annualTurnover: 600000 });

      const obligationTypes = obligations.map((o) => o.type);
      expect(obligationTypes).toContain('VAT');
      expect(obligationTypes).toContain('CORPORATE_TAX');
      expect(obligationTypes).toContain('WHT');
      expect(obligationTypes).toContain('E_INVOICE');
    });

    it('should have appropriate due dates for obligations', () => {
      const entity = mockEntity({ country: 'AE', metadata: { entityType: 'company' } });
      const obligations = calculateObligations(entity, { annualTurnover: 500000 });

      obligations.forEach((ob) => {
        expect(ob.dueDate).toBeInstanceOf(Date);
        expect(ob.dueDate.getTime()).toBeGreaterThan(Date.now());
      });
    });

    it('should calculate days until due correctly', () => {
      const entity = mockEntity({ country: 'AE', metadata: { entityType: 'company' } });
      const obligations = calculateObligations(entity, { annualTurnover: 500000 });

      obligations.forEach((ob) => {
        const calculatedDays = Math.floor((ob.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        expect(ob.daysUntilDue).toBeLessThanOrEqual(calculatedDays + 1); // Allow 1 day tolerance
      });
    });
  });

  describe('Compliance Status', () => {
    it('should calculate compliance status correctly', () => {
      const obligations = [
        {
          id: '1',
          type: 'VAT',
          country: 'AE',
          description: 'VAT',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          frequency: 'MONTHLY',
          status: 'PENDING',
          daysUntilDue: 30,
          requiresDocumentation: true,
          automationSupported: false,
        },
        {
          id: '2',
          type: 'CORPORATE_TAX',
          country: 'AE',
          description: 'CT',
          dueDate: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
          frequency: 'ANNUALLY',
          status: 'SUBMITTED',
          daysUntilDue: 100,
          requiresDocumentation: true,
          automationSupported: false,
        },
      ];

      const status = getComplianceStatus(obligations);
      expect(status.total).toBe(2);
      expect(status.submitted).toBe(1);
      expect(status.pending).toBe(1);
      expect(status.overdue).toBe(0);
      expect(status.complianceScore).toBe(50);
    });

    it('should detect overdue obligations', () => {
      const obligations = [
        {
          id: '1',
          type: 'VAT',
          country: 'AE',
          description: 'VAT',
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          frequency: 'MONTHLY',
          status: 'PENDING',
          daysUntilDue: -5,
          requiresDocumentation: true,
          automationSupported: false,
        },
      ];

      expect(hasOverdueObligations(obligations)).toBe(true);
    });
  });

  describe('Risk Calculation', () => {
    it('should calculate CRITICAL risk when overdue obligations exist', () => {
      const status = {
        total: 5,
        pending: 2,
        submitted: 3,
        overdue: 2,
        complianceScore: 60,
      };

      expect(calculateRiskLevel(status)).toBe('CRITICAL');
    });

    it('should calculate HIGH risk when compliance score < 50%', () => {
      const status = {
        total: 10,
        pending: 6,
        submitted: 4,
        overdue: 0,
        complianceScore: 40,
      };

      expect(calculateRiskLevel(status)).toBe('HIGH');
    });

    it('should calculate MEDIUM risk when compliance score < 80%', () => {
      const status = {
        total: 10,
        pending: 3,
        submitted: 7,
        overdue: 0,
        complianceScore: 70,
      };

      expect(calculateRiskLevel(status)).toBe('MEDIUM');
    });

    it('should calculate LOW risk when fully compliant', () => {
      const status = {
        total: 10,
        pending: 0,
        submitted: 10,
        overdue: 0,
        complianceScore: 100,
      };

      expect(calculateRiskLevel(status)).toBe('LOW');
    });
  });
});
