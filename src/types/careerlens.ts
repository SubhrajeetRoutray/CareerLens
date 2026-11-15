export type SkillStatus = 'matched' | 'partial' | 'missing';

export type SkillImportance = 'required' | 'preferred';

export type DifficultyTarget = 'beginner-to-intermediate' | 'intermediate-to-job-ready';

export interface SkillItem {
  id: string;
  name: string;
  category: string;
  importance: SkillImportance;
  status: SkillStatus;
  resumeEvidence: string;
  jdRequirement: string;
  gapAction: string;
}

export interface RoadmapStep {
  id: string;
  phase: string;
  title: string;
  targetSkills: string[];
  difficulty: 'Beginner' | 'Intermediate';
  estimatedHours: number;
  objective: string;
  practiceTask: string;
  verificationCriteria: string;
}

export interface ProjectRecommendation {
  id: string;
  projectTitle: string;
  originalDescription: string;
  diagnosis: string;
  improvedDescription: string;
  highlightedKeywords: string[];
  impactRationale: string;
}

export interface AnalysisResult {
  id: string;
  createdAt: string;
  candidateName: string;
  currentLevelEstimate: string;
  targetRole: string;
  difficultyTarget: DifficultyTarget;
  resumeFileName?: string;
  executiveSummary: string;
  strengths: string[];
  skills: SkillItem[];
  roadmap: RoadmapStep[];
  projectRecommendations: ProjectRecommendation[];
  extractedResumePreview: string;
}

export interface AnalyzeRequestPayload {
  resumeFile?: {
    name: string;
    mimeType: string;
    data: string;
  };
  resumeText?: string;
  jobDescription: string;
  targetRole?: string;
  difficultyTarget: DifficultyTarget;
}

export interface RewriteProjectPayload {
  projectTitle: string;
  originalDescription: string;
  jobDescription: string;
  missingSkills: string[];
  focusAngle: 'impact-metrics' | 'missing-skills' | 'clarity-beginner';
  customNote?: string;
}
