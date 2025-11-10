import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowRight, Zap, Brain, BarChart3, Users, Sparkles, Menu, X, ChevronDown, ChevronUp, Shield, Lock, CheckCircle2, Upload, Wand2, Briefcase, FileCheck, HeadphonesIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PixelatedCanvas } from '@/components/ui/pixelated-canvas';
import { FeaturesSection } from '@/components/ui/features-section';
import { AnimatedCounter } from '@/components/ui/animated-counter';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleSignInClick = () => {
    router.push('/auth/signin');
  };

  // Scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm text-black/60 hover:text-black transition">
              How It Works
            </a>
            <a href="#features" className="text-sm text-black/60 hover:text-black transition">
              Features
            </a>
            <a href="#testimonials" className="text-sm text-black/60 hover:text-black transition">
              Reviews
            </a>
            <a href="#faq" className="text-sm text-black/60 hover:text-black transition">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Button size="sm" className="hidden md:inline-flex bg-primary hover:bg-primary/90 text-white" onClick={handleSignInClick}>
              Sign In
            </Button>
            
            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-black/5 transition"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-black/5 bg-white">
            <div className="px-4 py-4 space-y-3">
              <a href="#how-it-works" className="block py-2 text-sm text-black/60 hover:text-black transition" onClick={() => setMobileMenuOpen(false)}>
                How It Works
              </a>
              <a href="#features" className="block py-2 text-sm text-black/60 hover:text-black transition" onClick={() => setMobileMenuOpen(false)}>
                Features
              </a>
              <a href="#testimonials" className="block py-2 text-sm text-black/60 hover:text-black transition" onClick={() => setMobileMenuOpen(false)}>
                Reviews
              </a>
              <a href="#faq" className="block py-2 text-sm text-black/60 hover:text-black transition" onClick={() => setMobileMenuOpen(false)}>
                FAQ
              </a>
              <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-white" onClick={handleSignInClick}>
                Sign In
              </Button>
            </div>
          </div>
        )}
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

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 relative z-10 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Simple Process
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-black">How It Works</h2>
            <p className="text-lg text-black/60 max-w-2xl mx-auto">
              Get started in minutes and land your dream job in 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 relative">
            {[
              {
                step: '01',
                title: 'Upload Your Resume',
                desc: 'Simply upload your existing resume or start from scratch with our templates.',
                icon: Upload,
              },
              {
                step: '02',
                title: 'AI Enhancement',
                desc: 'Our AI analyzes and enhances your resume with tailored suggestions for your target role.',
                icon: Wand2,
              },
              {
                step: '03',
                title: 'Get Matched',
                desc: 'Receive job matches and track your applications all in one place.',
                icon: Briefcase,
              },
            ].map((item, i) => {
              const Icon = item.icon;
              const isMiddle = i === 1;
              return (
                <div key={i} className="relative group">
                  {/* Connection Arrow (Desktop) */}
                  {i < 2 && (
                    <div className="hidden md:block absolute top-12 -right-4 z-10">
                      <ArrowRight className="w-8 h-8 text-primary/30 group-hover:text-primary/50 transition-colors" />
                    </div>
                  )}

                  <div className={`relative bg-white rounded-3xl p-8 border-2 transition-all duration-500 h-full ${
                    isMiddle 
                      ? 'border-primary shadow-lg md:scale-105 md:-translate-y-2' 
                      : 'border-black/5 hover:border-primary/30 hover:shadow-lg hover:scale-105'
                  }`}>
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Step Number Badge */}
                    <div className={`absolute -top-5 -right-5 w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg rotate-12 group-hover:rotate-0 transition-transform duration-500 ${
                      isMiddle ? 'bg-primary' : 'bg-gradient-to-br from-primary to-primary/80'
                    }`}>
                      {item.step}
                    </div>

                    {/* Icon Container */}
                    <div className="relative mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-500">
                      <Icon className="w-10 h-10 text-primary group-hover:scale-110 transition-transform duration-500" />
                    </div>

                    {/* Content */}
                    <div className="relative">
                      <h3 className="text-xl font-bold text-black mb-3 group-hover:text-primary transition-colors duration-300">
                        {item.title}
                      </h3>
                      <p className="text-black/60 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    {/* Decorative Corner Element */}
                    <div className="absolute bottom-4 right-4 w-12 h-12 border-2 border-primary/10 rounded-tl-3xl group-hover:border-primary/30 transition-colors duration-500" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-black/5 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-2 text-center">
              <AnimatedCounter
                value={85}
                suffix="%"
                className="text-3xl sm:text-4xl font-bold text-primary"
              />
              <p className="text-sm text-black/60">Interview success rate</p>
            </div>
            <div className="space-y-2 text-center">
              <AnimatedCounter
                value={10}
                suffix="K+"
                className="text-3xl sm:text-4xl font-bold text-primary"
              />
              <p className="text-sm text-black/60">Resumes enhanced</p>
            </div>
            <div className="space-y-2 text-center">
              <AnimatedCounter
                value={98}
                suffix="%"
                className="text-3xl sm:text-4xl font-bold text-primary"
              />
              <p className="text-sm text-black/60">ATS compatibility</p>
            </div>
            <div className="space-y-2 text-center">
              <AnimatedCounter
                value={5}
                suffix="K+"
                className="text-3xl sm:text-4xl font-bold text-primary"
              />
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

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50/50 to-white relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Success Stories
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-black">Loved by Job Seekers</h2>
            <p className="text-lg text-black/60 max-w-2xl mx-auto">
              See how HireAI helped thousands land their dream jobs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Chen',
                role: 'Software Engineer',
                company: 'Google',
                image: '👩‍💻',
                text: 'HireAI transformed my resume and I landed 5 interviews in one week! The AI suggestions were spot-on and tailored perfectly to each job.',
                rating: 5,
              },
              {
                name: 'Marcus Johnson',
                role: 'Product Designer',
                company: 'Airbnb',
                image: '👨‍🎨',
                text: 'I was struggling to get responses. After using HireAI, my interview rate went from 5% to 40%. Game changer!',
                rating: 5,
              },
              {
                name: 'Priya Patel',
                role: 'Data Analyst',
                company: 'Microsoft',
                image: '👩‍💼',
                text: 'The AI matched me with roles I never considered but turned out to be perfect fits. Got my dream job in 3 weeks!',
                rating: 5,
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-black/5 hover:shadow-lg transition-all duration-300">
                {/* Rating Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-black/70 leading-relaxed mb-6 italic">
                  &ldquo;{testimonial.text}&rdquo;
                </p>

                {/* User Info */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-2xl">
                    {testimonial.image}
                  </div>
                  <div>
                    <div className="font-semibold text-black">{testimonial.name}</div>
                    <div className="text-sm text-black/60">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust & Benefits - Modern Grid */}
          <div className="mt-20">
            <p className="text-center text-sm text-black/40 mb-12 uppercase tracking-wider font-medium">
              Trusted & Secure
            </p>
            <FeaturesSection
              features={[
                {
                  title: 'Enterprise Security',
                  description: 'SOC 2 certified with bank-level 256-bit encryption. Your data is always protected.',
                  icon: <Shield className="w-7 h-7" />,
                },
                {
                  title: 'GDPR Compliant',
                  description: 'Full compliance with data protection regulations. You own and control your data.',
                  icon: <Lock className="w-7 h-7" />,
                },
                {
                  title: 'ATS Optimized',
                  description: 'Every resume passes Applicant Tracking Systems with optimized formatting.',
                  icon: <FileCheck className="w-7 h-7" />,
                },
                {
                  title: '24/7 Support',
                  description: 'Our team is available around the clock via chat, email, or phone.',
                  icon: <HeadphonesIcon className="w-7 h-7" />,
                },
              ]}
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Got Questions?
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-black">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'How does the AI resume customization work?',
                a: 'Our AI analyzes job descriptions and your resume, then tailors your experience, skills, and achievements to match what employers are looking for. It optimizes keywords, formats, and content structure to maximize ATS compatibility and recruiter appeal.',
              },
              {
                q: 'Is my data secure and private?',
                a: 'Absolutely. We use bank-level 256-bit encryption, are SOC 2 certified, and fully GDPR compliant. Your resume data is never shared with third parties, and you maintain full control over your information.',
              },
              {
                q: 'How much does HireAI cost?',
                a: 'We offer a free tier for students with basic features. Premium plans start at $9.99/month with unlimited customizations, advanced AI features, and priority support.',
              },
              {
                q: 'Can I use HireAI for multiple job applications?',
                a: 'Yes! You can customize your resume for unlimited job applications. Each customization is saved, so you can track which version was sent where.',
              },
              {
                q: 'Does it work with Applicant Tracking Systems (ATS)?',
                a: 'Yes, all our resumes are ATS-optimized. We use industry-standard formats, proper keyword placement, and clean formatting to ensure your resume passes ATS screening.',
              },
              {
                q: 'What if I need help?',
                a: 'Our support team is available 24/7 via chat, email, or phone. Premium users get priority support with response times under 2 hours.',
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group bg-white rounded-xl border border-black/5 overflow-hidden hover:border-primary/20 transition-colors"
              >
                <summary className="flex items-center justify-between px-6 py-5 cursor-pointer list-none">
                  <span className="font-semibold text-black group-open:text-primary transition-colors">
                    {faq.q}
                  </span>
                  <ChevronDown className="w-5 h-5 text-black/40 group-open:rotate-180 group-open:text-primary transition-all flex-shrink-0 ml-4" />
                </summary>
                <div className="px-6 pb-5 text-black/60 leading-relaxed border-t border-black/5 pt-4">
                  {faq.a}
                </div>
              </details>
            ))}
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

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-6 h-6 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}
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
