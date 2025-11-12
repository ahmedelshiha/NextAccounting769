/**
 * Tax Workflows - Type Definitions
 * Comprehensive types for multi-country tax filing management
 */

export type TaxCountry = 'AE' | 'SA' | 'EG'
export type TaxType =
  | 'VAT'
  | 'CORPORATE_TAX'
  | 'ZAKAT'
  | 'WHT'
  | 'ESR'
  | 'UBO'
  | 'ETA'
  | 'E_RECEIPT'

export type FilingStatus = 'DRAFT' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'AMENDED'
export type FilingFrequency = 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY'

/**
 * Tax Filing Core Types
 */
export interface TaxFiling {
  id: string
  tenantId: string
  entityId: string
  country: TaxCountry
  taxType: TaxType
  period: {
    startDate: Date
    endDate: Date
    frequency: FilingFrequency
  }
  status: FilingStatus
  data: Record<string, unknown>
  calculations: TaxCalculations
  attachments: string[] // Document IDs
  submittedAt?: Date
  submittedBy?: string
  rejectionReason?: string
  createdAt: Date
  updatedAt: Date
}

export interface TaxCalculations {
  grossIncome: number
  totalDeductions: number
  taxableIncome: number
  taxRate: number
  taxAmount: number
  penalties?: number
  refund?: number
}

/**
 * UAE-Specific Types
 */
export interface UAEVATFiling {
  inwardSupplies: {
    taxedSupplies: number
    zeroRatedSupplies: number
    exemptedSupplies: number
    outOfScopeSupplies: number
  }
  outwardSupplies: {
    taxedSupplies: number
    zeroRatedSupplies: number
    exemptedSupplies: number
    outOfScopeSupplies: number
  }
  inputTax: number
  outputTax: number
  netTax: number
  recoveryOfInputTax: number
  adjustments: number
}

export interface UAEESRFiling {
  economicSubstance: {
    businessPurpose: string
    managedExecution: boolean
    relevantPeople: boolean
    assetsBusiness: boolean
    relevantIncomeEarned: boolean
  }
  findings: string
  supportingDocuments: string[]
}

export interface UAECorporateTaxFiling {
  taxableIncome: number
  deductions: number
  taxableProfit: number
  applicableTaxRate: number
  taxPayable: number
  estimatedTax: number
  taxDue: number
}

/**
 * KSA-Specific Types
 */
export interface KSAVATFiling {
  taxableSalesValueDomestic: number
  taxableSalesValueExport: number
  inputTaxDomestic: number
  inputTaxImport: number
  netVATPayable: number
  adjustments: number
}

export interface KSAZakatFiling {
  zakat: {
    capitalAmount: number
    zakatBase: number
    zakatRate: number
    zakatAmountDue: number
  }
  agriculturalProduction?: number
  otherQualifyingAssets?: number
  exemptedAssets?: number
}

export interface KSAWHTFiling {
  whtTransactions: Array<{
    vendorName: string
    serviceDescription: string
    amount: number
    whtPercentage: number
    whtAmount: number
  }>
  totalAmount: number
  totalWHT: number
}

/**
 * Egypt-Specific Types
 */
export interface EgyptVATFiling {
  domesticSales: number
  exportSales: number
  inputTaxClaimable: number
  outputTax: number
  netVATPayable: number
}

export interface EgyptETAFiling {
  invoiceNumber: string
  invoiceIssueDate: Date
  invoiceDeliveryDate: Date
  seller: {
    name: string
    vatNumber: string
    address: string
  }
  buyer: {
    name: string
    vatNumber?: string
    address: string
  }
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    discount: number
    tax: number
    totalAmount: number
  }>
  totalTax: number
  totalAmount: number
}

/**
 * Filing Request/Response Types
 */
export interface CreateFilingRequest {
  entityId: string
  country: TaxCountry
  taxType: TaxType
  period: {
    startDate: Date
    endDate: Date
  }
  data: Record<string, unknown>
}

export interface FilingResponse {
  id: string
  status: FilingStatus
  calculations: TaxCalculations
  message: string
}

export interface SubmitFilingRequest {
  filingId: string
  documents: string[] // Document IDs
  comments?: string
}

/**
 * Validation Result
 */
export interface ValidationResult {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
    severity: 'error' | 'warning'
  }>
  warnings: string[]
}

/**
 * Filing Dashboard Stats
 */
export interface FilingStats {
  country: TaxCountry
  totalFiled: number
  pending: number
  overdue: number
  nextDueDate?: Date
  upcomingObligations: Array<{
    taxType: TaxType
    dueDate: Date
    status: 'upcoming' | 'overdue'
  }>
}
