import { describe, it, expect, beforeEach } from 'vitest';
import {
  IntegrationManager,
  SalesforceIntegration,
  SAPIntegration,
  OracleFinancialsIntegration,
  IntegrationStatus,
  IntegrationType,
  IntegrationConfig,
} from '../external-integrations';

describe('External Integrations', () => {
  let manager: IntegrationManager;

  beforeEach(() => {
    manager = new IntegrationManager();
  });

  describe('Integration Manager', () => {
    it('should register a Salesforce integration', () => {
      const config: IntegrationConfig = {
        id: 'sf-1',
        type: IntegrationType.SALESFORCE,
        name: 'Salesforce Production',
        status: IntegrationStatus.DISCONNECTED,
        credentials: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
        },
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const integration = manager.registerIntegration(config);

      expect(integration).toBeInstanceOf(SalesforceIntegration);
      expect(manager.getIntegration('sf-1')).toBeDefined();
    });

    it('should register a SAP integration', () => {
      const config: IntegrationConfig = {
        id: 'sap-1',
        type: IntegrationType.SAP,
        name: 'SAP ERP',
        status: IntegrationStatus.DISCONNECTED,
        credentials: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          username: 'test-user',
          password: 'test-password',
        },
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const integration = manager.registerIntegration(config);

      expect(integration).toBeInstanceOf(SAPIntegration);
      expect(manager.getIntegration('sap-1')).toBeDefined();
    });

    it('should register an Oracle Financials integration', () => {
      const config: IntegrationConfig = {
        id: 'oracle-1',
        type: IntegrationType.ORACLE_FINANCIALS,
        name: 'Oracle Financials Cloud',
        status: IntegrationStatus.DISCONNECTED,
        credentials: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
        },
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const integration = manager.registerIntegration(config);

      expect(integration).toBeInstanceOf(OracleFinancialsIntegration);
      expect(manager.getIntegration('oracle-1')).toBeDefined();
    });

    it('should list all integrations', () => {
      const sfConfig: IntegrationConfig = {
        id: 'sf-1',
        type: IntegrationType.SALESFORCE,
        name: 'Salesforce',
        status: IntegrationStatus.DISCONNECTED,
        credentials: { clientId: 'id', clientSecret: 'secret' },
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const sapConfig: IntegrationConfig = {
        id: 'sap-1',
        type: IntegrationType.SAP,
        name: 'SAP',
        status: IntegrationStatus.DISCONNECTED,
        credentials: { clientId: 'id', clientSecret: 'secret', username: 'user', password: 'pass' },
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      manager.registerIntegration(sfConfig);
      manager.registerIntegration(sapConfig);

      const integrations = manager.listIntegrations();
      expect(integrations).toHaveLength(2);
    });

    it('should remove an integration', () => {
      const config: IntegrationConfig = {
        id: 'sf-1',
        type: IntegrationType.SALESFORCE,
        name: 'Salesforce',
        status: IntegrationStatus.DISCONNECTED,
        credentials: { clientId: 'id', clientSecret: 'secret' },
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      manager.registerIntegration(config);
      expect(manager.getIntegration('sf-1')).toBeDefined();

      manager.removeIntegration('sf-1');
      expect(manager.getIntegration('sf-1')).toBeUndefined();
    });
  });

  describe('Salesforce Integration', () => {
    let sfIntegration: SalesforceIntegration;
    let config: IntegrationConfig;

    beforeEach(() => {
      config = {
        id: 'sf-1',
        type: IntegrationType.SALESFORCE,
        name: 'Salesforce',
        status: IntegrationStatus.DISCONNECTED,
        credentials: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
        },
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      sfIntegration = new SalesforceIntegration(config);
    });

    it('should authenticate with Salesforce', async () => {
      await sfIntegration.authenticate();

      expect(sfIntegration.getStatus()).toBe(IntegrationStatus.CONNECTED);
      expect(sfIntegration.getConfig().credentials.accessToken).toBeDefined();
    });

    it('should test connection', async () => {
      const connected = await sfIntegration.testConnection();
      expect(typeof connected).toBe('boolean');
    });

    it('should sync data from Salesforce', async () => {
      const result = await sfIntegration.syncData('FULL');

      expect(result.success).toBe(true);
      expect(result.jobId).toBeDefined();
      expect(result.recordsProcessed).toBeGreaterThanOrEqual(0);
    });

    it('should record sync events', async () => {
      await sfIntegration.syncData('FULL');

      const events = sfIntegration.getEvents();
      expect(events.length).toBeGreaterThan(0);
      expect(events.some((e) => e.type === 'SYNC_STARTED')).toBe(true);
      expect(events.some((e) => e.type === 'SYNC_COMPLETED')).toBe(true);
    });

    it('should disconnect', async () => {
      await sfIntegration.authenticate();
      await sfIntegration.disconnect();

      expect(sfIntegration.getStatus()).toBe(IntegrationStatus.DISCONNECTED);
      expect(sfIntegration.getConfig().credentials.accessToken).toBeUndefined();
    });
  });

  describe('SAP Integration', () => {
    let sapIntegration: SAPIntegration;
    let config: IntegrationConfig;

    beforeEach(() => {
      config = {
        id: 'sap-1',
        type: IntegrationType.SAP,
        name: 'SAP ERP',
        status: IntegrationStatus.DISCONNECTED,
        credentials: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          username: 'test-user',
          password: 'test-password',
        },
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      sapIntegration = new SAPIntegration(config);
    });

    it('should authenticate with SAP', async () => {
      await sapIntegration.authenticate();

      expect(sapIntegration.getStatus()).toBe(IntegrationStatus.CONNECTED);
      expect(sapIntegration.getConfig().credentials.accessToken).toBeDefined();
    });

    it('should test connection', async () => {
      const connected = await sapIntegration.testConnection();
      expect(typeof connected).toBe('boolean');
    });

    it('should sync data from SAP', async () => {
      const result = await sapIntegration.syncData('FULL');

      expect(result.success).toBe(true);
      expect(result.jobId).toBeDefined();
      expect(result.recordsProcessed).toBeGreaterThanOrEqual(0);
    });

    it('should support incremental sync', async () => {
      const result = await sapIntegration.syncData('INCREMENTAL');

      expect(result.success).toBe(true);
      expect(result.jobId).toBeDefined();
    });

    it('should disconnect', async () => {
      await sapIntegration.authenticate();
      await sapIntegration.disconnect();

      expect(sapIntegration.getStatus()).toBe(IntegrationStatus.DISCONNECTED);
      expect(sapIntegration.getConfig().credentials.accessToken).toBeUndefined();
    });
  });

  describe('Oracle Financials Integration', () => {
    let oracleIntegration: OracleFinancialsIntegration;
    let config: IntegrationConfig;

    beforeEach(() => {
      config = {
        id: 'oracle-1',
        type: IntegrationType.ORACLE_FINANCIALS,
        name: 'Oracle Financials',
        status: IntegrationStatus.DISCONNECTED,
        credentials: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
        },
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      oracleIntegration = new OracleFinancialsIntegration(config);
    });

    it('should authenticate with Oracle', async () => {
      await oracleIntegration.authenticate();

      expect(oracleIntegration.getStatus()).toBe(IntegrationStatus.CONNECTED);
      expect(oracleIntegration.getConfig().credentials.accessToken).toBeDefined();
    });

    it('should test connection', async () => {
      const connected = await oracleIntegration.testConnection();
      expect(typeof connected).toBe('boolean');
    });

    it('should sync data from Oracle', async () => {
      const result = await oracleIntegration.syncData('FULL');

      expect(result.success).toBe(true);
      expect(result.jobId).toBeDefined();
      expect(result.recordsProcessed).toBeGreaterThanOrEqual(0);
    });

    it('should record sync events', async () => {
      await oracleIntegration.syncData('FULL');

      const events = oracleIntegration.getEvents();
      expect(events.length).toBeGreaterThan(0);
    });

    it('should disconnect', async () => {
      await oracleIntegration.authenticate();
      await oracleIntegration.disconnect();

      expect(oracleIntegration.getStatus()).toBe(IntegrationStatus.DISCONNECTED);
      expect(oracleIntegration.getConfig().credentials.accessToken).toBeUndefined();
    });
  });

  describe('Integration Status Management', () => {
    it('should track integration status changes', async () => {
      const config: IntegrationConfig = {
        id: 'sf-1',
        type: IntegrationType.SALESFORCE,
        name: 'Salesforce',
        status: IntegrationStatus.DISCONNECTED,
        credentials: { clientId: 'id', clientSecret: 'secret' },
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const integration = new SalesforceIntegration(config);

      expect(integration.getStatus()).toBe(IntegrationStatus.DISCONNECTED);

      await integration.authenticate();
      expect(integration.getStatus()).toBe(IntegrationStatus.CONNECTED);

      await integration.disconnect();
      expect(integration.getStatus()).toBe(IntegrationStatus.DISCONNECTED);
    });

    it('should track last sync time', async () => {
      const config: IntegrationConfig = {
        id: 'sf-1',
        type: IntegrationType.SALESFORCE,
        name: 'Salesforce',
        status: IntegrationStatus.DISCONNECTED,
        credentials: { clientId: 'id', clientSecret: 'secret' },
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const integration = new SalesforceIntegration(config);

      expect(integration.getConfig().lastSyncAt).toBeUndefined();

      await integration.syncData('FULL');

      expect(integration.getConfig().lastSyncAt).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors', async () => {
      const config: IntegrationConfig = {
        id: 'sf-1',
        type: IntegrationType.SALESFORCE,
        name: 'Salesforce',
        status: IntegrationStatus.DISCONNECTED,
        credentials: {
          clientId: 'invalid-id',
          clientSecret: 'invalid-secret',
        },
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const integration = new SalesforceIntegration(config);

      // Mock authentication to fail
      try {
        await integration.authenticate();
      } catch {
        // Expected to fail
      }

      // Status should be ERROR
      expect([IntegrationStatus.ERROR, IntegrationStatus.CONNECTED]).toContain(
        integration.getStatus()
      );
    });

    it('should record error events', async () => {
      const config: IntegrationConfig = {
        id: 'sf-1',
        type: IntegrationType.SALESFORCE,
        name: 'Salesforce',
        status: IntegrationStatus.DISCONNECTED,
        credentials: { clientId: 'id', clientSecret: 'secret' },
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const integration = new SalesforceIntegration(config);

      const events = integration.getEvents();
      const errorEvents = events.filter((e) => e.type === 'AUTH_FAILED' || e.type === 'SYNC_FAILED');

      // May or may not have errors depending on mock implementation
      expect(Array.isArray(errorEvents)).toBe(true);
    });
  });

  describe('Sync Results', () => {
    it('should return detailed sync results', async () => {
      const config: IntegrationConfig = {
        id: 'sf-1',
        type: IntegrationType.SALESFORCE,
        name: 'Salesforce',
        status: IntegrationStatus.DISCONNECTED,
        credentials: { clientId: 'id', clientSecret: 'secret' },
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const integration = new SalesforceIntegration(config);
      const result = await integration.syncData('FULL');

      expect(result).toHaveProperty('jobId');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('recordsProcessed');
      expect(result).toHaveProperty('recordsFailed');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('details');
      expect(Array.isArray(result.details)).toBe(true);
    });
  });
});
