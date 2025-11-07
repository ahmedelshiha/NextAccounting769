'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface RadioGroupContextType {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
}

const RadioGroupContext = React.createContext<RadioGroupContextType>({})

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, disabled, ...props }, ref) => (
    <RadioGroupContext.Provider value={{ value, onValueChange, disabled }}>
      <div
        ref={ref}
        role="radiogroup"
        className={cn('grid gap-2', className)}
        {...props}
      />
    </RadioGroupContext.Provider>
  )
)
RadioGroup.displayName = 'RadioGroup'

interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value: string
  onCheckedChange?: (checked: boolean) => void
  asChild?: boolean
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, onCheckedChange, disabled, asChild, children, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext)
    const isChecked = context.value === value

    if (asChild && React.isValidElement(children)) {
      return (
        <label className="cursor-pointer">
          <input
            ref={ref}
            type="radio"
            value={value}
            checked={isChecked}
            disabled={disabled || context.disabled}
            onChange={(e) => {
              if (e.target.checked) {
                context.onValueChange?.(value)
                onCheckedChange?.(true)
              }
            }}
            className="sr-only"
            {...props}
          />
          {React.cloneElement(children as React.ReactElement<any>, {
            'data-state': isChecked ? 'checked' : 'unchecked'
          })}
        </label>
      )
    }

    return (
      <input
        ref={ref}
        type="radio"
        value={value}
        checked={isChecked}
        disabled={disabled || context.disabled}
        onChange={(e) => {
          if (e.target.checked) {
            context.onValueChange?.(value)
            onCheckedChange?.(true)
          }
        }}
        className={cn(
          'h-4 w-4 rounded-full border-2 border-primary ring-offset-background transition-all',
          'checked:bg-primary checked:border-primary',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'cursor-pointer',
          className
        )}
        {...props}
      />
    )
  }
)
RadioGroupItem.displayName = 'RadioGroupItem'

export { RadioGroup, RadioGroupItem }
