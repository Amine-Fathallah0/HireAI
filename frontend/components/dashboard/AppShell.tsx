import React from 'react';
import { useSession, signOut } from 'next-auth/react';

export const AppShell: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { data: session } = useSession();
  
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
