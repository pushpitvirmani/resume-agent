import React, { useEffect, useState } from 'react';
import {
  Sliders,
  Sparkles,
  ShieldCheck,
  BookOpen,
  Save,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
  Plus,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { AppSettings, ResumeGuideline, AIStatusResponse } from '../types';

export const SettingsPanel: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'scraper' | 'session' | 'ai' | 'guidelines'>('scraper');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [guidelines, setGuidelines] = useState<ResumeGuideline[]>([]);
  const [aiStatus, setAiStatus] = useState<AIStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearingJobs, setClearingJobs] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleClearAllJobs = async () => {
    if (!window.confirm('Are you sure you want to delete all scraped job postings? This will remove all scraped jobs from your feed and dashboard.')) {
      return;
    }
    try {
      setClearingJobs(true);
      const res = await api.clearAllJobs();
      setToast({ type: 'success', message: res.message || 'All scraped jobs have been cleared.' });
      setTimeout(() => setToast(null), 4000);
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to clear scraped jobs' });
    } finally {
      setClearingJobs(false);
    }
  };

  // New guideline input
  const [newRule, setNewRule] = useState('');
  const [newCategory, setNewCategory] = useState('metrics');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [settingsData, guidelinesData, aiData] = await Promise.all([
          api.getSettings(),
          api.getGuidelines(),
          api.getAIStatus()
        ]);
        setSettings(settingsData);
        setGuidelines(guidelinesData);
        setAiStatus(aiData);
      } catch (err: any) {
        setToast({ type: 'error', message: err.message || 'Failed to load settings' });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveSettings = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      const res = await api.updateSettings(settings);
      setSettings(res.settings);
      setToast({ type: 'success', message: 'Settings saved successfully!' });
      setTimeout(() => setToast(null), 4000);
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAIProvider = async (provider: 'gemini' | 'claude' | 'openai') => {
    try {
      setSaving(true);
      await api.selectAIProvider(provider);
      if (settings) setSettings({ ...settings, activeAiProvider: provider });
      const updatedAi = await api.getAIStatus();
      setAiStatus(updatedAi);
      setToast({ type: 'success', message: `Active AI provider switched to ${provider.toUpperCase()}` });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleGuideline = async (id: string, active: boolean) => {
    try {
      const updated = await api.toggleGuideline(id, active);
      setGuidelines(guidelines.map((g) => (g.id === id ? updated : g)));
    } catch (err: any) {
      setToast({ type: 'error', message: err.message });
    }
  };

  const handleDeleteGuideline = async (id: string) => {
    try {
      await api.deleteGuideline(id);
      setGuidelines(guidelines.filter((g) => g.id !== id));
      setToast({ type: 'success', message: 'Guideline removed' });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setToast({ type: 'error', message: err.message });
    }
  };

  const handleAddGuideline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.trim()) return;
    try {
      const created = await api.createGuideline(newRule.trim(), newCategory);
      setGuidelines([created, ...guidelines]);
      setNewRule('');
      setToast({ type: 'success', message: 'New global guideline confirmed and saved!' });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setToast({ type: 'error', message: err.message });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Sub-tabs header */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('scraper')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'scraper'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Automation & Scraper Limits</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ai')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'ai'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Multi-Model AI Engine</span>
        </button>

        <button
          onClick={() => setActiveSubTab('guidelines')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'guidelines'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Global Guidelines ({guidelines.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('session')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'session'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>LinkedIn Session</span>
        </button>
      </div>

      {toast && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center space-x-2 shadow-lg ${
            toast.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/80 border border-rose-500/50 text-rose-200'
          }`}
        >
          {toast.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* TAB 1: Automation & Scraper Limits */}
      {activeSubTab === 'scraper' && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-100">LinkedIn Scraper Controls & Limits</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure how many postings to collect per run and filter by posting date to prevent outdated listings.
            </p>
          </div>

          <div className="space-y-5">
            {/* Max Postings Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Max Postings Limit per Scrape: <strong className="text-indigo-400 font-mono">{settings.maxScrapeJobs} jobs</strong>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min={5}
                  max={200}
                  value={settings.maxScrapeJobs}
                  onChange={(e) => setSettings({ ...settings, maxScrapeJobs: Number(e.target.value) || 25 })}
                  className="w-32 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center space-x-1.5">
                  {[10, 25, 50, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSettings({ ...settings, maxScrapeJobs: preset })}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        settings.maxScrapeJobs === preset
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Recommended: 25–50 jobs per run to maintain safe LinkedIn session velocity.
              </p>
            </div>

            {/* Date Cutoff Filter */}
            <div className="space-y-2 pt-4 border-t border-slate-800/80">
              <label className="text-xs font-semibold text-slate-300">
                Date Filter: "From Which Date Onwards"
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400">Preset Range</label>
                  <select
                    value={settings.dateFilterPreset}
                    onChange={(e: any) => setSettings({ ...settings, dateFilterPreset: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="past_24h">Past 24 Hours</option>
                    <option value="past_week">Past 7 Days (Past Week)</option>
                    <option value="past_month">Past 30 Days (Past Month)</option>
                    <option value="custom">Custom Date Onwards...</option>
                  </select>
                </div>

                {settings.dateFilterPreset === 'custom' && (
                  <div>
                    <label className="text-[11px] text-slate-400">Custom Calendar Cutoff Date</label>
                    <input
                      type="date"
                      value={settings.scrapeDateFrom ? settings.scrapeDateFrom.split('T')[0] : ''}
                      onChange={(e) => setSettings({ ...settings, scrapeDateFrom: e.target.value })}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Target Keywords and Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
              <div>
                <label className="text-xs font-semibold text-slate-300">Target Role Keywords</label>
                <input
                  type="text"
                  value={settings.keywords}
                  onChange={(e) => setSettings({ ...settings, keywords: e.target.value })}
                  placeholder="e.g. Senior Product Manager, AI PM"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">Target Location</label>
                <input
                  type="text"
                  value={settings.location}
                  onChange={(e) => setSettings({ ...settings, location: e.target.value })}
                  placeholder="e.g. Remote, United States, India"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Schedule & Headless Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
              <div>
                <label className="text-xs font-semibold text-slate-300">Daily Schedule (Cron)</label>
                <input
                  type="text"
                  value={settings.dailyScheduleCron}
                  onChange={(e) => setSettings({ ...settings, dailyScheduleCron: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Default: '0 9 * * *' (9:00 AM daily)</span>
              </div>
              <div className="flex items-center space-x-3 pt-5">
                <input
                  type="checkbox"
                  id="headlessToggle"
                  checked={settings.headless}
                  onChange={(e) => setSettings({ ...settings, headless: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800 focus:ring-0"
                />
                <label htmlFor="headlessToggle" className="text-xs text-slate-300 font-medium">
                  Run Headless Browser (Background, no visible window)
                </label>
              </div>
            </div>

            {/* Clear Scraped Results Option */}
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Clear All Scraped Results</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Deletes all scraped job postings from the database for this profile.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClearAllJobs}
                disabled={clearingJobs}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition-all shrink-0 self-start sm:self-auto disabled:opacity-50"
              >
                {clearingJobs ? 'Clearing...' : 'Clear All Scraped Jobs'}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? 'Saving...' : 'Save Scraper Settings'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: Multi-Model AI Engine */}
      {activeSubTab === 'ai' && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Multi-Model AI Configuration</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select your active LLM provider for JD analysis, ATS scoring, and bullet rewriting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Gemini Card */}
            <div
              onClick={() => handleSelectAIProvider('gemini')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                settings.activeAiProvider === 'gemini'
                  ? 'bg-indigo-950/30 border-indigo-500 shadow-md'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-100">Google Gemini</span>
                {settings.activeAiProvider === 'gemini' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-600 text-white">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Primary Model: <strong className="text-slate-300">gemini-flash-latest</strong>
              </p>
              <div className="mt-3 flex items-center space-x-1.5 text-[11px]">
                <div
                  className={`w-2 h-2 rounded-full ${
                    aiStatus?.providers.gemini.connected ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                <span className="text-slate-400">
                  {aiStatus?.providers.gemini.connected
                    ? `Connected (${aiStatus.providers.gemini.latencyMs}ms)`
                    : aiStatus?.providers.gemini.message}
                </span>
              </div>
            </div>

            {/* Claude Card */}
            <div
              onClick={() => handleSelectAIProvider('claude')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                settings.activeAiProvider === 'claude'
                  ? 'bg-indigo-950/30 border-indigo-500 shadow-md'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-100">Anthropic Claude</span>
                {settings.activeAiProvider === 'claude' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-600 text-white">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Primary Model: <strong className="text-slate-300">claude-3-5-sonnet</strong>
              </p>
              <div className="mt-3 flex items-center space-x-1.5 text-[11px]">
                <div
                  className={`w-2 h-2 rounded-full ${
                    aiStatus?.providers.claude.connected ? 'bg-emerald-400' : 'bg-slate-600'
                  }`}
                />
                <span className="text-slate-400">
                  {aiStatus?.providers.claude.configured ? 'Configured' : 'Optional (API Key in .env)'}
                </span>
              </div>
            </div>

            {/* OpenAI Card */}
            <div
              onClick={() => handleSelectAIProvider('openai')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                settings.activeAiProvider === 'openai'
                  ? 'bg-indigo-950/30 border-indigo-500 shadow-md'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-100">OpenAI GPT</span>
                {settings.activeAiProvider === 'openai' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-600 text-white">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Primary Model: <strong className="text-slate-300">gpt-4o</strong>
              </p>
              <div className="mt-3 flex items-center space-x-1.5 text-[11px]">
                <div
                  className={`w-2 h-2 rounded-full ${
                    aiStatus?.providers.openai.connected ? 'bg-emerald-400' : 'bg-slate-600'
                  }`}
                />
                <span className="text-slate-400">
                  {aiStatus?.providers.openai.configured ? 'Configured' : 'Optional (API Key in .env)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Global Resume Guidelines */}
      {activeSubTab === 'guidelines' && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Learned Global Resume Guidelines</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              These confirmed rules are automatically passed into every AI tailoring prompt to shape your resumes to your exact standards.
            </p>
          </div>

          {/* Add Guideline Form */}
          <form onSubmit={handleAddGuideline} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold text-slate-200">Confirm & Add New Global Rule</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <input
                type="text"
                required
                placeholder="e.g. 'Never use passive voice; lead with revenue or percentage growth'"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                className="sm:col-span-3 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="metrics">Metrics</option>
                <option value="style">Style</option>
                <option value="keywords">Keywords</option>
                <option value="general">General</option>
              </select>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Confirm & Add Rule</span>
              </button>
            </div>
          </form>

          {/* Active Guidelines List */}
          <div className="space-y-2.5">
            {guidelines.map((g) => (
              <div
                key={g.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between space-x-3"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={g.active}
                    onChange={(e) => handleToggleGuideline(g.id, e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                  />
                  <div className="min-w-0">
                    <p className={`text-xs ${g.active ? 'text-slate-200' : 'text-slate-500 line-through'}`}>
                      {g.rule}
                    </p>
                    <span className="text-[10px] font-mono uppercase text-indigo-400">{g.category}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteGuideline(g.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded transition-colors"
                  title="Remove rule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: LinkedIn Session */}
      {activeSubTab === 'session' && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100">LinkedIn Cookie & Chrome Session</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The scraper uses your local Chrome browser session cookies for headless automation. This is configured in Phase 2
            to guarantee zero password risk and prevent bot challenges.
          </p>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-semibold">
              <Check className="w-4 h-4" />
              <span>Headless Runner Strategy: Playwright Local Profile</span>
            </div>
            <p className="text-[11px] text-slate-400">
              In Phase 2, the runner links directly to your local Chrome User Data directory.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
