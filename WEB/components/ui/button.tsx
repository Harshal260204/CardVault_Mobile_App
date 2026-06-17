'use client';

import { type ButtonHTMLAttributes, forwardRef } from 'react';

import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 hover:bg-brand-700 text-white',
  secondary:
    'bg-neutral-0 border border-neutral-200 text-text-primary hover:bg-neutral-50',
  ghost:
    'bg-transparent border border-neutral-200 text-text-primary hover:bg-neutral-50 hover:border-neutral-300',
  danger: 'bg-error text-white hover:bg-error/90',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] rounded-md',
  md: 'h-9 px-4 text-sm rounded-md',
  lg: 'h-11 px-5 text-base rounded-md',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading,
      disabled,
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
        loading && variant === 'primary'
          ? 'disabled:pointer-events-none opacity-80 bg-brand-600'
          : 'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent text-current"
          role="status"
          aria-label="Loading"
        />
      ) : null}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
