import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-[#1C1C1C] border-box text-primary-foreground border border-2 border-grey-800 shadow hover:bg-primary/90 font-semibold',
        destructive:
          'bg-neutral-100 text-red-400 border border-red-100 shadow-sm hover:bg-destructive/10',
        outline: 'border border-input border-grey-500 hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-neutral-100 rounded border text-grey-800 border-grey-500 font-medium shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'px-4 py-3 h-10 text-base leading-[0.875rem]',
        sm: 'h-8 rounded-md px-3 text-sm leading-[0.875rem]',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      onClick,
      startIcon,
      endIcon,
      variant,
      loading,
      size,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        onClick={onClick}
        disabled={loading}
        ref={ref}
        {...props}
      >
        {startIcon ? (
          <span className="mr-2 w-max">{startIcon}</span>
        ) : loading ? (
          <span className="mr-2 w-max">
            <Loader2 className="h-4 w-4 animate-spin" />
          </span>
        ) : null}
        {children}
        {endIcon && <span className="ml-2 w-max">{endIcon}</span>}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
