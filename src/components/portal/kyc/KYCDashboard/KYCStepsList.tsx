/**
 * KYCStepsList Component
 * Displays list of all KYC steps with their statuses
 */

import { KYCStepsListProps } from "../types/kyc";
import { KYCStepCard } from "../shared/KYCStepCard";

/**
 * List component that renders all KYC steps using KYCStepCard
 * 
 * @param steps - Array of KYC steps
 * @param onStepClick - Callback when a step is clicked
 * 
 * @example
 * ```tsx
 * <KYCStepsList
 *   steps={steps}
 *   onStepClick={(stepId) => router.push(`/kyc/${stepId}`)}
 * />
 * ```
 */
export function KYCStepsList({ steps, onStepClick }: KYCStepsListProps) {
  if (!steps || steps.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No KYC steps available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {steps.map((step) => (
        <KYCStepCard
          key={step.id}
          step={step}
          onClick={() => onStepClick(step.id)}
        />
      ))}
    </div>
  );
}
