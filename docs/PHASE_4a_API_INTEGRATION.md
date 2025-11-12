# Phase 4a API Integration Guide

**Status**: ✅ Real API Endpoints Implemented  
**Date**: January 2025

---

## 📋 Overview

Phase 4a integrates with real API endpoints for fetching pending operations and user data. This guide documents the API endpoints and data flow.

---

## 🔌 API Endpoints

### 1. GET /api/admin/users

Fetches list of users with pagination

**Authentication**: Required (Admin role)

**Query Parameters**:
- `page` (number, default: 1): Page number
- `limit` (number, default: 50, max: 100): Items per page

**Response**:
```json
{
  "users": [
    {
      "id": "user-id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "ADMIN",
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-16T14:22:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

**Implementation**: `src/app/api/admin/users/route.ts`

---

### 2. GET /api/admin/pending-operations

Fetches pending operations and workflows for the dashboard

**Authentication**: Required (Admin role with USERS_MANAGE permission)

**Query Parameters**:
- `limit` (number, default: 20, max: 100): Items per page
- `offset` (number, default: 0): Pagination offset
- `status` (string, optional): Filter by status (pending | in-progress | completed)

**Response**:
```json
{
  "operations": [
    {
      "id": "op-user-id-type",
      "title": "Onboarding - John Doe",
      "description": "New employee setup and system access provisioning",
      "progress": 65,
      "dueDate": "2025-01-23T10:30:00Z",
      "assignee": "HR Manager",
      "status": "in-progress",
      "type": "Onboarding",
      "userId": "user-id",
      "userEmail": "john@example.com",
      "createdAt": "2025-01-15T10:30:00Z",
      "actions": [
        { "label": "View", "id": "view" },
        { "label": "Resume", "id": "action" }
      ]
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 8
  },
  "timestamp": "2025-01-16T14:30:00Z"
}
```

**Error Handling**:
- 401: Unauthorized (not authenticated)
- 403: Forbidden (insufficient permissions)
- 429: Rate limited (exceeded rate limit)
- 500: Internal server error

**Implementation**: `src/app/api/admin/pending-operations/route.ts`

---

### 3. POST /api/admin/pending-operations

Handle pending operation actions (approve, cancel, etc.)

**Authentication**: Required (Admin role with USERS_MANAGE permission)

**Request Body**:
```json
{
  "action": "approve" | "cancel",
  "operationId": "op-user-id-type"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Operation approved",
  "operationId": "op-user-id-type"
}
```

**Implementation**: `src/app/api/admin/pending-operations/route.ts`

---

## 🔄 Data Flow

```
User Dashboard
    ↓
DashboardTab Component
    ↓
usePendingOperations Hook
    ↓
pending-operations.service.ts
    ↓
GET /api/admin/pending-operations
    ↓
Database (User, Activity, Audit data)
    ↓
Response → Component → UI Update
```

---

## ���� Service Layer

### usePendingOperations Hook

**Location**: `src/app/admin/users/hooks/usePendingOperations.ts`

**Usage**:
```typescript
const { operations, metrics, isLoading, error, refetch } = usePendingOperations({
  userCount: 150,
  enabled: true
})
```

**Returns**:
- `operations`: Array of PendingOperation objects
- `metrics`: OperationsMetrics (total, pending, in-progress, due)
- `isLoading`: Loading state
- `error`: Error object if fetch fails
- `refetch`: Function to manually refetch data

---

### pending-operations.service.ts

**Location**: `src/services/pending-operations.service.ts`

**Functions**:

#### fetchPendingOperations(tenantId, options)
Fetches list of pending operations from API
- Calls `GET /api/admin/pending-operations`
- Returns array of PendingOperation objects
- Falls back to mock data in development

#### fetchOperationsMetrics(tenantId, userCount)
Calculates operations metrics
- Fetches pending operations
- Calculates statistics
- Returns OperationsMetrics

#### approvePendingOperation(operationId)
Approves a pending operation
- Calls `POST /api/admin/pending-operations`
- Logs action to audit trail

#### cancelPendingOperation(operationId)
Cancels a pending operation
- Calls `POST /api/admin/pending-operations`
- Logs action to audit trail

---

## 🔐 Security & Permissions

### Permission Checks

All endpoints require:
1. **Authentication**: Valid session token
2. **Authorization**: `USERS_MANAGE` permission
3. **Tenant Context**: User must belong to the tenant

### Rate Limiting

- Limit: 240 requests per minute per IP
- Affects: All `/api/admin/*` endpoints
- Returns: 429 (Too Many Requests) when exceeded

### Audit Logging

All operations are logged:
- Successful approvals: `admin.operation.approved`
- Cancellations: `admin.operation.cancelled`
- Rate limit blocks: `security.ratelimit.block`

---

## 🚀 Data Generation Strategy

### Current Implementation (Phase 4a)

Pending operations are generated from actual user data:

1. **Query Recent Users**: Fetch users created in last 30 days
2. **Map Operations**: Convert each user to potential operation
3. **Calculate Progress**: Based on time since creation
4. **Determine Status**: Based on progress percentage
5. **Assign Dates**: Generate due dates (7 days from operation date)

**Example**:
```
User "John Doe" created 5 days ago
→ Operation: "Onboarding - John Doe"
→ Progress: 50% (5 days / 10 day estimate)
→ Status: "in-progress"
→ Due: 2 days
```

### Future Implementation (Phase 4b)

In Phase 4b, operations will be fetched from dedicated workflow tables:
- `workflows` - Main workflow records
- `workflow_steps` - Individual workflow steps
- `workflow_templates` - Reusable workflow templates

---

## 📈 Performance Considerations

### Optimization Techniques

1. **Pagination**: Operations limited to 20-100 per request
2. **Caching**: 5-minute cache via usePendingOperations hook
3. **Batch Fetching**: User count calculated once per page load
4. **Query Timeout**: 5-second max query time for database resilience

### Expected Response Times

- First load: 200-500ms (with cache miss)
- Subsequent loads: 50-100ms (with cache hit)
- Refetch: 200-500ms
- Action operations (approve/cancel): 100-300ms

---

## 🧪 Testing

### Unit Tests

Test files (to be created in Phase 4b):
- `src/services/__tests__/pending-operations.service.test.ts`
- `src/app/admin/users/hooks/__tests__/usePendingOperations.test.ts`

### Integration Tests

E2E tests:
- `e2e/tests/admin-users-phase4a.spec.ts` - API integration tests
- `e2e/tests/admin-users-phase4a-a11y.spec.ts` - Accessibility with real data

### API Testing

Manual testing:
```bash
# Fetch pending operations
curl http://localhost:3000/api/admin/pending-operations \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"

# Approve operation
curl -X POST http://localhost:3000/api/admin/pending-operations \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"approve","operationId":"op-123-type"}'
```

---

## 📝 Response Caching

### Client-Side Caching

Via `usePendingOperations` hook:
```typescript
const { operations, refetch } = usePendingOperations({
  userCount: 150
  // Automatically refetches every 5 minutes
})

// Manual refetch
await refetch()
```

### Cache Duration

- Pending operations: 5 minutes
- Metrics: 5 minutes
- User list: 5 minutes (via context)

---

## 🔄 Error Handling

### Service Layer

```typescript
try {
  const operations = await fetchPendingOperations(tenantId)
} catch (error) {
  // Logs error, returns empty array
  console.error('Failed to fetch:', error)
  return []
}
```

### Hook Level

```typescript
const { operations, error, isLoading } = usePendingOperations()

if (error) {
  // Show error to user
  return <ErrorMessage message={error.message} />
}

if (isLoading) {
  // Show loading skeleton
  return <LoadingSkeleton />
}
```

### Component Level

```typescript
<PendingOperationsPanel
  operations={operations}
  isLoading={operationsLoading}
  error={error}
  onRefresh={async () => await refetch()}
/>
```

---

## 🎯 Next Steps (Phase 4b)

1. **Create Workflow Tables**:
   - workflows
   - workflow_steps
   - workflow_templates

2. **Implement Workflow Service**:
   - Create/update workflows
   - Execute workflow steps
   - Track workflow progress

3. **Extend API Endpoints**:
   - GET /api/admin/workflows - List all workflows
   - POST /api/admin/workflows - Create workflow
   - PUT /api/admin/workflows/:id - Update workflow
   - DELETE /api/admin/workflows/:id - Cancel workflow

4. **Create Workflow UI**:
   - WorkflowsTab component
   - Workflow template editor
   - Workflow progress tracking

---

## 📚 Related Files

### API Implementation
- `src/app/api/admin/pending-operations/route.ts` - Main endpoint
- `src/app/api/admin/users/route.ts` - User list endpoint

### Service Layer
- `src/services/pending-operations.service.ts` - Service functions
- `src/app/admin/users/hooks/usePendingOperations.ts` - React hook

### Components
- `src/app/admin/users/components/PendingOperationsPanel.tsx` - Display component
- `src/app/admin/users/components/tabs/DashboardTab.tsx` - Dashboard orchestrator

### Testing
- `e2e/tests/admin-users-phase4a.spec.ts` - E2E tests
- `e2e/tests/admin-users-phase4a-a11y.spec.ts` - Accessibility tests

---

## ✅ API Integration Checklist

- [x] Pending operations API endpoint created
- [x] Service layer functions updated
- [x] Real data integration enabled
- [x] Mock data fallback in development
- [x] Error handling implemented
- [x] Permission checks in place
- [x] Rate limiting applied
- [x] Audit logging setup
- [x] Performance optimized
- [ ] Unit tests (Phase 4b)
- [ ] Integration tests (Phase 4b)
- [ ] API documentation (Phase 4b)

---

## 📞 Support

For questions about:
- **API endpoints**: See route.ts files
- **Service layer**: See pending-operations.service.ts
- **React hooks**: See usePendingOperations.ts
- **Error handling**: See components/PendingOperationsPanel.tsx
- **Testing**: See e2e/tests/admin-users-phase4a.spec.ts

---

**Last Updated**: January 2025  
**Status**: ✅ Phase 4a Complete  
**Next Phase**: Phase 4b Workflow Engine
