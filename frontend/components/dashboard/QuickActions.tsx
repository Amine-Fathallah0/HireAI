import React from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Wand2, Upload, Briefcase, Zap } from 'lucide-react';
import { ModuleCard } from '@/components/ui/module-card';

const ActionButton: React.FC<{ icon: React.ReactNode; title: string; desc: string; onClick?: () => void }> = 
  ({ icon, title, desc, onClick }) => (
    <button 
      onClick={onClick}
      className="flex items-start gap-3 p-3 rounded-lg border border-black/5 hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-gray-900 group-hover:text-primary transition-colors">{title}</div>
        <div className="text-xs text-black/50 mt-0.5">{desc}</div>
      </div>
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
          icon={<Upload className="w-5 h-5 text-primary" />}
          title="Upload Resume"
          desc="Add a new resume to optimize"
        />
        <ActionButton 
          icon={<Wand2 className="w-5 h-5 text-primary" />}
          title="Enhance Resume"
          desc="AI-powered improvements"
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
