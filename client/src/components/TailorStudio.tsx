import React, { useEffect, useState, useMemo } from 'react';
import {
  Sparkles,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Save,
  MessageSquare,
  ArrowRight,
  Send,
  Loader2,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Check,
  Edit3,
  Download,
  Cpu,
  Layers,
  ArrowLeftRight,
  Award,
  Zap,
  HelpCircle,
  Undo2
} from 'lucide-react';
import { api } from '../services/api';
import {
  JobItem,
  TailoredResumeItem,
  TailoredContent,
  SuggestedGuideline,
  ResumeProfile
} from '../types';
import { GuidelineConfirmationModal } from './GuidelineConfirmationModal';
import { calculateDynamicAtsScore, ATSScoreResult } from '../utils/atsCalculator';
import { renderFormattedBullet } from './templates/HarshitTemplate';

interface TailorStudioProps {
  initialJobId?: string | null;
}

const GEMINI_MODELS = [
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', badge: 'Ultra Fast (~1s)', icon: '⚡' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', badge: 'Deep PM Reasoning', icon: '🧠' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', badge: 'Fast & Balanced', icon: '⚡' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview', badge: 'Next-Gen Thinking', icon: '🚀' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3.0 Flash Preview', badge: 'Preview Fast', icon: '✨' },
];

export const TailorStudio: React.FC<TailorStudioProps> = ({ initialJobId }) => {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [masterResume, setMasterResume] = useState<ResumeProfile | null>(null);
  const [tailoredResume, setTailoredResume] = useState<TailoredResumeItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [tailoring, setTailoring] = useState<boolean>(false);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [exportingDocx, setExportingDocx] = useState<boolean>(false);

  // Gemini Model Selection
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.1-flash-lite');

  // Interactive Section Filter: 'all' | 'summary' | 'skills' | expId
  const [activeSection, setActiveSection] = useState<string>('all');

  // In-place editable state
  const [editableContent, setEditableContent] = useState<TailoredContent | null>(null);

  // Original unedited tailored recommendations (for side-by-side diff)
  const [recommendedContent, setRecommendedContent] = useState<TailoredContent | null>(null);

  // Editing state trackers
  const [editingField, setEditingField] = useState<{
    section: 'summary' | 'bullet' | 'skills';
    expIdx?: number;
    bulletIdx?: number;
  } | null>(null);

  // Conversational refinement
  const [feedbackPrompt, setFeedbackPrompt] = useState<string>('');
  const [refining, setRefining] = useState<boolean>(false);
  const [pendingGuideline, setPendingGuideline] = useState<SuggestedGuideline | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize data
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [jobsList, master] = await Promise.all([
          api.getJobs(),
          api.getResume(),
        ]);
        setJobs(jobsList);
        setMasterResume(master);

        const targetId = initialJobId || (jobsList.length > 0 ? jobsList[0].id : '');
        setSelectedJobId(targetId);

        if (targetId) {
          await loadTailoredForJob(targetId);
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [initialJobId]);

  const loadTailoredForJob = async (jobId: string) => {
    try {
      const res = await api.getTailoredResumeByJob(jobId);
      if (res.ok && res.tailoredResume) {
        setTailoredResume(res.tailoredResume);
        setEditableContent(res.tailoredResume.content);
        setRecommendedContent(res.tailoredResume.content);
      } else {
        setTailoredResume(null);
        setEditableContent(null);
        setRecommendedContent(null);
      }
    } catch (err) {
      console.error('Failed to load tailored resume:', err);
    }
  };

  const handleSelectJob = async (jobId: string) => {
    setSelectedJobId(jobId);
    setLoading(true);
    await loadTailoredForJob(jobId);
    setLoading(false);
  };

  const currentJob = useMemo(() => jobs.find((j) => j.id === selectedJobId), [jobs, selectedJobId]);

  // Real-time Dynamic ATS Score Post Each Change
  const dynamicAts = useMemo<ATSScoreResult | null>(() => {
    if (!editableContent) return null;
    return calculateDynamicAtsScore(editableContent, currentJob);
  }, [editableContent, currentJob]);

  // Generate Tailored Resume with Selected Gemini Model
  const handleGenerateTailoring = async () => {
    if (!selectedJobId) return;
    try {
      setTailoring(true);
      const res = await api.tailorResume(selectedJobId, undefined, selectedModel);
      setTailoredResume(res.tailoredResume);
      setEditableContent(res.tailoredResume.content);
      setRecommendedContent(res.tailoredResume.content);
      setToastMessage(`Resume successfully tailored with ${selectedModel}!`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(`Tailoring failed: ${err.message || 'Error communicating with AI'}`);
    } finally {
      setTailoring(false);
    }
  };

  // Save In-place Edits & Persist Recalculated ATS Score
  const handleSaveInPlaceEdits = async () => {
    if (!tailoredResume || !editableContent) return;
    try {
      setSavingEdit(true);
      const newScore = dynamicAts?.score || tailoredResume.atsScore;
      const res = await api.updateTailoredResume(tailoredResume.id, editableContent, newScore);
      setTailoredResume(res.tailoredResume);
      setToastMessage('Changes and updated ATS score saved successfully!');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(`Save failed: ${err.message || 'Error saving edits'}`);
    } finally {
      setSavingEdit(false);
    }
  };

  // 1-Click Apply AI Recommendation for a specific bullet
  const handleApplyRecommendation = (expIdx: number, bulletIdx: number) => {
    if (!editableContent || !recommendedContent) return;
    const recBullet = recommendedContent.experience[expIdx]?.bullets[bulletIdx];
    if (!recBullet) return;

    const recText = typeof recBullet === 'string' ? recBullet : recBullet.tailored || recBullet.original;

    const updatedExp = [...editableContent.experience];
    const updatedBullets = [...updatedExp[expIdx].bullets];
    const existing = updatedBullets[bulletIdx];

    if (typeof existing === 'string') {
      (updatedBullets as any)[bulletIdx] = recText;
    } else {
      updatedBullets[bulletIdx] = {
        ...existing,
        tailored: recText,
      };
    }

    updatedExp[expIdx] = { ...updatedExp[expIdx], bullets: updatedBullets };
    const updatedContent: TailoredContent = { ...editableContent, experience: updatedExp };
    setEditableContent(updatedContent);

    // Auto-save update
    if (tailoredResume) {
      api.updateTailoredResume(tailoredResume.id, updatedContent).catch(console.error);
    }
  };

  // 1-Click Apply Summary Recommendation
  const handleApplySummaryRecommendation = () => {
    if (!editableContent || !recommendedContent) return;
    const updatedContent = {
      ...editableContent,
      summary: recommendedContent.summary,
    };
    setEditableContent(updatedContent);
    if (tailoredResume) {
      api.updateTailoredResume(tailoredResume.id, updatedContent).catch(console.error);
    }
  };

  // Direct In-Place Edit of Summary
  const handleSummaryChange = (newSummary: string) => {
    if (!editableContent) return;
    setEditableContent({ ...editableContent, summary: newSummary });
  };

  // Direct In-Place Edit of Bullet
  const handleBulletChange = (expIdx: number, bulletIdx: number, newText: string) => {
    if (!editableContent) return;
    const updatedExp = [...editableContent.experience];
    const updatedBullets = [...updatedExp[expIdx].bullets];
    const existing = updatedBullets[bulletIdx];

    if (typeof existing === 'string') {
      (updatedBullets as any)[bulletIdx] = newText;
    } else {
      updatedBullets[bulletIdx] = {
        ...existing,
        tailored: newText,
      };
    }

    updatedExp[expIdx] = { ...updatedExp[expIdx], bullets: updatedBullets };
    setEditableContent({ ...editableContent, experience: updatedExp });
  };

  // Conversational Refinement Submit
  const handleRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackPrompt.trim() || !tailoredResume) return;

    try {
      setRefining(true);
      const res = await api.refineTailoredResume(
        tailoredResume.id,
        feedbackPrompt,
        activeSection !== 'all' ? activeSection : undefined,
        undefined,
        selectedModel
      );
      setTailoredResume(res.tailoredResume);
      setEditableContent(res.tailoredResume.content);
      setRecommendedContent(res.tailoredResume.content);
      setFeedbackPrompt('');

      if (res.suggestedGuideline) {
        setPendingGuideline(res.suggestedGuideline);
      } else {
        setToastMessage('Refinement applied successfully!');
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err: any) {
      alert(`Refinement error: ${err.message || 'Failed to refine'}`);
    } finally {
      setRefining(false);
    }
  };

  // Confirm Guideline Modal
  const handleConfirmGuideline = async () => {
    if (!pendingGuideline) return;
    try {
      await api.createGuideline(pendingGuideline.rule, pendingGuideline.category);
      setToastMessage(`Learned Rule Saved: "${pendingGuideline.rule}"`);
      setTimeout(() => setToastMessage(null), 5000);
      setPendingGuideline(null);
    } catch (err) {
      console.error('Failed to save rule:', err);
    }
  };

  const handleExportDocx = async () => {
    if (!selectedJobId) return;
    try {
      setExportingDocx(true);
      await api.exportDocx({ jobId: selectedJobId });
    } catch (err: any) {
      alert(`Export failed: ${err.message || 'Error generating DOCX'}`);
    } finally {
      setExportingDocx(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Guideline Confirmation Modal */}
      {pendingGuideline && (
        <GuidelineConfirmationModal
          guideline={pendingGuideline}
          onConfirm={handleConfirmGuideline}
          onDismiss={() => setPendingGuideline(null)}
        />
      )}

      {/* Header Bar: Job Selector, Gemini Model Switcher, Real-Time ATS Score, Actions */}
      <header className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="p-2.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Target Job Posting
            </label>
            <div className="relative">
              <select
                value={selectedJobId}
                onChange={(e) => handleSelectJob(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-100 focus:outline-none focus:border-indigo-500 appearance-none pr-8 truncate"
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.company} — {j.title} ({j.location})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Gemini Model Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
          <div className="text-left">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              AI Engine Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent text-xs font-bold text-purple-200 focus:outline-none cursor-pointer pr-2"
              title="Select Gemini Model used for tailoring and refinement"
            >
              {GEMINI_MODELS.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                  {m.icon} {m.name} ({m.badge})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Real-Time Dynamic ATS Score Badge */}
        {dynamicAts && (
          <div
            className="flex items-center gap-3 bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl shadow-inner"
            title={`Keywords: ${dynamicAts.matchedKeywords.length} matched | Metrics: ${dynamicAts.metricPercentage}% bullets | Power Verbs: ${dynamicAts.powerVerbCount}`}
          >
            <div className="text-center">
              <div className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider">
                Live ATS Match
              </div>
              <div className="text-lg font-black text-emerald-300 leading-none flex items-center gap-1">
                <span>{dynamicAts.score}%</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="text-[10px] text-slate-400 space-y-0.5">
              <div>
                <strong className="text-slate-200">{dynamicAts.matchedKeywords.length}</strong> keywords
              </div>
              <div>
                <strong className="text-slate-200">{dynamicAts.metricPercentage}%</strong> quantified
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {currentJob?.url && (
            <a
              href={currentJob.url}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors border border-slate-700"
              title="Open posting"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={handleGenerateTailoring}
            disabled={tailoring || !selectedJobId}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {tailoring ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{tailoring ? 'Tailoring with AI...' : tailoredResume ? 'Re-Tailor' : 'Tailor with AI'}</span>
          </button>

          {tailoredResume && (
            <>
              <button
                onClick={handleSaveInPlaceEdits}
                disabled={savingEdit}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
                title="Save current edits & updated ATS score"
              >
                {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{savingEdit ? 'Saving...' : 'Save Edits'}</span>
              </button>

              <button
                onClick={handleExportDocx}
                disabled={exportingDocx}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                title="Download tailored Word document (.docx)"
              >
                {exportingDocx ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                )}
                <span>Word (.docx)</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* No Tailored Resume State */}
      {!tailoredResume && !tailoring && (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
          <Sparkles className="w-10 h-10 text-indigo-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No Tailored Resume Generated Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click <strong>"Tailor with AI"</strong> above to analyze{' '}
            <strong>{currentJob?.company}</strong>'s job description and generate side-by-side recommended changes.
          </p>
        </div>
      )}

      {/* When Tailored Resume Exists: Side-by-Side Resume Preview & AI Recommendations */}
      {tailoredResume && editableContent && (
        <div className="space-y-4">
          {/* Section Navigation Ribbon */}
          <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-xl border border-slate-800 overflow-x-auto">
            <div className="flex items-center gap-1.5 min-w-max">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                Focus Section:
              </span>
              <button
                onClick={() => setActiveSection('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeSection === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                Full Resume
              </button>
              <button
                onClick={() => setActiveSection('summary')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeSection === 'summary'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                Summary
              </button>
              {editableContent.experience.map((exp, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSection(`exp_${idx}`)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeSection === `exp_${idx}`
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Role {idx + 1}: {exp.company}
                </button>
              ))}
              <button
                onClick={() => setActiveSection('skills')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeSection === 'skills'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                Skills
              </button>
            </div>

            <div className="text-[11px] text-slate-400 hidden lg:flex items-center gap-2 pr-2">
              <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Edit text in left preview • Click "Apply" on right to adopt AI recommendations</span>
            </div>
          </div>

          {/* Side-by-Side Dual Container */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* LEFT SIDE: Resume Preview & In-Place Editor */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 flex flex-col shadow-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold text-white tracking-wide">
                    RESUME PREVIEW (CURRENT & EDITABLE)
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {masterResume?.name || 'Pushpit Virmani'} • In-Place Edit
                </span>
              </div>

              <div className="p-5 overflow-y-auto space-y-6 flex-1 text-slate-200 font-sans text-xs">
                {/* 1. Header Details Preview */}
                <div className="text-center pb-3 border-b border-slate-800">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-white">
                    {masterResume?.name || 'Pushpit Virmani'}
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {[
                      masterResume?.location,
                      masterResume?.email,
                      masterResume?.phone,
                      masterResume?.linkedinUrl,
                    ]
                      .filter(Boolean)
                      .join('  •  ')}
                  </p>
                </div>

                {/* 2. Professional Summary Section */}
                {(activeSection === 'all' || activeSection === 'summary') && (
                  <div className="space-y-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase font-bold text-indigo-400 tracking-wider">
                        Professional Summary
                      </span>
                      <span className="text-[10px] text-slate-500">Click to edit directly</span>
                    </div>
                    <textarea
                      rows={3}
                      value={editableContent.summary}
                      onChange={(e) => handleSummaryChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-200 leading-relaxed focus:outline-none"
                      placeholder="Enter executive summary..."
                    />
                  </div>
                )}

                {/* 3. Work Experience Section */}
                {(activeSection === 'all' || activeSection.startsWith('exp_')) && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                      <span className="text-[11px] uppercase font-bold text-indigo-400 tracking-wider">
                        Work Experience
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {editableContent.experience.length} Roles
                      </span>
                    </div>

                    {editableContent.experience.map((exp, expIdx) => {
                      if (activeSection !== 'all' && activeSection !== `exp_${expIdx}`) {
                        return null;
                      }

                      return (
                        <div
                          key={exp.id || expIdx}
                          className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-white text-xs">{exp.role}</span>
                              <span className="text-slate-400 text-xs"> — {exp.company}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {exp.location || 'Remote'}
                            </span>
                          </div>

                          {/* Bullets List */}
                          <div className="space-y-2.5">
                            {exp.bullets.map((bullet, bIdx) => {
                              const bulletText =
                                typeof bullet === 'string'
                                  ? bullet
                                  : bullet.tailored || bullet.original;

                              return (
                                <div key={bIdx} className="space-y-1">
                                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                                    <span>Bullet {bIdx + 1}</span>
                                    {/[$%€£]|(?:\d+(?:\.\d+)?(?:k|m|cr|x|\+))/i.test(bulletText) && (
                                      <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                                        <Award className="w-2.5 h-2.5" /> Quantified
                                      </span>
                                    )}
                                  </div>
                                  <textarea
                                    rows={2}
                                    value={bulletText}
                                    onChange={(e) =>
                                      handleBulletChange(expIdx, bIdx, e.target.value)
                                    }
                                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-xs text-slate-200 focus:outline-none leading-relaxed"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 4. Skills Section */}
                {(activeSection === 'all' || activeSection === 'skills') && (
                  <div className="space-y-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[11px] uppercase font-bold text-indigo-400 tracking-wider block">
                      Product & Technical Skills
                    </span>
                    <div className="space-y-2">
                      {editableContent.skills.map((cat, sIdx) => (
                        <div key={sIdx} className="text-xs">
                          <strong className="text-slate-300">{cat.category}: </strong>
                          <span className="text-slate-400">
                            {Array.isArray(cat.skills) ? cat.skills.join(' • ') : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SIDE: Recommended Changes Resume (Tailored by Gemini) */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 flex flex-col shadow-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span className="text-xs font-bold text-white tracking-wide">
                    RECOMMENDED CHANGES (AI TAILORED)
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                  {selectedModel}
                </span>
              </div>

              <div className="p-5 overflow-y-auto space-y-6 flex-1 text-slate-200 font-sans text-xs">
                {/* 1. Header Target Alignment */}
                <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                      Target Role Alignment
                    </span>
                    <p className="text-xs font-semibold text-white">
                      {currentJob?.company} — {currentJob?.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400">Harshit Style Format</span>
                    <p className="text-[11px] text-emerald-400 font-bold">Bold Metric Hooks</p>
                  </div>
                </div>

                {/* 2. Recommended Summary */}
                {(activeSection === 'all' || activeSection === 'summary') && (
                  <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/70 border border-purple-500/30">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase font-bold text-purple-400 tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        AI Recommended Summary
                      </span>
                      <button
                        onClick={handleApplySummaryRecommendation}
                        className="px-2.5 py-1 rounded bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-[10px] font-semibold transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Apply to Resume
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                      {recommendedContent?.summary}
                    </p>
                  </div>
                )}

                {/* 3. Recommended Experience Bullets */}
                {(activeSection === 'all' || activeSection.startsWith('exp_')) && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                      <span className="text-[11px] uppercase font-bold text-purple-400 tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Recommended Bullets & Hooks
                      </span>
                      <span className="text-[10px] text-slate-500">Aligned to JD</span>
                    </div>

                    {recommendedContent?.experience.map((recExp, expIdx) => {
                      if (activeSection !== 'all' && activeSection !== `exp_${expIdx}`) {
                        return null;
                      }

                      return (
                        <div
                          key={recExp.id || expIdx}
                          className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs">{recExp.company}</span>
                            <span className="text-[10px] text-purple-400 font-mono">
                              Role {expIdx + 1}
                            </span>
                          </div>

                          {/* Bullet Diff & Recommendations */}
                          <div className="space-y-3">
                            {recExp.bullets.map((bulletObj, bIdx) => {
                              const recText =
                                typeof bulletObj === 'string'
                                  ? bulletObj
                                  : bulletObj.tailored || bulletObj.original;
                              const origText =
                                typeof bulletObj === 'object' ? bulletObj.original : '';

                              return (
                                <div
                                  key={bIdx}
                                  className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2 hover:border-purple-500/40 transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-semibold text-purple-400">
                                      AI Recommendation #{bIdx + 1}
                                    </span>
                                    <button
                                      onClick={() => handleApplyRecommendation(expIdx, bIdx)}
                                      className="px-2 py-0.5 rounded bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-[10px] font-semibold transition-colors flex items-center gap-1 shadow-sm"
                                    >
                                      <Check className="w-2.5 h-2.5" />
                                      Apply
                                    </button>
                                  </div>

                                  {/* Formatted Hook Preview */}
                                  <div className="text-xs text-slate-200 leading-relaxed pl-2 border-l-2 border-purple-500">
                                    {renderFormattedBullet(recText)}
                                  </div>

                                  {origText && origText !== recText && (
                                    <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                                      <span className="text-slate-400">Original: </span>
                                      <span className="italic">{origText.substring(0, 110)}...</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 4. Keyword Alignment Badge List */}
                {dynamicAts && (
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      JD Keyword Alignment Check
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {dynamicAts.matchedKeywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[10px] font-medium flex items-center gap-1"
                        >
                          <Check className="w-2.5 h-2.5" />
                          {kw}
                        </span>
                      ))}
                      {dynamicAts.missingKeywords.slice(0, 4).map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-medium"
                          title="Missing keyword in resume"
                        >
                          + {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Conversational Refinement Prompt Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <form onSubmit={handleRefineSubmit} className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={feedbackPrompt}
                  onChange={(e) => setFeedbackPrompt(e.target.value)}
                  placeholder={`Instruct ${selectedModel} to refine ${
                    activeSection !== 'all' ? activeSection : 'the resume'
                  } (e.g. "Add metric for 40% user retention", "Focus role 1 on enterprise AI scale")...`}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <button
                type="submit"
                disabled={refining || !feedbackPrompt.trim()}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
              >
                {refining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{refining ? 'Refining...' : 'Refine'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
