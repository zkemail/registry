import * as React from 'react';

import { cn } from '@/lib/utils';
import { Label } from '@radix-ui/react-label';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  title?: string;
  errorMessage?: string;
  helpText?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, errorMessage, helpText, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {props.title ? (
          <Label className="text-base text-grey-900" htmlFor={props.title}>
            {props.title}
          </Label>
        ) : null}
        <textarea
          className={cn(
            'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          ref={ref}
          {...props}
        />
        {errorMessage || helpText ? (
          <p className={cn('text-base text-grey-600', errorMessage ? 'text-red-500' : '')}>
            {errorMessage || helpText}
          </p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
