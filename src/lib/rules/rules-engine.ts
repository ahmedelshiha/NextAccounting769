import { z } from 'zod';
import { logger } from '@/lib/logger';

/**
 * Rules Engine
 * 
 * Provides rule definition language, evaluation engine, decision tables,
 * versioning, and rollback capabilities.
 */

// ============================================================================
// Type Definitions
// ============================================================================

export enum RuleStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum RuleType {
  SIMPLE = 'SIMPLE',
  COMPLEX = 'COMPLEX',
  DECISION_TABLE = 'DECISION_TABLE',
}

export interface Rule {
  id: string;
  name: string;
  description?: string;
  type: RuleType;
  status: RuleStatus;
  version: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  evaluationCount?: number;
  successCount?: number;
}

export interface RuleCondition {
  id: string;
  field: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual' | 'contains' | 'in' | 'between' | 'regex';
  value: any;
  logicalOperator?: 'AND' | 'OR'; // for combining with next condition
}

export interface RuleAction {
  id: string;
  type: 'SET' | 'CALL' | 'NOTIFY' | 'ESCALATE' | 'TRANSFORM';
  target: string;
  value?: any;
  parameters?: Record<string, any>;
}

export interface DecisionTable {
  id: string;
  name: string;
  description?: string;
  version: string;
  status: RuleStatus;
  inputs: DecisionTableInput[];
  outputs: DecisionTableOutput[];
  rows: DecisionTableRow[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface DecisionTableInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  description?: string;
}

export interface DecisionTableOutput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  description?: string;
}

export interface DecisionTableRow {
  id: string;
  conditions: Record<string, any>;
  outputs: Record<string, any>;
  priority: number;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  actions: RuleAction[];
  evaluationTime: number; // in milliseconds
  metadata?: Record<string, any>;
}

export interface RuleEvaluationTrace {
  ruleId: string;
  timestamp: Date;
  input: Record<string, any>;
  result: RuleEvaluationResult;
  executionTime: number;
}

export interface RuleVersion {
  id: string;
  ruleId: string;
  version: string;
  rule: Rule;
  createdAt: Date;
  createdBy: string;
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const RuleSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.nativeEnum(RuleType),
  status: z.nativeEnum(RuleStatus),
  version: z.string(),
  conditions: z.array(z.object({
    id: z.string(),
    field: z.string(),
    operator: z.enum(['equals', 'notEquals', 'greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual', 'contains', 'in', 'between', 'regex']),
    value: z.any(),
  })),
  actions: z.array(z.object({
    id: z.string(),
    type: z.enum(['SET', 'CALL', 'NOTIFY', 'ESCALATE', 'TRANSFORM']),
    target: z.string(),
    value: z.any().optional(),
  })),
  priority: z.number(),
});

// ============================================================================
// Rules Engine
// ============================================================================

export class RulesEngine {
  private rules = new Map<string, Rule>();
  private decisionTables = new Map<string, DecisionTable>();
  private ruleVersions = new Map<string, RuleVersion[]>();
  private evaluationTraces: RuleEvaluationTrace[] = [];
  private maxTraces = 10000; // Keep last N traces

  /**
   * Create a new rule
   */
  createRule(rule: Omit<Rule, 'createdAt' | 'updatedAt' | 'evaluationCount' | 'successCount'>): Rule {
    const newRule: Rule = {
      ...rule,
      createdAt: new Date(),
      updatedAt: new Date(),
      evaluationCount: 0,
      successCount: 0,
    };

    // Validate rule
    const validation = RuleSchema.safeParse(newRule);
    if (!validation.success) {
      throw new Error(`Invalid rule: ${validation.error.message}`);
    }

    this.rules.set(rule.id, newRule);
    this.storeRuleVersion(newRule);
    logger.info('Rule created', { ruleId: rule.id, name: rule.name });

    return newRule;
  }

  /**
   * Get a rule
   */
  getRule(ruleId: string): Rule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * List all rules with optional filtering
   */
  listRules(status?: RuleStatus, tags?: string[]): Rule[] {
    const allRules = Array.from(this.rules.values());

    let filtered = allRules;

    if (status) {
      filtered = filtered.filter((r) => r.status === status);
    }

    if (tags && tags.length > 0) {
      filtered = filtered.filter((r) =>
        tags.some((tag) => r.tags?.includes(tag))
      );
    }

    // Sort by priority (higher priority first)
    return filtered.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Update a rule
   */
  updateRule(ruleId: string, updates: Partial<Rule>): Rule {
    const existing = this.getRule(ruleId);
    if (!existing) {
      throw new Error(`Rule not found: ${ruleId}`);
    }

    const updated: Rule = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    this.rules.set(ruleId, updated);
    this.storeRuleVersion(updated);
    logger.info('Rule updated', { ruleId });

    return updated;
  }

  /**
   * Evaluate a rule against input data
   */
  evaluateRule(ruleId: string, data: Record<string, any>): RuleEvaluationResult {
    const rule = this.getRule(ruleId);
    if (!rule) {
      throw new Error(`Rule not found: ${ruleId}`);
    }

    if (rule.status !== RuleStatus.ACTIVE) {
      return {
        ruleId,
        ruleName: rule.name,
        matched: false,
        actions: [],
        evaluationTime: 0,
      };
    }

    const startTime = Date.now();
    const matched = this.evaluateConditions(rule.conditions, data);
    const evaluationTime = Date.now() - startTime;

    // Update statistics
    const updatedRule = this.getRule(ruleId)!;
    updatedRule.evaluationCount = (updatedRule.evaluationCount || 0) + 1;
    if (matched) {
      updatedRule.successCount = (updatedRule.successCount || 0) + 1;
    }
    this.rules.set(ruleId, updatedRule);

    // Record trace
    this.recordTrace({
      ruleId,
      timestamp: new Date(),
      input: data,
      result: {
        ruleId,
        ruleName: rule.name,
        matched,
        actions: matched ? rule.actions : [],
        evaluationTime,
      },
      executionTime: evaluationTime,
    });

    return {
      ruleId,
      ruleName: rule.name,
      matched,
      actions: matched ? rule.actions : [],
      evaluationTime,
    };
  }

  /**
   * Evaluate multiple rules and return all matching actions
   */
  evaluateRules(data: Record<string, any>, ruleIds?: string[]): RuleEvaluationResult[] {
    const rulesToEvaluate = ruleIds
      ? ruleIds.map((id) => this.getRule(id)).filter((r) => r !== undefined) as Rule[]
      : this.listRules(RuleStatus.ACTIVE);

    const results = rulesToEvaluate.map((rule) =>
      this.evaluateRule(rule.id, data)
    );

    return results.filter((r) => r.matched);
  }

  /**
   * Create a decision table
   */
  createDecisionTable(table: Omit<DecisionTable, 'createdAt' | 'updatedAt'>): DecisionTable {
    const newTable: DecisionTable = {
      ...table,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.decisionTables.set(table.id, newTable);
    logger.info('Decision table created', { tableId: table.id, name: table.name });

    return newTable;
  }

  /**
   * Get a decision table
   */
  getDecisionTable(tableId: string): DecisionTable | undefined {
    return this.decisionTables.get(tableId);
  }

  /**
   * Evaluate a decision table
   */
  evaluateDecisionTable(tableId: string, data: Record<string, any>): Record<string, any> | null {
    const table = this.getDecisionTable(tableId);
    if (!table) {
      throw new Error(`Decision table not found: ${tableId}`);
    }

    // Find matching rows (sorted by priority)
    const matchingRows = table.rows
      .filter((row) => this.matchesConditions(row.conditions, data))
      .sort((a, b) => b.priority - a.priority);

    if (matchingRows.length === 0) {
      return null;
    }

    // Return outputs from the highest priority matching row
    return matchingRows[0].outputs;
  }

  /**
   * Get rule versions
   */
  getRuleVersions(ruleId: string): RuleVersion[] {
    return this.ruleVersions.get(ruleId) || [];
  }

  /**
   * Rollback to a previous rule version
   */
  rollbackToVersion(ruleId: string, version: string): Rule {
    const versions = this.getRuleVersions(ruleId);
    const versionRecord = versions.find((v) => v.version === version);

    if (!versionRecord) {
      throw new Error(`Rule version not found: ${version}`);
    }

    const restoredRule: Rule = {
      ...versionRecord.rule,
      updatedAt: new Date(),
    };

    this.rules.set(ruleId, restoredRule);
    this.storeRuleVersion(restoredRule);
    logger.info('Rule rolled back', { ruleId, version });

    return restoredRule;
  }

  /**
   * Get evaluation traces
   */
  getEvaluationTraces(ruleId?: string, limit: number = 100): RuleEvaluationTrace[] {
    let traces = this.evaluationTraces;

    if (ruleId) {
      traces = traces.filter((t) => t.ruleId === ruleId);
    }

    return traces.slice(-limit);
  }

  /**
   * Simulate rule evaluation
   */
  simulateRuleEvaluation(ruleId: string, testData: Record<string, any>[]): Array<{
    input: Record<string, any>;
    result: RuleEvaluationResult;
  }> {
    const rule = this.getRule(ruleId);
    if (!rule) {
      throw new Error(`Rule not found: ${ruleId}`);
    }

    return testData.map((data) => ({
      input: data,
      result: this.evaluateRule(ruleId, data),
    }));
  }

  /**
   * Get rule statistics
   */
  getRuleStatistics(ruleId: string): {
    evaluationCount: number;
    successCount: number;
    successRate: number;
    averageEvaluationTime: number;
  } {
    const rule = this.getRule(ruleId);
    if (!rule) {
      throw new Error(`Rule not found: ${ruleId}`);
    }

    const traces = this.getEvaluationTraces(ruleId);
    const evaluationCount = rule.evaluationCount || 0;
    const successCount = rule.successCount || 0;
    const successRate = evaluationCount > 0 ? (successCount / evaluationCount) * 100 : 0;

    const averageEvaluationTime =
      traces.length > 0
        ? traces.reduce((sum, t) => sum + t.executionTime, 0) / traces.length
        : 0;

    return {
      evaluationCount,
      successCount,
      successRate,
      averageEvaluationTime,
    };
  }

  /**
   * Evaluate conditions
   */
  private evaluateConditions(conditions: RuleCondition[], data: Record<string, any>): boolean {
    if (conditions.length === 0) {
      return true;
    }

    let result = this.evaluateCondition(conditions[0], data);

    for (let i = 1; i < conditions.length; i++) {
      const logicalOp = conditions[i - 1].logicalOperator || 'AND';
      const nextResult = this.evaluateCondition(conditions[i], data);

      if (logicalOp === 'AND') {
        result = result && nextResult;
      } else if (logicalOp === 'OR') {
        result = result || nextResult;
      }
    }

    return result;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: RuleCondition, data: Record<string, any>): boolean {
    const fieldValue = data[condition.field];

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'notEquals':
        return fieldValue !== condition.value;
      case 'greaterThan':
        return fieldValue > condition.value;
      case 'lessThan':
        return fieldValue < condition.value;
      case 'greaterThanOrEqual':
        return fieldValue >= condition.value;
      case 'lessThanOrEqual':
        return fieldValue <= condition.value;
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'between':
        return (
          Array.isArray(condition.value) &&
          condition.value.length === 2 &&
          fieldValue >= condition.value[0] &&
          fieldValue <= condition.value[1]
        );
      case 'regex':
        return new RegExp(condition.value).test(String(fieldValue));
      default:
        return false;
    }
  }

  /**
   * Match conditions against data
   */
  private matchesConditions(conditions: Record<string, any>, data: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      if (data[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Store rule version
   */
  private storeRuleVersion(rule: Rule): void {
    const versions = this.ruleVersions.get(rule.id) || [];
    versions.push({
      id: `version-${rule.id}-${rule.version}`,
      ruleId: rule.id,
      version: rule.version,
      rule: { ...rule },
      createdAt: new Date(),
      createdBy: rule.createdBy,
    });
    this.ruleVersions.set(rule.id, versions);
  }

  /**
   * Record evaluation trace
   */
  private recordTrace(trace: RuleEvaluationTrace): void {
    this.evaluationTraces.push(trace);

    // Keep only the last N traces
    if (this.evaluationTraces.length > this.maxTraces) {
      this.evaluationTraces = this.evaluationTraces.slice(-this.maxTraces);
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const rulesEngine = new RulesEngine();
