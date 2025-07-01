'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { CheckIcon } from '@radix-ui/react-icons';

import { cn } from '@/lib/utils';
import { Label } from './label';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
    helpText?: string;
  }
>(({ className, title, helpText, ...props }, ref) => {
  const internalRef = React.useRef<HTMLButtonElement>(null);
  
  // Expose the checkbox element through the forwarded ref
  React.useImperativeHandle(ref, () => internalRef.current as HTMLButtonElement, []);
  
  const handleDivClick = () => {
    if (internalRef.current) {
      internalRef.current.click();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div 
        className="flex items-center gap-2 hover:bg-accent rounded-md px-2 py-1 transition-colors cursor-pointer"
        onClick={handleDivClick}
      >
        <CheckboxPrimitive.Root
          ref={internalRef}
          className={cn(
            'peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
            className
          )}
          {...props}
        >
          <CheckboxPrimitive.Indicator
            className={cn('flex items-center justify-center text-current')}
          >
            <CheckIcon className="h-4 w-4" />
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        {title ? <Label className="text-sm text-grey-700 cursor-pointer">{title}</Label> : null}
      </div>
      {helpText ? <p className="text-base text-grey-600">{helpText}</p> : null}
    </div>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
