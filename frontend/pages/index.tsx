import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowRight, Zap, Brain, BarChart3, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PixelatedCanvas } from '@/components/ui/pixelated-canvas';

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

// Landing Page Component (shown when not authenticated)
function LandingPage() {
  const router = useRouter();

  const handleSignInClick = () => {
    router.push('/auth/signin');
  };

  return (
    <div className="min-h-screen bg-white text-foreground overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(#00000030_1px,transparent_1px)] bg-[length:20px_20px] pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-black/5 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
              HA
            </div>
            <span className="font-bold text-lg text-foreground">HireAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-black/60 hover:text-black transition">
              Features
            </a>
            <a href="#stats" className="text-sm text-black/60 hover:text-black transition">
              Impact
            </a>
            <a href="#cta" className="text-sm text-black/60 hover:text-black transition">
              Pricing
            </a>
          </div>
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={handleSignInClick}>
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 min-h-screen flex flex-col justify-center">
        {/* Animated Spotlight Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#22c55e]/40 via-[#22c55e]/20 to-transparent rounded-full blur-[100px] opacity-60 animate-pulse" />
          <div
            className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-gradient-to-br from-[#22c55e]/30 to-transparent rounded-full blur-[120px] opacity-50 animate-pulse"
            style={{ animationDelay: '1.5s' }}
          />
          <div
            className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-l from-[#22c55e]/25 to-transparent rounded-full blur-[100px] opacity-40 animate-pulse"
            style={{ animationDelay: '0.75s' }}
          />
        </div>

        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            AI Resume Customization for Students & Job Seekers
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight text-black">
            Land Your Dream Job with
            <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
              {' '}
              AI-Powered Resume
            </span>
            <span> Customization</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl text-black/60 max-w-2xl mx-auto leading-relaxed">
            HireAI adapts your resume for every job application. Our intelligent agents customize your
            experience, skills, and achievements to match job descriptions—increasing your chances of getting noticed by
            recruiters.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white group" onClick={handleSignInClick}>
              Customize Your Resume
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="border-black/10 hover:bg-black/5 text-black bg-white">
              See How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-black/5 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-2 text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary">85%</div>
              <p className="text-sm text-black/60">Interview success rate</p>
            </div>
            <div className="space-y-2 text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary">10K+</div>
              <p className="text-sm text-black/60">Resumes enhanced</p>
            </div>
            <div className="space-y-2 text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary">98%</div>
              <p className="text-sm text-black/60">ATS compatibility</p>
            </div>
            <div className="space-y-2 text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary">5K+</div>
              <p className="text-sm text-black/60">Students helped</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              Powerful Features
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-black">Everything You Need to Land Your Dream Job</h2>
            <p className="text-lg text-black/60 max-w-2xl mx-auto">
              AI-powered tools to create standout resumes, match with opportunities, and ace your job search.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: 'AI Resume Enhancement',
                desc: 'Transform your resume with AI-powered suggestions tailored to your target job, ensuring you stand out.',
                icon: Brain,
                gradient: 'from-primary/10 via-primary/5 to-transparent',
              },
              {
                title: 'Smart Job Matching',
                desc: 'Get matched with jobs that fit your skills and experience using intelligent algorithms.',
                icon: Users,
                gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
              },
              {
                title: 'ATS Optimization',
                desc: 'Score your resume against Applicant Tracking Systems and get tips to improve visibility.',
                icon: BarChart3,
                gradient: 'from-purple-500/10 via-purple-500/5 to-transparent',
              },
              {
                title: 'Career Insights',
                desc: 'Receive personalized career guidance and industry insights powered by AI agents.',
                icon: Zap,
                gradient: 'from-orange-500/10 via-orange-500/5 to-transparent',
              },
            ].map((item, i) => {
              const Icon = item.icon;
              // Different images for each feature card
              const images = [
                'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=800&auto=format&fit=crop', // Team/collaboration
                'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=800&auto=format&fit=crop', // People/diversity
                'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=800&auto=format&fit=crop', // Business
                'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop', // Technology/integration
              ];
              
              return (
                <div
                  key={i}
                  className="group relative p-8 rounded-2xl border border-black/5 hover:border-primary/30 bg-white hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  {/* Pixelated Canvas Background Effect - Static, No Interaction */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <PixelatedCanvas
                      src={images[i]}
                      width={800}
                      height={600}
                      cellSize={6}
                      dotScale={0.8}
                      shape="square"
                      backgroundColor="#FFFFFF"
                      dropoutStrength={0.4}
                      interactive={false}
                      sampleAverage={true}
                      tintColor="#22C55E"
                      tintStrength={0.3}
                      grayscale={false}
                      objectFit="cover"
                      className="rounded-2xl w-full h-full"
                    />
                  </div>

                  {/* Subtle Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/60 to-white/80 pointer-events-none" />

                  <div className="relative z-10">
                    {/* Icon - Simple, No Animation */}
                    <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>

                    {/* Title - Simple Color Change */}
                    <h3 className="font-bold text-xl text-black mb-3 group-hover:text-primary transition-colors duration-200">
                      {item.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-black/60 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-black/5 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-8 p-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <h2 className="text-4xl sm:text-5xl font-bold text-black">Ready to accelerate your career?</h2>
          <p className="text-lg text-black/60">
            Join thousands of students and job seekers using HireAI to land their dream jobs faster.
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-white group mx-auto" onClick={handleSignInClick}>
            Get Started Free
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 py-12 px-4 sm:px-6 lg:px-8 bg-white relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-semibold mb-4 text-black">Product</h4>
              <ul className="space-y-2 text-sm text-black/60">
                <li>
                  <a href="#features" className="hover:text-black transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-black transition">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-black transition">
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-black">Company</h4>
              <ul className="space-y-2 text-sm text-black/60">
                <li>
                  <a href="#" className="hover:text-black transition">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-black transition">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-black transition">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-black">Legal</h4>
              <ul className="space-y-2 text-sm text-black/60">
                <li>
                  <a href="#" className="hover:text-black transition">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-black transition">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-black transition">
                    Cookies
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-black">Connect</h4>
              <ul className="space-y-2 text-sm text-black/60">
                <li>
                  <a href="#" className="hover:text-black transition">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-black transition">
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-black transition">
                    Discord
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-black/5 pt-8 flex flex-col sm:flex-row items-center justify-between text-sm text-black/60">
            <p>&copy; 2025 HireAI. All rights reserved.</p>
            <div className="flex items-center gap-4 mt-4 sm:mt-0">
              <span>Made with</span>
              <span className="text-primary">♥</span>
              <span>for students & job seekers</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Dashboard Component (shown when authenticated)
function Dashboard() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<'valid' | 'refreshing'>('valid');

  // Check for token refresh errors
  useEffect(() => {
    if ((session as any)?.error === 'RefreshAccessTokenError') {
      console.error('Token refresh failed, redirecting to sign in...');
      signOut({ redirect: true, callbackUrl: '/auth/signin' });
    }
  }, [session]);

  // Monitor token expiry
  useEffect(() => {
    if ((session as any)?.expiresAt) {
      const updateStatus = () => {
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = (session as any).expiresAt;
        const secondsUntilExpiry = expiresAt - now;
        
        if (secondsUntilExpiry <= 0) {
          setTokenStatus('refreshing');
        } else if (secondsUntilExpiry <= 120) {
          setTokenStatus('refreshing');
        } else {
          setTokenStatus('valid');
        }
      };

      updateStatus();
      const interval = setInterval(updateStatus, 10000);
      
      return () => clearInterval(interval);
    }
  }, [(session as any)?.expiresAt]);

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
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/profile`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
        });
        console.log('Profile fetched successfully:', response.data);
        setProfile(response.data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        
        if (err.response?.status === 401) {
          console.log('401 Unauthorized: Redirecting to sign-in page...');
          signOut({ redirect: true, callbackUrl: '/auth/signin' });
          return;
        } else if (err.response) {
          setError(`Server error: ${err.response.status} - ${err.response.data?.message || err.message}`);
        } else if (err.request) {
          setError('Network error: Unable to connect to the server. Please ensure the backend is running.');
        } else {
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
    const idToken = (session as any)?.idToken;
    
    if (!idToken) {
      console.warn('No idToken found, performing local logout only');
      await signOut({ callbackUrl: '/' });
      return;
    }
    
    const logoutUrl =
      `${keycloakIssuer}/protocol/openid-connect/logout?` +
      `id_token_hint=${idToken}&` +
      `post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`;
    
    await signOut({ redirect: false });
    window.location.href = logoutUrl;
  };

  const getTokenStatusBadge = () => {
    if (tokenStatus === 'refreshing') {
      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
          <svg
            className="mr-1.5 h-3 w-3 animate-spin text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Refreshing...
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-white border-b border-black/5 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
                HA
              </div>
              <h1 className="text-xl font-bold text-gray-900">HireAI</h1>
              </div>
              {getTokenStatusBadge()}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">{session?.user?.email}</span>
              <Button
                onClick={handleSignOut}
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow border border-black/5">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome, {session?.user?.name || session?.user?.email}!
          </h2>
          
          {loading && (
            <div className="mt-4 flex items-center text-gray-600">
              <svg
                className="animate-spin h-5 w-5 mr-2 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Loading profile...
            </div>
          )}
          
          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-4 border border-red-200">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-red-400 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
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
                  <dd className="mt-1 text-sm text-gray-900">{profile.isActive ? 'Active' : 'Inactive'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email Verified</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile.emailVerified ? 'Yes' : 'No'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Login</dt>
                  <dd className="mt-1 text-sm text-gray-900">{new Date(profile.lastLogin).toLocaleString()}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Main Component
export default function Home() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-10 w-10 text-primary mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page if not authenticated, dashboard if authenticated
  return session ? <Dashboard /> : <LandingPage />;
}

// No server-side redirect - handle auth state on client
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};
