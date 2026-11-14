import React, { useEffect, useState, useRef } from 'react';
import {
  Briefcase,
  FileCheck2,
  TrendingUp,
  Clock,
  Play,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  Layers,
  FileText,
  Printer,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import { JobItem, ResumeProfile, AppSettings, ScraperStatus, ProfileItem } from '../types';

interface OverviewDashboardProps {
  onNavigate: (tab: any, jobId?: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onNavigate }) => {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [resume, setResume] = useState<ResumeProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [tailoredResumes, setTailoredResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraperStatus, setScraperStatus] = useState<ScraperStatus | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);
  const pollTimerRef = useRef<any>(null);

  const loadData = async () => {
    try {
      const [jobsData, resumeData, settingsData, statusData, profilesData, tailoredData] = await Promise.all([
        api.getJobs().catch(() => []),
        api.getResume().catch(() => null),
        api.getSettings().catch(() => null),
        api.getScraperStatus().catch(() => null),
        api.getProfiles().catch(() => []),
        api.getAllTailoredResumes().catch(() => []),
      ]);
      setJobs(jobsData);
      setResume(resumeData);
      setSettings(settingsData);
      setProfiles(profilesData);
      setTailoredResumes(tailoredData);
      if (statusData?.status) {
        setScraperStatus(statusData.status);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocx = async (opts: { type: 'master' | 'profile' | 'tailored'; id?: string; name: string }) => {
    try {
      setDownloadingId(opts.id || opts.type);
      if (opts.type === 'master') {
        await api.exportDocx({ profileId: 'default' }, `${opts.name.replace(/\s+/g, '_')}_Resume.docx`);
      } else if (opts.type === 'profile') {
        await api.exportDocx({ profileId: opts.id }, `${opts.name.replace(/\s+/g, '_')}_Resume.docx`);
      } else if (opts.type === 'tailored') {
        await api.exportDocx({ jobId: opts.id }, `${opts.name.replace(/\s+/g, '_')}_Tailored_Resume.docx`);
      }
    } catch (err: any) {
      alert(`Download failed: ${err.message || 'Error creating file'}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadPdf = async (opts: { type: 'master' | 'profile' | 'tailored'; id?: string; name: string }) => {
    try {
      setDownloadingPdfId(opts.id || opts.type);
      if (opts.type === 'master') {
        await api.exportPdf({ profileId: 'default' }, `${opts.name.replace(/\s+/g, '_')}_Resume.pdf`);
      } else if (opts.type === 'profile') {
        await api.exportPdf({ profileId: opts.id }, `${opts.name.replace(/\s+/g, '_')}_Resume.pdf`);
      } else if (opts.type === 'tailored') {
        await api.exportPdf({ jobId: opts.id }, `${opts.name.replace(/\s+/g, '_')}_Tailored_Resume.pdf`);
      }
    } catch (err: any) {
      alert(`PDF download failed: ${err.message || 'Error generating PDF'}`);
    } finally {
      setDownloadingPdfId(null);
    }
  };

  useEffect(() => {
    loadData();
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // Poll scraper status if running
  useEffect(() => {
    if (scraperStatus?.isRunning && !pollTimerRef.current) {
      pollTimerRef.current = setInterval(async () => {
        try {
          const res = await api.getScraperStatus();
          if (res?.status) {
            setScraperStatus(res.status);
            if (!res.status.isRunning) {
              if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
              }
              // Refresh job list once scraping completes
              const refreshed = await api.getJobs();
              setJobs(refreshed);
            }
          }
        } catch (err) {
          console.error('Error polling scraper status:', err);
        }
      }, 1000);
    }
  }, [scraperStatus?.isRunning]);

  const handleScrapeNow = async () => {
    try {
      const res = await api.triggerScraper();
      if (res?.status) {
        setScraperStatus(res.status);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to trigger scrape');
    }
  };

  const isScraping = scraperStatus?.isRunning || false;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900/60 to-purple-950/40 border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Product Management Suite</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Welcome back, {resume?.name || 'Pushpit'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Targeting high-impact PM roles across FAANG & top AI startups. Automated daily scraper is configured for up to{' '}
            <strong>{settings?.maxScrapeJobs || 25} postings</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleScrapeNow}
            disabled={isScraping}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {isScraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{isScraping ? 'Scraping Jobs...' : 'Scrape Now'}</span>
          </button>
          <button
            onClick={() => onNavigate('resume')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
          >
            <span>Edit Resume</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live Scraper Status Banner */}
      {scraperStatus && (scraperStatus.isRunning || scraperStatus.error || scraperStatus.lastResult) && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs transition-all ${
          scraperStatus.isRunning
            ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
            : scraperStatus.error
            ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
        }`}>
          <div className="flex items-center space-x-2.5">
            {scraperStatus.isRunning ? (
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
            ) : scraperStatus.error ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <div>
              <p className="font-semibold">{scraperStatus.progress}</p>
              {scraperStatus.lastResult && !scraperStatus.isRunning && (
                <p className="text-[11px] opacity-80 mt-0.5">
                  Extracted {scraperStatus.lastResult.scraped} positions • {scraperStatus.lastResult.inserted} new jobs added to your feed
                </p>
              )}
            </div>
          </div>
          {scraperStatus.isRunning && (
            <div className="shrink-0 font-mono text-[11px] bg-indigo-500/20 px-2 py-1 rounded">
              {scraperStatus.currentCount} / {scraperStatus.maxJobs}
            </div>
          )}
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Discovered Jobs</span>
            <Briefcase className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{jobs.length}</p>
          <p className="text-[11px] text-emerald-400 font-medium">Auto-filter: PM Domain</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Resumes Tailored</span>
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{tailoredResumes.length}</p>
          <p className="text-[11px] text-emerald-400 font-medium">
            {tailoredResumes.length > 0 ? `${tailoredResumes.length} Ready for Download` : 'Ready in Tailor Studio'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Target ATS Score</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">92%</p>
          <p className="text-[11px] text-purple-400 font-medium">FAANG / AI Benchmark</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Scraper Schedule</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-sm font-bold text-slate-100 truncate mt-1">Daily @ 9:00 AM</p>
          <p className="text-[11px] text-slate-400 font-mono">Limit: {settings?.maxScrapeJobs || 25} jobs</p>
        </div>
      </div>

      {/* Saved Resumes & Download Center */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Saved Resumes & Download Center</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              1-click Word (.docx) and PDF downloads for your Master profile, custom profiles, and AI-tailored resumes.
            </p>
          </div>
          <button
            onClick={() => onNavigate('templates')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Open Resume Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {/* 1. Master Baseline Resume */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-700 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0 mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-100">
                    {resume?.name || 'Pushpit Virmani'} — Master Resume
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 font-semibold">
                    Master Baseline
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Default source resume with all baseline experiences, skills, and metrics
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <button
                onClick={() => handleDownloadPdf({ type: 'master', name: resume?.name || 'Pushpit_Virmani' })}
                disabled={downloadingPdfId === 'master'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                title="Download ATS-compliant 1-page PDF (.pdf)"
              >
                {downloadingPdfId === 'master' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>PDF (.pdf)</span>
              </button>

              <button
                onClick={() => handleDownloadDocx({ type: 'master', name: resume?.name || 'Pushpit_Virmani' })}
                disabled={downloadingId === 'master'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all disabled:opacity-50"
                title="Download ATS-compliant Word document (.docx)"
              >
                {downloadingId === 'master' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                )}
                <span>Word (.docx)</span>
              </button>

              <button
                onClick={() => onNavigate('templates')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-all"
                title="Open in Resume Studio to customize templates"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Studio</span>
              </button>

              <button
                onClick={() => onNavigate('resume')}
                className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs transition-colors"
                title="Edit Master Profile"
              >
                Edit
              </button>
            </div>
          </div>

          {/* 2. Custom Named Profiles */}
          {profiles.filter((p) => !p.isDefault).map((prof) => (
            <div
              key={prof.id}
              className="p-3.5 rounded-xl bg-slate-950 border border-purple-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-purple-500/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0 mt-0.5">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-100">
                      {prof.name}
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/30 font-semibold">
                      Custom Profile
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {prof.description || 'Independent resume profile with custom achievements'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                <button
                  onClick={() => handleDownloadPdf({ type: 'profile', id: prof.id, name: prof.name })}
                  disabled={downloadingPdfId === prof.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                  title="Download profile as 1-page PDF (.pdf)"
                >
                  {downloadingPdfId === prof.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>PDF (.pdf)</span>
                </button>

                <button
                  onClick={() => handleDownloadDocx({ type: 'profile', id: prof.id, name: prof.name })}
                  disabled={downloadingId === prof.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all disabled:opacity-50"
                  title="Download profile as Word document (.docx)"
                >
                  {downloadingId === prof.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-purple-400" />
                  )}
                  <span>Word (.docx)</span>
                </button>

                <button
                  onClick={() => onNavigate('templates')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-all"
                  title="Open in Resume Studio"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Studio</span>
                </button>
              </div>
            </div>
          ))}

          {/* 3. Tailored Resumes */}
          {tailoredResumes.map((tailored) => (
            <div
              key={tailored.id}
              className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-emerald-500/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-100">
                      {tailored.job?.company || 'Company'} — {tailored.job?.title || 'Tailored Resume'}
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-semibold">
                      Tailored ({tailored.atsScore}% ATS)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {tailored.job?.location ? `${tailored.job.location} • ` : ''}Updated with AI tailored achievements & keyword match
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                <button
                  onClick={() => handleDownloadPdf({
                    type: 'tailored',
                    id: tailored.jobId,
                    name: `${tailored.job?.company || 'Job'}_Resume`
                  })}
                  disabled={downloadingPdfId === tailored.jobId}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                  title="Download tailored 1-page PDF (.pdf)"
                >
                  {downloadingPdfId === tailored.jobId ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>PDF (.pdf)</span>
                </button>

                <button
                  onClick={() => handleDownloadDocx({
                    type: 'tailored',
                    id: tailored.jobId,
                    name: `${tailored.job?.company || 'Job'}_Resume`
                  })}
                  disabled={downloadingId === tailored.jobId}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all disabled:opacity-50"
                  title="Download tailored Word document (.docx)"
                >
                  {downloadingId === tailored.jobId ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>Word (.docx)</span>
                </button>

                <button
                  onClick={() => onNavigate('tailor', tailored.jobId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all"
                  title="Open in Tailor & Review Studio"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tailor & Review</span>
                </button>

                <button
                  onClick={() => onNavigate('templates', tailored.jobId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-all"
                  title="Open in Resume Studio"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Studio</span>
                </button>
              </div>
            </div>
          ))}

          {/* Empty State when no tailored resumes or custom profiles exist */}
          {profiles.filter((p) => !p.isDefault).length === 0 && tailoredResumes.length === 0 && (
            <div className="p-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-xs text-slate-400">
              Your Master Resume is ready for download above. When you tailor resumes for jobs or save new profiles, they will appear here with 1-click download options!
            </div>
          )}
        </div>
      </div>

      {/* Discovered Jobs List Preview */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Recent Discovered Postings</h3>
          <button
            onClick={() => onNavigate('jobs')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1"
          >
            <span>View All in Feed</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-800 rounded-lg">
            No jobs fetched yet. Click "Scrape Now" or visit the <strong>LinkedIn Jobs</strong> tab to run your first targeted scrape!
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.slice(0, 5).map((job) => (
              <div
                key={job.id}
                className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-colors"
              >
                <div>
                  <h4 className="text-xs font-semibold text-slate-100">{job.title}</h4>
                  <p className="text-[11px] text-slate-400">
                    {job.company} • {job.location}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => onNavigate('tailor')}
                    className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-[11px] font-medium"
                  >
                    Tailor Resume
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
