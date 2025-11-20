'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useIntegrations } from '../hooks/useIntegrations'
import { Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'

interface IntegrationCardProps {
  id: string
  name: string
  description: string
  enabled: boolean
  configured: boolean
  features: string[]
  icon: string
  docs?: string
  onConfigure: (webhookUrl: string) => void
  onTest: (webhookUrl: string) => void
  loading?: boolean
}

function IntegrationCard({
  id,
  name,
  description,
  enabled,
  configured,
  features,
  icon,
  docs,
  onConfigure,
  onTest,
  loading = false,
}: IntegrationCardProps) {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [showConfig, setShowConfig] = useState(false)

  const handleConfigure = async () => {
    if (!webhookUrl.trim()) return
    await onConfigure(webhookUrl)
    setWebhookUrl('')
    setShowConfig(false)
  }

  const handleTest = async () => {
    if (!webhookUrl.trim()) return
    await onTest(webhookUrl)
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <div className="text-2xl">{getIntegrationIcon(icon)}</div>
      </div>

      {/* Features list */}
      <div className="space-y-1">
        {features.map((feature) => (
          <div key={feature} className="text-sm text-gray-700 flex items-center">
            <span className="mr-2">•</span>
            {feature}
          </div>
        ))}
      </div>

      {/* Configuration form */}
      {showConfig && (
        <div className="space-y-2 bg-gray-50 p-4 rounded">
          <label className="block text-sm font-medium">Webhook URL</label>
          <Input
            type="url"
            placeholder={`https://hooks.${id}.com/webhooks/...`}
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            disabled={loading}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleConfigure}
              disabled={loading || !webhookUrl.trim()}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleTest}
              disabled={loading || !webhookUrl.trim()}
            >
              Test Connection
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowConfig(false)
                setWebhookUrl('')
              }}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Status and actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-2">
          {configured && (
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle className="h-4 w-4" />
              Configured
            </div>
          )}
          {!configured && enabled && (
            <div className="flex items-center gap-1 text-yellow-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              Not configured
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!showConfig ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowConfig(true)}
                disabled={loading}
              >
                Configure
              </Button>
              {docs && (
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                >
                  <a href={docs} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Docs
                  </a>
                </Button>
              )}
            </>
          ) : null}
        </div>
      </div>
    </Card>
  )
}

function getIntegrationIcon(icon: string): React.ReactNode {
  const icons: Record<string, string> = {
    slack: '🔵',
    zapier: '⚡',
    webhook: '🔗',
    teams: '👥',
  }
  return icons[icon] || '🔌'
}

export function IntegrationHub() {
  const { integrations, loading, configureIntegration, testIntegration } = useIntegrations()
  const [testingPlatform, setTestingPlatform] = useState<string | null>(null)

  const handleConfigure = async (platform: string, webhookUrl: string) => {
    try {
      const config: Record<string, any> = {}
      config[platform] = { webhookUrl }
      await configureIntegration(config)
    } catch (error) {
      // Error is handled by hook
    }
  }

  const handleTest = async (platform: string, webhookUrl: string) => {
    try {
      setTestingPlatform(platform)
      await testIntegration(platform as any, webhookUrl)
    } finally {
      setTestingPlatform(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Integration Hub</h2>
        <p className="text-gray-600">
          Connect external platforms to enhance your filter bar with automation and notifications
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(integrations).map(([id, integration]) => (
          <IntegrationCard
            key={id}
            id={id}
            {...integration}
            onConfigure={(url) => handleConfigure(id, url)}
            onTest={(url) => handleTest(id, url)}
            loading={testingPlatform === id}
          />
        ))}
      </div>

      {Object.keys(integrations).length === 0 && (
        <Card className="p-12 text-center space-y-4">
          <p className="text-gray-600">No integrations available</p>
          <p className="text-sm text-gray-500">
            Come back soon for new integration options
          </p>
        </Card>
      )}
    </div>
  )
}
