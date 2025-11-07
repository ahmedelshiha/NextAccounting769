# Phase 4.3: Server-Side User Filtering API Guide

## Overview

The `/api/admin/users/search` endpoint provides comprehensive server-side filtering capabilities for user searches. This guide documents all available filter parameters, usage patterns, and optimization strategies.

**Status:** ✅ Production Ready (Phase 4.3 Complete)

**Key Features:**
- ✅ Full-text search across multiple fields (name, email, position, department)
- ✅ Advanced filtering (role, status, department, tier, experience range, date range)
- ✅ Efficient pagination with limit validation
- ✅ Flexible sorting options
- ✅ ETag-based caching for bandwidth reduction
- ✅ Comprehensive error handling and validation
- ✅ Rate limiting protection

---

## Base Endpoint

```
GET /api/admin/users/search
```

**Authentication:** Required (USERS_MANAGE permission)
**Rate Limit:** 100 requests per minute per IP
**Response Cache:** 30 seconds (with stale-while-revalidate: 60 seconds)

---

## Query Parameters

### Search Parameters

#### `search` (string)
Performs full-text search across multiple user fields.

**Minimum Length:** 2 characters
**Search Fields:** 
- `name` - User's full name
- `email` - User's email address  
- `position` - Job position/title
- `department` - Department name

**Matching:**
- Case-insensitive
- Partial matching supported
- Matches across all four fields

**Examples:**
```bash
# Search by name
GET /api/admin/users/search?search=john

# Search by email
GET /api/admin/users/search?search=john@company.com

# Search by position
GET /api/admin/users/search?search=manager

# Search by department
GET /api/admin/users/search?search=sales
```

**Response Format:**
```json
{
  "success": true,
  "data": [/* matching users */],
  "query": {
    "searchFieldsUsed": ["name", "email", "position", "department"],
    "totalFieldsSearched": 4
  }
}
```

---

### Filter Parameters

#### `role` (string)
Filter users by their role.

**Valid Values:**
- `ADMIN` - Administrator with full permissions
- `TEAM_MEMBER` - Team member with limited permissions
- `TEAM_LEAD` - Team lead with team management permissions
- `STAFF` - Staff with basic access
- `CLIENT` - Client with self-service access
- `SUPER_ADMIN` - Super administrator

**Example:**
```bash
GET /api/admin/users/search?role=ADMIN
GET /api/admin/users/search?role=TEAM_MEMBER&status=ACTIVE
```

**Note:** API supports filtering by single role. For multiple roles, make separate requests.

---

#### `status` (string)
Filter users by their account status.

**Valid Values:**
- `ACTIVE` - Active account
- `INACTIVE` - Inactive account
- `SUSPENDED` - Suspended account
- `PENDING` - Pending activation

**Example:**
```bash
GET /api/admin/users/search?status=ACTIVE
GET /api/admin/users/search?role=ADMIN&status=ACTIVE
```

---

#### `department` (string)
Filter users by their department.

**Notes:**
- Case-sensitive (exact match)
- Common departments: Sales, Engineering, HR, IT, Finance, Marketing
- Custom departments supported

**Example:**
```bash
GET /api/admin/users/search?department=Engineering
GET /api/admin/users/search?department=Sales&status=ACTIVE
```

---

#### `tier` (string)
Filter users by their client tier (for CLIENT role users).

**Valid Values:**
- `INDIVIDUAL` - Individual client
- `SMB` - Small/Medium Business
- `ENTERPRISE` - Enterprise client

**Example:**
```bash
GET /api/admin/users/search?tier=ENTERPRISE
GET /api/admin/users/search?role=CLIENT&tier=ENTERPRISE
```

---

#### `minExperience` (integer)
Filter users with minimum years of experience.

**Type:** Non-negative integer
**Default:** No minimum
**Range:** 0-50+ years

**Example:**
```bash
GET /api/admin/users/search?minExperience=5
GET /api/admin/users/search?minExperience=3&maxExperience=10
```

---

#### `maxExperience` (integer)
Filter users with maximum years of experience.

**Type:** Non-negative integer
**Default:** No maximum
**Range:** 0-50+ years

**Example:**
```bash
GET /api/admin/users/search?maxExperience=5
GET /api/admin/users/search?minExperience=1&maxExperience=3
```

**Note:** Both `minExperience` and `maxExperience` can be used together for range filtering.

---

### Date Range Parameters

#### `createdAfter` (ISO 8601 date string)
Filter users created on or after this date.

**Format:** `YYYY-MM-DDTHH:mm:ssZ` or `YYYY-MM-DD`
**Default:** No limit

**Example:**
```bash
GET /api/admin/users/search?createdAfter=2024-01-01
GET /api/admin/users/search?createdAfter=2024-01-15T10:30:00Z
```

---

#### `createdBefore` (ISO 8601 date string)
Filter users created on or before this date.

**Format:** `YYYY-MM-DDTHH:mm:ssZ` or `YYYY-MM-DD`
**Default:** No limit

**Example:**
```bash
GET /api/admin/users/search?createdBefore=2024-12-31
GET /api/admin/users/search?createdAfter=2024-01-01&createdBefore=2024-12-31
```

---

### Sorting Parameters

#### `sortBy` (string)
Sort results by specified field.

**Valid Values:**
- `name` - Sort by user name (alphabetical)
- `email` - Sort by email address (alphabetical)
- `createdAt` - Sort by creation date (**Default**)
- `role` - Sort by user role
- `department` - Sort by department
- `tier` - Sort by client tier

**Example:**
```bash
GET /api/admin/users/search?sortBy=name&sortOrder=asc
GET /api/admin/users/search?sortBy=createdAt&sortOrder=desc
```

---

#### `sortOrder` (string)
Sort direction for the specified field.

**Valid Values:**
- `asc` - Ascending order (A-Z, 0-9, oldest first)
- `desc` - Descending order (Z-A, 9-0, newest first) (**Default**)

**Example:**
```bash
GET /api/admin/users/search?sortOrder=asc
GET /api/admin/users/search?sortBy=name&sortOrder=asc
```

---

### Pagination Parameters

#### `page` (integer)
Which page of results to return (1-indexed).

**Type:** Positive integer
**Minimum:** 1
**Default:** 1
**Valid Range:** 1 to `totalPages`

**Example:**
```bash
GET /api/admin/users/search?page=1&limit=50
GET /api/admin/users/search?page=2&limit=50
```

**Error Handling:** Invalid page numbers are silently corrected to valid range.

---

#### `limit` (integer)
Maximum number of results per page.

**Type:** Positive integer
**Minimum:** 1
**Maximum:** 250
**Default:** 50
**Recommended:** 50

**Example:**
```bash
GET /api/admin/users/search?limit=50
GET /api/admin/users/search?limit=100&page=1
```

**Note:** Requested limits greater than 250 are capped at 250 for performance.

---

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "user-123",
      "name": "John Doe",
      "email": "john@company.com",
      "role": "ADMIN",
      "status": "ACTIVE",
      "department": "Engineering",
      "position": "Senior Engineer",
      "tier": null,
      "experienceYears": 8,
      "hourlyRate": "150.00",
      "skills": ["JavaScript", "React", "Node.js"],
      "certifications": ["AWS", "Kubernetes"],
      "image": "https://example.com/avatar.jpg",
      "hireDate": "2020-01-15",
      "createdAt": "2020-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T15:30:00Z"
    },
    // ... more users
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "appliedFilters": {
    "search": "john",
    "role": "ADMIN",
    "status": "ACTIVE",
    "department": null,
    "tier": null,
    "minExperience": null,
    "maxExperience": null,
    "createdAfter": null,
    "createdBefore": null,
    "sortBy": "createdAt",
    "sortOrder": "desc"
  },
  "query": {
    "searchFieldsUsed": ["name", "email", "position", "department"],
    "totalFieldsSearched": 4
  }
}
```

### Response Fields

**Root Level:**
- `success` (boolean) - Whether the request was successful
- `data` (array) - Array of user objects matching the filters
- `pagination` (object) - Pagination metadata
- `appliedFilters` (object) - Filters that were actually applied
- `query` (object) - Query execution metadata

**User Object Fields:**
- `id` - Unique user identifier
- `name` - User's full name
- `email` - User's email address
- `role` - User's role (ADMIN, TEAM_MEMBER, etc.)
- `status` - Account status (ACTIVE, INACTIVE, SUSPENDED)
- `department` - User's department
- `position` - User's job position/title
- `tier` - Client tier (for CLIENT role users)
- `experienceYears` - Years of professional experience
- `hourlyRate` - Hourly rate (for contractors/team members)
- `skills` - Array of skill tags
- `certifications` - Array of certifications
- `image` - Avatar/profile image URL
- `hireDate` - Employee hire date
- `createdAt` - Account creation date
- `updatedAt` - Last update date

**Pagination Fields:**
- `total` - Total number of results (all pages)
- `page` - Current page number
- `limit` - Results per page
- `totalPages` - Total number of pages
- `hasNextPage` - Whether there's a next page
- `hasPreviousPage` - Whether there's a previous page

---

### Error Response (400, 429, 500)

**400 Bad Request:**
```json
{
  "error": "Invalid date format",
  "success": false,
  "code": "VALIDATION_ERROR"
}
```

**429 Rate Limit Exceeded:**
```json
{
  "error": "Rate limit exceeded",
  "success": false,
  "code": "RATE_LIMIT_ERROR"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to search users",
  "success": false,
  "code": "SEARCH_ERROR"
}
```

---

## Response Headers

### Cache Control
```
Cache-Control: private, max-age=30, stale-while-revalidate=60
```
- Results cached for 30 seconds
- Stale results served while revalidating for up to 60 seconds

### Entity Tag (ETag)
```
ETag: "3e3073de27b1dd0bfa4f2f0f0a3e4c5d"
```
- Used for conditional requests (If-None-Match)
- Prevents unnecessary data transfer

### Pagination Headers
```
X-Total-Count: 150
X-Total-Pages: 3
X-Current-Page: 1
X-Page-Size: 50
X-Has-Next: true
X-Has-Previous: false
```
- Additional metadata available via headers
- Useful for pagination UI implementation

### Applied Filters
```
X-Filters-Applied: search,role,status,sortBy,sortOrder
```
- Comma-separated list of filters that were applied
- Helps client understand which filters took effect

---

## Query Examples

### Example 1: Basic Search
```bash
GET /api/admin/users/search?search=john&page=1&limit=50
```

### Example 2: Role and Status Filter
```bash
GET /api/admin/users/search?role=ADMIN&status=ACTIVE&page=1&limit=50
```

### Example 3: Department and Experience Range
```bash
GET /api/admin/users/search?department=Engineering&minExperience=3&maxExperience=10&page=1&limit=50
```

### Example 4: Date Range Filter
```bash
GET /api/admin/users/search?createdAfter=2024-01-01&createdBefore=2024-12-31&page=1&limit=50
```

### Example 5: Complex Filter Combination
```bash
GET /api/admin/users/search?search=manager&role=TEAM_LEAD&status=ACTIVE&department=Sales&sortBy=createdAt&sortOrder=desc&page=1&limit=50
```

### Example 6: Client Tier Filtering
```bash
GET /api/admin/users/search?role=CLIENT&tier=ENTERPRISE&page=1&limit=100
```

### Example 7: Custom Sort
```bash
GET /api/admin/users/search?sortBy=name&sortOrder=asc&page=1&limit=50
```

---

## Performance Optimization

### Database Indexes

The following database indexes optimize common filter queries:

```sql
-- Single column indexes
CREATE INDEX users_tenantId_status_idx ON users(tenantId, status);
CREATE INDEX users_tenantId_department_idx ON users(tenantId, department);
CREATE INDEX users_tenantId_tier_idx ON users(tenantId, tier);
CREATE INDEX users_tenantId_experienceYears_idx ON users(tenantId, experienceYears);

-- Composite indexes for common combinations
CREATE INDEX users_tenantId_status_createdAt_idx 
  ON users(tenantId, status, createdAt DESC);
  
CREATE INDEX users_tenantId_role_createdAt_idx 
  ON users(tenantId, role, createdAt DESC);
```

### Query Performance Metrics

**Typical Query Performance:**
- Simple search (name/email): ~50-100ms
- Single filter (role/status): ~30-50ms
- Multiple filters: ~100-200ms
- Large result set (1000+): ~200-500ms

**Optimization Tips:**
1. Use specific filters rather than broad searches
2. Paginate results (don't request all 1000+ users at once)
3. Use sortBy to avoid client-side sorting
4. Leverage browser caching (ETag support)
5. Consider search term length (longer = faster with indexes)

### Caching Strategy

**Client-side caching:**
```javascript
// Automatic via browser HTTP caching
// ETag headers prevent unnecessary data transfer

// Manual cache invalidation:
useUnifiedUserService().invalidateCache()
```

**API response cache:**
- 30-second TTL (time-to-live)
- Stale-while-revalidate for 60 seconds
- 304 Not Modified for conditional requests

---

## Error Handling

### Validation Errors

**Invalid page number:**
```
Silently corrected to 1 (minimum valid page)
```

**Invalid limit:**
```
Capped at 250 (maximum allowed limit)
```

**Invalid sort field:**
```
Falls back to 'createdAt' (default)
```

**Invalid sort order:**
```
Falls back to 'desc' (default)
```

**Invalid date format:**
```json
{
  "error": "Invalid date format",
  "success": false,
  "code": "VALIDATION_ERROR"
}
```

### Rate Limiting

**Rate limit:** 100 requests per minute per IP address

**Response when limit exceeded:**
```json
{
  "error": "Rate limit exceeded",
  "success": false,
  "code": "RATE_LIMIT_ERROR"
}
```

**HTTP Status:** 429 (Too Many Requests)

**Client handling:**
```javascript
// Implement exponential backoff retry logic
// Wait and retry after rate limit resets
```

---

## Migration Guide

### From Basic Endpoint (/api/admin/users)

**Before (Basic endpoint):**
```javascript
const response = await fetch('/api/admin/users?page=1&limit=50')
const { users } = await response.json()
```

**After (Search endpoint):**
```javascript
const response = await fetch('/api/admin/users/search?page=1&limit=50')
const { data: users } = await response.json()
```

### Key Differences

| Aspect | Basic Endpoint | Search Endpoint |
|--------|---|---|
| URL | `/api/admin/users` | `/api/admin/users/search` |
| Response Format | `{ users: [], pagination: {...} }` | `{ data: [], pagination: {...}, appliedFilters: {...} }` |
| Filters Supported | None | All (search, role, status, etc.) |
| Performance | Basic pagination only | Optimized with indexes |
| Caching | Simple | ETag-based |
| Sort Options | None | Multiple fields |

---

## Best Practices

### 1. Use Appropriate Limits
```bash
# Good - reasonable page size
GET /api/admin/users/search?page=1&limit=50

# Avoid - excessive data transfer
GET /api/admin/users/search?page=1&limit=500
```

### 2. Combine Filters Effectively
```bash
# Good - specific filters
GET /api/admin/users/search?role=ADMIN&status=ACTIVE&department=Engineering

# Less efficient - broad search
GET /api/admin/users/search?search=a
```

### 3. Implement Search Debouncing
```javascript
// Debounce search input to prevent API overload
const debouncedSearch = debounce((term) => {
  fetch(`/api/admin/users/search?search=${term}`)
}, 300)
```

### 4. Handle Pagination Properly
```javascript
// Show current page info
// Enable/disable next/previous buttons based on hasNextPage/hasPreviousPage
// Maintain filter state across page changes
```

### 5. Leverage ETag Caching
```javascript
// Browser automatically caches responses with ETag
// Send If-None-Match header on subsequent requests
// Server responds with 304 if unchanged
```

---

## Troubleshooting

### No Results Returned

**Possible Causes:**
1. Search term too short (< 2 characters)
2. Filters too restrictive
3. No users match the criteria

**Solution:**
- Verify search term length
- Reduce filter specificity
- Check applied filters in response

### Slow Query Performance

**Possible Causes:**
1. Requesting too large limit (> 100)
2. Complex filter combination
3. Database under load

**Solution:**
- Use smaller page sizes (50-100)
- Simplify filters
- Implement client-side debouncing
- Monitor database performance

### Rate Limit Exceeded

**Possible Causes:**
1. Too many rapid requests
2. Missing debouncing on client

**Solution:**
- Implement exponential backoff retry
- Add debouncing to search input
- Batch requests where possible

---

## Appendix: Filter Value Reference

### Valid Role Values
- `ADMIN` - Full system access
- `TEAM_MEMBER` - Team member access
- `TEAM_LEAD` - Team management access
- `STAFF` - Limited staff access
- `CLIENT` - Client access
- `SUPER_ADMIN` - Super administrator

### Valid Status Values
- `ACTIVE` - Active account
- `INACTIVE` - Inactive account
- `SUSPENDED` - Account suspended
- `PENDING` - Pending verification

### Valid Tier Values
- `INDIVIDUAL` - Individual client
- `SMB` - Small/Medium Business
- `ENTERPRISE` - Enterprise

### Common Department Values
- Sales
- Engineering
- HR
- IT
- Finance
- Marketing
- Operations
- (Custom departments supported)

---

## Version History

**v1.0** (Phase 4.3 - Current)
- ✅ Full-text search across 4 fields
- ✅ 6+ filter types
- ✅ Advanced pagination and sorting
- ✅ ETag-based caching
- ✅ Rate limiting
- ✅ Comprehensive error handling
- ✅ Production-ready performance

---

## Related Documentation

- [useUnifiedUserService Hook Guide](./HOOKS_GUIDE.md)
- [useServerSideFiltering Hook Guide](./HOOKS_GUIDE.md)
- [Phase 4.3 Implementation Summary](./PHASE_4_3_SUMMARY.md)
- [Database Indexing Strategy](./DATABASE_OPTIMIZATION.md)
