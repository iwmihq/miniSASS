import React from "react";

interface Step {
  label: string;
  icon?: React.ReactNode;
}

interface FormStepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

const CheckIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const FormStepIndicator: React.FC<FormStepIndicatorProps> = ({ steps, currentStep, className = "" }) => {
  return (
    <div className={`flex items-center gap-1 px-4 py-3 ${className}`}>
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isActive = idx === currentStep;

        return (
          <React.Fragment key={idx}>
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-body-sm font-bold transition-all duration-300 ${
                  isCompleted
                    ? "bg-accent text-text-inverse"
                    : isActive
                    ? "bg-primary text-text-inverse ring-2 ring-primary/30 ring-offset-2"
                    : "bg-surface-muted text-text-muted"
                }`}
              >
                {isCompleted ? <CheckIcon /> : idx + 1}
              </div>
              <span
                className={`max-w-[80px] text-center text-caption leading-tight transition-colors ${
                  isActive ? "font-semibold text-primary" : isCompleted ? "text-accent" : "text-text-muted"
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div className="mb-5 h-0.5 flex-1">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCompleted ? "bg-accent" : "bg-surface-muted"
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default FormStepIndicator;
