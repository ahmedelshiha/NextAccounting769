import { z } from 'zod';
import { logger } from '@/lib/logger';

/**
 * Business Process Management (BPM) Engine
 * 
 * Provides process definition, task assignment, workflow orchestration,
 * escalation procedures, and delegation support.
 */

// ============================================================================
// Type Definitions
// ============================================================================

export enum ProcessStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  ARCHIVED = 'ARCHIVED',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ESCALATED = 'ESCALATED',
  DELEGATED = 'DELEGATED',
}

export enum EscalationLevel {
  LEVEL_1 = 'LEVEL_1',
  LEVEL_2 = 'LEVEL_2',
  LEVEL_3 = 'LEVEL_3',
  CRITICAL = 'CRITICAL',
}

export interface ProcessDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  status: ProcessStatus;
  steps: ProcessStep[];
  rules?: ProcessRule[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ProcessStep {
  id: string;
  name: string;
  type: 'TASK' | 'DECISION' | 'PARALLEL' | 'LOOP';
  description?: string;
  assignee?: string;
  assigneeRole?: string;
  duration?: number; // in minutes
  dependencies?: string[]; // step IDs
  conditions?: ProcessCondition[];
  nextSteps?: string[];
  retryPolicy?: RetryPolicy;
}

export interface ProcessCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'in';
  value: any;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelayMs: number;
}

export interface ProcessRule {
  id: string;
  name: string;
  type: 'APPROVAL' | 'VALIDATION' | 'ROUTING' | 'ESCALATION';
  condition: ProcessCondition[];
  action: string;
  priority: number;
}

export interface Task {
  id: string;
  processId: string;
  stepId: string;
  status: TaskStatus;
  assignee: string;
  assigneeRole?: string;
  delegatedFrom?: string;
  delegatedTo?: string;
  dueDate?: Date;
  completedAt?: Date;
  escalationLevel: EscalationLevel;
  escalationHistory: EscalationRecord[];
  vacationCoverage?: VacationCoverage;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface EscalationRecord {
  timestamp: Date;
  fromLevel: EscalationLevel;
  toLevel: EscalationLevel;
  reason: string;
  escalatedBy: string;
  escalatedTo: string;
}

export interface VacationCoverage {
  originalAssignee: string;
  coveringAssignee: string;
  vacationStart: Date;
  vacationEnd: Date;
  autoReassign: boolean;
}

export interface DelegationRecord {
  id: string;
  taskId: string;
  fromUser: string;
  toUser: string;
  reason?: string;
  delegatedAt: Date;
  expiresAt?: Date;
  autoReturn: boolean;
}

export interface ApprovalMatrix {
  id: string;
  name: string;
  rules: ApprovalRule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalRule {
  field: string;
  operator: string;
  value: any;
  approvers: string[];
  approvalCount: number; // number of approvals required
  escalationTime?: number; // minutes
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const ProcessDefinitionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  version: z.string(),
  status: z.nativeEnum(ProcessStatus),
  steps: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['TASK', 'DECISION', 'PARALLEL', 'LOOP']),
    assignee: z.string().optional(),
    assigneeRole: z.string().optional(),
    duration: z.number().optional(),
  })),
  rules: z.array(z.any()).optional(),
});

export const TaskSchema = z.object({
  id: z.string(),
  processId: z.string(),
  stepId: z.string(),
  status: z.nativeEnum(TaskStatus),
  assignee: z.string(),
  dueDate: z.date().optional(),
  escalationLevel: z.nativeEnum(EscalationLevel),
});

// ============================================================================
// Process Engine
// ============================================================================

export class ProcessEngine {
  private processes = new Map<string, ProcessDefinition>();
  private tasks = new Map<string, Task>();
  private delegations = new Map<string, DelegationRecord>();
  private approvalMatrices = new Map<string, ApprovalMatrix>();
  private escalationTimers = new Map<string, NodeJS.Timeout>();

  /**
   * Create a new process definition
   */
  createProcessDefinition(definition: Omit<ProcessDefinition, 'createdAt' | 'updatedAt'>): ProcessDefinition {
    const processDef: ProcessDefinition = {
      ...definition,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Validate process definition
    const validation = ProcessDefinitionSchema.safeParse(processDef);
    if (!validation.success) {
      throw new Error(`Invalid process definition: ${validation.error.message}`);
    }

    this.processes.set(definition.id, processDef);
    logger.info('Process definition created', { processId: definition.id });

    return processDef;
  }

  /**
   * Get a process definition
   */
  getProcessDefinition(processId: string): ProcessDefinition | undefined {
    return this.processes.get(processId);
  }

  /**
   * List all process definitions
   */
  listProcessDefinitions(status?: ProcessStatus): ProcessDefinition[] {
    const definitions = Array.from(this.processes.values());
    if (status) {
      return definitions.filter((d) => d.status === status);
    }
    return definitions;
  }

  /**
   * Update a process definition
   */
  updateProcessDefinition(processId: string, updates: Partial<ProcessDefinition>): ProcessDefinition {
    const existing = this.processes.get(processId);
    if (!existing) {
      throw new Error(`Process definition not found: ${processId}`);
    }

    const updated: ProcessDefinition = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    this.processes.set(processId, updated);
    logger.info('Process definition updated', { processId });

    return updated;
  }

  /**
   * Create a task from a process step
   */
  createTask(
    processId: string,
    stepId: string,
    assignee: string,
    options?: {
      dueDate?: Date;
      metadata?: Record<string, any>;
      assigneeRole?: string;
    }
  ): Task {
    const process = this.getProcessDefinition(processId);
    if (!process) {
      throw new Error(`Process not found: ${processId}`);
    }

    const step = process.steps.find((s) => s.id === stepId);
    if (!step) {
      throw new Error(`Step not found: ${stepId}`);
    }

    const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const task: Task = {
      id: taskId,
      processId,
      stepId,
      status: TaskStatus.PENDING,
      assignee,
      assigneeRole: options?.assigneeRole,
      escalationLevel: EscalationLevel.LEVEL_1,
      escalationHistory: [],
      dueDate: options?.dueDate,
      metadata: options?.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tasks.set(taskId, task);
    logger.info('Task created', { taskId, processId, stepId, assignee });

    // Set escalation timer if due date is set
    if (options?.dueDate) {
      this.setEscalationTimer(taskId, options.dueDate);
    }

    return task;
  }

  /**
   * Get a task
   */
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * List tasks by assignee
   */
  listTasksByAssignee(assignee: string, status?: TaskStatus): Task[] {
    const tasks = Array.from(this.tasks.values()).filter(
      (t) => t.assignee === assignee || t.delegatedTo === assignee
    );

    if (status) {
      return tasks.filter((t) => t.status === status);
    }

    return tasks;
  }

  /**
   * Update task status
   */
  updateTaskStatus(taskId: string, status: TaskStatus, completedBy?: string): Task {
    const task = this.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const updated: Task = {
      ...task,
      status,
      completedAt: status === TaskStatus.COMPLETED ? new Date() : task.completedAt,
      updatedAt: new Date(),
    };

    this.tasks.set(taskId, updated);
    logger.info('Task status updated', { taskId, status, completedBy });

    // Clear escalation timer if task is completed
    if (status === TaskStatus.COMPLETED) {
      this.clearEscalationTimer(taskId);
    }

    return updated;
  }

  /**
   * Delegate a task to another user
   */
  delegateTask(
    taskId: string,
    fromUser: string,
    toUser: string,
    options?: {
      reason?: string;
      expiresAt?: Date;
      autoReturn?: boolean;
    }
  ): DelegationRecord {
    const task = this.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (task.assignee !== fromUser) {
      throw new Error(`User ${fromUser} is not the current assignee`);
    }

    const delegationId = `deleg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const delegation: DelegationRecord = {
      id: delegationId,
      taskId,
      fromUser,
      toUser,
      reason: options?.reason,
      delegatedAt: new Date(),
      expiresAt: options?.expiresAt,
      autoReturn: options?.autoReturn ?? true,
    };

    this.delegations.set(delegationId, delegation);

    // Update task
    const updated: Task = {
      ...task,
      delegatedFrom: fromUser,
      delegatedTo: toUser,
      status: TaskStatus.DELEGATED,
      updatedAt: new Date(),
    };

    this.tasks.set(taskId, updated);
    logger.info('Task delegated', { taskId, fromUser, toUser, delegationId });

    return delegation;
  }

  /**
   * Return a delegated task
   */
  returnDelegatedTask(delegationId: string): Task {
    const delegation = this.delegations.get(delegationId);
    if (!delegation) {
      throw new Error(`Delegation not found: ${delegationId}`);
    }

    const task = this.getTask(delegation.taskId);
    if (!task) {
      throw new Error(`Task not found: ${delegation.taskId}`);
    }

    const updated: Task = {
      ...task,
      assignee: delegation.fromUser,
      delegatedFrom: undefined,
      delegatedTo: undefined,
      status: TaskStatus.PENDING,
      updatedAt: new Date(),
    };

    this.tasks.set(delegation.taskId, updated);
    this.delegations.delete(delegationId);
    logger.info('Delegated task returned', { taskId: delegation.taskId, delegationId });

    return updated;
  }

  /**
   * Setup vacation coverage for a user
   */
  setupVacationCoverage(
    assignee: string,
    coveringAssignee: string,
    vacationStart: Date,
    vacationEnd: Date,
    autoReassign: boolean = true
  ): void {
    const userTasks = this.listTasksByAssignee(assignee, TaskStatus.PENDING);

    for (const task of userTasks) {
      const updated: Task = {
        ...task,
        vacationCoverage: {
          originalAssignee: assignee,
          coveringAssignee,
          vacationStart,
          vacationEnd,
          autoReassign,
        },
        assignee: coveringAssignee,
        updatedAt: new Date(),
      };

      this.tasks.set(task.id, updated);
    }

    logger.info('Vacation coverage setup', {
      assignee,
      coveringAssignee,
      vacationStart,
      vacationEnd,
    });
  }

  /**
   * Escalate a task
   */
  escalateTask(
    taskId: string,
    toLevel: EscalationLevel,
    reason: string,
    escalatedBy: string,
    escalatedTo: string
  ): Task {
    const task = this.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const escalationRecord: EscalationRecord = {
      timestamp: new Date(),
      fromLevel: task.escalationLevel,
      toLevel,
      reason,
      escalatedBy,
      escalatedTo,
    };

    const updated: Task = {
      ...task,
      escalationLevel: toLevel,
      status: TaskStatus.ESCALATED,
      escalationHistory: [...task.escalationHistory, escalationRecord],
      assignee: escalatedTo,
      updatedAt: new Date(),
    };

    this.tasks.set(taskId, updated);
    logger.info('Task escalated', { taskId, toLevel, reason, escalatedBy, escalatedTo });

    return updated;
  }

  /**
   * Create an approval matrix
   */
  createApprovalMatrix(matrix: Omit<ApprovalMatrix, 'createdAt' | 'updatedAt'>): ApprovalMatrix {
    const approvalMatrix: ApprovalMatrix = {
      ...matrix,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.approvalMatrices.set(matrix.id, approvalMatrix);
    logger.info('Approval matrix created', { matrixId: matrix.id });

    return approvalMatrix;
  }

  /**
   * Get approval matrix
   */
  getApprovalMatrix(matrixId: string): ApprovalMatrix | undefined {
    return this.approvalMatrices.get(matrixId);
  }

  /**
   * Evaluate approval rules
   */
  evaluateApprovalRules(matrixId: string, data: Record<string, any>): string[] {
    const matrix = this.getApprovalMatrix(matrixId);
    if (!matrix) {
      throw new Error(`Approval matrix not found: ${matrixId}`);
    }

    const approvers = new Set<string>();

    for (const rule of matrix.rules) {
      if (this.evaluateCondition(rule.field, rule.operator, rule.value, data)) {
        rule.approvers.forEach((a) => approvers.add(a));
      }
    }

    return Array.from(approvers);
  }

  /**
   * Set escalation timer
   */
  private setEscalationTimer(taskId: string, dueDate: Date): void {
    const now = new Date();
    const timeUntilDue = dueDate.getTime() - now.getTime();

    if (timeUntilDue > 0) {
      const timer = setTimeout(() => {
        const task = this.getTask(taskId);
        if (task && task.status !== TaskStatus.COMPLETED) {
          this.escalateTask(
            taskId,
            EscalationLevel.LEVEL_2,
            'Task overdue',
            'system',
            task.assignee
          );
        }
      }, timeUntilDue);

      this.escalationTimers.set(taskId, timer);
    }
  }

  /**
   * Clear escalation timer
   */
  private clearEscalationTimer(taskId: string): void {
    const timer = this.escalationTimers.get(taskId);
    if (timer) {
      clearTimeout(timer);
      this.escalationTimers.delete(taskId);
    }
  }

  /**
   * Evaluate a condition
   */
  private evaluateCondition(field: string, operator: string, value: any, data: Record<string, any>): boolean {
    const fieldValue = data[field];

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'notEquals':
        return fieldValue !== value;
      case 'greaterThan':
        return fieldValue > value;
      case 'lessThan':
        return fieldValue < value;
      case 'contains':
        return String(fieldValue).includes(String(value));
      case 'in':
        return Array.isArray(value) && value.includes(fieldValue);
      default:
        return false;
    }
  }

  /**
   * Get process statistics
   */
  getProcessStatistics(processId: string): {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    escalatedTasks: number;
    averageCompletionTime: number;
  } {
    const processTasks = Array.from(this.tasks.values()).filter((t) => t.processId === processId);

    const completed = processTasks.filter((t) => t.status === TaskStatus.COMPLETED);
    const pending = processTasks.filter((t) => t.status === TaskStatus.PENDING);
    const escalated = processTasks.filter((t) => t.status === TaskStatus.ESCALATED);

    let averageCompletionTime = 0;
    if (completed.length > 0) {
      const totalTime = completed.reduce((sum, task) => {
        if (task.completedAt && task.createdAt) {
          return sum + (task.completedAt.getTime() - task.createdAt.getTime());
        }
        return sum;
      }, 0);
      averageCompletionTime = totalTime / completed.length / 1000 / 60; // in minutes
    }

    return {
      totalTasks: processTasks.length,
      completedTasks: completed.length,
      pendingTasks: pending.length,
      escalatedTasks: escalated.length,
      averageCompletionTime,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const processEngine = new ProcessEngine();
