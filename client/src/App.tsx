import React, { useState } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewDashboard } from './components/OverviewDashboard';
import { JobsFeedPanel } from './components/JobsFeedPanel';
import { MasterResumeEditor } from './components/MasterResumeEditor';
import { SettingsPanel } from './components/SettingsPanel';
import { Sparkles, Layers, ArrowRight } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'overview':
        return { title: 'Overview Dashboard', subtitle: 'Targeted PM jobs, active schedule & quick metrics' };
      case 'jobs':
        return { title: 'LinkedIn Job Feed', subtitle: 'Search, filter, and queue PM postings for resume tailoring' };
      case 'resume':
        return { title: 'Master Resume Profile', subtitle: 'Pushpit Virmani • Senior Product Manager Master Profile' };
      case 'tailor':
        return { title: 'Tailor & Review Studio', subtitle: 'Side-by-side diff, keyword alignment, and iterative AI feedback' };
      case 'templates':
        return { title: 'Resume Builder & Templates', subtitle: 'High-scoring ATS templates targeted at FAANG & AI startups' };
      case 'settings':
        return { title: 'Settings Center', subtitle: 'Scraper limits, date cutoff filters, AI provider, and learned guidelines' };
      default:
        return { title: 'Dashboard', subtitle: '' };
    }
  };

  const { title, subtitle } = getHeaderInfo();

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 5-Section Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-950">
        <Header title={title} subtitle={subtitle} />

        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <OverviewDashboard onNavigate={(tab) => setActiveTab(tab)} />
          )}

          {activeTab === 'jobs' && (
            <JobsFeedPanel onTailorJobs={() => setActiveTab('tailor')} />
          )}

          {activeTab === 'resume' && (
            <MasterResumeEditor />
          )}

          {activeTab === 'tailor' && (
            <div className="max-w-4xl mx-auto p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-4 my-12">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Tailor & Review Studio (Phase 3)</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                The 3-column workspace with side-by-side diff, keyword checklist, and your interactive AI feedback chat is scheduled for implementation in <strong>Phase 3</strong>.
              </p>
              <button
                onClick={() => setActiveTab('resume')}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                <span>Edit Master Resume First</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="max-w-4xl mx-auto p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-4 my-12">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Resume Builder & Template Studio (Phase 4)</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                The dual-pane studio featuring the <strong>Harshit Kumar FAANG/AI startup ATS template</strong> with live vector preview and instant PDF/DOCX export is scheduled for <strong>Phase 4</strong>.
              </p>
              <button
                onClick={() => setActiveTab('overview')}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
              >
                <span>Return to Overview</span>
              </button>
            </div>
          )}

          {activeTab === 'settings' && (
            <SettingsPanel />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
