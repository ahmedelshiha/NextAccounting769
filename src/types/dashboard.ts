import { ReactNode } from 'react'

// Core icon type for lucide-react icons or custom SVGs
export type IconType = React.ComponentType<{ className?: string }>

import type * as React from 'react'
import type { Permission } from '@/lib/permissions'

// Navigation
export interface NavItem {
  label: string
  href: string
  icon: IconType
  badge?: string | number
  permission?: Permission
  exact?: boolean
}

export interface NavGroup {
  label: string
  items: NavItem[]
  permission?: Permission
}

// Tabs (primary/secondary)
export interface TabItem {
  key: string
  label: string
  count?: number | null
}

// Filters
export interface FilterOption { value: string; label: string }
export interface FilterConfig { 
  key: string; 
  label: string; 
  type?: string;
  options?: FilterOption[]; 
  value?: string;
  defaultValue?: string;
}

// Header action items
export interface ActionItem { 
  label: string; 
  icon?: IconType | React.ReactNode; 
  onClick?: () => void; 
  href?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  disabled?: boolean 
}

// Tables
export type Align = 'left' | 'center' | 'right'
export interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  align?: Align
  render?: (value: any, row: T) => React.ReactNode
}

export interface RowAction<T> {
  label: string
  onClick: (row: T) => void
  handler?: (row: T) => void
  icon?: React.ReactNode
  variant?: 'default' | 'destructive'
  disabled?: boolean | ((row: T) => boolean)
}
