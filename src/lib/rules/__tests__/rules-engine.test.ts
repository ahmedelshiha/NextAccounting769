import { describe, it, expect, beforeEach } from 'vitest';
import {
  RulesEngine,
  RuleStatus,
  RuleType,
  Rule,
  DecisionTable,
} from '../rules-engine';

describe('RulesEngine', () => {
  let engine: RulesEngine;

  beforeEach(() => {
    engine = new RulesEngine();
  });

  describe('Rule Management', () => {
    it('should create a rule', () => {
      const rule: Omit<Rule, 'createdAt' | 'updatedAt' | 'evaluationCount' | 'successCount'> = {
        id: 'rule-1',
        name: 'High Value Order',
        description: 'Apply discount for orders over $1000',
        type: RuleType.SIMPLE,
        status: RuleStatus.ACTIVE,
        version: '1.0',
        conditions: [
          {
            id: 'cond-1',
            field: 'orderAmount',
            operator: 'greaterThan',
            value: 1000,
          },
        ],
        actions: [
          {
            id: 'action-1',
            type: 'SET',
            target: 'discount',
            value: 0.1,
          },
        ],
        priority: 10,
        createdBy: 'user-1',
      };

      const created = engine.createRule(rule);

      expect(created.id).toBe('rule-1');
      expect(created.name).toBe('High Value Order');
      expect(created.status).toBe(RuleStatus.ACTIVE);
      expect(created.evaluationCount).toBe(0);
    });

    it('should retrieve a rule', () => {
      const rule: Omit<Rule, 'createdAt' | 'updatedAt' | 'evaluationCount' | 'successCount'> = {
        id: 'rule-1',
        name: 'Test Rule',
        type: RuleType.SIMPLE,
        status: RuleStatus.ACTIVE,
        version: '1.0',
        conditions: [],
        actions: [],
        priority: 1,
        createdBy: 'user-1',
      };

      engine.createRule(rule);
      const retrieved = engine.getRule('rule-1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test Rule');
    });

    it('should list rules', () => {
      const rule1: Omit<Rule, 'createdAt' | 'updatedAt' | 'evaluationCount' | 'successCount'> = {
        id: 'rule-1',
        name: 'Rule 1',
        type: RuleType.SIMPLE,
        status: RuleStatus.ACTIVE,
        version: '1.0',
        conditions: [],
        actions: [],
        priority: 10,
        createdBy: 'user-1',
      };

      const rule2: Omit<Rule, 'createdAt' | 'updatedAt' | 'evaluationCount' | 'successCount'> = {
        id: 'rule-2',
        name: 'Rule 2',
        type: RuleType.SIMPLE,
        status: RuleStatus.DRAFT,
        version: '1.0',
        conditions: [],
        actions: [],
        priority: 5,
        createdBy: 'user-1',
      };

      engine.createRule(rule1);
      engine.createRule(rule2);

      const all = engine.listRules();
      expect(all).toHaveLength(2);

      const active = engine.listRules(RuleStatus.ACTIVE);
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe('rule-1');
    });

    it('should update a rule', () => {
      const rule: Omit<Rule, 'createdAt' | 'updatedAt' | 'evaluationCount' | 'successCount'> = {
        id: 'rule-1',
        name: 'Original Name',
        type: RuleType.SIMPLE,
        status: RuleStatus.ACTIVE,
        version: '1.0',
        conditions: [],
        actions: [],
        priority: 1,
        createdBy: 'user-1',
      };

      engine.createRule(rule);
      const updated = engine.updateRule('rule-1', {
        name: 'Updated Name',
        status: RuleStatus.INACTIVE,
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.status).toBe(RuleStatus.INACTIVE);
    });
  });

  describe('Rule Evaluation', () => {
    beforeEach(() => {
      const rule: Omit<Rule, 'createdAt' | 'updatedAt' | 'evaluationCount' | 'successCount'> = {
        id: 'rule-1',
        name: 'High Value Order',
        type: RuleType.SIMPLE,
        status: RuleStatus.ACTIVE,
        version: '1.0',
        conditions: [
          {
            id: 'cond-1',
            field: 'orderAmount',
            operator: 'greaterThan',
            value: 1000,
          },
        ],
        actions: [
          {
            id: 'action-1',
            type: 'SET',
            target: 'discount',
            value: 0.1,
          },
        ],
        priority: 10,
        createdBy: 'user-1',
      };

      engine.createRule(rule);
    });

    it('should evaluate a rule that matches', () => {
      const result = engine.evaluateRule('rule-1', { orderAmount: 1500 });

      expect(result.matched).toBe(true);
      expect(result.actions).toHaveLength(1);
      expect(result.evaluationTime).toBeGreaterThanOrEqual(0);
    });

    it('should evaluate a rule that does not match', () => {
      const result = engine.evaluateRule('rule-1', { orderAmount: 500 });

      expect(result.matched).toBe(false);
      expect(result.actions).toHaveLength(0);
    });

    it('should update rule statistics on evaluation', () => {
      engine.evaluateRule('rule-1', { orderAmount: 1500 });
      engine.evaluateRule('rule-1', { orderAmount: 500 });

      const rule = engine.getRule('rule-1')!;
      expect(rule.evaluationCount).toBe(2);
      expect(rule.successCount).toBe(1);
    });

    it('should evaluate multiple rules', () => {
      const rule2: Omit<Rule, 'createdAt' | 'updatedAt' | 'evaluationCount' | 'successCount'> = {
        id: 'rule-2',
        name: 'Premium Customer',
        type: RuleType.SIMPLE,
        status: RuleStatus.ACTIVE,
        version: '1.0',
        conditions: [
          {
            id: 'cond-1',
            field: 'customerType',
            operator: 'equals',
            value: 'premium',
          },
        ],
        actions: [
          {
            id: 'action-1',
            type: 'SET',
            target: 'priority',
            value: 'high',
          },
        ],
        priority: 5,
        createdBy: 'user-1',
      };

      engine.createRule(rule2);

      const results = engine.evaluateRules({
        orderAmount: 1500,
        customerType: 'premium',
      });

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.matched)).toBe(true);
    });
  });

  describe('Condition Evaluation', () => {
    it('should evaluate equals operator', () => {
      const rule: Omit<Rule, 'createdAt' | 'updatedAt' | 'evaluationCount' | 'successCount'> = {
        id: 'rule-1',
        name: 'Test',
        type: RuleType.SIMPLE,
        status: RuleStatus.ACTIVE,
        version: '1.0',
        conditions: [
          {
            id: 'cond-1',
            field: 'status',
            operator: 'equals',
            value: 'active',
          },
        ],
        actions: [],
        priority: 1,
        createdBy: 'user-1',
      };

      engine.createRule(rule);

      const match = engine.evaluateRule('rule-1', { status: 'active' });
      const noMatch = engine.evaluateRule('rule-1', { status: 'inactive' });

      expect(match.matched).toBe(true);
      expect(noMatch.matched).toBe(false);
    });

    it('should evaluate contains operator', () => {
      const rule: Omit<Rule, 'createdAt' | 'updatedAt' | 'evaluationCount' | 'successCount'> = {
        id: 'rule-1',
        name: 'Test',
        type: RuleType.SIMPLE,
        status: RuleStatus.ACTIVE,
        version: '1.0',
        conditions: [
          {
            id: 'cond-1',
            field: 'email',
            operator: 'contains',
            value: '@example.com',
          },
        ],
        actions: [],
        priority: 1,
        createdBy: 'user-1',
      };

      engine.createRule(rule);

      const match = engine.evaluateRule('rule-1', { email: 'user@example.com' });
      const noMatch = engine.evaluateRule('rule-1', { email: 'user@other.com' });

      expect(match.matched).toBe(true);
      expect(noMatch.matched).toBe(false);
    });

    it('should evaluate in operator', () => {
      const rule: Omit<Rule, 'createdAt' | 'updatedAt' | 'evaluationCount' | 'successCount'> = {
        id: 'rule-1',
        name: 'Test',
        type: RuleType.SIMPLE,
        status: RuleStatus.ACTIVE,
        version: '1.0',
        conditions: [
          {
            id: 'cond-1',
            field: 'country',
            operator: 'in',
            value: ['US', 'CA', 'MX'],
          },
        ],
        actions: [],
        priority: 1,
        createdBy: 'user-1',
      };

      engine.createRule(rule);

      const match = engine.evaluateRule('rule-1', { country: 'US' });
      const noMatch = engine.evaluateRule('rule-1', { country: 'UK' });

      expect(match.matched).toBe(true);
      expect(noMatch.matched).toBe(false);
    });

    it('should evaluate between operator', () => {
      const rule: Omit<Rule, 'createdAt' | 'updatedAt' | 'evaluationCount' | 'successCount'> = {
        id: 'rule-1',
        name: 'Test',
        type: RuleType.SIMPLE,
        status: RuleStatus.ACTIVE,
        version: '1.0',
        conditions: [
          {
            id: 'cond-1',
            field: 'age',
            operator: 'between',
            value: [18, 65],
          },
        ],
        actions: [],
        priority: 1,
        createdBy: 'user-1',
      };

      engine.createRule(rule);

      const match = engine.evaluateRule('rule-1', { age: 30 });
      const noMatch = engine.evaluateRule('rule-1', { age: 70 });

      expect(match.matched).toBe(true);
      expect(noMatch.matched).toBe(false);
    });
  });

  describe('Decision Tables', () => {
    it('should create a decision table', () => {
      const table: Omit<DecisionTable, 'createdAt' | 'updatedAt'> = {
        id: 'table-1',
        name: 'Discount Matrix',
        version: '1.0',
        status: RuleStatus.ACTIVE,
        inputs: [
          { name: 'orderAmount', type: 'number' },
          { name: 'customerType', type: 'string' },
        ],
        outputs: [{ name: 'discount', type: 'number' }],
        rows: [
          {
            id: 'row-1',
            conditions: { orderAmount: 1000, customerType: 'premium' },
            outputs: { discount: 0.2 },
            priority: 10,
          },
          {
            id: 'row-2',
            conditions: { orderAmount: 500, customerType: 'regular' },
            outputs: { discount: 0.05 },
            priority: 5,
          },
        ],
        createdBy: 'user-1',
      };

      const created = engine.createDecisionTable(table);

      expect(created.id).toBe('table-1');
      expect(created.rows).toHaveLength(2);
    });

    it('should evaluate a decision table', () => {
      const table: Omit<DecisionTable, 'createdAt' | 'updatedAt'> = {
        id: 'table-1',
        name: 'Discount Matrix',
        version: '1.0',
        status: RuleStatus.ACTIVE,
        inputs: [
          { name: 'orderAmount', type: 'number' },
          { name: 'customerType', type: 'string' },
        ],
        outputs: [{ name: 'discount', type: 'number' }],
        rows: [
          {
            id: 'row-1',
            conditions: { orderAmount: 1000, customerType: 'premium' },
            outputs: { discount: 0.2 },
            priority: 10,
          },
          {
            id: 'row-2',
            conditions: { orderAmount: 500, customerType: 'regular' },
            outputs: { discount: 0.05 },
            priority: 5,
          },
        ],
        createdBy: 'user-1',
      };

      engine.createDecisionTable(table);

      const result = engine.evaluateDecisionTable('table-1', {
        orderAmount: 1000,
        customerType: 'premium',
      });

      expect(result).toEqual({ discount: 0.2 });
    });
  });

  describe('Rule Versioning', () => {
    it('should track rule versions', () => {
      const rule: Omit<Rule, 'createdAt' | 'updatedAt' | 'evaluationCount' | 'successCount'> = {
        id: 'rule-1',
        name: 'Test Rule',
        type: RuleType.SIMPLE,
        status: RuleStatus.ACTIVE,
        version: '1.0',
        conditions: [],
        actions: [],
        priority: 1,
        createdBy: 'user-1',
      };

      engine.createRule(rule);
      engine.updateRule('rule-1', { version: '1.1' });

      const versions = engine.getRuleVersions('rule-1');
      expect(versions.length).toBeGreaterThanOrEqual(2);
    });

    it('should rollback to a previous version', () => {
      const rule: Omit<Rule, 'createdAt' | 'updatedAt' | 'evaluationCount' | 'successCount'> = {
        id: 'rule-1',
        name: 'Original Name',
        type: RuleType.SIMPLE,
        status: RuleStatus.ACTIVE,
        version: '1.0',
        conditions: [],
        actions: [],
        priority: 1,
        createdBy: 'user-1',
      };

      engine.createRule(rule);
      const versions = engine.getRuleVersions('rule-1');
      const originalVersion = versions[0].version;

      engine.updateRule('rule-1', { name: 'Updated Name', version: '1.1' });
      const rolledBack = engine.rollbackToVersion('rule-1', originalVersion);

      expect(rolledBack.name).toBe('Original Name');
    });
  });

  describe('Rule Statistics', () => {
    it('should calculate rule statistics', () => {
      const rule: Omit<Rule, 'createdAt' | 'updatedAt' | 'evaluationCount' | 'successCount'> = {
        id: 'rule-1',
        name: 'Test Rule',
        type: RuleType.SIMPLE,
        status: RuleStatus.ACTIVE,
        version: '1.0',
        conditions: [
          {
            id: 'cond-1',
            field: 'value',
            operator: 'greaterThan',
            value: 100,
          },
        ],
        actions: [],
        priority: 1,
        createdBy: 'user-1',
      };

      engine.createRule(rule);

      engine.evaluateRule('rule-1', { value: 150 });
      engine.evaluateRule('rule-1', { value: 50 });
      engine.evaluateRule('rule-1', { value: 200 });

      const stats = engine.getRuleStatistics('rule-1');

      expect(stats.evaluationCount).toBe(3);
      expect(stats.successCount).toBe(2);
      expect(stats.successRate).toBeCloseTo(66.67, 1);
    });
  });

  describe('Simulation', () => {
    it('should simulate rule evaluation', () => {
      const rule: Omit<Rule, 'createdAt' | 'updatedAt' | 'evaluationCount' | 'successCount'> = {
        id: 'rule-1',
        name: 'Test Rule',
        type: RuleType.SIMPLE,
        status: RuleStatus.ACTIVE,
        version: '1.0',
        conditions: [
          {
            id: 'cond-1',
            field: 'value',
            operator: 'greaterThan',
            value: 100,
          },
        ],
        actions: [],
        priority: 1,
        createdBy: 'user-1',
      };

      engine.createRule(rule);

      const testData = [{ value: 150 }, { value: 50 }, { value: 200 }];
      const results = engine.simulateRuleEvaluation('rule-1', testData);

      expect(results).toHaveLength(3);
      expect(results[0].result.matched).toBe(true);
      expect(results[1].result.matched).toBe(false);
      expect(results[2].result.matched).toBe(true);
    });
  });
});
