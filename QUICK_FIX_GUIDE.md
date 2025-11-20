# Quick Fix Guide - 500 API Errors

## 🚨 Problem
All API endpoints returning 500 errors on Vercel (taxhub-one.vercel.app)

## ⚡ Quick Fix (3 Steps)

### **Step 1: Configure Vercel Environment Variables** (2 minutes)

1. Go to https://vercel.com/dashboard
2. Select your "taxhub-one" project
3. Click **Settings** → **Environment Variables**
4. Verify or add these variables:

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | Your PostgreSQL connection string | ✅ YES |
| `FROM_EMAIL` | e.g., `noreply@company.com` | ✅ YES |
| `NEXTAUTH_SECRET` | Generate: `openssl rand -base64 32` | ⚠️ Recommended |
| `NEXTAUTH_URL` | e.g., `https://taxhub-one.vercel.app` | ⚠️ Recommended |

**Getting your DATABASE_URL:**
- **Neon:** Go to neon.tech → Project → Connection String (Use "Pooler" for better performance)
- **Supabase:** Go to supabase.com → Project → Settings → Database → Connection String

5. Click **Save**

### **Step 2: Redeploy on Vercel** (5-10 minutes)

1. Still in Vercel Dashboard, click **Deployments** tab
2. Click the three dots on the latest deployment
3. Select **Redeploy**
4. Wait for build to complete (watch the logs)

**Expected build output:**
```
✅ Prisma client generated
✅ Database migrations applied
✅ Build completed
✅ Deployed
```

### **Step 3: Verify the Fix** (1 minute)

Test the health endpoint:

```bash
# Option A: Using curl
curl https://taxhub-one.vercel.app/api/health/comprehensive

# Option B: Using the test script (from local terminal)
bash scripts/test-api-health.sh https://taxhub-one.vercel.app

# Option C: Open in browser
https://taxhub-one.vercel.app/api/health/comprehensive
```

**Expected response:**
```json
{
  "status": "healthy",
  "checks": {
    "prisma": { "status": "healthy" },
    "database": { "status": "healthy" },
    "environment": { "status": "healthy" }
  }
}
```

---

## ✅ All Fixed?

If you see `"status": "healthy"` - **You're done! 🎉**

Try accessing:
- `/api/entities` → should work now
- `/api/documents` → should work now
- `/api/billing/invoices` → should work now
- All other endpoints → should work now

---

## ❌ Still Seeing 500 Errors?

### **Problem: Redeploy didn't help**

**Solution: Check the build logs**

1. Go to Vercel Dashboard → Deployments
2. Click on the latest deployment
3. Scroll down to **Build & Deployments**
4. Look for errors with 🔴 or ❌

**Common errors and fixes:**

| Error | Fix |
|-------|-----|
| `DATABASE_URL not set` | Add DATABASE_URL in Environment Variables (Step 1) |
| `Cannot reach database server` | Verify connection string is correct |
| `P1000: Authentication failed` | Check database credentials |
| `Migration engine error` | Try manual migration: `DATABASE_URL="..." pnpm db:migrate` |

### **Problem: DATABASE_URL looks correct but still fails**

**Solution: Test the connection**

From your local terminal:
```bash
# Replace with your actual DATABASE_URL
DATABASE_URL="postgresql://user:pass@host/db" psql -c "SELECT 1"

# If that works, run migrations locally
DATABASE_URL="postgresql://user:pass@host/db" pnpm db:migrate

# Then redeploy on Vercel
```

### **Problem: Still stuck?**

**Get detailed diagnostics:**

1. Check comprehensive health endpoint:
   ```bash
   curl https://taxhub-one.vercel.app/api/health/comprehensive | jq '.checks'
   ```

2. Review Vercel function logs:
   - Dashboard → Settings → Functions Logs
   - Look for entries with `[API_ERROR]`

3. Check all environment variables:
   - Dashboard → Settings → Environment Variables
   - Verify all are set to the right values

---

## 📚 Detailed Guides

- **Full Deployment Guide:** `docs/VERCEL_DEPLOYMENT_GUIDE.md`
- **500 Error Fix Summary:** `docs/FIX_500_ERRORS_SUMMARY.md`
- **All API Tests:** `bash scripts/test-api-health.sh [URL]`

---

## 🎯 What Was Fixed

This code update includes:

1. **Health check endpoint** - `/api/health/comprehensive` for diagnostics
2. **Better error logging** - Clear error messages in production
3. **Automated migrations** - Database migrations run automatically during build
4. **Enhanced Prisma** - Better initialization and error handling

No code changes needed on your side - just follow the 3 steps above.

---

## ⏱️ Time Estimate

| Step | Time |
|------|------|
| Set environment variables | 2 min |
| Redeploy | 5-10 min |
| Verify | 1 min |
| **Total** | **10-15 min** |

---

## 💡 Pro Tips

1. **Bookmark the health endpoint** - Use it anytime to check system health
2. **Save DATABASE_URL** - You'll need it for other deployments
3. **Set NEXTAUTH_SECRET** - Generate once and save for consistency
4. **Check logs regularly** - Vercel logs can help debug future issues

---

## 🚀 After Everything Works

Test all features:
- Create a new entity/business setup
- Upload documents
- Create invoices
- View approvals and bills
- Send messages

If everything works - **deployment is successful! 🎉**

---

**Last Updated:** January 2025  
**For Latest Updates:** See `docs/VERCEL_DEPLOYMENT_GUIDE.md`
