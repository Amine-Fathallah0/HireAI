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
      className={cn(
        'relative rounded-xl border border-green-500/20 dark:border-green-500/30 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 p-5',
        'before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-green-50/50 dark:before:from-green-500/5 before:to-transparent before:pointer-events-none',
        'hover:border-green-500/40 dark:hover:border-green-500/50 hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      <div className="relative z-10">
        {(title || action) && (
          <div className="mb-4 flex items-center justify-between">
            {title && <h3 className="font-semibold text-gray-900 dark:text-white text-base">{title}</h3>}
            {action}
          </div>
        )}
        {children}
      </div>
      {/* Pixelated corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-transparent rounded-xl pointer-events-none" 
           style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
    </div>
  )
);
ModuleCard.displayName = 'ModuleCard';
