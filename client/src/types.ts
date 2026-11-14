export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  bullets: string[];
}

export interface ProjectItem {
  id: string;
  title: string;
  role: string;
  tools: string[];
  link?: string;
  bullets: string[];
}

export interface SkillCategory {
  category: string;
  skills: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: string;
  honors?: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  year?: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
}

export interface ResumeStyling {
  templateId: TemplateId;
  options: TemplateStyleOptions;
}

export interface ResumeProfile {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  summary: string;
  experience: ExperienceItem[];
  projects: ProjectItem[];
  skills: SkillCategory[];
  education: EducationItem[];
  certifications?: CertificationItem[];
  activities?: ActivityItem[];
  styling?: ResumeStyling;
}

export interface ResumeGuideline {
  id: string;
  rule: string;
  category: string;
  active: boolean;
  createdAt: string;
}

export interface AppSettings {
  id: string;
  activeAiProvider: 'gemini' | 'claude' | 'openai';
  dailyScheduleCron: string;
  maxScrapeJobs: number;
  scrapeDateFrom?: string | null;
  dateFilterPreset: 'past_24h' | 'past_week' | 'past_month' | 'custom';
  keywords: string;
  location: string;
  headless: boolean;
}

export interface JobItem {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  status: 'discovered' | 'tailoring' | 'applied' | 'archived';
  matchScore?: number | null;
  keywords?: string | null;
  postedDate?: string | null;
  createdAt: string;
}

export interface AIStatusResponse {
  activeProvider: 'gemini' | 'claude' | 'openai';
  providers: {
    gemini: { configured: boolean; model: string; connected: boolean; message: string; latencyMs?: number };
    claude: { configured: boolean; model: string; connected: boolean; message: string; latencyMs?: number };
    openai: { configured: boolean; model: string; connected: boolean; message: string; latencyMs?: number };
  };
}

export interface ScraperStatus {
  isRunning: boolean;
  progress: string;
  currentCount: number;
  maxJobs: number;
  lastRunAt: string | null;
  lastResult: { scraped: number; inserted: number; updated: number } | null;
  error: string | null;
}

export interface TailoredBulletDiff {
  original: string;
  tailored: string;
  changes?: string;
  alternatives?: string[];
}

export interface TailoredExperienceItem {
  id: string;
  company: string;
  role: string;
  location: string;
  bullets: (TailoredBulletDiff | string)[];
}

export interface TailoredContent {
  summary: string;
  experience: TailoredExperienceItem[];
  skills: Array<{ category: string; skills: string[] }>;
  atsAnalysis?: {
    score: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    summaryFeedback?: string;
  };
  appliedSections?: string[];
  appliedMap?: Record<string, string>;
  styling?: ResumeStyling;
}

export interface SuggestedGuideline {
  rule: string;
  category: 'metrics' | 'style' | 'summary' | 'formatting' | 'general' | string;
  reasoning: string;
}

export interface TailoredResumeItem {
  id: string;
  jobId: string;
  masterResumeId: string;
  atsScore?: number;
  content: TailoredContent;
  feedbackHistory?: Array<{
    feedback: string;
    timestamp: string;
    section?: string;
    bulletIndex?: number;
    suggestedGuideline?: SuggestedGuideline | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

export type TemplateId =
  | 'harshit'
  | 'minimalist'
  | 'executive'
  | 'ivyleague'
  | 'consulting'
  | 'aispecialist'
  | 'growth'
  | 'enterprise'
  | 'compact'
  | 'nordic';

export interface ProfileItem {
  id: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateMetadata {
  id: TemplateId;
  name: string;
  company: string;
  tagline: string;
  accent: string;
  bestFor: string;
}

export interface TemplateStyleOptions {
  fontFamily: string;
  fontSize: 'compact' | 'standard' | 'relaxed';
  spacing: 'compact' | 'standard' | 'roomy';
  accentColor: string;
}

export interface RenderableResume {
  name: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  summary: string;
  experience: Array<{
    id?: string;
    company: string;
    role: string;
    location: string;
    startDate?: string;
    endDate?: string;
    bullets: string[];
  }>;
  projects?: Array<{
    id?: string;
    title: string;
    role: string;
    tools: string[];
    link?: string;
    bullets: string[];
  }>;
  skills: Array<{
    category: string;
    skills: string[];
  }>;
  education: Array<{
    id?: string;
    institution: string;
    degree: string;
    fieldOfStudy: string;
    graduationYear: string;
    honors?: string;
  }>;
  certifications?: Array<{
    id?: string;
    name: string;
    issuer: string;
    year?: string;
  }>;
}
