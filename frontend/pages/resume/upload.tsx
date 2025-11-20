import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Upload, FileText, AlertCircle, Loader2, CheckCircle2, ArrowLeft, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import dynamic from 'next/dynamic';
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background';

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

  // Backend base URL (FastAPI service)
  const backend = process.env.NEXT_PUBLIC_RESUME_SERVICE_URL || 'http://localhost:8083';

  // Fetch usage stats on mount
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await axios.get(`${backend}/api/user/usage`, {
          headers: {
            'x-user-id': session?.user?.email || 'anonymous'
          }
        });
        setUsage(response.data);
      } catch (err) {
        console.error('Failed to fetch usage:', err);
      }
    };
    fetchUsage();
  }, [session, backend]);

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
        setError('Please upload a PDF file');
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError(null);
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
      } else {
        setError('Please upload a PDF file');
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

      const targetUrl = `${backend}/api/resume/upload?enhance=false`;
      console.log('Uploading to backend...', { url: targetUrl, userId: session?.user?.email || 'anonymous' });

      const response = await axios.post(targetUrl, formData, {
        headers: {
          'x-user-id': session?.user?.email || 'anonymous'
        }
      });

      console.log('Upload successful:', response.data);
      const { resume_id } = response.data;
      
      // Redirect to enhancement page
      router.push(`/resume/${resume_id}/enhance`);
    } catch (err: any) {
      console.error('Upload error:', err);
      console.error('Error response:', err.response?.data);

      if (err.response?.status === 429) {
        setError(err.response.data.detail.message || 'Rate limit exceeded');
      } else if (err.response) {
        // Backend responded with an error status
        setError(err.response.data?.detail || `Server error (${err.response.status}).`);
      } else if (err.request) {
        // No response received - likely network issue
        setError(`Network error: cannot reach backend at ${backend}. Is the FastAPI server running on port 8000?`);
      } else {
        setError(err.message || 'Failed to upload resume. Please try again.');
      }
    } finally {
      setUploading(false);
    }
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

        {/* Two-column: Upload left, PDF preview right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Area */}
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
                    Maximum file size: 5MB. Backend: {backend}
                  </p>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-4 border border-red-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
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
          {/* PDF Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-h-[600px]">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Preview</h3>
            <ResumePdfViewer fileUrl={previewUrl} />
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Step 1: Upload</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Upload your existing resume in PDF format
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Step 2: Review</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Get AI suggestions from 3 expert agents
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Step 3: Download</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Preview and download your enhanced resume
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
