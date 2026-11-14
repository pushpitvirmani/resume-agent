import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  FileCheck2,
  TrendingUp,
  Clock,
  Play,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';
import { JobItem, ResumeProfile, AppSettings } from '../types';

interface OverviewDashboardProps {
  onNavigate: (tab: any) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onNavigate }) => {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [resume, setResume] = useState<ResumeProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [jobsData, resumeData, settingsData] = await Promise.all([
          api.getJobs().catch(() => []),
          api.getResume().catch(() => null),
          api.getSettings().catch(() => null)
        ]);
        setJobs(jobsData);
        setResume(resumeData);
        setSettings(settingsData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleScrapeNow = async () => {
    try {
      setScraping(true);
      // Simulate quick trigger or manual add
      await new Promise((r) => setTimeout(r, 1200));
      // Refresh
      const updatedJobs = await api.getJobs();
      setJobs(updatedJobs);
    } finally {
      setScraping(false);
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
            disabled={scraping}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{scraping ? 'Scraping Jobs...' : 'Scrape Now'}</span>
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
          <p className="text-2xl font-bold text-slate-100">0</p>
          <p className="text-[11px] text-slate-400">Ready in Phase 3</p>
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
