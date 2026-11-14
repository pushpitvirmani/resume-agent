import {
  ResumeProfile,
  ResumeGuideline,
  AppSettings,
  JobItem,
  AIStatusResponse
} from '../types';

export const api = {
  // Profiles
  async getProfiles(): Promise<import('../types').ProfileItem[]> {
    const res = await fetch('/api/profiles');
    if (!res.ok) throw new Error('Failed to fetch profiles');
    const data = await res.json();
    return data.profiles;
  },

  async createProfile(name: string, description?: string): Promise<import('../types').ProfileItem> {
    const res = await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create profile');
    }
    const data = await res.json();
    return data.profile;
  },

  async deleteProfile(id: string): Promise<void> {
    const res = await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete profile');
    }
  },

  // Master Resume
  async getResume(profileId?: string): Promise<ResumeProfile> {
    const url = profileId ? `/api/resume?profileId=${profileId}` : '/api/resume';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch master resume');
    const data = await res.json();
    return data.profile;
  },

  async updateResume(profile: ResumeProfile, profileId?: string): Promise<{ profile: ResumeProfile; message: string }> {
    const payload = profileId ? { ...profile, profileId } : profile;
    const res = await fetch('/api/resume', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update resume');
    }
    return res.json();
  },

  async uploadResume(file: File, profileId?: string): Promise<{ profile: ResumeProfile; message: string }> {
    const formData = new FormData();
    formData.append('resume', file);
    const url = profileId ? `/api/resume/upload?profileId=${profileId}` : '/api/resume/upload';
    const res = await fetch(url, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload and parse resume');
    }
    return res.json();
  },

  async resetResumeSeed(): Promise<{ profile: ResumeProfile; message: string }> {
    const res = await fetch('/api/resume/seed', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset resume to default seed');
    return res.json();
  },

  // Settings
  async getSettings(): Promise<AppSettings> {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to fetch settings');
    const data = await res.json();
    return data.settings;
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<{ settings: AppSettings; message: string }> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update settings');
    }
    return res.json();
  },

  // AI Service
  async getAIStatus(): Promise<AIStatusResponse> {
    const res = await fetch('/api/ai/status');
    if (!res.ok) throw new Error('Failed to fetch AI status');
    return res.json();
  },

  async selectAIProvider(provider: string): Promise<{ success: boolean; activeProvider: string }> {
    const res = await fetch('/api/ai/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider })
    });
    if (!res.ok) throw new Error('Failed to switch AI provider');
    return res.json();
  },

  // Guidelines
  async getGuidelines(profileId?: string): Promise<ResumeGuideline[]> {
    const url = profileId ? `/api/guidelines?profileId=${profileId}` : '/api/guidelines';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch guidelines');
    const data = await res.json();
    return data.guidelines;
  },

  async createGuideline(rule: string, category: string = 'general', profileId?: string): Promise<ResumeGuideline> {
    const res = await fetch('/api/guidelines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rule, category, active: true, profileId: profileId || 'default' })
    });
    if (!res.ok) throw new Error('Failed to create guideline');
    const data = await res.json();
    return data.guideline;
  },

  async toggleGuideline(id: string, active: boolean): Promise<ResumeGuideline> {
    const res = await fetch(`/api/guidelines/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active })
    });
    if (!res.ok) throw new Error('Failed to toggle guideline');
    const data = await res.json();
    return data.guideline;
  },

  async deleteGuideline(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/guidelines/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete guideline');
    return res.json();
  },

  // Jobs
  async getJobs(status?: string): Promise<JobItem[]> {
    const url = status ? `/api/jobs?status=${status}` : '/api/jobs';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch jobs');
    const data = await res.json();
    return data.jobs;
  },

  async createJob(job: Partial<JobItem>): Promise<JobItem> {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job)
    });
    if (!res.ok) throw new Error('Failed to create job');
    const data = await res.json();
    return data.job;
  },

  async clearAllJobs(): Promise<{ success: boolean; count: number; message: string }> {
    const res = await fetch('/api/jobs', { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to clear jobs');
    }
    return res.json();
  },

  // Scraper
  async getScraperStatus(): Promise<{ ok: boolean; status: import('../types').ScraperStatus }> {
    const res = await fetch('/api/scraper/status');
    if (!res.ok) throw new Error('Failed to fetch scraper status');
    return res.json();
  },

  async triggerScraper(options?: {
    keywords?: string;
    location?: string;
    maxJobs?: number;
    datePreset?: string;
    dateFrom?: string;
  }): Promise<{ ok: boolean; message: string; status: import('../types').ScraperStatus }> {
    const res = await fetch('/api/scraper/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || {})
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to trigger scraper');
    }
    return res.json();
  },

  // AI Tailoring
  async tailorResume(jobId: string, masterResumeId?: string, model?: string): Promise<{ ok: boolean; tailoredResume: import('../types').TailoredResumeItem }> {
    const res = await fetch('/api/tailor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, masterResumeId, model })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate tailored resume');
    }
    return res.json();
  },

  async getTailoredResume(id: string): Promise<{ ok: boolean; tailoredResume: import('../types').TailoredResumeItem }> {
    const res = await fetch(`/api/tailor/${id}`);
    if (!res.ok) throw new Error('Failed to fetch tailored resume');
    return res.json();
  },

  async getAllTailoredResumes(): Promise<any[]> {
    const res = await fetch('/api/tailor');
    if (!res.ok) return [];
    const data = await res.json();
    return data.tailoredResumes || [];
  },

  async getTailoredResumeByJob(jobId: string): Promise<{ ok: boolean; tailoredResume: import('../types').TailoredResumeItem | null }> {
    const res = await fetch(`/api/tailor/job/${jobId}`);
    if (res.status === 404) return { ok: false, tailoredResume: null };
    if (!res.ok) throw new Error('Failed to fetch tailored resume for job');
    return res.json();
  },

  async updateTailoredResume(id: string, content: import('../types').TailoredContent, atsScore?: number): Promise<{ ok: boolean; tailoredResume: import('../types').TailoredResumeItem }> {
    const res = await fetch(`/api/tailor/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, atsScore })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save tailored resume changes');
    }
    return res.json();
  },

  async refineTailoredResume(
    id: string,
    feedback: string,
    section?: string,
    bulletIndex?: number,
    model?: string
  ): Promise<{
    ok: boolean;
    tailoredResume: import('../types').TailoredResumeItem;
    suggestedGuideline?: import('../types').SuggestedGuideline | null;
  }> {
    const res = await fetch(`/api/tailor/${id}/refine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback, section, bulletIndex, model })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to refine tailored resume');
    }
    return res.json();
  },

  // Export Engine
  async exportDocx(
    payload: { resumeData?: any; jobId?: string; profileId?: string },
    defaultFilename: string = 'Pushpit_Virmani_Resume.docx'
  ): Promise<void> {
    const res = await fetch('/api/export/docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate Word (.docx) document');
    }

    const disposition = res.headers.get('Content-Disposition');
    let filename = defaultFilename;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async exportPdf(
    payload: { resumeData?: any; jobId?: string; profileId?: string },
    defaultFilename: string = 'Pushpit_Virmani_Resume.pdf'
  ): Promise<void> {
    const res = await fetch('/api/export/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate PDF document');
    }

    const disposition = res.headers.get('Content-Disposition');
    let filename = defaultFilename;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async exportBatch(
    jobIds: string[],
    format: 'docx' | 'pdf' = 'docx'
  ): Promise<void> {
    const res = await fetch('/api/export/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobIds, format })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate batch export ZIP');
    }

    const disposition = res.headers.get('Content-Disposition');
    let filename = `Tailored_Resumes_Batch_${Date.now()}.zip`;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};
