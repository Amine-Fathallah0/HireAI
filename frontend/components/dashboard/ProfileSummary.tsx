import React from 'react';
import { useProfile } from '@/lib/hooks/useProfile';
import { ModuleCard } from '@/components/ui/module-card';
import { User, CheckCircle2, XCircle, Crown } from 'lucide-react';

export const ProfileSummary: React.FC = () => {
  const { data, loading, error } = useProfile();
  
  if (loading) return (
    <ModuleCard title="Your Profile">
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-black/10 rounded w-3/4" />
        <div className="h-4 bg-black/10 rounded w-1/2" />
      </div>
    </ModuleCard>
  );
  
  if (error) return (
    <ModuleCard title="Your Profile">
      <div className="text-sm text-red-600">{error}</div>
    </ModuleCard>
  );
  
  if (!data) return null;
  
  return (
    <ModuleCard title="Your Profile" action={<User className="w-4 h-4 text-primary" />}>
      <div className="space-y-4">
        {/* Name & Avatar */}
        <div className="flex items-center gap-3 pb-4 border-b border-black/5">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-semibold text-primary">
            {data?.firstName?.[0]}{data?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 truncate">
              {data?.firstName} {data?.lastName}
            </div>
            <div className="text-xs text-black/50 truncate">{data?.email}</div>
          </div>
        </div>

        {/* Role Badge */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
          <Crown className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm font-medium text-primary capitalize">{data?.role ?? 'User'}</span>
        </div>

        {/* Status Indicators */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-black/60">Account Status</span>
            <span className={`flex items-center gap-1 font-medium ${data?.isActive ? 'text-green-600' : 'text-gray-500'}`}>
              {data?.isActive ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" /> Inactive
                </>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-black/60">Email Verified</span>
            <span className={`flex items-center gap-1 font-medium ${data?.emailVerified ? 'text-green-600' : 'text-orange-600'}`}>
              {data?.emailVerified ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" /> Pending
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </ModuleCard>
  );
};
