import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface UserProfile {
  id: number;
  keycloakId: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  isActive: boolean;
  role: string;
  createdAt: string;
  lastLogin: string;
}

export default function Home() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const accessToken = (session as any)?.accessToken;
        
        if (!accessToken) {
          setError('No access token available. Please sign in again.');
          setLoading(false);
          return;
        }

        console.log('Fetching profile with token...');
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/profile`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        console.log('Profile fetched successfully:', response.data);
        setProfile(response.data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        
        if (err.response) {
          // Server responded with error
          setError(`Server error: ${err.response.status} - ${err.response.data?.message || err.message}`);
        } else if (err.request) {
          // Request made but no response
          setError('Network error: Unable to connect to the server. Please ensure the backend is running.');
        } else {
          // Something else happened
          setError(`Error: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [session]);

  const handleSignOut = async () => {
    const keycloakIssuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER || 'http://localhost:8080/realms/resume-platform';
    
    // Get the id_token from session for proper Keycloak logout
    const idToken = (session as any)?.idToken;
    
    if (!idToken) {
      // If no id_token, just sign out from NextAuth
      console.warn('No idToken found, performing local logout only');
      await signOut({ callbackUrl: '/auth/signin' });
      return;
    }
    
    // Build Keycloak logout URL with id_token_hint
    // Redirect back to root instead of signin to avoid loop
    const logoutUrl = `${keycloakIssuer}/protocol/openid-connect/logout?` +
      `id_token_hint=${idToken}&` +
      `post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`;
    
    // Sign out from NextAuth first (clears local session)
    await signOut({ redirect: false });
    
    // Then redirect to Keycloak logout to clear SSO session
    window.location.href = logoutUrl;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Resume Platform
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {session?.user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome, {session?.user?.name || session?.user?.email}!
          </h2>
          
          {loading && (
            <div className="mt-4 text-gray-600">Loading profile...</div>
          )}
          
          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-4 text-red-800">
              Error: {error}
            </div>
          )}
          
          {profile && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold">Your Profile</h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profile.firstName} {profile.lastName}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile.role}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profile.isActive ? 'Active' : 'Inactive'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email Verified</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profile.emailVerified ? 'Yes' : 'No'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Login</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(profile.lastLogin).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }
  
  return {
    props: {},
  };
};

