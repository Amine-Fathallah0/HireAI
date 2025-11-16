import React from 'react';
import { ModuleCard } from '@/components/ui/module-card';
import { TrendingUp } from 'lucide-react';

interface MeterProps { label: string; used: number; limit: number; color?: string; }
const Meter: React.FC<MeterProps> = ({ label, used, limit, color = 'bg-primary' }) => {
  const pct = Math.min(100, (used / limit) * 100);
  const remaining = limit - used;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        <span className="text-xs text-black/50">{remaining} left</span>
      </div>
      <div className="relative">
        <div className="h-2.5 bg-black/10 rounded-full overflow-hidden">
          <div 
            className={`h-full ${color} transition-all duration-500 ease-out`} 
            style={{ width: pct + '%' }} 
          />
        </div>
        <span className="text-xs font-semibold text-black/70 mt-1 block">{used} / {limit} used</span>
      </div>
    </div>
  );
};

export const UsageMeters: React.FC = () => {
  // TODO: Replace with real usage fetch
  const mock = { enhancements: { used: 2, limit: 10 }, optimizations: { used: 1, limit: 5 } };
  
  return (
    <ModuleCard 
      title="AI Usage Today" 
      action={<TrendingUp className="w-4 h-4 text-primary" />}
    >
      <div className="space-y-5">
        <Meter 
          label="Resume Enhancements" 
          used={mock.enhancements.used} 
          limit={mock.enhancements.limit} 
          color="bg-primary"
        />
        <Meter 
          label="Job Optimizations" 
          used={mock.optimizations.used} 
          limit={mock.optimizations.limit}
          color="bg-purple-500"
        />
      </div>
      <p className="text-xs text-black/50 mt-4 pt-4 border-t border-black/5">
        Resets daily at midnight
      </p>
    </ModuleCard>
  );
};
