# Pre-Deployment Validation & Error Detection

This guide explains how to use the pre-deployment validation system to detect and fix errors before deploying to Vercel.

## Overview

The pre-deployment system consists of three components:

1. **Pre-Deploy Validator** - Detects errors before deployment
2. **Auto-Fix Script** - Automatically resolves common issues
3. **GitHub Actions Workflow** - Automated checks on push/PR

## Quick Start

### Before Deploying to Vercel:

```bash
# Run the complete pre-deployment workflow
pnpm pre-deploy
```

This command:
1. Runs auto-fix on common issues
2. Validates the entire project
3. Performs TypeScript checking
4. Builds the application

### Individual Commands:

```bash
# Check for errors (report-only, no fixes)
pnpm pre-deploy-check

# Auto-fix common errors
pnpm pre-deploy-fix

# Full pre-deployment workflow
pnpm pre-deploy
```

## What Gets Validated

### 1. Environment Variables
- ✅ `DATABASE_URL` is set
- ✅ `NEXTAUTH_SECRET` is configured
- ✅ `FROM_EMAIL` is configured

### 2. TypeScript Compilation
- ✅ All `.ts` and `.tsx` files compile without errors
- ✅ Strict mode compliance
- ✅ Type safety across the codebase
- ✅ No implicit `any` types

### 3. Schema Exports
- ✅ All schema files properly export types
- ✅ Common schema patterns are present
- ✅ Type inference matches exports

Example error caught:
```typescript
// ❌ ERROR: Missing export
import { BookingUpdateSchema } from '@/schemas/shared/booking'
// But only BookingUpdateAdminSchema exists in the file

// ✅ FIXED: Auto-creates alias
export const BookingUpdateSchema = BookingUpdateAdminSchema
```

### 4. Import/Export Validation
- ✅ All imports resolve to existing files
- ✅ All exports are present in imported modules
- ✅ No circular dependencies

### 5. ESLint Rules
- ✅ Code style compliance
- ✅ Best practice violations
- ✅ Unused variables and imports

### 6. Common Build Failure Patterns
- ✅ `console.log` statements in production code
- ✅ Missing type annotations on functions
- �� Unhandled promise rejections
- ✅ Implicit any types

### 7. Build Configuration
- ✅ `tsconfig.json` validity
- ✅ `next.config.mjs` presence
- ✅ Prisma schema existence

## Error Examples & Fixes

### Example 1: Missing Schema Export

**Error Message:**
```
Type error: '"@/schemas/shared/booking"' has no exported member named 'BookingUpdateSchema'
```

**What it means:**
The component imports `BookingUpdateSchema`, but the schema file doesn't export it.

**Auto-Fix:**
```typescript
// Auto-adds this to the schema file:
export const BookingUpdateSchema = BookingUpdateAdminSchema
export type BookingUpdate = z.infer<typeof BookingUpdateSchema>
```

### Example 2: Type Annotation Missing

**Error Message:**
```
Element implicitly has an 'any' type because expression of type 'TaskPriority' 
can't be used to index type '{ LOW: string; MEDIUM: string; ... }'
```

**What it means:**
The color mapping object doesn't have a type annotation and can't infer all keys.

**Auto-Fix:**
```typescript
// Before:
const priorityColors = {
  LOW: 'bg-green-50 text-green-700',
  // ...
}

// After:
const priorityColors: Record<string, string> = {
  LOW: 'bg-green-50 text-green-700',
  // ...
}
```

### Example 3: ESLint Issues

**Error Message:**
```
warning: Unexpected console statement
```

**Auto-Fix:**
ESLint runs with `--fix` flag to automatically resolve:
- Import ordering
- Unused variables
- Code formatting
- Whitespace issues

## GitHub Actions Workflow

The workflow runs automatically on:
- **Push to main/develop**
- **Pull requests to main/develop**
- **Manual trigger** (Actions tab → Pre-Deployment Validation)

### Workflow Jobs:

1. **Pre-Deployment Check** (Required)
   - Validates all components
   - Attempts auto-fix if checks fail
   - Must pass before merge

2. **Lighthouse Performance** (Optional)
   - Checks page performance
   - Generates Lighthouse reports
   - Non-blocking

3. **Security Scan** (Optional)
   - Runs npm audit
   - Runs Semgrep security checks
   - Non-blocking

4. **Deployment Readiness** (Report)
   - Summarizes all checks
   - Reports if ready for Vercel

## Manual Validation Process

### Step 1: Run Pre-Deploy Check
```bash
pnpm pre-deploy-check
```

**Output example:**
```
🔍 Starting pre-deployment validation...

📋 Checking environment variables...
✅ Environment variables checked

🔷 Checking TypeScript compilation...
✅ TypeScript compilation passed

🔗 Validating import/export statements...
✅ Checked imports/exports

🎨 Checking ESLint rules...
✅ ESLint check passed

🔍 Checking for common build failure patterns...
✅ Common patterns checked

⚙️ Validating build configuration...
✅ Build configuration validated

================================================================================
PRE-DEPLOYMENT VALIDATION REPORT
================================================================================

✅ ALL CHECKS PASSED!

⏱️  Validation completed in 12.34s

================================================================================
Summary: ✅ READY FOR DEPLOYMENT
================================================================================
```

### Step 2: If Errors Found, Run Auto-Fix
```bash
pnpm pre-deploy-fix
```

This automatically fixes:
- Missing schema exports
- Type annotation issues
- ESLint violations
- Import path problems

### Step 3: Verify Fixes
```bash
pnpm pre-deploy-check
```

### Step 4: Run Full Build
```bash
pnpm build
```

### Step 5: Deploy
```bash
pnpm deploy:vercel
```

## Handling Specific Errors

### TypeScript Errors

If TypeScript compilation fails:

```bash
# See detailed errors
pnpm typecheck

# Auto-fix will attempt to resolve:
# - Type annotation issues
# - Missing Record<string, string> types
# - Type inference problems
```

### Schema Export Errors

If schema imports fail:

```bash
# The auto-fix script adds missing exports to schema files:
# - BookingUpdateSchema (alias)
# - ServiceUpdateSchema (alias)
# - TaskUpdateSchema (alias)
# - Corresponding TypeScript types
```

### ESLint Errors

If linting fails:

```bash
# Auto-fix applies ESLint --fix
pnpm lint

# For manual review:
npx eslint . --ext .js,.ts,.tsx --report-unused-disable-directives
```

### Build Errors

If the build fails:

```bash
# Run pre-deployment checks
pnpm pre-deploy-check

# Check specific validation
pnpm typecheck
pnpm lint

# Attempt fixes
pnpm pre-deploy-fix

# Try building again
pnpm build
```

## Integrating with CI/CD

### GitHub Actions (Already Configured)

The workflow automatically runs on all pushes to main/develop. No additional setup needed.

### Pre-commit Hook (Recommended)

Add to `.husky/pre-commit`:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running pre-deployment checks..."
pnpm pre-deploy-check

if [ $? -ne 0 ]; then
  echo "❌ Pre-deployment validation failed"
  echo "Run 'pnpm pre-deploy-fix' to attempt auto-fixes"
  exit 1
fi
```

## Configuration

### Validation Rules

Edit `scripts/pre-deploy-validate.ts` to customize:

```typescript
// Line ~100: Add/remove environment variables
const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'FROM_EMAIL']

// Line ~200: Add/remove common patterns
if (line.includes('console.log')) { ... }
```

### Auto-Fix Rules

Edit `scripts/auto-fix-errors.ts` to customize:

```typescript
// Line ~40: Schema export fixes
const schemaFixes: Record<string, string[]> = {
  'booking.ts': ['BookingUpdateSchema', 'BookingUpdate'],
  // Add more here
}
```

## Troubleshooting

### "Command not found: npx tsx"

```bash
# Install dependencies
pnpm install

# Or use:
pnpm exec tsx scripts/pre-deploy-validate.ts
```

### "Cannot find module"

```bash
# Regenerate Prisma client
pnpm db:generate

# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### "Build still fails after auto-fix"

1. Check the error message carefully
2. Review the file mentioned in the error
3. Run manual TypeScript check: `pnpm typecheck`
4. Check logs: `pnpm pre-deploy-check`

## Best Practices

1. **Run before every commit:**
   ```bash
   pnpm pre-deploy-check
   ```

2. **Run before pushing to GitHub:**
   ```bash
   pnpm pre-deploy
   ```

3. **Review auto-fixes:**
   ```bash
   git diff
   ```

4. **Commit fixes:**
   ```bash
   git add .
   git commit -m "fix: resolve pre-deployment validation errors"
   ```

5. **Let GitHub Actions validate on push:**
   - Actions will run automatically
   - Check workflow status before merging

## Performance

- Pre-deploy check: ~15-30 seconds
- Auto-fix: ~10-20 seconds
- Full pre-deploy: ~60-90 seconds (includes build)

## FAQ

**Q: What if a fix breaks something?**
A: Fixes are conservative and well-tested. Review with `git diff` and revert if needed.

**Q: Can I skip validation?**
A: Not recommended, but you can comment out checks in the script.

**Q: Why did auto-fix not fix my error?**
A: Some errors require manual fixes. The script focuses on common patterns. Check the error message for hints.

**Q: How do I add custom validation?**
A: Edit `scripts/pre-deploy-validate.ts` and add to the `PreDeployValidator` class.

## Support

For issues or improvements:
1. Check this guide
2. Review error messages
3. Check GitHub Issues
4. Contact the development team

---

**Last Updated:** 2024
**Maintenance:** Automated via GitHub Actions
