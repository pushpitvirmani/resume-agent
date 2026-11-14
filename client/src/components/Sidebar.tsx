import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  FileEdit,
  Sparkles,
  Layers,
  Settings,
  ChevronRight
} from 'lucide-react';

export type NavTab = 'overview' | 'jobs' | 'resume' | 'tailor' | 'templates' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'overview' as NavTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'jobs' as NavTab, label: 'LinkedIn Jobs', icon: Briefcase },
    { id: 'resume' as NavTab, label: 'Master Resume', icon: FileEdit },
    { id: 'tailor' as NavTab, label: 'Tailor & Review', icon: Sparkles, badge: 'AI Diff' },
    { id: 'templates' as NavTab, label: 'Resume Studio', icon: Layers, badge: 'Phase 4' },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-slate-100 text-sm tracking-tight">AI Resume Suite</h1>
          <p className="text-xs text-slate-400">FAANG & Startup Matcher</p>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge ? (
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                  {item.badge}
                </span>
              ) : isActive ? (
                <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* User profile pill */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400">
            PV
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-200 truncate">Pushpit Virmani</p>
            <p className="text-[11px] text-slate-400 truncate">Senior Product Manager</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
