import * as React from 'react';
import { cn } from '@/lib/utils';

interface ModuleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  action?: React.ReactNode;
}

export const ModuleCard = React.forwardRef<HTMLDivElement, ModuleCardProps>(
  ({ className, title, action, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border border-black/5 bg-white shadow-sm p-4', className)}
      {...props}
    >
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between">
          {title && <h3 className="font-medium">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
);
ModuleCard.displayName = 'ModuleCard';
