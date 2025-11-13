
import React from 'react';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // FIX: Made the `children` prop optional to fix type errors where the compiler incorrectly reported that the `children` prop was missing.
  children?: React.ReactNode;
}

export const Sheet = ({ open, onOpenChange, children }: SheetProps) => {
  if (!open) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      {children}
    </>
  );
};

export const SheetTrigger = ({ asChild, children, ...props }: { asChild?: boolean, children: React.ReactElement } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return React.cloneElement(children, props);
};

// FIX: Made the `children` prop optional to fix type errors where the compiler incorrectly reported that the `children` prop was missing.
export const SheetContent = ({ side = 'right', className, children }: { side?: 'right', className?: string, children?: React.ReactNode }) => (
  <div className={`fixed z-50 h-full bg-white shadow-xl transition ease-in-out duration-300 top-0 ${side === 'right' ? 'right-0' : 'left-0'} ${className}`}>
    {children}
  </div>
);

// FIX: Made the `children` prop optional to fix type errors where the compiler incorrectly reported that the `children` prop was missing.
export const SheetHeader = ({ className, children }: { className?: string, children?: React.ReactNode }) => (
  <div className={`text-center sm:text-left ${className}`}>
    {children}
  </div>
);

// FIX: Made the `children` prop optional to fix type errors where the compiler incorrectly reported that the `children` prop was missing.
export const SheetTitle = ({ className, children }: { className?: string, children?: React.ReactNode }) => (
  <h2 className={`text-lg font-semibold text-slate-900 ${className}`}>{children}</h2>
);

export const SheetDescription = ({ className, children }: { className?: string, children?: React.ReactNode }) => (
  <p className={`text-sm text-slate-500 ${className}`}>{children}</p>
);
