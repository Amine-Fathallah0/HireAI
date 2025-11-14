import React from 'react';
import { Button } from '@/components/ui/button';
import { Wand2, Upload, Briefcase } from 'lucide-react';
import { ModuleCard } from '@/components/ui/module-card';

export const QuickActions: React.FC = () => {
  return (
    <ModuleCard title="Quick Actions" className="flex flex-col gap-3">
      <Button size="sm" className="w-full justify-start"><Upload /> Upload Resume</Button>
      <Button size="sm" variant="secondary" className="w-full justify-start"><Wand2 /> Enhance Resume</Button>
      <Button size="sm" variant="outline" className="w-full justify-start"><Briefcase /> Optimize for Job</Button>
    </ModuleCard>
  );
};
