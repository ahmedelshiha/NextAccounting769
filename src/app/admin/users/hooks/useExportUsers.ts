'use client'

import { UserItem } from '../contexts/UserDataContext'

export function useExportUsers() {
  // Convert users to CSV format
  const exportToCSV = (users: UserItem[], filename = 'users') => {
    const headers = [
      'ID',
      'Name',
      'Email',
      'Phone',
      'Role',
      'Status',
      'Position',
      'Department',
      'Created At',
      'Last Login'
    ]

    const rows = users.map(user => [
      user.id,
      user.name || '',
      user.email,
      user.phone || '',
      user.role,
      user.status || 'ACTIVE',
      user.position || '',
      user.department || '',
      new Date(user.createdAt).toISOString().split('T')[0],
      user.lastLoginAt ? new Date(user.lastLoginAt).toISOString().split('T')[0] : ''
    ])

    // Escape CSV values (handle quotes and commas)
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row =>
        row.map(cell =>
          typeof cell === 'string'
            ? `"${cell.replace(/"/g, '""')}"` // Escape quotes in strings
            : `"${cell}"`
        ).join(',')
      )
    ].join('\n')

    downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;')
  }

  // Convert users to Excel format (simple XLSX generation)
  const exportToExcel = (users: UserItem[], filename = 'users') => {
    // For Excel, we'll create a more sophisticated format
    // Using a simple approach: create Tab-separated values that Excel can read
    const headers = [
      'ID',
      'Name',
      'Email',
      'Phone',
      'Role',
      'Status',
      'Position',
      'Department',
      'Created At',
      'Last Login'
    ]

    const rows = users.map(user => [
      user.id,
      user.name || '',
      user.email,
      user.phone || '',
      user.role,
      user.status || 'ACTIVE',
      user.position || '',
      user.department || '',
      new Date(user.createdAt).toISOString().split('T')[0],
      user.lastLoginAt ? new Date(user.lastLoginAt).toISOString().split('T')[0] : ''
    ])

    // Use tab-separated format for Excel compatibility
    const xlsxContent = [
      headers.join('\t'),
      ...rows.map(row => row.join('\t'))
    ].join('\n')

    downloadFile(xlsxContent, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;')
  }

  // Generic file download helper
  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return {
    exportToCSV,
    exportToExcel
  }
}
