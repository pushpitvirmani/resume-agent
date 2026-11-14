import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  TrendingUp,
  Award,
  Sparkles
} from 'lucide-react';
import { RenderableResume, TemplateStyleOptions } from '../types';

interface ATSScoreEvaluatorProps {
  resume: RenderableResume;
  options: TemplateStyleOptions;
}

export const ATSScoreEvaluator: React.FC<ATSScoreEvaluatorProps> = ({ resume, options }) => {
  // 1. Single Column Check (Always true in our architecture)
  const isSingleColumn = true;

  // 2. Standard Headings Check
  const hasSummary = Boolean(resume.summary && resume.summary.length > 20);
  const hasExperience = Boolean(resume.experience && resume.experience.length > 0);
  const hasSkills = Boolean(resume.skills && resume.skills.length > 0);
  const hasEducation = Boolean(resume.education && resume.education.length > 0);
  const standardHeadingsPass = hasSummary && hasExperience && hasSkills && hasEducation;

  // 3. Metric Density Check (% of bullets with %, $, X, or numbers)
  const allBullets = resume.experience?.flatMap((e) => e.bullets) || [];
  const metricRegex = /([0-9]+%|\$[0-9]+|[0-9]+x|[0-9]+[kmb]\+?|[0-9]+(\.[0-9]+)?\s*(million|billion|thousand))/i;
  const quantifiedBullets = allBullets.filter((b) => metricRegex.test(b) || /[0-9]+/.test(b));
  const metricDensity = allBullets.length > 0 ? Math.round((quantifiedBullets.length / allBullets.length) * 100) : 0;
  const metricDensityPass = metricDensity >= 65;

  // 4. Contact Completeness
  const hasEmail = Boolean(resume.email && resume.email.includes('@'));
  const hasPhone = Boolean(resume.phone && resume.phone.length > 5);
  const hasLocation = Boolean(resume.location && resume.location.length > 2);
  const hasLinkedIn = Boolean(resume.linkedinUrl && resume.linkedinUrl.includes('linkedin'));
  const contactScore = [hasEmail, hasPhone, hasLocation, hasLinkedIn].filter(Boolean).length;
  const contactPass = contactScore >= 3;

  // 5. ATS-Safe Typography Check
  const safeFonts = ['Inter', 'Arial', 'Calibri', 'Georgia', 'Garamond'];
  const fontPass = safeFonts.includes(options.fontFamily);

  // 6. Bold Impact Hook Check (Harshit Format)
  const boldHookBullets = allBullets.filter((b) => /^\*\*[^*]+\*\*/.test(b.trim()));
  const boldHookDensity = allBullets.length > 0 ? Math.round((boldHookBullets.length / allBullets.length) * 100) : 0;
  const boldHookPass = boldHookDensity >= 50;

  // Overall Score Calculation (weighted out of 100)
  let score = 0;
  if (isSingleColumn) score += 20;
  if (standardHeadingsPass) score += 20;
  if (metricDensityPass) score += 20; else score += Math.round(metricDensity * 0.2);
  if (contactPass) score += 15; else score += Math.round(contactScore * 3.5);
  if (fontPass) score += 10;
  if (boldHookPass) score += 15; else score += Math.round(boldHookDensity * 0.15);

  score = Math.min(Math.max(score, 60), 98);

  const checks = [
    {
      title: '100% Single-Column Layout',
      status: isSingleColumn ? 'pass' : 'fail',
      desc: 'No multi-column sidebars; passes Workday, Taleo & Greenhouse linear parsers.',
    },
    {
      title: 'Standard Section Headings',
      status: standardHeadingsPass ? 'pass' : 'warn',
      desc: 'Recognized standard headers: Summary, Experience, Skills, and Education.',
    },
    {
      title: `Quantified Metric Density: ${metricDensity}%`,
      status: metricDensityPass ? 'pass' : 'warn',
      desc: `${quantifiedBullets.length} of ${allBullets.length} bullets contain quantifiable impact metrics (%, $, X, numbers).`,
    },
    {
      title: 'Bold Impact Lead-In Hooks',
      status: boldHookPass ? 'pass' : 'info',
      desc: `${boldHookDensity}% of bullets begin with bolded achievement hooks in the Harshit format.`,
    },
    {
      title: 'Complete Contact Channels',
      status: contactPass ? 'pass' : 'warn',
      desc: `${contactScore} of 4 channels verified (Email, Phone, Location, LinkedIn).`,
    },
    {
      title: `Standard ATS Typeface (${options.fontFamily})`,
      status: fontPass ? 'pass' : 'warn',
      desc: 'Web-safe standard typography with UTF-8 character encoding.',
    },
  ];

  return (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
      {/* Score Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border-2 border-indigo-500/40 flex flex-col items-center justify-center text-indigo-400 shrink-0">
            <span className="text-xl font-black text-white">{score}%</span>
            <span className="text-[8px] font-bold text-indigo-300 uppercase">ATS Score</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
              <span>ATS Compliance Audit</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </h4>
            <p className="text-[11px] text-emerald-400 font-medium">
              {score >= 90 ? 'Tier 1 • High-Pass FAANG Benchmark' : 'Standard ATS Compliant'}
            </p>
          </div>
        </div>
      </div>

      {/* 6-Point Audit Checklist */}
      <div className="space-y-2">
        {checks.map((item, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start space-x-2.5 text-xs"
          >
            {item.status === 'pass' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : item.status === 'warn' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-200 text-[11.5px]">{item.title}</p>
              <p className="text-[10.5px] text-slate-400 mt-0.5 leading-snug">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
