export type {
  ClientItem,
  TeamMemberItem,
  AdminUser,
  EntityFormData
} from './entities'

export {
  isClientItem,
  isTeamMemberItem,
  isAdminUser,
  asClientItem,
  asTeamMemberItem,
  asAdminUser
} from './entities'

// Phase 7: Advanced Query Builder Types
export type {
  FilterCondition,
  FilterGroup,
  QueryTemplate,
  AdvancedQueryBuilderProps,
  FilterOperator,
  FilterField,
  LogicalOperator,
  ValueType
} from './query-builder'

export {
  OPERATOR_METADATA,
  FIELD_METADATA,
  BUILT_IN_TEMPLATES
} from './query-builder'
