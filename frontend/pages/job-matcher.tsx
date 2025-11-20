import { useRouter } from 'next/router';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { 
  Sparkles, 
  Upload, 
  FileText, 
  Briefcase, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Download,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JobMatchResults } from '@/components/job-matcher/JobMatchResults';
import { ResumeUpload } from '@/components/job-matcher/ResumeUpload';
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background';

// Mock CV data (simulating previously uploaded CV)
const MOCK_CV_DATA = {
  personal_info: {
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1-555-0123",
    location: "New York, NY"
  },
  summary: "Experienced Python developer with 5 years of backend development expertise. Strong skills in FastAPI, Django, and microservices architecture. Passionate about building scalable APIs and distributed systems.",
  skills: [
    "Python",
    "FastAPI",
    "Django",
    "Docker",
    "PostgreSQL",
    "Redis",
    "REST APIs",
    "Microservices",
    "Git",
    "AWS"
  ],
  experience: [
    {
      title: "Backend Developer",
      company: "Tech Solutions Inc",
      duration: "2021-2024",
      description: "Built and maintained REST APIs using FastAPI. Designed microservices architecture for e-commerce platform.",
      key_achievements: [
        "Led migration from monolith to microservices",
        "Reduced API response time by 40%",
        "Mentored 3 junior developers"
      ]
    },
    {
      title: "Junior Python Developer",
      company: "StartupXYZ",
      duration: "2019-2021",
      description: "Developed backend features for SaaS platform using Django.",
      key_achievements: [
        "Integrated Stripe payment gateway",
        "Built user authentication system"
      ]
    }
  ],
  education: [
    {
      degree: "Bachelor of Science in Computer Science",
      institution: "University of Technology",
      graduation_year: 2019,
      field_of_study: "Computer Science"
    }
  ],
  certifications: [
    "AWS Certified Developer - Associate",
    "Python Professional Certificate"
  ],
  languages: ["English", "Spanish"],
  experience_level: "mid"
};

export default function JobMatcherPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [jobUrl, setJobUrl] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<any>(null);
  const [usingCurrentCV, setUsingCurrentCV] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  const handleUseCurrentCV = () => {
    setUsingCurrentCV(true);
    setResumeFile(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!jobUrl) {
      setError('Please enter a job URL');
      return;
    }

    if (!resumeFile && !usingCurrentCV) {
      setError('Please upload a resume or use your current CV');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMatchResult(null);

    try {
      const userId = session?.user?.email || 'anonymous';
      
      // Send request to job matcher - it will fetch CV data from resume service
      const payload: any = {
        user_id: userId,
        job_url: jobUrl
      };
      
      // Only include cv_data if we don't want the backend to fetch it
      // For "Use Current CV", we let the backend fetch from resume service
      // For uploaded files, we'd need to upload first then pass resume_id
      if (!usingCurrentCV && resumeFile) {
        // TODO: First upload resume to resume service, then use that resume_id
        setError('File upload is not yet implemented. Please use "Use Current CV" for now.');
        setIsLoading(false);
        return;
      }

      // Call job-matcher microservice
      // When usingCurrentCV is true, the backend will fetch CV from resume service
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_JOB_MATCHER_URL || 'http://localhost:8010'}/api/v1/jobs/match`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // API returns request_id and status="queued"
      const { request_id, status } = response.data;
      setRequestId(request_id);
      setProcessingStatus(status);
      
      console.log(`✅ Job match request submitted: ${request_id}, status: ${status}`);
      
      // Start polling for results
      pollForResults(request_id);
      
    } catch (err: any) {
      console.error('Job matching error:', err);
      setError(
        err.response?.data?.detail?.error || 
        err.response?.data?.message || 
        'Failed to analyze job match. Please try again.'
      );
      setIsLoading(false);
    }
  };

  const pollForResults = async (reqId: string) => {
    const maxAttempts = 60; // Poll for up to 5 minutes (60 attempts * 5 seconds)
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_JOB_MATCHER_URL || 'http://localhost:8010'}/api/v1/jobs/match/${reqId}`
        );

        const { status, match_result, error: apiError } = response.data;
        setProcessingStatus(status);

        console.log(`📊 Poll attempt ${attempts}: status=${status}`);

        if (status === 'completed' && match_result) {
          // Success - show results
          setMatchResult(match_result);
          setIsLoading(false);
          console.log('✅ Job matching completed successfully!');
        } else if (status === 'failed') {
          // Failed - show error
          setError(apiError || 'Job matching failed. Please try again.');
          setIsLoading(false);
          console.error('❌ Job matching failed:', apiError);
        } else if (attempts >= maxAttempts) {
          // Timeout
          setError('Job matching is taking longer than expected. Please try again later.');
          setIsLoading(false);
          console.error('⏱️ Polling timeout after', attempts, 'attempts');
        } else {
          // Still processing - poll again
          setTimeout(poll, 5000); // Poll every 5 seconds
        }
      } catch (err: any) {
        console.error('Polling error:', err);
        if (attempts >= maxAttempts) {
          setError('Failed to fetch results. Please try again.');
          setIsLoading(false);
        } else {
          // Retry on error
          setTimeout(poll, 5000);
        }
      }
    };

    poll();
  };

  const handleReset = () => {
    setJobUrl('');
    setResumeFile(null);
    setMatchResult(null);
    setError(null);
    setUsingCurrentCV(false);
    setRequestId(null);
    setProcessingStatus('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/30 via-white to-green-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 relative">
      {/* Static dotted pattern overlay */}
      <div className="fixed inset-0 bg-[radial-gradient(#00000030_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff20_1px,transparent_1px)] bg-[length:20px_20px] pointer-events-none" />
      
      {/* Header */}
      <header className="relative z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-green-500/10 dark:border-green-500/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                AI <span className="text-green-600">Job Matcher</span>
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!matchResult ? (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center space-x-2 bg-green-500/10 backdrop-blur-sm text-green-600 px-4 py-2 rounded-full text-sm font-medium border border-green-500/20">
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered Career Intelligence</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                Find Your <span className="text-green-600 dark:text-green-400">Perfect Match</span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Analyze how well your resume matches any job posting. Get instant feedback and optimization tips.
              </p>
            </div>

            {/* Input Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Job URL Card */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-green-500/20 dark:border-green-500/30 p-6 space-y-4 hover:shadow-lg hover:border-green-500/40 dark:hover:border-green-500/50 transition-all hover:-translate-y-0.5 relative overflow-hidden">
                {/* Gradient overlay */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-600" />
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500/10 dark:bg-green-500/20 rounded-lg">
                    <Briefcase className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Job Posting
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Paste the URL of the job you&apos;re interested in</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="jobUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Job URL
                  </label>
                  <input
                    id="jobUrl"
                    type="url"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    placeholder="https://www.indeed.com/viewjob?jk=..."
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Supported: Indeed, LinkedIn, Glassdoor, and more
                  </p>
                </div>
              </div>

              {/* Resume Options */}
              <div className="space-y-4">
                {/* Use Current CV Card */}
                <button
                  onClick={handleUseCurrentCV}
                  disabled={usingCurrentCV}
                  className={`w-full p-6 border-2 rounded-2xl font-medium transition-all relative overflow-hidden ${
                    usingCurrentCV
                      ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/30 dark:to-green-800/20 text-green-700 dark:text-green-400 shadow-lg'
                      : 'border-green-500/20 dark:border-green-500/30 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:border-green-500/40 dark:hover:border-green-500/50 hover:bg-green-50/50 dark:hover:bg-green-900/20 text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 shadow-sm hover:shadow-lg hover:-translate-y-0.5'
                  }`}
                >
                  {/* Gradient top border */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-600" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${usingCurrentCV ? 'bg-green-500/20 dark:bg-green-500/30' : 'bg-green-500/10 dark:bg-green-500/20'}`}>
                        <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-lg">
                          {usingCurrentCV ? 'Using Current CV ✓' : 'Use Current CV'}
                        </div>
                        {usingCurrentCV && (
                          <p className="text-xs mt-0.5 text-green-600/80 dark:text-green-400/80">
                            John Doe - Backend Developer (5 years exp.)
                          </p>
                        )}
                        {!usingCurrentCV && (
                          <p className="text-xs mt-0.5 text-gray-500 dark:text-gray-400">
                            Use your existing resume from the platform
                          </p>
                        )}
                      </div>
                    </div>
                    {usingCurrentCV && (
                      <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                </button>
                
                {/* Divider */}
                <div className="flex items-center justify-center">
                  <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-gradient-to-b from-green-50/30 via-white to-green-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 text-gray-500 dark:text-gray-400">or</span>
                    </div>
                  </div>
                </div>
                
                {/* Resume Upload Redirect Card */}
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-green-500/20 dark:border-green-500/30 p-8 hover:shadow-lg hover:border-green-500/40 dark:hover:border-green-500/50 transition-all hover:-translate-y-0.5 relative overflow-hidden group cursor-pointer"
                  onClick={() => router.push('/resume/upload')}
                >
                  {/* Gradient overlay */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-600" />
                  
                  <div className="text-center space-y-4">
                    <div className="inline-flex p-4 bg-green-500/10 dark:bg-green-500/20 rounded-2xl group-hover:bg-green-500/20 dark:group-hover:bg-green-500/30 transition-colors">
                      <Upload className="w-12 h-12 text-green-600 dark:text-green-400" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Haven&apos;t Uploaded Your CV?
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Upload and enhance your resume with AI before matching with jobs
                      </p>
                    </div>
                    
                    <div className="pt-2">
                      <div className="inline-flex items-center space-x-2 text-green-600 dark:text-green-400 font-medium group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
                        <span>Go to Resume Enhancer</span>
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Processing Status Display */}
            {isLoading && processingStatus && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-xl flex items-start space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 flex-shrink-0"></div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Processing</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Status: <span className="font-semibold">{processingStatus}</span>
                    {processingStatus === 'processing' && ' - This may take 30-60 seconds...'}
                  </p>
                  {requestId && (
                    <p className="text-xs text-blue-600 mt-1">Request ID: {requestId.slice(0, 8)}...</p>
                  )}
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-900">Error</h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-center space-x-4">
              <Button
                onClick={handleAnalyze}
                disabled={isLoading || !jobUrl || (!resumeFile && !usingCurrentCV)}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border-2 border-green-600"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Analyze Match
                  </>
                )}
              </Button>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 border-2 border-green-500/20 dark:border-green-500/30 text-center hover:shadow-lg hover:border-green-500/40 dark:hover:border-green-500/50 transition-all hover:-translate-y-1 relative overflow-hidden">
                {/* Pixelated corner accent */}
                <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-green-400/20 to-green-600/20" style={{clipPath: 'polygon(0 0, 100% 0, 100% 100%)'}} />
                
                <div className="inline-flex p-3 bg-green-500/10 dark:bg-green-500/20 rounded-lg mb-4">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Match Score</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Get a percentage match score based on skills, experience, and requirements
                </p>
              </div>
              
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 border-2 border-green-500/20 dark:border-green-500/30 text-center hover:shadow-lg hover:border-green-500/40 dark:hover:border-green-500/50 transition-all hover:-translate-y-1 relative overflow-hidden">
                {/* Pixelated corner accent */}
                <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-green-400/20 to-green-600/20" style={{clipPath: 'polygon(0 0, 100% 0, 100% 100%)'}} />
                
                <div className="inline-flex p-3 bg-green-500/10 dark:bg-green-500/20 rounded-lg mb-4">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Skill Analysis</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  See which skills you have and which ones you&apos;re missing
                </p>
              </div>
              
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 border-2 border-green-500/20 dark:border-green-500/30 text-center hover:shadow-lg hover:border-green-500/40 dark:hover:border-green-500/50 transition-all hover:-translate-y-1 relative overflow-hidden">
                {/* Pixelated corner accent */}
                <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-green-400/20 to-green-600/20" style={{clipPath: 'polygon(0 0, 100% 0, 100% 100%)'}} />
                
                <div className="inline-flex p-3 bg-green-500/10 dark:bg-green-500/20 rounded-lg mb-4">
                  <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Resume Tips</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Get AI-powered recommendations to improve your resume
                </p>
              </div>
            </div>
          </div>
        ) : (
          <JobMatchResults 
            result={matchResult} 
            jobUrl={jobUrl}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}

// No authentication required - public access
