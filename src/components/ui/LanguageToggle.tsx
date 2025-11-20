import { Suspense } from 'react';
import LanguageToggleClient from './LanguageToggleClient';
import { type Locale } from '@/lib/i18n';

interface LanguageToggleProps {
  currentLocale?: Locale
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function LanguageToggle(props: LanguageToggleProps) {
  return (
    <Suspense fallback={<div className="h-9 w-9 bg-gray-200 animate-pulse rounded-full" />}>
      <LanguageToggleClient {...props} />
    </Suspense>
  );
}

export default LanguageToggle;
