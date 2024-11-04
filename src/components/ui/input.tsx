import * as React from 'react';

import { cn } from '@/lib/utils';
import { Label } from './label';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  helpText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, helpText, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {props.title ? (
          <Label className="text-base text-grey-900" htmlFor={props.title}>
            {props.title}
          </Label>
        ) : null}
        <input
          type={type}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:border-grey-500 disabled:bg-neutral-100',
            className
          )}
          ref={ref}
          {...props}
        />
        {helpText ? <p className="text-base text-grey-600">{helpText}</p> : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
