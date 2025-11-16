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
      // Prepare CV data
      let cvData: any;

      if (usingCurrentCV) {
        // Use mock CV data (simulating previously uploaded CV)
        cvData = MOCK_CV_DATA;
      } else if (resumeFile) {
        // TODO: Parse PDF/DOCX file here
        cvData = {
          text: 'Resume content from uploaded file',
          fileName: resumeFile.name,
        };
      }

      // Call job-matcher microservice (returns 202 Accepted with request_id)
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_JOB_MATCHER_URL || 'http://localhost:8010'}/api/v1/jobs/match`,
        {
          user_id: session?.user?.email || 'guest',
          job_url: jobUrl,
          cv_data: cvData,
        },
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <Sparkles className="w-6 h-6 text-talent-primary" />
              <h1 className="text-2xl font-display font-bold text-gray-900">
                AI Job Matcher
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!matchResult ? (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center space-x-2 bg-purple-accent-light text-purple-accent px-4 py-2 rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered Career Intelligence</span>
              </div>
              <h2 className="text-3xl font-display font-bold text-gray-900 tracking-tight">
                Find Your Perfect Match
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Analyze how well your resume matches any job posting. Get instant feedback and optimization tips.
              </p>
            </div>

            {/* Input Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Job URL Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-talent-primary-light rounded-lg">
                    <Briefcase className="w-6 h-6 text-talent-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-semibold text-gray-900">
                      Job Posting
                    </h3>
                    <p className="text-sm text-gray-500">Paste the URL of the job you&apos;re interested in</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="jobUrl" className="block text-sm font-medium text-gray-700">
                    Job URL
                  </label>
                  <input
                    id="jobUrl"
                    type="url"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    placeholder="https://www.indeed.com/viewjob?jk=..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-talent-primary focus:ring-2 focus:ring-talent-primary focus:ring-opacity-10 outline-none transition-all"
                  />
                  <p className="text-xs text-gray-500">
                    Supported: Indeed, LinkedIn, Glassdoor, and more
                  </p>
                </div>
              </div>

              {/* Resume Upload Card */}
              <div className="space-y-4">
                <ResumeUpload
                  resumeFile={resumeFile}
                  onFileChange={(file) => {
                    setResumeFile(file);
                    setUsingCurrentCV(false);
                  }}
                />
                
                {/* Use Current CV Button */}
                <div className="flex items-center justify-center">
                  <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-gray-50 text-gray-500">or</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleUseCurrentCV}
                  disabled={usingCurrentCV}
                  className={`w-full px-4 py-3 border-2 rounded-xl font-medium transition-all ${
                    usingCurrentCV
                      ? 'border-talent-primary bg-talent-primary-light text-talent-primary'
                      : 'border-gray-200 hover:border-talent-primary hover:bg-talent-primary-light text-gray-700 hover:text-talent-primary'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>
                      {usingCurrentCV ? 'Using Current CV ✓' : 'Use Current CV'}
                    </span>
                  </div>
                  {usingCurrentCV && (
                    <p className="text-xs mt-1 text-gray-600">
                      John Doe - Backend Developer (5 years exp.)
                    </p>
                  )}
                </button>
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
                className="px-8 py-4 bg-gradient-to-r from-talent-primary to-talent-primary-hover text-gray-900 rounded-xl font-semibold text-lg shadow-md hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
              <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
                <div className="inline-flex p-3 bg-talent-primary-light rounded-lg mb-4">
                  <TrendingUp className="w-6 h-6 text-talent-primary" />
                </div>
                <h4 className="font-display font-semibold text-gray-900 mb-2">Match Score</h4>
                <p className="text-sm text-gray-600">
                  Get a percentage match score based on skills, experience, and requirements
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
                <div className="inline-flex p-3 bg-purple-accent-light rounded-lg mb-4">
                  <CheckCircle2 className="w-6 h-6 text-purple-accent" />
                </div>
                <h4 className="font-display font-semibold text-gray-900 mb-2">Skill Analysis</h4>
                <p className="text-sm text-gray-600">
                  See which skills you have and which ones you&apos;re missing
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
                <div className="inline-flex p-3 bg-blue-50 rounded-lg mb-4">
                  <FileText className="w-6 h-6 text-blue-500" />
                </div>
                <h4 className="font-display font-semibold text-gray-900 mb-2">Resume Tips</h4>
                <p className="text-sm text-gray-600">
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
