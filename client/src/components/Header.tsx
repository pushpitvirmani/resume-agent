import React, { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { AIStatusResponse } from '../types';

interface HeaderProps {
  title: string;
  subtitle: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const [aiStatus, setAiStatus] = useState<AIStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.getAIStatus();
      setAiStatus(res);
    } catch (e) {
      console.error('Failed to load AI status', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const activeProvider = aiStatus?.activeProvider || 'gemini';
  const providerInfo = aiStatus?.providers[activeProvider];
  const isConnected = providerInfo?.connected;

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-base font-semibold text-slate-100">{title}</h2>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>

      <div className="flex items-center space-x-3">
        {/* Dynamic AI Status Badge */}
        <div
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
            isConnected
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-950/30'
              : providerInfo?.configured
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-400'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-400'
          }`}
        >
          {loading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
          ) : isConnected ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          )}

          <span>
            {activeProvider.toUpperCase()}:{' '}
            {isConnected ? (
              <span>
                Connected{' '}
                <span className="opacity-70 text-[11px]">
                  ({providerInfo?.model} {providerInfo?.latencyMs ? `• ${providerInfo.latencyMs}ms` : ''})
                </span>
              </span>
            ) : providerInfo?.configured ? (
              <span>Connecting...</span>
            ) : (
              <span>Key Missing</span>
            )}
          </span>
        </div>

        <button
          onClick={fetchStatus}
          title="Refresh AI Connection"
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  );
};
