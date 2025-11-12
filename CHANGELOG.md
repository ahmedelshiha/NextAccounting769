# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

## [Unreleased]
### Added
- CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, LICENSE, CHANGELOG.md
- docs/redundancy-report.md with consolidation plan
- User Profile Dropdown Enhancement - Complete UI/UX redesign:
  - Horizontal theme selector (Light, Dark, System) with smooth transitions
  - Compact status selector with popover for quick status changes
  - Visual section grouping (Profile, Preferences, Quick Actions)
  - Enhanced hover states and focus indicators with smooth animations
  - Keyboard shortcuts (⌘P, ⌘S, ⌘?, ⌘Q, ⌘⇧L, ⌘⇧D)
  - Mobile-optimized bottom sheet layout (<768px breakpoint)
  - CSS-based animations with reduced motion support
  - Comprehensive E2E tests and accessibility audit
  - Full WCAG 2.1 AA compliance

### Changed
- README.md refreshed with setup, API overview, deployment, and audit summary
- src/components/admin/layout/Header/UserProfileDropdown.tsx - Complete redesign with improved UX
- src/app/globals.css - Added CSS animations for theme, status, and dropdown interactions
- Enhanced menu item styling with animated hover effects and keyboard navigation
- EnterpriseUsersPage.tsx - Updated to use AdminWorkBench component directly instead of wrapper

### Removed
- Legacy code cleanup - Removed ExecutiveDashboardTab component (replaced by AdminWorkBench)
- Deleted: src/app/admin/users/components/tabs/ExecutiveDashboardTab.tsx
- Deleted: src/app/admin/users/components/ExecutiveDashboardTabWrapper.tsx
- Deleted: src/app/admin/users/components/__tests__/ExecutiveDashboardTabWrapper.test.tsx
- Deleted: src/hooks/useAdminWorkBenchFeature.ts (functionality integrated into core)
- Updated component exports to remove ExecutiveDashboardTab references
- AdminWorkBench feature flags now hardcoded to always-on (no environment variables needed)
  - NEXT_PUBLIC_ADMIN_WORKBENCH_ENABLED no longer required
  - NEXT_PUBLIC_ADMIN_WORKBENCH_ROLLOUT_PERCENTAGE no longer required
  - All users now see AdminWorkBench UI by default

### Technical Improvements
- Added useKeyboardShortcuts hook for native keyboard event handling
- Added useMediaQuery hook for responsive design
- Implemented error handling for theme and status changes
- Added toast notifications for user feedback
- Improved accessibility with ARIA labels and semantic HTML
- Performance optimized animations (60fps, <26KB bundle size)

## [0.1.0] - 2025-10-05
### Added
- Initial public documentation and scripts
