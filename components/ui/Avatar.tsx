
import React from 'react';

// FIX: Made the `children` prop optional to fix type errors where the compiler incorrectly reported that the `children` prop was missing.
export const Avatar = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}>
    {children}
  </div>
);

// FIX: Made the `children` prop optional to fix type errors where the compiler incorrectly reported that the `children` prop was missing.
export const AvatarFallback = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <span className={`flex h-full w-full items-center justify-center rounded-full bg-slate-200 text-slate-700 ${className}`}>
    {children}
  </span>
);
