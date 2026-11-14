import React, { useEffect, useState } from 'react';
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
  Download
} from 'lucide-react';
import { api } from '../services/api';
import { JobItem, TailoredResumeItem, TailoredContent, SuggestedGuideline } from '../types';
import { GuidelineConfirmationModal } from './GuidelineConfirmationModal';

interface TailorStudioProps {
  initialJobId?: string | null;
}

export const TailorStudio: React.FC<TailorStudioProps> = ({ initialJobId }) => {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [tailoredResume, setTailoredResume] = useState<TailoredResumeItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [tailoring, setTailoring] = useState<boolean>(false);
  const [refining, setRefining] = useState<boolean>(false);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [exportingDocx, setExportingDocx] = useState<boolean>(false);

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

  // Revision chat state
  const [feedbackPrompt, setFeedbackPrompt] = useState<string>('');
  const [pendingGuideline, setPendingGuideline] = useState<SuggestedGuideline | null>(null);
  const [guidelineSuccessToast, setGuidelineSuccessToast] = useState<string | null>(null);

  // In-place editable state
  const [editableContent, setEditableContent] = useState<TailoredContent | null>(null);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const jobsList = await api.getJobs();
        setJobs(jobsList);

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
      } else {
        setTailoredResume(null);
        setEditableContent(null);
      }
    } catch (err) {
      setTailoredResume(null);
      setEditableContent(null);
    }
  };

  const handleSelectJob = async (jobId: string) => {
    setSelectedJobId(jobId);
    await loadTailoredForJob(jobId);
  };

  const handleGenerateTailoring = async () => {
    if (!selectedJobId) return;
    try {
      setTailoring(true);
      const res = await api.tailorResume(selectedJobId);
      if (res.ok && res.tailoredResume) {
        setTailoredResume(res.tailoredResume);
        setEditableContent(res.tailoredResume.content);
        // Refresh job list to update matchScore
        const updatedJobs = await api.getJobs();
        setJobs(updatedJobs);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to tailor resume with AI');
    } finally {
      setTailoring(false);
    }
  };

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tailoredResume || !feedbackPrompt.trim()) return;

    try {
      setRefining(true);
      const prompt = feedbackPrompt.trim();
      setFeedbackPrompt('');

      const res = await api.refineTailoredResume(tailoredResume.id, prompt);
      if (res.ok && res.tailoredResume) {
        setTailoredResume(res.tailoredResume);
        setEditableContent(res.tailoredResume.content);

        // Check if a generalizable rule was suggested
        if (res.suggestedGuideline) {
          setPendingGuideline(res.suggestedGuideline);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to refine resume');
    } finally {
      setRefining(false);
    }
  };

  const handleConfirmGuideline = async (rule: string, category: string) => {
    try {
      await api.createGuideline(rule, category);
      setPendingGuideline(null);
      setGuidelineSuccessToast(`Added rule to global guidelines: "${rule.substring(0, 45)}..."`);
      setTimeout(() => setGuidelineSuccessToast(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to save guideline');
    }
  };

  const handleBulletChange = (expIndex: number, bulletIndex: number, newTailoredText: string) => {
    if (!editableContent) return;
    const nextContent = { ...editableContent };
    const nextExp = [...nextContent.experience];
    const targetBullets = [...nextExp[expIndex].bullets];
    targetBullets[bulletIndex] = {
      ...targetBullets[bulletIndex],
      tailored: newTailoredText,
    };
    nextExp[expIndex] = { ...nextExp[expIndex], bullets: targetBullets };
    nextContent.experience = nextExp;
    setEditableContent(nextContent);
  };

  const handleSummaryChange = (newSummary: string) => {
    if (!editableContent) return;
    setEditableContent({
      ...editableContent,
      summary: newSummary,
    });
  };

  const handleSaveInPlaceEdits = async () => {
    if (!tailoredResume || !editableContent) return;
    try {
      setSavingEdit(true);
      const res = await api.updateTailoredResume(tailoredResume.id, editableContent);
      if (res.ok) {
        setTailoredResume(res.tailoredResume);
        alert('Resume changes saved successfully!');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save edits');
    } finally {
      setSavingEdit(false);
    }
  };

  const currentJob = jobs.find((j) => j.id === selectedJobId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Success Toast */}
      {guidelineSuccessToast && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-200 text-xs shadow-2xl flex items-center space-x-2.5 animate-slide-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{guidelineSuccessToast}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {pendingGuideline && (
        <GuidelineConfirmationModal
          guideline={pendingGuideline}
          onConfirm={handleConfirmGuideline}
          onDismiss={() => setPendingGuideline(null)}
        />
      )}

      {/* Top Controls: Job Selector & Action Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Target Job Posting
            </label>
            <div className="relative">
              <select
                value={selectedJobId}
                onChange={(e) => handleSelectJob(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-indigo-500 appearance-none pr-8 truncate"
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.company} — {j.title} ({j.location})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          {currentJob?.url && (
            <a
              href={currentJob.url}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1.5 transition-colors border border-slate-700"
              title="Open posting"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Job Link</span>
            </a>
          )}

          <button
            onClick={handleGenerateTailoring}
            disabled={tailoring || !selectedJobId}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {tailoring ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{tailoring ? 'Tailoring with Gemini...' : tailoredResume ? 'Re-Tailor with AI' : 'Tailor Resume with AI'}</span>
          </button>

          {tailoredResume && (
            <>
              <button
                onClick={handleSaveInPlaceEdits}
                disabled={savingEdit}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingEdit ? 'Saving...' : 'Save Edits'}</span>
              </button>

              <button
                onClick={handleExportDocx}
                disabled={exportingDocx}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                title="Download tailored Word document (.docx)"
              >
                {exportingDocx ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                )}
                <span>{exportingDocx ? 'Exporting...' : 'Download .docx'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* No Tailored Resume State */}
      {!tailoredResume && !tailoring && (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
          <Sparkles className="w-10 h-10 text-indigo-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No Tailored Resume Generated Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click <strong>"Tailor Resume with AI"</strong> to align Pushpit's master achievements with{' '}
            <strong>{currentJob?.company}</strong>'s role using the Harshit Kumar ATS format.
          </p>
        </div>
      )}

      {/* Tailored Content View */}
      {tailoredResume && editableContent && (
        <div className="space-y-6">
          {/* ATS Score & Keyword Analysis Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-indigo-500/30 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Score Radial Badge */}
            <div className="md:col-span-3 flex items-center space-x-3.5 border-r border-slate-800/80 pr-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border-2 border-indigo-500 flex flex-col items-center justify-center shrink-0">
                <span className="text-2xl font-black text-white tracking-tight">
                  {editableContent.atsAnalysis?.score || 90}%
                </span>
                <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider">
                  ATS Score
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Target Fit: High</h4>
                <p className="text-[11px] text-emerald-400 font-medium">FAANG / AI Optimized</p>
              </div>
            </div>

            {/* Keyword Chips */}
            <div className="md:col-span-9 space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400 mr-1">Matched Keywords:</span>
                {editableContent.atsAnalysis?.matchedKeywords?.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium"
                  >
                    ✓ {kw}
                  </span>
                ))}
              </div>

              {editableContent.atsAnalysis?.missingKeywords && editableContent.atsAnalysis.missingKeywords.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1">Missing / Gap Keywords:</span>
                  {editableContent.atsAnalysis.missingKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-medium"
                    >
                      + {kw}
                    </span>
                  ))}
                </div>
              )}

              {editableContent.atsAnalysis?.summaryFeedback && (
                <p className="text-xs text-slate-300 italic pt-1 border-t border-slate-800/60">
                  "{editableContent.atsAnalysis.summaryFeedback}"
                </p>
              )}
            </div>
          </div>

          {/* Executive Summary Diff */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <span>Executive Summary</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                  In-Place Editable
                </span>
              </h3>
            </div>
            <textarea
              rows={3}
              value={editableContent.summary}
              onChange={(e) => handleSummaryChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
            />
          </div>

          {/* Side-by-Side Experience Diff Studio */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Experience Bullets: Master vs. Tailored Comparison
                </h3>
                <p className="text-xs text-slate-400">
                  Every tailored bullet leads with a bold impact hook in the Harshit Kumar style. Click to edit any bullet directly.
                </p>
              </div>
            </div>

            {editableContent.experience.map((exp, expIdx) => (
              <div
                key={exp.id || expIdx}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div>
                    <h4 className="text-xs font-bold text-white">{exp.role}</h4>
                    <p className="text-[11px] text-indigo-400 font-semibold">{exp.company}</p>
                  </div>
                  <span className="text-[11px] text-slate-400">{exp.location}</span>
                </div>

                <div className="space-y-3">
                  {exp.bullets.map((bulletDiff, bIdx) => (
                    <div
                      key={bIdx}
                      className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors"
                    >
                      {/* Left: Original Master Bullet */}
                      <div className="lg:col-span-5 text-xs text-slate-400 border-b lg:border-b-0 lg:border-r border-slate-800/80 pb-2 lg:pb-0 lg:pr-3 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Master Resume Original
                        </span>
                        <p className="leading-relaxed">{bulletDiff.original}</p>
                      </div>

                      {/* Right: Tailored Bullet with in-place edit */}
                      <div className="lg:col-span-7 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Tailored (Bold Impact Hook)</span>
                          </span>
                          {bulletDiff.changes && (
                            <span className="text-slate-400 italic truncate max-w-xs">
                              {bulletDiff.changes}
                            </span>
                          )}
                        </div>
                        <textarea
                          rows={2}
                          value={bulletDiff.tailored}
                          onChange={(e) => handleBulletChange(expIdx, bIdx, e.target.value)}
                          className="w-full bg-slate-900/90 border border-indigo-500/30 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-400 leading-relaxed font-sans"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Revision Feedback Chat Drawer */}
      {tailoredResume && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800 backdrop-blur-md p-3.5 px-6 shadow-2xl">
          <div className="max-w-4xl mx-auto flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <form onSubmit={handleSendFeedback} className="flex-1 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Ask AI to refine: 'Emphasize ARR growth in bullet 1', 'Shorten summary', 'Make technical tone sharper'..."
                value={feedbackPrompt}
                onChange={(e) => setFeedbackPrompt(e.target.value)}
                disabled={refining}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={refining || !feedbackPrompt.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50 shrink-0"
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
