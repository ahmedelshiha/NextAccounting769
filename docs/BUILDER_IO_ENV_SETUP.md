# Builder.io CMS Environment Setup Guide

Quick reference for setting up Builder.io environment variables.

---

## Quick Start (2 minutes)

### Step 1: Get Your Credentials

1. Go to https://builder.io/account/settings
2. Click **"API Keys"**
3. Copy **Public API Key** (starts with `sk_`)
4. Copy **Space ID** from URL: `?spaceId=ABC123`

### Step 2: Add to Environment

**For Development (`.env.local`):**
```bash
NEXT_PUBLIC_BUILDER_API_KEY=sk_your_public_api_key
NEXT_PUBLIC_BUILDER_SPACE=your_space_id
```

**For Production (Vercel/Netlify):**
```
Settings → Environment Variables
NEXT_PUBLIC_BUILDER_API_KEY = sk_your_public_api_key
NEXT_PUBLIC_BUILDER_SPACE = your_space_id
```

### Step 3: Restart Dev Server

```bash
npm run dev
```

---

## Complete Environment Variables

### Required
```bash
# Public API key (get from Builder.io dashboard)
NEXT_PUBLIC_BUILDER_API_KEY=sk_...

# Space ID (visible in Builder.io account settings URL)
NEXT_PUBLIC_BUILDER_SPACE=...
```

### Optional
```bash
# Enable/disable CMS (default: true if keys present)
NEXT_PUBLIC_BUILDER_ENABLED=true

# Cache duration in milliseconds (default: 300000 = 5 minutes)
NEXT_PUBLIC_BUILDER_CACHE_TIME=300000

# Private API key for server-side operations (optional)
BUILDER_PRIVATE_API_KEY=...
```

---

## Verification Checklist

After adding environment variables:

- [ ] Dev server restarted (`npm run dev`)
- [ ] Can navigate to `/admin/users`
- [ ] Check browser console for Builder API calls (Network tab)
- [ ] No "Builder.io is not configured" warnings

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Builder.io disabled" in console | Check env vars are set in `.env.local` |
| "Failed to fetch content" | Verify API key and Space ID are correct |
| Content doesn't appear | Publish entry in Builder.io editor |
| Changes take too long | Cache expires after 5 minutes (or set `CACHE_TIME=0` for dev) |

---

## Testing Connection

```javascript
// Test in browser console
fetch('/api/builder-io/content?model=admin-workbench-header&space=YOUR_SPACE_ID')
  .then(r => r.json())
  .then(d => console.log(d))
```

Expected output: `{ results: [...] }` or empty array if no published content.
