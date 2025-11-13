
import React from 'react';

// FIX: Changed interface to a type with an intersection to help the type checker correctly identify all properties from React.HTMLAttributes.
type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'secondary' | 'outline';
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const baseClasses = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  
  const variantClasses = {
    default: "border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80",
    secondary: "border-transparent bg-slate-200 text-slate-900 hover:bg-slate-200/80",
    outline: "text-slate-950",
  };

  return <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props} />;
}
