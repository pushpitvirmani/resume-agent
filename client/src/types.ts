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
