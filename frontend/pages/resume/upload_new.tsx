import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Upload, FileText, AlertCircle, Loader2, CheckCircle2, ArrowLeft, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import dynamic from 'next/dynamic';
import InteractiveDots from '@/components/ui/interactive-dots';

const ResumePdfViewer = dynamic(() => import('@/components/resume/ResumePdfViewer'), { ssr: false });

export default function UploadResume() {
  const router = useRouter();
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [usage, setUsage] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const backend = process.env.NEXT_PUBLIC_AI_RESUME_ENHANCER_API_URL || 'http://localhost:8082';

  useEffect(() => {
    fetchUsage();
  }, []);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  const fetchUsage = async () => {
    try {
      if (session?.user?.email) {
        const response = await axios.get(`${backend}/api/enhancement/usage`, {
          params: { user_email: session.user.email }
        });
        setUsage(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please upload a PDF file only.');
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload a PDF file only.');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_email', session?.user?.email || 'anonymous');

      const uploadResponse = await axios.post(`${backend}/api/resumes/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000
      });

      if (uploadResponse.data?.resume_id) {
        router.push(`/resume/${uploadResponse.data.resume_id}/enhance`);
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/30 via-white to-green-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 relative">
      {/* Interactive Dots Background */}
      <InteractiveDots
        gridSpacing={30}
        animationSpeed={0.0025}
        removeWaveLine={true}
        adaptToTheme={true}
      />
      
      {/* Header */}
      <header className="relative z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-green-500/10 dark:border-green-500/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
                <Wand2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Resume <span className="text-green-600 dark:text-green-400">Enhancer</span>
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 dark:bg-green-500/20 border border-green-500/20 dark:border-green-500/30 text-green-700 dark:text-green-400 text-sm font-semibold mb-4">
            <Upload className="w-4 h-4" />
            AI Resume Enhancement
          </div>
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Upload Your <span className="text-green-600 dark:text-green-400">Resume</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Upload your resume to get AI-powered suggestions and enhancements
          </p>
        </div>

        {/* Dynamic layout: 2-column before upload, 3-column after upload */}
        <div className={`grid gap-6 ${file && previewUrl ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
          
          {/* Left Column: Info Cards */}
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Step 1: Upload</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Upload your existing resume in PDF format
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Step 2: Review</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Get AI suggestions from 3 expert agents
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Step 3: Download</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Preview and download your enhanced resume
              </p>
            </div>

            {/* Usage Info */}
            {usage && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Daily Usage</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Enhancements</span>
                    <span className="text-gray-900 dark:text-white">{usage.enhancementsToday}/{usage.dailyLimit}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${(usage.enhancementsToday / usage.dailyLimit) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Middle Column: Upload Area */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-green-500/20 dark:border-green-500/30 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 dark:bg-green-500/10 rounded-full blur-3xl" />
            <div
              className={`relative border-2 border-dashed rounded-xl p-12 transition-all duration-300 ${
                dragActive
                  ? 'border-primary bg-primary/5 dark:bg-primary/10'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary/50 dark:hover:border-primary/60 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
                aria-label="Upload resume PDF"
                title="Upload resume PDF"
              />

              <div className="text-center">
                {file ? (
                  <>
                    <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">{file.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Drop your PDF resume here
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      or click to browse
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Maximum file size: 5MB
                    </p>
                  </>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            )}

            {file && (
              <div className="mt-6 flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setFile(null)}
                  disabled={uploading}
                >
                  Clear
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Continue
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
          
          {/* Right Column: PDF Preview - Only show when file is uploaded */}
          {file && previewUrl && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-h-[600px]">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Preview</h3>
              <ResumePdfViewer fileUrl={previewUrl} />
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
