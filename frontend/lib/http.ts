import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';

const baseURL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL,
  // withCredentials can be enabled if gateway uses cookies; we use bearer tokens for now
});

// Inject Authorization header from next-auth session
api.interceptors.request.use(async (config) => {
  const session = await getSession();
  const token = (session as any)?.accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Basic response handler: sign out on 401 to force re-auth
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // Optional: redirect to sign in
      await signOut({ redirect: true, callbackUrl: '/auth/signin' });
    }
    return Promise.reject(error);
  }
);
