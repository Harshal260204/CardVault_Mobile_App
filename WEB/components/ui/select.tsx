'use client';

import { type SelectHTMLAttributes, forwardRef } from 'react';

import { cn } from '@/lib/utils';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  labelClassName?: string;
}

export const selectClassName =
  'h-9 w-full rounded-md border border-neutral-200 bg-surface px-3 text-sm text-foreground transition-colors duration-150 dark:border-neutral-800 focus-visible:outline-none focus-visible:border-brand-600 focus-visible:ring-1 focus-visible:ring-brand-600/20 disabled:cursor-not-allowed disabled:opacity-50';

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, id, labelClassName, children, ...props }, ref) => (
    <div className="w-full space-y-1">
      {label ? (
        <label
          htmlFor={id}
          className={cn(
            'block text-[11px] font-medium uppercase tracking-wider text-text-tertiary',
            labelClassName,
          )}
        >
          {label}
        </label>
      ) : null}
      <select
        ref={ref}
        id={id}
        className={cn(selectClassName, className)}
        {...props}
      >
        {children}
      </select>
    </div>
  ),
);
Select.displayName = 'Select';
