import React from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Wand2, Upload, Briefcase, Sparkles } from 'lucide-react';

export const WelcomeModule: React.FC = () => {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] || session?.user?.email?.split('@')[0];
  const timeOfDay = new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening';
  
  return (
    <div className="relative overflow-hidden rounded-2xl border border-black/5 bg-gradient-to-br from-primary/5 via-white to-white shadow-sm">
      {/* Decorative gradient orb */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="relative p-6 md:p-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
              <Sparkles className="w-3 h-3" />
              {timeOfDay}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              Good {timeOfDay}, {firstName}
            </h2>
            <p className="text-sm md:text-base text-black/60 mt-2 max-w-2xl">
              Ready to take your career to the next level? Start by enhancing your resume or finding your perfect job match.
            </p>
          </div>
        </div>
        
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button size="lg" className="sm:w-auto w-full shadow-sm">
            <Upload className="w-4 h-4" /> Upload Resume
          </Button>
          <Button size="lg" variant="secondary" className="sm:w-auto w-full">
            <Wand2 className="w-4 h-4" /> Enhance Now
          </Button>
          <Button size="lg" variant="outline" className="sm:w-auto w-full">
            <Briefcase className="w-4 h-4" /> Find Jobs
          </Button>
        </div>
      </div>
    </div>
  );
};
