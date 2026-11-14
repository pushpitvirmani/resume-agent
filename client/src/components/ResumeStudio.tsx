import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
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
  Printer,
  AlertTriangle,
  CheckCircle2,
  Scissors,
  Edit3,
  Minimize2,
  Info,
  ChevronRight,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { api } from '../services/api';
import {
  ResumeProfile,
  JobItem,
  TailoredResumeItem,
  RenderableResume,
  TemplateId,
  TemplateStyleOptions,
  ProfileItem
} from '../types';
import { ResumeDocument, TEMPLATES_CATALOG } from './templates';
import { ATSScoreEvaluator } from './ATSScoreEvaluator';
import { ProfileModal } from './ProfileModal';
import { RichBulletEditor } from './RichBulletEditor';

// Standard 1-page Letter height at 96 DPI: 11in * 96px = 1056px
const PAGE_MAX_HEIGHT_PX = 1056;

interface ResumeStudioProps {
  preselectedJobId?: string | null;
}

export const ResumeStudio: React.FC<ResumeStudioProps> = ({ preselectedJobId }) => {
  // Profiles state
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('default');
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // Resume data state
  const [masterResume, setMasterResume] = useState<ResumeProfile | null>(null);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [selectedSource, setSelectedSource] = useState<'master' | string>('master');
  const [currentTailored, setCurrentTailored] = useState<TailoredResumeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingDocx, setExportingDocx] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleExportDocx = async () => {
    if (!renderable) return;
    try {
      setExportingDocx(true);
      if (selectedSource !== 'master') {
        await api.exportDocx({ jobId: selectedSource, profileId: activeProfileId });
      } else {
        await api.exportDocx({ resumeData: renderable, profileId: activeProfileId });
      }
    } catch (err: any) {
      alert(`Export failed: ${err.message || 'Error generating DOCX'}`);
    } finally {
      setExportingDocx(false);
    }
  };

  const handleExportPdf = async () => {
    if (!renderable) return;
    try {
      setExportingPdf(true);
      if (selectedSource !== 'master') {
        await api.exportPdf({ jobId: selectedSource, profileId: activeProfileId });
      } else {
        await api.exportPdf({ resumeData: renderable, profileId: activeProfileId });
      }
    } catch (err: any) {
      alert(`PDF Export failed: ${err.message || 'Error generating PDF'}`);
    } finally {
      setExportingPdf(false);
    }
  };

  // Template customizer state
  const [templateId, setTemplateId] = useState<TemplateId>('harshit');
  const [options, setOptions] = useState<TemplateStyleOptions>({
    fontFamily: 'Inter',
    fontSize: 'standard',
    spacing: 'standard',
    accentColor: '#0f172a',
  });

  const [zoomLevel, setZoomLevel] = useState<number>(95);
  const [autoFitOnePage, setAutoFitOnePage] = useState<boolean>(true);

  // 1-Page height measurement & overflow diagnostics
  const resumeContainerRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState<number>(0);
  const [isOverflowing, setIsOverflowing] = useState<boolean>(false);
  const [overflowPx, setOverflowPx] = useState<number>(0);

  // Word Bolding / Inline Content Editor Modal
  const [showBulletEditor, setShowBulletEditor] = useState<boolean>(false);
  const [editingExperienceIndex, setEditingExperienceIndex] = useState<number>(0);

  // Load profiles on mount
  const loadProfiles = async () => {
    try {
      const list = await api.getProfiles();
      setProfiles(list);
      const defaultProf = list.find((p) => p.isDefault) || list[0];
      if (defaultProf && activeProfileId === 'default') {
        setActiveProfileId(defaultProf.id);
      }
    } catch (err) {
      console.error('Failed to load profiles:', err);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  // Fetch master resume and jobs for the active profile
  const fetchResumeData = async () => {
    setLoading(true);
    try {
      const [res, jobsList] = await Promise.all([
        api.getResume(activeProfileId),
        api.getJobs(),
      ]);
      setMasterResume(res);
      setJobs(jobsList);
      setSelectedSource('master');
      setCurrentTailored(null);
    } catch (err) {
      console.error('Failed to load resume or jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeProfileId) {
      fetchResumeData();
    }
  }, [activeProfileId]);

  useEffect(() => {
    if (preselectedJobId) {
      setSelectedSource(preselectedJobId);
      api.getTailoredResumeByJob(preselectedJobId).then((res) => {
        if (res.ok && res.tailoredResume) {
          setCurrentTailored(res.tailoredResume);
        }
      }).catch(console.error);
    }
  }, [preselectedJobId]);

  // Handle source switch (master vs tailored job resume)
  const handleSourceChange = async (val: string) => {
    setSelectedSource(val);
    if (val === 'master') {
      setCurrentTailored(null);
    } else {
      try {
        const res = await api.getTailoredResumeByJob(val);
        if (res.ok && res.tailoredResume) {
          setCurrentTailored(res.tailoredResume);
        } else {
          setCurrentTailored(null);
        }
      } catch (err) {
        console.error('Failed to load tailored resume:', err);
      }
    }
  };

  // Convert current state into a unified RenderableResume
  const getRenderableResume = (): RenderableResume | null => {
    if (selectedSource === 'master' || !currentTailored) {
      if (!masterResume) return null;
      return {
        name: masterResume.name || 'Pushpit Virmani',
        email: masterResume.email,
        phone: masterResume.phone,
        location: masterResume.location,
        linkedinUrl: masterResume.linkedinUrl,
        portfolioUrl: masterResume.portfolioUrl,
        summary: masterResume.summary,
        experience: (masterResume.experience || []).map((exp) => ({
          id: exp.id,
          company: exp.company,
          role: exp.role,
          location: exp.location,
          startDate: exp.startDate,
          endDate: exp.endDate,
          bullets: exp.bullets || [],
        })),
        education: (masterResume.education || []).map((edu) => ({
          id: edu.id,
          institution: edu.institution,
          degree: edu.degree,
          fieldOfStudy: edu.fieldOfStudy,
          graduationYear: edu.graduationYear,
          honors: edu.honors,
        })),
        skills: masterResume.skills || [],
        projects: (masterResume.projects || []).map((p) => ({
          id: p.id,
          title: p.title,
          role: p.role,
          tools: p.tools || [],
          link: p.link,
          bullets: p.bullets || [],
        })),
        certifications: masterResume.certifications || [],
      };
    } else {
      const c = currentTailored.content;
      return {
        name: masterResume?.name || 'Pushpit Virmani',
        email: masterResume?.email || '',
        phone: masterResume?.phone || '',
        location: masterResume?.location || '',
        linkedinUrl: masterResume?.linkedinUrl || '',
        portfolioUrl: masterResume?.portfolioUrl || '',
        summary: c.summary || masterResume?.summary || '',
        experience: (c.experience || []).map((exp, idx) => ({
          id: String(idx),
          company: exp.company,
          role: exp.role,
          location: exp.location || '',
          startDate: '',
          endDate: '',
          bullets: (exp.bullets || []).map((b) =>
            typeof b === 'string' ? b : b.tailored || b.original
          ),
        })),
        education: (masterResume?.education || []).map((edu) => ({
          id: edu.id,
          institution: edu.institution,
          degree: edu.degree,
          fieldOfStudy: edu.fieldOfStudy,
          graduationYear: edu.graduationYear,
          honors: edu.honors,
        })),
        skills: c.skills || masterResume?.skills || [],
        projects: (masterResume?.projects || []).map((p) => ({
          id: p.id,
          title: p.title,
          role: p.role,
          tools: p.tools || [],
          link: p.link,
          bullets: p.bullets || [],
        })),
        certifications: masterResume?.certifications || [],
      };
    }
  };

  const renderable = getRenderableResume();

  // Measure container height whenever content, template, or options change
  useLayoutEffect(() => {
    if (resumeContainerRef.current) {
      const scrollH = resumeContainerRef.current.scrollHeight;
      setMeasuredHeight(scrollH);
      const diff = scrollH - PAGE_MAX_HEIGHT_PX;
      if (diff > 8) {
        setIsOverflowing(true);
        setOverflowPx(diff);
      } else {
        setIsOverflowing(false);
        setOverflowPx(0);
      }
    }
  }, [renderable, templateId, options, zoomLevel]);

  // Auto-fit 1-page action: adjust font size and spacing to immediately snap into 1 page
  const handleAutoFitCompact = () => {
    setOptions((prev) => ({
      ...prev,
      fontSize: 'compact',
      spacing: 'compact',
    }));
  };

  // Ultra-compact action if still overflowing
  const handleUltraCompact = () => {
    setOptions((prev) => ({
      ...prev,
      fontSize: 'compact',
      spacing: 'compact',
    }));
    setTemplateId('compact');
  };

  // Save bullet changes made in modal back to master resume or current tailored
  const handleSaveBulletChange = async (expIndex: number, bulletIndex: number, newText: string) => {
    if (!masterResume) return;

    if (selectedSource === 'master') {
      const updatedExp = [...masterResume.experience];
      const updatedBullets = [...updatedExp[expIndex].bullets];
      updatedBullets[bulletIndex] = newText;
      updatedExp[expIndex] = { ...updatedExp[expIndex], bullets: updatedBullets };

      const updatedProfile: ResumeProfile = {
        ...masterResume,
        experience: updatedExp,
      };

      setMasterResume(updatedProfile);
      try {
        await api.updateResume(updatedProfile, activeProfileId);
      } catch (err) {
        console.error('Failed to save master resume bullet update:', err);
      }
    } else if (currentTailored) {
      const updatedExp = [...currentTailored.content.experience];
      if (updatedExp[expIndex]) {
        const updatedBullets = [...updatedExp[expIndex].bullets];
        const existing = updatedBullets[bulletIndex];
        if (typeof existing === 'string') {
          (updatedBullets as any)[bulletIndex] = newText;
        } else {
          updatedBullets[bulletIndex] = {
            ...existing,
            tailored: newText,
          };
        }
        updatedExp[expIndex] = { ...updatedExp[expIndex], bullets: updatedBullets };

        const updatedContent = {
          ...currentTailored.content,
          experience: updatedExp,
        };

        setCurrentTailored({
          ...currentTailored,
          content: updatedContent,
        });

        try {
          await api.updateTailoredResume(currentTailored.id, updatedContent);
        } catch (err) {
          console.error('Failed to update tailored resume bullet:', err);
        }
      }
    }
  };

  // Active profile item
  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  // Active template metadata
  const activeTemplateMeta = TEMPLATES_CATALOG.find((t) => t.id === templateId) || TEMPLATES_CATALOG[0];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Studio Control Bar */}
      <header className="px-5 py-3 bg-slate-900/90 backdrop-blur border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md shadow-indigo-500/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">ATS Resume Studio</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                10 Pro Templates
              </span>
            </div>
            <p className="text-xs text-slate-400">
              One-stop presentation engine • Strictly formatted 1-pager • ATS Compliant
            </p>
          </div>
        </div>

        {/* Profile Selector Pill & Source Picker */}
        <div className="flex items-center gap-3">
          {/* Active Profile Pill */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-all shadow-sm group"
            title="Switch or manage profiles (all profiles maintain 100% independent resumes & rules)"
          >
            <User className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="text-slate-400">Profile:</span>
            <span className="font-semibold text-white max-w-[130px] truncate">
              {activeProfile ? activeProfile.name : 'Pushpit Virmani'}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Resume Version Selector */}
          <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSource}
              onChange={(e) => handleSourceChange(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="master" className="bg-slate-800 text-slate-200">
                Master Resume (Default)
              </option>
              {jobs
                .filter((j) => j.status === 'tailoring' || j.status === 'applied')
                .map((j) => (
                  <option key={j.id} value={j.id} className="bg-slate-800 text-slate-200">
                    Tailored: {j.company} - {j.title}
                  </option>
                ))}
            </select>
          </div>

          {/* Format & Bold Content Button */}
          <button
            onClick={() => setShowBulletEditor(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-medium transition-all"
            title="Select specific words or metrics to bold (Ctrl+B) and add impact hooks"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Format & Bold Words</span>
          </button>

          {/* Download PDF (.pdf) Button */}
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
            title="Download pure ATS 1-page PDF document (.pdf)"
          >
            {exportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{exportingPdf ? 'Generating...' : 'PDF (.pdf)'}</span>
          </button>

          {/* Download Word (.docx) Button */}
          <button
            onClick={handleExportDocx}
            disabled={exportingDocx}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-all shadow-sm disabled:opacity-50"
            title="Download ATS-compliant Word document (.docx)"
          >
            {exportingDocx ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            ) : (
              <Download className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span>{exportingDocx ? 'Generating...' : 'Word (.docx)'}</span>
          </button>

          {/* Print / Browser Print Dialog Button */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-all"
            title="Open browser print dialog (isolated resume sheet only)"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </header>

      {/* 10-Template Carousel Ribbon */}
      <div className="bg-slate-900 border-b border-slate-800 px-5 py-2.5 overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-2.5 min-w-max">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Top Company Templates:
          </span>
          {TEMPLATES_CATALOG.map((tpl) => {
            const isSelected = templateId === tpl.id;
            return (
              <button
                key={tpl.id}
                onClick={() => setTemplateId(tpl.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tpl.accent }}
                />
                <span className="font-semibold">{tpl.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isSelected ? 'bg-indigo-500/30 text-indigo-200' : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {tpl.company}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1-Page Overflow Diagnostic Alert (Live calculation) */}
      {isOverflowing && (
        <div className="bg-amber-950/70 border-b border-amber-600/40 px-5 py-2 text-xs text-amber-200 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>1-Page Overflow Detected:</strong> Content exceeds standard 1-page Letter height by{' '}
              <span className="font-mono font-bold text-amber-300">+{overflowPx}px</span> (~
              {Math.ceil(overflowPx / 20)} lines).
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoFitCompact}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium text-[11px] transition-colors flex items-center gap-1 shadow-sm"
            >
              <Scissors className="w-3 h-3" />
              Auto-Compact Spacing
            </button>
            <button
              onClick={handleUltraCompact}
              className="px-2.5 py-1 bg-amber-800/80 hover:bg-amber-700 text-amber-100 rounded font-medium text-[11px] transition-colors border border-amber-600/40"
            >
              Switch to Max Density (YC)
            </button>
          </div>
        </div>
      )}

      {/* Main Studio Work Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar: Typography, Sizing, Colors & Diagnostics */}
        <aside className="w-72 bg-slate-900 border-r border-slate-800 p-4 overflow-y-auto flex flex-col gap-5 flex-shrink-0">
          {/* Active Template Card */}
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                Active Template
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                {activeTemplateMeta.company}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mb-1">{activeTemplateMeta.name}</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-2">
              {activeTemplateMeta.tagline}
            </p>
            <div className="text-[11px] text-slate-300 bg-slate-800/90 p-2 rounded-lg border border-slate-700/50">
              <span className="text-indigo-400 font-semibold">Best for: </span>
              {activeTemplateMeta.bestFor}
            </div>
          </div>

          {/* 1-Page Auto-Sizing Engine Status */}
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Minimize2 className="w-3.5 h-3.5 text-indigo-400" />
                1-Page Auto-Sizing
              </label>
              <input
                type="checkbox"
                checked={autoFitOnePage}
                onChange={(e) => setAutoFitOnePage(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800 cursor-pointer"
              />
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Standard 1-Page Height:</span>
                <span className="font-mono text-slate-300">{PAGE_MAX_HEIGHT_PX}px</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Current Height:</span>
                <span
                  className={`font-mono font-bold ${
                    isOverflowing ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {measuredHeight}px
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Fit Status:</span>
                {isOverflowing ? (
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Overflow (+{overflowPx}px)
                  </span>
                ) : (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Fits 1-Page Cleanly
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Font Family Options */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-indigo-400" />
              Font Typography
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: 'Inter (Clean)', value: 'Inter' },
                { label: 'Roboto (Modern)', value: 'Roboto' },
                { label: 'Garamond (Ivy)', value: 'Garamond' },
                { label: 'Georgia (Serif)', value: 'Georgia' },
                { label: 'JetBrains (Tech)', value: 'JetBrains Mono' },
                { label: 'Playfair (Classic)', value: 'Playfair Display' },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setOptions({ ...options, fontFamily: f.value })}
                  className={`px-2.5 py-1.5 text-xs rounded-lg border text-left transition-all ${
                    options.fontFamily === f.value
                      ? 'bg-indigo-600/30 border-indigo-500 text-white font-semibold'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sizing & Density Preset (Safe ATS bounds strictly preserved) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Font Size & Density
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'compact', label: 'Compact (9.5pt)' },
                { id: 'standard', label: 'Standard (10.5pt)' },
                { id: 'relaxed', label: 'Roomy (11.5pt)' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setOptions({ ...options, fontSize: s.id as any })}
                  className={`px-2 py-1.5 text-[11px] rounded-lg border text-center transition-all ${
                    options.fontSize === s.id
                      ? 'bg-indigo-600/30 border-indigo-500 text-white font-semibold'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              *Never drops below safe ATS readability threshold (9pt / 12px).
            </p>
          </div>

          {/* Vertical Spacing Preset */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
              Vertical Line Spacing
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'compact', label: 'Compact (1.35)' },
                { id: 'standard', label: 'Standard (1.5)' },
                { id: 'roomy', label: 'Roomy (1.65)' },
              ].map((sp) => (
                <button
                  key={sp.id}
                  onClick={() => setOptions({ ...options, spacing: sp.id as any })}
                  className={`px-2 py-1.5 text-[11px] rounded-lg border text-center transition-all ${
                    options.spacing === sp.id
                      ? 'bg-indigo-600/30 border-indigo-500 text-white font-semibold'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color Palette */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-400" />
              Theme Accent Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { name: 'Charcoal Slate', color: '#0f172a' },
                { name: 'Stripe Indigo', color: '#4f46e5' },
                { name: 'Apple Deep Blue', color: '#1e3a8a' },
                { name: 'McKinsey Ocean', color: '#0369a1' },
                { name: 'Uber Emerald', color: '#047857' },
                { name: 'Anthropic Purple', color: '#6366f1' },
                { name: 'YC Crimson Orange', color: '#ea580c' },
                { name: 'Klarna Teal', color: '#0d9488' },
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => setOptions({ ...options, accentColor: c.color })}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    options.accentColor === c.color
                      ? 'scale-125 border-white shadow-md'
                      : 'border-slate-700 hover:scale-110'
                  }`}
                />
              ))}
              <input
                type="color"
                value={options.accentColor}
                onChange={(e) => setOptions({ ...options, accentColor: e.target.value })}
                className="w-6 h-6 rounded-full border border-slate-700 cursor-pointer bg-transparent"
                title="Custom Color"
              />
            </div>
          </div>

          {/* Quick ATS Match Metric */}
          {renderable && (
            <div className="mt-auto pt-3 border-t border-slate-800">
              <ATSScoreEvaluator
                resume={renderable}
                options={options}
              />
            </div>
          )}
        </aside>

        {/* Center Canvas: Live 1-Page Preview Container */}
        <main className="flex-1 bg-slate-950 p-6 overflow-y-auto flex flex-col items-center justify-start relative">
          {/* Zoom & View Controls */}
          <div className="sticky top-0 z-10 mb-4 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-full px-4 py-1.5 flex items-center gap-3 shadow-lg">
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 10, 50))}
              className="text-slate-400 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-medium text-slate-300 w-12 text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 10, 150))}
              className="text-slate-400 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="h-3 w-px bg-slate-700" />
            <button
              onClick={() => setZoomLevel(95)}
              className="text-[11px] font-medium text-slate-400 hover:text-indigo-400 transition-colors"
            >
              Reset (Fit)
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-96 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-xs text-slate-400">Loading profile resume and templates...</p>
            </div>
          ) : !renderable ? (
            <div className="flex flex-col items-center justify-center h-96 gap-3 text-center max-w-sm">
              <Info className="w-8 h-8 text-amber-500" />
              <p className="text-sm font-semibold text-slate-200">No Master Resume Found</p>
              <p className="text-xs text-slate-400">
                Profile "{activeProfile?.name}" does not have master resume data loaded yet.
              </p>
            </div>
          ) : (
            <div
              className="relative transition-transform duration-150 origin-top flex flex-col items-center pb-24"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
              {/* The Standard 8.5in x 11in Page Container (816px x 1056px at 96 DPI) */}
              <div
                id="printable-resume"
                ref={resumeContainerRef}
                className="printable-resume-sheet w-[816px] min-h-[1056px] bg-white text-slate-900 shadow-2xl rounded-sm print:shadow-none print:m-0 print:w-full relative transition-all"
                style={{
                  fontFamily: options.fontFamily,
                }}
              >
                {/* 1-Page Cut-off Limit Marker Line (Visual Guide) */}
                <div
                  className="absolute left-0 right-0 pointer-events-none z-30 print:hidden"
                  style={{ top: `${PAGE_MAX_HEIGHT_PX}px` }}
                >
                  <div className="border-b-2 border-dashed border-red-500/80 w-full relative">
                    <span className="absolute right-3 -top-2.5 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow">
                      1-PAGE CUTOFF BOUNDARY ({PAGE_MAX_HEIGHT_PX}px)
                    </span>
                  </div>
                </div>

                {/* Render the Active Top-Company Template */}
                <ResumeDocument
                  templateId={templateId}
                  resume={renderable!}
                  options={options}
                />
              </div>

              {/* Overflow Notice Tag Below Document */}
              {isOverflowing && (
                <div className="mt-4 p-3 bg-amber-900/30 border border-amber-600/40 rounded-xl text-xs text-amber-300 flex items-center gap-3 max-w-[816px] w-full print:hidden">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold">Content currently spills past 1-page:</p>
                    <p className="text-amber-200/80 text-[11px]">
                      Tip: Use "Format & Bold Words" to trim unnecessary filler, click "Auto-Compact
                      Spacing", or select the "Compact 1-Page Maximum (YC)" template.
                    </p>
                  </div>
                  <button
                    onClick={handleAutoFitCompact}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold whitespace-nowrap"
                  >
                    Auto-Fit 1 Page
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Profile Management Modal */}
      {showProfileModal && (
        <ProfileModal
          profiles={profiles}
          activeProfileId={activeProfileId}
          onSelectProfile={(id) => {
            setActiveProfileId(id);
          }}
          onProfilesChanged={loadProfiles}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Bullet Word-Bolding & Content Editor Modal */}
      {showBulletEditor && renderable && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Bullet Point & Word Formatter</h2>
                  <p className="text-xs text-slate-400">
                    Select words and press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">Ctrl+B</kbd> or click <strong>Bold</strong> to highlight key metrics & metrics hooks.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulletEditor(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Experience Selector Tabs */}
            <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-2">
                Roles:
              </span>
              {renderable.experience.map((exp, idx) => (
                <button
                  key={idx}
                  onClick={() => setEditingExperienceIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    editingExperienceIndex === idx
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {exp.company || `Role ${idx + 1}`}
                </button>
              ))}
            </div>

            {/* Bullet Editors List */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {renderable.experience[editingExperienceIndex] ? (
                renderable.experience[editingExperienceIndex].bullets.map((bullet, bIdx) => (
                  <div key={bIdx} className="space-y-1">
                    <RichBulletEditor
                      label={`Bullet ${bIdx + 1} (${renderable.experience[editingExperienceIndex].company})`}
                      value={bullet}
                      rows={2}
                      onChange={(newVal) =>
                        handleSaveBulletChange(editingExperienceIndex, bIdx, newVal)
                      }
                      placeholder="Start with bold hook: **Hooked Key Metric:** followed by context and impact..."
                    />
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No experience roles available to edit.</p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Changes update the live resume template instantly.
              </div>
              <button
                onClick={() => setShowBulletEditor(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition-colors"
              >
                Done Formatting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
