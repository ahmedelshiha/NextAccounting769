import { z } from 'zod';
import { logger } from '@/lib/logger';

/**
 * External Integrations Module
 * 
 * Provides connectors for Salesforce, SAP, and Oracle Financials
 * with authentication, data synchronization, and error handling.
 */

// ============================================================================
// Type Definitions
// ============================================================================

export enum IntegrationStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
  AUTHENTICATING = 'AUTHENTICATING',
}

export enum IntegrationType {
  SALESFORCE = 'SALESFORCE',
  SAP = 'SAP',
  ORACLE_FINANCIALS = 'ORACLE_FINANCIALS',
}

export interface IntegrationConfig {
  id: string;
  type: IntegrationType;
  name: string;
  status: IntegrationStatus;
  credentials: IntegrationCredentials;
  settings: Record<string, any>;
  lastSyncAt?: Date;
  lastErrorAt?: Date;
  lastErrorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationCredentials {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  endpoint?: string;
  username?: string;
  password?: string;
}

export interface SyncJob {
  id: string;
  integrationId: string;
  type: 'FULL' | 'INCREMENTAL';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  recordsProcessed: number;
  recordsFailed: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface SyncResult {
  jobId: string;
  success: boolean;
  recordsProcessed: number;
  recordsFailed: number;
  duration: number; // in milliseconds
  details: Array<{
    id: string;
    status: 'SUCCESS' | 'FAILED';
    error?: string;
  }>;
}

export interface SalesforceAccount {
  id: string;
  name: string;
  industry: string;
  revenue: number;
  employees: number;
  website: string;
  phone: string;
  email: string;
  billingCity: string;
  billingCountry: string;
  lastModifiedDate: Date;
}

export interface SAPCompany {
  id: string;
  code: string;
  name: string;
  country: string;
  currency: string;
  taxId: string;
  fiscalYearStart: string;
  lastModifiedDate: Date;
}

export interface OracleEntity {
  id: string;
  code: string;
  name: string;
  legalEntity: string;
  country: string;
  currency: string;
  taxId: string;
  lastModifiedDate: Date;
}

export interface IntegrationEvent {
  id: string;
  integrationId: string;
  type: 'SYNC_STARTED' | 'SYNC_COMPLETED' | 'SYNC_FAILED' | 'AUTH_FAILED' | 'DATA_RECEIVED';
  timestamp: Date;
  data?: Record<string, any>;
  error?: string;
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const IntegrationConfigSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(IntegrationType),
  name: z.string().min(1),
  status: z.nativeEnum(IntegrationStatus),
  credentials: z.object({
    clientId: z.string(),
    clientSecret: z.string(),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    expiresAt: z.date().optional(),
    endpoint: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
  }),
  settings: z.record(z.any()).optional(),
});

// ============================================================================
// Base Integration Class
// ============================================================================

export abstract class BaseIntegration {
  protected config: IntegrationConfig;
  protected events: IntegrationEvent[] = [];
  protected maxEvents = 1000;

  constructor(config: IntegrationConfig) {
    this.config = config;
  }

  abstract authenticate(): Promise<void>;
  abstract testConnection(): Promise<boolean>;
  abstract syncData(type: 'FULL' | 'INCREMENTAL'): Promise<SyncResult>;
  abstract disconnect(): Promise<void>;

  /**
   * Get integration status
   */
  getStatus(): IntegrationStatus {
    return this.config.status;
  }

  /**
   * Get integration config
   */
  getConfig(): IntegrationConfig {
    return this.config;
  }

  /**
   * Record integration event
   */
  protected recordEvent(event: Omit<IntegrationEvent, 'id' | 'timestamp'>): void {
    const newEvent: IntegrationEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
    };

    this.events.push(newEvent);

    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  /**
   * Get integration events
   */
  getEvents(limit: number = 100): IntegrationEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Update status
   */
  protected updateStatus(status: IntegrationStatus, error?: string): void {
    this.config.status = status;
    this.config.updatedAt = new Date();

    if (error) {
      this.config.lastErrorAt = new Date();
      this.config.lastErrorMessage = error;
    }
  }
}

// ============================================================================
// Salesforce Integration
// ============================================================================

export class SalesforceIntegration extends BaseIntegration {
  private baseUrl = 'https://api.salesforce.com';

  async authenticate(): Promise<void> {
    try {
      this.recordEvent({
        integrationId: this.config.id,
        type: 'SYNC_STARTED',
      });

      this.updateStatus(IntegrationStatus.AUTHENTICATING);

      // Simulate OAuth flow
      const response = await this.makeRequest('/services/oauth2/token', 'POST', {
        grant_type: 'client_credentials',
        client_id: this.config.credentials.clientId,
        client_secret: this.config.credentials.clientSecret,
      });

      this.config.credentials.accessToken = response.access_token;
      this.config.credentials.expiresAt = new Date(Date.now() + response.expires_in * 1000);

      this.updateStatus(IntegrationStatus.CONNECTED);
      logger.info('Salesforce authentication successful', { integrationId: this.config.id });
    } catch (error) {
      this.updateStatus(IntegrationStatus.ERROR, String(error));
      this.recordEvent({
        integrationId: this.config.id,
        type: 'AUTH_FAILED',
        error: String(error),
      });
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/services/data/v57.0/sobjects/Account/describe', 'GET');
      return response && response.name === 'Account';
    } catch {
      return false;
    }
  }

  async syncData(type: 'FULL' | 'INCREMENTAL'): Promise<SyncResult> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const startTime = Date.now();

    try {
      this.recordEvent({
        integrationId: this.config.id,
        type: 'SYNC_STARTED',
        data: { jobId, type },
      });

      // Fetch accounts from Salesforce
      const query = type === 'FULL'
        ? "SELECT Id, Name, Industry, AnnualRevenue, NumberOfEmployees, Website, Phone, Email, BillingCity, BillingCountry, LastModifiedDate FROM Account"
        : `SELECT Id, Name, Industry, AnnualRevenue, NumberOfEmployees, Website, Phone, Email, BillingCity, BillingCountry, LastModifiedDate FROM Account WHERE LastModifiedDate > ${this.config.lastSyncAt?.toISOString()}`;

      const response = await this.makeRequest('/services/data/v57.0/query', 'GET', { q: query });
      const accounts = response.records || [];

      const details = accounts.map((account: any) => ({
        id: account.Id,
        status: 'SUCCESS' as const,
      }));

      const duration = Date.now() - startTime;

      this.config.lastSyncAt = new Date();
      this.updateStatus(IntegrationStatus.CONNECTED);

      this.recordEvent({
        integrationId: this.config.id,
        type: 'SYNC_COMPLETED',
        data: { jobId, recordsProcessed: accounts.length },
      });

      logger.info('Salesforce sync completed', {
        integrationId: this.config.id,
        recordsProcessed: accounts.length,
      });

      return {
        jobId,
        success: true,
        recordsProcessed: accounts.length,
        recordsFailed: 0,
        duration,
        details,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateStatus(IntegrationStatus.ERROR, String(error));

      this.recordEvent({
        integrationId: this.config.id,
        type: 'SYNC_FAILED',
        error: String(error),
      });

      logger.error('Salesforce sync failed', { integrationId: this.config.id, error });

      return {
        jobId,
        success: false,
        recordsProcessed: 0,
        recordsFailed: 0,
        duration,
        details: [],
      };
    }
  }

  async disconnect(): Promise<void> {
    this.config.credentials.accessToken = undefined;
    this.config.credentials.refreshToken = undefined;
    this.updateStatus(IntegrationStatus.DISCONNECTED);
    logger.info('Salesforce disconnected', { integrationId: this.config.id });
  }

  private async makeRequest(
    endpoint: string,
    method: string,
    data?: Record<string, any>
  ): Promise<any> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.config.credentials.accessToken ? `Bearer ${this.config.credentials.accessToken}` : '',
        },
      };

      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`Salesforce API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Salesforce API request failed', { endpoint, method, error });
      throw error;
    }
  }
}

// ============================================================================
// SAP Integration
// ============================================================================

export class SAPIntegration extends BaseIntegration {
  private baseUrl = 'https://api.sap.com';

  async authenticate(): Promise<void> {
    try {
      this.recordEvent({
        integrationId: this.config.id,
        type: 'SYNC_STARTED',
      });

      this.updateStatus(IntegrationStatus.AUTHENTICATING);

      // Simulate Basic Auth
      const credentials = Buffer.from(
        `${this.config.credentials.username}:${this.config.credentials.password}`
      ).toString('base64');

      const response = await this.makeRequest('/auth/oauth/token', 'POST', {
        grant_type: 'client_credentials',
        client_id: this.config.credentials.clientId,
        client_secret: this.config.credentials.clientSecret,
      });

      this.config.credentials.accessToken = response.access_token;
      this.config.credentials.expiresAt = new Date(Date.now() + response.expires_in * 1000);

      this.updateStatus(IntegrationStatus.CONNECTED);
      logger.info('SAP authentication successful', { integrationId: this.config.id });
    } catch (error) {
      this.updateStatus(IntegrationStatus.ERROR, String(error));
      this.recordEvent({
        integrationId: this.config.id,
        type: 'AUTH_FAILED',
        error: String(error),
      });
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/api/v1/companies', 'GET');
      return response && Array.isArray(response.companies);
    } catch {
      return false;
    }
  }

  async syncData(type: 'FULL' | 'INCREMENTAL'): Promise<SyncResult> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const startTime = Date.now();

    try {
      this.recordEvent({
        integrationId: this.config.id,
        type: 'SYNC_STARTED',
        data: { jobId, type },
      });

      // Fetch companies from SAP
      const response = await this.makeRequest('/api/v1/companies', 'GET', {
        $filter: type === 'INCREMENTAL' ? `LastModifiedDate gt ${this.config.lastSyncAt?.toISOString()}` : undefined,
      });

      const companies = response.companies || [];
      const details = companies.map((company: any) => ({
        id: company.CompanyCode,
        status: 'SUCCESS' as const,
      }));

      const duration = Date.now() - startTime;

      this.config.lastSyncAt = new Date();
      this.updateStatus(IntegrationStatus.CONNECTED);

      this.recordEvent({
        integrationId: this.config.id,
        type: 'SYNC_COMPLETED',
        data: { jobId, recordsProcessed: companies.length },
      });

      logger.info('SAP sync completed', {
        integrationId: this.config.id,
        recordsProcessed: companies.length,
      });

      return {
        jobId,
        success: true,
        recordsProcessed: companies.length,
        recordsFailed: 0,
        duration,
        details,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateStatus(IntegrationStatus.ERROR, String(error));

      this.recordEvent({
        integrationId: this.config.id,
        type: 'SYNC_FAILED',
        error: String(error),
      });

      logger.error('SAP sync failed', { integrationId: this.config.id, error });

      return {
        jobId,
        success: false,
        recordsProcessed: 0,
        recordsFailed: 0,
        duration,
        details: [],
      };
    }
  }

  async disconnect(): Promise<void> {
    this.config.credentials.accessToken = undefined;
    this.updateStatus(IntegrationStatus.DISCONNECTED);
    logger.info('SAP disconnected', { integrationId: this.config.id });
  }

  private async makeRequest(
    endpoint: string,
    method: string,
    data?: Record<string, any>
  ): Promise<any> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const auth = Buffer.from(
        `${this.config.credentials.username}:${this.config.credentials.password}`
      ).toString('base64');

      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
        },
      };

      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`SAP API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('SAP API request failed', { endpoint, method, error });
      throw error;
    }
  }
}

// ============================================================================
// Oracle Financials Integration
// ============================================================================

export class OracleFinancialsIntegration extends BaseIntegration {
  private baseUrl = 'https://api.oracle.com';

  async authenticate(): Promise<void> {
    try {
      this.recordEvent({
        integrationId: this.config.id,
        type: 'SYNC_STARTED',
      });

      this.updateStatus(IntegrationStatus.AUTHENTICATING);

      // Simulate OAuth flow
      const response = await this.makeRequest('/auth/oauth2/token', 'POST', {
        grant_type: 'client_credentials',
        client_id: this.config.credentials.clientId,
        client_secret: this.config.credentials.clientSecret,
      });

      this.config.credentials.accessToken = response.access_token;
      this.config.credentials.expiresAt = new Date(Date.now() + response.expires_in * 1000);

      this.updateStatus(IntegrationStatus.CONNECTED);
      logger.info('Oracle Financials authentication successful', { integrationId: this.config.id });
    } catch (error) {
      this.updateStatus(IntegrationStatus.ERROR, String(error));
      this.recordEvent({
        integrationId: this.config.id,
        type: 'AUTH_FAILED',
        error: String(error),
      });
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/api/v1/legalEntities', 'GET');
      return response && Array.isArray(response.items);
    } catch {
      return false;
    }
  }

  async syncData(type: 'FULL' | 'INCREMENTAL'): Promise<SyncResult> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const startTime = Date.now();

    try {
      this.recordEvent({
        integrationId: this.config.id,
        type: 'SYNC_STARTED',
        data: { jobId, type },
      });

      // Fetch legal entities from Oracle
      const response = await this.makeRequest('/api/v1/legalEntities', 'GET', {
        limit: 1000,
        offset: 0,
      });

      const entities = response.items || [];
      const details = entities.map((entity: any) => ({
        id: entity.LegalEntityId,
        status: 'SUCCESS' as const,
      }));

      const duration = Date.now() - startTime;

      this.config.lastSyncAt = new Date();
      this.updateStatus(IntegrationStatus.CONNECTED);

      this.recordEvent({
        integrationId: this.config.id,
        type: 'SYNC_COMPLETED',
        data: { jobId, recordsProcessed: entities.length },
      });

      logger.info('Oracle Financials sync completed', {
        integrationId: this.config.id,
        recordsProcessed: entities.length,
      });

      return {
        jobId,
        success: true,
        recordsProcessed: entities.length,
        recordsFailed: 0,
        duration,
        details,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateStatus(IntegrationStatus.ERROR, String(error));

      this.recordEvent({
        integrationId: this.config.id,
        type: 'SYNC_FAILED',
        error: String(error),
      });

      logger.error('Oracle Financials sync failed', { integrationId: this.config.id, error });

      return {
        jobId,
        success: false,
        recordsProcessed: 0,
        recordsFailed: 0,
        duration,
        details: [],
      };
    }
  }

  async disconnect(): Promise<void> {
    this.config.credentials.accessToken = undefined;
    this.config.credentials.refreshToken = undefined;
    this.updateStatus(IntegrationStatus.DISCONNECTED);
    logger.info('Oracle Financials disconnected', { integrationId: this.config.id });
  }

  private async makeRequest(
    endpoint: string,
    method: string,
    data?: Record<string, any>
  ): Promise<any> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.config.credentials.accessToken ? `Bearer ${this.config.credentials.accessToken}` : '',
          'Accept': 'application/json',
        },
      };

      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`Oracle Financials API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Oracle Financials API request failed', { endpoint, method, error });
      throw error;
    }
  }
}

// ============================================================================
// Integration Manager
// ============================================================================

export class IntegrationManager {
  private integrations = new Map<string, BaseIntegration>();

  /**
   * Register an integration
   */
  registerIntegration(config: IntegrationConfig): BaseIntegration {
    let integration: BaseIntegration;

    switch (config.type) {
      case IntegrationType.SALESFORCE:
        integration = new SalesforceIntegration(config);
        break;
      case IntegrationType.SAP:
        integration = new SAPIntegration(config);
        break;
      case IntegrationType.ORACLE_FINANCIALS:
        integration = new OracleFinancialsIntegration(config);
        break;
      default:
        throw new Error(`Unknown integration type: ${config.type}`);
    }

    this.integrations.set(config.id, integration);
    logger.info('Integration registered', { integrationId: config.id, type: config.type });

    return integration;
  }

  /**
   * Get an integration
   */
  getIntegration(integrationId: string): BaseIntegration | undefined {
    return this.integrations.get(integrationId);
  }

  /**
   * List all integrations
   */
  listIntegrations(): BaseIntegration[] {
    return Array.from(this.integrations.values());
  }

  /**
   * Remove an integration
   */
  removeIntegration(integrationId: string): void {
    this.integrations.delete(integrationId);
    logger.info('Integration removed', { integrationId });
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const integrationManager = new IntegrationManager();
