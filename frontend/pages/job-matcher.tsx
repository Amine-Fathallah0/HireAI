import { useRouter } from 'next/router';
import { useState } from 'react';
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

export default function JobMatcherPage() {
  const router = useRouter();
  
  const [jobUrl, setJobUrl] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!jobUrl) {
      setError('Please enter a job URL');
      return;
    }

    if (!resumeFile && !resumeText) {
      setError('Please upload a resume or paste your resume text');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMatchResult(null);

    try {
      // Prepare CV data
      let cvData: any = {
        text: resumeText || 'Resume content from uploaded file',
      };

      if (resumeFile) {
        // TODO: Parse PDF/DOCX file here
        cvData.fileName = resumeFile.name;
      }

      // Call job-matcher microservice
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_JOB_MATCHER_URL || 'http://localhost:8010'}/api/v1/jobs/extract`,
        {
          job_url: jobUrl,
          cv_data: cvData,
          candidate_id: user?.email || 'guest',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      setMatchResult(response.data);
    } catch (err: any) {
      console.error('Job matching error:', err);
      setError(
        err.response?.data?.detail?.error || 
        err.response?.data?.message || 
        'Failed to analyze job match. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setJobUrl('');
    setResumeFile(null);
    setResumeText('');
    setMatchResult(null);
    setError(null);
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
                    <p className="text-sm text-gray-500">Paste the URL of the job you're interested in</p>
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
              <ResumeUpload
                resumeFile={resumeFile}
                resumeText={resumeText}
                onFileChange={setResumeFile}
                onTextChange={setResumeText}
              />
            </div>

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
                disabled={isLoading || !jobUrl || (!resumeFile && !resumeText)}
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
                  See which skills you have and which ones you're missing
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
