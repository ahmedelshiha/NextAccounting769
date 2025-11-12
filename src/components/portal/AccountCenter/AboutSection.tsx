'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, Github, FileText, Check } from 'lucide-react'

const APP_VERSION = '2.4.0'
const BUILD_DATE = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const licenses = [
  {
    name: 'Next.js',
    version: '15.0+',
    license: 'MIT',
    url: 'https://github.com/vercel/next.js',
  },
  {
    name: 'React',
    version: '19.0+',
    license: 'MIT',
    url: 'https://github.com/facebook/react',
  },
  {
    name: 'Tailwind CSS',
    version: '4.0+',
    license: 'MIT',
    url: 'https://github.com/tailwindlabs/tailwindcss',
  },
  {
    name: 'Prisma',
    version: '5.0+',
    license: 'Apache 2.0',
    url: 'https://github.com/prisma/prisma',
  },
  {
    name: 'TypeScript',
    version: '5.0+',
    license: 'Apache 2.0',
    url: 'https://github.com/microsoft/TypeScript',
  },
]

const features = [
  'Multi-country tax compliance (UAE, KSA, Egypt)',
  'Real-time entity verification',
  'Intuitive business setup wizard',
  'Comprehensive compliance tracking',
  'Mobile-first responsive design',
  'Dark mode support',
  'Arabic language support (RTL)',
  'Enterprise-grade security',
]

export function AboutSection() {
  return (
    <div className="space-y-6">
      {/* App Info */}
      <Card>
        <CardHeader>
          <CardTitle>About TaxHub</CardTitle>
          <CardDescription>Tax compliance simplified for modern businesses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Version Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">App Version</p>
                <p className="font-mono font-bold text-lg">{APP_VERSION}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Build Date</p>
                <p className="font-mono font-bold text-lg">{BUILD_DATE}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Features</h3>
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Built with modern web technologies for performance, security, and user experience.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Legal & Links */}
      <Card>
        <CardHeader>
          <CardTitle>Legal & Documentation</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="/terms"
            className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center justify-between group"
          >
            <span className="font-medium text-sm">Terms of Service</span>
            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
          </a>
          <a
            href="/privacy"
            className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center justify-between group"
          >
            <span className="font-medium text-sm">Privacy Policy</span>
            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
          </a>
          <a
            href="/cookie-policy"
            className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center justify-between group"
          >
            <span className="font-medium text-sm">Cookie Policy</span>
            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
          </a>
          <a
            href="/accessibility"
            className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center justify-between group"
          >
            <span className="font-medium text-sm">Accessibility</span>
            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
          </a>
        </CardContent>
      </Card>

      {/* Open Source Licenses */}
      <Card>
        <CardHeader>
          <CardTitle>Open Source Licenses</CardTitle>
          <CardDescription>
            Built on the shoulders of giants. We use and love open source software.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {licenses.map((lib, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <div>
                  <p className="font-medium text-sm">{lib.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      v{lib.version}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {lib.license}
                    </Badge>
                  </div>
                </div>
                <a href={lib.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Credits */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900 dark:to-blue-900 border-purple-200 dark:border-purple-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Built by TaxHub Team
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            TaxHub is developed by a team of tax professionals and software engineers dedicated to
            simplifying tax compliance across the Middle East.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-2"
            >
              <a href="https://github.com/taxhub" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-2"
            >
              <a href="/changelog">
                <FileText className="h-4 w-4" />
                Changelog
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Get in Touch</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Have questions or feedback? We would love to hear from you.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              asChild
              className="justify-center"
            >
              <a href="mailto:hello@taxhub.io">Email Us</a>
            </Button>
            <Button
              variant="outline"
              asChild
              className="justify-center"
            >
              <a href="/support">Get Support</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
