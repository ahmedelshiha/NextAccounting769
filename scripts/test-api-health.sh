#!/bin/bash

# API Health and Diagnostics Test Script
# Purpose: Test API endpoints and diagnose issues
# Usage: bash scripts/test-api-health.sh [BASE_URL]
# Example: bash scripts/test-api-health.sh https://taxhub-one.vercel.app

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${1:-http://localhost:3000}"
HEALTH_CHECK_URL="$BASE_URL/api/health/comprehensive"
ENTITIES_URL="$BASE_URL/api/entities"
DOCUMENTS_URL="$BASE_URL/api/documents"
INVOICES_URL="$BASE_URL/api/billing/invoices"
APPROVALS_URL="$BASE_URL/api/approvals"
BILLS_URL="$BASE_URL/api/bills"
MESSAGES_URL="$BASE_URL/api/messages"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}API Health and Diagnostics Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Testing against: ${YELLOW}$BASE_URL${NC}"
echo ""

# Function to test endpoint
test_endpoint() {
  local name=$1
  local url=$2
  local method=${3:-GET}
  
  echo -n "Testing $name... "
  
  local response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" 2>/dev/null)
  local body=$(echo "$response" | head -n -1)
  local status=$(echo "$response" | tail -n 1)
  
  if [[ "$status" == "200" ]] || [[ "$status" == "206" ]]; then
    echo -e "${GREEN}✓ $status${NC}"
    return 0
  elif [[ "$status" == "401" ]]; then
    echo -e "${YELLOW}⚠ $status (Unauthorized - authentication required)${NC}"
    return 0
  elif [[ "$status" == "404" ]]; then
    echo -e "${RED}✗ $status (Not Found)${NC}"
    return 1
  elif [[ "$status" == "500" ]]; then
    echo -e "${RED}✗ $status (Internal Server Error)${NC}"
    echo "    Error details:"
    echo "$body" | jq -r '.message // .error // .' 2>/dev/null || echo "$body" | head -c 200
    echo ""
    return 1
  else
    echo -e "${RED}✗ $status (Unexpected status)${NC}"
    return 1
  fi
}

# Test health check endpoint
echo -e "${BLUE}1. Health Check${NC}"
echo "===================="

if curl -s "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
  health=$(curl -s "$HEALTH_CHECK_URL")
  status=$(echo "$health" | jq -r '.status // "unknown"')
  
  if [[ "$status" == "healthy" ]]; then
    echo -e "${GREEN}✓ System Status: HEALTHY${NC}"
  elif [[ "$status" == "degraded" ]]; then
    echo -e "${YELLOW}⚠ System Status: DEGRADED${NC}"
  else
    echo -e "${RED}✗ System Status: UNHEALTHY${NC}"
  fi
  
  echo ""
  echo "Checks:"
  echo "$health" | jq -r '.checks | to_entries[] | "  \(.key): \(.value.status)"'
  
  echo ""
  echo "Response Times:"
  echo "$health" | jq -r '.checks | to_entries[] | "  \(.key): \(.value.responseTime)ms"'
  
  if [[ "$status" != "healthy" ]]; then
    echo ""
    echo "Details:"
    echo "$health" | jq -r '.details'
  fi
else
  echo -e "${RED}✗ Health check endpoint unreachable${NC}"
fi

echo ""
echo -e "${BLUE}2. API Endpoints${NC}"
echo "=================="

# Test each endpoint
failed=0

test_endpoint "GET /api/entities" "$ENTITIES_URL" "GET" || ((failed++))
test_endpoint "GET /api/documents" "$DOCUMENTS_URL" "GET" || ((failed++))
test_endpoint "GET /api/billing/invoices" "$INVOICES_URL" "GET" || ((failed++))
test_endpoint "GET /api/approvals" "$APPROVALS_URL" "GET" || ((failed++))
test_endpoint "GET /api/bills" "$BILLS_URL" "GET" || ((failed++))
test_endpoint "GET /api/messages" "$MESSAGES_URL" "GET" || ((failed++))

echo ""
echo -e "${BLUE}3. Database Configuration${NC}"
echo "=========================="

# Test database connectivity
if [[ -z "$DATABASE_URL" && -z "$NETLIFY_DATABASE_URL" ]]; then
  echo -e "${YELLOW}⚠ No DATABASE_URL or NETLIFY_DATABASE_URL set locally${NC}"
  echo "  (This is expected if running on Vercel)"
else
  db_url="${NETLIFY_DATABASE_URL:-$DATABASE_URL}"
  db_host=$(echo "$db_url" | grep -oP '(?<=@)[^/]*(?=/|$)' | head -1)
  
  echo -e "${GREEN}✓ Database URL configured${NC}"
  echo "  Host: $db_host"
  
  # Try to connect
  if psql "$db_url" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
  else
    echo -e "${YELLOW}⚠ Cannot test database connection locally${NC}"
    echo "  (Use API health check instead)"
  fi
fi

echo ""
echo -e "${BLUE}4. Summary${NC}"
echo "==========="

if [[ $failed -eq 0 ]]; then
  echo -e "${GREEN}✓ All critical endpoints are responding${NC}"
  exit 0
else
  echo -e "${RED}✗ $failed endpoint(s) failed${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Check the API health endpoint: $HEALTH_CHECK_URL"
  echo "  2. Review Vercel build logs for errors"
  echo "  3. Verify environment variables are set correctly"
  echo "  4. Check database connection status"
  echo ""
  echo "For more details, see docs/VERCEL_DEPLOYMENT_GUIDE.md"
  exit 1
fi
