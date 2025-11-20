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
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background';

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/auth/signin');
  }, [status, router]);

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-sm text-black/50 dark:text-white/50">Loading...</div>;
  }

  return (
    <AppShell>
      {/* Static dotted pattern overlay */}
      <div className="fixed inset-0 bg-[radial-gradient(#00000030_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff20_1px,transparent_1px)] bg-[length:20px_20px] pointer-events-none z-0" />
      
      {/* Hero: Welcome Banner */}
      <div className="relative z-10">
        <WelcomeModule />

      {/* Three-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* First Row: Usage + Quick Actions + Profile */}
        <UsageMeters />
        <QuickActions />
        <ProfileSummary />
        
        {/* Second Row: Resumes + Matches + Activity */}
        <RecentResumes />
        <MatchesPreview />
        <ActivityFeed />
      </div>
      </div>
    </AppShell>
  );
}
