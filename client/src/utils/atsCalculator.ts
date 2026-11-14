import { JobItem, TailoredContent } from '../types';

export interface ATSScoreResult {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  metricCount: number;
  totalBullets: number;
  metricPercentage: number;
  powerVerbCount: number;
  breakdown: {
    keywordScore: number; // Max 40
    metricScore: number;  // Max 25
    verbScore: number;    // Max 15
    structureScore: number; // Max 20
  };
}

const COMMON_PM_KEYWORDS = [
  'roadmap', 'product strategy', 'a/b testing', 'experimentation', 'cross-functional',
  'user research', 'metrics', 'kpi', 'gtm', 'launch', 'stakeholder', 'sql', 'analytics',
  'api', 'saas', 'agile', 'scrum', 'data-driven', 'retention', 'conversion',
  'funnel', 'customer-centric', 'scalability', 'ai', 'machine learning', 'growth'
];

const ACTION_POWER_VERBS = [
  'led', 'spearheaded', 'architected', 'scaled', 'accelerated', 'launched',
  'drove', 'designed', 'built', 'reduced', 'increased', 'optimized',
  'pioneered', 'delivered', 'generated', 'transformed', 'negotiated', 'streamlined'
];

export function calculateDynamicAtsScore(
  content: TailoredContent,
  job?: JobItem | null
): ATSScoreResult {
  // 1. Extract target keywords from job description + common keywords
  let targetKeywords: string[] = [...COMMON_PM_KEYWORDS];
  if (job?.keywords) {
    try {
      const parsed = JSON.parse(job.keywords);
      if (Array.isArray(parsed) && parsed.length > 0) {
        targetKeywords = Array.from(new Set([...targetKeywords, ...parsed.map((k: string) => k.toLowerCase())]));
      }
    } catch {}
  }
  if (job?.description) {
    const descLower = job.description.toLowerCase();
    for (const kw of COMMON_PM_KEYWORDS) {
      if (descLower.includes(kw) && !targetKeywords.includes(kw)) {
        targetKeywords.push(kw);
      }
    }
  }

  // 2. Extract full text from resume content
  const allBullets: string[] = [];
  (content.experience || []).forEach((exp) => {
    (exp.bullets || []).forEach((b) => {
      const text = typeof b === 'string' ? b : b.tailored || b.original;
      if (text) allBullets.push(text);
    });
  });

  const skillsText = (content.skills || [])
    .map((s) => `${s.category} ${Array.isArray(s.skills) ? s.skills.join(' ') : ''}`)
    .join(' ');

  const fullText = `${content.summary || ''} ${allBullets.join(' ')} ${skillsText}`.toLowerCase();

  // 3. Keyword Matching Score (Max 40)
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  targetKeywords.forEach((kw) => {
    if (fullText.includes(kw.toLowerCase())) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  });

  const matchRatio = targetKeywords.length > 0 ? matchedKeywords.length / targetKeywords.length : 0.8;
  const keywordScore = Math.min(40, Math.round(matchRatio * 50)); // Scale to max 40

  // 4. Metric Quantification Score (Max 25)
  const metricRegex = /[$%€£]|(?:\d+(?:\.\d+)?(?:k|m|cr|x|\+))/i;
  let metricCount = 0;
  let powerVerbCount = 0;

  allBullets.forEach((bullet) => {
    if (metricRegex.test(bullet)) {
      metricCount++;
    }
    const firstWord = bullet.trim().replace(/^\*\*[^*]+\*\*:\s*/, '').split(/\s+/)[0]?.toLowerCase();
    if (firstWord && ACTION_POWER_VERBS.includes(firstWord)) {
      powerVerbCount++;
    }
  });

  const totalBullets = Math.max(allBullets.length, 1);
  const metricPercentage = Math.round((metricCount / totalBullets) * 100);
  const metricScore = Math.min(25, Math.round((metricCount / totalBullets) * 35));

  // 5. Action Verb Score (Max 15)
  const verbScore = Math.min(15, Math.round((powerVerbCount / totalBullets) * 20));

  // 6. Structure Score (Max 20)
  let structureScore = 0;
  if (content.summary && content.summary.length > 30) structureScore += 5;
  if (content.experience && content.experience.length >= 2) structureScore += 5;
  if (content.skills && content.skills.length >= 2) structureScore += 5;
  const reasonableLengths = allBullets.filter((b) => b.length >= 40 && b.length <= 250).length;
  if (reasonableLengths / totalBullets >= 0.7) structureScore += 5;

  const totalScore = Math.min(99, Math.max(50, keywordScore + metricScore + verbScore + structureScore));

  return {
    score: totalScore,
    matchedKeywords: matchedKeywords.slice(0, 15),
    missingKeywords: missingKeywords.slice(0, 10),
    metricCount,
    totalBullets: allBullets.length,
    metricPercentage,
    powerVerbCount,
    breakdown: {
      keywordScore,
      metricScore,
      verbScore,
      structureScore,
    },
  };
}
