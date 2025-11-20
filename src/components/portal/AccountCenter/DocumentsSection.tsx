'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, FileText, Download, Star, Folder } from 'lucide-react'
import { toast } from 'sonner'

interface Document {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: string
  isStarred: boolean
  category: string
}

export function DocumentsSection() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'recent' | 'starred'>('recent')

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/documents?limit=10')
        if (!response.ok) throw new Error('Failed to fetch documents')
        const data = await response.json()
        setDocuments(data.documents || [])
      } catch (error) {
        toast.error('Failed to load documents')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocuments()
  }, [])

  const handleToggleStar = async (docId: string) => {
    try {
      const response = await fetch(`/api/documents/${docId}/star`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to update star status')
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === docId ? { ...doc, isStarred: !doc.isStarred } : doc
        )
      )
    } catch (error) {
      toast.error('Failed to update document')
    }
  }

  const handleDownload = async (docId: string, docName: string) => {
    try {
      const response = await fetch(`/api/documents/${docId}/download`)
      if (!response.ok) throw new Error('Download failed')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = docName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast.error('Failed to download document')
    }
  }

  const filteredDocs = activeTab === 'starred' ? documents.filter((d) => d.isStarred) : documents

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Documents & Files</CardTitle>
          <CardDescription>Quick access to your uploaded documents and files</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('recent')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
                activeTab === 'recent'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400'
              }`}
            >
              Recent ({documents.length})
            </button>
            <button
              onClick={() => setActiveTab('starred')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
                activeTab === 'starred'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400'
              }`}
            >
              Starred ({documents.filter((d) => d.isStarred).length})
            </button>
          </div>

          {filteredDocs.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {activeTab === 'recent'
                  ? 'No documents uploaded yet'
                  : 'No starred documents yet'}
              </p>
              <Button asChild variant="outline">
                <a href="/portal/documents">Go to Documents</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {doc.category}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatFileSize(doc.size)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleStar(doc.id)}
                      className={doc.isStarred ? 'text-yellow-500' : ''}
                    >
                      <Star
                        className="h-4 w-4"
                        fill={doc.isStarred ? 'currentColor' : 'none'}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(doc.id, doc.name)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Storage Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Storage Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Used</span>
              <span>2.5 GB</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '50%' }}></div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              5 GB total available storage
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
