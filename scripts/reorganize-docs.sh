#!/bin/bash

# Documentation Folder Reorganization Script
# This script reorganizes docs/ from flat structure to organized categories
# Run from project root: bash scripts/reorganize-docs.sh

set -e

echo "🚀 Starting docs folder reorganization..."
echo ""

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Phase 1: Create folder structure
echo -e "${BLUE}Phase 1: Creating folder structure...${NC}"

mkdir -p docs/core
mkdir -p docs/critical-tasks/admin-users
mkdir -p docs/critical-tasks/rbac-permissions
mkdir -p docs/critical-tasks/tenant-system
mkdir -p docs/features/admin-dashboard
mkdir -p docs/features/admin-settings/localization
mkdir -p docs/features/localization/implementation-guides
mkdir -p docs/features/menu-customization
mkdir -p docs/features/user-profile/manage-profile
mkdir -p docs/features/admin-ui/sidebar
mkdir -p docs/features/admin-ui/footer
mkdir -p docs/features/admin-ui/status-selector
mkdir -p docs/features/admin-ui/theme-switcher
mkdir -p docs/features/admin-ui/dark-mode
mkdir -p docs/operations/runbooks
mkdir -p docs/guides
mkdir -p docs/tenant-system
mkdir -p docs/task-lists
mkdir -p docs/reports/audit-reports
mkdir -p docs/reports/implementation-reports
mkdir -p docs/reports/feature-reports
mkdir -p docs/testing/admin-users
mkdir -p docs/testing/logs

echo -e "${GREEN}✅ Folders created${NC}"
echo ""

# Phase 2: Move files to their new locations
echo -e "${BLUE}Phase 2: Moving files...${NC}"

# CRITICAL TASKS - Admin Users
echo "Moving admin-users files..."
mv -f "docs/ADMIN_USERS_PAGE_CRITICAL_AUDIT.md" "docs/critical-tasks/admin-users/01_CRITICAL_AUDIT.md" 2>/dev/null || echo "  ⚠️  01_CRITICAL_AUDIT.md not found"
mv -f "docs/ADMIN_USERS_QUICK_FIX_IMPLEMENTATION.md" "docs/critical-tasks/admin-users/02_QUICK_FIX.md" 2>/dev/null || echo "  ⚠️  02_QUICK_FIX.md not found"
mv -f "docs/ADMIN_USERS_ENTERPRISE_REDESIGN.md" "docs/critical-tasks/admin-users/03_ENTERPRISE_REDESIGN.md" 2>/dev/null || echo "  ⚠️  03_ENTERPRISE_REDESIGN.md not found"
mv -f "docs/ADMIN_USERS_TESTING_CHECKLIST.md" "docs/critical-tasks/admin-users/" 2>/dev/null || echo "  ⚠️  TESTING_CHECKLIST.md not found"
mv -f "docs/ADMIN_USERS_QUICK_REFERENCE.md" "docs/critical-tasks/admin-users/" 2>/dev/null || echo "  ⚠️  QUICK_REFERENCE.md not found"
mv -f "docs/ADMIN_USERS_MODULAR_ARCHITECTURE.md" "docs/critical-tasks/admin-users/" 2>/dev/null || echo "  ⚠️  MODULAR_ARCHITECTURE.md not found"
mv -f "docs/ADMIN_USERS_PAGE_OPTIMIZATION.md" "docs/critical-tasks/admin-users/" 2>/dev/null || echo "  ⚠️  PAGE_OPTIMIZATION.md not found"
mv -f "docs/ADMIN_USERS_IMPLEMENTATION_SUMMARY.md" "docs/critical-tasks/admin-users/" 2>/dev/null || echo "  ⚠️  IMPLEMENTATION_SUMMARY.md not found"
mv -f "docs/ADMIN_USERS_NEXT_STEPS.md" "docs/critical-tasks/admin-users/" 2>/dev/null || echo "  ⚠️  NEXT_STEPS.md not found"
mv -f "docs/ADMIN_USERS_PHASE2_COMPLETE.md" "docs/critical-tasks/admin-users/" 2>/dev/null || echo "  ⚠️  PHASE2_COMPLETE.md not found"
mv -f "docs/ADMIN_USERS_REFACTORING_COMPLETION_REPORT.md" "docs/critical-tasks/admin-users/" 2>/dev/null || echo "  ⚠️  REFACTORING_COMPLETION_REPORT.md not found"
mv -f "docs/ADMIN_USERS_TASK_DOCUMENTATION_INDEX.md" "docs/critical-tasks/admin-users/" 2>/dev/null || echo "  ⚠️  TASK_DOCUMENTATION_INDEX.md not found"

# CRITICAL TASKS - RBAC
echo "Moving RBAC files..."
mv -f "docs/rbac_unified_modal_plan.md" "docs/critical-tasks/rbac-permissions/UNIFIED_MODAL_PLAN.md" 2>/dev/null || echo "  ⚠️  UNIFIED_MODAL_PLAN.md not found"
mv -f "docs/accessibility-audit-rbac-modal.md" "docs/critical-tasks/rbac-permissions/ACCESSIBILITY_AUDIT.md" 2>/dev/null || echo "  ⚠️  ACCESSIBILITY_AUDIT.md not found"
mv -f "docs/RBAC_FIX_IMPLEMENTATION_GUIDE.md" "docs/critical-tasks/rbac-permissions/" 2>/dev/null || echo "  ⚠️  RBAC_FIX_IMPLEMENTATION_GUIDE.md not found"
mv -f "docs/RBAC_QUICK_REFERENCE.md" "docs/critical-tasks/rbac-permissions/" 2>/dev/null || echo "  ⚠️  RBAC_QUICK_REFERENCE.md not found"
mv -f "docs/RBAC_SYSTEM_AUDIT_AND_ENHANCEMENT_PLAN.md" "docs/critical-tasks/rbac-permissions/" 2>/dev/null || echo "  ⚠️  RBAC_SYSTEM_AUDIT_AND_ENHANCEMENT_PLAN.md not found"

# CRITICAL TASKS - Tenant System
echo "Moving tenant system files..."
mv -f "docs/TENANT_CONTEXT.md" "docs/critical-tasks/tenant-system/CONTEXT.md" 2>/dev/null || echo "  ⚠️  CONTEXT.md not found"
mv -f "docs/TENANT_CONTEXT_IMPLEMENTATION.md" "docs/critical-tasks/tenant-system/CONTEXT_IMPLEMENTATION.md" 2>/dev/null || echo "  ⚠️  CONTEXT_IMPLEMENTATION.md not found"
mv -f "docs/TENANT_CONTEXT_QUICK_REFERENCE.md" "docs/critical-tasks/tenant-system/CONTEXT_QUICK_REFERENCE.md" 2>/dev/null || echo "  ⚠️  CONTEXT_QUICK_REFERENCE.md not found"
mv -f "docs/TENANT_CONTEXT_SYSTEM.md" "docs/critical-tasks/tenant-system/" 2>/dev/null || echo "  ⚠️  TENANT_CONTEXT_SYSTEM.md not found"

# FEATURES - Localization
echo "Moving localization files..."
mv -f "docs/localization.md" "docs/features/localization/" 2>/dev/null || echo "  ⚠️  localization.md not found"
mv -f "docs/LOCALIZATION_API_REFERENCE.md" "docs/features/localization/" 2>/dev/null || echo "  ⚠️  LOCALIZATION_API_REFERENCE.md not found"
mv -f "docs/LOCALIZATION_ADMIN_SETTINGS_SUMMARY.md" "docs/features/localization/" 2>/dev/null || echo "  ⚠️  LOCALIZATION_ADMIN_SETTINGS_SUMMARY.md not found"
mv -f "docs/LOCALIZATION_DEPLOYMENT_GUIDE.md" "docs/features/localization/" 2>/dev/null || echo "  ⚠️  LOCALIZATION_DEPLOYMENT_GUIDE.md not found"
mv -f "docs/LOCALIZATION_ACCESSIBILITY_AUDIT.md" "docs/features/localization/" 2>/dev/null || echo "  ⚠️  LOCALIZATION_ACCESSIBILITY_AUDIT.md not found"
mv -f "docs/LOCALIZATION_ADMIN_RUNBOOKS.md" "docs/features/localization/" 2>/dev/null || echo "  ⚠️  LOCALIZATION_ADMIN_RUNBOOKS.md not found"
mv -f "docs/localization-admin-settings-audit.md" "docs/features/admin-settings/localization/AUDIT.md" 2>/dev/null || echo "  ⚠️  localization AUDIT.md not found"
mv -f "docs/implementation-guides"/* "docs/features/localization/implementation-guides/" 2>/dev/null || true

# FEATURES - Menu Customization
echo "Moving menu customization files..."
mv -f "docs/Menu_Customization_Modal.md" "docs/features/menu-customization/" 2>/dev/null || echo "  ⚠️  Menu_Customization_Modal.md not found"
mv -f "docs/Menu_Customization_Modal_Enhancement_Plan.md" "docs/features/menu-customization/" 2>/dev/null || echo "  ⚠️  Menu_Customization_Modal_Enhancement_Plan.md not found"
mv -f "docs/Menu_Customization_Modal_Implementation_Summary.md" "docs/features/menu-customization/" 2>/dev/null || echo "  ⚠️  Menu_Customization_Modal_Implementation_Summary.md not found"
mv -f "docs/Menu_Customization_Modal_plan.md" "docs/features/menu-customization/PLAN.md" 2>/dev/null || echo "  ⚠️  Menu_Customization_Modal_plan.md not found"
mv -f "docs/MENU_CUSTOMIZATION_TESTING_SUMMARY.md" "docs/features/menu-customization/" 2>/dev/null || echo "  ⚠️  MENU_CUSTOMIZATION_TESTING_SUMMARY.md not found"

# FEATURES - User Profile
echo "Moving user profile files..."
mv -f "docs/USER_PROFILE_IMPLEMENTATION_COMPLETE.md" "docs/features/user-profile/" 2>/dev/null || echo "  ⚠️  USER_PROFILE_IMPLEMENTATION_COMPLETE.md not found"
mv -f "docs/USER_PROFILE_MODAL_COMPREHENSIVE_AUDIT.md" "docs/features/user-profile/" 2>/dev/null || echo "  ⚠️  USER_PROFILE_MODAL_COMPREHENSIVE_AUDIT.md not found"
mv -f "docs/USER_PROFILE_DROPDOWN_ENHANCEMENT.md" "docs/features/user-profile/" 2>/dev/null || echo "  ⚠️  USER_PROFILE_DROPDOWN_ENHANCEMENT.md not found"
mv -f "docs/profile_dropdown_enhancement.md" "docs/features/user-profile/" 2>/dev/null || echo "  ⚠️  profile_dropdown_enhancement.md not found"

# FEATURES - Manage Profile
echo "Moving manage profile files..."
mv -f "docs/MANAGE-PROFILE-AUDIT-2025-10-21-UPDATED.md" "docs/features/user-profile/manage-profile/" 2>/dev/null || echo "  ⚠️  MANAGE-PROFILE-AUDIT-2025-10-21-UPDATED.md not found"
mv -f "docs/MANAGE-PROFILE-AUDIT-2025-10-21.md" "docs/features/user-profile/manage-profile/" 2>/dev/null || echo "  ⚠️  MANAGE-PROFILE-AUDIT-2025-10-21.md not found"
mv -f "docs/MANAGE-PROFILE-CHANGELOG-2025-10-21.md" "docs/features/user-profile/manage-profile/" 2>/dev/null || echo "  ⚠️  MANAGE-PROFILE-CHANGELOG-2025-10-21.md not found"
mv -f "docs/MANAGE-PROFILE-EXECUTION-REPORT.md" "docs/features/user-profile/manage-profile/" 2>/dev/null || echo "  ⚠️  MANAGE-PROFILE-EXECUTION-REPORT.md not found"
mv -f "docs/MANAGE-PROFILE-IMPLEMENTATION-SUMMARY.md" "docs/features/user-profile/manage-profile/" 2>/dev/null || echo "  ⚠️  MANAGE-PROFILE-IMPLEMENTATION-SUMMARY.md not found"
mv -f "docs/MANAGE-PROFILE-INTEGRATION-PLAN.md" "docs/features/user-profile/manage-profile/" 2>/dev/null || echo "  ⚠️  MANAGE-PROFILE-INTEGRATION-PLAN.md not found"
mv -f "docs/MANAGE-PROFILE-QUICK-REFERENCE.md" "docs/features/user-profile/manage-profile/" 2>/dev/null || echo "  ⚠️  MANAGE-PROFILE-QUICK-REFERENCE.md not found"
mv -f "docs/MANAGE-PROFILE-TECHNICAL-FINDINGS.md" "docs/features/user-profile/manage-profile/" 2>/dev/null || echo "  ⚠️  MANAGE-PROFILE-TECHNICAL-FINDINGS.md not found"
mv -f "docs/user-profile-transformation.md" "docs/features/user-profile/manage-profile/" 2>/dev/null || echo "  ⚠️  user-profile-transformation.md not found"

# FEATURES - Admin Dashboard
echo "Moving admin dashboard files..."
mv -f "docs/admin-dashboard-audit-report.md" "docs/features/admin-dashboard/" 2>/dev/null || echo "  ⚠️  admin-dashboard-audit-report.md not found"
mv -f "docs/admin-dashboard-fix.md" "docs/features/admin-dashboard/" 2>/dev/null || echo "  ⚠️  admin-dashboard-fix.md not found"

# FEATURES - Admin UI (Sidebar)
echo "Moving admin UI files..."
mv -f "docs/ADMIN_SIDEBAR_AUDIT.md" "docs/features/admin-ui/sidebar/" 2>/dev/null || echo "  ⚠️  ADMIN_SIDEBAR_AUDIT.md not found"
mv -f "docs/SIDEBAR_COLLAPSE_AUDIT_REPORT.md" "docs/features/admin-ui/sidebar/" 2>/dev/null || echo "  ⚠️  SIDEBAR_COLLAPSE_AUDIT_REPORT.md not found"
mv -f "docs/SIDEBAR_COLLAPSE_FIX_SUMMARY.md" "docs/features/admin-ui/sidebar/" 2>/dev/null || echo "  ⚠️  SIDEBAR_COLLAPSE_FIX_SUMMARY.md not found"
mv -f "docs/SIDEBAR_REVIEW.md" "docs/features/admin-ui/sidebar/" 2>/dev/null || echo "  ⚠️  SIDEBAR_REVIEW.md not found"
mv -f "docs/Sidebar Toggle-enhancement.md" "docs/features/admin-ui/sidebar/" 2>/dev/null || echo "  ⚠️  Sidebar Toggle-enhancement.md not found"
mv -f "docs/admin-sidebar-todo.md" "docs/task-lists/Admin_Sidebar.md" 2>/dev/null || echo "  ⚠️  admin-sidebar-todo.md not found"

# FEATURES - Admin UI (Footer)
echo "Moving footer files..."
mv -f "docs/ADMIN_FOOTER_TASK_BREAKDOWN.md" "docs/features/admin-ui/footer/" 2>/dev/null || echo "  ⚠️  ADMIN_FOOTER_TASK_BREAKDOWN.md not found"
mv -f "docs/admin-footer-enhancement.md" "docs/features/admin-ui/footer/" 2>/dev/null || echo "  ⚠️  admin-footer-enhancement.md not found"

# FEATURES - Admin UI (Status Selector)
echo "Moving status selector files..."
mv -f "docs/STATUS_SELECTOR_ENHANCEMENTS.md" "docs/features/admin-ui/status-selector/" 2>/dev/null || echo "  ⚠️  STATUS_SELECTOR_ENHANCEMENTS.md not found"

# FEATURES - Admin UI (Theme Switcher)
echo "Moving theme switcher files..."
mv -f "docs/THEME_SWITCHER_ENHANCEMENTS.md" "docs/features/admin-ui/theme-switcher/" 2>/dev/null || echo "  ⚠️  THEME_SWITCHER_ENHANCEMENTS.md not found"

# FEATURES - Admin UI (Dark Mode)
echo "Moving dark mode files..."
mv -f "docs/admin-dark-mode-migration-plan.md" "docs/features/admin-ui/dark-mode/" 2>/dev/null || echo "  ⚠️  admin-dark-mode-migration-plan.md not found"

# OPERATIONS
echo "Moving operations files..."
mv -f "docs/DEPLOYMENT_CHECKLIST.md" "docs/operations/" 2>/dev/null || echo "  ⚠️  DEPLOYMENT_CHECKLIST.md not found"
mv -f "docs/DEPLOYMENT_READINESS.md" "docs/operations/" 2>/dev/null || echo "  ⚠️  DEPLOYMENT_READINESS.md not found"
mv -f "docs/OPERATIONS_DEPLOYMENT_CHECKLIST.md" "docs/operations/" 2>/dev/null || echo "  ⚠️  OPERATIONS_DEPLOYMENT_CHECKLIST.md not found"
mv -f "docs/RELEASE_PROCESS.md" "docs/operations/" 2>/dev/null || echo "  ⚠️  RELEASE_PROCESS.md not found"
mv -f "docs/INCIDENT_RESPONSE.md" "docs/operations/" 2>/dev/null || echo "  ⚠️  INCIDENT_RESPONSE.md not found"
mv -f "docs/RUNBOOK_ONCALL.md" "docs/operations/" 2>/dev/null || echo "  ⚠️  RUNBOOK_ONCALL.md not found"
mv -f "docs/runbooks"/* "docs/operations/runbooks/" 2>/dev/null || true

# GUIDES
echo "Moving guide files..."
mv -f "docs/ARCHITECTURE.md" "docs/guides/" 2>/dev/null || echo "  ⚠️  ARCHITECTURE.md not found"
mv -f "docs/API_REFERENCE.md" "docs/guides/" 2>/dev/null || echo "  ⚠️  API_REFERENCE.md not found"
mv -f "docs/ENVIRONMENT_VARIABLES_REFERENCE.md" "docs/guides/" 2>/dev/null || echo "  ⚠️  ENVIRONMENT_VARIABLES_REFERENCE.md not found"
mv -f "docs/env-reference.md" "docs/guides/" 2>/dev/null || echo "  ⚠️  env-reference.md not found"
mv -f "docs/DEVELOPER-QUICK-START.md" "docs/guides/" 2>/dev/null || echo "  ⚠️  DEVELOPER-QUICK-START.md not found"
mv -f "docs/ONBOARDING.md" "docs/guides/" 2>/dev/null || echo "  ⚠️  ONBOARDING.md not found"
mv -f "docs/UPGRADE_GUIDE.md" "docs/guides/" 2>/dev/null || echo "  ⚠️  UPGRADE_GUIDE.md not found"
mv -f "docs/MIGRATION_GUIDE.md" "docs/guides/" 2>/dev/null || echo "  ⚠️  MIGRATION_GUIDE.md not found"
mv -f "docs/TESTING_STRATEGY.md" "docs/guides/" 2>/dev/null || echo "  ⚠️  TESTING_STRATEGY.md not found"
mv -f "docs/TROUBLESHOOTING.md" "docs/guides/" 2>/dev/null || echo "  ⚠️  TROUBLESHOOTING.md not found"
mv -f "docs/SECURITY_GUIDELINES.md" "docs/guides/" 2>/dev/null || echo "  ⚠️  SECURITY_GUIDELINES.md not found"
mv -f "docs/DATA_PRIVACY.md" "docs/guides/" 2>/dev/null || echo "  ⚠️  DATA_PRIVACY.md not found"
mv -f "docs/STYLEGUIDE.md" "docs/guides/" 2>/dev/null || echo "  ⚠️  STYLEGUIDE.md not found"
mv -f "docs/TYPE-SAFETY-STANDARDS.md" "docs/guides/" 2>/dev/null || echo "  ⚠️  TYPE-SAFETY-STANDARDS.md not found"
mv -f "docs/ZOD-CASTING-STYLE-GUIDE.md" "docs/guides/" 2>/dev/null || echo "  ⚠️  ZOD-CASTING-STYLE-GUIDE.md not found"
mv -f "docs/ACCESSIBILITY_AUDIT.md" "docs/guides/" 2>/dev/null || echo "  ⚠️  ACCESSIBILITY_AUDIT.md not found"
mv -f "docs/SUPER_ADMIN_SETUP_QUICK_START.md" "docs/guides/" 2>/dev/null || echo "  ⚠️  SUPER_ADMIN_SETUP_QUICK_START.md not found"
mv -f "docs/admin-user-creation-guide.md" "docs/guides/" 2>/dev/null || echo "  ⚠️  admin-user-creation-guide.md not found"

# TENANT SYSTEM
echo "Moving tenant system files..."
mv -f "docs/tenant-system-audit.md" "docs/tenant-system/SYSTEM_AUDIT.md" 2>/dev/null || echo "  ⚠️  SYSTEM_AUDIT.md not found"
mv -f "docs/tenant_context_tasks.md" "docs/tenant-system/CONTEXT_TASKS.md" 2>/dev/null || echo "  ⚠️  CONTEXT_TASKS.md not found"
mv -f "docs/tenant_migration_plan.md" "docs/tenant-system/" 2>/dev/null || echo "  ⚠️  tenant_migration_plan.md not found"
mv -f "docs/tenant_migration_ai.md" "docs/tenant-system/" 2>/dev/null || echo "  ⚠️  tenant_migration_ai.md not found"
mv -f "docs/prisma_tenant_patterns.md" "docs/tenant-system/TENANT_PATTERNS.md" 2>/dev/null || echo "  ⚠️  TENANT_PATTERNS.md not found"

# TASK LISTS
echo "Moving task list files..."
mv -f "docs/Admin Settings Panel Upgrade-todo.md" "docs/task-lists/Admin_Settings_Panel_Upgrade.md" 2>/dev/null || echo "  ⚠️  Admin_Settings_Panel_Upgrade.md not found"
mv -f "docs/Comprehensive Tenant System-todo.md" "docs/task-lists/Comprehensive_Tenant_System.md" 2>/dev/null || echo "  ⚠️  Comprehensive_Tenant_System.md not found"
mv -f "docs/log-fixes-todo.md" "docs/task-lists/Log_Fixes.md" 2>/dev/null || echo "  ⚠️  Log_Fixes.md not found"
mv -f "docs/log-fix-plan.md" "docs/task-lists/" 2>/dev/null || echo "  ⚠️  log-fix-plan.md not found"
mv -f "docs/test_failures_todo.md" "docs/task-lists/Test_Failures.md" 2>/dev/null || echo "  ⚠️  Test_Failures.md not found"
mv -f "docs/test-failure-action-plan.md" "docs/task-lists/" 2>/dev/null || echo "  ⚠️  test-failure-action-plan.md not found"
mv -f "docs/user-profile-transformation-todo.md" "docs/task-lists/User_Profile_Transformation.md" 2>/dev/null || echo "  ⚠️  User_Profile_Transformation.md not found"
mv -f "docs/Redundancy Cleanup & Consolidation-todo.md" "docs/task-lists/Redundancy_Cleanup_and_Consolidation.md" 2>/dev/null || echo "  ⚠️  Redundancy_Cleanup_and_Consolidation.md not found"
mv -f "docs/Super Admin Setup & Security Solution todo.md" "docs/task-lists/Super_Admin_Setup_and_Security_Solution.md" 2>/dev/null || echo "  ⚠️  Super_Admin_Setup_and_Security_Solution.md not found"

# REPORTS - Audit Reports
echo "Moving audit report files..."
mv -f "docs/admin-dashboard-audit-report.md" "docs/reports/audit-reports/" 2>/dev/null || echo "  ⚠️  admin-dashboard-audit-report.md not found"
mv -f "docs/audit-report.md" "docs/reports/audit-reports/" 2>/dev/null || echo "  ⚠️  audit-report.md not found"
mv -f "docs/production-log-audit.md" "docs/reports/audit-reports/" 2>/dev/null || echo "  ⚠️  production-log-audit.md not found"
mv -f "docs/redundancy-report.md" "docs/reports/audit-reports/" 2>/dev/null || echo "  ⚠️  redundancy-report.md not found"
mv -f "docs/theme-isolation-summary.md" "docs/reports/audit-reports/" 2>/dev/null || echo "  ⚠️  theme-isolation-summary.md not found"

# REPORTS - Implementation Reports
echo "Moving implementation report files..."
mv -f "docs/IMPLEMENTATION_ROADMAP.md" "docs/reports/implementation-reports/" 2>/dev/null || echo "  ⚠️  IMPLEMENTATION_ROADMAP.md not found"
mv -f "docs/IMPLEMENTATION-COMPLETION-REPORT.md" "docs/reports/implementation-reports/" 2>/dev/null || echo "  ⚠️  IMPLEMENTATION-COMPLETION-REPORT.md not found"
mv -f "docs/IMPLEMENTATION_COMPLETION_SUMMARY.md" "docs/reports/implementation-reports/" 2>/dev/null || echo "  ⚠️  IMPLEMENTATION_COMPLETION_SUMMARY.md not found"
mv -f "docs/PHASE-1-IMPLEMENTATION-SUMMARY.md" "docs/reports/implementation-reports/" 2>/dev/null || echo "  ⚠️  PHASE-1-IMPLEMENTATION-SUMMARY.md not found"
mv -f "docs/WEEK1_COMPLETION_REPORT.md" "docs/reports/implementation-reports/" 2>/dev/null || echo "  ⚠️  WEEK1_COMPLETION_REPORT.md not found"
mv -f "docs/VERIFICATION_REPORT.md" "docs/reports/implementation-reports/" 2>/dev/null || echo "  ⚠️  VERIFICATION_REPORT.md not found"
mv -f "docs/ENHANCEMENT_PLAN_COMPLETION_REPORT.md" "docs/reports/implementation-reports/" 2>/dev/null || echo "  ⚠️  ENHANCEMENT_PLAN_COMPLETION_REPORT.md not found"
mv -f "docs/ENHANCEMENT_PLAN_REFINEMENT_ANALYSIS.md" "docs/reports/implementation-reports/" 2>/dev/null || echo "  ⚠️  ENHANCEMENT_PLAN_REFINEMENT_ANALYSIS.md not found"
mv -f "docs/NEXT-PHASE-AUDIT-RECOMMENDATIONS.md" "docs/reports/implementation-reports/" 2>/dev/null || echo "  ⚠️  NEXT-PHASE-AUDIT-RECOMMENDATIONS.md not found"

# REPORTS - Feature Reports
echo "Moving feature report files..."
mv -f "docs/MENU_CUSTOMIZATION_TESTING_SUMMARY.md" "docs/reports/feature-reports/" 2>/dev/null || echo "  ⚠️  MENU_CUSTOMIZATION_TESTING_SUMMARY.md not found"

# TESTING
echo "Moving testing files..."
mv -f "docs/testing/logs/test-failure-action-plan.md" "docs/testing/logs/" 2>/dev/null || true

echo -e "${GREEN}✅ Files moved${NC}"
echo ""

# Phase 3: Move remaining files that need org
echo -e "${BLUE}Phase 3: Moving remaining organizational files...${NC}"

# Move Comprehensive Tenant System Enhancement Plan
mv -f "docs/Comprehensive Tenant System Enhancement Plan.md" "docs/tenant-system/ENHANCEMENT_PLAN.md" 2>/dev/null || echo "  ⚠️  Comprehensive_Tenant_System_Enhancement_Plan not found"

# Move prompts to guides  
mv -f "docs/Autonomous-Developer-Prompt.md" "docs/guides/" 2>/dev/null || echo "  ⚠️  Autonomous-Developer-Prompt.md not found"
mv -f "docs/builder_io_prompt.md" "docs/guides/" 2>/dev/null || echo "  ⚠️  builder_io_prompt.md not found"
mv -f "docs/senior_dev_prompt.md" "docs/guides/" 2>/dev/null || echo "  ⚠️  senior_dev_prompt.md not found"

# Move Super Admin Setup
mv -f "docs/Super Admin Setup & Security Solution.md" "docs/guides/" 2>/dev/null || echo "  ⚠️  Super_Admin_Setup_and_Security_Solution.md not found"

echo -e "${GREEN}✅ Organizational files moved${NC}"
echo ""

# Phase 4: Check for remaining files
echo -e "${BLUE}Phase 4: Checking for files still in docs root...${NC}"

remaining=$(find docs -maxdepth 1 -name "*.md" 2>/dev/null | wc -l)

if [ "$remaining" -gt 2 ]; then
  echo -e "${YELLOW}⚠️  Found $remaining markdown files still in docs root:${NC}"
  find docs -maxdepth 1 -name "*.md" -type f -exec basename {} \;
  echo ""
  echo "Please review and manually move these if needed, or they may be supporting files."
else
  echo -e "${GREEN}✅ Docs root is clean${NC}"
fi

echo ""
echo -e "${GREEN}✅ Documentation reorganization complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Review the new folder structure: ls -la docs/"
echo "2. Update any broken links in markdown files"
echo "3. Commit the changes: git add docs/ && git commit -m 'refactor: reorganize docs folder'"
echo "4. Push to origin: git push origin main"
echo ""
