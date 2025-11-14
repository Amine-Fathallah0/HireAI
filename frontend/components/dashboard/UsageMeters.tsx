import React from 'react';
import { ModuleCard } from '@/components/ui/module-card';

interface MeterProps { label: string; used: number; limit: number; }
const Meter: React.FC<MeterProps> = ({ label, used, limit }) => {
  const pct = Math.min(100, (used / limit) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-medium text-black/70"><span>{label}</span><span>{used}/{limit}</span></div>
      <div className="h-2 bg-black/10 rounded-full overflow-hidden">
        <div className="h-full bg-primary/80 transition-all" style={{ width: pct + '%' }} />
      </div>
    </div>
  );
};

export const UsageMeters: React.FC = () => {
  // TODO: Replace with real usage fetch
  const mock = { enhancements: { used: 2, limit: 10 }, optimizations: { used: 1, limit: 5 } };
  return (
    <ModuleCard title="Usage">
      <div className="space-y-4">
        <Meter label="Enhancements" used={mock.enhancements.used} limit={mock.enhancements.limit} />
        <Meter label="Optimizations" used={mock.optimizations.used} limit={mock.optimizations.limit} />
      </div>
    </ModuleCard>
  );
};
