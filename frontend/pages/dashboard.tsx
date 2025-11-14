import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { AppShell } from '@/components/dashboard/AppShell';
import { WelcomeModule } from '@/components/dashboard/WelcomeModule';
import { ProfileSummary } from '@/components/dashboard/ProfileSummary';
import { UsageMeters } from '@/components/dashboard/UsageMeters';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentResumes } from '@/components/dashboard/RecentResumes';
import { MatchesPreview } from '@/components/dashboard/MatchesPreview';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/auth/signin');
  }, [status, router]);

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-sm text-black/50">Loading...</div>;
  }

  return (
    <AppShell>
      {/* Top Row: Welcome + Quick Actions + Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-2">
          <WelcomeModule />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UsageMeters />
            <QuickActions />
          </div>
        </div>
        <ProfileSummary />
      </div>

      {/* Middle Row: Resumes + Matches */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <RecentResumes />
        <MatchesPreview />
      </div>

      {/* Activity */}
      <div className="mt-6">
        <ActivityFeed />
      </div>
    </AppShell>
  );
}
