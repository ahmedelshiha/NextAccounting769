/**
 * Shared User Entity Type Definitions
 * Focused on profile and team member information (NOT authentication)
 * Authentication types are separate in next-auth.d.ts
 * 
 * [PORTAL] = visible to portal users
 * [ADMIN] = visible only to admins
 */

/**
 * User role enumeration
 */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  TEAM_MEMBER = 'TEAM_MEMBER',
  CLIENT = 'CLIENT',
}

/**
 * Availability status for team members
 */
export enum AvailabilityStatus {
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
  AWAY = 'AWAY',
  OFFLINE = 'OFFLINE',
}

/**
 * Expertise level enumeration
 */
export enum ExpertiseLevel {
  JUNIOR = 'JUNIOR',
  MID = 'MID',
  SENIOR = 'SENIOR',
  EXPERT = 'EXPERT',
  LEAD = 'LEAD',
}

/**
 * Core User Profile (public information)
 */
export interface UserProfile {
  // Core identification
  id: string; // [PORTAL] [ADMIN]
  email: string; // [PORTAL] [ADMIN]
  name: string | null; // [PORTAL] [ADMIN]
  
  // Avatar
  image?: string | null; // [PORTAL] [ADMIN]
  
  // Role information
  role: UserRole; // [ADMIN]
  
  // Timestamps
  createdAt: string; // ISO-8601 datetime
  updatedAt: string; // ISO-8601 datetime
}

/**
 * Team Member Profile (extended user info for team members)
 * [ADMIN] = visible only to admins
 * [PORTAL] = visible to portal users (limited info)
 */
export interface TeamMemberProfile extends UserProfile {
  // Employment information [ADMIN]
  employeeId?: string | null;
  department?: string | null;
  position?: string | null;
  
  // Skills and expertise [ADMIN]
  skills?: string[];
  certifications?: string[];
  expertise?: ExpertiseLevel | null;
  experienceYears?: number | null;
  
  // Availability [ADMIN]
  availabilityStatus?: AvailabilityStatus;
  workingHours?: Record<string, unknown> | null;
  
  // Capacity planning [ADMIN]
  maxConcurrentProjects?: number;
  hourlyRate?: number | null;
  bookingBuffer?: number | null; // Minutes
  
  // Management [ADMIN]
  managerId?: string | null;
  manager?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  
  // Automation [ADMIN]
  autoAssign?: boolean;
  
  // Hire information [ADMIN]
  hireDate?: string | null; // ISO-8601 date
  tier?: string | null; // Tier/level designation
}

/**
 * Client User Profile
 */
export interface ClientProfile extends UserProfile {
  // Client-specific information
  tier?: string | null; // Client tier: INDIVIDUAL, SMB, ENTERPRISE
  
  // Preferences [PORTAL]
  bookingPreferences?: {
    preferredServiceIds?: string[];
    preferredTeamMemberIds?: string[];
    timezone?: string;
    reminderPreference?: 'email' | 'sms' | 'both' | 'none';
  };
}

/**
 * User for list/search results
 */
export interface UserSummary {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  image?: string | null;
  position?: string | null;
  department?: string | null;
}

/**
 * User filters for admin queries [ADMIN]
 */
export interface UserFilters {
  role?: UserRole | 'all';
  department?: string;
  status?: AvailabilityStatus | 'all';
  expertise?: ExpertiseLevel | 'all';
  search?: string;
}

/**
 * User list request parameters [ADMIN]
 */
export interface UserListParams extends UserFilters {
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'email' | 'createdAt' | 'role';
  sortOrder?: 'asc' | 'desc';
}

/**
 * User profile update data [PORTAL]
 */
export interface UserProfileUpdateData {
  name?: string;
  image?: string | null;
  timezone?: string;
  preferredLanguage?: string;
}

/**
 * Team member update data [ADMIN]
 */
export interface TeamMemberUpdateData extends UserProfileUpdateData {
  department?: string;
  position?: string;
  skills?: string[];
  certifications?: string[];
  expertise?: ExpertiseLevel;
  experienceYears?: number;
  hourlyRate?: number | null;
  maxConcurrentProjects?: number;
  bookingBuffer?: number | null;
  managerId?: string | null;
  autoAssign?: boolean;
  availabilityStatus?: AvailabilityStatus;
  workingHours?: Record<string, unknown> | null;
}

/**
 * Bulk user operation [ADMIN]
 */
export interface UserBulkAction {
  action: 'activate' | 'deactivate' | 'change_role' | 'assign_team' | 'update_permissions';
  userIds: string[];
  value?: string | UserRole | string[];
}

/**
 * User statistics [ADMIN]
 */
export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<string, number>;
  teamMembers: number;
  clients: number;
  admins: number;
  averageResponseTime?: number; // in hours
}

/**
 * User activity log entry [ADMIN]
 */
export interface UserActivityLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  timestamp: string; // ISO-8601 datetime
  details?: Record<string, unknown>;
}

/**
 * User preferences
 */
export interface UserPreferences {
  language: string;
  timezone: string;
  notificationEmail: boolean;
  notificationSMS: boolean;
  darkMode: boolean;
  defaultViewMode: string; // 'list' | 'card' | 'board' | 'calendar'
}

/**
 * Portal-safe user view (excludes sensitive admin fields)
 */
export type UserPortalView = Omit<
  TeamMemberProfile,
  | 'employeeId'
  | 'department'
  | 'skills'
  | 'certifications'
  | 'expertise'
  | 'experienceYears'
  | 'availabilityStatus'
  | 'workingHours'
  | 'maxConcurrentProjects'
  | 'hourlyRate'
  | 'bookingBuffer'
  | 'managerId'
  | 'manager'
  | 'autoAssign'
  | 'hireDate'
  | 'tier'
>;
