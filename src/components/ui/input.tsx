import * as React from 'react';

import { cn } from '@/lib/utils';
import { Label } from './label';
import { cva } from 'class-variance-authority';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import Image from 'next/image';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  title?: string;
  error?: boolean;
  errorMessage?: string | React.ReactNode;
  helpText?: string;
  size?: 'default' | 'sm' | 'lg';
  startIcon?: React.ReactNode;
  tooltipComponent?: React.ReactNode;
  loading?: boolean;
}

const inputVariants = cva(
  'inline-flex items-center w-full border border-grey-500 disabled:border-grey-500 disabled:bg-neutral-100 justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:text-grey-700 .placeholder-text-grey-700::placeholder',
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
  (
    {
      className,
      type,
      helpText,
      errorMessage,
      startIcon,
      error,
      size,
      tooltipComponent,
      loading,
      ...props
    },
    ref
  ) => {
    return (
      <div className="flex flex-col gap-2">
        {props.title ? (
          <div className="flex flex-row gap-2">
            <Label className="text-base text-grey-900" htmlFor={props.title}>
              {props.title}
            </Label>

            {tooltipComponent ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Image src="/assets/Info.svg" alt="info" width={16} height={16} />
                  </TooltipTrigger>
                  <TooltipContent>{tooltipComponent}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
          </div>
        ) : null}
        <div className="relative">
          <input
            type={type}
            disabled={loading}
            className={cn(inputVariants({ size, className }), startIcon ? 'pl-10' : '')}
            ref={ref}
            onWheel={(e) => (e.target as HTMLElement).blur()}
            {...props}
          />
          {startIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2">{startIcon}</span>
          )}
          {loading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            </span>
          )}
        </div>
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
