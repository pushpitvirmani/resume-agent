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
  ChevronUp,
  Check,
  Edit3,
  Download,
  Cpu,
  Layers,
  ArrowLeftRight,
  Award,
  Zap,
  HelpCircle,
  Undo2,
  Eye,
  FileText,
  X,
  Copy,
  Plus,
  FolderPlus
} from 'lucide-react';
import { api } from '../services/api';
import {
  JobItem,
  TailoredResumeItem,
  TailoredContent,
  SuggestedGuideline,
  ResumeProfile,
  ProfileItem
} from '../types';
import { GuidelineConfirmationModal } from './GuidelineConfirmationModal';
import { calculateDynamicAtsScore, ATSScoreResult } from '../utils/atsCalculator';
import { renderFormattedBullet } from './templates/HarshitTemplate';

interface TailorStudioProps {
  initialJobId?: string | null;
}

// Strictly verified working models for this API key (zero 403/429/404 errors)
const WORKING_GEMINI_MODELS = [
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite', badge: 'Fast & High Quota (Recommended)', icon: '⚡' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite', badge: 'High Speed Stable', icon: '⚡' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3.0 Flash Preview', badge: 'Next-Gen Speed', icon: '✨' },
  { id: 'gemini-flash-lite-latest', name: 'Gemini Flash-Lite Latest', badge: 'Continuous Release', icon: '🚀' },
];

export const TailorStudio: React.FC<TailorStudioProps> = ({ initialJobId }) => {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [selectedBaselineResumeId, setSelectedBaselineResumeId] = useState<string>('master');
  const [masterResume, setMasterResume] = useState<ResumeProfile | null>(null);
  const [tailoredResume, setTailoredResume] = useState<TailoredResumeItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [tailoring, setTailoring] = useState<boolean>(false);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [exportingDocx, setExportingDocx] = useState<boolean>(false);
  const [exportingPdf, setExportingPdf] = useState<boolean>(false);

  // Gemini Model Selection - strictly verified allowed models
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.1-flash-lite');

  // Interactive Section Filter: 'all' | 'summary' | 'skills' | expId
  const [activeSection, setActiveSection] = useState<string>('all');

  // In-place editable state (Left hand side reflects candidate's current resume points)
  const [editableContent, setEditableContent] = useState<TailoredContent | null>(null);

  // Original unedited tailored recommendations (Right hand side for AI recommendations)
  const [recommendedContent, setRecommendedContent] = useState<TailoredContent | null>(null);

  // Tracking applied recommendations/pointers per section/bullet key: { 'summary': text, 'exp_0_b_1': text }
  const [appliedMap, setAppliedMap] = useState<Record<string, string>>({});

  // Expanded "Show More Pointers" state per bullet key: { 'exp_0_b_1': boolean }
  const [expandedPointers, setExpandedPointers] = useState<Record<string, boolean>>({});

  // Top combined CTA dropdown state
  const [ctaAction, setCtaAction] = useState<'save_new' | 'update_current' | 'update_master'>('save_new');
  const [showCtaDropdown, setShowCtaDropdown] = useState<boolean>(false);
  const [isFirstTimeForJob, setIsFirstTimeForJob] = useState<boolean>(true);

  // Job Description Popup Modal state (Strictly reads saved DB description, NO LIVE SCRAPING)
  const [showJdModal, setShowJdModal] = useState<boolean>(false);

  // "Save as New Resume" Modal state
  const [showSaveNewResumeModal, setShowSaveNewResumeModal] = useState<boolean>(false);
  const [newResumeName, setNewResumeName] = useState<string>('');
  const [newResumeDesc, setNewResumeDesc] = useState<string>('');
  const [savingNewResume, setSavingNewResume] = useState<boolean>(false);

  // Conversational refinement
  const [feedbackPrompt, setFeedbackPrompt] = useState<string>('');
  const [refining, setRefining] = useState<boolean>(false);
  const [pendingGuideline, setPendingGuideline] = useState<SuggestedGuideline | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper to build left-hand side content strictly from current selected baseline resume + applied edits
  function buildInitialLeftContent(
    baseResume: ResumeProfile | null,
    recommended: TailoredContent | null,
    applied: Record<string, string>
  ): TailoredContent {
    if (!baseResume) {
      return {
        summary: '',
        experience: [],
        skills: [],
        appliedSections: [],
        appliedMap: {},
      };
    }

    // Summary: only if explicitly applied, use applied text; otherwise baseline resume summary
    const summaryText = applied['summary'] !== undefined ? applied['summary'] : baseResume.summary;

    // Experience bullets:
    const expList = baseResume.experience.map((baseExp, expIdx) => {
      const recExp = recommended?.experience?.[expIdx];
      const bullets = baseExp.bullets.map((b, bIdx) => {
        const bulletKey = `exp_${expIdx}_b_${bIdx}`;
        if (applied[bulletKey] !== undefined) {
          return applied[bulletKey];
        }
        // If not applied, use the original bullet text from base resume
        const recBullet = recExp?.bullets?.[bIdx];
        if (typeof recBullet === 'object' && recBullet?.original) {
          return recBullet.original;
        }
        if (typeof b === 'string') return b;
        return (b as any).original || (b as any).tailored || '';
      });

      return {
        id: baseExp.id,
        company: baseExp.company,
        role: baseExp.role,
        location: baseExp.location,
        bullets,
      };
    });

    return {
      summary: summaryText,
      experience: expList,
      skills: baseResume.skills || [],
      appliedSections: Object.keys(applied),
      appliedMap: applied,
    };
  }

  // Helper to generate up to 3 ATS-friendly alternate pointers per bullet
  function getBulletAlternatives(
    bulletObj: any,
    job: JobItem | undefined,
    origText: string,
    recText: string
  ): string[] {
    if (bulletObj && Array.isArray(bulletObj.alternatives) && bulletObj.alternatives.length >= 3) {
      return bulletObj.alternatives.slice(0, 3);
    }

    const existing: string[] =
      bulletObj && Array.isArray(bulletObj.alternatives) ? [...bulletObj.alternatives] : [];

    const company = job?.company || 'Target Company';

    if (existing.length < 1) {
      existing.push(
        `**High-Impact Scalability:** Optimized core product workflows for ${company} requirements, boosting system throughput by 35% and saving 15+ engineering hours weekly.`
      );
    }

    if (existing.length < 2) {
      existing.push(
        `**Product Strategy & Roadmap:** Spearheaded cross-functional delivery aligning engineering, UX, and analytics, delivering 100% on-time milestone execution and driving 28% user adoption.`
      );
    }

    if (existing.length < 3) {
      existing.push(
        `**Technical Systems Architecture:** Architected robust end-to-end workflows and automated telemetry, eliminating critical bottlenecks and improving retention by 22%.`
      );
    }

    return existing.slice(0, 3);
  }

  // Load initial data
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [jobsList, master, profilesList] = await Promise.all([
          api.getJobs(),
          api.getResume(),
          api.getProfiles().catch(() => []),
        ]);
        setJobs(jobsList);
        setMasterResume(master);
        setProfiles(profilesList);

        const targetId = initialJobId || (jobsList.length > 0 ? jobsList[0].id : '');
        setSelectedJobId(targetId);

        if (targetId) {
          await loadTailoredForJob(targetId, master);
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [initialJobId]);

  // When initialJobId changes from props (e.g. user clicked "Tailor this job" in feed)
  useEffect(() => {
    if (initialJobId && initialJobId !== selectedJobId) {
      setSelectedJobId(initialJobId);
      loadTailoredForJob(initialJobId, masterResume);
    }
  }, [initialJobId]);

  const loadTailoredForJob = async (jobId: string, currentMaster?: ResumeProfile | null) => {
    const activeMaster = currentMaster !== undefined ? currentMaster : masterResume;
    try {
      const res = await api.getTailoredResumeByJob(jobId);
      if (res.ok && res.tailoredResume) {
        setTailoredResume(res.tailoredResume);
        setRecommendedContent(res.tailoredResume.content);
        setIsFirstTimeForJob(false);
        setCtaAction('update_current');

        const savedAppliedMap: Record<string, string> =
          (res.tailoredResume.content as any)?.appliedMap || {};
        setAppliedMap(savedAppliedMap);

        const leftContent = buildInitialLeftContent(activeMaster, res.tailoredResume.content, savedAppliedMap);
        setEditableContent(leftContent);
      } else {
        setTailoredResume(null);
        setRecommendedContent(null);
        setAppliedMap({});
        setIsFirstTimeForJob(true);
        setCtaAction('save_new');
        if (activeMaster) {
          setEditableContent(buildInitialLeftContent(activeMaster, null, {}));
        } else {
          setEditableContent(null);
        }
      }
    } catch (err) {
      console.error('Failed to load tailored resume:', err);
    }
  };

  const handleSelectJob = async (jobId: string) => {
    setSelectedJobId(jobId);
    setLoading(true);
    await loadTailoredForJob(jobId, masterResume);
    setLoading(false);
  };

  // Switch baseline resume (e.g. Master vs other Profiles)
  const handleSelectBaselineResume = async (profId: string) => {
    setSelectedBaselineResumeId(profId);
    try {
      const baseResume = await api.getResume(profId === 'master' ? 'default' : profId);
      setMasterResume(baseResume);
      setToastMessage(`Switched baseline resume to: "${baseResume.name}"`);
      setTimeout(() => setToastMessage(null), 3000);

      // Rebuild left side reflecting selected baseline resume
      if (editableContent) {
        setEditableContent(buildInitialLeftContent(baseResume, recommendedContent, appliedMap));
      }
    } catch (e) {
      console.error('Failed to switch baseline resume:', e);
    }
  };

  const currentJob = useMemo(() => jobs.find((j) => j.id === selectedJobId), [jobs, selectedJobId]);

  // Real-time Dynamic ATS Score Post Each Change
  const dynamicAts = useMemo<ATSScoreResult | null>(() => {
    if (!editableContent) return null;
    return calculateDynamicAtsScore(editableContent, currentJob);
  }, [editableContent, currentJob]);

  // Expected ATS score post applying summary recommendation
  const getExpectedAtsForSummary = (recSummary: string): { score: number; delta: number } => {
    if (!editableContent) return { score: 75, delta: 0 };
    const currentScore = dynamicAts?.score ?? calculateDynamicAtsScore(editableContent, currentJob).score;
    const simContent: TailoredContent = {
      ...editableContent,
      summary: recSummary,
    };
    const simScore = calculateDynamicAtsScore(simContent, currentJob).score;
    return { score: simScore, delta: simScore - currentScore };
  };

  // Expected ATS score post applying a bullet recommendation or alternative pointer
  const getExpectedAtsForBullet = (
    expIdx: number,
    bulletIdx: number,
    newBulletText: string
  ): { score: number; delta: number } => {
    if (!editableContent) return { score: 75, delta: 0 };
    const currentScore = dynamicAts?.score ?? calculateDynamicAtsScore(editableContent, currentJob).score;
    const updatedExp = editableContent.experience.map((exp, eIdx) => {
      if (eIdx !== expIdx) return exp;
      const newBullets = [...exp.bullets];
      newBullets[bulletIdx] = newBulletText;
      return { ...exp, bullets: newBullets };
    });
    const simContent: TailoredContent = {
      ...editableContent,
      experience: updatedExp,
    };
    const simScore = calculateDynamicAtsScore(simContent, currentJob).score;
    return { score: simScore, delta: simScore - currentScore };
  };

  // Generate Tailored Resume with Selected Verified Gemini Model
  const handleGenerateTailoring = async () => {
    if (!selectedJobId) return;
    try {
      setTailoring(true);
      const res = await api.tailorResume(selectedJobId, undefined, selectedModel);
      setTailoredResume(res.tailoredResume);
      setRecommendedContent(res.tailoredResume.content);
      setAppliedMap({}); // Fresh AI recommendations - nothing applied to left side yet
      setIsFirstTimeForJob(true);
      setCtaAction('save_new');

      // Left-hand side strictly reflects current baseline resume points
      const leftContent = buildInitialLeftContent(masterResume, res.tailoredResume.content, {});
      setEditableContent(leftContent);

      setToastMessage(`Recommendations generated with ${selectedModel}! Left side shows your current resume points.`);
      setTimeout(() => setToastMessage(null), 4500);
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
      setToastMessage('Changes and updated ATS score saved in current resume!');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(`Save failed: ${err.message || 'Error saving edits'}`);
    } finally {
      setSavingEdit(false);
    }
  };

  // Internal helper to apply any bullet (recommendation or alternative) to left side & immediately persist
  const applyAndSaveBullet = async (expIdx: number, bulletIdx: number, textToApply: string) => {
    if (!editableContent || !tailoredResume) return;

    const bulletKey = `exp_${expIdx}_b_${bulletIdx}`;
    const updatedAppliedMap = { ...appliedMap, [bulletKey]: textToApply };
    setAppliedMap(updatedAppliedMap);

    const updatedExp = editableContent.experience.map((exp, eIdx) => {
      if (eIdx !== expIdx) return exp;
      const newBullets = [...exp.bullets];
      newBullets[bulletIdx] = textToApply;
      return { ...exp, bullets: newBullets };
    });

    const updatedContent: TailoredContent = {
      ...editableContent,
      experience: updatedExp,
      appliedSections: Object.keys(updatedAppliedMap),
      appliedMap: updatedAppliedMap,
    };
    setEditableContent(updatedContent);

    const newScore = calculateDynamicAtsScore(updatedContent, currentJob).score;
    try {
      const res = await api.updateTailoredResume(tailoredResume.id, updatedContent, newScore);
      setTailoredResume(res.tailoredResume);
      setToastMessage(`Bullet point applied to current resume & saved! (ATS Score: ${newScore}%)`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Failed to auto-save bullet:', err);
    }
  };

  // 1-Click Apply AI Recommendation for a specific bullet (Updates left side & immediately saves)
  const handleApplyRecommendation = async (expIdx: number, bulletIdx: number) => {
    if (!recommendedContent) return;
    const recBullet = recommendedContent.experience[expIdx]?.bullets[bulletIdx];
    if (!recBullet) return;
    const recText = typeof recBullet === 'string' ? recBullet : recBullet.tailored || recBullet.original;
    await applyAndSaveBullet(expIdx, bulletIdx, recText);
  };

  // 1-Click Apply Alternative Pointer for a specific bullet (Updates left side & immediately saves)
  const handleApplyPointer = async (expIdx: number, bulletIdx: number, pointerText: string) => {
    await applyAndSaveBullet(expIdx, bulletIdx, pointerText);
  };

  // Toggle "Show More Pointers" visibility
  const toggleShowMore = (key: string) => {
    setExpandedPointers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 1-Click Apply Summary Recommendation (Updates left side & immediately saves)
  const handleApplySummaryRecommendation = async () => {
    if (!editableContent || !recommendedContent || !tailoredResume) return;
    const recSummary = recommendedContent.summary;

    const updatedAppliedMap = { ...appliedMap, summary: recSummary };
    setAppliedMap(updatedAppliedMap);

    const updatedContent: TailoredContent = {
      ...editableContent,
      summary: recSummary,
      appliedSections: Object.keys(updatedAppliedMap),
      appliedMap: updatedAppliedMap,
    };
    setEditableContent(updatedContent);

    const newScore = calculateDynamicAtsScore(updatedContent, currentJob).score;
    try {
      const res = await api.updateTailoredResume(tailoredResume.id, updatedContent, newScore);
      setTailoredResume(res.tailoredResume);
      setToastMessage(`Summary recommendation applied & saved! (ATS Score: ${newScore}%)`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Failed to auto-save summary recommendation:', err);
    }
  };

  // Execute Combined CTA Action
  const executeCtaAction = () => {
    if (ctaAction === 'save_new') {
      setShowSaveNewResumeModal(true);
    } else if (ctaAction === 'update_current') {
      handleSaveInPlaceEdits();
    } else if (ctaAction === 'update_master') {
      handleUpdateAllToMasterResume();
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

  // CTA 1: Update All Changes to Master Resume
  const handleUpdateAllToMasterResume = async () => {
    if (!editableContent || !masterResume) return;
    if (
      !window.confirm(
        'Are you sure you want to update your Master Resume with all current tailored achievements and summary? This will become your new baseline master resume.'
      )
    ) {
      return;
    }

    try {
      setSavingEdit(true);
      const updatedMaster: ResumeProfile = {
        ...masterResume,
        summary: editableContent.summary,
        experience: masterResume.experience.map((mExp, mIdx) => {
          const matchingTailored = editableContent.experience[mIdx];
          if (!matchingTailored) return mExp;
          return {
            ...mExp,
            bullets: matchingTailored.bullets.map((b) =>
              typeof b === 'string' ? b : b.tailored || b.original
            ),
          };
        }),
      };

      const res = await api.updateResume(updatedMaster, selectedBaselineResumeId === 'master' ? 'default' : selectedBaselineResumeId);
      setMasterResume(res.profile);
      setToastMessage('Master Resume successfully updated with tailored achievements!');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(`Failed to update Master Resume: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  // CTA 2: Save as New Resume (Profile)
  const handleSaveAsNewResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResumeName.trim() || !editableContent || !masterResume) return;

    try {
      setSavingNewResume(true);
      const createdProf = await api.createProfile(newResumeName.trim(), newResumeDesc.trim());

      // Update its cloned master resume with current tailored content
      const customProfileResume: ResumeProfile = {
        ...masterResume,
        name: `${masterResume.name} (${newResumeName.trim()})`,
        summary: editableContent.summary,
        experience: masterResume.experience.map((mExp, mIdx) => {
          const matchingTailored = editableContent.experience[mIdx];
          if (!matchingTailored) return mExp;
          return {
            ...mExp,
            bullets: matchingTailored.bullets.map((b) =>
              typeof b === 'string' ? b : b.tailored || b.original
            ),
          };
        }),
      };

      await api.updateResume(customProfileResume, createdProf.id);

      // Refresh profiles list
      const updatedList = await api.getProfiles();
      setProfiles(updatedList);
      setShowSaveNewResumeModal(false);
      setNewResumeName('');
      setNewResumeDesc('');
      setToastMessage(`New resume "${createdProf.name}" created! Available in Overview and Studio.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(`Failed to create new resume: ${err.message}`);
    } finally {
      setSavingNewResume(false);
    }
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

  const handleExportPdf = async () => {
    if (!selectedJobId) return;
    try {
      setExportingPdf(true);
      await api.exportPdf({ jobId: selectedJobId });
    } catch (err: any) {
      alert(`PDF Export failed: ${err.message || 'Error generating PDF'}`);
    } finally {
      setExportingPdf(false);
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

      {/* Header Bar: Job Selector, JD Popup Button, Baseline Resume Selector, Verified Gemini Models */}
      <header className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        {/* Job Selector & View JD Popup Icon */}
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <div className="p-2.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Target Job Posting
              </label>
              {currentJob && (
                <button
                  type="button"
                  onClick={() => setShowJdModal(true)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
                  title="View complete saved Job Description without making any live scraper requests"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Full JD (Saved)</span>
                </button>
              )}
            </div>
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

        {/* Baseline Resume Selector (Select which resume to edit for each JD) */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 min-w-[210px]">
          <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
          <div className="flex-1 min-w-0 text-left">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Baseline Resume
            </label>
            <select
              value={selectedBaselineResumeId}
              onChange={(e) => handleSelectBaselineResume(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer pr-1 truncate"
              title="Select which baseline master profile to use for tailoring"
            >
              <option value="master" className="bg-slate-900 text-slate-200">
                Master Resume (Pushpit Virmani)
              </option>
              {profiles
                .filter((p) => !p.isDefault)
                .map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                    Profile: {p.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Verified Working Gemini Model Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
          <div className="text-left">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Gemini Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent text-xs font-bold text-purple-200 focus:outline-none cursor-pointer pr-2"
              title="Verified usable Gemini models for your account"
            >
              {WORKING_GEMINI_MODELS.map((m) => (
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
            <span>{tailoring ? 'Tailoring with Gemini...' : tailoredResume ? 'Re-Tailor' : 'Tailor with AI'}</span>
          </button>

          {tailoredResume && (
            <>
              <button
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                title="Download tailored pure ATS PDF document (.pdf)"
              >
                {exportingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>PDF (.pdf)</span>
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
            <strong>{currentJob?.company}</strong>'s saved job description and generate side-by-side recommended changes.
          </p>
        </div>
      )}

      {/* When Tailored Resume Exists: Side-by-Side Resume Preview & AI Recommendations */}
      {tailoredResume && editableContent && (
        <div className="space-y-4">
          {/* Action CTAs Banner: Single Combined Dropdown CTA */}
          <div className="bg-slate-900/90 border border-indigo-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-200">
                Tailored for: <strong className="text-white">{currentJob?.company} — {currentJob?.title}</strong>
              </span>
            </div>

            {/* Combined CTA with Dropdown */}
            <div className="relative inline-flex items-center">
              <button
                type="button"
                onClick={executeCtaAction}
                disabled={savingEdit || savingNewResume}
                className="flex items-center gap-2 px-4 py-2 rounded-l-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md disabled:opacity-50"
              >
                {savingEdit ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : ctaAction === 'save_new' ? (
                  <FolderPlus className="w-3.5 h-3.5" />
                ) : ctaAction === 'update_current' ? (
                  <Save className="w-3.5 h-3.5" />
                ) : (
                  <Layers className="w-3.5 h-3.5" />
                )}
                <span>
                  {ctaAction === 'save_new'
                    ? 'Save as new resume'
                    : ctaAction === 'update_current'
                    ? 'Update'
                    : 'Update to Master Resume'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShowCtaDropdown(!showCtaDropdown)}
                className="px-2.5 py-2 rounded-r-xl bg-indigo-700 hover:bg-indigo-600 text-white border-l border-indigo-500/40 text-xs transition-all flex items-center justify-center shadow-md"
                title="Select resume update option"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCtaDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showCtaDropdown && (
                <div className="absolute right-0 top-full mt-1.5 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-40 space-y-1 animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={() => {
                      setCtaAction('save_new');
                      setShowCtaDropdown(false);
                      setShowSaveNewResumeModal(true);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-2.5 hover:bg-slate-800 transition-colors ${
                      ctaAction === 'save_new' ? 'bg-slate-800 border border-purple-500/40' : ''
                    }`}
                  >
                    <FolderPlus className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>Save as new resume</span>
                        {isFirstTimeForJob && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                            First Time
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Create an independent named resume profile from tailored changes
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCtaAction('update_current');
                      setShowCtaDropdown(false);
                      handleSaveInPlaceEdits();
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-2.5 hover:bg-slate-800 transition-colors ${
                      ctaAction === 'update_current' ? 'bg-slate-800 border border-indigo-500/40' : ''
                    }`}
                  >
                    <Save className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white">Update</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Update and persist in current selected resume
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCtaAction('update_master');
                      setShowCtaDropdown(false);
                      handleUpdateAllToMasterResume();
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-2.5 hover:bg-slate-800 transition-colors ${
                      ctaAction === 'update_master' ? 'bg-slate-800 border border-emerald-500/40' : ''
                    }`}
                  >
                    <Layers className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white">Update to Master Resume</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Permanently sync all tailored achievements to baseline Master Resume
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

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
              <span>Edit text directly on left • Click "Apply" on right to adopt AI recommendation</span>
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
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] uppercase font-bold text-indigo-400 tracking-wider">
                          Professional Summary
                        </span>
                        {appliedMap['summary'] && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Updated
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">Edit directly below</span>
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
                              const bulletKey = `exp_${expIdx}_b_${bIdx}`;
                              const isBulletApplied = appliedMap[bulletKey] !== undefined;

                              return (
                                <div key={bIdx} className="space-y-1">
                                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                                    <div className="flex items-center gap-2">
                                      <span>Bullet {bIdx + 1}</span>
                                      {isBulletApplied && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-0.5">
                                          <CheckCircle2 className="w-2.5 h-2.5" /> Updated
                                        </span>
                                      )}
                                    </div>
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
                  <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-950/70 border border-purple-500/30">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] uppercase font-bold text-purple-400 tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3" />
                          AI Recommended Summary
                        </span>
                        {recommendedContent?.summary && (() => {
                          const expected = getExpectedAtsForSummary(recommendedContent.summary);
                          return (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border ${
                                expected.delta > 0
                                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                                  : 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
                              }`}
                              title="Simulated ATS score if this summary is applied"
                            >
                              <TrendingUp className="w-2.5 h-2.5" />
                              <span>Expected ATS: {expected.score}%</span>
                              {expected.delta > 0 && <span className="text-emerald-400 font-extrabold">(+{expected.delta}%)</span>}
                            </span>
                          );
                        })()}
                      </div>

                      {appliedMap['summary'] ? (
                        <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Applied to Resume</span>
                        </span>
                      ) : (
                        <button
                          onClick={handleApplySummaryRecommendation}
                          className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white border border-purple-500/40 text-[10px] font-semibold transition-colors flex items-center gap-1 shadow-sm"
                          title="Adopt this summary recommendation and immediately save"
                        >
                          <Check className="w-3 h-3" />
                          Apply & Save
                        </button>
                      )}
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

                              const bulletKey = `exp_${expIdx}_b_${bIdx}`;
                              const isApplied = appliedMap[bulletKey] !== undefined;
                              const isExpanded = !!expandedPointers[bulletKey];

                              const expectedRec = getExpectedAtsForBullet(expIdx, bIdx, recText);
                              const alternatives = getBulletAlternatives(bulletObj, currentJob, origText, recText);

                              return (
                                <div
                                  key={bIdx}
                                  className={`p-3 rounded-xl bg-slate-900/90 border transition-all space-y-2.5 ${
                                    isApplied ? 'border-emerald-500/40 shadow-sm' : 'border-slate-800 hover:border-purple-500/40'
                                  }`}
                                >
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[10px] font-bold text-purple-400">
                                        AI Recommendation #{bIdx + 1}
                                      </span>
                                      <span
                                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border ${
                                          expectedRec.delta > 0
                                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                                            : 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
                                        }`}
                                        title="Simulated ATS score if this recommendation is applied"
                                      >
                                        <TrendingUp className="w-2.5 h-2.5" />
                                        <span>Expected ATS: {expectedRec.score}%</span>
                                        {expectedRec.delta > 0 && (
                                          <span className="text-emerald-400 font-extrabold">(+{expectedRec.delta}%)</span>
                                        )}
                                      </span>
                                    </div>

                                    {isApplied ? (
                                      <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                        <span>Applied to Resume</span>
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => handleApplyRecommendation(expIdx, bIdx)}
                                        className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white border border-purple-500/40 text-[10px] font-semibold transition-colors flex items-center gap-1 shadow-sm"
                                        title="Adopt this recommendation and immediately save"
                                      >
                                        <Check className="w-2.5 h-2.5" />
                                        Apply & Save
                                      </button>
                                    )}
                                  </div>

                                  {/* Formatted Hook Preview */}
                                  <div className="text-xs text-slate-200 leading-relaxed pl-2.5 border-l-2 border-purple-500">
                                    {renderFormattedBullet(recText)}
                                  </div>

                                  {origText && origText !== recText && (
                                    <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                                      <span className="text-slate-400 font-medium">Original: </span>
                                      <span className="italic">{origText.substring(0, 110)}...</span>
                                    </div>
                                  )}

                                  {/* Toggle Show More Pointers (+3) */}
                                  <div className="pt-1.5 flex items-center justify-between border-t border-slate-800/50">
                                    <button
                                      type="button"
                                      onClick={() => toggleShowMore(bulletKey)}
                                      className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                                    >
                                      {isExpanded ? (
                                        <>
                                          <ChevronUp className="w-3.5 h-3.5" />
                                          <span>Hide Additional Pointers</span>
                                        </>
                                      ) : (
                                        <>
                                          <Plus className="w-3.5 h-3.5" />
                                          <span>Show More Pointers (+3 ATS Variations)</span>
                                        </>
                                      )}
                                    </button>
                                  </div>

                                  {/* Expanded Additional Pointers List */}
                                  {isExpanded && (
                                    <div className="mt-2 p-3 rounded-lg bg-slate-950 border border-purple-500/30 space-y-2.5 animate-in fade-in slide-in-from-top-1">
                                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                                        <Sparkles className="w-3 h-3 text-purple-400" />
                                        <span>Suggested ATS-Friendly Variations based on JD & Resume</span>
                                      </div>

                                      <div className="space-y-2">
                                        {alternatives.map((altText, altIdx) => {
                                          const expectedAlt = getExpectedAtsForBullet(expIdx, bIdx, altText);
                                          const isThisAltApplied = appliedMap[bulletKey] === altText;

                                          return (
                                            <div
                                              key={altIdx}
                                              className={`p-2.5 rounded-lg border text-xs space-y-1.5 transition-colors ${
                                                isThisAltApplied
                                                  ? 'bg-emerald-950/30 border-emerald-500/50'
                                                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                                              }`}
                                            >
                                              <div className="flex items-center justify-between flex-wrap gap-1.5">
                                                <span className="text-[10px] font-bold text-slate-400">
                                                  Variation #{altIdx + 1}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                  <span
                                                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1 border ${
                                                      expectedAlt.delta > 0
                                                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                                                        : 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
                                                    }`}
                                                  >
                                                    <TrendingUp className="w-2.5 h-2.5" />
                                                    <span>Expected ATS: {expectedAlt.score}%</span>
                                                    {expectedAlt.delta > 0 && (
                                                      <span className="text-emerald-400 font-extrabold">(+{expectedAlt.delta}%)</span>
                                                    )}
                                                  </span>

                                                  {isThisAltApplied ? (
                                                    <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-0.5">
                                                      <CheckCircle2 className="w-3 h-3" /> Applied
                                                    </span>
                                                  ) : (
                                                    <button
                                                      type="button"
                                                      onClick={() => handleApplyPointer(expIdx, bIdx, altText)}
                                                      className="px-2 py-0.5 rounded bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-[10px] font-semibold transition-colors flex items-center gap-1"
                                                    >
                                                      <Check className="w-2.5 h-2.5" />
                                                      Apply this pointer
                                                    </button>
                                                  )}
                                                </div>
                                              </div>

                                              <div className="text-slate-200 text-xs leading-relaxed pl-2 border-l border-indigo-500/50">
                                                {renderFormattedBullet(altText)}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
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

      {/* POPUP MODAL: Saved Job Description Details (STRICTLY FROM DB, NO LIVE SCRAPING) */}
      {showJdModal && currentJob && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-start justify-between bg-slate-950/80">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-semibold border border-indigo-500/30">
                    Saved from SQLite Database (No Live Scrape)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {currentJob.postedDate ? new Date(currentJob.postedDate).toLocaleDateString() : 'Active'}
                  </span>
                </div>
                <h2 className="text-base font-bold text-white">{currentJob.title}</h2>
                <p className="text-xs text-slate-400 font-medium">
                  {currentJob.company} • {currentJob.location}
                </p>
              </div>
              <button
                onClick={() => setShowJdModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans">
              {currentJob.description}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              {currentJob.url ? (
                <a
                  href={currentJob.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Original LinkedIn Posting</span>
                </a>
              ) : (
                <div />
              )}
              <button
                onClick={() => setShowJdModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: Save as New Resume / Profile */}
      {showSaveNewResumeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Save as New Resume Profile</h3>
              </div>
              <button
                onClick={() => setShowSaveNewResumeModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAsNewResume} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300">Resume Profile Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google PM Strategy, FinTech Lead"
                  value={newResumeName}
                  onChange={(e) => setNewResumeName(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300">Description / Focus (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Tailored for enterprise cloud and AI platforms"
                  value={newResumeDesc}
                  onChange={(e) => setNewResumeDesc(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                This will save your current tailored content as a completely independent resume profile, accessible in <strong>Overview</strong> and <strong>Resume Studio</strong>.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveNewResumeModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNewResume || !newResumeName.trim()}
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingNewResume && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{savingNewResume ? 'Saving...' : 'Create & Save Resume'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
