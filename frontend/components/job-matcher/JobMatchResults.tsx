import { 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Lightbulb,
  ExternalLink,
  Download,
  RefreshCw,
  Award,
  Target,
  Sparkles,
  Wand2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/router';
import { useState } from 'react';
import axios from 'axios';

interface JobMatchResultsProps {
  result: any;
  jobUrl: string;
  onReset: () => void;
}

export function JobMatchResults({ result, jobUrl, onReset }: JobMatchResultsProps) {
  const router = useRouter();
  const [applyingRecommendations, setApplyingRecommendations] = useState(false);
  
  // Parse the result - handle both direct object and nested structures
  const matchData = result.match_result || result;
  const jobData = result.scraped_job || matchData.scraped_job_details || {};
  
  const matchScore = matchData.overall_match_score || 0;
  const scoreBreakdown = matchData.score_breakdown || {};
  const matchingSkills = matchData.matching_skills || [];
  const missingSkills = matchData.missing_skills || [];
  const resumeOptimization = matchData.resume_optimization || {};
  const recommendationId = matchData.recommendation_id || result.recommendation_id;

  const handleApplyRecommendations = async () => {
    if (!recommendationId) {
      alert('No recommendations available to apply');
      return;
    }

    setApplyingRecommendations(true);
    try {
      // Mark recommendation as applied
      await axios.post(
        `${process.env.NEXT_PUBLIC_RESUME_SERVICE_URL || 'http://localhost:8083'}/api/resume/recommendations/${recommendationId}/apply`
      );

      // Redirect to resume enhancer with recommendation context
      router.push(`/resume/upload?recommendation_id=${recommendationId}`);
    } catch (error) {
      console.error('Failed to apply recommendations:', error);
      alert('Failed to apply recommendations. Please try again.');
      setApplyingRecommendations(false);
    }
  };

  // Determine score color and message
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/10';
    if (score >= 60) return 'bg-amber-50';
    return 'bg-red-50';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 80) return 'Excellent Match!';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Needs Improvement';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-green-500/20 dark:border-green-500/30 p-6 shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Match Analysis <span className="text-green-600 dark:text-green-400">Complete</span>
              </h2>
            </div>
            {jobData.title && (
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{jobData.title}</h3>
                {jobData.company && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">at {jobData.company}</p>
                )}
              </div>
            )}
            <a 
              href={jobUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
            >
              View Original Posting
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </div>
          <Button
            onClick={onReset}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>New Analysis</span>
          </Button>
        </div>
      </div>

      {/* Overall Match Score */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 text-center relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-white opacity-10 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),transparent)]"></div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
            <Sparkles className="w-5 h-5 text-white" />
            <span className="text-white font-medium">Overall Match Score</span>
          </div>
          <div className="space-y-2">
            <div className="text-7xl font-bold text-white drop-shadow-lg">
              {matchScore}%
            </div>
            <p className="text-xl text-white font-medium">
              {getScoreMessage(matchScore)}
            </p>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      {Object.keys(scoreBreakdown).length > 0 && (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-green-500/20 dark:border-green-500/30 p-6 space-y-4 shadow-lg">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Score Breakdown
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(scoreBreakdown).map(([category, score]: [string, any]) => (
              <div key={category} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {category.replace(/_/g, ' ')}
                  </span>
                  <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                    {score}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      score >= 80 ? 'bg-green-500' : 
                      score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Matching Skills */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-green-500/20 dark:border-green-500/30 p-6 space-y-4 shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Matching Skills
            </h3>
          </div>
          {matchingSkills.length > 0 ? (
            <div className="space-y-3">
              {matchingSkills.map((skillObj: any, index: number) => {
                const skillName = typeof skillObj === 'string' ? skillObj : skillObj.skill;
                const candidateLevel = skillObj.candidate_level || '';
                const requiredLevel = skillObj.required_level || '';
                
                return (
                  <div 
                    key={index}
                    className="bg-green-500/10 dark:bg-green-500/20 border border-green-500/30 dark:border-green-500/40 rounded-lg p-3 hover:bg-green-500/15 dark:hover:bg-green-500/25 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-green-700 dark:text-green-300">{skillName}</span>
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    {candidateLevel && requiredLevel && (
                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Your level:</span> {candidateLevel}
                        {' • '}
                        <span className="font-medium">Required:</span> {requiredLevel}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No matching skills identified</p>
          )}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {matchingSkills.length} skill{matchingSkills.length !== 1 ? 's' : ''} match the job requirements
            </p>
          </div>
        </div>

        {/* Missing Skills */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-green-500/20 dark:border-green-500/30 p-6 space-y-4 shadow-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Skills to Develop
            </h3>
          </div>
          {missingSkills.length > 0 ? (
            <div className="space-y-3">
              {missingSkills.map((skillObj: any, index: number) => {
                const skillName = typeof skillObj === 'string' ? skillObj : skillObj.skill;
                const importance = skillObj.importance || '';
                const impact = skillObj.impact_on_score || 0;
                
                return (
                  <div 
                    key={index}
                    className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-900 dark:text-amber-300">{skillName}</span>
                      {impact < 0 && (
                        <span className="text-xs bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full">
                          {impact} pts
                        </span>
                      )}
                    </div>
                    {importance && (
                      <div className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                        <span className="font-medium">Importance:</span> {importance}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">You have all the required skills!</p>
          )}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {missingSkills.length} skill{missingSkills.length !== 1 ? 's' : ''} could strengthen your application
            </p>
          </div>
        </div>
      </div>

      {/* Resume Optimization Tips */}
      {resumeOptimization && Object.keys(resumeOptimization).length > 0 && (
        <div className="bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-900/20 dark:to-green-800/10 backdrop-blur-sm rounded-2xl border-2 border-green-500/20 dark:border-green-500/30 p-6 space-y-4 shadow-lg">
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Resume Optimization Tips
            </h3>
          </div>
          <div className="space-y-3">
            {Object.entries(resumeOptimization).map(([key, value]: [string, any]) => {
              if (typeof value === 'string' && value.length > 0) {
                return (
                  <div key={key} className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                      {key.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {value}
                    </p>
                  </div>
                );
              }
              if (Array.isArray(value) && value.length > 0) {
                return (
                  <div key={key} className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                      {key.replace(/_/g, ' ')}
                    </h4>
                    <ul className="space-y-1">
                      {value.map((item: string, index: number) => (
                        <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                          <span className="text-green-600 dark:text-green-400 mr-2">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-center space-x-4 pt-4 flex-wrap gap-4">
        <Button
          onClick={onReset}
          className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-green-500/30 dark:border-green-500/40 hover:border-green-500 hover:bg-green-500/10 dark:hover:bg-green-500/20 text-gray-700 dark:text-gray-200 hover:text-green-700 dark:hover:text-green-300 rounded-xl font-semibold transition-all"
        >
          Analyze Another Job
        </Button>
        
        {recommendationId && (missingSkills.length > 0 || Object.keys(resumeOptimization).length > 0) && (
          <Button
            onClick={handleApplyRecommendations}
            disabled={applyingRecommendations}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all border-2 border-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wand2 className="w-5 h-5 mr-2" />
            {applyingRecommendations ? 'Applying...' : 'Apply Recommendations to Resume'}
          </Button>
        )}
        
        <Button
          onClick={() => window.print()}
          className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white rounded-xl font-semibold transition-all"
        >
          <Download className="w-5 h-5 mr-2" />
          Save Report
        </Button>
      </div>
    </div>
  );
}
