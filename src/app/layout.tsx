import './globals.css'
import { TranslationProvider } from '@/components/providers/translation-provider'
import { ClientLayout } from '@/components/providers/client-layout'
import { Inter } from 'next/font/google'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SchemaMarkup } from '@/components/seo/SchemaMarkup'
import { getEffectiveOrgSettingsFromHeaders } from '@/lib/org-settings'
import { SettingsProvider } from '@/components/providers/SettingsProvider'
import { locales, type Locale, localeConfig } from '@/lib/i18n'
import '@/styles/dark-mode.css'

const inter = Inter({ subsets: ['latin'] })

// Import fonts that support Arabic and other scripts
import { Noto_Sans_Arabic } from 'next/font/google'

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-arabic',
})

export const metadata = {
  title: 'Professional Accounting Services | Accounting Firm',
  description: 'Stress-free accounting for growing businesses. Expert bookkeeping, tax preparation, payroll management, and CFO advisory services. Book your free consultation today.',
  keywords: ['accounting', 'bookkeeping', 'tax preparation', 'payroll', 'CFO advisory', 'small business accounting'],
  authors: [{ name: 'Accounting Firm' }],
  creator: 'Accounting Firm',
  publisher: 'Accounting Firm',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
} satisfies import('next').Metadata

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Guard getServerSession with a short timeout to avoid blocking rendering when auth DB is slow
  let session = null as any
  try {
    session = await Promise.race([
      getServerSession(authOptions),
      new Promise(resolve => setTimeout(() => resolve(null), 500)),
    ])
  } catch {
    session = null
  }

  // Load organization defaults with tenant scoping (server-side, no auth required for read)
  let orgLocale: Locale = 'en'
  let orgName = 'Accounting Firm'
  let orgLogoUrl: string | null | undefined = null
  let contactEmail: string | null | undefined = null
  let contactPhone: string | null | undefined = null
  let legalLinks: Record<string, string> | null | undefined = null
  try {
    const eff = await getEffectiveOrgSettingsFromHeaders()
    const locale = eff.locale || 'en'
    // Validate locale is supported
    orgLocale = locales.includes(locale as Locale) ? (locale as Locale) : 'en'
    orgName = eff.name || orgName
    orgLogoUrl = eff.logoUrl ?? null
    contactEmail = eff.contactEmail ?? null
    contactPhone = eff.contactPhone ?? null
    legalLinks = eff.legalLinks ?? null
  } catch {}

  // Load user's preferred locale if authenticated
  let userLocale: Locale = orgLocale
  if (session?.user?.email && session?.user?.tenantId) {
    try {
      const { getUserPreferredLocale } = await import('@/lib/server/get-user-preferred-locale')
      userLocale = await getUserPreferredLocale(session.user.email, session.user.tenantId, orgLocale)
    } catch {
      // Silently fall back to organization locale on any error
      userLocale = orgLocale
    }
  }

  // Load server-side translations to avoid client double-fetch and FOUC
  let serverTranslations: Record<string, string> | undefined = undefined
  try {
    const { getServerTranslations } = await import('@/lib/server/translations')
    serverTranslations = await getServerTranslations(userLocale)
  } catch (err) {
    // If server-side loader fails, we fall back to client-side loading
    serverTranslations = undefined
  }

  const dir = userLocale === 'ar' ? 'rtl' : 'ltr'

  return (
    <html lang={userLocale} dir={dir} className={userLocale === 'ar' ? notoSansArabic.variable : ''}>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/next.svg" />
        <meta name="theme-color" content="#0ea5e9" />
        {/* Early removal of instrumentation attributes to avoid hydration mismatches */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{if(typeof document==='undefined')return;var els=document.getElementsByTagName('*');for(var i=0;i<els.length;i++){var a=els[i].attributes;for(var j=a.length-1;j>=0;j--){var n=a[j].name;if(/^bis_/i.test(n)||n.indexOf('bis_')===0||n.indexOf('bis')===0){try{els[i].removeAttribute(n)}catch(e){}}}}}catch(e){} })();` }} />
        {/* Expose selected runtime env vars to client in a small safe object to support feature flags at runtime */}
        <script dangerouslySetInnerHTML={{ __html: `window.__ENV__ = Object.assign(window.__ENV__ || {}, { NEXT_PUBLIC_MENU_CUSTOMIZATION_ENABLED: ${JSON.stringify(process.env.NEXT_PUBLIC_MENU_CUSTOMIZATION_ENABLED)} });` }} />
      </head>
      <body className={`${inter.className} ${userLocale === 'ar' ? notoSansArabic.className : ''}`} suppressHydrationWarning>
        {/* Global skip link for keyboard users */}
        <a
          href="#site-main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-white focus:text-blue-600 focus:ring-2 focus:ring-blue-600 focus:px-3 focus:py-2 rounded"
        >
          Skip to main content
        </a>
        <TranslationProvider initialLocale={userLocale as any} initialTranslations={serverTranslations}>
          <SettingsProvider initialSettings={{ name: orgName, logoUrl: orgLogoUrl ?? null, contactEmail: contactEmail ?? null, contactPhone: contactPhone ?? null, legalLinks: legalLinks ?? null, defaultLocale: orgLocale }}>
              <ClientLayout
                session={session}
                orgName={orgName}
                orgLogoUrl={orgLogoUrl || undefined}
                contactEmail={contactEmail || undefined}
                contactPhone={contactPhone || undefined}
                legalLinks={legalLinks || undefined}
                locale={userLocale}
              >
                {children}
              </ClientLayout>
          </SettingsProvider>
        </TranslationProvider>

        {/* Structured data for SEO */}
        <SchemaMarkup />

        {/* Remove third-party instrumentation attributes (bis_*) from server HTML early on the client to avoid hydration mismatches */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{if(typeof document==='undefined')return;var els=document.getElementsByTagName('*');for(var i=0;i<els.length;i++){var a=els[i].attributes;for(var j=a.length-1;j>=0;j--){var n=a[j].name;if(/^bis_/i.test(n)||n.indexOf('bis_')===0||n.indexOf('bis')===0){try{els[i].removeAttribute(n)}catch(e){}}}}}catch(e){} })();` }} />

        {/* Performance monitoring: report page load time to analytics (gtag stub) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function(){
              try {
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    try {
                      var navigation = performance.getEntriesByType('navigation')[0];
                      if (navigation && typeof gtag !== 'undefined') {
                        var loadTime = navigation.loadEventEnd - navigation.fetchStart || 0;
                        gtag('event', 'page_load_time', { event_category: 'Performance', value: Math.round(loadTime) });
                      }
                    } catch(e){}
                  }, 0);
                });
              } catch(e){}
            })();
          `,
          }}
        />
      </body>
    </html>
  )
}
