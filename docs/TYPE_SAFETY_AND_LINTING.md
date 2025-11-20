# Type Safety & Linting Standards

**For**: All developers on the Portal-Admin Integration project  
**Last Updated**: November 2024  
**Status**: ENFORCED - All code must pass these checks

---

## Overview

This project maintains strict type safety and code quality standards to ensure:
- ✅ **No runtime type errors** - Types catch issues at compile time
- ✅ **Consistent code style** - All code follows same patterns
- ✅ **Maintainable codebase** - Clear, predictable code
- ✅ **Better developer experience** - IDE support and autocomplete
- ✅ **Fewer bugs** - Types and linting catch issues early

---

## TypeScript Configuration

### Current Settings

The project uses **strict mode enabled** TypeScript with the following settings:

```json
{
  "compilerOptions": {
    "strict": true,                    // All strict options enabled
    "noImplicitAny": true,            // No implicit 'any' types
    "noUnusedLocals": true,           // Error on unused variables
    "noUnusedParameters": true,       // Error on unused parameters
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,        // Function must return all code paths
    "noImplicitThis": true,
    "noPropertyAccessFromIndexSignature": true,
    "allowUnusedLabels": false,
    "exactOptionalPropertyTypes": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### What This Means

| Setting | Behavior | Example |
|---------|----------|---------|
| **strict** | All type checking enabled | Catches all type-related issues |
| **noImplicitAny** | Variables must have explicit types | `let x: string = 'hello'` (not `let x = 'hello'`) |
| **noUnusedLocals** | All variables must be used | Removes dead code |
| **noUnusedParameters** | All function parameters must be used | Prevents mistakes in callbacks |
| **noImplicitReturns** | All code paths must return value | `if (x) return 1; else return 2;` (not `if (x) return 1;`) |

### Checking Types Locally

```bash
# Check TypeScript compilation
npm run type-check

# This will:
# ✅ Find all type errors
# ✅ Report unused variables
# ✅ Check return types
# ✅ Verify type coverage

# Example output:
# src/components/MyComponent.tsx:42:5 - error TS2322:
# Type 'string' is not assignable to type 'number'
```

### Common Type Issues & Fixes

#### Issue 1: Implicit Any

**Problem**:
```tsx
// ❌ ERROR: Parameter 'x' implicitly has an 'any' type
function handleChange(x) {
  return x.toString()
}
```

**Solution**:
```tsx
// ✅ CORRECT: Type explicitly specified
function handleChange(x: string) {
  return x.toString()
}

// Or with generic
function handleChange<T>(x: T) {
  return String(x)
}
```

#### Issue 2: Unused Variables

**Problem**:
```tsx
const [count, setCount] = useState(0)
const [other, setOther] = useState('') // ❌ 'other' never used

useEffect(() => {
  console.log(count)
}, [count, other]) // ❌ 'other' unused in dependency
```

**Solution**:
```tsx
const [count, setCount] = useState(0)

useEffect(() => {
  console.log(count)
}, [count]) // ✅ Correct dependencies

// Or prefix unused with underscore
const [_other, setOther] = useState('')
```

#### Issue 3: Missing Return Type

**Problem**:
```tsx
// ❌ Return type not specified
export function getData() {
  if (condition) return { data: [] }
  // Missing return in other path
}
```

**Solution**:
```tsx
// ✅ Return type explicitly specified
export function getData(): { data: string[] } {
  if (condition) return { data: [] }
  return { data: ['default'] }
}
```

#### Issue 4: Function Not Returning in All Paths

**Problem**:
```tsx
// ❌ Missing return in else path
function getStatus(active: boolean) {
  if (active) return 'active'
  // ERROR: Not all code paths return a value
}
```

**Solution**:
```tsx
// ✅ All paths return
function getStatus(active: boolean): string {
  if (active) return 'active'
  return 'inactive'
}

// Or use ternary
const status = active ? 'active' : 'inactive'
```

---

## ESLint Configuration

### Current Rules

The project uses ESLint with Next.js and TypeScript recommended rules:

```javascript
{
  extends: ["next/core-web-vitals", "next/typescript"],
  rules: {
    // Strict type checking
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    
    // React rules
    "react/jsx-no-undef": "error",
    "react-hooks/exhaustive-deps": "warn",
    
    // Next.js rules
    "@next/next/no-img-element": "warn",
    
    // API route rules
    "no-restricted-imports": ["error", { ... }],
  }
}
```

### Running ESLint

```bash
# Check for linting errors
npm run lint

# Auto-fix errors (when possible)
npm run lint:fix

# Example output:
# src/components/form.tsx
# 42:7  error  Unexpected 'any' type  @typescript-eslint/no-explicit-any

# View count of errors/warnings
npm run lint 2>&1 | grep -E "error|warning" | wc -l
```

### Important ESLint Rules

#### Rule 1: No Explicit Any

**What it means**: Don't use the `any` type - it defeats the purpose of TypeScript.

**Problem**:
```tsx
// ❌ Using 'any'
const data: any = fetchData()
const result = data.property // Could be anything!
```

**Solution**:
```tsx
// ✅ Specify actual type
const data: Promise<Data> = fetchData()
const result = await data // Type is known!

// Or use generics
function process<T>(data: T) {
  return data
}
```

#### Rule 2: No Unused Variables

**What it means**: Remove code that's not being used.

**Problem**:
```tsx
const { id, name, unused } = props // ❌ 'unused' not used
```

**Solution**:
```tsx
const { id, name } = props // ✅ Only what's needed

// If intentionally unused, prefix with underscore
const { id, name, _deprecated } = props // ✅ Clear intent
```

#### Rule 3: React Hooks Dependencies

**What it means**: All effect dependencies must be correct.

**Problem**:
```tsx
// ❌ Missing 'count' in dependencies
useEffect(() => {
  console.log(count)
}, [])
```

**Solution**:
```tsx
// ✅ All used values in dependencies
useEffect(() => {
  console.log(count)
}, [count])

// Or use exhaustive-deps eslint plugin
```

#### Rule 4: Restrict Imports in API Routes

**What it means**: API routes can't use client-side imports.

**Problem**:
```tsx
// ❌ Can't use getServerSession directly
import { getServerSession } from 'next-auth'

export const GET = async () => {
  const session = await getServerSession()
}
```

**Solution**:
```tsx
// ✅ Use withTenantAuth middleware
import { withTenantAuth } from '@/lib/auth-middleware'

export const GET = withTenantAuth(async (request) => {
  const userId = request.userId // Already authenticated
})
```

---

## Pre-commit Hooks (Husky)

### What They Do

Pre-commit hooks automatically run before you commit code:

```bash
# When you run: git commit
# Husky automatically runs:
1. npm run type-check    # Check TypeScript
2. npm run lint          # Check code style
3. npm run test          # Run tests
# Only if all pass, commit is allowed
```

### Setting Up Husky

```bash
# Install husky
npm install husky --save-dev

# Initialize
npx husky install

# Add type check hook
npx husky add .husky/pre-commit "npm run type-check"

# Add lint hook
npx husky add .husky/pre-commit "npm run lint"

# Add test hook (optional, can be slow)
npx husky add .husky/pre-commit "npm run test:quick"
```

### Current Hooks

Check `.husky/` directory for what hooks are configured:

```bash
ls -la .husky/

# Example output:
# .husky/
# ├── pre-commit   (runs type-check, lint, test)
# ├── pre-push     (runs full build)
# └── ...
```

### Bypassing Hooks (Not Recommended)

```bash
# Skip all hooks (emergency only!)
git commit --no-verify

# Better: Fix the issues!
npm run lint:fix
npm run type-check
git commit
```

---

## Development Workflow with Type Safety

### Step 1: Code Changes

```bash
# Make changes to files
code src/components/MyComponent.tsx
```

### Step 2: Check Locally

```bash
# Check types
npm run type-check

# Fix any type errors
# (Update component.tsx to fix errors)

# Check linting
npm run lint

# Auto-fix style issues
npm run lint:fix

# Run tests
npm run test

# Build (simulates production)
npm run build
```

### Step 3: Commit When All Pass

```bash
# All checks passing? Commit!
git add .
git commit -m "feat: my feature"

# Pre-commit hooks run automatically
# If any fail, commit is prevented
# Fix issues and try again
```

### Step 4: Push & PR

```bash
# Push to remote
git push origin feat/my-feature

# Create pull request on GitHub
# (CI will run same checks)
```

---

## Strict Code Areas

Certain parts of the codebase have **even stricter** rules:

### Shared Code (src/shared/*)

**Extra Restrictions**:
- ✅ Must be 100% TypeScript compliant
- ✅ Zero use of `any` type
- ✅ Complete JSDoc comments required
- ✅ >80% test coverage required
- ✅ All exports must be typed

**Rationale**: Shared code is used everywhere, must be bulletproof.

**Example**:
```tsx
// ✅ SHARED CODE - HIGH STANDARD
/**
 * Extract initials from full name
 * @param name - Full name string
 * @returns Two-letter initials in uppercase
 * @example
 * getInitials('John Doe') // Returns 'JD'
 */
export function getInitials(name: string): string {
  const [first, ...rest] = name.trim().split(' ')
  const last = rest[rest.length - 1] || first
  return `${first[0]}${last[0]}`.toUpperCase()
}
```

### API Routes (src/app/api/*)

**Extra Restrictions**:
- ✅ Must use `withTenantAuth` middleware
- ✅ Must validate all inputs with Zod
- ✅ Must return `respond.ok/error/...` helper
- ✅ Must handle all error cases
- ✅ Must have integration tests

**Example**:
```tsx
// ✅ API ROUTE - PRODUCTION READY
import { withTenantAuth } from '@/lib/auth-middleware'
import { respond } from '@/lib/api-response'
import { ServiceCreateSchema } from '@/schemas/shared'

export const POST = withTenantAuth(async (request) => {
  try {
    const body = await request.json()
    const validated = ServiceCreateSchema.parse(body)
    const service = await prisma.service.create({
      data: { ...validated, tenantId: request.tenantId },
    })
    return respond.created(service)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return respond.badRequest('Invalid input', error.errors)
    }
    return respond.serverError()
  }
})
```

---

## Type Inference Best Practices

### Using z.infer for Schemas

**Problem**:
```tsx
// ❌ Duplicating types and schemas
interface Service {
  id: string
  name: string
  price: number
}

const ServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
})

// Now types are out of sync!
```

**Solution**:
```tsx
// ✅ Single source of truth (Zod)
const ServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
})

// Automatically infer TypeScript type
type Service = z.infer<typeof ServiceSchema>

// Always in sync!
const validated: Service = ServiceSchema.parse(data)
```

### Generic Type Parameters

**Problem**:
```tsx
// ❌ Hard to reuse
function processService(service: Service) {
  return service.id
}

function processBooking(booking: Booking) {
  return booking.id
}

// Code duplication!
```

**Solution**:
```tsx
// ✅ Generic function
function getResourceId<T extends { id: string }>(resource: T): string {
  return resource.id
}

// Works with any type!
getResourceId(service)
getResourceId(booking)
```

### Conditional Types

**Problem**:
```tsx
// ❌ Manual type checking
function format(value: string | number): string {
  if (typeof value === 'string') return value
  return value.toString()
}
```

**Solution**:
```tsx
// ✅ Type system handles it
function format<T extends string | number>(value: T): string {
  return String(value)
}
```

---

## Error Messages & Solutions

### Common TypeScript Errors

#### Error: "Type 'X' is not assignable to type 'Y'"

**Cause**: Type mismatch

**Solution**:
```tsx
// ❌ Error
const num: number = 'hello'

// ✅ Fix
const num: number = 42
const str: string = 'hello'
```

#### Error: "Property 'X' does not exist on type 'Y'"

**Cause**: Accessing non-existent property

**Solution**:
```tsx
// ❌ Error
const user = { name: 'John' }
console.log(user.age) // age doesn't exist

// ✅ Fix
const user = { name: 'John', age: 30 }
console.log(user.age)
```

#### Error: "Parameter 'X' has no initializer and is not definitely assigned"

**Cause**: Class property not initialized

**Solution**:
```tsx
// ❌ Error
class User {
  name: string // Not initialized!
}

// ✅ Fix
class User {
  name: string = ''
  
  // Or with constructor
  constructor(name: string) {
    this.name = name
  }
}
```

### Common ESLint Errors

#### Error: "Unexpected 'any' type"

**Cause**: Using `any` instead of proper type

**Solution**:
```tsx
// ❌ Error
const data: any = fetchData()

// ✅ Fix
const data: Promise<ServiceData> = fetchData()
```

#### Error: "Unused variable 'X'"

**Cause**: Variable declared but not used

**Solution**:
```tsx
// ❌ Error
const unused = 'hello'
console.log('world')

// ✅ Fix
const used = 'hello'
console.log(used)

// ✅ Or prefix with underscore if intentionally unused
const _unused = 'hello'
```

---

## IDE Setup for Type Safety

### VS Code Recommended Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.fixAll.format": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### Recommended VS Code Extensions

- **ESLint** (dbaeumer.vscode-eslint)
- **TypeScript Vue Plugin** (Vue.vscode-typescript-vue-plugin)
- **Prettier** (esbenp.prettier-vscode)
- **Code Spell Checker** (streetsidesoftware.code-spell-checker)

---

## CI/CD Integration

### GitHub Actions

All checks run automatically on:
- Push to any branch
- Pull requests
- Before merge to main

### Running Checks Locally (Before Pushing)

```bash
# Run all checks that CI will run
npm run type-check
npm run lint
npm run test
npm run build

# If all pass, safe to push!
git push origin your-branch
```

### Fixing CI Failures

1. **TypeScript errors**:
   ```bash
   npm run type-check
   # Fix errors shown
   ```

2. **Linting errors**:
   ```bash
   npm run lint:fix
   # Auto-fixes many issues
   npm run lint
   # Check remaining issues
   ```

3. **Test failures**:
   ```bash
   npm run test
   # Fix failing tests
   npm run test:watch
   # Develop interactively
   ```

4. **Build failures**:
   ```bash
   npm run build
   # Check error messages
   # Usually points to specific file/issue
   ```

---

## Gradual Adoption

If joining a project with lower type safety:

### Phase 1: Non-strict
```json
{
  "compilerOptions": {
    "noImplicitAny": false,
    "strictNullChecks": false
  }
}
```

### Phase 2: Partial Strict
```json
{
  "compilerOptions": {
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### Phase 3: Full Strict ✅ (This Project)
```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

---

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript do's and don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [ESLint Documentation](https://eslint.org/docs/rules/)
- [TypeScript-ESLint Rules](https://typescript-eslint.io/rules/)
- [Next.js TypeScript](https://nextjs.org/docs/basic-features/typescript)
- [Zod Documentation](https://zod.dev/)

---

## Summary

| Standard | Check | Command |
|----------|-------|---------|
| **TypeScript** | Types are correct | `npm run type-check` |
| **Linting** | Code style | `npm run lint` |
| **Testing** | Functionality | `npm run test` |
| **Building** | Production ready | `npm run build` |

**All must pass before committing.**

---

**Version**: 1.0  
**Last Updated**: November 2024  
**Maintained By**: Development Team

---

**Remember**: Type safety is not a burden—it's your safety net. Let TypeScript catch bugs before users do! 🛡️
