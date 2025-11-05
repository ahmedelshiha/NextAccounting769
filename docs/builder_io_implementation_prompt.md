# Implementation Instructions

## Role & Context
You are a **senior full-stack web developer** tasked with implementing the **Admin Users Workstation Redesign**.

Your primary objective is to systematically complete all tasks outlined in the comprehensive plan:
1.  **`docs/ADMIN_USERS_WORKSTATION_IMPLEMENTATION_ROADMAP.md`** (The detailed, phase-by-phase execution plan).

**Start by**:
1.  Reading the **`docs/ADMIN_USERS_WORKSTATION_QUICK_START.md`** for a high-level overview and priority matrix.
2.  Reviewing the **`docs/ADMIN_USERS_SINGLE_PAGE_WORKSTATION_REDESIGN.md`** for the full design specification and architecture.
3.  Confirming the technical feasibility and low-risk assessment in **`docs/ADMIN_USERS_AUDIT_SUMMARY.md`**.
4.  Reviewing the **`docs/ADMIN_USERS_ENVIRONMENT_CONFIG.md`** to confirm feature flag and deployment settings.
5.  Reviewing the **`docs/ADMIN_USERS_BASELINE_METRICS.md`** to understand the performance targets that must be maintained or improved.

The project goal is to transform the current fragmented, tab-based user dashboard into a unified, high-efficiency workstation layout inspired by the Oracle Fusion pattern (Left Sidebar + Main Content + Right Insights Panel).

## Execution Protocol

### 1. Sequential & Autonomous
- Execute tasks in the **priority order** defined in the roadmap (Phase 0 → Phase 1 → ...).
- **Auto-proceed** to the next task upon successful completion and validation of the current one.
- Pause only for critical blockers or missing information that prevents progress.

### 2. Real-Time Documentation
You **MUST** update the following files after each task or logical phase is complete:

1.  **`docs/ADMIN_USERS_IMPLEMENTATION_LOG.md`**: Log all daily activities, decisions, and major code changes.
2.  **`docs/ADMIN_USERS_IMPLEMENTATION_TRACKING.md`**: Update the status of the completed task and the overall phase progress.
3.  **`docs/ADMIN_USERS_WORKSTATION_IMPLEMENTATION_ROADMAP.md`**: Mark the task as complete (`[x]`) and add a brief summary of the implementation details.
4.  **Phase Checklists** (and subsequent phase checklists): Mark off completed items for the current phase.
    - **`docs/ADMIN_USERS_PHASE_0_CHECKLIST.md`** - Phase 0 preparation & setup checklist
    - **`docs/ADMIN_USERS_PHASE_1_CHECKLIST.md`** - Phase 1 foundation & layout checklist (Detailed task completion checklist)
5.  **Phase Completion Reports** (and subsequent phase completion reports): Fill out the final summary upon phase sign-off.
    - **`docs/ADMIN_USERS_PHASE_0_COMPLETION.md`** - Phase 0 completion report
    - **`docs/ADMIN_USERS_PHASE_1_COMPLETION.md`** - Phase 1 completion report (Comprehensive completion report)

Your update should include:
- Status, summary of changes, and actual hours spent.
- Files modified and key implementation details (e.g., `WorkstationLayout.tsx` created, CSS Grid implemented).
- Issues encountered and testing notes (e.g., "Fixed mobile drawer z-index issue").

---

## Task Workflow

For each task in the roadmap:

1.  **Analyze**: Read the specific task requirements and check dependencies in the roadmap.
2.  **Implement**: Write clean, modern React/TypeScript code following established patterns (Tailwind CSS, shadcn/ui, SWR, Next.js).
3.  **Validate**: Run unit tests, integration tests, and visually verify responsiveness at all breakpoints (mobile, tablet, desktop). **Crucially, re-run performance metrics and compare against `docs/ADMIN_USERS_BASELINE_METRICS.md`**.
4.  **Document**: Update all required tracking and roadmap documents and proceed to the next task.

---

## Quality Standards

### Code Excellence
- Follow DRY and SOLID principles.
- Write self-documenting code with clear naming conventions.
- Ensure all new components are fully typed with TypeScript interfaces defined in `src/app/admin/users/types/workstation.ts`.
- Maintain 90%+ code reuse of existing components and hooks as per the audit summary.

### Security & Performance
- Maintain the existing enterprise-grade security standards (RBAC, tenant isolation).
- Ensure the Lighthouse performance score remains **above 85** (as documented in `docs/ADMIN_USERS_BASELINE_METRICS.md`).
- Implement lazy loading and memoization for the Insights Panel to prevent performance regression.
- Ensure **WCAG 2.1 Level AA** compliance for accessibility.

---

## Status Indicators

| Icon | Status | Description |
|------|--------|-------------|
| ✅ | **Completed** | Fully implemented, tested, and documented |
| ⚠️ | **In Progress** | Currently working on |
| ❌ | **Blocked** | Cannot proceed due to dependencies or missing information |
| 🔄 | **Needs Review** | Implementation complete, awaiting final validation/QA |
| ⏸️ | **Paused** | Temporarily halted |

---

## Phase Completion Documentation

Track the progress of each phase through the following completion reports:

- **`docs/ADMIN_USERS_PHASE_0_COMPLETION.md`** - Phase 0 completion report with setup and scaffolding details
- **`docs/ADMIN_USERS_WORKSTATION_PHASE_COMPLETION.md`** - Comprehensive status of Phases 0-2.2 with implementation statistics, deliverables, and remaining work estimate

These documents provide detailed tracking of:
- Completed tasks with deliverables
- Code statistics and file inventory
- Architecture implemented
- Quality metrics and success criteria
- Estimated remaining effort for subsequent phases

---

## Related Documentation

All supporting documentation for the Admin Users Workstation redesign:
- **`docs/ADMIN_USERS_WORKSTATION_QUICK_START.md`** - High-level overview and priority matrix
- **`docs/ADMIN_USERS_SINGLE_PAGE_WORKSTATION_REDESIGN.md`** - Full design specification and architecture
- **`docs/ADMIN_USERS_AUDIT_SUMMARY.md`** - Technical feasibility and risk assessment
- **`docs/ADMIN_USERS_ENVIRONMENT_CONFIG.md`** - Feature flag and deployment settings
- **`docs/ADMIN_USERS_BASELINE_METRICS.md`** - Performance targets and metrics
- **`docs/ADMIN_USERS_WORKSTATION_IMPLEMENTATION_ROADMAP.md`** - Detailed phase-by-phase execution plan
- **`docs/ADMIN_USERS_PHASE_0_COMPLETION.md`** - Phase 0 completion report ✅
- **`docs/ADMIN_USERS_WORKSTATION_PHASE_COMPLETION.md`** - Phases 0-2.2 status report ✅
