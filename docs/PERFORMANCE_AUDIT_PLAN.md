# AdminWorkBench Performance Audit & Optimization Plan

**Phase:** 7.4 - Performance Audit  
**Target:** Lighthouse > 90 (desktop), > 80 (mobile)  
**Key Metrics:** LCP < 2.5s, FCP < 1.5s, CLS < 0.1  
**Estimated Time:** 4-6 hours

---

## 🎯 Performance Targets

### Lighthouse Scores
- **Desktop:** > 90/100
- **Mobile:** > 80/100
- **All Categories:** > 85/100

### Web Vitals
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| LCP (Largest Contentful Paint) | < 2.5s | TBD | 🔄 |
| FCP (First Contentful Paint) | < 1.5s | TBD | 🔄 |
| CLS (Cumulative Layout Shift) | < 0.1 | TBD | 🔄 |
| TTFB (Time to First Byte) | < 600ms | TBD | 🔄 |
| TTI (Time to Interactive) | < 3.5s | TBD | 🔄 |

### Page Load Performance
- First page load: < 3.5s (on 4G)
- Subsequent loads: < 2.0s (with caching)
- API response time: < 500ms
- Builder.io content fetch: < 500ms

---

## 🔍 Audit Methodology

### Step 1: Baseline Measurement

```bash
# Run Lighthouse audit
npm run lighthouse -- /admin/users

# Or use Chrome DevTools:
# 1. Open DevTools (F12)
# 2. Go to Lighthouse tab
# 3. Click "Generate report"
# 4. Analyze results
```

### Step 2: Identify Issues

Run audit with filters:
- Throttling: "Simulated fast 4G"
- CPU throttling: "4x slowdown"
- Mobile device: "Moto G4"

### Step 3: Categorize Issues

Group by impact:
- **Critical:** LCP or CLS issues
- **High:** Images, JavaScript, CSS
- **Medium:** Unused code, optimization
- **Low:** Best practices

### Step 4: Implement Fixes

Address by priority, measure, and verify improvements.

---

## 📊 Performance Audit Checklist

### JavaScript Performance
- [ ] Check bundle size
  ```bash
  npm run build
  # Analyze output in .next/static/
  ```
- [ ] Verify code splitting
- [ ] No unused JavaScript
- [ ] Minification enabled
- [ ] Async/defer attributes on scripts
- [ ] React is production build

### CSS Performance
- [ ] No unused CSS
- [ ] CSS minified
- [ ] CSS-in-JS optimized
- [ ] Critical CSS inlined
- [ ] Font loading optimized

### Image Optimization
- [ ] All images optimized (WebP)
- [ ] Responsive images (srcset)
- [ ] Lazy loading enabled
- [ ] Appropriate sizing
- [ ] SVG sprites where applicable

### Caching Strategy
- [ ] Browser caching configured
- [ ] CDN caching optimized
- [ ] Service Worker (if applicable)
- [ ] Static assets cached
- [ ] API responses cached (React Query)

### Rendering Performance
- [ ] No Cumulative Layout Shift (CLS)
- [ ] Smooth scrolling (60fps)
- [ ] Paint operations minimized
- [ ] DOM size reasonable (< 1500 nodes)
- [ ] Fonts loading optimized

### Network Performance
- [ ] HTTP/2 enabled
- [ ] Gzip compression enabled
- [ ] Cookie optimization
- [ ] No render-blocking resources
- [ ] Preconnect to external domains

---

## 🧪 Performance Testing Tools

### Built-in Tools
- **Chrome DevTools Lighthouse:** F12 → Lighthouse tab
- **Chrome DevTools Performance:** F12 → Performance tab
- **Chrome DevTools Network:** F12 → Network tab

### External Tools
- **PageSpeed Insights:** https://pagespeed.web.dev/
- **WebPageTest:** https://www.webpagetest.org/
- **GTmetrix:** https://gtmetrix.com/
- **Lighthouse CLI:** `npm install -g lighthouse`

### Monitoring Tools
- **Google Analytics:** Web Vitals tracking
- **Sentry:** Performance monitoring
- **New Relic:** Full stack monitoring
- **Datadog:** Real user monitoring

---

## 📈 Performance Monitoring

### Setup Google Analytics 4 Web Vitals

```javascript
// pages/_app.tsx
import { getCLS, getFCP, getLCP, getINP, getTTFB } from 'web-vitals'

export function reportWebVitals(metric: any) {
  if (window.gtag) {
    gtag.event(metric.name, {
      value: Math.round(metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    })
  }
}

getCLS(reportWebVitals)
getFCP(reportWebVitals)
getLCP(reportWebVitals)
getINP(reportWebVitals)
getTTFB(reportWebVitals)
```

### Setup Sentry Performance Monitoring

```javascript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: 0.1,
})
```

---

## 🚀 Performance Optimization Checklist

### Already Implemented
- [x] React virtualization (react-window) for large tables
- [x] Code splitting (dynamic imports)
- [x] Image optimization (next/image)
- [x] CSS minification
- [x] Production builds
- [x] React Query caching

### To Verify
- [ ] Builder.io content cached (5min default)
- [ ] API responses cached appropriately
- [ ] Lazy loading for images
- [ ] Preload critical resources
- [ ] Font loading strategy optimized

### To Implement (if needed)
- [ ] Service Worker for offline support
- [ ] HTTP/2 Server Push
- [ ] Critical CSS inlining
- [ ] WebP image format
- [ ] Static generation (SSG) where possible

---

## 📋 Test Scenarios

### Scenario 1: Cold Load (First Visit)

**Network:** Simulated Fast 4G  
**Device:** Moto G4  
**Cache:** Empty

```bash
# Test:
1. Clear browser cache (DevTools → Storage → Clear all)
2. Run Lighthouse audit
3. Record metrics:
   - FCP: ___ ms
   - LCP: ___ ms
   - CLS: ___
   - TTI: ___ ms
   - Lighthouse: ___ /100
```

**Expected:**
- LCP < 2.5s
- FCP < 1.5s
- Lighthouse > 80 (mobile) / 90 (desktop)

### Scenario 2: Warm Load (Repeat Visit)

**Network:** Fast 4G (with cache)  
**Cache:** Primed

```bash
# Test:
1. Visit page once to prime cache
2. Run Lighthouse audit again
3. Compare metrics to cold load
```

**Expected:**
- 30-50% faster than cold load
- LCP < 2.0s
- Lighthouse > 85

### Scenario 3: Slow Network (3G)

**Network:** Simulated Slow 3G  
**Device:** Mobile

```bash
# Test:
1. DevTools → Network → Throttle to "Slow 3G"
2. Reload page
3. Record load time
```

**Expected:**
- Page still loads within 5s
- Core functionality available
- Not blocked by non-critical resources

### Scenario 4: Large User List

**Data:** 10,000+ users  
**Action:** Scroll through list

```bash
# Test:
1. Seed database with 10,000 users
2. Navigate to /admin/users
3. Scroll rapidly through list
4. Check DevTools Performance tab

Expected:
- Smooth scrolling (60fps)
- No jank or stuttering
- Memory usage stable
```

---

## 🔧 Common Performance Issues & Fixes

### Issue: High LCP

**Cause:** Large image or slow server response  
**Fixes:**
- Optimize images with Next.js
- Preconnect to CDN
- Increase server capacity
- Implement caching

### Issue: High CLS

**Cause:** Fonts, images, or layout changes after load  
**Fixes:**
- Add `width` and `height` to images
- Use `font-display: swap` for fonts
- Reserve space for dynamic content
- Avoid inserting content above fold

### Issue: High TTI

**Cause:** Large JavaScript bundle  
**Fixes:**
- Code splitting
- Tree shaking
- Remove unused libraries
- Lazy load non-critical JS

### Issue: Slow API Responses

**Cause:** Unoptimized queries or server load  
**Fixes:**
- Add database indexes
- Implement pagination
- Cache responses
- Optimize query logic

---

## 📊 Performance Report Template

```markdown
# AdminWorkBench Performance Audit Report

**Date:** [DATE]  
**Device:** Desktop / Mobile  
**Network:** Fast 4G / 3G  
**Auditor:** [NAME]

## Lighthouse Results
- **Overall Score:** ___ /100
- **Performance:** ___ /100
- **Accessibility:** ___ /100
- **Best Practices:** ___ /100
- **SEO:** ___ /100

## Web Vitals
- **LCP:** ___ ms (Target: < 2500ms) [✓/✗]
- **FCP:** ___ ms (Target: < 1500ms) [✓/✗]
- **CLS:** ___ (Target: < 0.1) [✓/✗]
- **TTFB:** ___ ms (Target: < 600ms) [✓/✗]
- **TTI:** ___ ms (Target: < 3500ms) [✓/✗]

## Issues Found

### Critical (Performance < 80)
1. [Issue] - Impact: [Description]
   - Fix: [Recommended solution]

### High (Performance 80-90)
1. [Issue]
   - Fix: [Recommended solution]

### Medium
1. [Issue]
   - Fix: [Recommended solution]

## Recommendations
1. [Optimization 1] - Expected impact: +5pts
2. [Optimization 2] - Expected impact: +3pts

## Sign-Off
- [ ] Performance audit complete
- [ ] All critical issues identified
- [ ] Optimization plan created
- [ ] Ready for Phase 8

**Signed:** ________________ **Date:** ________
```

---

## 🎯 Performance Monitoring Strategy

### Real User Monitoring (RUM)

Track in production:
- Actual user page load times
- Web Vitals from real users
- Error rates and exceptions
- API performance

### Synthetic Monitoring

Regular automated checks:
- Hourly Lighthouse audits
- API endpoint monitoring
- 3G network simulation
- Performance degradation alerts

### Alerting

Configure alerts for:
- LCP > 3s
- FCP > 2s
- Error rate > 1%
- API response > 1s
- 404 errors

---

## 📚 Resources

### Performance Documentation
- [Web.dev Performance Guide](https://web.dev/performance/)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [React Performance](https://react.dev/reference/react/useMemo)
- [MDN Performance](https://developer.mozilla.org/en-US/docs/Web/Performance)

### Tools & Services
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [WebPageTest API](https://www.webpagetest.org/api/)
- [Sentry Performance](https://docs.sentry.io/product/performance/)

---

## ✅ Phase 7.4 Completion Checklist

- [ ] Lighthouse baseline measured (desktop & mobile)
- [ ] Web Vitals metrics recorded
- [ ] Performance issues identified
- [ ] Critical issues > 10pts impact documented
- [ ] Optimization recommendations created
- [ ] Performance monitoring configured
- [ ] Report completed
- [ ] Optimization plan for Phase 8

---

**Next Steps:**
1. Run Lighthouse audit on /admin/users
2. Record baseline metrics
3. Identify top 3 optimization opportunities
4. Implement quick wins (< 2 hours)
5. Retest and measure improvements
6. Document results
7. Proceed to Phase 8: Monitoring & Rollout

