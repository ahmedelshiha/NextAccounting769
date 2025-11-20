import { describe, it, expect, beforeEach } from 'vitest';
import {
  ProcessEngine,
  ProcessStatus,
  TaskStatus,
  EscalationLevel,
  ProcessDefinition,
  Task,
} from '../process-engine';

describe('ProcessEngine', () => {
  let engine: ProcessEngine;

  beforeEach(() => {
    engine = new ProcessEngine();
  });

  describe('Process Definition Management', () => {
    it('should create a process definition', () => {
      const definition: Omit<ProcessDefinition, 'createdAt' | 'updatedAt'> = {
        id: 'proc-1',
        name: 'Approval Workflow',
        description: 'Standard approval workflow',
        version: '1.0',
        status: ProcessStatus.ACTIVE,
        steps: [
          {
            id: 'step-1',
            name: 'Submit Request',
            type: 'TASK',
            assignee: 'user-1',
          },
          {
            id: 'step-2',
            name: 'Approve Request',
            type: 'TASK',
            assignee: 'user-2',
          },
        ],
        rules: [],
      };

      const created = engine.createProcessDefinition(definition);

      expect(created.id).toBe('proc-1');
      expect(created.name).toBe('Approval Workflow');
      expect(created.status).toBe(ProcessStatus.ACTIVE);
      expect(created.steps).toHaveLength(2);
    });

    it('should retrieve a process definition', () => {
      const definition: Omit<ProcessDefinition, 'createdAt' | 'updatedAt'> = {
        id: 'proc-1',
        name: 'Test Process',
        version: '1.0',
        status: ProcessStatus.ACTIVE,
        steps: [],
        rules: [],
      };

      engine.createProcessDefinition(definition);
      const retrieved = engine.getProcessDefinition('proc-1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test Process');
    });

    it('should list process definitions', () => {
      const def1: Omit<ProcessDefinition, 'createdAt' | 'updatedAt'> = {
        id: 'proc-1',
        name: 'Process 1',
        version: '1.0',
        status: ProcessStatus.ACTIVE,
        steps: [],
        rules: [],
      };

      const def2: Omit<ProcessDefinition, 'createdAt' | 'updatedAt'> = {
        id: 'proc-2',
        name: 'Process 2',
        version: '1.0',
        status: ProcessStatus.DRAFT,
        steps: [],
        rules: [],
      };

      engine.createProcessDefinition(def1);
      engine.createProcessDefinition(def2);

      const all = engine.listProcessDefinitions();
      expect(all).toHaveLength(2);

      const active = engine.listProcessDefinitions(ProcessStatus.ACTIVE);
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe('proc-1');
    });

    it('should update a process definition', () => {
      const definition: Omit<ProcessDefinition, 'createdAt' | 'updatedAt'> = {
        id: 'proc-1',
        name: 'Original Name',
        version: '1.0',
        status: ProcessStatus.ACTIVE,
        steps: [],
        rules: [],
      };

      engine.createProcessDefinition(definition);
      const updated = engine.updateProcessDefinition('proc-1', {
        name: 'Updated Name',
        status: ProcessStatus.PAUSED,
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.status).toBe(ProcessStatus.PAUSED);
    });
  });

  describe('Task Management', () => {
    beforeEach(() => {
      const definition: Omit<ProcessDefinition, 'createdAt' | 'updatedAt'> = {
        id: 'proc-1',
        name: 'Test Process',
        version: '1.0',
        status: ProcessStatus.ACTIVE,
        steps: [
          {
            id: 'step-1',
            name: 'Task 1',
            type: 'TASK',
            assignee: 'user-1',
          },
        ],
        rules: [],
      };

      engine.createProcessDefinition(definition);
    });

    it('should create a task', () => {
      const task = engine.createTask('proc-1', 'step-1', 'user-1');

      expect(task.processId).toBe('proc-1');
      expect(task.stepId).toBe('step-1');
      expect(task.assignee).toBe('user-1');
      expect(task.status).toBe(TaskStatus.PENDING);
      expect(task.escalationLevel).toBe(EscalationLevel.LEVEL_1);
    });

    it('should retrieve a task', () => {
      const created = engine.createTask('proc-1', 'step-1', 'user-1');
      const retrieved = engine.getTask(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.assignee).toBe('user-1');
    });

    it('should list tasks by assignee', () => {
      engine.createTask('proc-1', 'step-1', 'user-1');
      engine.createTask('proc-1', 'step-1', 'user-1');
      engine.createTask('proc-1', 'step-1', 'user-2');

      const user1Tasks = engine.listTasksByAssignee('user-1');
      const user2Tasks = engine.listTasksByAssignee('user-2');

      expect(user1Tasks).toHaveLength(2);
      expect(user2Tasks).toHaveLength(1);
    });

    it('should update task status', () => {
      const task = engine.createTask('proc-1', 'step-1', 'user-1');
      const updated = engine.updateTaskStatus(task.id, TaskStatus.IN_PROGRESS);

      expect(updated.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should mark task as completed', () => {
      const task = engine.createTask('proc-1', 'step-1', 'user-1');
      const updated = engine.updateTaskStatus(task.id, TaskStatus.COMPLETED);

      expect(updated.status).toBe(TaskStatus.COMPLETED);
      expect(updated.completedAt).toBeDefined();
    });
  });

  describe('Task Delegation', () => {
    beforeEach(() => {
      const definition: Omit<ProcessDefinition, 'createdAt' | 'updatedAt'> = {
        id: 'proc-1',
        name: 'Test Process',
        version: '1.0',
        status: ProcessStatus.ACTIVE,
        steps: [
          {
            id: 'step-1',
            name: 'Task 1',
            type: 'TASK',
            assignee: 'user-1',
          },
        ],
        rules: [],
      };

      engine.createProcessDefinition(definition);
    });

    it('should delegate a task', () => {
      const task = engine.createTask('proc-1', 'step-1', 'user-1');
      const delegation = engine.delegateTask(task.id, 'user-1', 'user-2', {
        reason: 'User on vacation',
      });

      expect(delegation.fromUser).toBe('user-1');
      expect(delegation.toUser).toBe('user-2');
      expect(delegation.reason).toBe('User on vacation');
    });

    it('should update task when delegated', () => {
      const task = engine.createTask('proc-1', 'step-1', 'user-1');
      engine.delegateTask(task.id, 'user-1', 'user-2');

      const updated = engine.getTask(task.id);
      expect(updated?.delegatedFrom).toBe('user-1');
      expect(updated?.delegatedTo).toBe('user-2');
      expect(updated?.status).toBe(TaskStatus.DELEGATED);
    });

    it('should return a delegated task', () => {
      const task = engine.createTask('proc-1', 'step-1', 'user-1');
      const delegation = engine.delegateTask(task.id, 'user-1', 'user-2');
      const returned = engine.returnDelegatedTask(delegation.id);

      expect(returned.assignee).toBe('user-1');
      expect(returned.delegatedFrom).toBeUndefined();
      expect(returned.delegatedTo).toBeUndefined();
      expect(returned.status).toBe(TaskStatus.PENDING);
    });

    it('should prevent delegation from non-assignee', () => {
      const task = engine.createTask('proc-1', 'step-1', 'user-1');

      expect(() => {
        engine.delegateTask(task.id, 'user-2', 'user-3');
      }).toThrow();
    });
  });

  describe('Vacation Coverage', () => {
    beforeEach(() => {
      const definition: Omit<ProcessDefinition, 'createdAt' | 'updatedAt'> = {
        id: 'proc-1',
        name: 'Test Process',
        version: '1.0',
        status: ProcessStatus.ACTIVE,
        steps: [
          {
            id: 'step-1',
            name: 'Task 1',
            type: 'TASK',
            assignee: 'user-1',
          },
        ],
        rules: [],
      };

      engine.createProcessDefinition(definition);
    });

    it('should setup vacation coverage', () => {
      const task1 = engine.createTask('proc-1', 'step-1', 'user-1');
      const task2 = engine.createTask('proc-1', 'step-1', 'user-1');

      const vacationStart = new Date();
      const vacationEnd = new Date(vacationStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      engine.setupVacationCoverage('user-1', 'user-2', vacationStart, vacationEnd);

      const updated1 = engine.getTask(task1.id);
      const updated2 = engine.getTask(task2.id);

      expect(updated1?.assignee).toBe('user-2');
      expect(updated1?.vacationCoverage?.originalAssignee).toBe('user-1');
      expect(updated2?.assignee).toBe('user-2');
    });
  });

  describe('Task Escalation', () => {
    beforeEach(() => {
      const definition: Omit<ProcessDefinition, 'createdAt' | 'updatedAt'> = {
        id: 'proc-1',
        name: 'Test Process',
        version: '1.0',
        status: ProcessStatus.ACTIVE,
        steps: [
          {
            id: 'step-1',
            name: 'Task 1',
            type: 'TASK',
            assignee: 'user-1',
          },
        ],
        rules: [],
      };

      engine.createProcessDefinition(definition);
    });

    it('should escalate a task', () => {
      const task = engine.createTask('proc-1', 'step-1', 'user-1');
      const escalated = engine.escalateTask(
        task.id,
        EscalationLevel.LEVEL_2,
        'Task overdue',
        'system',
        'manager-1'
      );

      expect(escalated.escalationLevel).toBe(EscalationLevel.LEVEL_2);
      expect(escalated.status).toBe(TaskStatus.ESCALATED);
      expect(escalated.escalationHistory).toHaveLength(1);
      expect(escalated.escalationHistory[0].reason).toBe('Task overdue');
    });

    it('should track escalation history', () => {
      const task = engine.createTask('proc-1', 'step-1', 'user-1');

      engine.escalateTask(task.id, EscalationLevel.LEVEL_2, 'Overdue', 'system', 'manager-1');
      const escalated = engine.escalateTask(
        task.id,
        EscalationLevel.LEVEL_3,
        'Still overdue',
        'system',
        'director-1'
      );

      expect(escalated.escalationHistory).toHaveLength(2);
      expect(escalated.escalationHistory[0].toLevel).toBe(EscalationLevel.LEVEL_2);
      expect(escalated.escalationHistory[1].toLevel).toBe(EscalationLevel.LEVEL_3);
    });
  });

  describe('Approval Matrix', () => {
    it('should create an approval matrix', () => {
      const matrix = engine.createApprovalMatrix({
        id: 'matrix-1',
        name: 'Budget Approval',
        rules: [
          {
            field: 'amount',
            operator: 'lessThan',
            value: 10000,
            approvers: ['manager-1'],
            approvalCount: 1,
          },
          {
            field: 'amount',
            operator: 'greaterThan',
            value: 10000,
            approvers: ['director-1', 'cfo-1'],
            approvalCount: 2,
          },
        ],
      });

      expect(matrix.id).toBe('matrix-1');
      expect(matrix.rules).toHaveLength(2);
    });

    it('should evaluate approval rules', () => {
      engine.createApprovalMatrix({
        id: 'matrix-1',
        name: 'Budget Approval',
        rules: [
          {
            field: 'amount',
            operator: 'lessThan',
            value: 10000,
            approvers: ['manager-1'],
            approvalCount: 1,
          },
          {
            field: 'amount',
            operator: 'greaterThan',
            value: 10000,
            approvers: ['director-1', 'cfo-1'],
            approvalCount: 2,
          },
        ],
      });

      const approversSmall = engine.evaluateApprovalRules('matrix-1', { amount: 5000 });
      const approversLarge = engine.evaluateApprovalRules('matrix-1', { amount: 15000 });

      expect(approversSmall).toContain('manager-1');
      expect(approversLarge).toContain('director-1');
      expect(approversLarge).toContain('cfo-1');
    });
  });

  describe('Process Statistics', () => {
    beforeEach(() => {
      const definition: Omit<ProcessDefinition, 'createdAt' | 'updatedAt'> = {
        id: 'proc-1',
        name: 'Test Process',
        version: '1.0',
        status: ProcessStatus.ACTIVE,
        steps: [
          {
            id: 'step-1',
            name: 'Task 1',
            type: 'TASK',
            assignee: 'user-1',
          },
        ],
        rules: [],
      };

      engine.createProcessDefinition(definition);
    });

    it('should calculate process statistics', () => {
      const task1 = engine.createTask('proc-1', 'step-1', 'user-1');
      const task2 = engine.createTask('proc-1', 'step-1', 'user-1');
      const task3 = engine.createTask('proc-1', 'step-1', 'user-1');

      engine.updateTaskStatus(task1.id, TaskStatus.COMPLETED);
      engine.updateTaskStatus(task2.id, TaskStatus.IN_PROGRESS);

      const stats = engine.getProcessStatistics('proc-1');

      expect(stats.totalTasks).toBe(3);
      expect(stats.completedTasks).toBe(1);
      expect(stats.pendingTasks).toBe(1);
      // Average completion time should be >= 0 (might be very small if completed immediately)
      expect(typeof stats.averageCompletionTime).toBe('number');
      expect(stats.averageCompletionTime).toBeGreaterThanOrEqual(0);
    });
  });
});
