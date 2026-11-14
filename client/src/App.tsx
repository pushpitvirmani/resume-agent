import React, { useState } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewDashboard } from './components/OverviewDashboard';
import { JobsFeedPanel } from './components/JobsFeedPanel';
import { MasterResumeEditor } from './components/MasterResumeEditor';
import { SettingsPanel } from './components/SettingsPanel';
import { TailorStudio } from './components/TailorStudio';
import { ResumeStudio } from './components/ResumeStudio';
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
        {activeTab !== 'templates' && <Header title={title} subtitle={subtitle} />}

        <main className={`flex-1 overflow-y-auto ${activeTab === 'templates' ? 'p-0 overflow-hidden' : 'p-6'}`}>
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
            <TailorStudio />
          )}

          {activeTab === 'templates' && (
            <ResumeStudio />
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
