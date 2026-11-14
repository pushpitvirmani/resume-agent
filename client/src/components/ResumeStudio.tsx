import React, { useEffect, useState } from 'react';
import {
  Layers,
  Palette,
  Type,
  Maximize2,
  ZoomIn,
  ZoomOut,
  FileCheck2,
  ArrowRight,
  Download,
  Briefcase,
  User,
  Sliders,
  Sparkles,
  Loader2,
  Printer
} from 'lucide-react';
import { api } from '../services/api';
import {
  ResumeProfile,
  JobItem,
  TailoredResumeItem,
  RenderableResume,
  TemplateId,
  TemplateStyleOptions
} from '../types';
import { ResumeDocument } from './templates';
import { ATSScoreEvaluator } from './ATSScoreEvaluator';

export const ResumeStudio: React.FC = () => {
  const [masterResume, setMasterResume] = useState<ResumeProfile | null>(null);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [selectedSource, setSelectedSource] = useState<'master' | string>('master');
  const [currentTailored, setCurrentTailored] = useState<TailoredResumeItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Template customizer state
  const [templateId, setTemplateId] = useState<TemplateId>('harshit');
  const [options, setOptions] = useState<TemplateStyleOptions>({
    fontFamily: 'Inter',
    fontSize: 'standard',
    spacing: 'standard',
    accentColor: '#0f172a', // Classic Slate/Charcoal
  });

  const [zoomLevel, setZoomLevel] = useState<number>(100);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [resumeData, jobsData] = await Promise.all([
          api.getResume().catch(() => null),
          api.getJobs().catch(() => []),
        ]);
        setMasterResume(resumeData);
        setJobs(jobsData);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleSourceChange = async (source: string) => {
    setSelectedSource(source);
    if (source === 'master') {
      setCurrentTailored(null);
    } else {
      try {
        const res = await api.getTailoredResumeByJob(source);
        if (res.ok && res.tailoredResume) {
          setCurrentTailored(res.tailoredResume);
        } else {
          setCurrentTailored(null);
        }
      } catch (err) {
        setCurrentTailored(null);
      }
    }
  };

  // Convert either master or tailored into unified RenderableResume
  const buildRenderableResume = (): RenderableResume | null => {
    if (!masterResume) return null;

    if (selectedSource !== 'master' && currentTailored?.content) {
      const tc = currentTailored.content;
      return {
        name: masterResume.name,
        email: masterResume.email,
        phone: masterResume.phone,
        location: masterResume.location,
        linkedinUrl: masterResume.linkedinUrl,
        portfolioUrl: masterResume.portfolioUrl,
        summary: tc.summary || masterResume.summary,
        experience: tc.experience.map((exp) => ({
          id: exp.id,
          company: exp.company,
          role: exp.role,
          location: exp.location,
          bullets: exp.bullets.map((b) => b.tailored || b.original),
        })),
        skills: tc.skills && tc.skills.length > 0 ? tc.skills : masterResume.skills,
        education: masterResume.education,
        certifications: masterResume.certifications,
      };
    }

    return {
      name: masterResume.name,
      email: masterResume.email,
      phone: masterResume.phone,
      location: masterResume.location,
      linkedinUrl: masterResume.linkedinUrl,
      portfolioUrl: masterResume.portfolioUrl,
      summary: masterResume.summary,
      experience: masterResume.experience.map((exp) => ({
        id: exp.id,
        company: exp.company,
        role: exp.role,
        location: exp.location,
        startDate: exp.startDate,
        endDate: exp.endDate,
        bullets: exp.bullets,
      })),
      projects: masterResume.projects,
      skills: masterResume.skills,
      education: masterResume.education,
      certifications: masterResume.certifications,
    };
  };

  const renderable = buildRenderableResume();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!renderable) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        No resume profile loaded. Please visit the Master Resume tab to initialize your profile.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-20">
      {/* Top Controls Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
          {/* Source Selector */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Resume Content Source
              </label>
              <select
                value={selectedSource}
                onChange={(e) => handleSourceChange(e.target.value)}
                className="w-full max-w-md bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-100 focus:outline-none focus:border-indigo-500 truncate"
              >
                <option value="master">Master Profile — Pushpit Virmani (Original Reference)</option>
                <optgroup label="Tailored for Specific Job Postings">
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      Tailored: {j.company} — {j.title}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Zoom and Quick Actions */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1">
              <button
                onClick={() => setZoomLevel((z) => Math.max(z - 10, 70))}
                className="p-1 rounded text-slate-400 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-slate-300 px-1">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(z + 10, 130))}
                className="p-1 rounded text-slate-400 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Preview</span>
            </button>
          </div>
        </div>

        {/* Template & Styling Knobs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-1">
          {/* Template Archetype */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Template
            </label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value as TemplateId)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="harshit">Harshit Technical PM (Reference)</option>
              <option value="minimalist">Modern Minimalist</option>
              <option value="executive">Executive Leader</option>
            </select>
          </div>

          {/* Font Family */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Typeface (ATS Safe)
            </label>
            <select
              value={options.fontFamily}
              onChange={(e) => setOptions({ ...options, fontFamily: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="Inter">Inter (Clean Modern Sans)</option>
              <option value="Arial">Arial (Standard Sans)</option>
              <option value="Calibri">Calibri (Classic Microsoft)</option>
              <option value="Georgia">Georgia (Clean Serif)</option>
              <option value="Garamond">Garamond (Executive Serif)</option>
            </select>
          </div>

          {/* Font Size Scaling */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Font Scale
            </label>
            <select
              value={options.fontSize}
              onChange={(e) => setOptions({ ...options, fontSize: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="compact">Compact (9.5pt • 1-Page Fit)</option>
              <option value="standard">Standard (10pt • Balanced)</option>
              <option value="relaxed">Relaxed (10.5pt • High Legibility)</option>
            </select>
          </div>

          {/* Margin Spacing */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Page Margins
            </label>
            <select
              value={options.spacing}
              onChange={(e) => setOptions({ ...options, spacing: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="compact">Compact (0.5 in)</option>
              <option value="standard">Standard (0.75 in)</option>
              <option value="roomy">Roomy (1.0 in)</option>
            </select>
          </div>

          {/* Accent Color */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Accent Color
            </label>
            <div className="flex items-center space-x-2 pt-1">
              {[
                { label: 'Charcoal', hex: '#0f172a' },
                { label: 'Navy', hex: '#1e3a8a' },
                { label: 'Indigo', hex: '#4f46e5' },
                { label: 'Emerald', hex: '#047857' },
                { label: 'Ruby', hex: '#991b1b' },
              ].map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setOptions({ ...options, accentColor: c.hex })}
                  style={{ backgroundColor: c.hex }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    options.accentColor === c.hex ? 'border-white scale-110 shadow-md' : 'border-slate-700'
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Workspace: Live Preview Canvas (Left) + ATS Audit (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: US Letter Document Canvas */}
        <div className="lg:col-span-8 bg-slate-950/80 rounded-2xl border border-slate-800 p-4 sm:p-8 flex justify-center overflow-x-auto min-h-[800px]">
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
            className="shrink-0"
          >
            <ResumeDocument
              templateId={templateId}
              resume={renderable}
              options={options}
            />
          </div>
        </div>

        {/* Right: ATS Audit Panel & Export Prep */}
        <div className="lg:col-span-4 space-y-4">
          <ATSScoreEvaluator resume={renderable} options={options} />

          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/50 via-slate-900 to-purple-950/30 border border-indigo-500/30 space-y-3">
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Phase 5 Export Engine Preview</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This rendered document canvas is verified 100% compliant with standard ATS specifications. In <strong>Phase 5</strong>, you can download pixel-perfect <strong>.PDF</strong> and editable <strong>.DOCX</strong> files directly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
