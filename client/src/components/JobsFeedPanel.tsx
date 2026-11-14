import React, { useEffect, useState, useRef } from 'react';
import {
  Search,
  Filter,
  Plus,
  ExternalLink,
  Sparkles,
  MapPin,
  Building,
  Calendar,
  CheckSquare,
  Square,
  X,
  Loader2,
  Play,
  CheckCircle2,
  AlertCircle,
  Download
} from 'lucide-react';
import { api } from '../services/api';
import { JobItem, ScraperStatus } from '../types';

interface JobsFeedPanelProps {
  onTailorJobs?: (jobIds: string[]) => void;
}

export const JobsFeedPanel: React.FC<JobsFeedPanelProps> = ({ onTailorJobs }) => {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [batchExporting, setBatchExporting] = useState<boolean>(false);
  const [activeJob, setActiveJob] = useState<JobItem | null>(null);

  const handleBatchExportDocx = async () => {
    if (selectedJobIds.length === 0) return;
    try {
      setBatchExporting(true);
      await api.exportBatch(selectedJobIds, 'docx');
    } catch (err: any) {
      alert(`Batch export failed: ${err.message || 'Error creating ZIP'}`);
    } finally {
      setBatchExporting(false);
    }
  };
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scraperStatus, setScraperStatus] = useState<ScraperStatus | null>(null);
  const pollTimerRef = useRef<any>(null);

  // New job modal state
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    location: 'Remote',
    url: '',
    description: ''
  });

  const loadJobs = async () => {
    try {
      setLoading(true);
      const [data, statusData] = await Promise.all([
        api.getJobs(),
        api.getScraperStatus().catch(() => null),
      ]);
      setJobs(data);
      if (statusData?.status) {
        setScraperStatus(statusData.status);
      }
      if (data.length > 0 && !activeJob) {
        setActiveJob(data[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // Poll status while scraper is running
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
              const refreshed = await api.getJobs();
              setJobs(refreshed);
              if (refreshed.length > 0) setActiveJob(refreshed[0]);
            }
          }
        } catch (err) {
          console.error('Error polling status:', err);
        }
      }, 1000);
    }
  }, [scraperStatus?.isRunning]);

  const handleTriggerScraper = async () => {
    try {
      const options: any = {};
      if (searchKeyword.trim()) {
        options.keywords = searchKeyword.trim();
      }
      const res = await api.triggerScraper(options);
      if (res?.status) {
        setScraperStatus(res.status);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to trigger scraper');
    }
  };

  const isScraping = scraperStatus?.isRunning || false;

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedJobIds.includes(id)) {
      setSelectedJobIds(selectedJobIds.filter((item) => item !== id));
    } else {
      setSelectedJobIds([...selectedJobIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedJobIds.length === filteredJobs.length) {
      setSelectedJobIds([]);
    } else {
      setSelectedJobIds(filteredJobs.map((j) => j.id));
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createJob(newJob);
      setJobs([created, ...jobs]);
      setActiveJob(created);
      setShowAddModal(false);
      setNewJob({ title: '', company: '', location: 'Remote', url: '', description: '' });
    } catch (err: any) {
      alert(err.message || 'Failed to create job');
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const q = searchKeyword.toLowerCase();
    return (
      job.title.toLowerCase().includes(q) ||
      job.company.toLowerCase().includes(q) ||
      job.location.toLowerCase().includes(q) ||
      job.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Search Bar & Action Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 shrink-0">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Targeted Search: 'AI Product Manager', 'Staff PM', company..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleTriggerScraper}
            disabled={isScraping}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            {isScraping ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{isScraping ? 'Scraping...' : 'Scrape LinkedIn'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Job Manually</span>
          </button>
        </div>
      </div>

      {/* Scraper Progress Banner */}
      {scraperStatus && (scraperStatus.isRunning || scraperStatus.error || scraperStatus.lastResult) && (
        <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
          scraperStatus.isRunning
            ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
            : scraperStatus.error
            ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
        }`}>
          <div className="flex items-center space-x-2">
            {scraperStatus.isRunning ? (
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
            ) : scraperStatus.error ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <div>
              <p className="font-semibold">{scraperStatus.progress}</p>
            </div>
          </div>
          {scraperStatus.isRunning && (
            <div className="font-mono text-[11px] bg-indigo-500/20 px-2 py-0.5 rounded">
              {scraperStatus.currentCount} / {scraperStatus.maxJobs}
            </div>
          )}
        </div>
      )}

      {/* Main Split View: Job List & Job Details Drawer */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        {/* Left Column: Job Table */}
        <div className="lg:col-span-5 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40 text-xs text-slate-400">
            <button
              onClick={handleSelectAll}
              className="flex items-center space-x-1.5 hover:text-slate-200"
            >
              {selectedJobIds.length > 0 && selectedJobIds.length === filteredJobs.length ? (
                <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              <span>Select All ({filteredJobs.length})</span>
            </button>
            <span>{selectedJobIds.length} selected</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
                Loading jobs...
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No jobs match your search keywords.
              </div>
            ) : (
              filteredJobs.map((job) => {
                const isSelected = selectedJobIds.includes(job.id);
                const isActive = activeJob?.id === job.id;
                return (
                  <div
                    key={job.id}
                    onClick={() => setActiveJob(job)}
                    className={`p-3.5 cursor-pointer transition-colors flex items-start space-x-3 ${
                      isActive
                        ? 'bg-indigo-950/20 border-l-2 border-indigo-500'
                        : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <button
                      onClick={(e) => handleToggleSelect(job.id, e)}
                      className="mt-0.5 text-slate-400 hover:text-indigo-400"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-slate-100 truncate">{job.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {job.company} • {job.location}
                      </p>
                      <div className="flex items-center space-x-2 mt-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {job.status}
                        </span>
                        {job.matchScore && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-semibold">
                            {job.matchScore}% Match
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Full JD Drawer */}
        <div className="lg:col-span-7 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col overflow-hidden">
          {activeJob ? (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{activeJob.title}</h3>
                  <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center space-x-1">
                      <Building className="w-3.5 h-3.5" />
                      <span>{activeJob.company}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{activeJob.location}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <a
                    href={activeJob.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Posting</span>
                  </a>
                </div>
              </div>

              {/* JD Content */}
              <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {activeJob.description}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-slate-500">
              Select a job on the left to read the full job description.
            </div>
          )}
        </div>
      </div>

      {/* Sticky Floating Action Bar for Selected Jobs */}
      {selectedJobIds.length > 0 && (
        <div className="fixed bottom-4 left-72 right-8 z-30 bg-slate-900/95 backdrop-blur border border-indigo-500/40 rounded-xl p-3.5 shadow-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
            <span className="text-xs font-semibold text-slate-200">
              {selectedJobIds.length} Job{selectedJobIds.length > 1 ? 's' : ''} Selected
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedJobIds([])}
              className="px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium"
            >
              Clear Selection
            </button>
            <button
              onClick={() => onTailorJobs && onTailorJobs(selectedJobIds)}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tailor Resumes for Selected ({selectedJobIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Manual Add Job Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">Add Job Posting Manually</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400">Job Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior AI Product Manager"
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Company</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OpenAI"
                    value={newJob.company}
                    onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Location</label>
                  <input
                    type="text"
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400">Posting URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://www.linkedin.com/jobs/view/..."
                  value={newJob.url}
                  onChange={(e) => setNewJob({ ...newJob, url: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400">Job Description (JD)</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Paste complete job description requirements here..."
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow"
                >
                  Save Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Floating Batch Action Bar */}
      {selectedJobIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-slate-900 border border-indigo-500/50 rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-4 text-xs animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="font-semibold text-white">
              {selectedJobIds.length} {selectedJobIds.length === 1 ? 'Job' : 'Jobs'} Selected
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {onTailorJobs && (
            <button
              onClick={() => onTailorJobs(selectedJobIds)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tailor with AI</span>
            </button>
          )}

          <button
            onClick={handleBatchExportDocx}
            disabled={batchExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition-colors disabled:opacity-50"
          >
            {batchExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            ) : (
              <Download className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span>{batchExporting ? 'Packaging ZIP...' : 'Export Batch (.zip)'}</span>
          </button>

          <button
            onClick={() => setSelectedJobIds([])}
            className="text-slate-400 hover:text-white px-2 py-1 font-medium"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};
