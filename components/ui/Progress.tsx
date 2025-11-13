import React from 'react';

// FIX: Changed interface to a type with an intersection to help the type checker correctly identify all properties from React.HTMLAttributes.
type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  value: number;
  indicatorClassName?: string;
};

export const Progress = ({ className, value, indicatorClassName, ...props }: ProgressProps) => (
  <div className={`relative h-4 w-full overflow-hidden rounded-full bg-slate-100 ${className}`} {...props}>
    <div
      className={`h-full w-full flex-1 transition-all ${indicatorClassName || 'bg-sky-500'}`}
      style={{ transform: `translateX(-${100 - (Math.min(value || 0, 100))}%)` }}
    />
  </div>
);