import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        red: 'border-transparent bg-red-500/10 text-red-600',
        yellow: 'border-transparent bg-yellow-500/10 text-yellow-700',
        green: 'border-transparent bg-green-500/10 text-green-700',
        blue: 'border-transparent bg-blue-500/10 text-blue-700',
        orange: 'border-transparent bg-orange-500/10 text-orange-700',
        gray: 'border-transparent bg-gray-500/10 text-gray-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

