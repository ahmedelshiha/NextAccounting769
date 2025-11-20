# Approvals Feature - Professional Architecture Design

## 🎯 Overview

Production-ready unified Approvals management system with multi-level workflows, notifications, and enterprise-grade features.

---

## 📐 Architecture Principles

### 1. **Unified Approval System**
- Single approval queue for all entities
- Support multiple approval types (Bills, Expenses, Documents, etc.)
- Centralized approval logic
- Consistent UI/UX

### 2. **Modular Design**
- Small, focused components
- Single responsibility
- Easy to test
- Reusable across approval types

### 3. **Lazy Loading**
- Code splitting
- Dynamic imports
- Optimized performance
- Better UX

### 4. **Workflow Support**
- Multi-level approvals
- Approval chains
- Delegation support
- Escalation rules

---

## 🗂️ Directory Structure

```
src/
├── app/
│   ├── api/
│   │   └── approvals/
│   │       ├── route.ts                    # List/Get approvals
│   │       ├── [id]/
│   │       │   ├── route.ts                # Get approval details
│   │       │   ├── approve/route.ts        # Approve item
│   │       │   ├── reject/route.ts         # Reject item
│   │       │   └── delegate/route.ts       # Delegate approval
│   │       └── stats/route.ts              # Analytics
│   └── portal/
│       └── approvals/
│           └── page.tsx                    # Main page
│
├── components/
│   └── portal/
│       └── approvals/
│           ├── ApprovalsClientPage.tsx     # Main container
│           ├── ApprovalsList/
│           │   ├── index.tsx               # List container
│           │   ├── ApprovalsTable.tsx      # Table component
│           │   ├── ApprovalCard.tsx        # Card component
│           │   └── ApprovalsFilters.tsx    # Filters
│           ├── ApprovalDetail/
│           │   ├── index.tsx               # Detail container
│           │   ├── ApprovalInfo.tsx        # Approval info
│           │   ├── ApprovalHistory.tsx     # History timeline
│           │   └── ApprovalActions.tsx     # Action buttons
│           ├── ApprovalAnalytics/
│           │   ├── index.tsx               # Analytics container
│           │   └── StatsCards.tsx          # Summary cards
│           └── shared/
│               ├── ApprovalStatus.tsx      # Status badge
│               ├── ApprovalType.tsx        # Type badge
│               └── ApprovalPriority.tsx    # Priority indicator
│
├── lib/
│   ├── services/
│   │   └── approvals/
│   │       ├── approvals-service.ts        # Business logic
│   │       └── workflow-engine.ts          # Workflow management
│   ├── hooks/
│   │   └── approvals/
│   │       ├── useApprovals.ts             # Data fetching
│   │       ├── useApprovalActions.ts       # Actions hook
│   │       └── useApprovalStats.ts         # Analytics
│   └── types/
│       └── approvals.ts                    # TypeScript types
│
└── prisma/
    └── schema.prisma                       # Database schema
```

---

## 🗄️ Database Schema

```prisma
model Approval {
  id                String          @id @default(cuid())
  tenantId          String
  
  // Item reference
  itemType          ApprovalItemType
  itemId            String
  itemData          Json?           // Snapshot of item data
  
  // Requester
  requesterId       String
  requesterName     String?
  requestedAt       DateTime        @default(now())
  
  // Approver
  approverId        String
  approverName      String?
  
  // Status
  status            ApprovalStatus  @default(PENDING)
  priority          ApprovalPriority @default(NORMAL)
  
  // Decision
  decision          String?         // APPROVED, REJECTED
  decisionAt        DateTime?
  decisionBy        String?
  decisionNotes     String?
  
  // Workflow
  workflowId        String?
  workflowStep      Int?            @default(1)
  totalSteps        Int?            @default(1)
  
  // Metadata
  reason            String?
  notes             String?
  tags              String[]
  metadata          Json?
  
  // Timestamps
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  expiresAt         DateTime?
  
  // Relations
  tenant            Tenant          @relation(fields: [tenantId], references: [id])
  requester         User            @relation("ApprovalRequester", fields: [requesterId], references: [id])
  approver          User            @relation("ApprovalApprover", fields: [approverId], references: [id])
  decider           User?           @relation("ApprovalDecider", fields: [decisionBy], references: [id])
  history           ApprovalHistory[]
  
  @@index([tenantId, status])
  @@index([tenantId, approverId, status])
  @@index([tenantId, itemType, itemId])
  @@index([expiresAt])
}

model ApprovalHistory {
  id                String          @id @default(cuid())
  approvalId        String
  tenantId          String
  
  action            String          // REQUESTED, APPROVED, REJECTED, DELEGATED, ESCALATED
  performedBy       String
  performedAt       DateTime        @default(now())
  
  fromStatus        ApprovalStatus?
  toStatus          ApprovalStatus?
  
  notes             String?
  metadata          Json?
  
  approval          Approval        @relation(fields: [approvalId], references: [id], onDelete: Cascade)
  performer         User            @relation(fields: [performedBy], references: [id])
  tenant            Tenant          @relation(fields: [tenantId], references: [id])
  
  @@index([approvalId])
  @@index([tenantId])
}

enum ApprovalItemType {
  BILL
  EXPENSE
  DOCUMENT
  INVOICE
  SERVICE_REQUEST
  ENTITY
  USER
  OTHER
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  DELEGATED
  ESCALATED
  EXPIRED
}

enum ApprovalPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/approvals` | List approvals with filters |
| GET | `/api/approvals/[id]` | Get approval details |
| POST | `/api/approvals/[id]/approve` | Approve item |
| POST | `/api/approvals/[id]/reject` | Reject item |
| POST | `/api/approvals/[id]/delegate` | Delegate to another approver |
| GET | `/api/approvals/stats` | Get approval statistics |

---

## 🎨 Component Architecture

### Container Components (Smart)
- Manage state
- Handle API calls
- Business logic
- Data fetching

### Presentation Components (Dumb)
- Pure UI
- Props-based
- No side effects
- Reusable

### Lazy Loaded Components
```typescript
const ApprovalDetail = lazy(() => import('./ApprovalDetail'))
const ApprovalAnalytics = lazy(() => import('./ApprovalAnalytics'))
```

---

## 🔄 Data Flow

```
User Action
    ↓
UI Component
    ↓
Custom Hook (useApprovals, useApprovalActions)
    ↓
API Service
    ↓
API Route Handler
    ↓
Approvals Service
    ↓
Database (Prisma)
    ↓
Response
    ↓
SWR Cache
    ↓
UI Update
```

---

## 🎯 Features

### Core Features
- ✅ Unified approval queue
- ✅ Multi-type support (Bills, Expenses, etc.)
- ✅ Approve/reject actions
- ✅ Approval history timeline
- ✅ Search and filters
- ✅ Priority indicators
- ✅ Analytics dashboard

### Advanced Features
- ✅ Bulk approvals
- ✅ Delegation
- ✅ Escalation (future)
- ✅ Notifications (future)
- ✅ Audit trail
- ✅ Export capabilities

---

## 🚀 Performance Optimizations

### Code Splitting
```typescript
const ApprovalDetail = lazy(() => import('./ApprovalDetail'))
```

### Data Caching
```typescript
const { data, mutate } = useSWR('/api/approvals', fetcher)
```

### Pagination
- Load approvals in chunks
- Infinite scroll support
- Offset-based pagination

---

## 🔒 Security

### Authentication
- All endpoints require authentication
- JWT token validation

### Authorization
- Tenant isolation
- Approver validation
- Permission checks

### Audit
- All actions logged
- History tracking
- Immutable records

---

## 📱 Responsive Design

### Mobile
- Card-based layout
- Touch-friendly
- Bottom sheets

### Tablet
- Grid layout
- Sidebar filters

### Desktop
- Table layout
- Full features
- Multi-column

---

*Architecture designed for production readiness and scalability.*
