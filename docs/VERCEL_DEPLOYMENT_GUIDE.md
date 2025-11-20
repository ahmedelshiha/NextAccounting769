# Vercel Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the TaxHub application to Vercel and troubleshooting common deployment issues.

---

## Prerequisites

- Vercel account (https://vercel.com)
- GitHub repository with the application code
- PostgreSQL database (e.g., Neon, Supabase)
- SendGrid API key (for email functionality)
- Sentry DSN (for error tracking)

---

## Step 1: Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Select **Import Git Repository**
4. Choose your GitHub repository
5. Click **Import**

---

## Step 2: Configure Environment Variables

Vercel will prompt you to add environment variables. Add **all required variables** from the following table:

### **REQUIRED Variables** (Deployment will fail without these)

| Variable | Value | Example |
|----------|-------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `FROM_EMAIL` | Sender email for notifications | `noreply@company.com` |

### **Recommended Variables** (For full functionality)

| Variable | Value | Example |
|----------|-------|---------|
| `NEXTAUTH_SECRET` | NextAuth secret key (generate: `openssl rand -base64 32`) | `abc123...` |
| `NEXTAUTH_URL` | Application URL | `https://taxhub-one.vercel.app` |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error tracking | `https://key@sentry.io/123456` |
| `SENDGRID_API_KEY` | SendGrid email API key | `SG.abc123...` |
| `SENTRY_AUTH_TOKEN` | Sentry authentication token | `sntrys_...` |

### **Optional Variables**

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` (auto-set by Vercel) |
| `LOG_ADMIN_ACCESS` | `true` |
| `ENABLE_IP_RESTRICTIONS` | `false` |

---

## Step 3: Configure Build Settings

1. In the **Build & Development Settings**, ensure:
   - **Framework Preset**: `Next.js`
   - **Build Command**: `bash scripts/vercel-build.sh` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

2. Click **Deploy**

---

## Step 4: Wait for Build and Deployment

Vercel will:
1. Install dependencies (`pnpm install`)
2. Run the build script (`bash scripts/vercel-build.sh`)
3. This will:
   - Generate Prisma client
   - Run database migrations
   - Build the application
   - Deploy to Vercel's CDN

**Build time**: 3-5 minutes

---

## Troubleshooting 500 Errors

### **Issue: All API endpoints return 500 errors**

#### **Root Causes**

1. **Database URL not configured**
   - Check Vercel project settings
   - Verify `DATABASE_URL` or `NETLIFY_DATABASE_URL` is set

2. **Database migrations not applied**
   - The build script automatically runs migrations
   - If migrations fail, check the Vercel build logs

3. **Prisma client not generated**
   - Build script regenerates the Prisma client
   - If generation fails, check for schema errors

4. **Database connection failing**
   - Test database connectivity
   - Check IP allowlists (especially for Neon)

#### **Diagnostic Steps**

1. **Check Vercel Build Logs**
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on the latest deployment
   - Review the build output for errors

2. **Test the Health Check Endpoint**
   ```bash
   curl https://taxhub-one.vercel.app/api/health/comprehensive
   ```
   Response example:
   ```json
   {
     "status": "healthy",
     "timestamp": "2025-01-01T00:00:00Z",
     "checks": {
       "prisma": { "status": "healthy", "responseTime": 150 },
       "database": { "status": "healthy", "responseTime": 200 },
       "environment": { "status": "healthy" }
     }
   }
   ```

3. **Check Environment Variables**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Verify all required variables are set
   - For sensitive values, only "Set" status is shown

4. **View Function Logs**
   - Go to Vercel Dashboard → Settings → Functions Logs
   - Look for error messages starting with `[API_ERROR]`

5. **Check Database Accessibility**
   - From your local terminal:
     ```bash
     psql $DATABASE_URL -c "SELECT 1"
     ```
   - Connection should succeed

---

## Common Issues and Fixes

### **Issue 1: "Database is not configured"**

**Error Message:**
```
Error: Database is not configured. Set NETLIFY_DATABASE_URL or DATABASE_URL to enable DB features.
```

**Fix:**
1. Go to Vercel project Settings → Environment Variables
2. Add `DATABASE_URL` with your PostgreSQL connection string
3. Redeploy the project

**Note:** You can use either `DATABASE_URL` OR `NETLIFY_DATABASE_URL`, but at least one must be set.

---

### **Issue 2: "Cannot reach database server"**

**Error Message:**
```
P1001: Cannot reach database server at `[host]` did you forget to use a password?
```

**Fix:**
1. Verify database credentials in connection string
2. Check database server is running and accessible
3. For Neon: Enable public access or add Vercel IP to allowlist
4. Check firewall rules allow outbound connections on port 5432

---

### **Issue 3: "Authentication failed"**

**Error Message:**
```
P1000: Authentication failed against database server at `[host]`, the provided database credentials for `[user]` are not valid
```

**Fix:**
1. Double-check DATABASE_URL credentials
2. Test locally: `psql $DATABASE_URL -c "SELECT 1"`
3. Re-create the connection string if needed
4. Update the variable in Vercel

---

### **Issue 4: Migrations fail during build**

**Error Message:**
```
Error: Migration engine request error: Connection timeout (os error Connection reset)
```

**Fix:**
1. Check database server is responsive
2. Increase connection timeout (set in DATABASE_URL)
3. Run migrations manually:
   ```bash
   # From local environment
   DATABASE_URL="your-db-url" pnpm db:migrate
   ```
4. After successful migration, redeploy on Vercel

---

### **Issue 5: Prisma client generation fails**

**Error Message:**
```
Error: Failed to generate Prisma Client due to schema parsing error
```

**Fix:**
1. Check Prisma schema syntax: `prisma/schema.prisma`
2. Validate schema locally: `pnpm db:generate`
3. Fix any schema errors
4. Commit and push changes
5. Vercel will automatically redeploy

---

## Manual Remediation Steps

If the automated build script encounters issues, follow these manual steps:

### **1. Run Migrations Manually**

```bash
# Get DATABASE_URL from Vercel settings
export DATABASE_URL="postgresql://..."

# Run migrations
pnpm db:migrate

# Check status
pnpm db:generate
```

### **2. Force Rebuild on Vercel**

1. Go to Vercel Dashboard → Your Project
2. Click on the latest deployment
3. Click **Redeploy**
4. Or use Vercel CLI: `vercel redeploy`

### **3. Check Database Directly**

```bash
# Connect to database
psql $DATABASE_URL

# Check tables exist
\dt

# Verify migrations table
SELECT * FROM "_prisma_migrations";
```

---

## Performance Optimization

### **Connection Pooling**

For better performance, use a connection pool:

1. With Neon: Use the pooler connection string instead of direct connection
2. Update DATABASE_URL to use the pooler endpoint
3. Pooler connection string format:
   ```
   postgresql://user:password@host-pooler.neon.tech/database?sslmode=require&channel_binding=require
   ```

### **Regional Deployment**

Vercel automatically selects optimal region. To prefer a specific region:

1. Edit `vercel.json`
2. Update the `regions` array:
   ```json
   {
     "regions": ["iad1", "sfo1", "lhr1"]
   }
   ```
3. Redeploy

---

## Monitoring and Maintenance

### **Enable Monitoring**

1. **Vercel Analytics**
   - Automatically enabled for all projects
   - Monitor performance and usage

2. **Sentry Integration**
   - Configure Sentry for error tracking
   - Set `SENTRY_AUTH_TOKEN` for source maps
   - Errors automatically reported from production

3. **Database Monitoring**
   - Neon: Dashboard shows connection metrics
   - Monitor slow queries and connection count

### **Regular Checks**

- Weekly: Review Vercel deployment logs for errors
- Weekly: Check Sentry for new issues
- Monthly: Verify database performance metrics
- Monthly: Review environment variable expiration dates

---

## Rollback Procedure

If a deployment introduces issues:

1. **Go to Vercel Dashboard** → Your Project → Deployments
2. Find the last known good deployment
3. Click on it
4. Click **Promote to Production**

This reverts to the previous version without rebuilding.

---

## Getting Help

### **Vercel Support**

- Documentation: https://vercel.com/docs
- Status: https://vercel.status.com
- Support: https://vercel.com/support

### **Database Support**

**Neon:**
- Dashboard: https://console.neon.tech
- Documentation: https://neon.tech/docs
- Support: https://neon.tech/contact

**Supabase:**
- Dashboard: https://supabase.com/dashboard
- Documentation: https://supabase.com/docs
- Support: https://supabase.com/support

### **Application Support**

- Check `docs/DEPLOYMENT.md` for general deployment info
- Review server logs: Vercel Dashboard → Functions Logs
- Test health endpoint: `https://your-domain.com/api/health/comprehensive`

---

## Quick Reference

### **Environment Variable Checklist**

- [ ] `DATABASE_URL` is set and valid
- [ ] `FROM_EMAIL` is configured
- [ ] `NEXTAUTH_SECRET` is set (if using authentication)
- [ ] `NEXTAUTH_URL` matches your domain
- [ ] `SENTRY_DSN` is configured (optional)
- [ ] `SENDGRID_API_KEY` is set (if using email)

### **Post-Deployment Checklist**

- [ ] Application loads without errors
- [ ] API endpoints respond correctly
- [ ] Health check returns "healthy" status
- [ ] Database migrations have been applied
- [ ] Error tracking (Sentry) is receiving logs
- [ ] Email functionality works (if configured)

---

## Additional Resources

- [Next.js Deployment on Vercel](https://nextjs.org/learn-pages-router/basics/deploying-nextjs-app/deploy)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)
- [Neon PostgreSQL Connection Strings](https://neon.tech/docs/connect/connection-string)

---

*Last Updated: January 2025*  
*For latest updates, check the main README.md or DEPLOYMENT.md*
