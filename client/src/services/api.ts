import {
  ResumeProfile,
  ResumeGuideline,
  AppSettings,
  JobItem,
  AIStatusResponse
} from '../types';

export const api = {
  // Master Resume
  async getResume(): Promise<ResumeProfile> {
    const res = await fetch('/api/resume');
    if (!res.ok) throw new Error('Failed to fetch master resume');
    const data = await res.json();
    return data.profile;
  },

  async updateResume(profile: ResumeProfile): Promise<{ profile: ResumeProfile; message: string }> {
    const res = await fetch('/api/resume', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update resume');
    }
    return res.json();
  },

  async uploadResume(file: File): Promise<{ profile: ResumeProfile; message: string }> {
    const formData = new FormData();
    formData.append('resume', file);
    const res = await fetch('/api/resume/upload', {
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
  async getGuidelines(): Promise<ResumeGuideline[]> {
    const res = await fetch('/api/guidelines');
    if (!res.ok) throw new Error('Failed to fetch guidelines');
    const data = await res.json();
    return data.guidelines;
  },

  async createGuideline(rule: string, category: string = 'general'): Promise<ResumeGuideline> {
    const res = await fetch('/api/guidelines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rule, category, active: true })
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
  async tailorResume(jobId: string, masterResumeId?: string): Promise<{ ok: boolean; tailoredResume: import('../types').TailoredResumeItem }> {
    const res = await fetch('/api/tailor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, masterResumeId })
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

  async getTailoredResumeByJob(jobId: string): Promise<{ ok: boolean; tailoredResume: import('../types').TailoredResumeItem | null }> {
    const res = await fetch(`/api/tailor/job/${jobId}`);
    if (res.status === 404) return { ok: false, tailoredResume: null };
    if (!res.ok) throw new Error('Failed to fetch tailored resume for job');
    return res.json();
  },

  async updateTailoredResume(id: string, content: import('../types').TailoredContent): Promise<{ ok: boolean; tailoredResume: import('../types').TailoredResumeItem }> {
    const res = await fetch(`/api/tailor/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
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
    bulletIndex?: number
  ): Promise<{
    ok: boolean;
    tailoredResume: import('../types').TailoredResumeItem;
    suggestedGuideline?: import('../types').SuggestedGuideline | null;
  }> {
    const res = await fetch(`/api/tailor/${id}/refine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback, section, bulletIndex })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to refine tailored resume');
    }
    return res.json();
  }
};
