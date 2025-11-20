# Task API Documentation

## Overview

The Task API provides endpoints for managing tasks with support for:
- Task creation, reading, updating, and deletion (CRUD)
- Task comments and replies
- Task assignment and workflow
- Admin management and statistics
- Real-time task updates

## Authentication

All endpoints require authentication via JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

Some endpoints require admin privileges (marked with 🔐 ADMIN).

## Base URL

```
/api/tasks      - User task endpoints
/api/admin/tasks - Admin task management endpoints
```

---

## User Task Endpoints

### List Tasks
**GET /api/tasks**

List tasks for the current user with filtering and pagination.

**Query Parameters:**
- `status` - Filter by status: OPEN, IN_PROGRESS, REVIEW, COMPLETED, BLOCKED (can use multiple)
- `priority` - Filter by priority: LOW, MEDIUM, HIGH (can use multiple)
- `assigneeId` - Filter by assigned user ID
- `search` - Search in title and description
- `dueBefore` - Filter tasks due before this date (ISO format)
- `dueAfter` - Filter tasks due after this date (ISO format)
- `limit` - Results per page (default: 20, max: 100)
- `offset` - Pagination offset (default: 0)
- `sortBy` - Sort field: createdAt, dueAt, priority, status (default: createdAt)
- `sortOrder` - asc or desc (default: desc)

**Example Request:**
```bash
curl -X GET "http://api.example.com/api/tasks?status=OPEN&priority=HIGH&limit=10&offset=0" \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "task-1",
      "tenantId": "tenant-1",
      "title": "Fix login bug",
      "description": "Users unable to login with SSO",
      "priority": "HIGH",
      "status": "IN_PROGRESS",
      "assigneeId": "user-2",
      "assignee": {
        "id": "user-2",
        "name": "John Doe",
        "email": "john@example.com",
        "department": "Engineering"
      },
      "dueAt": "2025-02-28T00:00:00Z",
      "complianceRequired": false,
      "createdAt": "2025-02-15T10:00:00Z",
      "updatedAt": "2025-02-20T14:30:00Z"
    }
  ],
  "meta": {
    "total": 15,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

**Notes:**
- Non-admin users only see their own assigned tasks
- Admin users see all tasks in the organization

---

### Create Task
**POST /api/tasks** 🔐 ADMIN

Create a new task (admin only).

**Request Body:**
```json
{
  "title": "Setup monitoring",
  "description": "Setup error monitoring and alerting",
  "priority": "HIGH",
  "dueAt": "2025-03-01T00:00:00Z",
  "assigneeId": "user-2",
  "complianceRequired": false,
  "complianceDeadline": null
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "task-2",
    "tenantId": "tenant-1",
    "title": "Setup monitoring",
    ...
  }
}
```

**Error Responses:**
- `400` - Invalid task data or validation error
- `403` - Not authorized (non-admin)
- `500` - Server error

---

### Get Task Details
**GET /api/tasks/[id]**

Get detailed information about a specific task including comments.

**Response (200 OK):**
```json
{
  "data": {
    "id": "task-1",
    "title": "Fix login bug",
    "description": "Users unable to login with SSO",
    "priority": "HIGH",
    "status": "IN_PROGRESS",
    "assigneeId": "user-2",
    "assignee": { ... },
    "dueAt": "2025-02-28T00:00:00Z",
    "comments": [
      {
        "id": "comment-1",
        "taskId": "task-1",
        "authorId": "user-2",
        "content": "Started investigating the issue",
        "author": {
          "id": "user-2",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "replies": [
          {
            "id": "comment-2",
            "content": "Found the root cause in SSO config",
            "author": { ... }
          }
        ],
        "createdAt": "2025-02-20T10:00:00Z",
        "updatedAt": "2025-02-20T10:00:00Z"
      }
    ],
    "createdAt": "2025-02-15T10:00:00Z",
    "updatedAt": "2025-02-20T14:30:00Z"
  }
}
```

**Error Responses:**
- `404` - Task not found
- `403` - Not authorized to view this task
- `500` - Server error

---

### Update Task
**PUT /api/tasks/[id]**

Update a task (admin or assignee).

**Request Body (all fields optional):**
```json
{
  "title": "Fix login bug - SSO",
  "status": "REVIEW",
  "priority": "MEDIUM",
  "dueAt": "2025-03-01T00:00:00Z"
}
```

**Response (200 OK):**
Same as Get Task Details response.

**Error Responses:**
- `400` - Invalid data
- `403` - Not authorized
- `404` - Task not found
- `500` - Server error

---

### Add Comment
**POST /api/tasks/[id]/comments**

Add a comment or reply to a task.

**Request Body:**
```json
{
  "content": "I've started working on this issue",
  "parentId": null  // Set to comment ID to reply to a comment
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "comment-3",
    "taskId": "task-1",
    "authorId": "user-2",
    "content": "I've started working on this issue",
    "author": { ... },
    "parentId": null,
    "replies": [],
    "createdAt": "2025-02-21T10:00:00Z",
    "updatedAt": "2025-02-21T10:00:00Z"
  }
}
```

**Error Responses:**
- `400` - Invalid comment data
- `403` - Not authorized to comment
- `404` - Task not found
- `500` - Server error

---

### Update Comment
**PUT /api/tasks/[id]/comments/[commentId]**

Update a comment (author or admin only).

**Request Body:**
```json
{
  "content": "Updated comment text"
}
```

**Response (200 OK):**
Comment object with updated content.

---

### Delete Comment
**DELETE /api/tasks/[id]/comments/[commentId]**

Delete a comment (author or admin only).

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

---

### Get Task Comments
**GET /api/tasks/[id]/comments**

Get paginated comments for a task.

**Query Parameters:**
- `limit` - Results per page (default: 50, max: 100)
- `offset` - Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "comment-1",
      "taskId": "task-1",
      "content": "First comment",
      "author": { ... },
      "replies": [ ... ],
      "createdAt": "2025-02-20T10:00:00Z",
      "updatedAt": "2025-02-20T10:00:00Z"
    }
  ],
  "meta": {
    "total": 5,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

---

## Admin Task Management Endpoints

All admin endpoints require authentication and admin privileges.

### List All Tasks
**GET /api/admin/tasks** 🔐 ADMIN

List all tasks in the organization with advanced filtering.

**Query Parameters:**
Same as user endpoint, but admin sees all tasks without restriction.

**Example Request:**
```bash
curl -X GET "http://api.example.com/api/admin/tasks?status=OPEN,IN_PROGRESS&limit=50" \
  -H "Authorization: Bearer <admin-token>"
```

---

### Get Task Details
**GET /api/admin/tasks/[id]** 🔐 ADMIN

Get full task details (admin version).

---

### Update Task
**PUT /api/admin/tasks/[id]** 🔐 ADMIN

Update any task field.

---

### Delete Task
**DELETE /api/admin/tasks/[id]** 🔐 ADMIN

Permanently delete a task and all associated comments.

---

### Assign Task
**POST /api/admin/tasks/[id]/assign** 🔐 ADMIN

Assign a task to a user.

**Request Body:**
```json
{
  "assigneeId": "user-5"
}
```

**Response (200 OK):**
```json
{
  "data": { ... },
  "message": "Task assigned to John Smith"
}
```

**Error Responses:**
- `400` - Invalid assignee or assignee not in organization
- `404` - Task not found
- `500` - Server error

---

### Task Statistics
**GET /api/admin/tasks/stats** 🔐 ADMIN

Get task statistics and metrics for the dashboard.

**Response (200 OK):**
```json
{
  "data": {
    "summary": {
      "total": 42,
      "completed": 18,
      "completionRate": 43,
      "overdue": 3,
      "dueSoon": 7,
      "averageTasksPerAssignee": 5
    },
    "byStatus": {
      "OPEN": 12,
      "IN_PROGRESS": 15,
      "REVIEW": 5,
      "COMPLETED": 18,
      "BLOCKED": 2
    },
    "byPriority": {
      "LOW": 10,
      "MEDIUM": 25,
      "HIGH": 7
    },
    "mostOverdue": {
      "id": "task-1",
      "title": "Fix login bug",
      "dueAt": "2025-02-10T00:00:00Z",
      "assignee": {
        "id": "user-2",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  }
}
```

---

### Bulk Update Tasks
**POST /api/admin/tasks/bulk-update** 🔐 ADMIN

Update multiple tasks at once.

**Request Body:**
```json
{
  "taskIds": ["task-1", "task-2", "task-3"],
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "assigneeId": "user-2"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "updated": 3,
    "total": 3
  },
  "message": "Updated 3 task(s)"
}
```

**Error Responses:**
- `400` - Invalid data or some tasks not found
- `403` - Not authorized
- `500` - Server error

---

## Data Types

### Task Status
- `OPEN` - New task, not yet started
- `IN_PROGRESS` - Currently being worked on
- `REVIEW` - Waiting for review/approval
- `COMPLETED` - Task finished
- `BLOCKED` - Blocked by another task or issue

### Task Priority
- `LOW` - Low priority, can be done anytime
- `MEDIUM` - Normal priority
- `HIGH` - Urgent, should be done soon

---

## Error Responses

All error responses follow this format:

**400 Bad Request:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid task data",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      }
    ]
  }
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this resource"
  }
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Task not found"
  }
}
```

**500 Server Error:**
```json
{
  "success": false,
  "error": {
    "code": "SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

## Rate Limiting

Task API endpoints are subject to the following rate limits:
- **List endpoints**: 100 requests per minute
- **Create/Update**: 50 requests per minute
- **Delete**: 20 requests per minute
- **Admin endpoints**: 200 requests per minute (with admin token)

---

## Best Practices

1. **Pagination**: Always use limit/offset for list endpoints to improve performance
2. **Filtering**: Use specific filters to reduce response size
3. **Sorting**: Use sortBy parameter to get desired order
4. **Search**: Use search parameter for text searches, avoid fetching all tasks
5. **Error Handling**: Always check status codes and error responses
6. **Caching**: Cache stable data like task lists client-side when appropriate
7. **Real-time Updates**: Consider using WebSocket for real-time task updates

---

## Examples

### Complete Task
```bash
curl -X PUT "http://api.example.com/api/tasks/task-1" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED"
  }'
```

### Get High Priority Overdue Tasks
```bash
curl -X GET "http://api.example.com/api/tasks?priority=HIGH&dueBefore=2025-02-21&status=OPEN,IN_PROGRESS" \
  -H "Authorization: Bearer <token>"
```

### Bulk Reassign Tasks
```bash
curl -X POST "http://api.example.com/api/admin/tasks/bulk-update" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "taskIds": ["task-1", "task-2", "task-3"],
    "assigneeId": "user-5"
  }'
```

---

## Webhook Events (Planned)

Future versions will support webhooks for:
- `task.created` - New task created
- `task.updated` - Task updated
- `task.assigned` - Task assigned to user
- `task.completed` - Task marked as completed
- `comment.added` - Comment added to task

---

## Changelog

### Version 1.0.0 (2025-02-21)
- Initial Task API release
- User task endpoints (list, get, update)
- Task comment endpoints
- Admin task management
- Task statistics endpoint
- Bulk update functionality

---

**Last Updated**: February 21, 2025  
**API Version**: 1.0.0  
**Status**: Production Ready
