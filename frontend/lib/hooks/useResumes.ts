import { useEffect, useState, useCallback } from 'react';
import { api } from '../http';

export type ResumeSource = 'user' | 'builtin';
export interface ResumeItem {
  id: string;
  name: string;
  updatedAt: string;
  source: ResumeSource;
}

export function useResumes(limit = 5) {
  const [data, setData] = useState<ResumeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try user resumes first
        let userList: any[] = [];
        try {
          const res = await api.get(`/api/v1/resumes`, { params: { limit } });
          userList = Array.isArray(res.data) ? res.data : [];
        } catch (e: any) {
          const status = e?.response?.status;
          if (status && status !== 404) {
            // Non-404 errors are shown but we'll still try builtin fallback
            setError(e?.response?.data?.message || 'Failed to load resumes');
          }
        }

        if (!cancelled && userList.length > 0) {
          setData(userList.map((r: any) => ({
            id: String(r.id || r._id),
            name: r.name || r.title || 'Untitled Resume',
            updatedAt: r.updatedAt || r.updated_at || new Date().toISOString(),
            source: 'user' as const,
          })));
          return;
        }

        // Fallback: built-in/platform resume
        try {
          const builtin = await api.get(`/api/v1/resumes/builtin`);
          const payload = builtin.data;
          if (!cancelled && payload) {
            const arr = Array.isArray(payload) ? payload : [payload];
            setData(arr.map((r: any, idx: number) => ({
              id: String(r.id || r._id || `builtin-${idx}`),
              name: r.name || r.title || 'Platform Resume',
              updatedAt: r.updatedAt || r.updated_at || new Date().toISOString(),
              source: 'builtin' as const,
            })));
            return;
          }
        } catch (e: any) {
          const status = e?.response?.status;
          if (status && status !== 404 && !cancelled) {
            setError((prev) => prev || e?.response?.data?.message || 'Failed to load resumes');
          }
        }

        if (!cancelled) {
          setData([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [limit, refreshKey]);

  const createPlatformResume = useCallback(async () => {
    setCreating(true);
    setError(null);
    try {
      try {
        await api.post(`/api/v1/resumes/builtin`);
      } catch (e: any) {
        // Fallback path if backend uses another route
        const status = e?.response?.status;
        if (status === 404) {
          await api.post(`/api/v1/resumes/platform`);
        } else {
          throw e;
        }
      }
      refetch();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to create platform resume');
    } finally {
      setCreating(false);
    }
  }, [refetch]);

  return { data, loading, error, refetch, creating, createPlatformResume };
}
