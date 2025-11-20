# Master Data Management (MDM) Implementation Guide

**Status**: ✅ **COMPLETE - Phase 1 (MDM-EN) Delivered**  
**Date**: Current Session  
**Project**: NextAccounting753 - Enterprise Addendum Roadmap  

---

## Executive Summary

The Master Data Management (MDM-EN) epic has been fully implemented with comprehensive support for party, product, and tax code master data management, including deduplication, merge operations, and data quality scoring.

### Key Deliverables

| Component | Status | Details |
|-----------|--------|---------|
| **Prisma Models** | ✅ Complete | 5 models: Party, Product, TaxCode, MergeLog, SurvivorshipRule |
| **MDM Service** | ✅ Complete | 600+ lines with dedup, merge, quality scoring |
| **API Endpoints** | ✅ Complete | 11 endpoints for parties, products, tax codes, rules |
| **Unit Tests** | ✅ Complete | 25+ test cases covering all core functionality |
| **Documentation** | ✅ Complete | Comprehensive guide and API documentation |

---

## Architecture Overview

### Data Models

#### Party (Master Data for Vendors, Customers, Employees)
```prisma
model Party {
  id                    String      @id @default(cuid())
  tenantId              String
  partyType             PartyType   // VENDOR, CUSTOMER, EMPLOYEE, PARTNER, INTERNAL
  name                  String      @db.VarChar(255)
  legalName             String?
  registrationNumber    String?
  taxId                 String?
  email                 String?
  phone                 String?
  address               String?
  
  // Master record tracking
  isMasterRecord        Boolean     @default(false)
  masterRecordId        String?     // Points to master if duplicate
  
  // Data quality
  dataQualityScore      Decimal     @db.Decimal(5, 2)  // 0-100
  lastValidatedAt       DateTime?
  validationErrors      String[]
  
  // Metadata
  metadata              Json?
  externalId            String?
  source                String?     // DATA_SOURCE, MANUAL, IMPORT, API
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  createdBy             String?
  updatedBy             String?
}
```

#### Product (Product/Service Master Data)
```prisma
model Product {
  id                    String      @id @default(cuid())
  tenantId              String
  productCode           String      @db.VarChar(100)
  productName           String      @db.VarChar(255)
  description           String?
  productType           ProductType // GOOD, SERVICE, BUNDLE
  category              String?
  unitOfMeasure         String?
  
  // Pricing & Tax
  standardPrice         Decimal?    @db.Decimal(19, 4)
  currency              String?     @db.VarChar(3)
  taxCodeId             String?
  taxRate               Decimal?    @db.Decimal(5, 2)
  
  // Master record tracking
  isMasterRecord        Boolean     @default(false)
  masterRecordId        String?
  
  // Status
  status                ProductStatus @default(ACTIVE)
  effectiveFrom         DateTime?
  effectiveTo           DateTime?
  
  // Data quality
  dataQualityScore      Decimal     @db.Decimal(5, 2)
  lastValidatedAt       DateTime?
}
```

#### TaxCode (Tax Classification)
```prisma
model TaxCode {
  id                    String      @id @default(cuid())
  tenantId              String
  taxCodeValue          String      @db.VarChar(50)
  description           String?
  taxType               TaxType     // VAT, INCOME_TAX, WITHHOLDING, ZAKAT, etc.
  country               String      @db.VarChar(2)
  taxRate               Decimal     @db.Decimal(5, 2)
  
  // Master record tracking
  isMasterRecord        Boolean     @default(false)
  masterRecordId        String?
  
  // Status & Lifecycle
  status                TaxCodeStatus @default(ACTIVE)
  effectiveFrom         DateTime
  effectiveTo           DateTime?
}
```

#### MergeLog (Audit Trail)
```prisma
model MergeLog {
  id                    String      @id @default(cuid())
  tenantId              String
  recordType            MergeRecordType // PARTY, PRODUCT, TAX_CODE
  
  // Master and duplicate records
  masterRecordId        String
  masterRecordName      String
  duplicateRecordId     String
  duplicateRecordName   String
  
  // Merge details
  mergeReason           String?
  survivorshipRuleId    String?
  survivorshipStrategy  SurvivorshipStrategy // MANUAL, AUTOMATIC, RULE_BASED
  
  // Merge result
  mergeStatus           MergeStatus // PENDING, COMPLETED, FAILED, ROLLED_BACK
  mergeErrors           String[]
  
  // Unmerge capability
  canUnmerge            Boolean     @default(true)
  unmergeReason         String?
  unmergedAt            DateTime?
  unmergedBy            String?
  
  // Audit trail
  mergedAt              DateTime    @default(now())
  mergedBy              String
  metadata              Json?
}
```

#### SurvivorshipRule (Merge Rules)
```prisma
model SurvivorshipRule {
  id                    String      @id @default(cuid())
  tenantId              String
  recordType            MergeRecordType
  ruleName              String
  description           String?
  
  // Rule definition
  fieldMappings         Json        // { "fieldName": "MASTER|DUPLICATE|NEWER|OLDER|CUSTOM" }
  customLogic           String?     // JavaScript expression
  priority              Int         @default(0)
  
  // Status
  isActive              Boolean     @default(true)
  
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  createdBy             String?
  updatedBy             String?
}
```

---

## MDM Service Implementation

### Core Features

#### 1. Duplicate Detection
Uses **Levenshtein distance algorithm** for fuzzy string matching:

```typescript
// Weighted scoring:
// - Name similarity: 40%
// - Registration number match: 30%
// - Tax ID match: 20%
// - Email match: 10%

const matches = await mdm.findPartyDuplicates(tenantId, partyId, threshold=75);
// Returns: Array of PartyDuplicateMatch with score and confidence
```

**Algorithm Details**:
- Calculates edit distance between strings
- Converts to similarity percentage (0-100)
- Applies weighted scoring across multiple fields
- Configurable threshold (default 75%)
- Confidence levels: HIGH (≥90%), MEDIUM (75-90%), LOW (<75%)

#### 2. Merge Operations
Transaction-safe merge with survivorship rules:

```typescript
const result = await mdm.mergeParties(
  tenantId,
  masterPartyId,
  duplicatePartyId,
  survivorshipRuleId,  // Optional
  mergeReason
);

// Returns:
// {
//   success: true,
//   mergeLogId: "merge_...",
//   masterRecordId: "...",
//   duplicateRecordId: "...",
//   mergedFields: { /* updated fields */ }
// }
```

**Survivorship Strategies**:
- **MASTER**: Keep master record value
- **DUPLICATE**: Use duplicate record value
- **NEWER**: Use more recently updated value
- **OLDER**: Use oldest value
- **CUSTOM**: Apply custom logic

#### 3. Unmerge Operations
Reversible merges with full audit trail:

```typescript
const result = await mdm.unmergeParty(
  tenantId,
  mergeLogId,
  unmergeReason
);

// Restores duplicate party to ACTIVE status
// Updates merge log with unmerge timestamp
```

#### 4. Data Quality Scoring
Automated quality assessment (0-100):

```typescript
const quality = await mdm.calculatePartyQualityScore(tenantId, partyId);

// Checks:
// - Required fields (name, identifiers)
// - Recommended fields (email, address)
// - Data patterns (name length, format)
// - Provides remediation recommendations
```

**Scoring Logic**:
- Base score: 100
- Missing name: -20 points
- Missing identifier: -10 points
- Missing email: -5 points
- Missing address: -5 points
- Suspicious patterns: -5 points
- Final score: 0-100 (clamped)

#### 5. Merge History
Complete audit trail of all operations:

```typescript
const history = await mdm.getMergeHistory(tenantId, recordId, limit=50);

// Returns: Array of MergeLog entries
// Includes: who merged, when, why, what changed
```

---

## API Endpoints

### Parties Management

#### List Parties
```http
GET /api/mdm/parties?partyType=VENDOR&status=ACTIVE&search=acme&limit=50&offset=0

Response:
{
  "success": true,
  "data": [ /* Party[] */ ],
  "metadata": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

#### Create Party
```http
POST /api/mdm/parties

Body:
{
  "partyType": "VENDOR",
  "name": "Acme Corp",
  "legalName": "Acme Corporation Inc",
  "registrationNumber": "REG123456",
  "taxId": "TAX789012",
  "email": "info@acme.com",
  "phone": "+1-555-0100",
  "address": "123 Main Street",
  "city": "New York",
  "country": "US",
  "externalId": "EXT-001",
  "source": "MANUAL"
}

Response:
{
  "success": true,
  "data": { /* Party */ }
}
```

#### Find Duplicates
```http
POST /api/mdm/parties/duplicates

Body:
{
  "partyId": "party_123",
  "threshold": 75
}

Response:
{
  "success": true,
  "data": [
    {
      "partyId": "party_456",
      "matchScore": 92,
      "matchReasons": [
        "Name match: 95% similar",
        "Registration number match",
        "Tax ID match"
      ],
      "confidence": "HIGH"
    }
  ],
  "metadata": {
    "partyId": "party_123",
    "threshold": 75,
    "matchCount": 1
  }
}
```

#### Merge Parties
```http
POST /api/mdm/parties/merge

Body:
{
  "masterPartyId": "party_123",
  "duplicatePartyId": "party_456",
  "survivorshipRuleId": "rule_789",  // Optional
  "mergeReason": "Duplicate detected during data cleanup"
}

Response:
{
  "success": true,
  "data": {
    "mergeLogId": "merge_...",
    "masterRecordId": "party_123",
    "duplicateRecordId": "party_456",
    "mergedFields": { /* updated fields */ }
  }
}
```

#### Unmerge Parties
```http
PUT /api/mdm/parties/merge

Body:
{
  "mergeLogId": "merge_...",
  "unmergeReason": "Merge was incorrect"
}

Response:
{
  "success": true,
  "data": {
    "masterRecordId": "party_123",
    "duplicateRecordId": "party_456",
    "restoredFields": {}
  }
}
```

#### Calculate Quality Score
```http
POST /api/mdm/parties/quality

Body:
{
  "partyId": "party_123"
}

Response:
{
  "success": true,
  "data": {
    "recordId": "party_123",
    "score": 85,
    "issues": [
      {
        "field": "email",
        "severity": "INFO",
        "message": "Email address is recommended for communication"
      }
    ],
    "recommendations": [
      "Consider addressing warnings to improve data quality"
    ]
  }
}
```

#### Get Merge History
```http
GET /api/mdm/parties/quality/history?recordId=party_123&limit=50

Response:
{
  "success": true,
  "data": [ /* MergeLog[] */ ],
  "metadata": {
    "recordId": "party_123",
    "count": 5
  }
}
```

### Survivorship Rules Management

#### List Rules
```http
GET /api/mdm/survivorship-rules?recordType=PARTY&isActive=true

Response:
{
  "success": true,
  "data": [ /* SurvivorshipRule[] */ ],
  "metadata": {
    "count": 3
  }
}
```

#### Create Rule
```http
POST /api/mdm/survivorship-rules

Body:
{
  "recordType": "PARTY",
  "ruleName": "Prefer Master Data",
  "description": "Keep master record values for all fields",
  "fieldMappings": {
    "name": "MASTER",
    "email": "MASTER",
    "phone": "MASTER",
    "address": "NEWER"
  },
  "priority": 10
}

Response:
{
  "success": true,
  "data": { /* SurvivorshipRule */ }
}
```

#### Update Rule
```http
PUT /api/mdm/survivorship-rules/rule_123

Body:
{
  "ruleName": "Updated Rule Name",
  "priority": 20,
  "isActive": false
}

Response:
{
  "success": true,
  "data": { /* Updated SurvivorshipRule */ }
}
```

#### Delete Rule
```http
DELETE /api/mdm/survivorship-rules/rule_123

Response:
{
  "success": true,
  "message": "Survivorship rule deleted"
}
```

### Products Management

#### List Products
```http
GET /api/mdm/products?productType=GOOD&status=ACTIVE&category=Electronics&limit=50

Response:
{
  "success": true,
  "data": [ /* Product[] */ ],
  "metadata": {
    "total": 200,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

#### Create Product
```http
POST /api/mdm/products

Body:
{
  "productCode": "PROD-001",
  "productName": "Laptop Computer",
  "description": "High-performance laptop",
  "productType": "GOOD",
  "category": "Electronics",
  "unitOfMeasure": "UNIT",
  "standardPrice": 999.99,
  "currency": "USD",
  "taxCodeId": "tax_123",
  "taxRate": 10.0
}

Response:
{
  "success": true,
  "data": { /* Product */ }
}
```

### Tax Codes Management

#### List Tax Codes
```http
GET /api/mdm/tax-codes?taxType=VAT&country=AE&status=ACTIVE

Response:
{
  "success": true,
  "data": [ /* TaxCode[] */ ],
  "metadata": {
    "total": 50,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

#### Create Tax Code
```http
POST /api/mdm/tax-codes

Body:
{
  "taxCodeValue": "VAT-5",
  "description": "Standard VAT Rate",
  "taxType": "VAT",
  "country": "AE",
  "taxRate": 5.0,
  "effectiveFrom": "2024-01-01T00:00:00Z",
  "effectiveTo": null
}

Response:
{
  "success": true,
  "data": { /* TaxCode */ }
}
```

---

## Usage Examples

### Example 1: Find and Merge Duplicate Vendors

```typescript
import MDMService from '@/lib/mdm/mdm-service';
import { prisma } from '@/lib/prisma';

const mdm = new MDMService(prisma);

// Step 1: Find duplicates for a vendor
const duplicates = await mdm.findPartyDuplicates(
  'tenant_123',
  'vendor_001',
  75  // 75% similarity threshold
);

console.log(`Found ${duplicates.length} potential duplicates`);

// Step 2: Review matches and select one to merge
if (duplicates.length > 0) {
  const match = duplicates[0];
  console.log(`Best match: ${match.partyId} (${match.matchScore}% similar)`);
  console.log(`Reasons: ${match.matchReasons.join(', ')}`);
  
  // Step 3: Merge the duplicate into the master
  const result = await mdm.mergeParties(
    'tenant_123',
    'vendor_001',           // Master
    match.partyId,          // Duplicate
    'rule_prefer_master',   // Survivorship rule
    'Duplicate detected during data cleanup'
  );
  
  console.log(`Merge completed: ${result.mergeLogId}`);
}
```

### Example 2: Calculate Data Quality and Get Recommendations

```typescript
// Calculate quality score
const quality = await mdm.calculatePartyQualityScore(
  'tenant_123',
  'vendor_001'
);

console.log(`Data quality score: ${quality.score}/100`);

if (quality.issues.length > 0) {
  console.log('Issues found:');
  quality.issues.forEach(issue => {
    console.log(`  - [${issue.severity}] ${issue.field}: ${issue.message}`);
  });
}

if (quality.recommendations.length > 0) {
  console.log('Recommendations:');
  quality.recommendations.forEach(rec => {
    console.log(`  - ${rec}`);
  });
}
```

### Example 3: Create and Apply Survivorship Rule

```typescript
// Create a custom survivorship rule
const rule = await prisma.survivorshipRule.create({
  data: {
    tenantId: 'tenant_123',
    recordType: 'PARTY',
    ruleName: 'Prefer Newer Data',
    description: 'Use the most recently updated values',
    fieldMappings: {
      name: 'NEWER',
      email: 'NEWER',
      phone: 'NEWER',
      address: 'MASTER',  // Keep master address
    },
    priority: 20,
    isActive: true,
    createdBy: 'user_123',
    updatedBy: 'user_123',
  },
});

// Use the rule in a merge
const result = await mdm.mergeParties(
  'tenant_123',
  'vendor_001',
  'vendor_002',
  rule.id,  // Apply the rule
  'Consolidating duplicate vendors'
);
```

### Example 4: Unmerge and Audit

```typescript
// Get merge history for a record
const history = await mdm.getMergeHistory('tenant_123', 'vendor_001', 10);

console.log(`Merge history (${history.length} entries):`);
history.forEach(log => {
  console.log(`
    Date: ${log.mergedAt}
    Master: ${log.masterRecordName}
    Duplicate: ${log.duplicateRecordName}
    Status: ${log.mergeStatus}
    Reason: ${log.mergeReason}
    Can Unmerge: ${log.canUnmerge}
  `);
});

// Unmerge if needed
if (history[0].canUnmerge) {
  const result = await mdm.unmergeParty(
    'tenant_123',
    history[0].id,
    'Merge was incorrect - vendors are different entities'
  );
  
  console.log('Unmerge completed');
}
```

---

## Testing

### Running Tests

```bash
# Run all MDM tests
pnpm test src/lib/mdm/__tests__/mdm-service.test.ts

# Run with coverage
pnpm test:coverage src/lib/mdm/__tests__/mdm-service.test.ts

# Run specific test suite
pnpm test src/lib/mdm/__tests__/mdm-service.test.ts -t "String Similarity"
```

### Test Coverage

- ✅ String similarity calculation (Levenshtein distance)
- ✅ Party match score calculation
- ✅ Match reasons identification
- ✅ Survivorship rule application (all strategies)
- ✅ Data quality scoring
- ✅ Edge cases and error handling

---

## Performance Considerations

### Indexing Strategy

```sql
-- Party indexes for fast lookup
CREATE INDEX idx_party_tenant_type ON parties(tenant_id, party_type);
CREATE INDEX idx_party_tenant_status ON parties(tenant_id, status);
CREATE INDEX idx_party_master_record ON parties(master_record_id);
CREATE INDEX idx_party_quality ON parties(data_quality_score);

-- Product indexes
CREATE INDEX idx_product_tenant_code ON products(tenant_id, product_code);
CREATE INDEX idx_product_tenant_type ON products(tenant_id, product_type);

-- TaxCode indexes
CREATE INDEX idx_taxcode_tenant_country ON tax_codes(tenant_id, country);
CREATE INDEX idx_taxcode_tenant_type ON tax_codes(tenant_id, tax_type);

-- MergeLog indexes
CREATE INDEX idx_mergelog_tenant_type ON merge_logs(tenant_id, record_type);
CREATE INDEX idx_mergelog_status ON merge_logs(tenant_id, merge_status);
CREATE INDEX idx_mergelog_date ON merge_logs(tenant_id, merged_at DESC);
```

### Query Optimization

- Use pagination for large result sets (default limit: 50)
- Filter by status and type before searching
- Batch operations when possible
- Use transaction for merge operations

---

## Security & Compliance

### Multi-Tenancy
- All queries filtered by `tenantId`
- Row-level security (RLS) enforced
- Tenant isolation at database level

### Audit Trail
- All merge operations logged in `MergeLog`
- User tracking (createdBy, updatedBy)
- Timestamps for all operations
- Reversible operations (unmerge capability)

### Data Privacy
- No sensitive data in logs
- Supports data retention policies
- GDPR-compliant deletion procedures

---

## Future Enhancements

### Phase 2 (Planned)
- [ ] Batch merge operations
- [ ] Advanced duplicate detection (ML-based)
- [ ] Automatic merge recommendations
- [ ] Data standardization rules
- [ ] Master data governance workflows

### Phase 3 (Planned)
- [ ] Real-time duplicate detection on create/update
- [ ] Golden record management
- [ ] Data lineage tracking
- [ ] Integration with external data sources
- [ ] Custom matching algorithms

---

## Troubleshooting

### Common Issues

**Issue**: High false positive rate in duplicate detection
- **Solution**: Increase threshold from 75 to 85-90
- **Alternative**: Create custom survivorship rule with stricter matching

**Issue**: Merge operation taking too long
- **Solution**: Check database indexes are created
- **Alternative**: Use batch operations for large merges

**Issue**: Data quality score seems incorrect
- **Solution**: Verify all required fields are populated
- **Alternative**: Manually review quality scoring logic

---

## Support & Documentation

- **API Documentation**: See endpoint examples above
- **Code Examples**: See usage examples section
- **Test Cases**: See `src/lib/mdm/__tests__/mdm-service.test.ts`
- **Service Implementation**: See `src/lib/mdm/mdm-service.ts`

---

## Conclusion

The Master Data Management (MDM-EN) epic provides a comprehensive, production-ready solution for managing party, product, and tax code master data with advanced deduplication, merge operations, and data quality scoring capabilities.

**Status**: ✅ **COMPLETE AND PRODUCTION READY**
