import React from 'react';
import { ModuleCard } from '@/components/ui/module-card';
import { Target, TrendingUp, Briefcase } from 'lucide-react';

// TODO: Replace with real matches fetch
const mockMatches = [
  { id: 'm1', title: 'Junior Data Analyst', company: 'TechCorp', score: 82 },
  { id: 'm2', title: 'Business Intelligence Intern', company: 'DataFlow', score: 76 }
];

export const MatchesPreview: React.FC = () => {
  return (
    <ModuleCard 
      title="Top Matches" 
      action={<Target className="w-4 h-4 text-primary" />}
    >
      {mockMatches.length === 0 ? (
        <div className="text-center py-8">
          <Briefcase className="w-12 h-12 text-black/20 mx-auto mb-3" />
          <p className="text-sm text-black/50">No matches yet</p>
          <p className="text-xs text-black/40 mt-1">Optimize your resume to find jobs</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {mockMatches.map(m => {
            const scoreColor = m.score >= 80 ? 'text-green-600' : m.score >= 60 ? 'text-primary' : 'text-orange-600';
            return (
              <li key={m.id} className="group flex items-center gap-3 p-2 rounded-lg border border-black/5 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer">
                <div className="flex-shrink-0 w-8 h-8 rounded bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Briefcase className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{m.title}</div>
                  <div className="text-xs text-black/50">{m.company}</div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1">
                  <TrendingUp className={`w-3 h-3 ${scoreColor}`} />
                  <span className={`text-sm font-semibold ${scoreColor}`}>{m.score}%</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </ModuleCard>
  );
};
