import React from 'react';
import { useSession, signOut } from 'next-auth/react';

export const AppShell: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { data: session } = useSession();
  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-white border-b border-black/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">HA</div>
            <h1 className="text-lg font-semibold">HireAI</h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden sm:inline text-black/70">{session?.user?.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="h-9 px-3 rounded-md bg-red-600 text-white hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};
