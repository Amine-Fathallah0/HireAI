import React from 'react';
import { ModuleCard } from '@/components/ui/module-card';

// TODO: Replace with real matches fetch
const mockMatches = [
  { id: 'm1', title: 'Junior Data Analyst', score: 82 },
  { id: 'm2', title: 'Business Intelligence Intern', score: 76 }
];

export const MatchesPreview: React.FC = () => {
  return (
    <ModuleCard title="Matches">
      <ul className="space-y-2 text-sm">
        {mockMatches.map(m => (
          <li key={m.id} className="flex items-center justify-between">
            <span className="truncate max-w-[65%]">{m.title}</span>
            <span className="text-primary font-medium">{m.score}%</span>
          </li>
        ))}
      </ul>
    </ModuleCard>
  );
};
