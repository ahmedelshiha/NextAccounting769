# Phase 4b: Workflow Engine Implementation Plan

**Status**: 📋 PLANNING (Ready to Start)  
**Duration**: 2 weeks (Week 3-4)  
**Effort**: 50 developer hours  
**Team**: 2 developers + 1 QA engineer  
**Target Launch**: Q1 2025

---

## 📋 Overview

Phase 4b builds the workflow automation engine for the Admin Users page, enabling admins to automate complex user lifecycle operations like onboarding, offboarding, and role changes. This is a mission-critical feature for enterprise customers.

### Key Metrics
- **Page Load**: <2 seconds
- **Workflow Execution**: <5 seconds
- **Approval Routing**: <1 second
- **Email Notifications**: <10 seconds
- **Workflow Completion Rate Target**: >95%

---

## 🎯 Phase 4b Feature Breakdown

### 1. Workflow System Architecture

#### Workflow Types (3 core types)
1. **Onboarding Workflow** (New Employee)
   - Create user account
   - Assign initial role (e.g., MEMBER, STAFF)
   - Provision system access
   - Send welcome email
   - Setup 2FA (optional)
   - Estimated Duration: 1-2 hours per user

2. **Offboarding Workflow** (Departing Employee)
   - Disable account on specified date
   - Revoke system access
   - Archive user data
   - Remove from active groups
   - Send offboarding confirmation
   - Estimated Duration: 30-60 minutes per user

3. **Role Change Workflow** (Permission Update)
   - Update user role
   - Sync permissions
   - Request approvals (if required)
   - Notify affected systems
   - Log changes for audit trail
   - Estimated Duration: 5-15 minutes per user

#### Workflow States
- **DRAFT**: Not yet started
- **PENDING**: Waiting for approval
- **IN_PROGRESS**: Currently executing
- **PAUSED**: Temporarily stopped
- **COMPLETED**: Successfully finished
- **FAILED**: Encountered error
- **CANCELLED**: User cancelled

---

## 📊 Workflow Engine Data Model

### Database Tables

#### 1. user_workflows
```sql
CREATE TABLE user_workflows (
  id UUID PRIMARY KEY,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
  
  user_id VARCHAR NOT NULL REFERENCES users(id),
  workflow_type VARCHAR NOT NULL (ONBOARDING|OFFBOARDING|ROLE_CHANGE),
  status VARCHAR NOT NULL (DRAFT|PENDING|IN_PROGRESS|COMPLETED|FAILED|CANCELLED),
  
  -- Execution details
  triggered_by VARCHAR NOT NULL REFERENCES users(id),
  approved_by VARCHAR REFERENCES users(id),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  scheduled_for TIMESTAMP, -- For scheduled workflows
  
  -- Progress tracking
  total_steps INT NOT NULL,
  completed_steps INT NOT NULL DEFAULT 0,
  progress_percent INT NOT NULL DEFAULT 0,
  
  -- Error handling
  error_message TEXT,
  retry_count INT DEFAULT 0,
  last_error_at TIMESTAMP,
  
  -- Audit
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  due_at TIMESTAMP, -- SLA deadline
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
)
```

#### 2. workflow_steps
```sql
CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES user_workflows(id) ON DELETE CASCADE,
  
  step_number INT NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  action_type VARCHAR NOT NULL (CREATE_ACCOUNT|PROVISION_ACCESS|SEND_EMAIL|etc),
  
  status VARCHAR NOT NULL (PENDING|IN_PROGRESS|COMPLETED|FAILED|SKIPPED),
  
  -- Step configuration
  config JSONB, -- Step-specific configuration
  
  -- Execution details
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INT,
  
  -- Error handling
  error_message TEXT,
  
  -- Human approval (if needed)
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMP,
  approved_by VARCHAR REFERENCES users(id),
  
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
)
```

#### 3. workflow_templates
```sql
CREATE TABLE workflow_templates (
  id UUID PRIMARY KEY,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
  
  name VARCHAR NOT NULL,
  description TEXT,
  workflow_type VARCHAR NOT NULL,
  
  -- Template steps
  steps JSONB NOT NULL, -- Array of step definitions
  
  -- Configuration
  requires_approval BOOLEAN DEFAULT FALSE,
  approval_emails TEXT[], -- Emails to notify for approvals
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_by VARCHAR NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
)
```

#### 4. workflow_notifications
```sql
CREATE TABLE workflow_notifications (
  id UUID PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES user_workflows(id),
  
  email_to VARCHAR NOT NULL,
  email_subject VARCHAR NOT NULL,
  email_body TEXT NOT NULL,
  
  status VARCHAR (PENDING|SENT|FAILED),
  sent_at TIMESTAMP,
  error_message TEXT,
  
  created_at TIMESTAMP NOT NULL
)
```

#### 5. workflow_history (for audit trail)
```sql
CREATE TABLE workflow_history (
  id UUID PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES user_workflows(id),
  
  event_type VARCHAR NOT NULL,
  event_description TEXT,
  changed_by VARCHAR NOT NULL REFERENCES users(id),
  
  old_value JSONB,
  new_value JSONB,
  
  created_at TIMESTAMP NOT NULL
)
```

#### 6. Modify users table
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_workflow_id UUID REFERENCES user_workflows(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_workflow_at TIMESTAMP;
```

---

## 🔧 Workflow Engine Implementation

### 1. Workflow Executor Service

#### File: `src/services/workflow-executor.service.ts`

**Responsibilities**:
- Execute workflow steps in sequence
- Handle approvals and blocking
- Manage error handling and retries
- Track progress and emit events
- Send notifications
- Maintain history

**Key Methods**:
- `executeWorkflow(workflowId)`: Start workflow execution
- `executeStep(stepId)`: Execute single step with validation
- `approveStep(stepId, approverUserId)`: Approve a step
- `pauseWorkflow(workflowId)`: Pause execution
- `resumeWorkflow(workflowId)`: Resume from pause
- `cancelWorkflow(workflowId)`: Cancel entire workflow
- `getWorkflowProgress(workflowId)`: Get current progress

### 2. Workflow Builder Service

#### File: `src/services/workflow-builder.service.ts`

**Responsibilities**:
- Create workflow instances from templates
- Validate workflow configuration
- Generate default steps
- Clone templates
- Customize workflows

**Key Methods**:
- `createWorkflowFromTemplate(templateId, userId)`: Create instance
- `createCustomWorkflow(type, steps)`: Build custom workflow
- `validateWorkflow(workflow)`: Verify all required steps
- `cloneTemplate(templateId, newName)`: Duplicate template
- `getDefaultTemplate(type)`: Get built-in template

### 3. Workflow Step Handlers

#### File: `src/services/workflow-steps/`

Each action type has its own handler:

```typescript
// Base interface
interface StepHandler {
  execute(config: any, context: WorkflowContext): Promise<void>
  validate(config: any): boolean
  rollback(context: WorkflowContext): Promise<void>
  estimate(): number // Estimated duration in seconds
}

// Implementations
- CreateAccountStep.ts (Create user account)
- ProvisionAccessStep.ts (Setup system access)
- SendEmailStep.ts (Send notification)
- AssignRoleStep.ts (Update user role)
- DisableAccountStep.ts (Deactivate account)
- ArchiveDataStep.ts (Archive user data)
- RequestApprovalStep.ts (Request human approval)
- SyncPermissionsStep.ts (Sync with other systems)
```

### 4. Approval Manager Service

#### File: `src/services/approval-manager.service.ts`

**Responsibilities**:
- Handle approval routing
- Send approval requests
- Track approval status
- Auto-approve if configured
- Enforce SLA deadlines

**Key Methods**:
- `requestApproval(stepId, approverEmails)`: Request approvals
- `approveStep(stepId, approverId)`: Approve step
- `rejectStep(stepId, approverId, reason)`: Reject with reason
- `getApprovalStatus(stepId)`: Check approval status
- `enforceApprovalSLA(workflowId)`: Check deadlines

### 5. Notification Service

#### File: `src/services/notification-manager.service.ts`

**Responsibilities**:
- Queue email notifications
- Send workflow progress emails
- Send approval request emails
- Send completion/failure notifications
- Handle email template rendering

**Email Templates**:
- `workflow-started.hbs`: Workflow initiated
- `workflow-step-completed.hbs`: Step finished
- `approval-requested.hbs`: Approval needed
- `workflow-completed.hbs`: Workflow done
- `workflow-failed.hbs`: Error occurred
- `workflow-reminder.hbs`: Reminder (approaching due date)

---

## 🎨 UI Component Implementation

### 1. WorkflowsTab Component

#### File: `src/app/admin/users/components/tabs/WorkflowsTab.tsx`

**Responsibilities**:
- Display list of workflows
- Filter by status, type, assignee
- Show workflow details
- Launch workflow wizard
- Display workflow timeline

**Features**:
- Workflow list with pagination
- Status badges with colors
- Progress bars showing completion
- Quick action buttons (View, Resume, Pause, Cancel)
- Filter controls
- Search by user/workflow

### 2. WorkflowBuilder Component

#### File: `src/app/admin/users/components/WorkflowBuilder.tsx`

**Multi-step wizard for creating workflows**:
- Step 1: Choose workflow type (Onboarding, Offboarding, Role Change)
- Step 2: Select target users (single or bulk)
- Step 3: Configure workflow steps
- Step 4: Set approval routing (if required)
- Step 5: Schedule or start immediately
- Step 6: Review and confirm

### 3. WorkflowDetails Component

#### File: `src/app/admin/users/components/WorkflowDetails.tsx`

**Display**:
- Workflow overview (type, status, progress)
- Timeline of steps (completed, current, pending)
- Step details with actions
- Approval status and notes
- History of changes
- Error messages (if any)
- Action buttons (Resume, Pause, Cancel, Approve, Reject)

### 4. WorkflowCard Component

#### File: `src/app/admin/users/components/WorkflowCard.tsx`

**Display in dashboard/list**:
- Workflow title (e.g., "Onboarding - John Doe")
- Status badge with color
- Progress bar (% complete)
- Due date with urgency indicator
- Current step
- Quick actions

### 5. ApprovalWidget Component

#### File: `src/app/admin/users/components/ApprovalWidget.tsx`

**For approval-required steps**:
- Show approval request
- Display required approvers
- Current approval status
- Approve/Reject buttons
- Notes field
- Due date indicator

---

## 🔌 API Endpoints

### Workflow Management

#### 1. POST /api/admin/workflows
Create a new workflow from template or custom

**Request**:
```json
{
  "workflow_type": "ONBOARDING",
  "user_id": "user-123",
  "template_id": "template-456",
  "scheduled_for": "2025-01-20T09:00:00Z",
  "custom_steps": []
}
```

**Response**: 201 Created
```json
{
  "id": "workflow-789",
  "user_id": "user-123",
  "status": "DRAFT",
  "created_at": "2025-01-16T10:00:00Z"
}
```

#### 2. GET /api/admin/workflows
List workflows with filters

**Query Parameters**:
- `status`: PENDING, IN_PROGRESS, COMPLETED, FAILED
- `type`: ONBOARDING, OFFBOARDING, ROLE_CHANGE
- `user_id`: Filter by user
- `page`: Pagination
- `limit`: Items per page

#### 3. GET /api/admin/workflows/{id}
Get workflow details with full history

**Response**:
```json
{
  "id": "workflow-789",
  "user_id": "user-123",
  "status": "IN_PROGRESS",
  "progress_percent": 65,
  "steps": [
    {
      "id": "step-1",
      "name": "Create Account",
      "status": "COMPLETED",
      "completed_at": "2025-01-16T10:05:00Z"
    },
    {
      "id": "step-2",
      "name": "Provision Access",
      "status": "IN_PROGRESS",
      "requires_approval": false
    },
    {
      "id": "step-3",
      "name": "Send Welcome Email",
      "status": "PENDING",
      "requires_approval": false
    }
  ],
  "history": []
}
```

#### 4. PATCH /api/admin/workflows/{id}
Update workflow status or pause/resume

**Request**:
```json
{
  "action": "PAUSE|RESUME|CANCEL|RETRY"
}
```

#### 5. POST /api/admin/workflows/{id}/approve-step/{stepId}
Approve a step requiring approval

**Request**:
```json
{
  "approver_id": "user-123",
  "notes": "Approved as requested"
}
```

#### 6. POST /api/admin/workflows/{id}/dry-run
Preview workflow execution without actually running

**Response**: Expected changes, estimated duration, validation errors

#### 7. GET /api/admin/workflow-templates
List available workflow templates

**Response**:
```json
{
  "templates": [
    {
      "id": "template-1",
      "name": "Standard Onboarding",
      "type": "ONBOARDING",
      "steps": 5,
      "is_active": true
    }
  ]
}
```

#### 8. POST /api/admin/workflow-templates
Create custom template

---

## 📱 UI Mockups

### Workflows Tab Layout

```
┌─────────────────────────────────────────────────┐
│ 🔄 Workflows                                    │
├─────────────────────────────────────────────────┤
│ [+ New Workflow] [All] [Active] [Completed]    │
│ Search: [________________] [Filters ▼]         │
├─────────────────────────────────────────────────┤
│                                                 │
│ Onboarding - John Doe (75% done, due Jan 15)  │
│ ├─ ✅ Create Account                           │
│ ├─ ⏳ Provision Access (in progress)           │
│ ├─ ⏳ Send Email (pending)                     │
│ └─ Last updated 2 min ago                      │
│                                                 │
│ Offboarding - Jane Smith (30% done, due Jan 10)│
│ ├─ ⏳ Create final backup                       │
│ ├─ ⏳ Disable account                           │
│ └─ [Resume] [Cancel]                           │
│                                                 │
│ Role Change - Bob Wilson (needs approval)      │
│ ├─ ⏳ Request Approval [View]                   │
│ ├─ ⏳ Update Permissions                        │
│ └─ [Approve] [Reject] [View Details]          │
│                                                 │
└─────────────────────────────────────────────────┘
```

### New Workflow Wizard

```
Step 1: Choose Type
┌──────────────────────────┐
│ Select Workflow Type:    │
│ ☑️ Onboarding            │
│ ☐ Offboarding           │
│ ☐ Role Change           │
└──────────────────────────┘

Step 2: Select Users
┌──────────────────────────┐
│ Select Users:            │
│ ☑️ John Doe             │
│ ☑️ Jane Smith           │
│ ☐ Bob Wilson            │
│ [+ Add More]            │
└──────────────────────────┘

Step 3: Configure Steps
┌──────────────────────────┐
│ 1. Create Account        │
│ 2. Assign Role [MEMBER▼] │
│ 3. Provision Access ✓    │
│ 4. Send Email            │
│ [+ Add Custom Step]      │
└──────────────────────────┘

Step 4: Approvals
┌──────────────────────────┐
│ Requires Approval? ☑    │
│ Approve With:           │
│ □ admin@example.com     │
│ ☑️ manager@example.com   │
└──────────────────────────┘

Step 5: Schedule
┌──────────────────────────┐
│ Start Now      ☑        │
│ Schedule For: [________] │
└──────────────────────────┘

Step 6: Review & Start
[◄ Back] [Confirm & Start ►]
```

---

## ✅ Implementation Tasks

### Week 1 (25 hours)

- [ ] Create database migrations
- [ ] Implement workflow executor service
- [ ] Implement workflow builder service
- [ ] Create step handler interfaces
- [ ] Build individual step handlers (Create, Provision, Email, etc.)
- [ ] Implement approval manager
- [ ] Create workflow API routes (GET, POST, PATCH)
- [ ] Set up email notification templates
- [ ] Create workflow database models (Prisma)

### Week 2 (25 hours)

- [ ] Build WorkflowsTab component
- [ ] Build WorkflowBuilder wizard (5 steps)
- [ ] Build WorkflowDetails component
- [ ] Build WorkflowCard component
- [ ] Build ApprovalWidget component
- [ ] Implement workflow list filtering
- [ ] Create workflow timeline UI
- [ ] Add progress indicators
- [ ] Implement dry-run preview
- [ ] Create E2E tests for workflows
- [ ] Create accessibility tests
- [ ] Performance optimization
- [ ] Documentation

---

## 🧪 Testing Strategy

### Unit Tests
- Workflow executor logic
- Step handlers
- Approval routing
- Notification queuing

### Integration Tests
- Database migrations
- Workflow creation and execution
- Step progression
- Approval flow
- Email notifications

### E2E Tests
- Create workflow from template
- Execute workflow steps
- Approve workflow steps
- Cancel workflow
- View workflow history
- Filter workflows

### Performance Tests
- Workflow creation: <1 second
- Step execution: <5 seconds
- Workflow list load: <2 seconds
- Approval routing: <1 second

---

## 📈 Success Metrics

- ✅ All workflow types functional (Onboarding, Offboarding, Role Change)
- ✅ Approval routing works correctly
- ✅ Email notifications sent successfully
- ✅ Progress tracking accurate (0-100%)
- ✅ Error handling and retries working
- ✅ Dry-run preview accurate
- ✅ Performance targets met
- ✅ Accessibility compliant (WCAG 2.1 AA)
- ✅ 40+ E2E tests passing
- ✅ Code coverage >80%

---

## 🚀 Next Phase Preview

### Phase 4c: Bulk Operations (Week 5-6, 45 hours)
- 5-step bulk operation wizard
- Large-scale operation support (1000+ users)
- Dry-run and rollback capability
- Progress tracking for bulk operations
- Batch processing engine

---

## 📝 Notes

### Dependencies
- ✅ Phase 4a Dashboard (complete)
- ✅ Database schema ready
- ✅ Email service (SendGrid) configured
- ✅ User authentication system ready

### Risk Mitigation
- Database migration tests before production
- Dry-run capability for all workflows
- Approval workflow for sensitive operations
- Comprehensive error logging
- Rollback mechanism for failed steps

### Reference Documents
- [ADMIN_USERS_ENTERPRISE_REDESIGN_PLAN.md](./ADMIN_USERS_ENTERPRISE_REDESIGN_PLAN.md)
- [ADMIN_USERS_ENTERPRISE_REDESIGN.md](./ADMIN_USERS_ENTERPRISE_REDESIGN.md)
- [PHASE_4_IMPLEMENTATION_GUIDE.md](./PHASE_4_IMPLEMENTATION_GUIDE.md)

---

**Last Updated**: January 2025  
**Status**: Planning Phase ✅  
**Ready for**: Development Start
