'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface ChooseOperationStepProps {
  selected: string
  onSelect: (type: string) => void
  onNext: () => void
}

const operations = [
  {
    id: 'ROLE_CHANGE',
    title: 'Change Role',
    description: 'Update user roles for selected users',
    icon: '👤'
  },
  {
    id: 'STATUS_UPDATE',
    title: 'Update Status',
    description: 'Change account status (active, inactive, suspended)',
    icon: '🔄'
  },
  {
    id: 'PERMISSION_GRANT',
    title: 'Grant Permissions',
    description: 'Add permissions to selected users',
    icon: '✅'
  },
  {
    id: 'PERMISSION_REVOKE',
    title: 'Revoke Permissions',
    description: 'Remove permissions from selected users',
    icon: '🔒'
  },
  {
    id: 'SEND_EMAIL',
    title: 'Send Email',
    description: 'Send notification emails to selected users',
    icon: '📧'
  },
  {
    id: 'IMPORT_CSV',
    title: 'Import Data',
    description: 'Update multiple fields from CSV data',
    icon: '📊'
  }
]

export const ChooseOperationStep: React.FC<ChooseOperationStepProps> = ({
  selected,
  onSelect,
  onNext
}) => {
  const handleNext = () => {
    if (!selected) {
      return
    }
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose Operation</h3>
        <p className="text-gray-600 mb-4">
          Select the type of bulk operation to perform on the selected users
        </p>
      </div>

      {/* Operation selection grid */}
      <RadioGroup value={selected} onValueChange={onSelect}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {operations.map(op => (
            <div key={op.id} className="relative">
              <input
                type="radio"
                id={op.id}
                value={op.id}
                checked={selected === op.id}
                onChange={() => onSelect(op.id)}
                className="sr-only"
              />
              <label
                htmlFor={op.id}
                className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selected === op.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{op.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm">{op.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{op.description}</p>
                  </div>
                  <div className="flex-shrink-0 pt-1">
                    <RadioGroupItem value={op.id} asChild>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selected === op.id
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {selected === op.id && (
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        )}
                      </div>
                    </RadioGroupItem>
                  </div>
                </div>
              </label>
            </div>
          ))}
        </div>
      </RadioGroup>

      {/* Helpful info */}
      {selected && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-900">
            {operations.find(o => o.id === selected)?.title}
          </p>
          <p className="text-xs text-blue-700 mt-1">
            {operations.find(o => o.id === selected)?.description}
          </p>
        </div>
      )}

      {/* Button */}
      <div className="flex justify-end gap-2">
        <Button
          onClick={handleNext}
          disabled={!selected}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Next: Configure
        </Button>
      </div>
    </div>
  )
}
