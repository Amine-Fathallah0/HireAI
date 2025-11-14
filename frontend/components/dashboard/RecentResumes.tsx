import React from 'react';
import { ModuleCard } from '@/components/ui/module-card';
import { useResumes } from '@/lib/hooks/useResumes';
import { Button } from '@/components/ui/button';

export const RecentResumes: React.FC = () => {
  const { data, loading, error, creating, createPlatformResume } = useResumes(5);

  return (
    <ModuleCard title="Recent Resumes" action={
      <Button size="sm" onClick={createPlatformResume} disabled={creating}>
        {creating ? 'Creating...' : 'Create Platform Resume'}
      </Button>
    }>
      {loading && <div className="text-sm text-black/50">Loading resumes...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <ul className="space-y-2 text-sm">
          {data.length === 0 && (
            <li className="text-black/50">No resumes yet.</li>
          )}
          {data.map(r => (
            <li key={r.id} className="flex items-center justify-between">
              <span className="truncate max-w-[60%]">
                {r.name}
                {r.source === 'builtin' && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Platform</span>
                )}
              </span>
              <span className="text-black/50">{new Date(r.updatedAt).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      )}
    </ModuleCard>
  );
};
