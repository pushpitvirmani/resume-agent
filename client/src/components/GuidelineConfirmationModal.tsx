import React, { useState } from 'react';
import { ShieldCheck, Sparkles, X, AlertTriangle, Check, BookOpen } from 'lucide-react';
import { SuggestedGuideline } from '../types';

interface GuidelineConfirmationModalProps {
  guideline: SuggestedGuideline;
  onConfirm: (rule: string, category: string) => Promise<void>;
  onDismiss: () => void;
}

export const GuidelineConfirmationModal: React.FC<GuidelineConfirmationModalProps> = ({
  guideline,
  onConfirm,
  onDismiss,
}) => {
  const [ruleText, setRuleText] = useState(guideline.rule);
  const [category, setCategory] = useState(guideline.category || 'general');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!ruleText.trim()) return;
    try {
      setSaving(true);
      await onConfirm(ruleText.trim(), category);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-indigo-500/40 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold mb-1">
                <AlertTriangle className="w-2.5 h-2.5" />
                <span>Explicit User Confirmation Required</span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Add to Global Resume Guidelines?
              </h3>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* AI Reasoning */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
          <div className="flex items-center space-x-1.5 text-indigo-400 font-semibold text-[11px]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Why this rule was derived:</span>
          </div>
          <p className="text-slate-400 leading-relaxed italic">
            "{guideline.reasoning}"
          </p>
        </div>

        {/* Editable Rule Input */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Proposed General Guideline Rule
            </label>
            <textarea
              rows={3}
              value={ruleText}
              onChange={(e) => setRuleText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 leading-relaxed"
              placeholder="e.g. Always lead bullets with quantified revenue or ARR numbers..."
            />
            <p className="text-[11px] text-slate-400 mt-1">
              You can fine-tune the rule text above before saving. Once confirmed, this guideline will be applied to <strong>all future AI resume tailorings</strong>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="metrics">Metrics & Quantifiable Impact</option>
              <option value="style">Writing Style & Hooks</option>
              <option value="summary">Executive Summary</option>
              <option value="formatting">Formatting & Structure</option>
              <option value="general">General Principles</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onDismiss}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Dismiss for Now
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !ruleText.trim()}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Add to Global Rules'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
