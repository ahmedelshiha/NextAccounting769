import { z } from 'zod'

/**
 * WCAG 2.2 AA Accessibility Audit Service
 * Provides tools for auditing and improving web accessibility compliance
 */

export const AccessibilityIssueSchema = z.object({
  id: z.string(),
  wcagCriteria: z.string(), // e.g., '1.4.3', '2.1.1'
  level: z.enum(['A', 'AA', 'AAA']),
  category: z.enum([
    'PERCEIVABLE',
    'OPERABLE',
    'UNDERSTANDABLE',
    'ROBUST'
  ]),
  severity: z.enum(['ERROR', 'WARNING', 'NOTICE']),
  element: z.string().optional(), // CSS selector
  description: z.string(),
  impact: z.string(),
  remediation: z.string(),
  affectedElements: z.number().optional(),
  detectedAt: z.date(),
  resolved: z.boolean().default(false),
  resolvedAt: z.date().optional(),
})

export const AccessibilityAuditSchema = z.object({
  id: z.string(),
  pageUrl: z.string(),
  pageTitle: z.string(),
  scanDate: z.date(),
  complianceLevel: z.enum(['NOT_CHECKED', 'FAIL', 'PARTIAL', 'PASS']),
  targetLevel: z.enum(['A', 'AA', 'AAA']).default('AA'),
  issues: z.array(AccessibilityIssueSchema),
  summary: z.object({
    errors: z.number(),
    warnings: z.number(),
    notices: z.number(),
    total: z.number(),
  }),
  recommendations: z.array(z.string()),
  estimatedRemediationHours: z.number().optional(),
})

export type AccessibilityIssue = z.infer<typeof AccessibilityIssueSchema>
export type AccessibilityAudit = z.infer<typeof AccessibilityAuditSchema>

/**
 * WCAG 2.2 Success Criteria and requirements
 */
const WCAG_CRITERIA: Record<string, {
  description: string
  category: string
  level: 'A' | 'AA' | 'AAA'
}> = {
  '1.1.1': {
    description: 'Non-text Content',
    category: 'PERCEIVABLE',
    level: 'A'
  },
  '1.3.1': {
    description: 'Info and Relationships',
    category: 'PERCEIVABLE',
    level: 'A'
  },
  '1.4.3': {
    description: 'Contrast (Minimum)',
    category: 'PERCEIVABLE',
    level: 'AA'
  },
  '1.4.11': {
    description: 'Non-text Contrast',
    category: 'PERCEIVABLE',
    level: 'AA'
  },
  '2.1.1': {
    description: 'Keyboard',
    category: 'OPERABLE',
    level: 'A'
  },
  '2.1.2': {
    description: 'No Keyboard Trap',
    category: 'OPERABLE',
    level: 'A'
  },
  '2.4.7': {
    description: 'Focus Visible',
    category: 'OPERABLE',
    level: 'AA'
  },
  '3.1.1': {
    description: 'Language of Page',
    category: 'UNDERSTANDABLE',
    level: 'A'
  },
  '3.2.1': {
    description: 'On Focus',
    category: 'UNDERSTANDABLE',
    level: 'A'
  },
  '3.3.1': {
    description: 'Error Identification',
    category: 'UNDERSTANDABLE',
    level: 'A'
  },
  '4.1.2': {
    description: 'Name, Role, Value',
    category: 'ROBUST',
    level: 'A'
  },
  '4.1.3': {
    description: 'Status Messages',
    category: 'ROBUST',
    level: 'AA'
  },
}

/**
 * Common accessibility issues and remediations
 */
const COMMON_ISSUES: AccessibilityIssue[] = [
  {
    id: 'missing-alt-text',
    wcagCriteria: '1.1.1',
    level: 'A',
    category: 'PERCEIVABLE',
    severity: 'ERROR',
    description: 'Images missing alternative text',
    impact: 'Screen reader users cannot understand the content or purpose of images',
    remediation: 'Add descriptive alt text to all images using the alt attribute',
    detectedAt: new Date(),
    resolved: false,
  },
  {
    id: 'low-contrast',
    wcagCriteria: '1.4.3',
    level: 'AA',
    category: 'PERCEIVABLE',
    severity: 'ERROR',
    description: 'Insufficient color contrast between text and background',
    impact: 'Users with low vision cannot read text with poor contrast',
    remediation: 'Ensure text contrast ratio is at least 4.5:1 for normal text or 3:1 for large text',
    detectedAt: new Date(),
    resolved: false,
  },
  {
    id: 'keyboard-navigation',
    wcagCriteria: '2.1.1',
    level: 'A',
    category: 'OPERABLE',
    severity: 'ERROR',
    description: 'Content not accessible via keyboard',
    impact: 'Users who cannot use a mouse cannot access or navigate the content',
    remediation: 'Ensure all interactive elements can be accessed and operated with keyboard alone',
    detectedAt: new Date(),
    resolved: false,
  },
  {
    id: 'missing-focus-indicator',
    wcagCriteria: '2.4.7',
    level: 'AA',
    category: 'OPERABLE',
    severity: 'WARNING',
    description: 'Focus indicator not visible',
    impact: 'Keyboard users cannot easily determine which element has focus',
    remediation: 'Ensure focused elements have a visible outline or other focus indicator',
    detectedAt: new Date(),
    resolved: false,
  },
  {
    id: 'missing-form-labels',
    wcagCriteria: '3.2.1',
    level: 'A',
    category: 'UNDERSTANDABLE',
    severity: 'ERROR',
    description: 'Form inputs missing associated labels',
    impact: 'Screen reader users cannot understand what information is required',
    remediation: 'Associate all form inputs with labels using the <label> element',
    detectedAt: new Date(),
    resolved: false,
  },
  {
    id: 'missing-page-language',
    wcagCriteria: '3.1.1',
    level: 'A',
    category: 'UNDERSTANDABLE',
    severity: 'WARNING',
    description: 'Page language not specified',
    impact: 'Screen readers may use incorrect pronunciation',
    remediation: 'Add lang attribute to html element',
    detectedAt: new Date(),
    resolved: false,
  },
  {
    id: 'missing-heading-structure',
    wcagCriteria: '1.3.1',
    level: 'A',
    category: 'PERCEIVABLE',
    severity: 'WARNING',
    description: 'Improper heading structure',
    impact: 'Screen reader users cannot navigate page structure effectively',
    remediation: 'Use heading elements (h1-h6) in proper sequential order',
    detectedAt: new Date(),
    resolved: false,
  },
]

/**
 * Checks for common accessibility issues
 */
export function checkAccessibilityIssues(
  html: string,
  options?: {
    checkLanguage?: boolean
    checkContrast?: boolean
    checkKeyboard?: boolean
  }
): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = []

  // Check for images without alt text
  const imgRegex = /<img[^>]*>/gi
  const images = html.match(imgRegex) || []
  for (const img of images) {
    if (!img.includes('alt=')) {
      issues.push({
        ...COMMON_ISSUES[0],
        id: `missing-alt-${Math.random().toString(36).substr(2, 9)}`,
        affectedElements: (issues.filter(i => i.id.includes('missing-alt')).length) + 1,
        detectedAt: new Date(),
      })
      break // Count as one issue type
    }
  }

  // Check for language attribute
  if (options?.checkLanguage !== false) {
    if (!html.includes('lang=')) {
      issues.push({
        ...COMMON_ISSUES[5],
        id: 'missing-lang-attr',
        detectedAt: new Date(),
      })
    }
  }

  // Check for heading structure (h1 should be present)
  if (!html.includes('<h1')) {
    issues.push({
      ...COMMON_ISSUES[6],
      id: 'no-h1-found',
      detectedAt: new Date(),
    })
  }

  // Check for form labels
  const inputRegex = /<input[^>]*>/gi
  const inputs = html.match(inputRegex) || []
  const labelRegex = /<label[^>]*>/gi
  const labels = html.match(labelRegex) || []
  
  if (inputs.length > labels.length) {
    issues.push({
      ...COMMON_ISSUES[4],
      id: 'missing-form-labels',
      affectedElements: inputs.length - labels.length,
      detectedAt: new Date(),
    })
  }

  return issues
}

/**
 * Checks color contrast ratio
 */
export function checkContrast(
  foreground: string,
  background: string
): {
  ratio: number
  passesAA: boolean
  passesAAA: boolean
  normalText: boolean
  largeText: boolean
} {
  // Parse hex colors to RGB
  const toRGB = (hex: string): [number, number, number] => {
    const match = hex.replace('#', '').match(/.{2}/g)
    return match ? [
      parseInt(match[0], 16),
      parseInt(match[1], 16),
      parseInt(match[2], 16),
    ] : [0, 0, 0]
  }

  // Calculate luminance
  const getLuminance = (rgb: [number, number, number]): number => {
    const [r, g, b] = rgb.map(val => {
      const normalized = val / 255
      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const l1 = getLuminance(toRGB(foreground))
  const l2 = getLuminance(toRGB(background))
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  const ratio = (lighter + 0.05) / (darker + 0.05)

  return {
    ratio: Math.round(ratio * 100) / 100,
    passesAA: ratio >= 4.5,
    passesAAA: ratio >= 7,
    normalText: ratio >= 4.5,
    largeText: ratio >= 3,
  }
}

/**
 * RTL-specific accessibility checks
 */
export function checkRTLAccessibility(
  html: string
): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = []

  // Check for dir attribute
  if (!html.includes('dir=') && !html.includes('dir ="')) {
    issues.push({
      id: 'missing-dir-attr',
      wcagCriteria: '3.1.1',
      level: 'A',
      category: 'UNDERSTANDABLE',
      severity: 'WARNING',
      description: 'Missing dir attribute for RTL content',
      impact: 'Screen readers may not correctly announce text direction',
      remediation: 'Add dir="rtl" to html element for Arabic/Hebrew/Urdu content',
      detectedAt: new Date(),
      resolved: false,
    })
  }

  // Check for unicode direction marks (common in RTL)
  if (html.includes('&#x202E;') || html.includes('&rlm;')) {
    issues.push({
      id: 'unicode-direction-marks',
      wcagCriteria: '1.3.1',
      level: 'A',
      category: 'PERCEIVABLE',
      severity: 'NOTICE',
      description: 'Using Unicode direction marks instead of CSS',
      impact: 'May cause unexpected behavior in screen readers',
      remediation: 'Use CSS text-align and direction properties instead of Unicode marks',
      detectedAt: new Date(),
      resolved: false,
    })
  }

  return issues
}

/**
 * Generates audit report
 */
export function generateAuditReport(
  pageUrl: string,
  pageTitle: string,
  issues: AccessibilityIssue[],
  targetLevel: 'A' | 'AA' | 'AAA' = 'AA'
): AccessibilityAudit {
  const errors = issues.filter(i => i.severity === 'ERROR').length
  const warnings = issues.filter(i => i.severity === 'WARNING').length
  const notices = issues.filter(i => i.severity === 'NOTICE').length

  // Determine compliance level
  let complianceLevel: 'NOT_CHECKED' | 'FAIL' | 'PARTIAL' | 'PASS' = 'PASS'
  const targetLevelIssues = issues.filter(i => {
    if (targetLevel === 'AA') return i.level === 'A' || i.level === 'AA'
    if (targetLevel === 'AAA') return i.level === 'A' || i.level === 'AA' || i.level === 'AAA'
    return i.level === 'A'
  })

  if (targetLevelIssues.length > 0) {
    if (errors > 0) {
      complianceLevel = 'FAIL'
    } else {
      complianceLevel = 'PARTIAL'
    }
  }

  // Generate recommendations
  const recommendations: string[] = []
  const uniqueRemediations = new Set(
    targetLevelIssues.map(i => i.remediation)
  )
  uniqueRemediations.forEach(r => recommendations.push(r))

  return {
    id: Math.random().toString(36).substr(2, 9),
    pageUrl,
    pageTitle,
    scanDate: new Date(),
    complianceLevel,
    targetLevel,
    issues: targetLevelIssues,
    summary: {
      errors,
      warnings,
      notices,
      total: issues.length,
    },
    recommendations: Array.from(recommendations),
    estimatedRemediationHours: Math.ceil(errors * 0.5 + warnings * 0.25),
  }
}
