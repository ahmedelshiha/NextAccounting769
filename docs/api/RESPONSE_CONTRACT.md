# API Response Contract

**Version**: 1.0  
**Created**: November 2024  
**Status**: Active  

---

## Overview

This document defines the standard response format for all APIs used across the Portal and Admin applications. All API endpoints should follow this contract for consistency and predictability.

---

## Success Response Format

### Standard Success Response (200, 201)

All successful API responses follow this format:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 50,
    "hasMore": true,
    "timestamp": "2024-11-18T14:32:07.796Z"
  }
}
```

### Response Structure

- **success** (boolean): Always `true` for successful responses
- **data** (any): The actual response data (single object, array, or null)
- **meta** (object): Optional metadata about the response
  - **total** (number): Total count of items (for list endpoints)
  - **page** (number): Current page number (1-indexed, for list endpoints)
  - **limit** (number): Items per page (for list endpoints)
  - **hasMore** (boolean): Whether more pages exist
  - **timestamp** (string): ISO-8601 timestamp of response generation

### Single Resource Response

```typescript
GET /api/services/123

{
  "success": true,
  "data": {
    "id": "clhx1a3d0000008l5g8d0d9p",
    "name": "Consulting Service",
    "slug": "consulting-service",
    "price": 150,
    "status": "ACTIVE",
    "createdAt": "2024-11-18T14:32:07.796Z",
    "updatedAt": "2024-11-18T14:32:07.796Z"
  }
}
```

### Collection Response with Pagination

```typescript
GET /api/services?limit=50&offset=0

{
  "success": true,
  "data": [
    { "id": "1", "name": "Service A", ... },
    { "id": "2", "name": "Service B", ... }
  ],
  "meta": {
    "total": 125,
    "page": 1,
    "limit": 50,
    "hasMore": true,
    "timestamp": "2024-11-18T14:32:07.796Z"
  }
}
```

### Empty Collection Response

```json
{
  "success": true,
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 50,
    "hasMore": false,
    "timestamp": "2024-11-18T14:32:07.796Z"
  }
}
```

### Null Data Response

```json
{
  "success": true,
  "data": null,
  "meta": {
    "timestamp": "2024-11-18T14:32:07.796Z"
  }
}
```

---

## Error Response Format

### Standard Error Response

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": []
  }
}
```

### Error Structure

- **success** (boolean): Always `false` for error responses
- **error** (object):
  - **code** (string): Machine-readable error code (see [Error Codes](#error-codes))
  - **message** (string): Human-readable error message
  - **details** (array): Optional array of field-level errors or additional details

### Validation Error Response (422)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "value": "not-an-email"
      },
      {
        "field": "price",
        "message": "Price must be positive",
        "value": -10
      }
    ]
  }
}
```

### Business Logic Error Response (400)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_OPERATION",
    "message": "Cannot cancel a completed booking",
    "details": [
      {
        "context": "booking_id",
        "value": "clhx1a3d0000008l5g8d0d9p",
        "reason": "Booking status is COMPLETED"
      }
    ]
  }
}
```

### Authentication Error Response (401)

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please log in.",
    "details": [
      {
        "context": "session",
        "reason": "Session expired or not found"
      }
    ]
  }
}
```

### Permission Error Response (403)

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action",
    "details": [
      {
        "context": "resource",
        "required_permission": "service:delete",
        "user_permissions": ["service:read", "service:update"]
      }
    ]
  }
}
```

### Not Found Error Response (404)

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "The requested service was not found",
    "details": [
      {
        "context": "service_id",
        "value": "clhx1a3d0000008l5g8d0d9p"
      }
    ]
  }
}
```

### Resource Conflict Error Response (409)

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_CONFLICT",
    "message": "A service with this slug already exists",
    "details": [
      {
        "field": "slug",
        "value": "consulting-service",
        "context": "Service with this slug already exists"
      }
    ]
  }
}
```

### Server Error Response (500)

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred. Please try again later.",
    "details": [
      {
        "context": "error_id",
        "value": "error-2024-11-18-12345",
        "message": "Report this error if problem persists"
      }
    ]
  }
}
```

---

## HTTP Status Codes

| Code | Usage | Condition |
|------|-------|-----------|
| **200** | OK | Successful GET/PUT/PATCH request |
| **201** | Created | Successful POST request (resource created) |
| **204** | No Content | Successful DELETE request |
| **400** | Bad Request | Invalid input or business logic error |
| **401** | Unauthorized | Authentication required or failed |
| **403** | Forbidden | Authenticated but lacks permission |
| **404** | Not Found | Resource does not exist |
| **409** | Conflict | Resource conflict (e.g., duplicate unique field) |
| **422** | Unprocessable Entity | Validation error in request body |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Server error |
| **503** | Service Unavailable | Server maintenance or overloaded |

---

## Error Codes

### Authentication Errors

- `INVALID_CREDENTIALS` - Login credentials are incorrect
- `UNAUTHORIZED` - User is not authenticated
- `SESSION_EXPIRED` - User session has expired
- `PERMISSION_DENIED` - User lacks required permission

### Validation Errors

- `VALIDATION_ERROR` - Input validation failed
- `INVALID_REQUEST` - Request format is invalid
- `MISSING_REQUIRED_FIELD` - Required field is missing

### Resource Errors

- `NOT_FOUND` - Resource does not exist
- `ALREADY_EXISTS` - Resource already exists
- `RESOURCE_CONFLICT` - Resource conflict (e.g., duplicate)

### Business Logic Errors

- `INVALID_OPERATION` - Operation is not allowed in current state
- `STATE_ERROR` - Resource is in an invalid state for this operation
- `FORBIDDEN` - Operation is not permitted

### External Service Errors

- `EXTERNAL_SERVICE_ERROR` - Error from external service
- `PAYMENT_FAILED` - Payment processing failed
- `EMAIL_SEND_FAILED` - Email sending failed

### System Errors

- `INTERNAL_SERVER_ERROR` - Unexpected server error
- `DATABASE_ERROR` - Database operation failed
- `SERVICE_UNAVAILABLE` - Service is temporarily unavailable

---

## Pagination Guidelines

### Request Parameters

```typescript
GET /api/services?limit=50&offset=0&sortBy=name&sortOrder=asc
```

- **limit** (number): Items per page (1-100, default 50)
- **offset** (number): Number of items to skip (default 0)
- **sortBy** (string): Field to sort by (must be defined for endpoint)
- **sortOrder** (string): 'asc' or 'desc' (default 'asc')

### Response Meta

```json
{
  "meta": {
    "total": 125,
    "page": 1,
    "limit": 50,
    "hasMore": true,
    "totalPages": 3
  }
}
```

- **total**: Total count of all items (across all pages)
- **page**: Current page (calculated from limit and offset)
- **limit**: Items per page
- **hasMore**: Whether more items exist after current page
- **totalPages**: Total number of pages

### Client Usage

```typescript
// Calculate next page
const nextPage = currentPage + 1;
const nextOffset = nextPage * limit;

// Or use hasMore flag
if (response.meta.hasMore) {
  // Fetch next page
  const nextResponse = await fetch(`/api/services?limit=${limit}&offset=${response.meta.total - (response.meta.page * limit) + limit}`);
}
```

---

## Filtering Guidelines

### Filter Query Parameters

```typescript
GET /api/services?category=consulting&status=ACTIVE&minPrice=100&maxPrice=500
```

- Filters are endpoint-specific (see individual endpoint documentation)
- Multiple filters are combined with AND logic
- Arrays use multiple parameters: `?tags=urgent&tags=billing`

### Common Filter Patterns

- **String fields**: Exact match or partial match (substring)
  - `?name=consulting` or `?name=*consulting*`
- **Enum fields**: Exact match or 'all' for unfiltered
  - `?status=ACTIVE` or `?status=all`
- **Date fields**: Range filters
  - `?fromDate=2024-01-01&toDate=2024-12-31`
- **Array fields**: Multiple values
  - `?tags=urgent&tags=billing`
- **Boolean fields**: 'true', 'false', or 'all'
  - `?active=true` or `?active=all`

---

## Response Timestamps

All timestamps are in ISO-8601 format with UTC timezone:

```
2024-11-18T14:32:07.796Z
```

Clients should handle timezone conversion on the client side based on user preferences.

---

## Content Type

All responses use:

```
Content-Type: application/json; charset=utf-8
```

---

## CORS Headers

All API responses include:

```
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

---

## Rate Limiting Headers

Rate limited responses include:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1700314327
```

---

## API Response TypeScript Types

```typescript
// Success response
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
    totalPages?: number;
    timestamp?: string;
  };
}

// Error response
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{
      [key: string]: any;
    }>;
  };
}

// Union type
type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
```

---

## Implementation Notes

### In API Route Handlers

Use the response helper functions:

```typescript
// src/lib/api-response.ts
import { respond } from '@/lib/api-response';

// Success
return respond.ok(data);
return respond.created(data);
return respond.noContent();

// Errors
return respond.badRequest('Invalid input');
return respond.unauthorized('Not authenticated');
return respond.forbidden('No permission');
return respond.notFound('Resource not found');
return respond.conflict('Already exists');
return respond.validationError(errors);
return respond.serverError();
```

### In Client Code

Handle responses consistently:

```typescript
// Using the API response type
const response = await fetch('/api/services');
const result: ApiResponse<Service[]> = await response.json();

if (result.success) {
  // Access data
  console.log(result.data);
  console.log(result.meta?.total);
} else {
  // Handle error
  console.error(result.error.code);
  console.error(result.error.message);
}
```

---

## Versioning

Currently at **API v1**. Future versions will be indicated in URL:
- `/api/v1/services` - Version 1 (current, implicit)
- `/api/v2/services` - Version 2 (future)

Maintain backward compatibility unless major version changes.

---

## Last Updated

November 2024
