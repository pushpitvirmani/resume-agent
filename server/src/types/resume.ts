import { z } from 'zod';

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

export interface MasterResumeProfile {
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
  createdAt?: string;
  updatedAt?: string;
}

export type ResumeProfile = MasterResumeProfile;

export const experienceItemSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  company: z.string().min(1, 'Company is required'),
  role: z.string().min(1, 'Role is required'),
  location: z.string().default(''),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().default('Present'),
  isCurrent: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
});

export const projectItemSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  title: z.string().min(1, 'Title is required'),
  role: z.string().default(''),
  tools: z.array(z.string()).default([]),
  link: z.string().optional().default(''),
  bullets: z.array(z.string()).default([]),
});

export const skillCategorySchema = z.object({
  category: z.string().min(1, 'Category is required'),
  skills: z.array(z.string()).default([]),
});

export const educationItemSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  institution: z.string().min(1, 'Institution is required'),
  degree: z.string().min(1, 'Degree is required'),
  fieldOfStudy: z.string().default(''),
  graduationYear: z.string().default(''),
  honors: z.string().optional().default(''),
});

export const resumeProfileSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional().default(''),
  location: z.string().optional().default(''),
  linkedinUrl: z.string().optional().default(''),
  portfolioUrl: z.string().optional().default(''),
  summary: z.string().default(''),
  experience: z.array(experienceItemSchema).default([]),
  projects: z.array(projectItemSchema).default([]),
  skills: z.array(skillCategorySchema).default([]),
  education: z.array(educationItemSchema).default([]),
  certifications: z.array(z.any()).optional().default([]),
  activities: z.array(z.any()).optional().default([]),
});

export const settingsSchema = z.object({
  activeAiProvider: z.enum(['gemini', 'claude', 'openai']).default('gemini'),
  dailyScheduleCron: z.string().default('0 9 * * *'),
  maxScrapeJobs: z.number().int().min(1).max(200).default(25),
  scrapeDateFrom: z.string().nullable().optional(),
  dateFilterPreset: z.enum(['past_24h', 'past_week', 'past_month', 'custom']).default('past_week'),
  keywords: z.string().default('Product Manager'),
  location: z.string().default('Remote'),
  headless: z.boolean().default(true),
});

export const guidelineSchema = z.object({
  rule: z.string().min(3, 'Rule must be at least 3 characters'),
  category: z.string().default('general'),
  active: z.boolean().default(true),
});
