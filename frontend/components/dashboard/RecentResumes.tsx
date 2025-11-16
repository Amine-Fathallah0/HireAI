import React from 'react';
import { ModuleCard } from '@/components/ui/module-card';
import { useResumes } from '@/lib/hooks/useResumes';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Sparkles } from 'lucide-react';

export const RecentResumes: React.FC = () => {
  const { data, loading, error, creating, createPlatformResume } = useResumes(5);

  return (
    <ModuleCard 
      title="My Resumes" 
      action={
        <Button size="sm" variant="outline" onClick={createPlatformResume} disabled={creating}>
          {creating ? 'Creating...' : <><Plus className="w-3 h-3" /> New</>}
        </Button>
      }
    >
      {loading && (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-2 rounded-lg border border-black/5">
              <div className="w-8 h-8 bg-black/10 rounded" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-black/10 rounded w-3/4" />
                <div className="h-2 bg-black/10 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}
      
      {error && <div className="text-sm text-red-600 p-2 rounded bg-red-50">{error}</div>}
      
      {!loading && !error && (
        <>
          {data.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-black/20 mx-auto mb-3" />
              <p className="text-sm text-black/50 mb-3">No resumes yet</p>
              <Button size="sm" onClick={createPlatformResume} disabled={creating}>
                <Plus className="w-3 h-3" /> Create Platform Resume
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {data.map(r => (
                <li key={r.id} className="group flex items-center gap-3 p-2 rounded-lg border border-black/5 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer">
                  <div className="flex-shrink-0 w-8 h-8 rounded bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{r.name}</span>
                      {r.source === 'builtin' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          <Sparkles className="w-2.5 h-2.5" /> Platform
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-black/50">{new Date(r.updatedAt).toLocaleDateString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </ModuleCard>
  );
};
