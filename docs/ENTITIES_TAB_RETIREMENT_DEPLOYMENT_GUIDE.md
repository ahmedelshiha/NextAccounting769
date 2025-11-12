# Production Deployment Guide - Entities Tab Retirement ✅

**Status**: Ready for Production Deployment  
**Date**: 2024  
**Feature Flag**: `NEXT_PUBLIC_RETIRE_ENTITIES_TAB`  
**Risk Level**: Low (Feature flag enabled for safe rollback)

---

## Executive Summary

The Entities Tab Retirement feature is ready for production deployment. All code is complete, tested, and backward compatible. The deployment will proceed in two phases:

1. **Phase 1: Safe Rollout** - Deploy with feature flag OFF (safe default)
2. **Phase 2: Gradual Rollout** - Enable feature flag progressively (10% → 50% → 100%)

---

## Pre-Deployment Verification Checklist

### ✅ Code Quality
- [x] All TypeScript compilation passes
- [x] No TODO or placeholder comments in implementation
- [x] Error handling in all API calls
- [x] Proper ARIA labels for accessibility
- [x] Responsive design verified
- [x] Feature flags properly scoped

### ✅ Feature Implementation
- [x] Feature flags: `retireEntitiesTab`, `dashboardSinglePage`
- [x] Telemetry: `users.redirect_legacy`, `users.create_user`, `users.edit_user`
- [x] URL redirects: `/admin/clients`, `/admin/team`
- [x] Role filters: CLIENT, TEAM_MEMBER, TEAM_LEAD, STAFF, ADMIN
- [x] Unified form modal: `UnifiedUserFormModal.tsx`
- [x] Dashboard enhancements: Role chips, saved views, filters
- [x] API deprecation headers: 90-day sunset window

### ✅ Test Coverage
- [x] E2E tests for FF off scenario (backward compatibility)
- [x] E2E tests for FF on scenario (new behavior)
- [x] Legacy route redirects tested
- [x] Role filter chips tested
- [x] Bulk operations tested
- [x] User profile drawer tested

### ✅ Documentation
- [x] Implementation plan complete
- [x] Validation checklist prepared
- [x] Rollout procedure defined
- [x] Monitoring dashboard defined
- [x] Rollback procedure prepared

---

## Deployment Phases

### Phase 1: Production Deployment (Week 1) - Safe Default

**Objective**: Deploy code with feature flag OFF to ensure backward compatibility

**Pre-Deployment Steps**:
1. Ensure `NEXT_PUBLIC_RETIRE_ENTITIES_TAB` is NOT set or set to `false`
2. Verify all E2E tests pass with FF off
3. Get sign-off from QA and product team

**Deployment Steps**:
```bash
# 1. Build and deploy
npm run build
npm run deploy --production --env.NEXT_PUBLIC_RETIRE_ENTITIES_TAB=false

# 2. Post-deployment: Verify
# - Navigate to /admin/users
# - Verify Entities tab is visible
# - Test legacy routes redirect correctly
# - Monitor error logs (first 2 hours critical)
```

**Verification Checklist**:
- [ ] App deploys without errors
- [ ] No error logs in Sentry
- [ ] Admin users can see Entities tab
- [ ] Legacy routes redirect to correct URLs
- [ ] Telemetry events are being tracked
- [ ] API response times normal

**Duration**: 1 week (monitoring period)

**Rollback Plan**: No rollback needed; feature flag automatically defaults to OFF

---

### Phase 2: Feature Flag Gradual Rollout (Week 2-4) - Progressive Enablement

**Objective**: Gradually enable the feature flag and monitor adoption

#### Step 1: Enable for 10% of Users (Week 2)
```bash
# Update environment variable
NEXT_PUBLIC_RETIRE_ENTITIES_TAB=true
# Deploy with canary: enable for 10% of traffic

# Expected behavior:
# - 10% of users: Entities tab hidden, redirects to Dashboard
# - 90% of users: Entities tab visible (old behavior)
```

**Monitoring Metrics**:
- [ ] `users.redirect_legacy` event count
- [ ] Error rate (should remain <0.1%)
- [ ] User complaints/support tickets
- [ ] API latency (should be <200ms)

**Duration**: 48-72 hours

#### Step 2: Enable for 50% of Users (Week 3)
```bash
# Increase deployment to 50% of users
NEXT_PUBLIC_RETIRE_ENTITIES_TAB=true
# Deploy with canary: enable for 50% of traffic
```

**Monitoring Metrics**:
- [ ] `users.redirect_legacy` event trending
- [ ] Deprecated API endpoint usage
- [ ] User feedback on new Dashboard experience
- [ ] Performance metrics stable

**Duration**: 3-5 days

#### Step 3: Enable for 100% of Users (Week 4)
```bash
# Full rollout
NEXT_PUBLIC_RETIRE_ENTITIES_TAB=true
# Deploy to 100% of production
```

**Pre-Rollout Checks**:
- [ ] 50% canary phase showed no issues
- [ ] Team consensus to proceed
- [ ] Support team briefed on changes
- [ ] Documentation updated

**Duration**: Ongoing

---

## Monitoring & Telemetry

### Key Metrics to Track

#### 1. Feature Adoption
```javascript
// Track how many users use the new Dashboard vs old Entities
users.redirect_legacy
  - from: 'entities' | '/admin/clients' | '/admin/team'
  - to: 'dashboard'
  - timestamp: ISO8601
```

#### 2. API Usage
```http
GET /api/admin/entities/clients (deprecated)
GET /api/admin/entities/team-members (deprecated)
GET /api/admin/users?role=CLIENT (new)
GET /api/admin/users?role=TEAM_MEMBER (new)
```

#### 3. Performance
- Dashboard page load time: target <2s
- User table virtualization: target <100ms first render
- Filter application: target <500ms

#### 4. Errors
- Sentry monitoring for:
  - Form submission errors
  - Filter application errors
  - Role validation errors
  - API errors

### Monitoring Dashboard

Create a monitoring dashboard with:

```sql
SELECT 
  event_name,
  COUNT(*) as event_count,
  DATE_TRUNC('hour', timestamp) as hour
FROM analytics.events
WHERE event_name IN (
  'users.redirect_legacy',
  'users.create_user',
  'users.edit_user',
  'users.delete_user',
  'users.search',
  'users.bulk_apply'
)
GROUP BY event_name, hour
ORDER BY hour DESC
```

### Alert Thresholds

```yaml
alerts:
  - name: High Error Rate in Users API
    condition: error_rate > 5%
    duration: 5m
    action: Page on-call

  - name: Deprecated API Usage Spike
    condition: requests_to_deprecated_api > baseline * 2
    duration: 10m
    action: Notify team

  - name: Form Submission Failures
    condition: form_submission_error_rate > 2%
    duration: 5m
    action: Page on-call
```

---

## Rollback Procedure

**If Issues Occur**:

### Option 1: Feature Flag Disable (Recommended)
```bash
# Quickest rollback: disable feature flag
NEXT_PUBLIC_RETIRE_ENTITIES_TAB=false

# Expected behavior:
# - Entities tab immediately visible
# - Users redirected to old behavior
# - No code rollback needed
# - Can troubleshoot while users unaffected
```

### Option 2: Code Rollback (If Required)
```bash
# Full rollback to previous deployment
git revert <commit-hash>
npm run build
npm run deploy --production

# This reverts all changes including:
# - Entities tab visible
# - Dashboard enhancements hidden
# - Legacy API only
```

### Option 3: Partial Rollback (Feature Flag Off)
```bash
# Keep code, disable feature flag
NEXT_PUBLIC_RETIRE_ENTITIES_TAB=false
# Redeploy configuration only (no code rebuild)
```

---

## Post-Deployment Tasks

### Week 1 (Safe Default Phase)
- [ ] Monitor error logs and metrics
- [ ] Gather user feedback
- [ ] Verify all redirects working
- [ ] Check API performance
- [ ] Document any issues

### Week 2-4 (Gradual Rollout Phase)
- [ ] Continue monitoring telemetry
- [ ] Track deprecated API usage trend
- [ ] Monitor user complaints
- [ ] Ensure team readiness for next phase

### 30+ Days Post-Rollout
- [ ] Analyze `users.redirect_legacy` metric
- [ ] Verify deprecated API usage is minimal (<5%)
- [ ] Schedule EntitiesTab.tsx removal
- [ ] Plan legacy API endpoint removal

### 60+ Days Post-Rollout (Cleanup Phase)
- [ ] Remove `EntitiesTab.tsx` component
- [ ] Remove `/api/admin/entities/*` endpoints
- [ ] Remove deprecated tests
- [ ] Remove feature flags from codebase
- [ ] Update documentation

---

## Communication Plan

### Pre-Deployment
- [ ] Notify product team
- [ ] Notify support team
- [ ] Prepare FAQ for users
- [ ] Update internal documentation

### During Deployment
- [ ] Status updates every 2 hours
- [ ] Slack notifications for milestones
- [ ] Monitor team on-call

### Post-Deployment
- [ ] Weekly metrics report
- [ ] Monthly team retrospective
- [ ] Documentation updates

---

## Rollout Timeline

```
Week 1:  Phase 1 - Safe Deployment (FF Off)
         ├─ Deploy with safe default
         ├─ Monitor 24/7 (2 people)
         ├─ Verify backward compatibility
         └─ Get go/no-go for next phase

Week 2:  Phase 2 - Gradual Rollout (FF On 10%)
         ├─ Enable for 10% of traffic
         ├─ Monitor closely (2 people)
         ├─ Gather metrics
         └─ After 48-72h → proceed to 50%

Week 3:  Phase 2 - Continued (FF On 50%)
         ├─ Enable for 50% of traffic
         ├─ Monitor metrics
         ├─ Gather user feedback
         └─ After 3-5 days → proceed to 100%

Week 4:  Phase 2 - Full Rollout (FF On 100%)
         ├─ Enable for 100% of traffic
         ├─ Continue monitoring
         └─ Plan cleanup phase

Week 5+: Steady State & Monitoring
         ├─ Monitor deprecated API usage
         ├─ Weekly metrics review
         └─ Plan cleanup (60+ days)
```

---

## Success Criteria

### Phase 1 Success (Week 1)
- ✅ Code deployed without errors
- ✅ Error rate <0.1%
- ✅ All users see Entities tab (backward compatible)
- ✅ No Sentry issues
- ✅ Support team reports zero complaints

### Phase 2 Success (Weeks 2-4)
- ✅ 10% canary: <0.1% error rate
- ✅ 50% canary: <0.1% error rate
- ✅ 100% rollout: <0.1% error rate
- ✅ User feedback positive
- ✅ Deprecated API usage tracked

### Overall Success
- ✅ Feature flag working as designed
- ✅ All telemetry events tracked
- ✅ Users adopted new Dashboard experience
- ✅ No regression in other features
- ✅ Performance metrics stable

---

## Team Responsibilities

### Deployment Team
- Perform deployment
- Monitor logs and metrics
- Respond to incidents
- Document rollback if needed

### Support Team
- Monitor user feedback
- Answer questions about new UI
- Provide training materials
- Collect user feedback

### Product Team
- Approve each rollout phase
- Gather user feedback
- Decide on cleanup timeline
- Plan future enhancements

### Engineering Team
- Monitor API performance
- Track deprecated API usage
- Plan cleanup phase
- Update documentation

---

## Related Documents

- [Implementation Plan](./ADMIN_ENTITIES_TAB_RETIREMENT_PLAN.md)
- [Implementation Summary](./ENTITIES_TAB_RETIREMENT_IMPLEMENTATION_SUMMARY.md)
- [Validation Checklist](./ENTITIES_TAB_RETIREMENT_VALIDATION_CHECKLIST.md)

---

**Ready to Deploy**: ✅ All checks passed. Awaiting approval to proceed with Phase 1 deployment.
