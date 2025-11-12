# Phase 8: Canary Rollout & Monitoring Setup

**Status:** ✅ READY TO EXECUTE  
**Target Date:** Week 1 (Feb 20-24, 2025)  
**Owner:** DevOps + Frontend Lead  
**Duration:** 7 days (Canary 48h + Ramp 3 days + Stabilization 2 days)

---

## 📋 Pre-Rollout Checklist (Do Before Any Traffic)

- [x] Phase 1-7 Complete: All code implemented, unit tests passing, E2E tests written
- [x] Feature flag infrastructure in place: `adminWorkBench` flag ready
- [x] Sentry integration configured: DSN set, error tracking enabled
- [x] Rollback plan documented: Legacy code preserved in `src/app/admin/users/legacy/`
- [x] Team notified: Slack #engineering channel updated
- [x] On-call engineer assigned: For first 72h of rollout
- [x] Monitoring dashboard prepared: Sentry custom dashboard created
- [ ] Staging environment test complete: Manual QA sign-off
- [ ] Database backups confirmed: Production backup automated

---

## 🎯 Rollout Schedule

### Timeline Overview

```
Day 1-2 (Wed-Thu): CANARY @ 10% traffic
├─ Monitor every 15 minutes (first 8h)
├─ Monitor every 30 minutes (next 16h)
├─ Monitor hourly (24-48h window)
└─ Success criteria: 0 P1/P2 errors, LCP < 2.5s

Day 3-5 (Fri-Sun): RAMP @ 25% → 50% → 75% traffic
├─ 25% (Fri morning): 4h monitoring, then hourly
├─ 50% (Fri evening): 4h monitoring, then hourly
├─ 75% (Sat): 4h monitoring, then hourly
└─ Daily 9am standup to review metrics

Day 6-7 (Mon-Tue): 100% traffic + STABILIZATION
├─ 100% rollout (Mon midnight)
├─ Continuous monitoring (72h window)
├─ All features stable
└─ Success: 72h with 0 P1 errors

Day 8 (Wed): CODE CLEANUP
└─ Remove legacy code + finalize
```

---

## 🚀 Step 1: Canary Rollout (Days 1-2) — 10% Traffic

### Setup Instructions

**1. Enable Feature Flag**

```bash
# Set environment variable for next deployment
NEXT_PUBLIC_FEATURE_FLAGS='{"adminWorkBench":true, "adminWorkBench_canary":true}'

# Deploy to production
vercel deploy --prod
```

**2. Configure Flag Routing**

The feature flag routing is handled by:
- **Hook:** `useAdminWorkBenchFeature()` in `src/hooks/useAdminWorkBenchFeature.ts`
- **Router:** `ExecutiveDashboardTabWrapper` in `src/app/admin/users/components/ExecutiveDashboardTabWrapper.tsx`
- **Canary targeting:** Sample 10% of users by ID hash

```typescript
// src/hooks/useAdminWorkBenchFeature.ts
export function useAdminWorkBenchFeature(): boolean {
  const flagValue = getFeatureFlag('adminWorkBench')
  const userIdHash = hashUserId(getCurrentUserId())
  
  // 10% canary: hash < 0.1
  const isCanary = (userIdHash % 100) < 10
  
  return flagValue && isCanary
}
```

**3. Monitor Sentry Setup**

```bash
# Create Sentry alert rule for adminWorkBench errors
# Go to https://sentry.io/organizations/your-org/alerts/
# 
# Rule: Alert if admin-workbench errors > 5 in 10 minutes
# Condition:
#   - Tag: feature = 'admin-workbench'
#   - Tag: phase = 'rollout'
#   - Level: error, fatal
#   - Threshold: 5 errors in 10 minutes
# 
# Action: Notify #engineering-alerts Slack channel + page on-call
```

### Canary Monitoring Checklist

**First 8 hours (Real-time monitoring):**
- [ ] Error count = 0 (check every 15 min)
- [ ] No new error patterns in Sentry
- [ ] API latency < 500ms (check every 15 min)
- [ ] User feedback: 0 complaints
- [ ] Logins successful for canary users

**Hours 8-24 (Every 30 minutes):**
- [ ] P1/P2 error count = 0
- [ ] Page load time (LCP) < 2.5s
- [ ] Memory usage stable (no leaks)
- [ ] Database query performance normal
- [ ] No increase in 5xx errors

**Hours 24-48 (Hourly monitoring):**
- [ ] Cumulative error count < 2
- [ ] All metrics stable
- [ ] Feature usage > 5% (expected with 10% traffic)
- [ ] User satisfaction surveys = 0 negatives

### Canary Metrics Dashboard

**Create Sentry Custom Dashboard:**

1. Go to Sentry → Dashboards → Create
2. Add these queries:

```
# Query 1: AdminWorkBench Errors Over Time
tags.feature:admin-workbench level:[error, fatal]
Compare: Last 7 days vs Now

# Query 2: Page Load Performance (LCP)
measurements.largest_contentful_paint:[0 to 5000]
AND url:/admin/users

# Query 3: User Errors by Component
tags.feature:admin-workbench
Group by: tags.component
```

**Manual Metrics to Track:**

| Metric | Target | Check Frequency |
|--------|--------|-----------------|
| Error Count | 0 | Every 15 min |
| P1/P2 Count | 0 | Every 30 min |
| LCP | < 2.5s | Every hour |
| API Latency (p95) | < 500ms | Every hour |
| Database Queries (p95) | < 200ms | Every 2h |
| Memory Usage | < 15% increase | Every 2h |
| Error Rate | < 0.1% | Every 4h |

### Canary Success Criteria ✅

```
PROCEED TO RAMP if all true:
✓ Error count = 0 or < 2 total
✓ P1/P2 errors = 0
✓ LCP < 2.5s (no regression from baseline)
✓ No new error patterns
✓ API latency normal
✓ No memory leaks
✓ Canary users report no issues
✓ Feature adoption > 5%
```

```
ROLLBACK immediately if any:
✗ P1 error spike (> 5 in 1h)
✗ LCP regression > 30%
✗ Database connection pool exhausted
✗ Memory leak detected
✗ > 10 users report failures
```

### Rollback Procedure (If Needed)

```bash
# Option 1: Instant (< 5 min) - Disable flag
NEXT_PUBLIC_FEATURE_FLAGS='{"adminWorkBench":false}'
vercel deploy --prod

# Option 2: Gradual (< 15 min) - Reduce canary to 1%
# Edit useAdminWorkBenchFeature.ts:
#   isCanary = (userIdHash % 100) < 1  // 1% instead of 10%

# Option 3: Full Revert (< 2 min) - GitHub revert
git revert [commit-hash]
git push origin main
vercel deploy --prod
```

---

## 📈 Step 2: Ramp-Up (Days 3-5) — 25% → 50% → 75% Traffic

### Day 3 (Friday): Ramp to 25%

**Morning (9 AM):**
- [ ] Review canary metrics (last 24h)
- [ ] Team standup: Confirm all-clear
- [ ] Update feature flag to 25% traffic

```typescript
// Update canary percentage
isCanary = (userIdHash % 100) < 25  // 25% traffic
```

**Deployment:**
```bash
vercel deploy --prod
```

**Monitoring (First 4 hours intensively):**
- [ ] Monitor dashboard every 15 min
- [ ] Confirm error count stable
- [ ] Check LCP baseline
- [ ] Verify API capacity handling 2.5x traffic

**Success:** If no issues by 1 PM, move to next phase at 6 PM

### Day 4 (Saturday): Ramp to 50%

**Morning (9 AM):**
- [ ] Review 25% metrics (previous 24h)
- [ ] Team standup
- [ ] Update to 50%

```typescript
isCanary = (userIdHash % 100) < 50  // 50% traffic
```

**Monitoring:**
- [ ] First 4h: Real-time (15 min intervals)
- [ ] Next 4h: 30 min intervals
- [ ] Rest of day: Hourly

**Concurrent Usage Check:**
```bash
# Estimate concurrent users
25% traffic = ~50 concurrent admin users
50% traffic = ~100 concurrent admin users
75% traffic = ~150 concurrent admin users
100% traffic = ~200 concurrent admin users

# Monitor database connection pool:
# Max connections = 20 per tenant
# With multi-tenancy, verify pool doesn't exhaust
```

### Day 5 (Sunday): Ramp to 75%

**Same process:**
1. Morning standup (9 AM)
2. Review 50% metrics
3. Update to 75%
4. Intensive monitoring (first 4h)
5. Hourly after that

### Ramp-Up Success Criteria

```
PROCEED TO 100% if:
✓ 24h window: < 2 total errors
✓ No P1/P2 errors at any traffic level
✓ LCP remained stable through ramp
✓ API response times < 500ms p95
✓ Database queries < 200ms p95
✓ Memory stable (no increase > 10%)
✓ Feature adoption tracking normally
```

---

## 🛡️ Step 3: Stabilization (Days 6-7) — 100% Traffic + 72h Observation

### Day 6 (Monday): 100% Rollout

**Midnight Deployment:**
```typescript
isCanary = true  // All users get new dashboard
// OR remove the canary logic entirely
```

```bash
vercel deploy --prod
```

**Monitoring Strategy:**

- **Hours 0-8:** Real-time monitoring (every 15 min)
- **Hours 8-24:** Every 30 min
- **Hours 24-48:** Hourly
- **Hours 48-72:** Every 2-4 hours

**Metrics to Watch:**

```typescript
const stabilityMetrics = {
  errorCount: getErrorCount(),           // Target: < 5 total
  p1Errors: getP1Errors(),              // Target: 0
  avgLCP: getAverageLCP(),              // Target: < 2.3s
  p95Latency: getP95Latency(),          // Target: < 500ms
  userSatisfaction: getSurveyScore(),   // Target: > 4.5/5
  featureAdoption: getAdoptionRate(),   // Target: > 98%
  databaseHealth: checkConnections(),   // Target: < 80% pool usage
  memoryTrend: getMemoryTrend()         // Target: no increase
}
```

### Day 7 (Tuesday): Stabilization Complete

**72-Hour Window Checkpoint:**

If all metrics ✅:
- [ ] Verify 72h of 0 P1 errors
- [ ] LCP regression < 5% from baseline
- [ ] User feedback positive
- [ ] Database healthy
- [ ] No memory leaks
- [ ] Feature working as designed

**Then proceed to cleanup:**
→ **Move to Day 8: Code Cleanup**

---

## 🔄 Step 4: Code Cleanup & Finalization (Day 8)

Once 72-hour stabilization window confirmed:

### Remove Legacy Code

```bash
# Delete old dashboard files
rm -rf src/app/admin/users/legacy/ExecutiveDashboardTab.tsx
rm -rf src/app/admin/users/legacy/

# Remove feature flag wrapper
# (or keep as dead code for safety - your choice)
# Option: Keep for 2 more weeks as insurance
```

### Update Feature Flag

```bash
# Option A: Remove flag check (commit to new UI)
# Change ExecutiveDashboardTabWrapper to:
export default AdminWorkBench  // Always use new UI

# Option B: Keep flag but default to true (safer)
# return flagValue !== false ? <AdminWorkBench /> : <LegacyDash />
```

### Documentation Updates

- [ ] Update README.md: Remove legacy UI references
- [ ] Add section: "AdminWorkBench is now the standard dashboard"
- [ ] Archive old implementation guides
- [ ] Update onboarding docs for new users

### Performance Verification (Final)

```bash
# Run performance suite one more time
npm run test:thresholds

# Check bundle size didn't regress
npm run build

# Verify no console errors in production
# (check Sentry for JS errors)
```

---

## 📊 Monitoring & Alerting Setup

### Sentry Configuration

**Create Custom Alert Rule:**

```
Rule Name: AdminWorkBench Errors
Conditions:
  - Tag: feature = "admin-workbench"
  - Level: error OR fatal
  - Error count > 5 in 10 minutes

Actions:
  - Send to #engineering-alerts (Slack)
  - Page on-call (PagerDuty)
  - Create Jira ticket (P1)
```

**Sentry Dashboard Queries:**

```
# Critical Issues
issues_that_need_review
WHERE
  tags.feature:"admin-workbench"
  AND level:error
  AND firstSeen:"1 day"

# Performance Regression
performance
WHERE
  tags.feature:"admin-workbench"
  AND measurements.largest_contentful_paint:[2500 TO *]

# User Impact
issue:admin-workbench
GROUP BY tags.environment
```

### Key Metrics to Monitor

**Real-time (Dashboard):**
- Error rate (target: < 0.1%)
- Page load time - LCP (target: < 2.3s)
- API response time p95 (target: < 500ms)
- Database query time p95 (target: < 200ms)
- User session count
- Feature adoption %

**Hourly Review:**
- New error patterns
- Spike in any error type
- User feedback sentiment
- Performance degradation

**Daily Standup (9 AM):**
- Summary of metrics
- Any P1/P2 issues
- User complaints/feedback
- Decision: Proceed or rollback

---

## 🚨 Incident Response Plan

### If P1 Error Occurs

```
IMMEDIATE (< 5 min):
1. Alert triggered in Sentry
2. On-call engineer notified
3. Slack alert in #engineering-alerts
4. Open war room if severe

DECISION (< 15 min):
- Severity assessment
- Impact: # of affected users
- Options:
  a) Rollback feature flag (fast, safe)
  b) Apply hotfix (risky, faster recovery)
  c) Reduce traffic to 5% (investigative)

ACTION (< 30 min):
- Execute decision
- Document incident
- Root cause analysis begins
```

### Rollback Decision Tree

```
Is P1 error count > 10?
├─ YES → ROLLBACK immediately
│        Disable flag, revert to legacy
│        Investigate later
│
└─ NO → 100% traffic or < 5 users affected?
         ├─ YES → Apply hotfix
         │        Test in staging first
         │        Deploy with feature flag off
         │
         └─ NO → Reduce traffic to 5%
                  Enable detailed logging
                  Investigate root cause
                  Apply fix → re-enable
```

---

## ✅ Rollout Success Criteria (Final)

The rollout is **SUCCESSFUL** if after 72 hours at 100% traffic:

```
✅ ERROR METRICS:
   - Total error count < 5
   - P1 errors = 0
   - P2 errors < 2
   - Error rate < 0.05%

✅ PERFORMANCE:
   - LCP: 2.0s - 2.3s (< 5% regression)
   - FCP: < 1.5s
   - CLS: < 0.1
   - TTI: < 3.5s
   - API p95: < 500ms
   - DB p95: < 200ms

✅ RELIABILITY:
   - Uptime: 99.9%
   - No timeout errors
   - No database connection errors
   - No memory leaks

✅ ADOPTION:
   - Feature used by > 98% of admins
   - No revert requests
   - Positive feedback in surveys

✅ USER IMPACT:
   - 0 critical customer complaints
   - 0 escalations to support
   - Improved workflow efficiency
```

---

## 📝 Runbook Summary

### Quick Reference

| Phase | Traffic | Duration | Success Criteria | Owner |
|-------|---------|----------|------------------|-------|
| Canary | 10% | 48h | 0 P1 errors | On-call |
| Ramp 1 | 25% | 24h | Stable metrics | Team lead |
| Ramp 2 | 50% | 24h | No regressions | Team lead |
| Ramp 3 | 75% | 24h | Performance OK | Team lead |
| 100% | 100% | 72h | All metrics green | On-call + team |
| Cleanup | - | 1 day | Legacy removed | Dev |

### Team Responsibilities

**On-Call Engineer (First 72h):**
- Monitor Sentry dashboard
- Respond to alerts
- Execute rollback if needed
- Document incidents

**Team Lead:**
- Daily standups
- Metric reviews
- Decision: proceed or investigate
- Escalate to eng director if issues

**Frontend Developer:**
- Monitor error patterns
- Prepare hotfixes if needed
- Root cause analysis
- Performance optimization

**DevOps:**
- Infrastructure monitoring
- Database health checks
- Backup verification
- Capacity planning

---

## 🎯 Expected Outcomes

After successful Phase 8:

```
✨ AdminWorkBench is live at 100% traffic
✨ Legacy dashboard safely archived
✨ Zero regressions in performance
✨ User adoption > 98%
✨ Team confident in rollout process
✨ Documentation complete
✨ Post-mortem (if any incidents) complete
```

**Next phase:** Ongoing monitoring and optimization (Phase 9+)

---

**Document Version:** 2.0  
**Last Updated:** February 2025  
**Status:** 🟢 Ready for Execution
