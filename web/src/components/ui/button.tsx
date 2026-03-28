import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50',
        size === 'default' && 'px-4 py-2 text-sm',
        size === 'sm' && 'px-3 py-1.5 text-xs',
        variant === 'default' &&
          'bg-primary text-primary-foreground hover:opacity-90 focus-visible:outline-primary',
        variant === 'outline' && 'border border-border bg-card hover:bg-muted',
        variant === 'ghost' && 'hover:bg-muted',
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
