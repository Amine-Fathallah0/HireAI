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
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JobMatchResultsProps {
  result: any;
  jobUrl: string;
  onReset: () => void;
}

export function JobMatchResults({ result, jobUrl, onReset }: JobMatchResultsProps) {
  // Parse the result - handle both direct object and nested structures
  const matchData = result.match_result || result;
  const jobData = result.scraped_job || matchData.scraped_job_details || {};
  
  const matchScore = matchData.overall_match_score || 0;
  const scoreBreakdown = matchData.score_breakdown || {};
  const matchingSkills = matchData.matching_skills || [];
  const missingSkills = matchData.missing_skills || [];
  const resumeOptimization = matchData.resume_optimization || {};

  // Determine score color and message
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-talent-primary';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-talent-primary-light';
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
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Award className="w-6 h-6 text-talent-primary" />
              <h2 className="text-2xl font-display font-bold text-gray-900">
                Match Analysis Complete
              </h2>
            </div>
            {jobData.title && (
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-gray-700">{jobData.title}</h3>
                {jobData.company && (
                  <p className="text-sm text-gray-500">at {jobData.company}</p>
                )}
              </div>
            )}
            <a 
              href={jobUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-talent-primary hover:text-talent-primary-hover transition-colors"
            >
              View Original Posting
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </div>
          <Button
            onClick={onReset}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>New Analysis</span>
          </Button>
        </div>
      </div>

      {/* Overall Match Score */}
      <div className="bg-gradient-to-br from-talent-primary to-talent-primary-hover rounded-2xl p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-white opacity-10 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),transparent)]"></div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 bg-white bg-opacity-20 px-4 py-2 rounded-full">
            <Sparkles className="w-5 h-5 text-white" />
            <span className="text-white font-medium">Overall Match Score</span>
          </div>
          <div className="space-y-2">
            <div className="text-7xl font-display font-bold text-white">
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
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-purple-accent" />
            <h3 className="text-xl font-display font-semibold text-gray-900">
              Score Breakdown
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(scoreBreakdown).map(([category, score]: [string, any]) => (
              <div key={category} className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {category.replace(/_/g, ' ')}
                  </span>
                  <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                    {score}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      score >= 80 ? 'bg-talent-primary' : 
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
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-talent-primary" />
            <h3 className="text-xl font-display font-semibold text-gray-900">
              Matching Skills
            </h3>
          </div>
          {matchingSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {matchingSkills.map((skill: string, index: number) => (
                <span 
                  key={index}
                  className="px-3 py-1.5 bg-talent-primary-light text-talent-primary-dark border border-talent-primary border-opacity-20 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No matching skills identified</p>
          )}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {matchingSkills.length} skill{matchingSkills.length !== 1 ? 's' : ''} match the job requirements
            </p>
          </div>
        </div>

        {/* Missing Skills */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h3 className="text-xl font-display font-semibold text-gray-900">
              Skills to Develop
            </h3>
          </div>
          {missingSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {missingSkills.map((skill: string, index: number) => (
                <span 
                  key={index}
                  className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">You have all the required skills!</p>
          )}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {missingSkills.length} skill{missingSkills.length !== 1 ? 's' : ''} could strengthen your application
            </p>
          </div>
        </div>
      </div>

      {/* Resume Optimization Tips */}
      {resumeOptimization && Object.keys(resumeOptimization).length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border border-purple-200 p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-6 h-6 text-purple-accent" />
            <h3 className="text-xl font-display font-semibold text-gray-900">
              Resume Optimization Tips
            </h3>
          </div>
          <div className="space-y-3">
            {Object.entries(resumeOptimization).map(([key, value]: [string, any]) => {
              if (typeof value === 'string' && value.length > 0) {
                return (
                  <div key={key} className="bg-white rounded-xl p-4 space-y-2">
                    <h4 className="font-semibold text-gray-900 capitalize">
                      {key.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {value}
                    </p>
                  </div>
                );
              }
              if (Array.isArray(value) && value.length > 0) {
                return (
                  <div key={key} className="bg-white rounded-xl p-4 space-y-2">
                    <h4 className="font-semibold text-gray-900 capitalize">
                      {key.replace(/_/g, ' ')}
                    </h4>
                    <ul className="space-y-1">
                      {value.map((item: string, index: number) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start">
                          <span className="text-purple-accent mr-2">•</span>
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
      <div className="flex items-center justify-center space-x-4 pt-4">
        <Button
          onClick={onReset}
          className="px-6 py-3 bg-white border-2 border-gray-200 hover:border-talent-primary hover:bg-talent-primary-light text-gray-700 hover:text-talent-primary-dark rounded-xl font-semibold transition-all"
        >
          Analyze Another Job
        </Button>
        <Button
          onClick={() => window.print()}
          className="px-6 py-3 bg-gradient-to-r from-talent-primary to-talent-primary-hover text-gray-900 rounded-xl font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all"
        >
          <Download className="w-5 h-5 mr-2" />
          Save Report
        </Button>
      </div>
    </div>
  );
}
