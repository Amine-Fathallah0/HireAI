import React from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Wand2, Upload, Briefcase, Sparkles } from 'lucide-react';

export const WelcomeModule: React.FC = () => {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] || session?.user?.email?.split('@')[0];
  const timeOfDay = new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening';
  
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-green-500/30 dark:border-green-500/40 bg-gradient-to-br from-green-50 via-white to-green-50/30 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 shadow-xl">
      {/* Animated gradient orbs */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-green-500/20 dark:bg-green-500/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-green-400/10 dark:bg-green-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
      
      {/* Dotted pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#22c55e15_1px,transparent_1px)] dark:bg-[radial-gradient(#22c55e25_1px,transparent_1px)] bg-[length:16px_16px] pointer-events-none" />
      
      <div className="relative p-6 md:p-10">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 dark:bg-green-500/20 border border-green-500/20 dark:border-green-500/30 text-green-700 dark:text-green-400 text-xs font-semibold mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              {timeOfDay}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
              Good {timeOfDay}, <span className="text-green-600 dark:text-green-400">{firstName}</span>
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 mt-3 max-w-2xl leading-relaxed">
              Ready to take your career to the next level? Start by enhancing your resume or finding your perfect job match.
            </p>
          </div>
        </div>
        
      </div>
    </div>
  );
};
