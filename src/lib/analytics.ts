export type AnalyticsEvent =
  | 'ab_test_assigned'
  | 'calculator_used'
  | 'plan_selected'
  | 'consultation_requested'
  | 'upload_completed'
  | 'receipt_opened'
  | 'receipt_saved'
  | 'billing_sequence_created'
  | 'billing_sequence_updated'
  | 'compliance_viewed'
  | 'alert_dismissed'
  | 'security_center_viewed'
  | 'users.view_saved'
  | 'users.search'
  | 'users.bulk_apply'
  | 'users.redirect_legacy'
  | 'users.create_user'
  | 'users.edit_user'
  | 'users.delete_user'

export const EVENTS: Record<AnalyticsEvent, AnalyticsEvent> = {
  ab_test_assigned: 'ab_test_assigned',
  calculator_used: 'calculator_used',
  plan_selected: 'plan_selected',
  consultation_requested: 'consultation_requested',
  upload_completed: 'upload_completed',
  receipt_opened: 'receipt_opened',
  receipt_saved: 'receipt_saved',
  billing_sequence_created: 'billing_sequence_created',
  billing_sequence_updated: 'billing_sequence_updated',
  compliance_viewed: 'compliance_viewed',
  alert_dismissed: 'alert_dismissed',
  security_center_viewed: 'security_center_viewed',
  'users.view_saved': 'users.view_saved',
  'users.search': 'users.search',
  'users.bulk_apply': 'users.bulk_apply',
  'users.redirect_legacy': 'users.redirect_legacy',
  'users.create_user': 'users.create_user',
  'users.edit_user': 'users.edit_user',
  'users.delete_user': 'users.delete_user',
}

export const trackConversion = (eventName: string, data?: Record<string, any>) => {
  // Google Analytics 4
  if (typeof (globalThis as any).gtag !== 'undefined') {
    ;(globalThis as any).gtag('event', eventName, {
      event_category: 'conversion',
      event_label: data?.service || 'general',
      value: data?.value || 0,
      ...data
    })
  }

  // Facebook Pixel
  if (typeof (globalThis as any).fbq !== 'undefined') {
    ;(globalThis as any).fbq('track', eventName, data)
  }
}

export function trackEvent(eventName: AnalyticsEvent | string, properties: Record<string, any> = {}) {
  if (typeof window !== 'undefined') {
    try {
      ;(window as any).gtag?.('event', eventName, properties)
      ;(window as any).fbq?.('track', eventName, properties)
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({ event: eventName, properties, timestamp: Date.now() }),
      }).catch(() => {})
    } catch {}
  }
}

export default trackConversion
