import React from 'react'
import { LanguagesTab as LanguagesTabComponent } from './LanguagesTab'
import { OrganizationTab as OrganizationTabComponent } from './OrganizationTab'
import { UserPreferencesTab as UserPreferencesTabComponent } from './UserPreferencesTab'
import { RegionalFormatsTab as RegionalFormatsTabComponent } from './RegionalFormatsTab'
import { IntegrationTab as IntegrationTabComponent } from './IntegrationTab'
import { TranslationsTab as TranslationsTabComponent } from './TranslationsTab'
import { AnalyticsTab as AnalyticsTabComponent } from './AnalyticsTab'
import { DiscoveryTab as DiscoveryTabComponent } from './DiscoveryTab'
import { HeatmapTab as HeatmapTabComponent } from './HeatmapTab'

// Memoize tab components to prevent unnecessary re-renders
export const LanguagesTab = React.memo(LanguagesTabComponent)
export const OrganizationTab = React.memo(OrganizationTabComponent)
export const UserPreferencesTab = React.memo(UserPreferencesTabComponent)
export const RegionalFormatsTab = React.memo(RegionalFormatsTabComponent)
export const IntegrationTab = React.memo(IntegrationTabComponent)
export const TranslationsTab = React.memo(TranslationsTabComponent)
export const AnalyticsTab = React.memo(AnalyticsTabComponent)
export const DiscoveryTab = React.memo(DiscoveryTabComponent)
export const HeatmapTab = React.memo(HeatmapTabComponent)
