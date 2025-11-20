# Portal-Admin Dashboard Integration Comprehensive Roadmap

**Document Version**: 1.0  
**Date Created**: November 2024  
**Status**: Strategic Planning Phase  
**Scope**: Full integration of client portal with admin dashboard  
**Author**: Senior Full-Stack Web Developer

---

## Executive Summary

This document provides a **complete strategic roadmap** for fully integrating the client portal with the admin dashboard. The current system has two separate user-facing areas (Portal and Admin) that share the same database, authentication, and core domain models but operate with limited data synchronization and feature-sharing.

### Current State
- ✅ **Shared Infrastructure**: Same PostgreSQL database, Prisma ORM, NextAuth, multi-tenancy
- ✅ **Shared Models**: User, Tenant, Service, Booking, Task, Invoice, Document, etc.
- ❌ **Limited Real-time Sync**: Portal and Admin operate independently
- ❌ **Duplicate Components**: Similar features exist in both areas with different implementations
- ❌ **One-Way Data Flow**: Admin manages data; portal consumes (limited bidirectional flow)
- ❌ **No Cross-Visibility**: Portal actions not fully visible to admin and vice versa

### Vision
Transform the portal and admin into a **unified, bi-directional system** where:
- Portal users become **active data contributors** (not just consumers)
- Admin gains **real-time visibility** into all client activities
- Components and APIs are **shared efficiently** between both areas
- Data flows **naturally** based on user roles and permissions
- Feature-rich experiences are **consistently available** to both portal users and admins

---

## Architecture Overview

### Current System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Shared Database (PostgreSQL)            │
│    ┌──────────────────────────────────────────────────────┐  │
│    │  User • Tenant • Service • Booking • Task • Invoice  │  │
│    │  Document • Approval • ServiceRequest • Compliance   │  │
│    │  Report • Expense • Bill • Entity • KYC • Message    │  │
│    └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────��────────┘
                            ↓
         ┌──────────────────┴──────────────────┐
         │                                     │
    ┌─────────────┐                   ┌──────────────┐
    │   ADMIN     │                   │    PORTAL    │
    │  DASHBOARD  │                   │   (CLIENT)   │
    │             │                   │              │
    │ • Manage    │  ←─── Limited ───→ • View       │
    │   Services  │       Integration   • Request   │
    │ • Schedule  │                    • Interact   │
    │   Bookings  │                    • Approve    │
    │ • Assign    │                    • Track      │
    │   Tasks     │                                 │
    │ • Invite    │                                 │
    │   Users     │                                 │
    │ • Configure │                                 │
    │   Settings  │                                 │
    └─────────────┘                   └──────────────┘
      /api/admin/*                       /api/*
   (Admin routes)                    (Portal routes)
```

### Target Integration Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                  Shared Services Layer                               │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ • Unified API Layer (portal + admin routes w/ tenant scoping)   │ │
│  │ • Shared Component Library (UI, hooks, utilities)              │ │
│  │ • Realtime Event System (pub/sub for sync)                    │ │
│  │ • Notification Hub (email, SMS, push, in-app)                │ │
│  │ • Analytics & Reporting (unified metrics)                    │ │
│  │ • Workflow Engine (task automation across both areas)        │ │
│  │ • Permission/RBAC System (unified role management)           │ │
│  └───────────────────────────────────────────���─────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
                                  ↓
        ┌──────────────────────────┴──────────────────────────┐
        │                                                     │
   ┌─────────────────────────┐              ┌────────────────────────┐
   │   ADMIN DASHBOARD       │              │   CLIENT PORTAL        │
   │   (Internal Team)       │   ←──────→   │   (Customers)          │
   │                         │   Real-time  │                        │
   │ • Service Mgmt          │    Sync &    │ • Service Browsing     │
   │ • Booking Management    │    Visibility│ • Self-Service Booking │
   │ • Task Management       │              │ • Task Collaboration   │
   │ • User/Team Management  │              │ • Document Upload      │
   │ • Settings & Config     │              │ • Approval Requests    │
   │ • Reporting & Analytics │              │ • Invoicing & Payments │
   │ • Compliance Tracking   │              │ • Communication Center │
   │ • KYC & Verification    │              │ • Personal Settings    │
   │                         │              │                        │
   └─────────────────────────┘              └────────────────────────┘
        Admin-only Routes                    Shared & Portal Routes
      /api/admin/* (gatekeeping)          /api/* (tenant-scoped)
```

---

## Entity Integration Map

### Core Entities and Integration Points

| Entity | Admin Features | Portal Features | Integration Status | Notes |
|--------|---|---|---|---|
| **Service** | Create, Edit, Manage, Analytics, Pricing, Availability | Browse, View Details, Request, Filter | ⚠️ Partial | Admin full control; portal read + request creation |
| **Booking** | Create, List, Assign, Calendar, Stats, Confirm, Cancel | Create, List, Manage, Reschedule, Cancel | ⚠️ Partial | Bidirectional but limited portal write |
| **Task** | Create, Assign, Templates, Board/Gantt/List, Analytics, Comments | View Assigned, Update Status, Comment, Track | ❌ Limited | Tasks mostly admin-centric; portal has limited visibility |
| **User** | Create, Manage, Roles, Permissions, Activity, Bulk Operations | View Profile, Edit Settings, 2FA, Sessions | ⚠️ Partial | Admin full control; portal self-service |
| **Invoice** | Create, List, Send, Track, Stats, Download | View, Pay, Download, Track Status | ⚠️ Partial | Admin creates; portal views + pays |
| **Document** | Manage, Organize, Audit, Retention, Download, Archive | Upload, Download, Star, Organize, Search | ✅ Good | Bidirectional; both upload and manage |
| **Approval** | Create, Assign, Track, Audit, Analytics | Request, Respond, Track | ✅ Good | Natural two-way flow |
| **Message/Chat** | Admin console, threads, routing | Chat, Support tickets, Communications | ✅ Good | Both sides communicate |
| **Compliance** | Configure, Track, Deadline, Reports, Evidence | View Tasks, Submit Evidence, Track | ✅ Good | Admin configures; portal complies |
| **Expense** | Approve, Track, Reimburse, Analytics | Submit, Track, Upload Receipt | ✅ Good | Natural two-way flow |
| **Entity/KYC** | Verify, Review, Approve, Configure | Setup, Submit, Verify, Track | ✅ Good | Natural two-way flow |
| **Bill** | Create, Track, Reconcile, Send, Analytics | Receive, Review, Pay, Query | ⚠️ Partial | One-way from admin; portal views + pays |

---

## Detailed Integration Analysis

### 1. Portal Pages & Features

#### Dashboard & Overview
- **Portal Dashboard** (`/portal/dashboard`) - Financial snapshot, quick stats
- **Admin Dashboard** (`/admin`) - System overview, KPIs, health metrics

**Integration Opportunity**: 
- Unify dashboard data sources (same data, different perspectives)
- Share KPI calculations and metrics components

#### Services (Booking-Related)
- **Portal Services** (`/portal/services`) - Browse and request services
- **Admin Services** (`/admin/services`) - Manage service catalog, pricing, availability

**Integration Opportunity**:
- Admin ServiceForm → Portal ServiceCard (shared component)
- Availability slots → real-time sync to portal
- Portal selections feed back to admin analytics (view tracking)

#### Bookings
- **Portal Bookings** (`/portal/bookings`) - User's bookings, create new
- **Admin Bookings** (`/admin/bookings`) - Manage all bookings, assign team

**Integration Opportunity**:
- Unified booking data model with role-based visibility
- Shared calendar/scheduling component
- Real-time booking status sync
- Admin team assignments reflected in portal

#### Service Requests
- **Portal Service Requests** (`/portal/service-requests`) - Create and track requests
- **Admin Service Requests** (`/admin/service-requests`) - Manage incoming requests

**Integration Opportunity**:
- Bidirectional request updates (portal: create, track; admin: assign, update)
- Shared status/workflow automation
- Real-time notifications both ways

#### Tasks
- **Portal Tasks** (Limited) - Assigned tasks view only
- **Admin Tasks** (`/admin/tasks`) - Full task management with Gantt, Board, Calendar

**Integration Opportunity**: 
- Portal task mini-workbench (assigned tasks only)
- Shared TaskCard component
- Real-time task updates
- Portal task comments sync with admin

#### Users & Team Management
- **Portal Settings** (`/portal/settings`) - Self-service profile, preferences
- **Admin Users** (`/admin/users`) - Full user directory, bulk operations, RBAC

**Integration Opportunity**:
- Shared user form validation (zod schemas)
- Admin team assignments visible in portal (who's assigned to my booking?)
- Portal team member profiles (public info)

#### Documents & Attachments
- **Portal Documents** (`/portal/documents`) - Upload, manage, download
- **Admin Document Management** - Organize, audit, retention

**Integration Opportunity**:
- Shared DocumentCard component
- Unified document metadata and versioning
- Real-time document status (AV scanning)
- Admin folder organization visible in portal

#### Invoicing & Payments
- **Portal Invoicing** (`/portal/invoicing`) - View invoices, pay online
- **Admin Invoices** (`/admin/invoices`) - Create, send, track, reconcile

**Integration Opportunity**:
- Shared invoice template components
- Real-time payment status sync
- Admin invoice creation instantly visible in portal
- Portal payment instantly updates admin records

#### Approvals
- **Portal Approvals** (`/portal/approvals`) - Request and respond to approvals
- **Admin Approvals** - Create and manage approval workflows

**Integration Opportunity**:
- Unified approval workflow engine
- Real-time approval notifications both ways
- Shared ApprovalCard component

#### Compliance & KYC
- **Portal KYC** (`/portal/kyc`) - Entity verification, step-by-step
- **Portal Compliance** (`/portal/compliance`) - Task tracking, evidence submission
- **Admin KYC/Compliance** - Review, verify, approve

**Integration Opportunity**:
- Shared verification step components
- Real-time status sync
- Admin notes visible in portal (with permission)

#### Messages & Communication
- **Portal Messages** (`/portal/messages`) - Chat, support tickets
- **Admin Chat** (`/admin/chat`) - Chat console, routing

**Integration Opportunity**:
- Unified message thread model
- Shared ChatWidget component
- Real-time message delivery
- Admin routing visible to portal (assigned agent)

#### Bills & Expenses
- **Portal Bills** (`/portal/bills`) - Vendor bills, approval, payment
- **Admin Expenses** (`/admin/expenses`) - Manage expenses

**Integration Opportunity**:
- Shared bill/expense models
- Real-time status updates
- Admin receipt scanning available to portal (expense submission)

---

### 2. API Routes Integration

#### Portal API Routes (Non-Admin)

```
GET  /api/services                    # List services
GET  /api/services/:id                # Service details
GET  /api/bookings                    # User's bookings
POST /api/bookings                    # Create booking
GET  /api/bookings/:id                # Booking details
DELETE /api/bookings/:id              # Cancel booking
POST /api/portal/service-requests     # Create service request
GET  /api/portal/service-requests     # List service requests
GET  /api/documents                   # List documents
POST /api/documents                   # Upload document
GET  /api/documents/:id/download      # Download document
POST /api/documents/:id/star          # Star document
GET  /api/kyc                         # KYC status
POST /api/kyc/:stepId                 # Complete KYC step
GET  /api/compliance                  # Compliance tasks
GET  /api/billing/invoices            # List invoices
POST /api/billing/invoices            # Create invoice
POST /api/billing/invoices/:id/pay    # Pay invoice
GET  /api/approvals                   # List approvals
POST /api/approvals/:id/approve       # Approve request
GET  /api/messages                    # List messages
POST /api/messages                    # Send message
GET  /api/portal/realtime             # SSE: realtime events
GET  /api/support/tickets             # List support tickets
POST /api/support/tickets             # Create ticket
GET  /api/users/profile               # User profile
PUT  /api/users/preferences           # Update preferences
GET  /api/wallet                      # Payment methods
POST /api/wallet/payment-methods      # Add payment method
GET  /api/bills                       # List bills
POST /api/bills/:id/approve           # Approve bill
GET  /api/cart                        # Shopping cart
POST /api/cart/checkout               # Checkout
POST /api/entities/setup              # Business setup
GET  /api/entities/:id                # Entity status
```

#### Admin API Routes

```
GET  /api/admin/services              # List all services
POST /api/admin/services              # Create service
GET  /api/admin/services/:id          # Service details
PUT  /api/admin/services/:id          # Update service
DELETE /api/admin/services/:id        # Delete service
POST /api/admin/services/bulk         # Bulk operations
GET  /api/admin/services/stats        # Service analytics
GET  /api/admin/bookings              # List all bookings
POST /api/admin/bookings              # Create booking
GET  /api/admin/bookings/:id          # Booking details
PUT  /api/admin/bookings/:id          # Update booking
GET  /api/admin/bookings/stats        # Booking stats
GET  /api/admin/tasks                 # List all tasks
POST /api/admin/tasks                 # Create task
GET  /api/admin/tasks/:id             # Task details
PUT  /api/admin/tasks/:id             # Update task
POST /api/admin/tasks/bulk            # Bulk task operations
GET  /api/admin/tasks/analytics       # Task analytics
GET  /api/admin/users                 # List all users
POST /api/admin/users                 # Create user
GET  /api/admin/users/:id             # User details
PUT  /api/admin/users/:id             # Update user
POST /api/admin/users/bulk            # Bulk user operations
GET  /api/admin/users/activity        # User activity logs
POST /api/admin/team-management       # Team operations
GET  /api/admin/service-requests      # Service requests
POST /api/admin/service-requests      # Create request
GET  /api/admin/settings              # Organization settings
PUT  /api/admin/settings              # Update settings
GET  /api/admin/analytics             # System analytics
GET  /api/admin/reports               # Reporting
GET  /api/admin/permissions           # RBAC management
GET  /api/admin/realtime              # SSE: admin events
GET  /api/admin/availability-slots    # Availability management
GET  /api/admin/invoices              # Invoicing
GET  /api/admin/languages             # Localization
GET  /api/admin/translations          # Translation management
... (and 50+ more admin endpoints)
```

#### Integration Strategy

**Current Issues:**
1. **Route Duplication**: Portal and admin have separate endpoints for similar data
2. **Inconsistent Data Models**: Admin endpoints may return different fields than portal endpoints
3. **Limited Bi-directionality**: Mostly read from portal, write from admin
4. **No Real-time Sync**: Portal displays stale data; admin doesn't see portal activities

**Solution Approach:**

```
Phase 1: Unify Data Models (API Contract)
├─ Standardize response models for shared entities
├─ Add field mappings for admin-only vs portal-accessible fields
├─ Implement consistent pagination/filtering
└─ Document permission scopes per endpoint

Phase 2: Implement Permission-Based API Routes
├─ Create unified /api/* routes with role-based field filtering
├─ Implement tenant scoping for all endpoints
├─ Add RBAC checks in route handlers
└─ Keep /api/admin/* as convenience routes (may delegate to unified routes)

Phase 3: Real-time Event System
├─ Implement pub/sub for entity changes (using postgres realtime)
├─ Sync events from portal to admin dashboards
├─ Sync events from admin to portal (task assignments, approvals, etc.)
└─ Use webhooks for external integrations

Phase 4: Component & Hook Unification
├─ Extract shared logic into composable hooks
├─ Create reusable component library
├─ Implement permission-based component rendering
└─ Share form validation schemas (zod)
```

---

### 3. Shared Components Library

#### Existing Shared Components

| Component | Location | Usage | Integration Status |
|-----------|----------|-------|---|
| **DataTable** | `src/components/dashboard/DataTable.tsx` | Portal & Admin dashboards | ✅ Shared |
| **Button** | `src/components/ui/button.tsx` (shadcn) | Everywhere | ✅ Shared |
| **Dialog** | `src/components/ui/dialog.tsx` (shadcn) | Modals in both | ✅ Shared |
| **Card** | `src/components/ui/card.tsx` (shadcn) | Layout | ✅ Shared |
| **Form** | `src/components/ui/form.tsx` (shadcn) | Forms | ✅ Shared |
| **Tabs** | `src/components/ui/tabs.tsx` (shadcn) | Tabbed interfaces | ✅ Shared |
| **Select** | `src/components/ui/select.tsx` (shadcn) | Dropdowns | ✅ Shared |

#### New Components to Extract/Create

| Component | Purpose | Used In | Priority |
|-----------|---------|---------|----------|
| **ServiceCard** | Display service details (shared between browse & admin) | Portal/Admin | HIGH |
| **BookingForm** | Create/edit booking (shared validation) | Portal/Admin | HIGH |
| **TaskCard** | Display task (used in multiple views) | Portal/Admin | HIGH |
| **TaskForm** | Create/edit task | Admin/Portal | HIGH |
| **UserCard** | Display user profile info | Portal/Admin | MEDIUM |
| **InvoiceCard** | Display invoice | Portal/Admin | MEDIUM |
| **DocumentCard** | Display document with metadata | Portal/Admin | MEDIUM |
| **ApprovalCard** | Display approval request | Portal/Admin | MEDIUM |
| **TimelineView** | KYC/Compliance step visualization | Portal/Admin | MEDIUM |
| **ChatWidget** | In-app chat/messaging | Portal/Admin | MEDIUM |
| **NotificationCenter** | Notification inbox | Portal/Admin | LOW |
| **RealtimeIndicator** | Show connection status | Portal/Admin | LOW |

#### Shared Hooks to Extract

```typescript
// Data Fetching
useServices()                  // Fetch services with filters
useBookings()                  // Fetch user/team bookings
useTasks()                     // Fetch assigned/all tasks
useUsers()                     // Fetch users with filters
useDocuments()                 // Fetch documents
useInvoices()                  // Fetch invoices
useApprovals()                 // Fetch approval requests
useMessages()                  // Fetch messages/chat

// State Management
useTaskFilters()               // Task filtering logic
useBookingCalendar()           // Calendar state management
useNotifications()             // Notification queue

// Features
useRealtime()                  // Realtime event subscription
usePermissions()               // Check user permissions
useFormValidation()            // Form validation helpers
useNotificationToast()         // Toast notifications
useFileUpload()                // File upload with progress
useLocalStorage()              // Client-side persistence

// Admin-specific
useAdminContext()              // Admin context (already exists)
useTeamAssignment()            // Team/workload management
useBulkOperations()            // Bulk action handling
```

#### Shared Type Definitions

```typescript
// src/types/shared/entities.ts
export interface ServiceDTO {
  id: string
  name: string
  slug: string
  description: string
  price: Decimal
  duration: number
  image?: string
  active: boolean
  featured: boolean
  // ... admin-only fields in separate interface
}

export interface BookingDTO {
  id: string
  serviceId: string
  clientId: string
  status: BookingStatus
  scheduledAt: Date
  duration: number
  // ... admin-only fields
}

export interface TaskDTO {
  id: string
  title: string
  description?: string
  status: TaskStatus
  assigneeId?: string
  dueAt?: Date
  // ... admin-only fields
}

// ... more shared types

// src/types/shared/api-responses.ts
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  meta?: {
    total: number
    page: number
    limit: number
  }
}

// src/types/shared/permissions.ts
export enum Permission {
  // Service
  SERVICE_VIEW = 'service:view',
  SERVICE_CREATE = 'service:create',
  SERVICE_UPDATE = 'service:update',
  // Booking
  BOOKING_VIEW_OWN = 'booking:view-own',
  BOOKING_VIEW_ALL = 'booking:view-all',
  BOOKING_CREATE = 'booking:create',
  BOOKING_UPDATE_OWN = 'booking:update-own',
  BOOKING_UPDATE_ALL = 'booking:update-all',
  // ... more permissions
}
```

---

## Phase-Based Integration Roadmap

### Timeline Overview

```
Phase 1: Foundation & Architecture        (Weeks 1-3)
├─ Audit & Documentation
├─ Unify Data Models
├─ Extract Shared Types
└─ Setup Shared Component Library

Phase 2: Service & Booking Integration     (Weeks 4-6)
├─ Integrate Service Management
├─ Unify Booking System
├─ Real-time Availability Sync
└─ Shared Booking Components

Phase 3: Task & User Integration          (Weeks 7-9)
├─ Task Bi-directionality
├─ User Profile Unification
├─ Team Assignment Visibility
└─ Bulk Operations Framework

Phase 4: Document & Communication        (Weeks 10-12)
├─ Unified Document System
├─ Chat Integration
├─ Notification Hub
└─ Message Threading

Phase 5: Advanced Features                (Weeks 13-15)
├─ Real-time Event System
├─ Approval Workflow Engine
├─ Analytics Unification
└─ Export/Report System

Phase 6: Optimization & Testing           (Weeks 16-18)
├─ Performance Optimization
├─ E2E Testing
├─ Security Audit
└─ Production Hardening
```

---

## Phase 1: Foundation & Architecture (Weeks 1-3)

### Goals
- Establish unified architecture and shared patterns
- Create foundational shared code libraries
- Document data models and API contracts
- Setup development infrastructure

### Phase 1.1: Audit & Documentation

#### Task 1.1.1: Complete API Contract Audit
**Objective**: Document all existing API routes and their current behavior
**Deliverables**:
- CSV mapping of all API routes (portal & admin)
- Request/response schemas for each route
- Current permission/role requirements
- Authentication/authorization checks
- Rate limiting and caching strategy

**Files to Create**:
- `docs/api-contract-audit.md`
- `docs/api-routes-mapping.csv`

#### Task 1.1.2: Extract Shared Type Definitions
**Objective**: Define canonical shared types for all domain entities
**Deliverables**:
- Zod schemas for all entities
- TypeScript interfaces for API DTOs
- Enum definitions for statuses, roles, permissions

**Files to Create**:
```
src/types/shared/
├─ entities/
│  ├─ service.ts
│  ├─ booking.ts
│  ├─ task.ts
│  ├─ user.ts
│  ├─ document.ts
│  ├─ invoice.ts
│  ├─ approval.ts
│  ├─ message.ts
│  └─ index.ts
├─ api.ts              # API response/request types
├─ permissions.ts      # Permission enum and types
├─ roles.ts           # Role definitions
└─ index.ts
```

#### Task 1.1.3: Document Current Architecture
**Objective**: Create architectural diagrams and flow documentation
**Deliverables**:
- Architecture diagrams (Mermaid/ASCII)
- Data flow diagrams
- Authentication flow
- Permission model documentation
- Realtime communication architecture

**Files to Create**:
- `docs/architecture/current-state.md`
- `docs/architecture/data-models.md`
- `docs/architecture/auth-flow.md`
- `docs/architecture/realtime-design.md`

### Phase 1.2: Extract Shared Infrastructure

#### Task 1.2.1: Create Shared Types Library
**Objective**: Centralize all shared TypeScript types and Zod schemas
**Implementation**:

```typescript
// src/types/shared/entities/service.ts
import { z } from 'zod'

export const ServiceStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED'])
export type ServiceStatus = z.infer<typeof ServiceStatusEnum>

export const ServiceBaseSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().min(0).max(5000),
  price: z.number().positive().optional(),
  duration: z.number().positive().optional(),
  category: z.string().optional(),
  image: z.string().url().optional(),
  active: z.boolean(),
  featured: z.boolean(),
  status: ServiceStatusEnum,
})

export const ServiceAdminSchema = ServiceBaseSchema.extend({
  basePrice: z.number().positive().optional(),
  advanceBookingDays: z.number().int().min(0),
  minAdvanceHours: z.number().int().min(0),
  maxDailyBookings: z.number().int().positive().optional(),
  bufferTime: z.number().int().min(0),
  businessHours: z.record(z.any()).optional(),
})

export type Service = z.infer<typeof ServiceBaseSchema>
export type ServiceAdmin = z.infer<typeof ServiceAdminSchema>
```

**Files to Create**:
- `src/types/shared/` (entire directory structure shown above)
- `src/schemas/shared/` (Zod schemas for validation)
- `src/lib/shared/` (shared utilities and helpers)

#### Task 1.2.2: Extract Shared Hooks
**Objective**: Move reusable React hooks to shared library
**Implementation**:

```typescript
// src/hooks/shared/useServices.ts
import { useQuery } from '@tanstack/react-query'
import type { Service } from '@/types/shared'

export function useServices(filters?: ServiceFilters) {
  return useQuery({
    queryKey: ['services', filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters || {})
      const res = await fetch(`/api/services?${params}`)
      return res.json() as Promise<Service[]>
    },
  })
}

// src/hooks/shared/useTenantContext.ts
export function useTenantContext() {
  // Get tenant from session or context
}

// src/hooks/shared/usePermissions.ts
export function usePermissions(resource: string, action: string) {
  // Check if user has permission
}
```

**Files to Create**:
```
src/hooks/shared/
├─ useServices.ts
├─ useBookings.ts
├─ useTasks.ts
├─ useUsers.ts
├─ useDocuments.ts
├─ useRealtime.ts
├─ usePermissions.ts
├─ useTenant.ts
└─ index.ts
```

#### Task 1.2.3: Setup Shared Component Library
**Objective**: Create foundation for reusable components
**Implementation**:

```typescript
// src/components/shared/ServiceCard.tsx
'use client'
import { Service } from '@/types/shared'

interface ServiceCardProps {
  service: Service
  variant?: 'portal' | 'admin'
  onSelect?: (id: string) => void
}

export function ServiceCard({ service, variant = 'portal', onSelect }: ServiceCardProps) {
  return (
    <div className="service-card">
      {service.image && <img src={service.image} alt={service.name} />}
      <h3>{service.name}</h3>
      <p>{service.description}</p>
      {variant === 'admin' && (
        <div className="admin-info">
          <span>{service.price}</span>
          <span>{service.status}</span>
        </div>
      )}
      {onSelect && <button onClick={() => onSelect(service.id)}>Select</button>}
    </div>
  )
}

export default ServiceCard
```

**Files to Create**:
```
src/components/shared/
├─ ServiceCard.tsx
├─ BookingForm.tsx
├─ TaskCard.tsx
├─ TaskForm.tsx
├─ UserCard.tsx
├─ DocumentCard.tsx
├─ InvoiceCard.tsx
├─ ApprovalCard.tsx
├─ ChatWidget.tsx
├─ NotificationCenter.tsx
├─ TimelineView.tsx
├─ FormField.tsx
├─ DataTable.tsx
└─ index.ts
```

### Phase 1.3: Setup Development Infrastructure

#### Task 1.3.1: Configure Monorepo (Optional)
**Objective**: Setup package structure for shared code
**Deliverables**:
- Configure pnpm workspaces (if applicable)
- Setup shared package exports
- Configure build pipeline for shared packages

#### Task 1.3.2: Create Testing Framework
**Objective**: Establish testing patterns for shared code
**Implementation**:
- Unit test setup for hooks and utilities
- Component testing patterns
- API mocking strategy
- E2E test framework setup

**Files to Create**:
- `src/lib/test-utils.ts`
- `src/lib/__tests__/shared-hooks.test.ts`
- `vitest.config.ts` (if new)

#### Task 1.3.3: Setup Type Safety
**Objective**: Enforce type safety across codebase
**Tasks**:
- Configure strict TypeScript in `tsconfig.json`
- Setup ESLint rules for type safety
- Configure pre-commit hooks to check types
- Add type coverage checks

**Files to Modify**:
- `tsconfig.json`
- `.eslintrc.json`
- `.husky/pre-commit`

---

## Phase 2: Service & Booking Integration (Weeks 4-6)

### Goals
- Unify service management and browsing
- Implement bidirectional booking system
- Real-time availability synchronization
- Shared UI components for services and bookings

### Phase 2.1: Service Integration

#### Task 2.1.1: Unified Service API Routes
**Objective**: Create centralized service endpoints with role-based access
**Implementation**:

```typescript
// src/app/api/services/route.ts
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tenantId = session.user.tenantId
  const active = searchParams.get('active') === 'true'
  const featured = searchParams.get('featured') === 'true'
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  // Role-based filtering
  const isAdmin = session.user.role === 'ADMIN'
  const whereClause: any = { tenantId }

  if (!isAdmin) {
    whereClause.active = true
  }
  if (active !== null) whereClause.active = active
  if (featured !== null) whereClause.featured = featured

  const services = await prisma.service.findMany({
    where: whereClause,
    take: limit,
    skip: offset,
    include: {
      availabilitySlots: isAdmin ? true : { select: { id: true, date: true, startTime: true } },
    },
  })

  return NextResponse.json({
    success: true,
    data: services,
    meta: { total: await prisma.service.count({ where: whereClause }) },
  })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  // Validate and create service
  const service = await prisma.service.create({
    data: {
      ...body,
      tenantId: session.user.tenantId,
    },
  })

  return NextResponse.json({ success: true, data: service })
}
```

**Files to Modify/Create**:
- `src/app/api/services/route.ts` (update to include admin checks)
- `src/app/api/services/[id]/route.ts` (unify GET, PUT, DELETE)
- `src/app/api/admin/services/route.ts` (delegate to main route)

#### Task 2.1.2: Service Availability Real-time Sync
**Objective**: Sync availability slots in real-time between admin and portal
**Implementation**:

```typescript
// src/lib/realtime/availability.ts
import { createClient } from '@supabase/supabase-js'

export class AvailabilityRealtime {
  private supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

  subscribe(serviceId: string, callback: (slots: AvailabilitySlot[]) => void) {
    return this.supabase
      .channel(`availability:${serviceId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'availability_slots',
        filter: `service_id=eq.${serviceId}`,
      }, (payload) => {
        callback(payload.new)
      })
      .subscribe()
  }

  publishUpdate(serviceId: string, slots: AvailabilitySlot[]) {
    // Publish to realtime channel
  }
}
```

**Files to Create**:
- `src/lib/realtime/availability.ts`
- `src/hooks/shared/useAvailability.ts`

#### Task 2.1.3: Shared Service Components
**Objective**: Create reusable service components for portal and admin
**Implementation**:

```typescript
// src/components/shared/ServiceCard.tsx
// src/components/shared/ServiceGrid.tsx
// src/components/shared/ServiceForm.tsx
// src/components/shared/ServiceFilters.tsx

// Update existing:
// src/components/portal/ServicesDirectory.tsx -> use shared components
// src/components/admin/services/ServiceForm.tsx -> use shared components
```

**Files to Create**:
- `src/components/shared/ServiceCard.tsx`
- `src/components/shared/ServiceGrid.tsx`
- `src/components/shared/ServiceFilter.tsx`

### Phase 2.2: Booking Integration

#### Task 2.2.1: Unified Booking API
**Objective**: Merge portal and admin booking endpoints with role-based access
**Implementation**:

```typescript
// src/app/api/bookings/route.ts (unified)
export async function GET(request: NextRequest) {
  const session = await getSession()
  const { searchParams } = new URL(request.url)
  const tenantId = session.user.tenantId
  const isAdmin = session.user.role === 'ADMIN'

  const whereClause: any = { tenantId }

  // Portal users see only their bookings
  if (!isAdmin) {
    whereClause.clientId = session.user.id
  }

  // Optional: admin filter by client
  if (isAdmin && searchParams.has('clientId')) {
    whereClause.clientId = searchParams.get('clientId')
  }

  const bookings = await prisma.booking.findMany({
    where: whereClause,
    include: {
      service: true,
      client: { select: { id: true, name: true, email: true } },
      assignedTeamMember: isAdmin,
    },
  })

  return NextResponse.json({ success: true, data: bookings })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  const body = await request.json()

  // Validate booking data
  const booking = await prisma.booking.create({
    data: {
      ...body,
      clientId: body.clientId || session.user.id,
      tenantId: session.user.tenantId,
    },
  })

  // Publish realtime event
  publishEvent('booking:created', booking)

  return NextResponse.json({ success: true, data: booking })
}
```

**Files to Modify**:
- `src/app/api/bookings/route.ts` (add admin role checks)
- `src/app/api/bookings/[id]/route.ts` (unify)
- `src/app/api/admin/bookings/route.ts` (delegate to main route)

#### Task 2.2.2: Real-time Booking Updates
**Objective**: Sync booking changes between admin and portal in real-time
**Implementation**:

```typescript
// src/hooks/shared/useBookingRealtime.ts
import { useEffect, useState } from 'react'
import { useRealtimeChannel } from '@/hooks/shared/useRealtime'

export function useBookingRealtime(bookingId: string) {
  const [booking, setBooking] = useState<Booking | null>(null)
  const channel = useRealtimeChannel(`booking:${bookingId}`)

  useEffect(() => {
    const subscription = channel.on('message', (payload) => {
      if (payload.event === 'updated') {
        setBooking(payload.data)
      }
    }).subscribe()

    return () => subscription.unsubscribe()
  }, [channel])

  return booking
}
```

**Files to Create**:
- `src/hooks/shared/useBookingRealtime.ts`

#### Task 2.2.3: Booking Calendar Component
**Objective**: Create shared calendar component for booking management
**Implementation**:

```typescript
// src/components/shared/BookingCalendar.tsx
interface BookingCalendarProps {
  serviceId: string
  onSelectSlot: (date: Date, startTime: string) => void
  viewMode?: 'portal' | 'admin'  // Admin can see all, portal sees available only
}
```

**Files to Create**:
- `src/components/shared/BookingCalendar.tsx`
- `src/components/shared/AvailabilityGrid.tsx`

---

## Phase 3: Task & User Integration (Weeks 7-9)

### Goals
- Enable bidirectional task management
- Unify user profile and team management
- Implement task visibility for portal users
- Real-time task assignment notifications

### Phase 3.1: Task Integration

#### Task 3.1.1: Portal Task Features
**Objective**: Enable portal users to view and interact with assigned tasks
**Implementation**:

```typescript
// src/app/portal/tasks/page.tsx
'use client'
import { useQuery } from '@tanstack/react-query'

export default function PortalTasksPage() {
  const { data: tasks } = useQuery({
    queryKey: ['tasks', 'assigned-to-me'],
    queryFn: async () => {
      const res = await fetch('/api/tasks?assignedToMe=true')
      return res.json()
    },
  })

  return (
    <div className="portal-tasks">
      <h1>My Tasks</h1>
      <TaskList tasks={tasks} variant="portal" />
    </div>
  )
}
```

**Files to Create**:
- `src/app/portal/tasks/page.tsx`
- `src/app/portal/tasks/[id]/page.tsx`

#### Task 3.1.2: Task Status Updates from Portal
**Objective**: Allow portal users to update task status, add comments
**Implementation**:

```typescript
// src/app/api/tasks/[id]/status/route.ts (new)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  const { status } = await request.json()

  const task = await prisma.task.findUnique({
    where: { id: params.id },
  })

  // Verify user is assignee
  if (task.assigneeId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updated = await prisma.task.update({
    where: { id: params.id },
    data: { status },
  })

  // Publish event
  publishEvent('task:status-changed', updated)

  return NextResponse.json({ success: true, data: updated })
}
```

**Files to Create**:
- `src/app/api/tasks/[id]/status/route.ts`
- `src/app/api/tasks/[id]/comments/route.ts`

#### Task 3.1.3: Shared Task Components
**Objective**: Create reusable task components
**Implementation**:

```typescript
// src/components/shared/TaskCard.tsx
// src/components/shared/TaskForm.tsx
// src/components/shared/TaskComments.tsx
// src/components/shared/TaskTimeline.tsx
```

**Files to Create**:
- `src/components/shared/TaskCard.tsx`
- `src/components/shared/TaskForm.tsx`
- `src/components/shared/TaskComments.tsx`

### Phase 3.2: User & Team Integration

#### Task 3.2.1: Unified User Profile
**Objective**: Merge portal and admin user profile management
**Implementation**:

```typescript
// src/app/api/users/[id]/profile/route.ts
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  const userId = params.id

  // Only allow viewing own profile or if admin
  if (session.user.id !== userId && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userProfile: true,
      teamMembers: session.user.role === 'ADMIN',
    },
  })

  return NextResponse.json({ success: true, data: user })
}
```

**Files to Modify**:
- `src/app/api/users/profile/route.ts` (existing)
- `src/app/api/admin/users/[id]/route.ts` (delegate to shared route)

#### Task 3.2.2: Team Visibility in Portal
**Objective**: Show assigned team members and their profiles in portal
**Implementation**:

```typescript
// src/components/shared/TeamMemberCard.tsx
interface TeamMemberCardProps {
  member: TeamMember
  variant?: 'full' | 'avatar-only'
}

export function TeamMemberCard({ member, variant = 'full' }: TeamMemberCardProps) {
  return (
    <div className="team-member">
      <img src={member.user.image} alt={member.user.name} />
      {variant === 'full' && (
        <>
          <h3>{member.user.name}</h3>
          <p>{member.position}</p>
          <p className="email">{member.user.email}</p>
        </>
      )}
    </div>
  )
}
```

**Files to Create**:
- `src/components/shared/TeamMemberCard.tsx`
- `src/components/shared/TeamDirectory.tsx`

---

## Phase 4: Document & Communication Integration (Weeks 10-12)

### Goals
- Unified document management system
- Integrated messaging and chat
- Notification hub spanning both areas
- Real-time message delivery

### Phase 4.1: Document Integration

#### Task 4.1.1: Unified Document API
**Objective**: Merge portal document upload/management with admin system
**Implementation**:

```typescript
// src/app/api/documents/route.ts (unified)
export async function GET(request: NextRequest) {
  const session = await getSession()
  const { searchParams } = new URL(request.url)
  const tenantId = session.user.tenantId
  const isAdmin = session.user.role === 'ADMIN'

  const whereClause: any = { tenantId }

  // Portal users see only their documents
  if (!isAdmin) {
    whereClause.uploadedBy = session.user.id
  }

  // Optional: admin filter by user
  if (isAdmin && searchParams.has('uploadedBy')) {
    whereClause.uploadedBy = searchParams.get('uploadedBy')
  }

  const documents = await prisma.documentVersion.findMany({
    where: whereClause,
    include: {
      uploader: { select: { id: true, name: true, email: true } },
    },
  })

  return NextResponse.json({ success: true, data: documents })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  const formData = await request.formData()
  const file = formData.get('file') as File

  // Upload to storage
  const uploadKey = await uploadFile(file, session.user.tenantId)

  const document = await prisma.documentVersion.create({
    data: {
      tenantId: session.user.tenantId,
      uploaderId: session.user.id,
      filename: file.name,
      storageKey: uploadKey,
      mimeType: file.type,
      size: file.size,
    },
  })

  // Publish event for admin notification
  publishEvent('document:uploaded', document)

  return NextResponse.json({ success: true, data: document })
}
```

**Files to Modify**:
- `src/app/api/documents/route.ts`
- `src/app/api/documents/[id]/route.ts`

#### Task 4.1.2: Document Real-time Status
**Objective**: Real-time AV scanning status and document processing
**Implementation**:

```typescript
// src/hooks/shared/useDocumentStatus.ts
export function useDocumentStatus(documentId: string) {
  const [status, setStatus] = useState<DocumentStatus>('scanning')
  const channel = useRealtimeChannel(`document:${documentId}`)

  useEffect(() => {
    const subscription = channel
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'document_versions',
        filter: `id=eq.${documentId}`,
      }, (payload) => {
        setStatus(payload.new.status)
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [channel, documentId])

  return status
}
```

**Files to Create**:
- `src/hooks/shared/useDocumentStatus.ts`

### Phase 4.2: Communication Integration

#### Task 4.2.1: Unified Message/Chat API
**Objective**: Create single message API used by both portal and admin
**Implementation**:

```typescript
// src/app/api/messages/route.ts (unified)
export async function GET(request: NextRequest) {
  const session = await getSession()
  const { searchParams } = new URL(request.url)
  const threadId = searchParams.get('threadId')
  const tenantId = session.user.tenantId

  const messages = await prisma.message.findMany({
    where: {
      thread: { tenantId },
      threadId,
    },
    include: {
      sender: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ success: true, data: messages })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  const { content, threadId, mentionedUserIds } = await request.json()

  const message = await prisma.message.create({
    data: {
      content,
      threadId,
      senderId: session.user.id,
      mentions: mentionedUserIds || [],
    },
    include: { sender: true },
  })

  // Publish realtime event
  publishEvent('message:new', message, { threadId })

  // Send notifications to mentioned users
  for (const userId of mentionedUserIds || []) {
    sendNotification(userId, {
      type: 'mention',
      message: `${session.user.name} mentioned you in a message`,
      link: `/messages/${threadId}`,
    })
  }

  return NextResponse.json({ success: true, data: message })
}
```

**Files to Modify**:
- `src/app/api/messages/route.ts`
- Create: `src/app/api/messages/[id]/route.ts`

#### Task 4.2.2: Notification Hub
**Objective**: Centralized notification system for both portal and admin
**Implementation**:

```typescript
// src/lib/notifications/hub.ts
export class NotificationHub {
  async sendNotification(userId: string, notification: Notification) {
    const record = await prisma.notification.create({
      data: {
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        tenantId: notification.tenantId,
      },
    })

    // Publish realtime event
    publishEvent('notification:new', record, { userId })

    // Send email/SMS if user preferences allow
    if (await shouldSendEmail(userId, notification.type)) {
      await sendEmail(userId, notification)
    }
  }

  async markAsRead(userId: string, notificationId: string) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    })

    publishEvent('notification:read', { notificationId }, { userId })
  }
}

export const notificationHub = new NotificationHub()
```

**Files to Create**:
- `src/lib/notifications/hub.ts`
- `src/app/api/notifications/route.ts`
- `src/hooks/shared/useNotifications.ts`
- `src/components/shared/NotificationCenter.tsx`

---

## Phase 5: Advanced Features (Weeks 13-15)

### Goals
- Real-time event system and synchronization
- Approval workflow engine
- Unified analytics and reporting
- Export and data portability

### Phase 5.1: Real-time Event System

#### Task 5.1.1: Event Publishing Infrastructure
**Objective**: Setup centralized event pub/sub for entity changes
**Implementation**:

```typescript
// src/lib/events/publisher.ts
import { EventEmitter } from 'events'

export enum EntityEvent {
  BOOKING_CREATED = 'booking:created',
  BOOKING_UPDATED = 'booking:updated',
  BOOKING_CANCELLED = 'booking:cancelled',
  SERVICE_UPDATED = 'service:updated',
  TASK_ASSIGNED = 'task:assigned',
  TASK_COMPLETED = 'task:completed',
  DOCUMENT_UPLOADED = 'document:uploaded',
  MESSAGE_SENT = 'message:sent',
  APPROVAL_REQUESTED = 'approval:requested',
  APPROVAL_APPROVED = 'approval:approved',
  APPROVAL_REJECTED = 'approval:rejected',
}

export class EventPublisher extends EventEmitter {
  private static instance: EventPublisher

  static getInstance() {
    if (!EventPublisher.instance) {
      EventPublisher.instance = new EventPublisher()
    }
    return EventPublisher.instance
  }

  publishEvent(event: EntityEvent, data: any, context?: { tenantId?: string; userId?: string }) {
    this.emit(event, { data, context, timestamp: new Date() })
  }
}

export const publishEvent = (event: EntityEvent, data: any, context?: any) => {
  EventPublisher.getInstance().publishEvent(event, data, context)
}
```

**Files to Create**:
- `src/lib/events/publisher.ts`
- `src/lib/events/handlers.ts`
- `src/lib/events/index.ts`

#### Task 5.1.2: Real-time Sync Implementation
**Objective**: Propagate changes across portal and admin in real-time
**Implementation**:

```typescript
// src/lib/realtime/sync.ts
import { EventPublisher } from '@/lib/events/publisher'

export function setupRealtimeSync() {
  const publisher = EventPublisher.getInstance()

  // When admin updates booking, notify portal users
  publisher.on('booking:updated', async ({ data, context }) => {
    publishRealtimeEvent(`booking:${data.id}:updated`, data, {
      recipientId: data.clientId,
    })
  })

  // When portal user uploads document, notify admin
  publisher.on('document:uploaded', async ({ data, context }) => {
    publishRealtimeEvent('admin:documents:new', data, {
      role: 'ADMIN',
      tenantId: context?.tenantId,
    })
  })

  // Bidirectional task updates
  publisher.on('task:assigned', async ({ data, context }) => {
    if (data.assigneeId) {
      publishRealtimeEvent(`task:${data.id}:assigned`, data, {
        recipientId: data.assigneeId,
      })
    }
  })
}
```

**Files to Create**:
- `src/lib/realtime/sync.ts`

### Phase 5.2: Approval Workflow Engine

#### Task 5.2.1: Unified Approval System
**Objective**: Create comprehensive approval workflow with both initiators (portal + admin)
**Implementation**:

```typescript
// src/app/api/approvals/route.ts (unified)
export async function POST(request: NextRequest) {
  const session = await getSession()
  const { title, description, type, requiredApprovals, targetId } = await request.json()

  const approval = await prisma.approval.create({
    data: {
      title,
      description,
      type,
      status: 'PENDING',
      tenantId: session.user.tenantId,
      requesterId: session.user.id,
      targetId,
      requiredApprovals,
    },
  })

  // Notify approvers
  for (const approverId of requiredApprovals) {
    publishEvent('approval:requested', approval, { recipientId: approverId })
  }

  return NextResponse.json({ success: true, data: approval })
}
```

**Files to Create**:
- `src/lib/workflows/approval-engine.ts`
- `src/app/api/approvals/[id]/approve/route.ts`
- `src/app/api/approvals/[id]/reject/route.ts`

### Phase 5.3: Analytics Unification

#### Task 5.3.1: Unified Analytics API
**Objective**: Single analytics endpoint serving both portal and admin dashboards
**Implementation**:

```typescript
// src/app/api/analytics/route.ts
export async function GET(request: NextRequest) {
  const session = await getSession()
  const { searchParams } = new URL(request.url)
  const metric = searchParams.get('metric') // 'bookings', 'revenue', 'tasks', etc.
  const period = searchParams.get('period') // '7d', '30d', 'year'
  const tenantId = session.user.tenantId

  const analytics = await calculateAnalytics(metric, period, tenantId)

  // Filter data based on role
  if (session.user.role === 'CLIENT') {
    // Only show personal analytics
    return NextResponse.json({
      success: true,
      data: filterPersonalAnalytics(analytics, session.user.id),
    })
  }

  return NextResponse.json({ success: true, data: analytics })
}

function calculateAnalytics(metric: string, period: string, tenantId: string) {
  switch (metric) {
    case 'bookings':
      return calculateBookingMetrics(period, tenantId)
    case 'revenue':
      return calculateRevenueMetrics(period, tenantId)
    case 'tasks':
      return calculateTaskMetrics(period, tenantId)
    case 'documents':
      return calculateDocumentMetrics(period, tenantId)
    default:
      return null
  }
}
```

**Files to Create**:
- `src/app/api/analytics/route.ts`
- `src/lib/analytics/metrics.ts`
- `src/hooks/shared/useAnalytics.ts`

---

## Phase 6: Optimization & Testing (Weeks 16-18)

### Goals
- Performance optimization
- Comprehensive testing
- Security hardening
- Production readiness

### Phase 6.1: Performance Optimization

#### Task 6.1.1: API Performance
**Objectives**:
- Optimize database queries (query analysis, proper indexing)
- Implement caching strategies (Redis for frequently accessed data)
- Setup pagination for large datasets
- Implement cursor-based pagination for real-time feeds

**Files to Create/Modify**:
- `src/lib/cache/strategy.ts`
- `src/lib/pagination/cursor.ts`

#### Task 6.1.2: Frontend Performance
**Objectives**:
- Code splitting per route
- Lazy loading of components
- Image optimization
- Bundle size analysis

**Tools**:
- `npm run build` analysis
- Lighthouse audits
- React DevTools Profiler

### Phase 6.2: Testing

#### Task 6.2.1: Unit Tests
**Scope**: All shared hooks, utilities, types
**Files to Create**:
```
src/lib/__tests__/
├─ hooks.useServices.test.ts
├─ hooks.useBookings.test.ts
├─ hooks.useTasks.test.ts
├─ hooks.useRealtime.test.ts
├─ types.ts
├─ validators.test.ts
└─ helpers.test.ts
```

#### Task 6.2.2: Integration Tests
**Scope**: API routes with database
**Files to Create**:
```
src/app/api/__tests__/
├─ services.test.ts
├─ bookings.test.ts
├─ tasks.test.ts
├─ documents.test.ts
└─ messages.test.ts
```

#### Task 6.2.3: E2E Tests
**Scope**: Full user journeys
**Files to Create**:
```
e2e/
├─ portal-workflows.spec.ts
├─ admin-workflows.spec.ts
├─ realtime-sync.spec.ts
└─ cross-integration.spec.ts
```

### Phase 6.3: Security Audit

#### Task 6.3.1: Authorization Checks
**Objectives**:
- Verify all routes have proper authentication
- Check role-based access control (RBAC)
- Verify tenant isolation (multi-tenancy)
- Review data exposure

#### Task 6.3.2: Input Validation
**Objectives**:
- Validate all user inputs with Zod
- Check for SQL injection risks
- Verify XSS protection
- Check CSRF protection

#### Task 6.3.3: Data Security
**Objectives**:
- Sensitive data handling
- PII protection
- Audit logging
- Encryption where needed

---

## Implementation Summary by Entity

### Service Entity

| Phase | Task | Component | API | Database |
|-------|------|-----------|-----|----------|
| 1 | Extract schemas | ServiceDTO | | |
| 2.1 | Unified API | | /api/services | ✅ Service |
| 2.1 | ServiceCard | ServiceCard | | |
| 2.1 | Real-time availability | useAvailability | WebSocket | AvailabilitySlot |
| 3 | Team visibility | TeamMemberCard | | |
| 6 | Performance | Caching | | Query optimization |

### Booking Entity

| Phase | Task | Component | API | Database |
|-------|------|-----------|-----|----------|
| 1 | Extract schemas | BookingDTO | | |
| 2.2 | Unified API | | /api/bookings | ✅ Booking |
| 2.2 | Calendar | BookingCalendar | | |
| 2.2 | Real-time | useBookingRealtime | WebSocket | |
| 3 | Team assignment visibility | | | |
| 6 | Performance | | Pagination | Index optimization |

### Task Entity

| Phase | Task | Component | API | Database |
|-------|------|-----------|-----|----------|
| 1 | Extract schemas | TaskDTO | | |
| 3.1 | Portal visibility | TaskCard | /api/tasks | Task |
| 3.1 | Status updates | TaskForm | /api/tasks/:id/status | |
| 3.1 | Comments | TaskComments | /api/tasks/:id/comments | TaskComment |
| 5.2 | Approval workflow | | | |
| 6 | Performance | Filters | Caching | |

### Document Entity

| Phase | Task | Component | API | Database |
|-------|------|-----------|-----|----------|
| 1 | Extract schemas | DocumentDTO | | |
| 4.1 | Unified API | | /api/documents | DocumentVersion |
| 4.1 | Real-time status | useDocumentStatus | WebSocket | |
| 4.1 | DocumentCard | DocumentCard | | |
| 6 | Performance | Caching | | |

### Message Entity

| Phase | Task | Component | API | Database |
|-------|------|-----------|-----|----------|
| 1 | Extract schemas | MessageDTO | | |
| 4.2 | Unified API | | /api/messages | Message |
| 4.2 | Real-time | ChatWidget | WebSocket | |
| 4.2 | Threading | | /api/messages/:id | MessageThread |
| 5.1 | Sync | | Events | |

### User Entity

| Phase | Task | Component | API | Database |
|-------|------|-----------|-----|----------|
| 1 | Extract schemas | UserDTO | | |
| 3.2 | Unified profile | | /api/users/:id/profile | User |
| 3.2 | Team visibility | TeamMemberCard | | TeamMember |
| 6 | Security | | RBAC checks | |

---

## Cross-Cutting Concerns

### Authentication & Authorization

**Current State**:
- NextAuth for authentication
- Role-based access control (ADMIN, CLIENT, etc.)
- Tenant isolation at database level

**Integration Improvements**:
1. Unified permission model across routes
2. Centralized RBAC checks using middleware
3. Permission scoping for API responses
4. Audit logging for sensitive operations

**Implementation**:

```typescript
// src/lib/auth/middleware.ts
export async function withAuth(handler: Handler, requiredRole?: UserRole) {
  return async (request: NextRequest) => {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (requiredRole && session.user.role !== requiredRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return handler(request, session)
  }
}

// src/lib/auth/tenant-context.ts
export async function withTenantContext(handler: Handler) {
  return async (request: NextRequest, session: Session) => {
    const tenantId = session.user.tenantId
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    })

    return handler(request, { ...session, tenant })
  }
}

// Usage
export const GET = withAuth(
  withTenantContext(async (request, context) => {
    // Handler code
  }),
  'ADMIN'
)
```

### Notification System

**Current State**:
- Email notifications via SendGrid
- In-app notifications (basic)
- No SMS support
- Limited channels

**Integration Plan**:
1. Centralized notification hub
2. Multi-channel notifications (email, SMS, push, in-app)
3. Notification preferences per user
4. Notification history and audit trail

**Implementation**:

```typescript
// src/lib/notifications/types.ts
export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in-app',
}

export interface NotificationPayload {
  type: string
  title: string
  message: string
  channels: NotificationChannel[]
  link?: string
  data?: Record<string, any>
}

// src/lib/notifications/sender.ts
export class NotificationSender {
  async send(userId: string, payload: NotificationPayload) {
    // Store in database
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        link: payload.link,
        data: payload.data,
      },
    })

    // Send via requested channels
    for (const channel of payload.channels) {
      await this.sendViaChannel(userId, notification, channel)
    }
  }

  private async sendViaChannel(userId: string, notification: Notification, channel: NotificationChannel) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    const prefs = await getUserNotificationPreferences(userId)

    if (!prefs.enabled[channel]) return

    switch (channel) {
      case NotificationChannel.EMAIL:
        await this.sendEmail(user.email, notification)
        break
      case NotificationChannel.SMS:
        await this.sendSMS(user.userProfile?.phoneNumber, notification)
        break
      case NotificationChannel.PUSH:
        await this.sendPush(user.id, notification)
        break
      case NotificationChannel.IN_APP:
        // Already stored, will show in notification center
        break
    }
  }
}
```

### Audit Logging

**Current State**:
- Basic audit logs for some operations
- Limited coverage across features
- No comprehensive audit trail

**Integration Plan**:
1. Comprehensive audit logging for all mutations
2. Audit trail dashboard
3. Compliance reporting
4. Data retention policies

**Implementation**:

```typescript
// src/lib/audit/logger.ts
export class AuditLogger {
  async log(event: AuditEvent) {
    await prisma.auditLog.create({
      data: {
        action: event.action,
        resource: event.resource,
        resourceId: event.resourceId,
        userId: event.userId,
        tenantId: event.tenantId,
        metadata: event.metadata,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        result: event.result,
        timestamp: new Date(),
      },
    })

    // Publish event for admin notification (if sensitive)
    if (event.isSensitive) {
      publishEvent('audit:sensitive-action', event)
    }
  }
}

// Usage in API routes
export async function POST(request: NextRequest) {
  const session = await getSession()
  const body = await request.json()

  const result = await performAction(body)

  // Log the action
  await auditLogger.log({
    action: 'create',
    resource: 'booking',
    resourceId: result.id,
    userId: session.user.id,
    tenantId: session.user.tenantId,
    metadata: body,
    ipAddress: request.ip,
    userAgent: request.headers.get('user-agent'),
    result: 'success',
    isSensitive: false,
  })

  return NextResponse.json({ success: true, data: result })
}
```

---

## Key Principles & Best Practices

### 1. Role-Based Component Rendering

```typescript
interface ComponentProps {
  data: any
  variant?: 'portal' | 'admin' | 'both'
}

export function DataComponent({ data, variant = 'both' }: ComponentProps) {
  const session = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  return (
    <div>
      {/* Always visible */}
      <h3>{data.name}</h3>

      {/* Admin only */}
      {(variant === 'admin' || variant === 'both') && isAdmin && (
        <div className="admin-controls">
          <button onClick={() => editData(data)}>Edit</button>
          <button onClick={() => deleteData(data.id)}>Delete</button>
        </div>
      )}

      {/* Portal only */}
      {(variant === 'portal' || variant === 'both') && !isAdmin && (
        <div className="portal-actions">
          <button onClick={() => selectData(data)}>Select</button>
        </div>
      )}
    </div>
  )
}
```

### 2. Tenant-Scoped Queries

All database queries must filter by tenant to ensure data isolation:

```typescript
// ❌ Bad: No tenant filtering
const bookings = await prisma.booking.findMany()

// ✅ Good: Tenant-scoped
const bookings = await prisma.booking.findMany({
  where: { tenantId: session.user.tenantId },
})

// ✅ Better: Using middleware
const bookings = await withTenantContext(async (tenantId) => {
  return await prisma.booking.findMany({
    where: { tenantId },
  })
})
```

### 3. API Response Consistency

All API endpoints should follow consistent response format:

```typescript
// Successful response
{
  "success": true,
  "data": {...},
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 50
  }
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [...]
  }
}
```

### 4. Real-time Event Naming Convention

```typescript
// Format: resource:action
'booking:created'
'booking:updated'
'booking:cancelled'
'task:assigned'
'task:completed'
'document:uploaded'
'message:sent'
'approval:requested'
```

### 5. Permission Scoping in Responses

Include only fields user has permission to see:

```typescript
// Admin response
{
  "booking": {
    "id": "...",
    "clientId": "...",
    "serviceId": "...",
    "cost": 150.00,        // Admin only
    "internalNotes": "...", // Admin only
    ...
  }
}

// Portal response (same user, not admin)
{
  "booking": {
    "id": "...",
    "serviceId": "...",
    "scheduledAt": "...",
    "status": "confirmed",
    // cost and internalNotes omitted
  }
}
```

---

## Success Metrics

### Integration Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| **Code Reuse** | 20% | 70% | Phase 6 |
| **API Route Consolidation** | 60 routes | 40 routes | Phase 5 |
| **Shared Component Usage** | 5 | 20+ | Phase 6 |
| **Real-time Event Coverage** | 2 events | 15+ events | Phase 5 |
| **Portal Bidirectional Features** | 30% | 80% | Phase 5 |

### User Experience Metrics

| Metric | Target | Timeline |
|--------|--------|----------|
| **Data Sync Latency** | <1 second | Phase 5 |
| **Real-time Notification Delivery** | <2 seconds | Phase 5 |
| **API Response Time** | <200ms (p95) | Phase 6 |
| **Page Load Time** | <2s (portal), <3s (admin) | Phase 6 |

### Quality Metrics

| Metric | Target | Timeline |
|--------|--------|----------|
| **Unit Test Coverage** | >80% | Phase 6 |
| **Integration Test Coverage** | >60% | Phase 6 |
| **E2E Test Coverage** | >40% | Phase 6 |
| **TypeScript Strict Mode** | 100% | Phase 1 |
| **ESLint Pass Rate** | 100% | Phase 1 |

---

## Risk Analysis & Mitigation

### Risk 1: Breaking Changes in Existing Features
**Severity**: High  
**Mitigation**:
- Maintain backward compatibility during migration
- Feature flags for new integrated endpoints
- Parallel running of old and new systems
- Comprehensive testing before rollout

### Risk 2: Data Consistency Issues
**Severity**: High  
**Mitigation**:
- Transaction-based updates for critical operations
- Real-time sync verification
- Audit logging for conflict detection
- Reconciliation jobs for drift detection

### Risk 3: Performance Degradation
**Severity**: Medium  
**Mitigation**:
- Load testing during integration
- Database query optimization
- Caching strategies
- CDN for static assets
- API rate limiting

### Risk 4: Increased Complexity
**Severity**: Medium  
**Mitigation**:
- Clear documentation and architecture diagrams
- Developer onboarding guide
- Code examples and patterns
- Code review process

### Risk 5: Security Vulnerabilities
**Severity**: High  
**Mitigation**:
- Security audit at each phase
- RBAC enforcement at API level
- Tenant isolation verification
- Input validation testing
- Penetration testing

---

## Resource Requirements

### Team Composition
- 1 Senior Full-Stack Developer (lead)
- 1 Backend Developer
- 1 Frontend Developer
- 1 QA Engineer
- 1 DevOps/Infrastructure Engineer (part-time)

### Time Estimate
- **Total Duration**: 18 weeks (4.5 months)
- **Full-time Effort**: 5 FTE weeks = 25 developer weeks
- **Effort per Phase**: 3-5 weeks

### Technology Stack (Already in Use)
- ✅ Next.js 14
- ✅ React
- ✅ TypeScript
- ✅ Prisma ORM
- ✅ PostgreSQL
- ✅ TailwindCSS
- ✅ shadcn/ui
- ✅ NextAuth.js
- ✅ SWR / React Query
- ✅ Zod (validation)

### Additional Tools Needed
- Testing: Vitest, React Testing Library, Playwright
- API Documentation: Swagger/OpenAPI
- Monitoring: Sentry (already configured)
- Analytics: PostHog or Mixpanel
- Real-time: Supabase Realtime or Socket.io

---

## Conclusion

This comprehensive roadmap provides a structured approach to fully integrating the client portal with the admin dashboard. The phased approach allows for:

1. **Risk Mitigation**: Each phase is independently testable and deployable
2. **Value Delivery**: Early phases deliver immediate improvements (Phases 1-3)
3. **Team Scalability**: Clear tasks allow for parallel work streams
4. **Quality Assurance**: Progressive testing and validation
5. **Documentation**: Each phase is well-documented for team members

**Next Steps**:
1. Review and approve this roadmap
2. Create detailed sprint plans for Phase 1
3. Setup development environment and infrastructure
4. Schedule team kickoff and training
5. Begin Phase 1 implementation

---

## Appendix: File Structure for Full Integration

```
src/
├── app/
│   ├── api/
│   │   ├── services/              # Unified service routes
│   │   ├── bookings/              # Unified booking routes
│   │   ├── tasks/                 # Unified task routes
│   │   ├── users/                 # Unified user routes
│   │   ├── documents/             # Unified document routes
│   │   ├── messages/              # Unified message routes
│   │   ├── approvals/             # Unified approval routes
│   │   ├── notifications/         # NEW: Notification hub
│   │   ├── analytics/             # NEW: Unified analytics
│   │   ├── events/                # NEW: Event system
│   │   └── admin/                 # Admin-specific routes (delegation)
│   ├── admin/
│   │   ├── (admin layout)
│   │   ├── page.tsx
│   │   └── ... (existing admin pages)
│   └── portal/
│       ├── (portal layout)
│       ├── page.tsx
│       ├── tasks/                 # NEW: Portal task management
│       └── ... (existing portal pages)
├── components/
│   ├── shared/                    # NEW: Shared components
│   │   ├── ServiceCard.tsx
│   │   ├── BookingForm.tsx
│   │   ├── TaskCard.tsx
│   │   ├── TaskForm.tsx
│   │   ├── UserCard.tsx
│   │   ├── DocumentCard.tsx
│   │   ├── ChatWidget.tsx
│   │   ├── NotificationCenter.tsx
│   │   └── index.ts
│   ├── admin/                     # Existing admin components
│   └── portal/                    # Existing portal components
├── hooks/
│   └── shared/                    # NEW: Shared hooks
│       ├── useServices.ts
│       ├── useBookings.ts
│       ├── useTasks.ts
│       ├── useUsers.ts
│       ├── useDocuments.ts
│       ├── useMessages.ts
│       ├── useRealtime.ts
│       ├── usePermissions.ts
│       ├── useNotifications.ts
│       └── index.ts
├── lib/
│   ├── events/                    # NEW: Event system
│   │   ├── publisher.ts
│   │   ├── handlers.ts
│   │   └── index.ts
│   ├── notifications/             # NEW: Notification hub
│   │   ├── hub.ts
│   │   ├── sender.ts
│   │   ├── channels.ts
│   │   └── types.ts
│   ├── realtime/                  # Enhanced realtime
│   │   ├── sync.ts
│   │   ├── availability.ts
│   │   └── index.ts
│   ├── analytics/                 # NEW: Analytics
│   │   ├── metrics.ts
│   │   └── calculator.ts
│   ├── audit/                     # NEW: Audit logging
│   │   └── logger.ts
│   ├── auth/                      # Enhanced auth
│   │   ├── middleware.ts
│   │   └── tenant-context.ts
│   ├── workflows/                 # NEW: Workflow engine
│   │   ├── approval-engine.ts
│   │   └── task-automation.ts
│   ├── cache/                     # NEW: Caching
│   │   └── strategy.ts
│   ├── pagination/                # NEW: Pagination
│   │   └── cursor.ts
│   └── (existing lib files)
├── types/
│   ├── shared/                    # NEW: Shared types
│   │   ├── entities/
│   │   │   ├── service.ts
│   │   │   ├── booking.ts
│   │   │   ├── task.ts
│   │   │   ├── user.ts
│   │   │   ├── document.ts
│   │   │   ├── message.ts
│   │   │   ├── invoice.ts
│   │   │   └── approval.ts
│   │   ├── api.ts
│   │   ├── permissions.ts
│   │   ├── roles.ts
│   │   └── index.ts
│   └── (existing type files)
├── schemas/
│   └── shared/                    # NEW: Shared Zod schemas
│       ├── entities/
│       │   ├── service.ts
│       │   ├── booking.ts
│       │   └── ...
│       └── index.ts
└─��� utils/
    └── shared/                    # NEW: Shared utilities
        ├── validators.ts
        ├── formatters.ts
        └── helpers.ts

docs/
├── api-contract-audit.md
├── api-routes-mapping.csv
├── architecture/
│   ├── current-state.md
│   ├── data-models.md
│   ├── auth-flow.md
│   └── realtime-design.md
└── PORTAL_ADMIN_INTEGRATION_ROADMAP.md (this file)

tests/
├── unit/
│   ├── hooks/
│   │   ├── useServices.test.ts
│   │   └── ...
│   ├── utils/
│   │   └── ...
│   └── types/
│       └── ...
├── integration/
│   ├── api/
│   │   ├── services.test.ts
│   │   ├── bookings.test.ts
│   │   └── ...
│   └── database/
│       └── ...
└── e2e/
    ├── portal-workflows.spec.ts
    ├── admin-workflows.spec.ts
    └── cross-integration.spec.ts
```

---

**Document Version**: 1.0  
**Last Updated**: November 2024  
**Next Review**: At Phase 1 completion  
**Status**: Ready for Review & Approval
