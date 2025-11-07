import { Home, BarChart3, Users, UserCheck, Calendar, Briefcase, Clock, Settings, FileText, CreditCard, DollarSign, Shield, Bell, Zap } from 'lucide-react'
import type { NavGroup } from '@/types/dashboard'
import { PERMISSIONS } from '@/lib/permissions'

export const navGroups: NavGroup[] = [
  { label: 'Dashboard', items: [
    { label: 'Overview', href: '/admin', icon: Home, exact: true },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, permission: PERMISSIONS.ANALYTICS_VIEW },
  ]},
  { label: 'Bookings', items: [
    { label: 'Appointments', href: '/admin/bookings', icon: Calendar },
    { label: 'Services', href: '/admin/services', icon: Briefcase, permission: PERMISSIONS.SERVICES_VIEW },
    { label: 'Availability', href: '/admin/availability', icon: Clock, permission: PERMISSIONS.TEAM_VIEW },
    { label: 'Booking Settings', href: '/admin/settings/booking', icon: Settings, permission: PERMISSIONS.BOOKING_SETTINGS_VIEW },
    { label: 'Service Requests', href: '/admin/service-requests', icon: FileText, badge: '5', permission: PERMISSIONS.SERVICE_REQUESTS_READ_ALL },
  ]},
  { label: 'Accounting', permission: PERMISSIONS.ANALYTICS_VIEW, items: [
    { label: 'Invoices', href: '/admin/invoices', icon: FileText, permission: PERMISSIONS.ANALYTICS_VIEW },
    { label: 'Payments', href: '/admin/payments', icon: CreditCard, permission: PERMISSIONS.ANALYTICS_VIEW },
    { label: 'Expenses', href: '/admin/expenses', icon: DollarSign, permission: PERMISSIONS.ANALYTICS_VIEW },
    { label: 'Reports', href: '/admin/reports', icon: BarChart3, permission: PERMISSIONS.ANALYTICS_VIEW },
    { label: 'Taxes', href: '/admin/taxes', icon: Clock, permission: PERMISSIONS.ANALYTICS_VIEW },
  ]},
  { label: 'System', items: [
    { label: 'Settings', href: '/admin/settings', icon: Settings, permission: PERMISSIONS.BOOKING_SETTINGS_VIEW },
    { label: 'Notifications', href: '/admin/notifications', icon: Bell },
    { label: 'Integrations', href: '/admin/integrations', icon: Zap, permission: PERMISSIONS.ANALYTICS_VIEW },
  ]},
]
