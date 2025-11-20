import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Wand2, Edit3, Eye, Loader2, Sparkles, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

export default function EnhanceResume() {
  const router = useRouter();
  const { id: resumeId } = router.query;
  const { data: session } = useSession();
  
  const [resume, setResume] = useState<any>(null);
  const [enhanced, setEnhanced] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  useEffect(() => {
    if (resumeId) {
      fetchResume();
      fetchUsage();
    }
  }, [resumeId]);

  const backend = process.env.NEXT_PUBLIC_RESUME_SERVICE_URL || 'http://localhost:8083';

  const fetchResume = async () => {
    try {
      const response = await axios.get(`${backend}/api/resume/${resumeId}`);
      setResume(response.data);
      setEditedText(response.data.text);
      
      // Try to fetch existing enhancement
      try {
        const enhancedResponse = await axios.get(`${backend}/api/resume/${resumeId}/latest`);
        setEnhanced(enhancedResponse.data);
      } catch (err) {
        // No enhancement yet
      }
    } catch (err: any) {
      if (err.response) {
        setError(`Failed to load resume (status ${err.response.status})`);
      } else if (err.request) {
        setError(`Network error: cannot reach backend at ${backend}`);
      } else {
        setError(err.message || 'Failed to load resume');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUsage = async () => {
    try {
      const response = await axios.get(`${backend}/api/user/usage`, {
        headers: { 'x-user-id': session?.user?.email || 'anonymous' }
      });
      setUsage(response.data);
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    }
  };

  // Countdown timer for rate limit retry
  useEffect(() => {
    if (!retryAfter) return;
    
    const interval = setInterval(() => {
      setRetryAfter(prev => {
        if (!prev || prev <= 1) {
          clearInterval(interval);
          fetchUsage(); // Refresh usage when timer expires
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [retryAfter]);

  const handleAIEnhance = async () => {
    if (!resumeId || !resume) return;
    
    setEnhancing(true);
    setError(null);

    try {
      console.log('Starting AI enhancement...', { resumeId });

      // Call the enhancement endpoint directly with the resume ID
      // Backend will fetch the resume and enhance it
      const response = await axios.post(
        `${backend}/api/resume/${resumeId}/enhance`,
        {},
        {
          headers: {
            'x-user-id': session?.user?.email || 'anonymous'
          }
        }
      );

      console.log('Enhancement response:', response.data);

      // Fetch the enhanced version
      const enhancedResponse = await axios.get(
        `${backend}/api/resume/${resumeId}/latest`,
        {
          headers: {
            'x-user-id': session?.user?.email || 'anonymous'
          }
        }
      );
      
      console.log('Enhanced version fetched:', enhancedResponse.data);
      setEnhanced(enhancedResponse.data);
      await fetchUsage(); // Refresh usage stats
    } catch (err: any) {
      console.error('Enhancement error:', err);
      console.error('Error response:', err.response?.data);
      if (err.response?.status === 429) {
        const retryHeader = err.response.headers?.['retry-after'];
        if (retryHeader) {
          setRetryAfter(parseInt(retryHeader));
        }
        setError(err.response.data.detail?.message || err.response.data?.detail || 'Rate limit exceeded. Please wait before trying again.');
      } else if (err.response?.status === 404) {
        setError('Enhancement endpoint not found. Using fallback method...');
        // Fallback: just show the original as "enhanced"
        setEnhanced(resume);
      } else if (err.response) {
        setError(err.response?.data?.detail || err.message || `Failed to enhance resume (status ${err.response.status}).`);
      } else if (err.request) {
        setError(`Network error: cannot reach backend at ${backend}`);
      } else {
        setError(err.message || 'Failed to enhance resume. Please try again.');
      }
    } finally {
      setEnhancing(false);
    }
  };

  const handlePreview = () => {
    router.push(`/resume/${resumeId}/preview`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center" style={{ backgroundImage: 'radial-gradient(#00000030 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/30 via-white to-green-50/20 relative">
      {/* Static dotted pattern overlay */}
      <div className="fixed inset-0 bg-[radial-gradient(#00000030_1px,transparent_1px)] bg-[length:20px_20px] pointer-events-none z-0" />
      {/* Header */}
      <nav className="relative z-10 bg-white/90 backdrop-blur-md border-b border-green-500/10 shadow-sm z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
                  HA
                </div>
                <h1 className="text-xl font-bold text-gray-900">Resume Enhancer</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {usage && (
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {usage.daily && (
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-gray-500">Daily</span>
                      <span>
                        <span className="font-medium text-primary">{usage.daily.remaining}</span>
                        <span className="text-gray-400">/{usage.daily.limit}</span>
                      </span>
                    </div>
                  )}
                  {usage.monthly && (
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-gray-500">Monthly</span>
                      {usage.monthly.unlimited ? (
                        <span className="text-primary font-medium">∞</span>
                      ) : (
                        <span>
                          <span className="font-medium text-primary">{usage.monthly.remaining}</span>
                          <span className="text-gray-400">/{usage.monthly.limit}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Enhance Your Resume</h2>
          <p className="text-gray-600">
            Choose to edit manually or let our AI agents enhance it for you
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
                {retryAfter && retryAfter > 0 && (
                  <p className="text-xs text-red-600 mt-2">
                    Retry available in: {Math.floor(retryAfter / 3600)}h {Math.floor((retryAfter % 3600) / 60)}m {retryAfter % 60}s
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Original Resume */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-green-500/20 p-6 hover:shadow-xl hover:border-green-500/40 transition-all relative overflow-hidden">
            {/* Gradient top border */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-600" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Original Resume</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(!editMode)}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {editMode ? 'View' : 'Edit'}
              </Button>
            </div>
            
            {editMode ? (
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm"
                aria-label="Edit resume text"
                placeholder="Edit resume text here"
                title="Edit resume text"
              />
            ) : (
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                  {resume?.text}
                </pre>
                <div className="mt-2 text-xs text-gray-400">Backend: {backend}</div>
              </div>
            )}
          </div>

          {/* AI Suggestions / Enhanced Version */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-green-500/20 p-6 hover:shadow-xl hover:border-green-500/40 transition-all relative overflow-hidden">
            {/* Gradient top border */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-600" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {enhanced ? 'AI Enhanced Version' : 'AI Suggestions'}
              </h3>
              {enhanced && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Enhanced
                </span>
              )}
            </div>

            {enhanced ? (
              <div className="space-y-6">
                {/* Enhanced Text */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Final Enhanced Version:</h4>
                  <div className="prose prose-sm max-w-none bg-gray-50 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                      {enhanced.sections[0]?.text}
                    </pre>
                    <div className="mt-2 text-xs text-gray-400">Backend: {backend}</div>
                  </div>
                </div>

                {/* Suggestions from Agents */}
                {enhanced.sections[0]?.suggestions && enhanced.sections[0].suggestions.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Key Suggestions (from all agents):</h4>
                    <ul className="space-y-2">
                      {enhanced.sections[0].suggestions.map((suggestion: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Individual Agent Outputs */}
                {enhanced.sections[0]?.agent_outputs && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Individual Agent Analysis:</h4>
                    
                    {/* Resume Writer */}
                    {enhanced.sections[0].agent_outputs.resume_writer && (
                      <details className="mb-3 border border-gray-200 rounded-lg">
                        <summary className="cursor-pointer p-3 bg-gray-50 rounded-lg font-medium text-gray-900 hover:bg-gray-100">
                          📝 Resume Writer ({(enhanced.sections[0].agent_outputs.resume_writer.confidence * 100).toFixed(0)}% confidence)
                        </summary>
                        <div className="p-3 space-y-2">
                          <p className="text-sm text-gray-700">{enhanced.sections[0].agent_outputs.resume_writer.text}</p>
                          {enhanced.sections[0].agent_outputs.resume_writer.suggestions?.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-semibold text-gray-600 mb-1">Suggestions:</p>
                              <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                                {enhanced.sections[0].agent_outputs.resume_writer.suggestions.map((s: string, i: number) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </details>
                    )}

                    {/* ATS Optimizer */}
                    {enhanced.sections[0].agent_outputs.ats_optimizer && (
                      <details className="mb-3 border border-gray-200 rounded-lg">
                        <summary className="cursor-pointer p-3 bg-gray-50 rounded-lg font-medium text-gray-900 hover:bg-gray-100">
                          🎯 ATS Optimizer ({(enhanced.sections[0].agent_outputs.ats_optimizer.confidence * 100).toFixed(0)}% confidence)
                        </summary>
                        <div className="p-3 space-y-2">
                          <p className="text-sm text-gray-700">{enhanced.sections[0].agent_outputs.ats_optimizer.text}</p>
                          {enhanced.sections[0].agent_outputs.ats_optimizer.suggestions?.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-semibold text-gray-600 mb-1">Suggestions:</p>
                              <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                                {enhanced.sections[0].agent_outputs.ats_optimizer.suggestions.map((s: string, i: number) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </details>
                    )}

                    {/* Industry Expert */}
                    {enhanced.sections[0].agent_outputs.industry_expert && (
                      <details className="mb-3 border border-gray-200 rounded-lg">
                        <summary className="cursor-pointer p-3 bg-gray-50 rounded-lg font-medium text-gray-900 hover:bg-gray-100">
                          💼 Industry Expert ({(enhanced.sections[0].agent_outputs.industry_expert.confidence * 100).toFixed(0)}% confidence)
                        </summary>
                        <div className="p-3 space-y-2">
                          <p className="text-sm text-gray-700">{enhanced.sections[0].agent_outputs.industry_expert.text}</p>
                          {enhanced.sections[0].agent_outputs.industry_expert.suggestions?.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-semibold text-gray-600 mb-1">Suggestions:</p>
                              <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                                {enhanced.sections[0].agent_outputs.industry_expert.suggestions.map((s: string, i: number) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                )}

                {/* Overall Confidence */}
                {enhanced.sections[0]?.confidence && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Overall Confidence:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            title={`Confidence ${(enhanced.sections[0].confidence * 100).toFixed(0)}%`}
                            data-width={`${(enhanced.sections[0].confidence * 100).toFixed(0)}%`}
                            style={{ width: `${enhanced.sections[0].confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-primary font-medium">{(enhanced.sections[0].confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Wand2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-6">
                  No AI enhancement yet. Click the button below to get AI-powered suggestions.
                </p>
                <Button
                  onClick={handleAIEnhance}
                  disabled={enhancing || retryAfter !== null || (usage?.monthly && !usage.monthly.unlimited && usage.monthly.remaining === 0) || (usage?.daily && usage.daily.remaining === 0)}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {enhancing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enhancing...
                    </>
                  ) : retryAfter ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2" />
                      Retry in {Math.floor(retryAfter / 60)}:{(retryAfter % 60).toString().padStart(2, '0')}
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Enhance with AI
                    </>
                  )}
                </Button>
                {usage?.monthly && !usage.monthly.unlimited && usage.monthly.remaining === 0 && (
                  <p className="text-sm text-red-600 mt-2">
                    Monthly limit reached. Please upgrade your plan.
                  </p>
                )}
                {usage?.daily && usage.daily.remaining === 0 && !retryAfter && (
                  <p className="text-sm text-yellow-600 mt-2">
                    Daily limit reached (10/day). Try again tomorrow.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/resume/upload')}
          >
            Upload Another
          </Button>
          <Button
            onClick={handlePreview}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview & Download
          </Button>
        </div>
      </main>
    </div>
  );
}
