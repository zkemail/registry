import * as React from 'react';

import { cn } from '@/lib/utils';
import { Label } from './label';
import { cva } from 'class-variance-authority';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  title?: string;
  error?: boolean;
  errorMessage?: string;
  helpText?: string;
  size?: 'default' | 'sm' | 'lg';
  startIcon?: React.ReactNode;
}

const inputVariants = cva(
  'inline-flex items-center border border-grey-500 disabled:border-grey-500 disabled:bg-neutral-100 justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:text-grey-700 .placeholder-text-grey-700::placeholder',
  {
    variants: {
      size: {
        default: 'px-4 h-9 px-3 py-1 leading-[0.875rem]',
        sm: 'h-8 rounded-md px-3 text-sm leading-[0.875rem]',
        lg: 'h-10 rounded-md px-8',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, helpText, errorMessage, startIcon, error, size, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {props.title ? (
          <Label className="text-base text-grey-900" htmlFor={props.title}>
            {props.title}
          </Label>
        ) : null}
        <input
          type={type}
          className={cn(inputVariants({ size, className }))}
          ref={ref}
          onWheel={(e) => (e.target as HTMLElement).blur()}
          {...props}
        />
        {startIcon && <span className="absolute left-3 top-1/2 -translate-y-1/2">{startIcon}</span>}
        {errorMessage || helpText ? (
          <p className={cn('text-base text-grey-600', error ? 'text-red-500' : '')}>
            {errorMessage || helpText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
