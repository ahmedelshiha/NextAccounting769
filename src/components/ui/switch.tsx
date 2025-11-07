import * as React from 'react'
import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
    return (
      <label className={cn('inline-flex items-center cursor-pointer', disabled && 'cursor-not-allowed opacity-50')}>
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          onChange={(e) => {
            onCheckedChange?.(e.target.checked)
            if (props.onChange) props.onChange(e as any)
          }}
          disabled={disabled}
          className="sr-only"
          {...props}
        />
        <div
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            checked ? 'bg-blue-600' : 'bg-gray-300',
            'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              checked ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </div>
      </label>
    )
  }
)

Switch.displayName = 'Switch'

export { Switch }
