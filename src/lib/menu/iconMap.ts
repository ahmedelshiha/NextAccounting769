/**
 * Icon mapping utility
 * Maps icon name strings to actual lucide-react icon components
 */

import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Calendar,
  Clock,
  Users,
  Mail,
  Briefcase,
  FileText,
  CreditCard,
  Receipt,
  DollarSign,
  CheckSquare,
  UserCog,
  Shield,
  Upload,
  Bell,
  HelpCircle,
  Home,
  Target,
  Building,
  LucideIcon,
} from 'lucide-react'

export const iconMap: { [key: string]: LucideIcon } = {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Calendar,
  Clock,
  Users,
  Mail,
  Briefcase,
  FileText,
  CreditCard,
  Receipt,
  DollarSign,
  CheckSquare,
  UserCog,
  Shield,
  Upload,
  Bell,
  HelpCircle,
  Home,
  Target,
  Building,
}

/**
 * Get icon component by name string
 */
export const getIconComponent = (iconName: string | undefined): LucideIcon => {
  if (!iconName) return Briefcase
  return iconMap[iconName] || Briefcase
}
