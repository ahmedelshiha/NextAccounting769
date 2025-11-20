'use client'

import React from 'react'
import { AvatarComponentProps } from '../types'
import { UserCircle } from 'lucide-react'

/**
 * UserAvatar Widget Component
 *
 * Displays user avatar with optional image, initials, and online status indicator.
 * Falls back to initials or icon if image is unavailable.
 *
 * @example
 * ```tsx
 * <UserAvatar name="John Doe" src="/avatar.jpg" size="md" />
 * <UserAvatar name="Jane Smith" initials="JS" showStatus isOnline />
 * <UserAvatar name="Unknown" size="sm" />
 * ```
 */
export default function UserAvatar({
  name,
  src,
  initials,
  size = 'md',
  showStatus = false,
  isOnline = false,
  onClick,
  clickable = false,
  className = '',
  testId,
}: AvatarComponentProps) {
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-xl',
  }

  const statusSizeClasses = {
    xs: 'h-2 w-2',
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-3 w-3',
    xl: 'h-4 w-4',
  }

  // Get initials from name or use provided initials
  const getInitials = () => {
    if (initials) return initials

    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.charAt(0).toUpperCase()
  }

  // Generate background color based on name (consistent hashing)
  const getBgColor = () => {
    const colors = [
      'bg-red-500',
      'bg-orange-500',
      'bg-yellow-500',
      'bg-green-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-purple-500',
      'bg-pink-500',
    ]

    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const handleClick = () => {
    if (clickable && onClick) {
      onClick()
    }
  }

  const displayInitials = getInitials()
  const bgColor = getBgColor()

  return (
    <div
      className={`relative inline-block ${clickable ? 'cursor-pointer' : ''} ${className}`}
      onClick={handleClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={`Avatar for ${name}`}
      data-testid={testId}
    >
      {src ? (
        // Image Avatar
        <img
          src={src}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white shadow-sm ${
            clickable ? 'hover:shadow-md transition-shadow' : ''
          }`}
          onError={(e) => {
            // Fallback to initials if image fails to load
            const element = e.target as HTMLImageElement
            element.style.display = 'none'
          }}
        />
      ) : null}

      {/* Initials Fallback */}
      {!src && (
        <div
          className={`${sizeClasses[size]} ${bgColor} rounded-full flex items-center justify-center font-semibold text-white shadow-sm border-2 border-white ${
            clickable ? 'hover:shadow-md transition-shadow' : ''
          }`}
        >
          {displayInitials}
        </div>
      )}

      {/* Fallback to Icon if no image and couldn't generate initials */}
      {!src && displayInitials.length === 0 && (
        <UserCircle
          className={`${sizeClasses[size]} text-gray-400`}
          aria-label={`No avatar for ${name}`}
        />
      )}

      {/* Online Status Indicator */}
      {showStatus && (
        <div
          className={`absolute bottom-0 right-0 ${statusSizeClasses[size]} ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          } rounded-full border-2 border-white`}
          aria-label={isOnline ? 'Online' : 'Offline'}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  )
}
