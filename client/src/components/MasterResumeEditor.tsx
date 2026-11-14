import React, { useEffect, useState } from 'react';
import { Save, RotateCcw, Check, AlertCircle, Loader2, Sparkles, Tag, X, Plus } from 'lucide-react';
import { api } from '../services/api';
import { ResumeProfile, SkillCategory, EducationItem } from '../types';
import { ResumeUploadDropzone } from './ResumeUploadDropzone';
import { ExperienceEditor } from './ExperienceEditor';

export const MasterResumeEditor: React.FC = () => {
  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadResume = async () => {
    try {
      setLoading(true);
      const data = await api.getResume();
      setProfile(data);
    } catch (e: any) {
      setToast({ type: 'error', message: e.message || 'Failed to load master resume' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResume();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    try {
      setSaving(true);
      const res = await api.updateResume(profile);
      setProfile(res.profile);
      setToast({ type: 'success', message: 'Master resume saved successfully!' });
      setTimeout(() => setToast(null), 4000);
    } catch (e: any) {
      setToast({ type: 'error', message: e.message || 'Failed to save master resume' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetSeed = async () => {
    if (!window.confirm('Reset master resume to default profile from .gsd/MASTER_RESUME.json?')) {
      return;
    }
    try {
      setSaving(true);
      const res = await api.resetResumeSeed();
      setProfile(res.profile);
      setToast({ type: 'success', message: 'Master resume reset to default profile' });
      setTimeout(() => setToast(null), 4000);
    } catch (e: any) {
      setToast({ type: 'error', message: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkillTag = (catIndex: number, newSkill: string) => {
    if (!profile || !newSkill.trim()) return;
    const updatedSkills = [...profile.skills];
    updatedSkills[catIndex].skills.push(newSkill.trim());
    setProfile({ ...profile, skills: updatedSkills });
  };

  const handleRemoveSkillTag = (catIndex: number, skillIndex: number) => {
    if (!profile) return;
    const updatedSkills = [...profile.skills];
    updatedSkills[catIndex].skills.splice(skillIndex, 1);
    setProfile({ ...profile, skills: updatedSkills });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Upload Dropzone Header */}
      <ResumeUploadDropzone onUploadComplete={(newProfile) => setProfile(newProfile)} />

      {/* Floating Save Action Bar */}
      <div className="sticky top-2 z-20 bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-xl p-3.5 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-300 font-medium">
            Editing Master Profile: <strong className="text-slate-100">{profile.name}</strong>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleResetSeed}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Sample Profile</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? 'Saving...' : 'Save Master Resume'}</span>
          </button>
        </div>
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

      {/* Personal Info Card */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">Personal & Contact Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div>
            <label className="text-[11px] font-semibold text-slate-400">Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400">Email Address</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400">Phone</label>
            <input
              type="text"
              value={profile.phone || ''}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400">Location</label>
            <input
              type="text"
              value={profile.location || ''}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400">LinkedIn Profile URL</label>
            <input
              type="text"
              value={profile.linkedinUrl || ''}
              onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400">Portfolio / GitHub</label>
            <input
              type="text"
              value={profile.portfolioUrl || ''}
              onChange={(e) => setProfile({ ...profile, portfolioUrl: e.target.value })}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Executive Summary</h3>
          <span className="text-[11px] text-slate-400">{profile.summary.length} characters</span>
        </div>
        <textarea
          rows={4}
          value={profile.summary}
          onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-indigo-500"
          placeholder="State your domain specialization, scale metrics, engineering/business intersection, and key achievements..."
        />
        <p className="text-[11px] text-slate-400">
          💡 <strong>Pro Tip:</strong> Quantify your scale (e.g. <em>$250k ARR, 50+ Cr GMV</em>) and emphasize technical PM leadership.
        </p>
      </div>

      {/* Experience Editor */}
      <ExperienceEditor
        experience={profile.experience}
        onChange={(experience) => setProfile({ ...profile, experience })}
      />

      {/* Skills Taxonomy Card */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">Core Skills Taxonomy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.skills.map((category, catIdx) => (
            <div key={catIdx} className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2.5">
              <span className="text-xs font-semibold text-indigo-400">{category.category}</span>
              <div className="flex flex-wrap gap-1.5">
                {category.skills.map((skill, sIdx) => (
                  <span
                    key={sIdx}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 text-[11px]"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkillTag(catIdx, sIdx)}
                      className="hover:text-rose-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Education Card */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">Education & Degrees</h3>
        <div className="space-y-2.5">
          {profile.education.map((edu, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-slate-200">{edu.institution} {edu.honors ? `(${edu.honors})` : ''}</p>
                <p className="text-slate-400">{edu.degree} in {edu.fieldOfStudy}</p>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">{edu.graduationYear}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
