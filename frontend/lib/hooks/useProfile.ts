import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '../http';

export interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  emailVerified: boolean;
  isActive: boolean;
  lastLogin: string;
}

export function useProfile() {
  const { data: session } = useSession();
  const [data, setData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!session) return;
      setLoading(true);
      try {
        const res = await api.get('/api/v1/users/profile');
        if (!cancelled) setData(res.data);
      } catch (e: any) {
        if (!cancelled) setError(e?.response?.data?.message || 'Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [session]);

  return { data, loading, error };
}
