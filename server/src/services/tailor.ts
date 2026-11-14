import { prisma } from '../db.js';
import { generateText } from './ai.js';
import { ResumeProfile, ExperienceItem } from '../types/resume.js';

export interface TailoredBulletDiff {
  original: string;
  tailored: string;
  changes?: string;
}

export interface TailoredExperienceItem {
  id: string;
  company: string;
  role: string;
  location: string;
  bullets: TailoredBulletDiff[];
}

export interface TailoredContent {
  summary: string;
  experience: TailoredExperienceItem[];
  skills: Array<{ category: string; skills: string[] }>;
  atsAnalysis: {
    score: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    summaryFeedback: string;
  };
}

export interface SuggestedGuideline {
  rule: string;
  category: 'metrics' | 'style' | 'summary' | 'formatting' | 'general';
  reasoning: string;
}

function parseJSONSafely(text: string): any {
  try {
    return JSON.parse(text);
  } catch (err) {
    // Attempt markdown code block extraction
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      return JSON.parse(match[1]);
    }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      return JSON.parse(text.substring(firstBrace, lastBrace + 1));
    }
    throw new Error(`Failed to parse AI response as JSON: ${text.substring(0, 150)}...`);
  }
}

/**
 * Generate AI-tailored resume for a target job
 */
export async function generateTailoredResume(options: {
  jobId: string;
  masterResumeId?: string;
  model?: string;
}): Promise<any> {
  const { jobId, masterResumeId, model } = options;

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new Error(`Job not found with ID: ${jobId}`);

  let masterResume = masterResumeId
    ? await prisma.masterResume.findUnique({ where: { id: masterResumeId } })
    : await prisma.masterResume.findFirst({ orderBy: { updatedAt: 'desc' } });

  if (!masterResume) throw new Error('No master resume found. Please initialize master resume profile.');

  const activeGuidelines = await prisma.resumeGuideline.findMany({
    where: { active: true },
  });

  const parsedMaster: ResumeProfile = {
    id: masterResume.id,
    name: masterResume.name,
    email: masterResume.email,
    phone: masterResume.phone || '',
    location: masterResume.location || '',
    linkedinUrl: masterResume.linkedinUrl || '',
    portfolioUrl: masterResume.portfolioUrl || '',
    summary: masterResume.summary,
    experience: JSON.parse(masterResume.experience || '[]'),
    projects: JSON.parse(masterResume.projects || '[]'),
    skills: JSON.parse(masterResume.skills || '[]'),
    education: JSON.parse(masterResume.education || '[]'),
    certifications: JSON.parse(masterResume.certifications || '[]'),
  };

  const guidelinesPrompt = activeGuidelines.length > 0
    ? `\n\nMANDATORY USER GUIDELINES (Strictly follow all active rules):\n${activeGuidelines.map((g, i) => `${i + 1}. [${g.category.toUpperCase()}] ${g.rule}`).join('\n')}`
    : '';

  const systemInstruction = `You are an elite Silicon Valley Technical Product Management Resume Coach specializing in FAANG and high-growth AI startups.
Your goal is to tailor the candidate's master resume to perfectly match the target Job Description (JD) while maintaining 100% FACTUAL INTEGRITY.

CORE RULES:
1. NEVER hallucinate or invent companies, roles, dates, degrees, or false metrics. Use ONLY the candidate's actual work history.
2. HARSHIT KUMAR STYLE FORMAT: Every tailored bullet point MUST lead with a bold impact hook in markdown (e.g. "**Platform Extensibility:** Spearheaded...").
3. Highlight metrics (%, $, X improvements) prominently in every experience.
4. Align terminology with the target JD (e.g. if the JD asks for "A/B testing" or "API strategy", emphasize those terms where the candidate performed related work).
5. Compute a realistic ATS score (0-100), extract matched keywords and missing keywords.${guidelinesPrompt}

You MUST return a JSON object adhering to this EXACT schema:
{
  "summary": "Tailored 2-3 sentence executive summary aligned with the target role",
  "experience": [
    {
      "id": "matching experience item id",
      "company": "Company Name",
      "role": "Role Title",
      "location": "Location",
      "bullets": [
        {
          "original": "Original bullet from master resume",
          "tailored": "**Bold Impact Hook:** Rewritten bullet with metrics and keywords",
          "changes": "Brief explanation of how this was tailored to the JD"
        }
      ]
    }
  ],
  "skills": [
    {
      "category": "Category name",
      "skills": ["Skill 1", "Skill 2"]
    }
  ],
  "atsAnalysis": {
    "score": 92,
    "matchedKeywords": ["Keyword 1", "Keyword 2"],
    "missingKeywords": ["Missing Keyword 1"],
    "summaryFeedback": "2-3 sentence strategic analysis of the match"
  }
}`;

  const userPrompt = `TARGET JOB DESCRIPTION:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Description:
${job.description}

---
CANDIDATE MASTER RESUME:
Name: ${parsedMaster.name}
Summary: ${parsedMaster.summary}

Experiences:
${JSON.stringify(parsedMaster.experience, null, 2)}

Skills:
${JSON.stringify(parsedMaster.skills, null, 2)}

Please tailor this resume for the target JD. Output strictly JSON.`;

  const aiResponseText = await generateText(userPrompt, systemInstruction, undefined, { jsonMode: true, model });
  const tailoredContent: TailoredContent = parseJSONSafely(aiResponseText);

  // Validate and persist
  const atsScore = tailoredContent.atsAnalysis?.score || 88;

  // Check if tailored resume already exists for this job
  const existing = await prisma.tailoredResume.findFirst({
    where: { jobId, masterResumeId: masterResume.id },
  });

  let savedRecord;
  if (existing) {
    savedRecord = await prisma.tailoredResume.update({
      where: { id: existing.id },
      data: {
        content: JSON.stringify(tailoredContent),
        atsScore,
        updatedAt: new Date(),
      },
    });
  } else {
    savedRecord = await prisma.tailoredResume.create({
      data: {
        jobId,
        masterResumeId: masterResume.id,
        content: JSON.stringify(tailoredContent),
        atsScore,
        feedbackHistory: JSON.stringify([]),
      },
    });
  }

  // Also update job matchScore in Job table
  await prisma.job.update({
    where: { id: jobId },
    data: {
      matchScore: atsScore,
      status: 'tailoring',
    },
  });

  return {
    id: savedRecord.id,
    jobId: savedRecord.jobId,
    masterResumeId: savedRecord.masterResumeId,
    atsScore,
    content: tailoredContent,
    createdAt: savedRecord.createdAt,
    updatedAt: savedRecord.updatedAt,
  };
}

/**
 * Interactively refine a tailored resume with feedback and suggest candidate guidelines
 */
export async function refineTailoredResume(options: {
  tailoredResumeId: string;
  feedback: string;
  section?: string;
  bulletIndex?: number;
  model?: string;
}): Promise<{
  tailoredResume: any;
  suggestedGuideline?: SuggestedGuideline | null;
}> {
  const { tailoredResumeId, feedback, section, bulletIndex, model } = options;

  const tailoredRecord = await prisma.tailoredResume.findUnique({
    where: { id: tailoredResumeId },
  });
  if (!tailoredRecord) throw new Error(`Tailored resume not found with ID: ${tailoredResumeId}`);

  const job = await prisma.job.findUnique({ where: { id: tailoredRecord.jobId } });
  const currentContent: TailoredContent = JSON.parse(tailoredRecord.content);

  const systemInstruction = `You are an expert Technical PM Resume Coach.
The user wants to refine an already-tailored resume based on specific feedback.

You have two tasks:
1. Apply the user feedback to update the resume content. Maintain the Harshit Kumar style (every bullet leads with a bold impact hook: "**Hook:** ...", strong metrics, no false facts).
2. Evaluate if the user's feedback represents a generalizable rule/preference that should apply to ALL future resumes (e.g. "Always quantify ARR impact", "Never use the word 'orchestrated'", "Keep bullets under 120 characters").
   - If YES, output a 'suggestedGuideline' object with: rule, category ('metrics' | 'style' | 'summary' | 'formatting' | 'general'), and reasoning.
   - If NO (e.g. purely job-specific tweak or typo correction), set 'suggestedGuideline' to null.

Output strictly JSON adhering to this schema:
{
  "updatedContent": {
    "summary": "...",
    "experience": [...],
    "skills": [...],
    "atsAnalysis": {...}
  },
  "suggestedGuideline": {
    "rule": "Clear actionable rule statement",
    "category": "style",
    "reasoning": "Why this rule was derived from user feedback"
  } | null
}`;

  const prompt = `TARGET JOB:
${job?.title} at ${job?.company}

CURRENT TAILORED RESUME CONTENT:
${JSON.stringify(currentContent, null, 2)}

USER FEEDBACK:
"${feedback}"
${section ? `Target Section: ${section}` : ''}
${bulletIndex !== undefined ? `Target Bullet Index: ${bulletIndex}` : ''}

Update the resume and evaluate if a general rule should be suggested. Output strictly JSON.`;

  const responseText = await generateText(prompt, systemInstruction, undefined, { jsonMode: true, model });
  const parsedResponse = parseJSONSafely(responseText);

  const updatedContent = parsedResponse.updatedContent || currentContent;
  const suggestedGuideline: SuggestedGuideline | null = parsedResponse.suggestedGuideline || null;

  // Append to feedback history
  const history = JSON.parse(tailoredRecord.feedbackHistory || '[]');
  history.push({
    feedback,
    timestamp: new Date().toISOString(),
    section,
    bulletIndex,
    suggestedGuideline,
  });

  // Update in DB (NOTE: We DO NOT save suggestedGuideline to ResumeGuideline here! User must confirm!)
  const updatedRecord = await prisma.tailoredResume.update({
    where: { id: tailoredResumeId },
    data: {
      content: JSON.stringify(updatedContent),
      atsScore: updatedContent.atsAnalysis?.score || tailoredRecord.atsScore,
      feedbackHistory: JSON.stringify(history),
      updatedAt: new Date(),
    },
  });

  return {
    tailoredResume: {
      id: updatedRecord.id,
      jobId: updatedRecord.jobId,
      masterResumeId: updatedRecord.masterResumeId,
      atsScore: updatedRecord.atsScore,
      content: updatedContent,
      feedbackHistory: history,
      updatedAt: updatedRecord.updatedAt,
    },
    suggestedGuideline,
  };
}

/**
 * Fetch tailored resume by ID
 */
export async function getTailoredResumeById(id: string): Promise<any> {
  const record = await prisma.tailoredResume.findUnique({ where: { id } });
  if (!record) return null;
  return {
    ...record,
    content: JSON.parse(record.content),
    feedbackHistory: JSON.parse(record.feedbackHistory || '[]'),
  };
}

/**
 * Fetch tailored resume by Job ID
 */
export async function getTailoredResumeByJobId(jobId: string): Promise<any> {
  const record = await prisma.tailoredResume.findFirst({
    where: { jobId },
    orderBy: { updatedAt: 'desc' },
  });
  if (!record) return null;
  return {
    ...record,
    content: JSON.parse(record.content),
    feedbackHistory: JSON.parse(record.feedbackHistory || '[]'),
  };
}

/**
 * Save direct in-place edits to tailored resume
 */
export async function updateTailoredResumeContent(id: string, content: TailoredContent, atsScore?: number): Promise<any> {
  const score = atsScore !== undefined ? atsScore : content.atsAnalysis?.score;
  const record = await prisma.tailoredResume.update({
    where: { id },
    data: {
      content: JSON.stringify(content),
      atsScore: score,
      updatedAt: new Date(),
    },
  });
  return {
    ...record,
    content,
    feedbackHistory: JSON.parse(record.feedbackHistory || '[]'),
  };
}
