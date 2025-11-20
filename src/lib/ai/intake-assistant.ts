import { z } from 'zod'

/**
 * Intake Assistant Service
 * Guides new clients through onboarding with intelligent questionnaires
 * Collects required information for entity setup and compliance
 */

export type ClientType = 'INDIVIDUAL' | 'PARTNERSHIP' | 'CORPORATION' | 'LLC' | 'NONPROFIT'
export type ComplianceLevel = 'BASIC' | 'STANDARD' | 'ADVANCED' | 'ENTERPRISE'

export const IntakeQuestionSchema = z.object({
  id: z.string(),
  category: z.string(), // 'entity_type', 'business_info', 'jurisdiction', 'compliance', 'team'
  question: z.string(),
  type: z.enum(['text', 'select', 'multiselect', 'date', 'number', 'boolean', 'radio']),
  required: z.boolean(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
    description: z.string().optional(),
  })).optional(),
  helpText: z.string().optional(),
  validator: z.string().optional(), // e.g., 'email', 'phone', 'tax_id'
  conditional: z.object({
    dependsOn: z.string().optional(),
    showWhen: z.any().optional(),
  }).optional(),
})

export const IntakeResponseSchema = z.object({
  tenantId: z.string(),
  userId: z.string(),
  responses: z.record(z.string(), z.any()),
  completionPercentage: z.number().min(0).max(100),
  stage: z.enum(['started', 'in_progress', 'completed', 'abandoned']),
  generatedChecklist: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
    dueDate: z.date().optional(),
    completed: z.boolean(),
  })).optional(),
  recommendedProducts: z.array(z.string()).optional(),
  estimatedCompliance: z.object({
    level: z.enum(['BASIC','STANDARD','ADVANCED','ENTERPRISE']),
    obligations: z.array(z.string()),
    estimatedCost: z.number(),
    estimatedEffort: z.string(),
  }).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type IntakeQuestion = z.infer<typeof IntakeQuestionSchema>
export type IntakeResponse = z.infer<typeof IntakeResponseSchema>

/**
 * Generates questions dynamically based on client type and jurisdiction
 */
export function generateIntakeQuestions(clientType?: ClientType, country?: string): IntakeQuestion[] {
  const baseQuestions: IntakeQuestion[] = [
    {
      id: 'client_type',
      category: 'entity_type',
      question: 'What type of business entity are you?',
      type: 'radio',
      required: true,
      options: [
        { value: 'INDIVIDUAL', label: 'Sole Proprietor / Individual', description: 'Self-employed individual' },
        { value: 'PARTNERSHIP', label: 'Partnership', description: 'Two or more owners' },
        { value: 'CORPORATION', label: 'Corporation', description: 'Publicly or privately held' },
        { value: 'LLC', label: 'LLC / Limited Liability Company', description: 'Flexible liability protection' },
        { value: 'NONPROFIT', label: 'Non-Profit Organization', description: 'Tax-exempt organization' },
      ],
      helpText: 'Choose the structure that best describes your business',
    },
    {
      id: 'business_name',
      category: 'business_info',
      question: 'What is your business name?',
      type: 'text',
      required: true,
      helpText: 'Legal business name as registered',
    },
    {
      id: 'business_start_date',
      category: 'business_info',
      question: 'When did your business start?',
      type: 'date',
      required: false,
      helpText: 'Approximate or exact start date',
    },
    {
      id: 'annual_revenue',
      category: 'business_info',
      question: 'What is your estimated annual revenue?',
      type: 'select',
      required: false,
      options: [
        { value: 'under_50k', label: 'Under $50,000' },
        { value: '50k_250k', label: '$50,000 - $250,000' },
        { value: '250k_1m', label: '$250,000 - $1,000,000' },
        { value: '1m_5m', label: '$1,000,000 - $5,000,000' },
        { value: 'over_5m', label: 'Over $5,000,000' },
      ],
      helpText: 'This helps determine compliance requirements',
    },
  ]

  // Add jurisdiction-specific questions
  if (country === 'AE') {
    baseQuestions.push(
      {
        id: 'uae_zone',
        category: 'jurisdiction',
        question: 'Are you operating in an Economic Zone?',
        type: 'radio',
        required: false,
        options: [
          { value: 'none', label: 'Mainland (General)' },
          { value: 'dxb', label: 'Dubai (DIFC, DFSA, JAFZA, Dubai Internet City)' },
          { value: 'auh', label: 'Abu Dhabi (ADGM, ADIB)' },
          { value: 'other', label: 'Other Freezone' },
        ],
        helpText: 'Economic zones may have different tax and regulatory rules',
      },
      {
        id: 'vat_status',
        category: 'compliance',
        question: 'Do you currently have a VAT registration?',
        type: 'boolean',
        required: false,
        helpText: 'Required if annual turnover exceeds AED 375,000',
      }
    )
  } else if (country === 'SA') {
    baseQuestions.push(
      {
        id: 'vat_registration',
        category: 'compliance',
        question: 'Do you have a VAT registration number?',
        type: 'boolean',
        required: true,
        helpText: 'Required for businesses with revenue above SAR 375,000',
      },
      {
        id: 'zakat_liable',
        category: 'compliance',
        question: 'Do you have assets subject to Zakat?',
        type: 'boolean',
        required: false,
        helpText: 'Applies to businesses with significant assets',
      }
    )
  } else if (country === 'EG') {
    baseQuestions.push(
      {
        id: 'eta_eligible',
        category: 'compliance',
        question: 'Do you issue invoices electronically?',
        type: 'boolean',
        required: false,
        helpText: 'May require ETA (Egyptian Tax Authority) registration',
      }
    )
  }

  // Add team questions
  baseQuestions.push(
    {
      id: 'team_size',
      category: 'team',
      question: 'How many employees do you have?',
      type: 'select',
      required: false,
      options: [
        { value: '0', label: 'Just me (solo)' },
        { value: '1-5', label: '1-5 employees' },
        { value: '6-25', label: '6-25 employees' },
        { value: '26-100', label: '26-100 employees' },
        { value: '100+', label: 'Over 100 employees' },
      ],
      helpText: 'Helps determine payroll and HR compliance needs',
    },
    {
      id: 'accounting_software',
      category: 'team',
      question: 'Do you currently use accounting software?',
      type: 'select',
      required: false,
      options: [
        { value: 'none', label: 'Not yet' },
        { value: 'spreadsheet', label: 'Manual spreadsheets' },
        { value: 'quickbooks', label: 'QuickBooks' },
        { value: 'xero', label: 'Xero' },
        { value: 'sap', label: 'SAP' },
        { value: 'oracle', label: 'Oracle' },
        { value: 'other', label: 'Other' },
      ],
      helpText: 'We can help integrate with your existing systems',
    }
  )

  return baseQuestions
}

/**
 * Analyzes responses and generates recommended checklist
 */
export function generateComplianceChecklist(
  responses: Record<string, any>,
  country: string
): IntakeResponse['generatedChecklist'] {
  const clientType = responses.client_type as ClientType | undefined
  const annualRevenue = responses.annual_revenue as string | undefined
  const teamSize = responses.team_size as string | undefined

  const checklist: IntakeResponse['generatedChecklist'] = []

  // Tax registration checklist
  if (clientType === 'INDIVIDUAL') {
    checklist.push({
      id: 'tax-id',
      title: 'Obtain Tax Identification Number',
      description: `Get your ${country === 'AE' ? 'TRN' : country === 'SA' ? 'VAT Number' : 'TIN'} from the tax authority`,
      priority: 'high',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      completed: false,
    })
  } else if (clientType && ['CORPORATION', 'LLC', 'PARTNERSHIP'].includes(clientType)) {
    checklist.push({
      id: 'business-license',
      title: 'Obtain Business License',
      description: 'Register with the appropriate business registration authority',
      priority: 'high',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      completed: false,
    })

    if (country === 'AE') {
      checklist.push({
        id: 'vat-reg',
        title: 'Register for VAT',
        description: 'Required if annual turnover exceeds AED 375,000',
        priority: annualRevenue && ['250k_1m', '1m_5m', 'over_5m'].includes(annualRevenue) ? 'high' : 'medium',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        completed: responses.vat_status ? true : false,
      })
    } else if (country === 'SA') {
      checklist.push({
        id: 'vat-reg',
        title: 'Register for VAT',
        description: 'Required if annual turnover exceeds SAR 375,000',
        priority: 'high',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        completed: responses.vat_registration ? true : false,
      })
    }
  }

  // Accounting setup
  checklist.push({
    id: 'accounting-setup',
    title: 'Set up Accounting System',
    description: responses.accounting_software === 'none' 
      ? 'Choose and implement an accounting software'
      : 'Ensure your accounting system is properly configured',
    priority: 'high',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    completed: false,
  })

  // Payroll setup if has employees
  if (teamSize && !['0', ''].includes(teamSize)) {
    checklist.push({
      id: 'payroll-setup',
      title: 'Set up Payroll System',
      description: 'Configure payroll processing for employees',
      priority: 'high',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      completed: false,
    })

    checklist.push({
      id: 'employee-docs',
      title: 'Prepare Employment Agreements',
      description: 'Draft and execute employment contracts',
      priority: 'medium',
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      completed: false,
    })
  }

  // Bank account
  checklist.push({
    id: 'business-bank',
    title: 'Open Business Bank Account',
    description: 'Set up dedicated business banking',
    priority: 'high',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    completed: false,
  })

  return checklist
}

/**
 * Determines compliance level based on responses
 */
export function determineComplianceLevel(
  responses: Record<string, any>,
  country: string
): ComplianceLevel {
  const annualRevenue = responses.annual_revenue as string | undefined
  const teamSize = responses.team_size as string | undefined
  const clientType = responses.client_type as ClientType | undefined

  // Enterprise level: large revenue, many employees, corporation
  if (
    annualRevenue && ['1m_5m', 'over_5m'].includes(annualRevenue) &&
    teamSize && !['0', '1-5'].includes(teamSize)
  ) {
    return 'ENTERPRISE'
  }

  // Advanced: medium-high revenue, some employees
  if (
    (annualRevenue && ['250k_1m'].includes(annualRevenue)) ||
    (teamSize && ['6-25', '26-100'].includes(teamSize))
  ) {
    return 'ADVANCED'
  }

  // Standard: growing business
  if (
    annualRevenue && ['50k_250k'].includes(annualRevenue)
  ) {
    return 'STANDARD'
  }

  // Basic: individual or very small business
  return 'BASIC'
}

/**
 * Generates obligation list based on compliance level and country
 */
export function generateObligationsList(
  complianceLevel: ComplianceLevel,
  country: string
): string[] {
  const obligations: string[] = []

  // All levels
  if (country === 'AE') {
    obligations.push('Annual Financial Statement Filing')
  } else if (country === 'SA') {
    obligations.push('Zakat Declaration')
  } else if (country === 'EG') {
    obligations.push('Annual Tax Return')
  }

  // Standard and above
  if (['STANDARD', 'ADVANCED', 'ENTERPRISE'].includes(complianceLevel)) {
    if (country === 'AE') {
      obligations.push('Monthly VAT Returns', 'Economic Substance Report')
    } else if (country === 'SA') {
      obligations.push('Monthly VAT Returns', 'Withholding Tax Reports')
    } else if (country === 'EG') {
      obligations.push('Monthly VAT Returns', 'E-Invoice Filing')
    }
  }

  // Advanced and above
  if (['ADVANCED', 'ENTERPRISE'].includes(complianceLevel)) {
    obligations.push('Quarterly Internal Controls Review', 'External Audit Preparation')
  }

  // Enterprise only
  if (complianceLevel === 'ENTERPRISE') {
    obligations.push('Full Annual External Audit', 'SOX-style Controls Assessment')
  }

  return obligations
}

/**
 * Validates intake responses
 */
export function validateIntakeResponses(
  responses: Record<string, any>,
  questions: IntakeQuestion[]
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  for (const question of questions) {
    if (question.required && !responses[question.id]) {
      errors[question.id] = `${question.question} is required`
    }

    // Validate specific formats
    if (responses[question.id] && question.validator) {
      const value = responses[question.id]
      
      if (question.validator === 'email' && !value.includes('@')) {
        errors[question.id] = 'Please enter a valid email address'
      } else if (question.validator === 'phone' && !/^[\d\s\-\+\(\)]+$/.test(value)) {
        errors[question.id] = 'Please enter a valid phone number'
      } else if (question.validator === 'tax_id' && value.length < 8) {
        errors[question.id] = 'Tax ID must be at least 8 characters'
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
