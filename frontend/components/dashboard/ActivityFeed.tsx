import React from 'react';
import { ModuleCard } from '@/components/ui/module-card';

// TODO: Replace with real activity fetch
const mockActivity = [
  { id: 'a1', type: 'enhancement', label: 'Enhanced resume keywords', ts: '2025-11-13T12:00:00Z' },
  { id: 'a2', type: 'optimization', label: 'Optimized for Data Analyst role', ts: '2025-11-13T12:30:00Z' }
];

export const ActivityFeed: React.FC = () => {
  return (
    <ModuleCard title="Recent Activity">
      <ul className="space-y-2 text-sm">
        {mockActivity.map(a => (
          <li key={a.id} className="flex items-center justify-between">
            <span className="truncate max-w-[70%]">{a.label}</span>
            <span className="text-black/50">{new Date(a.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </li>
        ))}
      </ul>
    </ModuleCard>
  );
};
