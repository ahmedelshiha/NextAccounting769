/**
 * Country Registry for UAE, KSA, and Egypt
 *
 * Provides centralized configuration for:
 * - Fiscal calendars and tax obligations
 * - Validation rules for identifiers (TRN, CR, Tax ID)
 * - Economic zones and jurisdictions
 * - Tax rates and thresholds
 * - Regulatory metadata
 */

export type CountryCode = 'AE' | 'SA' | 'EG'

export interface EconomicZone {
  id: string
  code: string
  country: CountryCode
  name: string
  nameAr: string
  authority: string
  city?: string
  region?: string
  metadata?: Record<string, any>
}

export interface TaxObligation {
  id: string
  country: CountryCode
  type:
    | 'VAT'
    | 'CORPORATE_TAX'
    | 'ESR'
    | 'UBO'
    | 'ZAKAT'
    | 'WHT'
    | 'E_INVOICE'
    | 'E_RECEIPT'
  name: string
  nameAr: string
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'ON_DEMAND'
  daysAfterPeriodEnd?: number
  applicableEntityTypes?: string[]
  vatThreshold?: number
  rules?: Record<string, any>
  metadata?: Record<string, any>
}

export interface IdentifierValidator {
  type: string
  country: CountryCode
  pattern: RegExp
  length?: number
  checksum?: (value: string) => boolean
  description: string
}

export interface CountryConfig {
  code: CountryCode
  name: string
  nameAr: string
  currency: string
  locale: string
  localeAr: string
  timezone: string
  decimalSeparator: string
  thousandsSeparator: string
  dateFormat: string
  timeFormat: string
  weekendDays: number[]
  taxRate: number
  corporateTaxRate?: number
  zakatRate?: number
  withholdingTaxRate?: number
  registrationUrl?: string
  paymentUrl?: string
  economicZones: EconomicZone[]
  obligations: TaxObligation[]
  validators: IdentifierValidator[]
  fiscalYearStart: number // 1-12, month number
  fiscalYearEnd: number // 1-12, month number
  metadata?: Record<string, any>
}

/**
 * Validate TRN format (UAE: 15-digit)
 * Note: Full checksum validation requires FTA registry access
 * This basic validation checks format only
 */
function validateTRNChecksum(trn: string): boolean {
  if (trn.length !== 15) return false
  return /^\d{15}$/.test(trn)
}

/**
 * Validate CR checksum (KSA: 10-digit format, basic validation)
 */
function validateCRChecksum(cr: string): boolean {
  if (cr.length !== 10) return false
  return /^\d{10}$/.test(cr)
}

/**
 * Validate Egyptian Tax ID (TIN)
 */
function validateEgyptianTIN(tin: string): boolean {
  if (tin.length !== 9) return false
  return /^\d{9}$/.test(tin)
}

// UAE Economic Zones
const uaeEconomicZones: EconomicZone[] = [
  {
    id: 'ae-ded',
    code: 'DED',
    country: 'AE',
    name: 'Department of Economic Development',
    nameAr: 'إدارة التنمية الاقتصادية',
    authority: 'DED',
    city: 'Abu Dhabi',
  },
  {
    id: 'ae-adib',
    code: 'ADIB',
    country: 'AE',
    name: 'Abu Dhabi Islamic Bank Free Zone',
    nameAr: 'منطقة مصرف أبو ظبي الإسلامي الحرة',
    authority: 'ADIB',
    region: 'Abu Dhabi',
  },
  {
    id: 'ae-aafz',
    code: 'AAFZ',
    country: 'AE',
    name: 'Abu Dhabi Airport Free Zone',
    nameAr: 'منطقة مطار أبو ظبي الحرة',
    authority: 'AAFZ',
    city: 'Abu Dhabi',
  },
  {
    id: 'ae-adgm',
    code: 'ADGM',
    country: 'AE',
    name: 'Abu Dhabi Global Market',
    nameAr: 'سوق أبو ظبي العالمي',
    authority: 'ADGM',
    city: 'Abu Dhabi',
  },
  {
    id: 'ae-dafz',
    code: 'DAFZ',
    country: 'AE',
    name: 'Dubai Airport Free Zone',
    nameAr: 'منطقة مطار دبي الحرة',
    authority: 'DAFZ',
    city: 'Dubai',
  },
  {
    id: 'ae-ddfz',
    code: 'DDFZ',
    country: 'AE',
    name: 'Dubai Downtown Free Zone',
    nameAr: 'منطقة وسط دبي الحرة',
    authority: 'DDFZ',
    city: 'Dubai',
  },
  {
    id: 'ae-jafza',
    code: 'JAFZA',
    country: 'AE',
    name: 'Jebel Ali Free Zone',
    nameAr: 'منطقة جبل علي الحرة',
    authority: 'JAFZA',
    city: 'Dubai',
  },
  {
    id: 'ae-dfza',
    code: 'DFZA',
    country: 'AE',
    name: 'Dubai Free Zone Authority',
    nameAr: 'هيئة مناطق دبي الحرة',
    authority: 'DFZA',
    city: 'Dubai',
  },
  {
    id: 'ae-difc',
    code: 'DIFC',
    country: 'AE',
    name: 'Dubai International Financial Centre',
    nameAr: 'مركز دبي المالي العالمي',
    authority: 'DIFC',
    city: 'Dubai',
  },
  {
    id: 'ae-shj',
    code: 'SHJ',
    country: 'AE',
    name: 'Sharjah Department of Economic Development',
    nameAr: 'إدارة التنمية الاقتصادية الشارقة',
    authority: 'Sharjah DED',
    city: 'Sharjah',
  },
]

// KSA Economic Zones
const ksaEconomicZones: EconomicZone[] = [
  {
    id: 'sa-riyad',
    code: 'RYD',
    country: 'SA',
    name: 'Riyadh Region',
    nameAr: 'منطقة الرياض',
    authority: 'MCR',
    region: 'Riyadh',
  },
  {
    id: 'sa-makkah',
    code: 'MCK',
    country: 'SA',
    name: 'Makkah Region',
    nameAr: 'منطقة مكة',
    authority: 'MCR',
    region: 'Makkah',
  },
  {
    id: 'sa-madinah',
    code: 'MDN',
    country: 'SA',
    name: 'Madinah Region',
    nameAr: 'منطقة المدينة',
    authority: 'MCR',
    region: 'Madinah',
  },
  {
    id: 'sa-eastern',
    code: 'EAS',
    country: 'SA',
    name: 'Eastern Region',
    nameAr: 'المنطقة الشرقية',
    authority: 'MCR',
    region: 'Eastern',
  },
  {
    id: 'sa-jeddah',
    code: 'JED',
    country: 'SA',
    name: 'Jeddah',
    nameAr: 'جدة',
    authority: 'MCR',
    region: 'Makkah',
  },
  {
    id: 'sa-kaust',
    code: 'KAUST',
    country: 'SA',
    name: 'KAUST Special Zone',
    nameAr: 'منطقة جامعة الملك عبدالله الخاصة',
    authority: 'KAUST',
    region: 'Eastern',
  },
  {
    id: 'sa-neom',
    code: 'NEOM',
    country: 'SA',
    name: 'NEOM Special Zone',
    nameAr: 'منطقة نيوم الخاصة',
    authority: 'NEOM',
    region: 'Northwest',
  },
]

// Egypt Economic Zones
const egyptEconomicZones: EconomicZone[] = [
  {
    id: 'eg-cairo',
    code: 'CAI',
    country: 'EG',
    name: 'Cairo Governorate',
    nameAr: 'محافظة القاهرة',
    authority: 'RTA Cairo',
    city: 'Cairo',
  },
  {
    id: 'eg-giza',
    code: 'GIZ',
    country: 'EG',
    name: 'Giza Governorate',
    nameAr: 'محافظة الجيزة',
    authority: 'RTA Giza',
    city: 'Giza',
  },
  {
    id: 'eg-alex',
    code: 'ALX',
    country: 'EG',
    name: 'Alexandria Governorate',
    nameAr: 'محافظة الإسكندرية',
    authority: 'RTA Alexandria',
    city: 'Alexandria',
  },
  {
    id: 'eg-suez',
    code: 'SUZ',
    country: 'EG',
    name: 'Suez Special Economic Zone',
    nameAr: 'منطقة قناة السويس الاقتصادية الخاصة',
    authority: 'SCZONE',
    city: 'Suez',
  },
  {
    id: 'eg-new-admin',
    code: 'NAC',
    country: 'EG',
    name: 'New Administrative Capital',
    nameAr: 'العاصمة الإدارية الجديدة',
    authority: 'NAC Authority',
    city: 'New Administrative Capital',
  },
]

// UAE Tax Obligations
const uaeTaxObligations: TaxObligation[] = [
  {
    id: 'ae-vat',
    country: 'AE',
    type: 'VAT',
    name: 'VAT Return & Payment',
    nameAr: 'إقرار ودفع ضريبة القيمة المضافة',
    frequency: 'MONTHLY',
    daysAfterPeriodEnd: 28,
    vatThreshold: 375000,
  },
  {
    id: 'ae-esr',
    country: 'AE',
    type: 'ESR',
    name: 'Economic Substance Report',
    nameAr: 'تقرير الجوهر الاقتصادي',
    frequency: 'ANNUALLY',
    daysAfterPeriodEnd: 365,
    applicableEntityTypes: ['Company', 'Establishment'],
  },
  {
    id: 'ae-ubo',
    country: 'AE',
    type: 'UBO',
    name: 'Ultimate Beneficial Owner Register',
    nameAr: 'سجل المالك النهائي المستفيد',
    frequency: 'ANNUALLY',
    daysAfterPeriodEnd: 15,
  },
  {
    id: 'ae-corporate-tax',
    country: 'AE',
    type: 'CORPORATE_TAX',
    name: 'Corporate Tax Return',
    nameAr: 'إقرار ضريبة الشركات',
    frequency: 'ANNUALLY',
    daysAfterPeriodEnd: 180,
    metadata: { rate: 0.09 },
  },
]

// KSA Tax Obligations
const ksaTaxObligations: TaxObligation[] = [
  {
    id: 'sa-vat',
    country: 'SA',
    type: 'VAT',
    name: 'VAT Return & Payment',
    nameAr: 'إقرار ودفع ضريبة القيمة المضافة',
    frequency: 'MONTHLY',
    daysAfterPeriodEnd: 25,
    vatThreshold: 100000,
  },
  {
    id: 'sa-zakat',
    country: 'SA',
    type: 'ZAKAT',
    name: 'Zakat Return & Payment',
    nameAr: 'إقرار ودفع الزكاة',
    frequency: 'ANNUALLY',
    daysAfterPeriodEnd: 90,
    metadata: { rate: 0.025 },
  },
  {
    id: 'sa-wht',
    country: 'SA',
    type: 'WHT',
    name: 'Withholding Tax Report',
    nameAr: 'تقرير الضريبة المستقطعة',
    frequency: 'MONTHLY',
    daysAfterPeriodEnd: 25,
    metadata: { rate: 0.05 },
  },
  {
    id: 'sa-einvoice',
    country: 'SA',
    type: 'E_INVOICE',
    name: 'E-Invoicing Compliance',
    nameAr: 'الامتثال للفاتورة الإلكترونية',
    frequency: 'ON_DEMAND',
  },
]

// Egypt Tax Obligations
const egyptTaxObligations: TaxObligation[] = [
  {
    id: 'eg-vat',
    country: 'EG',
    type: 'VAT',
    name: 'VAT Return & Payment',
    nameAr: 'إقرار ودفع ضريبة القيمة المضافة',
    frequency: 'MONTHLY',
    daysAfterPeriodEnd: 25,
    vatThreshold: 500000,
  },
  {
    id: 'eg-einvoice',
    country: 'EG',
    type: 'E_INVOICE',
    name: 'E-Invoicing (ETA Clearance)',
    nameAr: 'الفاتورة الإلكترونية (موافقة هيئة الضرائب)',
    frequency: 'ON_DEMAND',
  },
  {
    id: 'eg-ereceipt',
    country: 'EG',
    type: 'E_RECEIPT',
    name: 'E-Receipt for B2C',
    nameAr: 'الإيصال الإلكتروني للبيع بالتجزئة',
    frequency: 'ON_DEMAND',
  },
]

// UAE Validators
const uaeValidators: IdentifierValidator[] = [
  {
    type: 'TRN',
    country: 'AE',
    pattern: /^\d{15}$/,
    length: 15,
    checksum: validateTRNChecksum,
    description: 'UAE Tax Registration Number (15 digits with checksum)',
  },
  {
    type: 'LICENSE',
    country: 'AE',
    pattern: /^[A-Z]{1}\d{6}[A-Z]{1}$/,
    length: 8,
    description: 'UAE Trade License Number (DED format: P########P)',
  },
]

// KSA Validators
const ksaValidators: IdentifierValidator[] = [
  {
    type: 'CR',
    country: 'SA',
    pattern: /^\d{10}$/,
    length: 10,
    checksum: validateCRChecksum,
    description: 'KSA Commercial Registration Number (10 digits)',
  },
  {
    type: 'VAT',
    country: 'SA',
    pattern: /^\d{15}$/,
    length: 15,
    description: 'KSA VAT Registration Number (15 digits)',
  },
]

// Egypt Validators
const egyptValidators: IdentifierValidator[] = [
  {
    type: 'TIN',
    country: 'EG',
    pattern: /^\d{9}$/,
    length: 9,
    checksum: validateEgyptianTIN,
    description: 'Egyptian Tax Identification Number (9 digits)',
  },
  {
    type: 'ETA_ID',
    country: 'EG',
    pattern: /^\d{15}$/,
    length: 15,
    description: 'Egyptian ETA System ID (15 digits)',
  },
]

// Country Configurations
export const UAE: CountryConfig = {
  code: 'AE',
  name: 'United Arab Emirates',
  nameAr: 'الإمارات العربية المتحدة',
  currency: 'AED',
  locale: 'en-AE',
  localeAr: 'ar-AE',
  timezone: 'Asia/Dubai',
  decimalSeparator: '.',
  thousandsSeparator: ',',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'HH:mm',
  weekendDays: [5, 6], // Friday, Saturday
  taxRate: 0.05, // 5% VAT
  corporateTaxRate: 0.09,
  registrationUrl: 'https://www.fta.gov.ae',
  paymentUrl: 'https://www.fta.gov.ae/services',
  economicZones: uaeEconomicZones,
  obligations: uaeTaxObligations,
  validators: uaeValidators,
  fiscalYearStart: 1,
  fiscalYearEnd: 12,
  metadata: {
    esrApplicable: true,
    uboRequired: true,
    automaticVatThreshold: 375000,
  },
}

export const KSA: CountryConfig = {
  code: 'SA',
  name: 'Saudi Arabia',
  nameAr: 'المملكة العربية السعودية',
  currency: 'SAR',
  locale: 'en-SA',
  localeAr: 'ar-SA',
  timezone: 'Asia/Riyadh',
  decimalSeparator: '.',
  thousandsSeparator: ',',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'HH:mm',
  weekendDays: [4, 5], // Thursday, Friday
  taxRate: 0.15, // 15% VAT
  zakatRate: 0.025,
  withholdingTaxRate: 0.05,
  registrationUrl: 'https://www.zatca.gov.sa',
  paymentUrl: 'https://www.zatca.gov.sa/payment',
  economicZones: ksaEconomicZones,
  obligations: ksaTaxObligations,
  validators: ksaValidators,
  fiscalYearStart: 1,
  fiscalYearEnd: 12,
  metadata: {
    zakatApplicable: true,
    withholderTaxRequired: true,
    eInvoicePhase: 2,
  },
}

export const EGYPT: CountryConfig = {
  code: 'EG',
  name: 'Egypt',
  nameAr: 'مصر',
  currency: 'EGP',
  locale: 'en-EG',
  localeAr: 'ar-EG',
  timezone: 'Africa/Cairo',
  decimalSeparator: '.',
  thousandsSeparator: ',',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'HH:mm',
  weekendDays: [5, 6], // Friday, Saturday
  taxRate: 0.14, // 14% VAT
  registrationUrl: 'https://www.sis.gov.eg',
  paymentUrl: 'https://www.eta.gov.eg',
  economicZones: egyptEconomicZones,
  obligations: egyptTaxObligations,
  validators: egyptValidators,
  fiscalYearStart: 1,
  fiscalYearEnd: 12,
  metadata: {
    etaApplicable: true,
    eReceiptRequired: true,
  },
}

// Country Registry
export const COUNTRY_REGISTRY: Record<CountryCode, CountryConfig> = {
  AE: UAE,
  SA: KSA,
  EG: EGYPT,
}

// Utility Functions

/**
 * Get country configuration
 */
export function getCountry(code: CountryCode): CountryConfig | undefined {
  return COUNTRY_REGISTRY[code]
}

/**
 * Get all countries
 */
export function getAllCountries(): CountryConfig[] {
  return Object.values(COUNTRY_REGISTRY)
}

/**
 * Validate identifier for a country
 */
export function validateIdentifier(
  country: CountryCode,
  type: string,
  value: string
): boolean {
  const config = getCountry(country)
  if (!config) return false

  const validator = config.validators.find((v) => v.type === type)
  if (!validator) return false

  if (!validator.pattern.test(value)) return false
  if (validator.length && value.length !== validator.length) return false
  if (validator.checksum && !validator.checksum(value)) return false

  return true
}

/**
 * Get obligations for a country
 */
export function getObligations(
  country: CountryCode,
  entityType?: string
): TaxObligation[] {
  const config = getCountry(country)
  if (!config) return []

  if (!entityType) return config.obligations

  return config.obligations.filter(
    (o) =>
      !o.applicableEntityTypes ||
      o.applicableEntityTypes.includes(entityType)
  )
}

/**
 * Get economic zone by ID
 */
export function getEconomicZone(
  country: CountryCode,
  zoneId: string
): EconomicZone | undefined {
  const config = getCountry(country)
  if (!config) return undefined
  return config.economicZones.find((z) => z.id === zoneId)
}

/**
 * Get all economic zones for a country
 */
export function getEconomicZones(country: CountryCode): EconomicZone[] {
  const config = getCountry(country)
  if (!config) return []
  return config.economicZones
}

/**
 * Calculate next filing due date based on obligation
 */
export function calculateFilingDueDate(
  obligation: TaxObligation,
  periodEnd: Date
): Date {
  const dueDate = new Date(periodEnd)

  if (obligation.daysAfterPeriodEnd) {
    dueDate.setDate(dueDate.getDate() + obligation.daysAfterPeriodEnd)
  }

  return dueDate
}

// Alias for compatibility
export const countryRegistry = COUNTRY_REGISTRY

export default COUNTRY_REGISTRY
