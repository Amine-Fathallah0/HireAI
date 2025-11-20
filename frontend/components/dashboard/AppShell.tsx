import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Moon, Sun } from 'lucide-react';
import { useDarkMode } from '@/lib/hooks/useDarkMode';
import Image from 'next/image';

export const AppShell: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { data: session } = useSession();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  
  const handleSignOut = async () => {
    const provider = (session as any)?.provider;
    const idToken = (session as any)?.idToken;
    
    // Sign out from NextAuth
    await signOut({ redirect: false });
    
    // If Keycloak provider, also sign out from Keycloak to clear SSO session
    if (provider === 'keycloak' && idToken) {
      const keycloakIssuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER || 'http://localhost:8080/realms/resume-platform';
      const postLogoutRedirectUri = `${window.location.origin}/auth/signin`;
      const keycloakLogoutUrl = 
        `${keycloakIssuer}/protocol/openid-connect/logout?` +
        `id_token_hint=${idToken}&` +
        `post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`;
      window.location.href = keycloakLogoutUrl;
    } else {
      // For credentials provider, just redirect to signin
      window.location.href = '/auth/signin';
    }
  };
  
  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 transition-colors duration-200">
      <nav className="bg-white dark:bg-gray-800 border-b border-black/5 dark:border-white/10 shadow-sm relative z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image 
              src={isDarkMode ? '/logo-dark.png' : '/logo-light.png'} 
              alt="HireAI Logo" 
              width={400} 
              height={130}
              className="h-16 w-auto"
              priority
            />
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden sm:inline text-black/70 dark:text-white/70">{session?.user?.email}</span>
            <button
              onClick={toggleDarkMode}
              className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={handleSignOut}
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
