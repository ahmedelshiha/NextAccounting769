# Phase 8: Ramp-Up Execution Checklist

**Dates:** Days 3-7 (Friday-Tuesday)  
**Traffic Target:** 25% → 50% → 75% → 100%  
**Owner:** Engineering Team Lead

---

## 🔵 Day 3 (Friday): Ramp to 25%

### Pre-Deployment (8:00 AM)

**Checklist:**
- [ ] Review canary metrics (last 24h)
  - [ ] Error count: _____ (target: < 2)
  - [ ] P1 errors: _____ (target: 0)
  - [ ] LCP: _____ (target: < 2.5s)
  - [ ] API latency p95: _____ (target: < 500ms)
- [ ] Team standup completed
- [ ] All team members present
- [ ] On-call engineer assigned
- [ ] Sentry dashboard accessible
- [ ] Slack monitoring channel ready

**Decision:**
- [ ] **APPROVED** to proceed with 25% ramp
- [ ] **HOLD** for further investigation
- [ ] **ROLLBACK** (if issues found)

### Deployment (9:00 AM)

**Steps:**
1. [ ] Update feature flag percentage in code:
   ```typescript
   // src/hooks/useAdminWorkBenchFeature.ts
   const canaryPercent = 25  // Updated from 10
   ```

2. [ ] Verify code change locally:
   ```bash
   git diff src/hooks/useAdminWorkBenchFeature.ts
   ```

3. [ ] Commit and push:
   ```bash
   git add src/hooks/useAdminWorkBenchFeature.ts
   git commit -m "chore: ramp to 25% traffic for adminWorkBench"
   git push origin main
   ```

4. [ ] Deploy to production:
   ```bash
   vercel deploy --prod
   ```

5. [ ] Confirm deployment successful:
   - [ ] Vercel dashboard shows ✅
   - [ ] Production URL responsive
   - [ ] No new Sentry errors in first 2 min

### Monitoring (9:15 AM - 1:00 PM) — Intensive

**Every 15 minutes:**
- [ ] Check error count (target: 0)
- [ ] Verify no new error patterns
- [ ] Confirm LCP < 2.5s
- [ ] Check API response times

**Log entries (timestamp: metric: status):**
- 09:15 | Errors: 0 | LCP: 2.1s | Status: ✅
- 09:30 | Errors: 0 | LCP: 2.2s | Status: ✅
- 09:45 | Errors: 0 | LCP: 2.1s | Status: ✅
- 10:00 | Errors: 0 | LCP: 2.0s | Status: ✅

### Afternoon Monitoring (1:00 PM - 6:00 PM) — Hourly

- [ ] 1:00 PM | Status: ✅
- [ ] 2:00 PM | Status: ✅
- [ ] 3:00 PM | Status: ✅
- [ ] 4:00 PM | Status: ✅
- [ ] 5:00 PM | Status: ✅
- [ ] 6:00 PM | Status: ✅ → Ready for next phase

### Evening Review (6:00 PM)

**Checklist:**
- [ ] 8-hour window completed
- [ ] Total error count: _____ (target: < 2)
- [ ] No P1/P2 errors reported
- [ ] Performance metrics stable
- [ ] Users reporting normal experience
- [ ] Feature adoption tracking

**Decision for next phase:**
- [ ] ✅ **APPROVED** → Proceed to 50% Saturday morning
- [ ] ⚠️ **INVESTIGATE** → Hold at 25%, increase monitoring
- [ ] ❌ **ROLLBACK** → Issue found, revert to 10%

---

## 🟢 Day 4 (Saturday): Ramp to 50%

### Pre-Deployment (9:00 AM)

**Checklist:**
- [ ] Review 25% metrics (last 24h)
  - [ ] Error count: _____ (target: < 2)
  - [ ] P1 errors: _____ (target: 0)
  - [ ] LCP: _____ (target: < 2.5s)
  - [ ] API latency p95: _____ (target: < 500ms)
  - [ ] Database queries p95: _____ (target: < 200ms)
- [ ] Team standup
- [ ] Check concurrent user load: ~100 users expected
- [ ] Database connection pool healthy
- [ ] Cache hit rates > 80%

**Decision:**
- [ ] **APPROVED** to proceed with 50% ramp
- [ ] **HOLD** for further investigation
- [ ] **ROLLBACK** to 10%

### Deployment (9:30 AM)

**Steps:**
1. [ ] Update feature flag:
   ```typescript
   const canaryPercent = 50  // Updated from 25
   ```

2. [ ] Deploy to production

3. [ ] Confirm deployment ✅

### Monitoring (10:00 AM - 2:00 PM) — Intensive

**Every 15 minutes (First 4 hours):**
- [ ] 10:00 | Errors: ___ | LCP: ___ | Status: ✅
- [ ] 10:15 | Errors: ___ | LCP: ___ | Status: ✅
- [ ] 10:30 | Errors: ___ | LCP: ___ | Status: ✅
- [ ] 10:45 | Errors: ___ | LCP: ___ | Status: ✅
- [ ] 11:00 | Errors: ___ | LCP: ___ | Status: ✅
- [ ] 11:15 | Errors: ___ | LCP: ___ | Status: ✅
- [ ] 11:30 | Errors: ___ | LCP: ___ | Status: ✅
- [ ] 11:45 | Errors: ___ | LCP: ___ | Status: ✅
- [ ] 12:00 | Errors: ___ | LCP: ___ | Status: ✅
- [ ] 12:15 | Errors: ___ | LCP: ___ | Status: ✅
- [ ] 12:30 | Errors: ___ | LCP: ___ | Status: ✅
- [ ] 12:45 | Errors: ___ | LCP: ___ | Status: ✅
- [ ] 1:00 | Errors: ___ | LCP: ___ | Status: ✅
- [ ] 1:15 | Errors: ___ | LCP: ___ | Status: ✅
- [ ] 1:30 | Errors: ___ | LCP: ___ | Status: ✅
- [ ] 1:45 | Errors: ___ | LCP: ___ | Status: ✅

### Day Check-in (2:00 PM)

**Status Review:**
- [ ] 4-hour window: All metrics green
- [ ] No issues detected
- [ ] Ready to go to hourly monitoring

### Afternoon/Evening (Every hour)

- [ ] 3:00 PM | Status: ✅
- [ ] 4:00 PM | Status: ✅
- [ ] 5:00 PM | Status: ✅
- [ ] 6:00 PM | Status: ✅
- [ ] 7:00 PM | Status: ✅
- [ ] 8:00 PM | Status: ✅
- [ ] 9:00 PM | Status: ✅
- [ ] 10:00 PM | Status: ✅
- [ ] (Overnight: Automated monitoring)

### Day 4 Summary

**24-hour window:**
- [ ] Error count: _____ (target: < 2)
- [ ] P1 errors: _____ (target: 0)
- [ ] Feature adoption: _____ % (target: > 5%)
- [ ] User feedback: _____ (positive/neutral/negative)

**Decision:**
- [ ] ✅ **APPROVED** → Proceed to 75% Sunday morning
- [ ] ⚠️ **INVESTIGATE** → Hold at 50%
- [ ] ❌ **ROLLBACK** → Issue found

---

## 🟡 Day 5 (Sunday): Ramp to 75%

### Pre-Deployment (9:00 AM)

**Checklist:**
- [ ] Review 50% metrics (last 24h)
- [ ] Verify all success criteria
- [ ] Check system capacity for 75% traffic
- [ ] Estimated concurrent users: ~150
- [ ] Database prepared

**Decision:**
- [ ] **APPROVED** → 75% ramp
- [ ] **HOLD** → More investigation needed
- [ ] **ROLLBACK** → Issue detected

### Deployment (9:30 AM)

**Steps:**
1. [ ] Update feature flag:
   ```typescript
   const canaryPercent = 75  // Updated from 50
   ```

2. [ ] Deploy to production

3. [ ] Confirm deployment ✅

### Monitoring (10:00 AM - 2:00 PM) — Intensive

**Every 15 minutes (First 4 hours):**
- 10:00 ✅ | 10:15 ✅ | 10:30 ✅ | 10:45 ✅
- 11:00 ✅ | 11:15 ✅ | 11:30 ✅ | 11:45 ✅
- 12:00 ✅ | 12:15 ✅ | 12:30 ✅ | 12:45 ✅
- 1:00 ✅ | 1:15 ✅ | 1:30 ✅ | 1:45 ✅

### Afternoon/Evening (Every hour)

- [ ] 3:00 PM ✅
- [ ] 4:00 PM ✅
- [ ] 5:00 PM ✅
- [ ] 6:00 PM ✅
- [ ] 7:00 PM ✅
- [ ] 8:00 PM ✅
- [ ] 9:00 PM ✅
- [ ] 10:00 PM ✅

### Day 5 Summary

**24-hour window:**
- [ ] Error count: _____
- [ ] P1 errors: _____
- [ ] Performance: Stable
- [ ] Ready for 100%?

**Decision:**
- [ ] ✅ **APPROVED** → Proceed to 100% Monday midnight
- [ ] ⚠️ **INVESTIGATE** → Hold at 75%
- [ ] ❌ **ROLLBACK** → Issue found

---

## 🔴 Day 6 (Monday): 100% Rollout

### Pre-Deployment (11:00 PM Sunday)

**Final Checklist:**
- [ ] 72-hour canary + ramp window reviewed
- [ ] All metrics passing
- [ ] No P1/P2 errors
- [ ] Database capacity confirmed
- [ ] On-call engineer available 24/7
- [ ] War room Zoom link ready
- [ ] Rollback procedure verified

**Decision:**
- [ ] ✅ **GO** → Full 100% rollout
- [ ] ❌ **NO-GO** → Hold for additional testing

### Deployment (Midnight Monday)

**Steps:**
1. [ ] Update feature flag to 100%:
   ```typescript
   const canaryPercent = 100  // OR remove check entirely
   ```

2. [ ] Deploy to production

3. [ ] Verify:
   - [ ] All users see new AdminWorkBench
   - [ ] No revert to legacy
   - [ ] Navigation working

### Real-Time Monitoring (First 8 hours: 12 AM - 8 AM)

**Every 15 minutes:**
- 12:15 | Errors: ___ | Status: ✅
- 12:30 | Errors: ___ | Status: ✅
- 12:45 | Errors: ___ | Status: ✅
- 1:00 | Errors: ___ | Status: ✅
- 1:15 | Errors: ___ | Status: ✅
- (Continue every 15 min through 8 AM)

**Critical checks:**
- [ ] No spike in error rate
- [ ] LCP remains stable
- [ ] API response times normal
- [ ] Database connections healthy
- [ ] No timeout errors

### Morning Standup (9:00 AM Monday)

**Review:**
- [ ] 8-hour 100% traffic window
- [ ] Error count: _____ (target: < 1)
- [ ] Performance metrics: _____
- [ ] User reports: _____

**Decision:**
- [ ] ✅ **Stable** → Continue hourly monitoring
- [ ] ⚠️ **Investigate** → Issue detected
- [ ] ❌ **Rollback** → Critical issue

### 24-48h Monitoring (Monday 9 AM - Tuesday 9 AM)

**Every hour:**
- [ ] 10:00 AM ✅
- [ ] 11:00 AM ✅
- [ ] 12:00 PM ✅
- [ ] (Continue hourly)
- [ ] 8:00 AM Tuesday ✅
- [ ] 9:00 AM Tuesday ✅

### 48-72h Monitoring (Tuesday - Wednesday Morning)

**Every 2-4 hours:**
- [ ] Tuesday 1:00 PM ✅
- [ ] Tuesday 5:00 PM ✅
- [ ] Tuesday 9:00 PM ✅
- [ ] Tuesday 1:00 AM ✅
- [ ] Wednesday 9:00 AM ✅

---

## ✅ Day 7-8 (Tuesday-Wednesday): 72h Stabilization Validation

### 72-Hour Window Complete (Wednesday 9:00 AM)

**Final Validation:**

```
ERROR METRICS:
✅ Total errors: _____ (target: < 5)
✅ P1 errors: _____ (target: 0)
✅ Error rate: _____ % (target: < 0.1%)

PERFORMANCE:
✅ LCP: _____ s (target: 2.0-2.3s)
✅ API p95: _____ ms (target: < 500ms)
✅ DB p95: _____ ms (target: < 200ms)

RELIABILITY:
✅ Uptime: _____ % (target: > 99.9%)
✅ No timeout errors
✅ No DB connection issues

ADOPTION:
✅ Feature adoption: _____ % (target: > 98%)
✅ User satisfaction: _____ (target: positive)
```

### Rollout Validation

**Mark SUCCESS if all ✅:**
- [ ] ✅ 72h with < 5 total errors
- [ ] ✅ 0 P1/P2 errors during 100% rollout
- [ ] ✅ Performance metrics stable
- [ ] ✅ No user escalations
- [ ] ✅ > 98% users on new dashboard
- [ ] ✅ Positive feedback

**Then proceed to CLEANUP:**
→ Day 8: Legacy Code Removal

### Day 8: Code Cleanup & Finalization

**Steps:**
1. [ ] Delete legacy dashboard code:
   ```bash
   rm -rf src/app/admin/users/legacy/ExecutiveDashboardTab.tsx
   rm -rf src/app/admin/users/legacy/
   ```

2. [ ] Update routing:
   ```typescript
   // src/app/admin/users/page.tsx
   // Change from ExecutiveDashboardTabWrapper
   // To direct AdminWorkBench import
   import AdminWorkBench from './AdminWorkBench'
   export default AdminWorkBench
   ```

3. [ ] Remove feature flag check:
   ```bash
   # Option A: Delete useAdminWorkBenchFeature hook
   # Option B: Keep as dead code for 2 weeks safety
   ```

4. [ ] Final tests:
   ```bash
   npm run test:thresholds
   npm run build
   npm run lint
   ```

5. [ ] Commit cleanup:
   ```bash
   git add .
   git commit -m "feat: finalize adminWorkBench rollout, remove legacy code"
   git push origin main
   ```

6. [ ] Deploy final version:
   ```bash
   vercel deploy --prod
   ```

7. [ ] Documentation updates:
   - [ ] Update README.md
   - [ ] Archive old guides
   - [ ] Create post-rollout report

---

## 📊 Metrics Template for Each Phase

### Metrics Tracking Sheet

```
DATE: ____________
TRAFFIC LEVEL: _______
WINDOW: Start _____ End _____

ERROR METRICS:
Total Errors: _____
P1 Errors: _____
P2 Errors: _____
Error Rate: _____%
New Error Patterns: ☐ Yes ☐ No

PERFORMANCE:
LCP (ms): _____
FCP (ms): _____
CLS: _____
TTI (ms): _____
API p95 (ms): _____
DB p95 (ms): _____

RELIABILITY:
Uptime: _____%
Timeout Errors: _____
DB Connection Errors: _____
Memory Leaks: ☐ Detected ☐ None

ADOPTION:
Feature Usage: _____%
Concurrent Users: ~_____
New User Reports: _____

NOTES:
_____________________
_____________________
_____________________

STATUS: ☐ ✅ All Green  ☐ ⚠️ Investigating  ☐ ❌ Rollback Needed
```

---

## 🎯 Summary & Decision Points

| Phase | Traffic | Hours | Success? | Next Action |
|-------|---------|-------|----------|-------------|
| Canary | 10% | 48 | ☐ Yes | → 25% ramp |
| Ramp 1 | 25% | 24 | ☐ Yes | → 50% ramp |
| Ramp 2 | 50% | 24 | ☐ Yes | → 75% ramp |
| Ramp 3 | 75% | 24 | ☐ Yes | → 100% |
| 100% | 100% | 72 | ☐ Yes | → Cleanup |

---

**Document Version:** 1.0  
**Last Updated:** February 2025  
**Status:** 🟢 Ready for Execution
