import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Download, ArrowLeft, FileText, Loader2, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
const HarvardResumeLayout = dynamic(() => import('@/components/resume/HarvardResumeLayout'), { ssr: false });
import axios from 'axios';

export default function PreviewResume() {
  const router = useRouter();
  const { id: resumeId } = router.query;
  const { data: session } = useSession();
  
  const [resume, setResume] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [template, setTemplate] = useState<'raw' | 'harvard'>('harvard');

  useEffect(() => {
    if (resumeId) {
      fetchResume();
      fetchVersions();
    }
  }, [resumeId]);

  const backend = process.env.NEXT_PUBLIC_RESUME_SERVICE_URL || 'http://localhost:8083';

  const fetchResume = async () => {
    try {
      // Try to fetch enhanced version first
      const enhancedResponse = await axios.get(
        `${backend}/api/resume/${resumeId}/latest`,
        { headers: { 'x-user-id': session?.user?.email || 'anonymous' } }
      );
      setResume(enhancedResponse.data);
    } catch (err) {
      // Fallback to original
      try {
        const originalResponse = await axios.get(
          `${backend}/api/resume/${resumeId}`,
          { headers: { 'x-user-id': session?.user?.email || 'anonymous' } }
        );
        setResume(originalResponse.data);
      } catch (err2: any) {
        setError('Failed to load resume');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async () => {
    try {
      const response = await axios.get(
        `${backend}/api/resume/${resumeId}/versions`,
        { headers: { 'x-user-id': session?.user?.email || 'anonymous' } }
      );
      setVersions(response.data.versions || []);
    } catch (err) {
      console.error('Failed to fetch versions:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    window.print(); // Browser's print-to-PDF
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Resume not found'}</p>
          <Button onClick={() => router.push('/resume/upload')}>
            Upload New Resume
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header - Hidden on Print */}
      <nav className="border-b border-black/5 bg-white shadow-sm print:hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
                HA
              </div>
              <h1 className="text-xl font-bold text-gray-900">HireAI</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/resume/${resumeId}/enhance`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Edit
              </Button>
              <Button
                size="sm"
                onClick={handleDownloadPDF}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Template toggle - Hidden on Print */}
        <div className="mb-4 print:hidden">
          <label className="text-sm text-gray-700 mr-2">Template:</label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
            aria-label="Resume template selector"
          >
            <option value="harvard">Harvard (single-page)</option>
            <option value="raw">Raw sections</option>
          </select>
        </div>
        {/* Version Selector - Hidden on Print */}
        {versions.length > 0 && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4 print:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-900">Version History</span>
              </div>
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
                aria-label="Select enhanced version"
              >
                <option value={0}>Latest (Enhanced)</option>
                {versions.map((version, idx) => (
                  <option key={idx} value={idx + 1}>
                    Version {versions.length - idx} - {formatDate(version.timestamp)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Resume Preview */}
        <div ref={printRef} className="bg-white rounded-xl shadow-lg border border-gray-200 print:shadow-none print:border-none">
          {template === 'harvard' ? (
            <HarvardResumeLayout resume={resume} profile={{ name: session?.user?.name, email: session?.user?.email }} />
          ) : (
            <div className="mx-auto max-w-[210mm] min-h-[297mm] p-8 sm:p-12 print:p-16">
              <div className="space-y-6">
                {resume.sections?.map((section: any, idx: number) => (
                  <div key={idx} className="space-y-4">
                    {section.title && (
                      <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-primary pb-2">
                        {section.title}
                      </h2>
                    )}
                    {section.text && (
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700">
                          {section.text}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
                {(!resume.sections || resume.sections.length === 0) && resume.text && (
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700">
                      {resume.text}
                    </pre>
                  </div>
                )}
              </div>
              <div className="mt-12 pt-6 border-t border-gray-200 print:hidden">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Created: {formatDate(resume.created_at || new Date().toISOString())}</span>
                  </div>
                  {resume.sections?.[0]?.pii_protected && (
                    <div className="flex items-center gap-2 text-green-600">
                      <FileText className="w-4 h-4" />
                      <span>PII Protected</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions - Hidden on Print */}
        <div className="mt-8 flex justify-center gap-4 print:hidden">
          <Button
            variant="outline"
            onClick={() => router.push('/resume/upload')}
          >
            Upload New Resume
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/resume/${resumeId}/enhance`)}
          >
            Edit Resume
          </Button>
        </div>
      </main>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-none {
            border: none !important;
          }
          .print\\:p-16 {
            padding: 4rem !important;
          }
          @page {
            margin: 0.5in;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
}
