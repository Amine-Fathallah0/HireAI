import React from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Wand2, Upload, Briefcase, Zap } from 'lucide-react';
import { ModuleCard } from '@/components/ui/module-card';

const ActionButton: React.FC<{ icon: React.ReactNode; title: string; desc: string; onClick?: () => void }> = 
  ({ icon, title, desc, onClick }) => (
    <button 
      onClick={onClick}
      className="relative flex items-start gap-4 p-4 rounded-xl border-2 border-green-500/20 dark:border-green-500/30 hover:border-green-500/40 dark:hover:border-green-500/50 bg-gradient-to-br from-green-50/50 to-white dark:from-green-500/5 dark:to-gray-800 hover:from-green-50 hover:to-green-50/30 dark:hover:from-green-500/10 dark:hover:to-gray-800 transition-all duration-300 text-left group hover:shadow-lg hover:-translate-y-0.5"
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-500/10 dark:bg-green-500/20 group-hover:bg-green-500/20 dark:group-hover:bg-green-500/30 flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors mb-1">{title}</div>
        <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</div>
      </div>
      {/* Hover accent */}
      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500/0 group-hover:bg-green-500/60 transition-all duration-300" />
    </button>
  );

export const QuickActions: React.FC = () => {
  const router = useRouter();

  return (
    <ModuleCard 
      title="Quick Actions" 
      action={<Zap className="w-4 h-4 text-primary" />}
    >
      <div className="space-y-2">
        <ActionButton 
          icon={<Wand2 className="w-5 h-5 text-primary" />}
          title="Upload & Enhance Resume"
          desc="AI-powered resume improvements"
          onClick={() => router.push('/resume/upload')}
        />
        <ActionButton 
          icon={<Briefcase className="w-5 h-5 text-primary" />}
          title="Job Matcher"
          desc="Find your perfect job match with AI"
          onClick={() => router.push('/job-matcher')}
        />
      </div>
    </ModuleCard>
  );
};
