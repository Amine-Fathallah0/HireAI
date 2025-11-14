import React from 'react';
import { useProfile } from '@/lib/hooks/useProfile';
import { ModuleCard } from '@/components/ui/module-card';

export const ProfileSummary: React.FC = () => {
  const { data, loading, error } = useProfile();
  if (loading) return <ModuleCard title="Profile">Loading...</ModuleCard>;
  if (error) return <ModuleCard title="Profile"><div className="text-sm text-red-600">{error}</div></ModuleCard>;
  if (!data) return null;
  return (
    <ModuleCard title="Profile">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div><span className="text-black/50">Name:</span> {data?.firstName ?? ''} {data?.lastName ?? ''}</div>
        <div><span className="text-black/50">Role:</span> {data?.role ?? ''}</div>
        <div><span className="text-black/50">Status:</span> {data?.isActive ? 'Active' : 'Inactive'}</div>
        <div><span className="text-black/50">Verified:</span> {data?.emailVerified ? 'Yes' : 'No'}</div>
      </div>
    </ModuleCard>
  );
};
