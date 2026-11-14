import React, { useState } from 'react';
import { User, Plus, Trash2, Check, X, Shield, Sparkles, AlertCircle } from 'lucide-react';
import { ProfileItem } from '../types';
import { api } from '../services/api';

interface ProfileModalProps {
  profiles: ProfileItem[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  onProfilesChanged: () => void;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profiles,
  activeProfileId,
  onSelectProfile,
  onProfilesChanged,
  onClose,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setSaving(true);
      setError(null);
      const created = await api.createProfile(newName.trim(), newDescription.trim());
      onProfilesChanged();
      onSelectProfile(created.id);
      setShowCreateForm(false);
      setNewName('');
      setNewDescription('');
    } catch (err: any) {
      setError(err.message || 'Failed to create profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete profile "${name}"? This will remove its independent master resume and guidelines.`)) {
      return;
    }
    try {
      await api.deleteProfile(id);
      if (activeProfileId === id) {
        onSelectProfile('default');
      }
      onProfilesChanged();
    } catch (err: any) {
      alert(err.message || 'Failed to delete profile');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Manage Master Profiles</h3>
              <p className="text-[11px] text-slate-400">
                Create independent master resumes and guidelines for different job domains
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile List */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {profiles.map((p) => {
            const isActive = p.id === activeProfileId;
            return (
              <div
                key={p.id}
                onClick={() => {
                  onSelectProfile(p.id);
                  onClose();
                }}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-100'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isActive ? <Check className="w-3.5 h-3.5" /> : p.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <h4 className="text-xs font-bold truncate">{p.name}</h4>
                      {p.isDefault && (
                        <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-semibold">
                          Default
                        </span>
                      )}
                    </div>
                    {p.description && (
                      <p className="text-[10.5px] text-slate-400 truncate mt-0.5">{p.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {!p.isDefault && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(p.id, p.name);
                      }}
                      className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Create Profile Toggle / Form */}
        {!showCreateForm ? (
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="w-full flex items-center justify-center space-x-1.5 p-2.5 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500 hover:bg-indigo-950/20 text-indigo-400 text-xs font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Independent Profile</span>
          </button>
        ) : (
          <form onSubmit={handleCreate} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>New Profile Setup</span>
              </span>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            {error && (
              <div className="p-2 rounded bg-rose-950/60 border border-rose-500/40 text-rose-200 text-[11px] flex items-center space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Profile Name
              </label>
              <input
                type="text"
                placeholder="e.g. Growth PM, Technical AI Architect, B2B SaaS Lead"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Domain / Purpose (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Optimized for consumer apps, PLG, and retention"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-[10.5px] text-indigo-200 leading-relaxed">
              💡 <strong>Default Starter:</strong> This new profile will automatically start with Pushpit Virmani's resume as its baseline template. All subsequent modifications, file uploads, and learned guidelines will be 100% isolated to this profile.
            </div>

            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !newName.trim()}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
