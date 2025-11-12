'use client'

import React, { useMemo, memo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import { Skeleton } from '@/components/ui/skeleton'

ChartJS.register(ArcElement, Tooltip, Legend)

interface RoleDistributionData {
  [key: string]: number
}

interface RoleDistributionChartProps {
  data?: RoleDistributionData
  loading?: boolean
}

/**
 * Role Distribution Pie/Doughnut Chart
 * 
 * Features:
 * - Displays user count by role
 * - Color-coded by role type
 * - Responsive design
 * - Loading state with skeleton
 * - Legend and tooltips
 */
const RoleDistributionChart = memo(function RoleDistributionChart({
  data,
  loading = false
}: RoleDistributionChartProps) {
  const roleColors: Record<string, string> = {
    ADMIN: '#3b82f6',
    TEAM_LEAD: '#06b6d4',
    TEAM_MEMBER: '#14b8a6',
    STAFF: '#10b981',
    CLIENT: '#8b5cf6',
    EDITOR: '#06b6d4',
    VIEWER: '#14b8a6'
  }

  const chartData = useMemo(() => {
    if (!data || Object.keys(data).length === 0) {
      return {
        labels: ['No data'],
        datasets: [
          {
            data: [1],
            backgroundColor: ['#e5e7eb'],
            borderColor: '#fff',
            borderWidth: 2
          }
        ]
      }
    }

    const labels = Object.keys(data).sort()
    const values = labels.map((role) => data[role])
    const backgroundColor = labels.map((role) => roleColors[role] || '#9ca3af')

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor,
          borderColor: '#fff',
          borderWidth: 2
        }
      ]
    }
  }, [data])

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 12,
          usePointStyle: true,
          font: {
            size: 12,
            weight: 500 as any
          },
          color: '#374151'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 11 },
        callbacks: {
          label: (context) => {
            const value = context.parsed
            const total = (context.dataset.data as number[]).reduce(
              (a, b) => a + b,
              0
            )
            const percentage = ((value / total) * 100).toFixed(1)
            return `${value} users (${percentage}%)`
          }
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <Skeleton className="w-full h-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="role-distribution-chart-container">
      <h3 className="role-distribution-chart-title">Role Distribution</h3>
      <div className="role-distribution-chart-body" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  )
})

export default RoleDistributionChart
