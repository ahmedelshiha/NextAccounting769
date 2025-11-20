# Pre-Deploy Quick Reference

## Before Every Vercel Deployment

```bash
pnpm pre-deploy
```

This single command:
1. ✅ Auto-fixes common errors
2. ✅ Validates entire project
3. ✅ Type checks all files
4. ✅ Builds the application

**Time:** ~2-3 minutes

---

## Individual Commands

### Check for Errors (Report Only)
```bash
pnpm pre-deploy-check
```
- Shows all errors and warnings
- No changes made
- Lists suggestions for each issue
- **Time:** ~30 seconds

### Auto-Fix Issues
```bash
pnpm pre-deploy-fix
```
- Automatically fixes common problems
- Applies ESLint auto-fix
- Adds missing exports
- **Time:** ~20 seconds

### Full Workflow
```bash
pnpm pre-deploy
```
- Runs auto-fix
- Validates everything
- Type checks
- Builds
- **Time:** ~2-3 minutes

---

## Common Workflow

### Local Development

```bash
# 1. Make your changes
# 2. Before committing:
pnpm pre-deploy-check

# 3. If errors found, auto-fix them:
pnpm pre-deploy-fix

# 4. Review the changes:
git diff

# 5. Commit:
git add .
git commit -m "fix: resolve pre-deployment errors"

# 6. Push:
git push origin your-branch
```

### Before Pushing to Production

```bash
# Run full pre-deploy check
pnpm pre-deploy

# If all pass:
pnpm deploy:vercel

# Or push to trigger GitHub Actions
git push origin main
```

---

## What Gets Fixed Automatically

### ✅ Schema Exports
```typescript
// Auto-added if missing:
export const BookingUpdateSchema = BookingUpdateAdminSchema
export type BookingUpdate = z.infer<typeof BookingUpdateSchema>
```

### ✅ Type Annotations
```typescript
// Becomes:
const colors: Record<string, string> = { ... }
```

### ✅ ESLint Issues
- Code formatting
- Import ordering
- Unused variables
- Whitespace

---

## What Requires Manual Fix

| Issue | Action |
|-------|--------|
| Missing environment variables | Set in `.env` |
| Broken import paths | Update import statement |
| Logic errors | Review and fix code |
| Missing files | Create required files |
| Database issues | Check Prisma schema |

---

## Error Handling

### If validation fails:

```bash
# 1. See detailed error
pnpm pre-deploy-check

# 2. Try auto-fix
pnpm pre-deploy-fix

# 3. Check specific area
pnpm typecheck        # TypeScript
pnpm lint             # ESLint
pnpm build            # Build test

# 4. Fix manually if needed
# ... edit files ...

# 5. Validate again
pnpm pre-deploy-check
```

---

## Quick Fixes

### Missing Database URL
```bash
# Add to .env:
DATABASE_URL=postgresql://...
```

### TypeScript Errors
```bash
pnpm typecheck
# Check output for specific errors
```

### ESLint Errors
```bash
pnpm lint
# Auto-fixes most issues
```

### Build Fails
```bash
pnpm pre-deploy-fix   # Auto-fix
pnpm build            # Try again
```

---

## GitHub Actions

### Automatic on Push

When you push code, GitHub automatically:
1. ✅ Runs pre-deploy validation
2. ✅ Checks for errors
3. ✅ Blocks merge if errors found
4. ✅ Reports status

**Status:** Check Actions tab

### Manual Trigger

```
GitHub → Actions → Pre-Deployment Validation → Run workflow
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Command not found" | `pnpm install` |
| Still fails after fix | `pnpm typecheck` |
| ESLint still complaining | `pnpm lint` |
| Build fails | Check error message, fix manually |

---

## Summary

```bash
# ✅ Before every commit:
pnpm pre-deploy-check

# ✅ Before every push:
pnpm pre-deploy

# ✅ Before Vercel deployment:
pnpm pre-deploy && pnpm deploy:vercel
```

---

## For More Details

- 📖 Full guide: `docs/PRE_DEPLOYMENT_VALIDATION.md`
- 🛠️ System overview: `docs/ERROR_DETECTION_SYSTEM.md`
- 📝 Code: `scripts/pre-deploy-validate.ts`
- 🔧 Auto-fix: `scripts/auto-fix-errors.ts`
- ⚙️ Workflow: `.github/workflows/pre-deploy-check.yml`

---

**Key Point:** Always run `pnpm pre-deploy` before deploying to Vercel! 🚀
