/**
 * Advanced Query Builder Types for Phase 7
 * Supports complex filtering with operators, nested conditions, and templates
 */

export type FilterOperator = 'equals' | 'notEquals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'notIn' | 'isEmpty' | 'isNotEmpty'

export type FilterField = 'name' | 'email' | 'phone' | 'company' | 'department' | 'role' | 'status' | 'createdAt' | 'lastLogin'

export type LogicalOperator = 'AND' | 'OR'

export type ValueType = 'string' | 'number' | 'date' | 'boolean' | 'array'

/**
 * Represents a single filter condition
 */
export interface FilterCondition {
  id: string // Unique ID for drag-drop operations
  field: FilterField
  operator: FilterOperator
  value: string | string[] | number | boolean | null
  valueType?: ValueType
}

/**
 * Represents a group of conditions with AND/OR logic
 */
export interface FilterGroup {
  id: string
  conditions: (FilterCondition | FilterGroup)[]
  operator: LogicalOperator // AND or OR for all conditions in this group
  isNested?: boolean
}

/**
 * Represents a saved query template
 */
export interface QueryTemplate {
  id: string
  name: string
  description?: string
  query: FilterGroup | FilterCondition
  category?: string // 'sales', 'hr', 'custom', etc.
  createdAt: Date
  updatedAt: Date
  isBuiltIn?: boolean // True for predefined templates
  previewCount?: number // Number of results matching this template
}

/**
 * Props for the Advanced Query Builder component
 */
export interface AdvancedQueryBuilderProps {
  query: FilterGroup | FilterCondition
  onQueryChange: (query: FilterGroup | FilterCondition) => void
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  templates?: QueryTemplate[]
  onLoadTemplate?: (template: QueryTemplate) => void
  onSaveAsTemplate?: (name: string, description?: string) => void
}

/**
 * Operator metadata for UI and validation
 */
export const OPERATOR_METADATA: Record<FilterOperator, {
  label: string
  description: string
  valueTypes: ValueType[]
  supportsMultiple?: boolean
  requiresValue?: boolean
}> = {
  equals: {
    label: 'Equals',
    description: 'Exact match',
    valueTypes: ['string', 'number', 'date', 'boolean']
  },
  notEquals: {
    label: 'Not Equals',
    description: 'Does not match',
    valueTypes: ['string', 'number', 'date', 'boolean']
  },
  contains: {
    label: 'Contains',
    description: 'Text contains',
    valueTypes: ['string']
  },
  startsWith: {
    label: 'Starts With',
    description: 'Text starts with',
    valueTypes: ['string']
  },
  endsWith: {
    label: 'Ends With',
    description: 'Text ends with',
    valueTypes: ['string']
  },
  greaterThan: {
    label: 'Greater Than',
    description: 'Value is greater than',
    valueTypes: ['number', 'date']
  },
  lessThan: {
    label: 'Less Than',
    description: 'Value is less than',
    valueTypes: ['number', 'date']
  },
  between: {
    label: 'Between',
    description: 'Value is between two values',
    valueTypes: ['number', 'date'],
    requiresValue: true
  },
  in: {
    label: 'In',
    description: 'Value is in list',
    valueTypes: ['string', 'number'],
    supportsMultiple: true
  },
  notIn: {
    label: 'Not In',
    description: 'Value is not in list',
    valueTypes: ['string', 'number'],
    supportsMultiple: true
  },
  isEmpty: {
    label: 'Is Empty',
    description: 'Field is empty',
    valueTypes: ['string'],
    requiresValue: false
  },
  isNotEmpty: {
    label: 'Is Not Empty',
    description: 'Field is not empty',
    valueTypes: ['string'],
    requiresValue: false
  }
}

/**
 * Field metadata for UI
 */
export const FIELD_METADATA: Record<FilterField, {
  label: string
  type: ValueType
  operators: FilterOperator[]
}> = {
  name: {
    label: 'Name',
    type: 'string',
    operators: ['contains', 'equals', 'startsWith', 'endsWith', 'isEmpty', 'isNotEmpty']
  },
  email: {
    label: 'Email',
    type: 'string',
    operators: ['contains', 'equals', 'endsWith', 'isEmpty', 'isNotEmpty']
  },
  phone: {
    label: 'Phone',
    type: 'string',
    operators: ['contains', 'equals', 'isEmpty', 'isNotEmpty']
  },
  company: {
    label: 'Company',
    type: 'string',
    operators: ['contains', 'equals', 'isEmpty', 'isNotEmpty', 'in', 'notIn']
  },
  department: {
    label: 'Department',
    type: 'string',
    operators: ['equals', 'in', 'notIn']
  },
  role: {
    label: 'Role',
    type: 'string',
    operators: ['equals', 'notEquals', 'in', 'notIn']
  },
  status: {
    label: 'Status',
    type: 'string',
    operators: ['equals', 'notEquals', 'in', 'notIn']
  },
  createdAt: {
    label: 'Created Date',
    type: 'date',
    operators: ['equals', 'greaterThan', 'lessThan', 'between']
  },
  lastLogin: {
    label: 'Last Login',
    type: 'date',
    operators: ['equals', 'greaterThan', 'lessThan', 'between']
  }
}

/**
 * Built-in filter templates for common use cases
 */
export const BUILT_IN_TEMPLATES: QueryTemplate[] = [
  {
    id: 'template-active-users',
    name: 'Active Users',
    description: 'All users with ACTIVE status',
    category: 'common',
    isBuiltIn: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    query: {
      id: 'cond-1',
      field: 'status',
      operator: 'equals',
      value: 'ACTIVE'
    } as FilterCondition
  },
  {
    id: 'template-inactive-users',
    name: 'Inactive Users',
    description: 'All users with INACTIVE status',
    category: 'common',
    isBuiltIn: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    query: {
      id: 'cond-2',
      field: 'status',
      operator: 'equals',
      value: 'INACTIVE'
    } as FilterCondition
  },
  {
    id: 'template-admins',
    name: 'Administrators',
    description: 'All users with ADMIN role',
    category: 'common',
    isBuiltIn: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    query: {
      id: 'cond-3',
      field: 'role',
      operator: 'equals',
      value: 'ADMIN'
    } as FilterCondition
  },
  {
    id: 'template-team-members',
    name: 'Team Members',
    description: 'All users with TEAM_MEMBER role',
    category: 'common',
    isBuiltIn: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    query: {
      id: 'cond-4',
      field: 'role',
      operator: 'equals',
      value: 'TEAM_MEMBER'
    } as FilterCondition
  }
]
