import React from 'react';
import { ModuleCard } from '@/components/ui/module-card';
import { Clock, Sparkles, Target, FileText } from 'lucide-react';

// TODO: Replace with real activity fetch
const mockActivity = [
  { id: 'a1', type: 'enhancement', label: 'Enhanced resume keywords', ts: '2025-11-13T12:00:00Z' },
  { id: 'a2', type: 'optimization', label: 'Optimized for Data Analyst role', ts: '2025-11-13T12:30:00Z' }
];

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'enhancement': return <Sparkles className="w-4 h-4 text-primary" />;
    case 'optimization': return <Target className="w-4 h-4 text-purple-500" />;
    default: return <FileText className="w-4 h-4 text-gray-400" />;
  }
};

export const ActivityFeed: React.FC = () => {
  return (
    <ModuleCard 
      title="Recent Activity" 
      action={<Clock className="w-4 h-4 text-primary" />}
    >
      {mockActivity.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-black/20 mx-auto mb-3" />
          <p className="text-sm text-black/50">No recent activity</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {mockActivity.map(a => (
            <li key={a.id} className="flex items-center gap-3 p-2 rounded-lg border border-black/5 hover:bg-black/5 transition-colors">
              <div className="flex-shrink-0 w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                {getActivityIcon(a.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-900">{a.label}</div>
                <div className="text-xs text-black/50">
                  {new Date(a.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </ModuleCard>
  );
};
