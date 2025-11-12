'use client'

import React, { useMemo, memo } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import { Skeleton } from '@/components/ui/skeleton'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface UserGrowthData {
  labels: string[]
  values: number[]
}

interface UserGrowthChartProps {
  data?: UserGrowthData
  loading?: boolean
}

/**
 * User Growth Line Chart
 * 
 * Features:
 * - Shows user count trend over time
 * - Line chart with gradient fill
 * - Smooth animations
 * - Responsive design
 * - Loading state with skeleton
 * - Date-based x-axis labels
 */
const UserGrowthChart = memo(function UserGrowthChart({
  data,
  loading = false
}: UserGrowthChartProps) {
  // Default data if none provided
  const defaultData: UserGrowthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    values: [12, 19, 3, 5, 2, 3]
  }

  const chartData = useMemo(() => {
    const displayData = data || defaultData

    return {
      labels: displayData.labels,
      datasets: [
        {
          label: 'New Users',
          data: displayData.values,
          borderColor: '#14b8a6',
          backgroundColor: 'rgba(20, 184, 166, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#14b8a6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }
      ]
    }
  }, [data])

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
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
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 11 },
        callbacks: {
          label: (context) => {
            const value = context.parsed.y
            return `${value} new users`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          display: true
        },
        ticks: {
          color: '#6b7280',
          font: { size: 11 }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#6b7280',
          font: { size: 11 }
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
    <div className="user-growth-chart-container">
      <h3 className="user-growth-chart-title">User Growth</h3>
      <div className="user-growth-chart-body" style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
})

export default UserGrowthChart
