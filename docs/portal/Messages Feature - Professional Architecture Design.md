# Messages Feature - Professional Architecture Design

## 🎯 Overview

Production-ready unified Messaging system combining chat messages and support tickets with real-time communication and enterprise-grade features.

---

## 📐 Architecture Principles

### 1. **Unified Messaging System**
- Single interface for all communications
- Support tickets and chat messages
- Thread-based conversations
- Real-time updates (polling-based)

### 2. **Modular Design**
- Small, focused components
- Single responsibility
- Easy to test
- Reusable across message types

### 3. **Lazy Loading**
- Code splitting
- Dynamic imports
- Optimized performance
- Better UX

### 4. **Professional Features**
- File attachments
- Rich text support
- Status tracking
- Priority management

---

## 🗂️ Directory Structure

```
src/
├── app/
│   ├── api/
│   │   └── messages/
│   │       ├── route.ts                    # List messages/threads
│   │       ├── [id]/
│   │       │   ├── route.ts                # Get thread details
│   │       │   └── messages/route.ts       # Send message
│   │       ├── tickets/
│   │       │   ├── route.ts                # List/create tickets
│   │       │   └── [id]/
│   │       │       ├── route.ts            # Get/update ticket
│   │       │       └── comments/route.ts   # Add comment
│   │       └── stats/route.ts              # Analytics
│   └── portal/
│       └── messages/
│           └── page.tsx                    # Main page
│
├── components/
│   └── portal/
│       └── messages/
│           ├── MessagesClientPage.tsx      # Main container
│           ├── ThreadsList/
│           │   ├── index.tsx               # Threads list container
│           │   ├── ThreadCard.tsx          # Thread card
│           │   └── ThreadsFilters.tsx      # Filters
│           ├── MessageThread/
│           │   ├── index.tsx               # Thread container
│           │   ├── MessageList.tsx         # Messages list
│           │   ├── MessageItem.tsx         # Single message
│           │   └── MessageInput.tsx        # Input box
│           ├── TicketModal/
│           │   ├── index.tsx               # Create ticket modal
│           │   └── TicketForm.tsx          # Ticket form
│           ├── TicketDetail/
│           │   ├── index.tsx               # Ticket detail view
│           │   ├── TicketInfo.tsx          # Ticket info
│           │   └── TicketComments.tsx      # Comments
│           └── shared/
│               ├── TicketStatus.tsx        # Status badge
│               ├── TicketPriority.tsx      # Priority badge
│               └── MessageTime.tsx         # Time formatter
│
├── lib/
│   ├── services/
│   │   └── messages/
│   │       ├── messages-service.ts         # Business logic
│   │       └── tickets-service.ts          # Tickets logic
│   ├── hooks/
│   │   └── messages/
│   │       ├── useMessages.ts              # Data fetching
│   │       ├── useThreads.ts               # Threads management
│   │       └── useTickets.ts               # Tickets management
│   └── types/
│       └── messages.ts                     # TypeScript types
│
└── prisma/
    └── schema.prisma                       # Database schema (existing)
```

---

## 🗄️ Database Schema

### Existing Models (Already in Schema)

```prisma
model ChatMessage {
  id        String   @id @default(cuid())
  tenantId  String
  room      String?
  userId    String
  userName  String
  role      String
  text      String
  createdAt DateTime @default(now())
  tenant    Tenant
}

model SupportTicket {
  id                    String
  tenantId              String
  userId                String
  assignedToId          String?
  title                 String
  description           String?
  category              String
  priority              String
  status                String
  resolution            String?
  createdAt             DateTime
  updatedAt             DateTime
  resolvedAt            DateTime?
  attachmentIds         String[]
  tags                  String[]
  
  tenant                Tenant
  user                  User
  assignedTo            User?
  comments              SupportTicketComment[]
  statusHistory         SupportTicketStatusHistory[]
}

model SupportTicketComment {
  id                    String
  ticketId              String
  authorId              String
  content               String
  attachmentIds         String[]
  isInternal            Boolean
  createdAt             DateTime
  
  ticket                SupportTicket
  author                User
}
```

**Note**: We'll use existing models, no schema changes needed!

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages` | List all threads (chat + tickets) |
| GET | `/api/messages/[id]` | Get thread details |
| POST | `/api/messages/[id]/messages` | Send message in thread |
| GET | `/api/messages/tickets` | List support tickets |
| POST | `/api/messages/tickets` | Create support ticket |
| GET | `/api/messages/tickets/[id]` | Get ticket details |
| PATCH | `/api/messages/tickets/[id]` | Update ticket |
| POST | `/api/messages/tickets/[id]/comments` | Add comment |
| GET | `/api/messages/stats` | Get messaging statistics |

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
const TicketModal = lazy(() => import('./TicketModal'))
const TicketDetail = lazy(() => import('./TicketDetail'))
```

---

## 🔄 Data Flow

```
User Action
    ↓
UI Component
    ↓
Custom Hook (useMessages, useTickets)
    ↓
API Service
    ↓
API Route Handler
    ↓
Messages/Tickets Service
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
- ✅ Unified message threads
- ✅ Chat messages
- ✅ Support tickets
- ✅ Real-time updates (polling)
- ✅ File attachments
- ✅ Search and filters
- ✅ Status tracking
- ✅ Priority management

### Advanced Features
- ✅ Thread grouping
- ✅ Unread indicators
- ✅ Rich text support
- ✅ Analytics dashboard
- ✅ Ticket assignment
- ✅ Status history
- ✅ Auto-refresh

---

## 🚀 Performance Optimizations

### Code Splitting
```typescript
const TicketDetail = lazy(() => import('./TicketDetail'))
```

### Data Caching
```typescript
const { data, mutate } = useSWR('/api/messages', fetcher, {
  refreshInterval: 10000, // Auto-refresh every 10s
})
```

### Pagination
- Load messages in chunks
- Infinite scroll support
- Efficient queries

---

## 🔒 Security

### Authentication
- All endpoints require authentication
- JWT token validation

### Authorization
- Tenant isolation
- User can only see own messages
- Permission checks for tickets

### Audit
- All messages logged
- Ticket history tracked
- Immutable records

---

## 📱 Responsive Design

### Mobile
- Chat-style layout
- Touch-friendly
- Bottom input

### Tablet
- Split view
- Sidebar threads

### Desktop
- Three-column layout
- Full features
- Rich interactions

---

*Architecture designed for production readiness and scalability.*
