import { signIn, getCsrfToken } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { useRouter } from 'next/router';
import { useState } from 'react';
import axios from 'axios';
import { ArrowRight, Sparkles, Mail, Lock, User, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SignIn() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Check if user was redirected due to session expiry
  const { expired } = router.query;
  const wasExpired = expired === 'true';

  // Sign In Form State
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  // Sign Up Form State
  const [signUpData, setSignUpData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    consentAiProcessing: false
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use NextAuth credentials provider to authenticate with Keycloak
      const result = await signIn('credentials', {
        email: signInData.email,
        password: signInData.password,
        redirect: false
      });

      if (result?.ok) {
        router.push('/');
      } else {
        setError(result?.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError('Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Validate passwords match
    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate consent
    if (!signUpData.consentAiProcessing) {
      setError('You must consent to AI processing to create an account');
      setLoading(false);
      return;
    }

    try {
      // Send registration data to your backend (which creates user in Keycloak)
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register`, {
        firstName: signUpData.firstName,
        lastName: signUpData.lastName,
        email: signUpData.email,
        password: signUpData.password,
        consentAiProcessing: signUpData.consentAiProcessing
      });

      if (response.data) {
        setMessage('Registration successful! You can now sign in with your credentials.');
        setSignUpData({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', consentAiProcessing: false });
        // Switch to sign in form after successful registration
        setTimeout(() => setIsSignUp(false), 2000);
      }
      
    } catch (err: any) {
      console.error('Registration error:', err);
      
      if (err.response) {
        // Server responded with error
        console.log('Full error response:', err.response.data);
        
        let errorMessage = '';
        
        if (err.response.data?.errors) {
          // Handle validation errors
          const errors = err.response.data.errors;
          const errorMessages = Object.values(errors).flat();
          errorMessage = errorMessages.join(', ');
        } else {
          errorMessage = err.response.data?.message || 
                        err.response.data?.error || 
                        `Server error: ${err.response.status}`;
        }
        
        setError(errorMessage);
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

  const handleGoogleSignIn = async () => {
    // Keep Google sign-in via Keycloak
    await signIn('keycloak', 
      { callbackUrl: '/' },
      { kc_idp_hint: 'google' }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#00000030_1px,transparent_1px)] bg-[length:20px_20px] pointer-events-none z-0" />
      
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-r from-primary/30 via-primary/15 to-transparent rounded-full filter blur-[120px] opacity-40 animate-pulse" />
        <div
          className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-primary/20 to-transparent rounded-full filter blur-[100px] opacity-30 animate-pulse"
          style={{ animationDelay: '1.5s' }}
        />
      </div>

      <div className="relative z-10 max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-black/5 p-8 space-y-6">
          {/* Logo and Title */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-lg">
              HA
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {isSignUp ? 'Join HireAI to get started' : 'Sign in to your HireAI account'}
              </p>
            </div>
          </div>

          {/* Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium">
              <Sparkles className="w-3 h-3" />
              AI-Powered Resume Platform
            </div>
          </div>

          {/* Success Message */}
          {message && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{message}</p>
            </div>
          )}

          {/* Session Expired Message */}
          {wasExpired && !message && !error && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
              <p className="text-sm text-yellow-800">Your session has expired. Please sign in again.</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Sign Up Form */}
          {isSignUp ? (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1.5">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="firstName"
                      type="text"
                      required
                      value={signUpData.firstName}
                      onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="John"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="lastName"
                      type="text"
                      required
                      value={signUpData.lastName}
                      onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="Doe"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="signUpEmail" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="signUpEmail"
                    type="email"
                    required
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signUpPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="signUpPassword"
                    type="password"
                    required
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={signUpData.confirmPassword}
                    onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                <input
                  id="consentAiProcessing"
                  type="checkbox"
                  required
                  checked={signUpData.consentAiProcessing}
                  onChange={(e) => setSignUpData({ ...signUpData, consentAiProcessing: e.target.checked })}
                  className="mt-0.5 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="consentAiProcessing" className="text-xs text-gray-700 leading-relaxed">
                  I consent to AI processing of my data for resume enhancement and job matching purposes. <span className="text-red-500">*</span>
                </label>
              </div>

              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-white group"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </div>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            /* Sign In Form */
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={signInData.email}
                    onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={signInData.password}
                    onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-white group"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </div>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Toggle between Sign In and Sign Up */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setMessage('');
              }}
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            variant="outline"
            size="lg"
            className="w-full border-gray-300 hover:bg-gray-50"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </Button>
        </div>

        {/* Footer Link */}
        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-gray-500 hover:text-primary transition-colors inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to home
          </a>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  
  if (session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
  
  return {
    props: {},
  };
};
