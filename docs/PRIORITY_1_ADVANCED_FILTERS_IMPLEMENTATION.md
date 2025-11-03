# Priority 1: Advanced Filters UI Implementation Guide

**Status:** 20% Complete (est. 2/10 hours)  
**Last Updated:** January 2025

## 📋 Overview

This guide documents the implementation of a sophisticated filter builder interface for the admin/users section, supporting complex filter combinations with AND/OR logic, saved presets, and improved UX.

## ✅ Completed Tasks

### 1. Database Schema (COMPLETED)
- **File:** `prisma/schema.prisma`
- **What:** Added FilterPreset model (line 1549-1573)
- **Details:**
  - Table: `filter_presets`
  - Fields: id, tenantId, name, description, entityType, filterConfig (JSON), filterLogic (AND/OR), isPublic, isDefault, icon, color, usageCount, lastUsedAt, createdBy, createdAt, updatedAt
  - Relations: User (creator), Tenant
  - Indexes: tenantId+entityType, tenantId+isPublic, createdBy+createdAt, isDefault
- **Relations Updated:**
  - User model (line 1457): Added `filter_presets` relation
  - Tenant model (line 343): Added `filter_presets` relation

### 2. Filter Types (COMPLETED)
- **File:** `src/app/admin/users/types/filters.ts` (184 lines)
- **Exports:**
  - `FilterCondition` interface: {id, field, operator, value, valueType, label}
  - `FilterGroup` interface: {id, logic (AND/OR), conditions, nestedGroups}
  - `AdvancedFilterConfig` interface: {logic, groups, metadata}
  - `FilterPresetDTO` interface: Complete preset data transfer object
  - `FilterField` interface: Field definition with operators and options
  - `FilterOperator` type: 15 operators (eq, neq, contains, in, gt, lt, between, etc.)
  - `LogicOperator` type: AND | OR
  - Helper functions: createEmptyFilterCondition(), createEmptyFilterGroup(), createEmptyFilterConfig()
  - Constants: FILTER_OPERATORS, USER_FILTER_FIELDS (8 supported fields)
- **Supported Fields:**
  - name, email, role, status, department, tier, createdAt, experienceYears, hourlyRate
- **Supported Operators:**
  - Text: contains, startsWith, endsWith, eq, neq
  - Comparison: gt, lt, gte, lte, between
  - List: in, notIn
  - Existence: isEmpty, isNotEmpty, isNull, isNotNull

## 🚧 In Progress

### 1. FilterBuilder Component
- **Location:** `src/app/admin/users/components/FilterBuilder.tsx`
- **Status:** Ready to implement
- **Purpose:** Main UI component orchestrating the entire filter building experience
- **Features:**
  - Visual filter builder with drag-and-drop support
  - AND/OR logic toggle for each group
  - Add/remove conditions and groups
  - Support for nested groups
  - Real-time preview of filter effects
  - Export/import filter configurations
  - Visual feedback for complex conditions

## 📝 Pending Tasks

### Phase 1: Components (est. 3-4 hours)

#### 1. FilterGroup Component
- **Location:** `src/app/admin/users/components/FilterGroup.tsx`
- **Purpose:** Render a group of filter conditions
- **Features:**
  - Display list of conditions with AND/OR toggle
  - Add condition button
  - Remove group button
  - Nested groups support
- **Props:**
  ```typescript
  interface FilterGroupProps {
    group: FilterGroup
    onGroupChange: (group: FilterGroup) => void
    onRemove: () => void
    isNested?: boolean
    availableFields: FilterField[]
  }
  ```

#### 2. FilterCondition Component
- **Location:** `src/app/admin/users/components/FilterCondition.tsx`
- **Purpose:** Single condition editor
- **Features:**
  - Field selector dropdown
  - Operator selector (dynamic based on field type)
  - Value input (type-specific)
  - Remove button
- **Props:**
  ```typescript
  interface FilterConditionProps {
    condition: FilterCondition
    onConditionChange: (condition: FilterCondition) => void
    onRemove: () => void
    availableFields: FilterField[]
  }
  ```

#### 3. SavedFilters Component
- **Location:** `src/app/admin/users/components/SavedFilters.tsx`
- **Purpose:** Manage saved filter presets
- **Features:**
  - List all saved presets
  - Load preset (apply to current filter)
  - Edit preset (rename, description, visibility)
  - Delete preset
  - Mark as default
  - Search/filter presets by name
  - Show usage statistics
- **UI:** Card-based or table layout with action buttons

#### 4. FilterPreview Component
- **Location:** `src/app/admin/users/components/FilterPreview.tsx`
- **Purpose:** Show filter effects in real-time
- **Features:**
  - Display estimated result count
  - Preview of matching users (first 5-10)
  - Visual preview of filter structure
  - Applied filters badge
- **Integration:** Call preview API endpoint

### Phase 2: API Endpoints (est. 2-2.5 hours)

#### 1. Filter Presets CRUD
- **Location:** `src/app/api/admin/filter-presets/`
- **Endpoints:**
  - `POST /api/admin/filter-presets` - Create new preset
  - `GET /api/admin/filter-presets` - List presets (paginated, filtered)
  - `GET /api/admin/filter-presets/[id]` - Get single preset
  - `PATCH /api/admin/filter-presets/[id]` - Update preset
  - `DELETE /api/admin/filter-presets/[id]` - Delete preset
- **Auth:** USERS_MANAGE permission required
- **Response:** FilterPresetDTO

#### 2. Filter Preview API
- **Location:** `src/app/api/admin/filters/preview`
- **Method:** POST
- **Purpose:** Get preview of filter results
- **Request:**
  ```typescript
  {
    filterConfig: AdvancedFilterConfig,
    limit?: number, // default 10
    offset?: number // default 0
  }
  ```
- **Response:**
  ```typescript
  {
    totalCount: number,
    preview: UserItem[],
    query: string // for debugging
  }
  ```

#### 3. Enhanced User List API
- **Location:** `src/app/api/admin/users/`
- **Enhancement:** Support filterConfig query parameter
- **Query Params:**
  - `filterConfig`: JSON stringified AdvancedFilterConfig
  - `search`: Legacy support
  - `role`, `status`, `tier`, `department`: Legacy support
  - `page`, `limit`, `sortBy`, `sortOrder`
- **Implementation:** Parse filterConfig, convert to Prisma where clause, execute query

### Phase 3: Utilities (est. 1.5 hours)

#### 1. Filter Config Converter
- **Location:** `src/app/admin/users/utils/filterConfigToPrisma.ts`
- **Purpose:** Convert AdvancedFilterConfig to Prisma where clause
- **Function:**
  ```typescript
  export function filterConfigToPrisma(config: AdvancedFilterConfig): Prisma.usersWhereInput
  ```
- **Logic:**
  - Recursively process groups
  - Apply AND/OR logic
  - Map operators to Prisma operators
  - Handle nested groups

#### 2. Filter Config Validator
- **Location:** `src/app/admin/users/utils/filterValidator.ts`
- **Purpose:** Validate filter configuration
- **Function:**
  ```typescript
  export function validateFilterConfig(config: AdvancedFilterConfig): ValidationResult
  ```

#### 3. Filter Config Serializer
- **Location:** `src/app/admin/users/utils/filterSerializer.ts`
- **Purpose:** Convert filter config to readable format
- **Function:**
  ```typescript
  export function filterConfigToHumanReadable(config: AdvancedFilterConfig): string
  ```

### Phase 4: Integration (est. 1.5 hours)

#### 1. Hook: useFilterBuilder
- **Location:** `src/app/admin/users/hooks/useFilterBuilder.ts`
- **Purpose:** Manage filter builder state and operations
- **Exports:**
  ```typescript
  export function useFilterBuilder(initialConfig?: AdvancedFilterConfig)
  ```
- **Features:**
  - State management for current filter
  - Add/remove/update conditions and groups
  - Save/load presets
  - Validation
  - History (undo/redo)

#### 2. Hook: useFilterPresets
- **Location:** `src/app/admin/users/hooks/useFilterPresets.ts`
- **Purpose:** Fetch and manage saved presets
- **Features:**
  - Load all presets
  - Create/update/delete preset
  - Mark as default
  - Search presets

#### 3. Integration with AdvancedUserFilters
- **File:** `src/app/admin/users/components/AdvancedUserFilters.tsx`
- **Changes:**
  - Add "Advanced Filter" button/tab
  - Show saved presets list
  - Toggle between simple and advanced mode
  - Apply selected filter

### Phase 5: Testing (est. 2 hours)

#### 1. Unit Tests
- Filter condition logic
- Filter group logic
- Filter config conversion to Prisma
- Validation rules

#### 2. Integration Tests
- API endpoints (CRUD operations)
- Filter application (filtering users)
- Save/load presets

#### 3. E2E Tests
- Complete workflow: build filter → save → apply → load
- Complex scenarios (nested groups, multiple conditions)
- Performance (filters with 100+ conditions)

### Phase 6: Documentation (est. 0.5 hours)
- Update this guide with implementation details
- Add code examples
- Document API responses
- Create user guide for advanced filters
- Add troubleshooting section

## 📊 Implementation Progress

| Phase | Task | Status | Time |
|-------|------|--------|------|
| Preparation | Database Schema | ✅ | 0.5h |
| Preparation | Filter Types | ✅ | 1.5h |
| Components | FilterBuilder | ⏳ | 1.5h |
| Components | FilterGroup | ⏳ | 0.5h |
| Components | FilterCondition | ⏳ | 0.5h |
| Components | SavedFilters | ⏳ | 1h |
| Components | FilterPreview | ⏳ | 0.5h |
| API | Filter Presets CRUD | ⏳ | 1.5h |
| API | Preview Endpoint | ⏳ | 0.5h |
| API | Enhanced User List | ⏳ | 0.5h |
| Utilities | Prisma Converter | ⏳ | 0.5h |
| Utilities | Validator | ⏳ | 0.5h |
| Utilities | Serializer | ⏳ | 0.5h |
| Integration | useFilterBuilder Hook | ⏳ | 1h |
| Integration | useFilterPresets Hook | ⏳ | 0.5h |
| Integration | UI Integration | ⏳ | 0.5h |
| Testing | Unit Tests | ⏳ | 1h |
| Testing | Integration Tests | ⏳ | 0.5h |
| Testing | E2E Tests | ⏳ | 0.5h |
| Documentation | Guide & Examples | ⏳ | 0.5h |
| **Total** | | **20% Complete** | **~10h** |

## 🎯 Next Immediate Steps

1. **Create FilterBuilder.tsx** - Core component
2. **Create FilterGroup.tsx** - Sub-component for groups
3. **Create FilterCondition.tsx** - Sub-component for conditions  
4. **Create SavedFilters.tsx** - Preset management
5. **Create API endpoints** - /api/admin/filter-presets/*
6. **Create utility functions** - Filter conversion and validation
7. **Create hooks** - useFilterBuilder, useFilterPresets
8. **Integrate into UI** - Add to AdvancedUserFilters
9. **Write tests** - Unit, integration, E2E
10. **Update documentation** - Final guide

## 💾 File Structure

```
src/app/admin/users/
├── components/
│   ├── FilterBuilder.tsx         (NEW)
│   ├── FilterGroup.tsx            (NEW)
│   ├── FilterCondition.tsx         (NEW)
│   ├── SavedFilters.tsx            (NEW)
│   ├── FilterPreview.tsx           (NEW)
│   └── AdvancedUserFilters.tsx     (MODIFY)
├── hooks/
│   ├── useFilterBuilder.ts         (NEW)
│   ├── useFilterPresets.ts         (NEW)
│   └── index.ts                    (UPDATE)
├── types/
│   └── filters.ts                  (NEW - COMPLETED)
└── utils/
    ├── filterConfigToPrisma.ts     (NEW)
    ├── filterValidator.ts          (NEW)
    └── filterSerializer.ts         (NEW)

src/app/api/admin/
├── filter-presets/
│   ├── route.ts                    (NEW - CRUD)
│   └── [id]/
│       └── route.ts                (NEW - GET/PATCH/DELETE)
└── filters/
    └── preview/
        └── route.ts                (NEW - POST preview)
```

## 🔧 Implementation Notes

### Code Patterns to Follow
- Use shadcn/ui components (Button, Card, Select, Input, Dialog, Tabs, Badge)
- Follow existing hook patterns from useFilterUsers.ts
- Use useCallback for event handlers
- Component naming: PascalCase with descriptive suffixes
- Always export from hooks/index.ts and components/index.ts
- API routes: Use withTenantContext, requireTenantContext, hasPermission
- Validation: Use Zod schemas for API inputs
- Error handling: Use respond.badRequest(), respond.forbidden(), etc.

### Styling
- Use Tailwind CSS with existing design system
- Follow color scheme from AdvancedUserFilters component
- Support dark mode with existing dark-mode.css
- Responsive design: mobile-first approach

### Performance Considerations
- Memoize filter groups with React.memo
- Use useCallback for handlers
- Debounce preview API calls
- Lazy load SavedFilters component
- Paginate preset list if >100 presets

## 🧪 Testing Checklist

- [ ] Filter condition creation/deletion
- [ ] Filter group AND/OR logic
- [ ] Nested groups support
- [ ] Filter config conversion to Prisma
- [ ] API CRUD operations
- [ ] Save/load presets
- [ ] Apply filter to user list
- [ ] Filter preview accuracy
- [ ] Multiple filter combinations
- [ ] Edge cases (empty conditions, very large filters)
- [ ] Permission checks
- [ ] Tenant isolation

## 📚 References

- Existing filtering: `src/app/admin/users/hooks/useFilterUsers.ts`
- Current filter UI: `src/app/admin/users/components/AdvancedUserFilters.tsx`
- API pattern: `src/app/api/admin/users/route.ts`
- Type system: `src/app/admin/users/types/entities.ts`
- UI components: `src/components/ui/`

## 🚀 Deployment Notes

- Database migration: FilterPreset model will be applied via migration
- No breaking changes to existing APIs
- Backward compatible with legacy query parameters
- Gradual rollout: Start with FilterBuilder in advanced tab
- Monitor performance: Filter preview API may need indexing
- Suggest default filters for new tenants

---

**Last Updated:** January 2025  
**Status:** In Progress (Phase 1: 50% of components done)  
**Estimated Completion:** ~8 hours remaining
