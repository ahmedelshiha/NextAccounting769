#!/bin/bash

# Migration Resolution Script
# This script helps resolve failed Prisma migrations

set -e

echo "🔧 Prisma Migration Resolution Script"
echo "======================================"
echo ""

# Check if DATABASE_URL is set
if [[ -z "$DATABASE_URL" && -z "$NETLIFY_DATABASE_URL" ]]; then
  echo "❌ Error: No database URL configured"
  echo "Please set DATABASE_URL or NETLIFY_DATABASE_URL"
  exit 1
fi

# Use NETLIFY_DATABASE_URL if DATABASE_URL is not set
if [[ -z "$DATABASE_URL" && -n "$NETLIFY_DATABASE_URL" ]]; then
  export DATABASE_URL="$NETLIFY_DATABASE_URL"
fi

echo "📍 Database: $(echo $DATABASE_URL | grep -oP 'postgresql://[^/]*' || echo 'Unknown')"
echo ""

# Step 1: Show migration status
echo "1️⃣  Current migration status:"
pnpm prisma migrate status --skip-generate || true
echo ""

# Step 2: Resolve failed migrations
echo "2️���  Resolving failed migrations..."
echo "   Marking migration as rolled back: 20251114145300_add_user_on_entity"
pnpm prisma migrate resolve --rolled-back 20251114145300_add_user_on_entity || true
echo ""

# Step 3: Re-apply migrations
echo "3️⃣  Re-applying migrations..."
if pnpm prisma migrate deploy; then
  echo "✅ Migrations applied successfully"
else
  echo "⚠️  Warning: Could not apply migrations automatically"
  echo "   You may need to manually review the migration state"
fi
echo ""

# Step 4: Verify migration status
echo "4️⃣  Final migration status:"
pnpm prisma migrate status --skip-generate || true
echo ""

echo "🎉 Migration resolution complete!"
echo ""
echo "If issues persist:"
echo "  1. Check migration status: pnpm prisma migrate status"
echo "  2. View database state: pnpm prisma studio"
echo "  3. For more help: https://www.prisma.io/docs/orm/reference/error-reference#p3009"
