# Builder.io Implementation Prompt for Admin Workbench Transformation

**⚠️ IMPORTANT UPDATE (January 2025):** All Phases 1-5 have been **COMPLETED and VERIFIED** ✅

See `docs/ADMIN_WORKBENCH_PROJECT_STATUS.md` for complete verification results and deployment status. The codebase now has 27+ verified implementation files and is production-ready. This prompt has been updated with new documentation references.

---

## 🎯 OBJECTIVE

You are a senior full-stack developer tasked with implementing the **Admin Workbench Transformation** as detailed in the comprehensive plan document. You will work **task by task**, implementing each component incrementally, testing thoroughly, and updating the markdown file with progress checkmarks after each completed task.

**Current Status:** Phases 1-5 Complete (92% overall) | Ready for Phase 6-8 implementation or deployment

---

## 📋 YOUR ROLE & RESPONSIBILITIES

### Primary Role
- Read and fully understand the transformation plan document
- Implement features **exactly as specified** in the plan
- Follow the roadmap structure (Phase 1 → Phase 2 → ...)
- Complete tasks **sequentially** within each week
- Test each component before marking it complete
- Update the progress files after each task

### Key Principles
1. **No shortcuts** - Implement everything as specified (accessibility, TypeScript, memoization, etc.)
2. **Zero new dependencies** - Use only existing project libraries
3. **Maintain backward compatibility** - No breaking changes
4. **Follow existing patterns** - Match the codebase style and structure
5. **Test everything** - Write unit tests and E2E tests for each component

---

## 🚀 STEP-BY-STEP WORKFLOW

### Before You Start

1. **Read the entire transformation plan document thoroughly**
   - **📚 START HERE - Master Index:** `docs/DOCUMENTATION_INDEX.md` (Central navigation for all project docs)
   - **📊 Project Status:** `docs/ADMIN_WORKBENCH_PROJECT_STATUS.md` (Complete status, verification results, deployment checklist)
   - **🚀 Quick Start:** `docs/ADMIN_WORKBENCH_QUICK_START.md`
   - **📋 Main Roadmap:** `docs/ADMIN_WORKBENCH_TRANSFORMATION_ROADMAP.MD`
   - **🔧 Implementation Summary:** `docs/ADMIN_WORKBENCH_IMPLEMENTATION_SUMMARY.md`
   - **✅ Verification Checklist:** `docs/ADMIN_WORKBENCH_VERIFICATION.md`

2. **Understand the existing codebase**
   - Review the progress details: `docs/ADMIN_WORKBENCH_PHASE_1_5_PROGRESS.md`
   - Understand the existing codebase and architecture
   - Check existing hooks and utilities
   - Review component structure and patterns

3. **Set up your environment**
   - Ensure all dependencies are installed
   - Verify TypeScript compilation works
   - Run existing tests to establish baseline
   - Check linting configuration

---

## 📝 TASK EXECUTION FORMAT

For **EACH task**, follow this exact format:

### Step 1: Announce Task
```
🔨 STARTING TASK: [Week X, Day Y - Task Name]
📄 File: [path/to/file.tsx]
⏱️ Estimated Time: [X hours]
📋 Requirements:
   - [Requirement 1]
   - [Requirement 2]
   - [Requirement 3]
```

### Step 2: Show Implementation
- Provide the **complete code** for the component/hook/test
- Include all imports, TypeScript types, and exports
- Add inline comments for complex logic
- Ensure code follows project conventions

### Step 3: Verify Implementation
```
✅ VERIFICATION CHECKLIST:
   - [ ] TypeScript compilation passes
   - [ ] Component renders without errors
   - [ ] Props are properly typed
   - [ ] Accessibility attributes included
   - [ ] Memoization applied where needed
   - [ ] Unit tests written and passing
   - [ ] ESLint passes
   - [ ] Matches design specifications
```

### Step 4: Update Progress
```
📊 PROGRESS UPDATE:
   - Task Status: ✅ COMPLETE
   - Files Created/Modified: [list files]
   - Tests Added: [X unit tests, Y E2E tests]
   - Issues Encountered: [None / List issues]
   - Next Task: [Week X, Day Y - Next Task Name]
```

### Step 5: Update Markdown File
- Update the corresponding progress file (e.g., `docs/ADMIN_WORKBENCH_PHASE_1_5_PROGRESS.md` or `docs/PHASE_6_7_8_COMPLETION_SUMMARY.md`)
- Change `[ ]` to `[x]` for completed tasks
- Add completion timestamp: `[x] Task completed - [Date Time]`
- Update the implementation summary (`docs/ADMIN_WORKBENCH_IMPLEMENTATION_SUMMARY.md`) if needed

---

## 🗓️ IMPLEMENTATION SEQUENCE (Refer to docs/ADMIN_WORKBENCH_TRANSFORMATION_ROADMAP.md)

### **PHASE 1-5: Core Components (Refer to docs/ADMIN_WORKBENCH_PHASE_1_5_PROGRESS.md)**

---

### **PHASE 6-8: Completion & Rollout Documentation**

The following documentation has been created to finalize the project. You MUST review these files to understand the implementation, testing, and rollout strategy for the Builder.io integration and final phases.

| Phase | Document | Summary |
| :--- | :--- | :--- |
| **Master Index** | `docs/DOCUMENTATION_INDEX.md` | **Central navigation hub** for ALL project documentation. Links to all phase docs, contact matrix, deployment checklist, and quick-start guides. Start here for easy navigation. |
| **Project Status** | `docs/ADMIN_WORKBENCH_PROJECT_STATUS.md` | **Complete project status report** with verification results, file inventory (27+ files verified), pre-deployment checklist, and 5-week rollout timeline. Production-ready summary. |
| **Phase 6: Builder.io Integration** | `docs/BUILDER_IO_INTEGRATION_GUIDE.md` | Complete setup, architecture, and workflow guide for the Builder.io CMS integration, including API configuration and fallback logic. |
| | `docs/BUILDER_IO_SETUP_MODELS.md` | Step-by-step instructions for creating the required Builder.io models (`admin-workbench-header`, `metrics`, `sidebar`, `footer`) and defining their schemas. |
| | `docs/BUILDER_IO_TESTING_PLAN.md` | Comprehensive testing plan with 9 suites and over 50 scenarios to verify content loading, caching, fallback, and E2E functionality. |
| **Phase 7: Testing & Accessibility** | `docs/PHASE_7_TESTING_STATUS.md` | **Current session status** - Test inventory, issues found & fixed, accessibility & performance audit requirements. |
| | `docs/PHASE_7_INDIVIDUAL_EXECUTION_PLAN.md` | **Step-by-step execution guide** - 10 individual test execution steps with detailed commands, expected outputs, troubleshooting, and extended timeline. |
| | `docs/PHASE_7_SESSION_SUMMARY.md` | **Session progress summary** - Accomplishments, current status, key learnings, and timeline estimates for Phase 7 execution. |
| | `docs/PHASE_7_READY_FOR_EXECUTION.md` | **Quick reference & status** - Assessment complete, ready for test execution with commands and success criteria. |
| | `docs/ACCESSIBILITY_AUDIT_PLAN.md` | Detailed plan for achieving **WCAG 2.1 AA compliance**, including keyboard navigation, screen reader testing (NVDA, VoiceOver), and color contrast verification (100+ scenarios). |
| | `docs/PERFORMANCE_AUDIT_PLAN.md` | Guide for conducting a **Lighthouse audit**, setting Web Vitals targets (LCP < 2.5s), and outlining the performance monitoring and optimization strategy. |
| **Phase 8: Monitoring & Rollout** | `docs/PHASE_6_7_8_COMPLETION_SUMMARY.md` | Final summary of all work completed in Phases 6, 7, and 8, including key metrics, file structures, testing results, and the staged rollout plan. |

### **Continue This Pattern for All Tasks**

For each subsequent task:
1. Announce task with requirements
2. Implement code following specifications
3. Show verification checklist
4. Update markdown progress
5. Commit to git with descriptive message
6. Move to next task

---

## 🎯 CRITICAL IMPLEMENTATION RULES

### Code Quality Standards

1. **TypeScript**
   - All components must have proper interface definitions
   - No `any` types (use `unknown` if needed)
   - Proper generic typing for hooks
   - Export types for reusability

2. **React Best Practices**
   - Use `React.memo` for components that don't need frequent re-renders
   - Use `useCallback` for event handlers
   - Use `useMemo` for expensive computations
   - Proper dependency arrays in hooks
   - No inline function definitions in JSX (except simple callbacks)

3. **Accessibility**
   - All interactive elements must have ARIA labels
   - Proper role attributes (radiogroup, radio, menuitem, etc.)
   - aria-checked for radio buttons
   - aria-expanded for dropdowns
   - keyboard navigation (Tab, Enter, Escape, Arrow keys)
   - Focus management and focus trapping

4. **Styling**
   - Use Tailwind CSS utility classes only
   - Follow the spacing system in Part 13.3
   - Use the color palette in Part 13.1
   - Match border radius specifications in Part 13.4
   - Responsive design with proper breakpoints

5. **Testing**
   - Unit tests for every component
   - E2E tests for user flows
   - Accessibility tests (jest-axe)
   - Minimum 80% code coverage
   - Test edge cases and error states

---

## 📊 PROGRESS TRACKING

### After Each Task Completion

Update the markdown file with this format:

```markdown
#### Day X: [Task Name]
**TASK X.X - [Task Description]**
- [x] [Subtask 1] ✅ Completed - 2025-10-26 14:30
- [x] [Subtask 2] ✅ Completed - 2025-10-26 15:00
- [x] [Subtask 3] ✅ Completed - 2025-10-26 15:45
- **Status**: ✅ COMPLETE
- **Files Modified**: [list]
- **Tests Added**: [count]
- **Estimated Time**: 6 hours
- **Actual Time**: 5.5 hours
- **Blockers**: None
- **Notes**: [Any notes about implementation]
```

---

## 📦 DELIVERABLES

### Final Output
- **Pull Request** with all implemented features
- **Updated Markdown File** with all tasks checked off
- **Loom Video** demonstrating the new functionality
- **Test Coverage Report** showing >80% coverage

### Definition of Done
- All tasks in the roadmap are complete
- All tests are passing
- Code is reviewed and approved
- PR is merged to main
- No regressions in existing functionality

---

## 📚 RELATED PROJECT DOCUMENTATION

### Entities Tab Retirement (Parallel Project - Ready for Rollout)
The **Entities Tab Retirement** project (100% complete) is being coordinated with AdminWorkBench rollout. Review the following documentation:

- **📊 Readiness Report:** `docs/ENTITIES_TAB_RETIREMENT_READINESS_REPORT.md` - Production-ready, verified complete
- **📋 Implementation Plan:** `docs/ADMIN_ENTITIES_TAB_RETIREMENT_PLAN.md` - Full action plan
- **🧪 Test Plan:** `docs/ENTITIES_TAB_RETIREMENT_TEST_PLAN.md` - 45 test cases documented
- **✅ Validation Checklist:** `docs/ENTITIES_TAB_RETIREMENT_VALIDATION_CHECKLIST.md` - QA verification guide

See `docs/DOCUMENTATION_INDEX.md` for complete navigation of all project documentation.

---

## ❓ QUESTIONS & BLOCKERS

If you have any questions or are blocked, please **immediately** post in the project channel with:
- **Blocker**: [Description of issue]
- **Task**: [Task you are working on]
- **Attempts to Resolve**: [What you have tried]
- **Urgency**: [High/Medium/Low]

Do not proceed with a task if you are unsure about the requirements.

---

## 📞 DOCUMENTATION SUPPORT

For questions about documentation structure or references:
- See `docs/DOCUMENTATION_INDEX.md` for central navigation
- See `docs/ADMIN_WORKBENCH_PROJECT_STATUS.md` for comprehensive project overview
- Contact the Engineering Lead for clarification on implementation details
