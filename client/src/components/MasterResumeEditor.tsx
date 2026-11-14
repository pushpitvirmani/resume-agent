import React, { useEffect, useState } from 'react';
import {
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  Tag,
  X,
  Plus,
  User,
  ChevronRight,
  ShieldAlert,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { ResumeProfile, SkillCategory, EducationItem, ProfileItem } from '../types';
import { ResumeUploadDropzone } from './ResumeUploadDropzone';
import { ExperienceEditor } from './ExperienceEditor';
import { ProfileModal } from './ProfileModal';

export const MasterResumeEditor: React.FC = () => {
  // Profiles state
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('default');
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // Resume data state
  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load profiles on mount
  const loadProfiles = async () => {
    try {
      const list = await api.getProfiles();
      setProfiles(list);
      const defaultProf = list.find((p) => p.isDefault) || list[0];
      if (defaultProf && activeProfileId === 'default') {
        setActiveProfileId(defaultProf.id);
      }
    } catch (err) {
      console.error('Failed to load profiles:', err);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadResume = async (profId: string) => {
    try {
      setLoading(true);
      const data = await api.getResume(profId);
      setProfile(data);
    } catch (e: any) {
      setToast({ type: 'error', message: e.message || 'Failed to load master resume' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeProfileId) {
      loadResume(activeProfileId);
    }
  }, [activeProfileId]);

  const handleSave = async () => {
    if (!profile) return;
    try {
      setSaving(true);
      const res = await api.updateResume(profile, activeProfileId);
      setProfile(res.profile);
      setToast({
        type: 'success',
        message: `Master resume saved for "${activeProfile?.name || 'Active Profile'}"!`,
      });
      setTimeout(() => setToast(null), 4000);
    } catch (e: any) {
      setToast({ type: 'error', message: e.message || 'Failed to save master resume' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetSeed = async () => {
    if (
      !window.confirm(
        `Reset master resume for "${activeProfile?.name || 'this profile'}" to default Pushpit Virmani seed?`
      )
    ) {
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

  const activeProfile = profiles.find((p) => p.id === activeProfileId);

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
      {/* Multi-Profile Selector Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Active Profile Master Resume
              </span>
              {activeProfile?.isDefault && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-semibold">
                  Default (Pushpit Virmani)
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-white">
              {activeProfile ? activeProfile.name : 'Pushpit Virmani'}
            </h2>
            <p className="text-xs text-slate-400">
              All modifications & rules are strictly isolated to this profile.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowProfileModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all shadow-sm group"
        >
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Switch or Create Profile</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Upload Dropzone Header (Isolated to active profile) */}
      <ResumeUploadDropzone
        profileId={activeProfileId}
        onUploadComplete={(newProfile) => setProfile(newProfile)}
      />

      {/* Floating Save Action Bar */}
      <div className="sticky top-2 z-20 bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-xl p-3.5 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-300 font-medium">
            Editing Profile: <strong className="text-slate-100">{profile.name}</strong>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleResetSeed}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Pushpit Default</span>
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
          {toast.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
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
            <label className="text-[11px] font-semibold text-slate-400">LinkedIn URL</label>
            <input
              type="text"
              value={profile.linkedinUrl || ''}
              onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400">Portfolio / Website</label>
            <input
              type="text"
              value={profile.portfolioUrl || ''}
              onChange={(e) => setProfile({ ...profile, portfolioUrl: e.target.value })}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-400">Professional Summary</label>
          <textarea
            rows={3}
            value={profile.summary}
            onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
            className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
          />
        </div>
      </div>

      {/* Experience Section with Rich Word-Bolding Bullet Editor */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <ExperienceEditor
          experience={profile.experience}
          onChange={(newExp) => setProfile({ ...profile, experience: newExp })}
        />
      </div>

      {/* Skills Section */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">Categorized Skills</h3>
        <div className="space-y-4">
          {profile.skills.map((cat, catIdx) => (
            <div key={catIdx} className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={cat.category}
                  onChange={(e) => {
                    const updated = [...profile.skills];
                    updated[catIdx].category = e.target.value;
                    setProfile({ ...profile, skills: updated });
                  }}
                  className="bg-transparent font-semibold text-xs text-slate-200 border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none px-1 py-0.5"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {cat.skills.map((skill, sIdx) => (
                  <span
                    key={sIdx}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-xs text-slate-300 group"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkillTag(catIdx, sIdx)}
                      className="text-slate-500 group-hover:text-rose-400 transition-colors ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="+ Add skill (Enter)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkillTag(catIdx, e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="px-2 py-1 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 w-32"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Education Section */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">Education</h3>
        <div className="space-y-3">
          {profile.education.map((edu, eIdx) => (
            <div key={edu.id || eIdx} className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400">Institution</label>
                <input
                  type="text"
                  value={edu.institution}
                  onChange={(e) => {
                    const updated = [...profile.education];
                    updated[eIdx].institution = e.target.value;
                    setProfile({ ...profile, education: updated });
                  }}
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400">Degree</label>
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => {
                    const updated = [...profile.education];
                    updated[eIdx].degree = e.target.value;
                    setProfile({ ...profile, education: updated });
                  }}
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400">Field of Study</label>
                <input
                  type="text"
                  value={edu.fieldOfStudy}
                  onChange={(e) => {
                    const updated = [...profile.education];
                    updated[eIdx].fieldOfStudy = e.target.value;
                    setProfile({ ...profile, education: updated });
                  }}
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400">Year / Honors</label>
                <input
                  type="text"
                  value={edu.graduationYear}
                  onChange={(e) => {
                    const updated = [...profile.education];
                    updated[eIdx].graduationYear = e.target.value;
                    setProfile({ ...profile, education: updated });
                  }}
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Management Modal */}
      {showProfileModal && (
        <ProfileModal
          profiles={profiles}
          activeProfileId={activeProfileId}
          onSelectProfile={(id) => setActiveProfileId(id)}
          onProfilesChanged={loadProfiles}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
};
