import React from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Wand2, Upload, Briefcase } from 'lucide-react';

export const WelcomeModule: React.FC = () => {
  const { data: session } = useSession();
  const name = session?.user?.name || session?.user?.email;
  return (
    <div className="relative overflow-hidden rounded-xl border border-black/5 bg-white">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent" />
      <div className="relative p-6 md:p-8">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Welcome, {name}</h2>
        <p className="text-sm text-black/60 mt-1">Let’s enhance your resume and find great matches today.</p>
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <Button className="sm:w-auto w-full"><Upload /> Upload Resume</Button>
          <Button variant="secondary" className="sm:w-auto w-full"><Wand2 /> Enhance Resume</Button>
          <Button variant="outline" className="sm:w-auto w-full"><Briefcase /> Optimize for Job</Button>
        </div>
      </div>
    </div>
  );
};
