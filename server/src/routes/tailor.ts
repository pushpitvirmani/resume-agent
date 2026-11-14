import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db.js';
import {
  generateTailoredResume,
  refineTailoredResume,
  getTailoredResumeById,
  getTailoredResumeByJobId,
  updateTailoredResumeContent,
} from '../services/tailor.js';

const router = Router();

const GenerateTailorSchema = z.object({
  jobId: z.string().min(1, 'jobId is required'),
  masterResumeId: z.string().optional(),
  model: z.string().optional(),
});

const RefineTailorSchema = z.object({
  feedback: z.string().min(2, 'Feedback must be at least 2 characters'),
  section: z.string().optional(),
  bulletIndex: z.number().int().optional(),
  model: z.string().optional(),
});

// POST /api/tailor - Generate tailored resume
router.post('/', async (req, res) => {
  try {
    const parse = GenerateTailorSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ ok: false, error: 'Invalid input', details: parse.error.errors });
    }

    const tailoredResume = await generateTailoredResume(parse.data);
    res.status(201).json({ ok: true, tailoredResume });
  } catch (error: any) {
    console.error('[API Tailor] Generation error:', error);
    res.status(500).json({ ok: false, error: error.message || 'Failed to tailor resume' });
  }
});

// GET /api/tailor - Get all tailored resumes
router.get('/', async (req, res) => {
  try {
    const resumes = await prisma.tailoredResume.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    const jobIds = resumes.map(r => r.jobId);
    const jobs = await prisma.job.findMany({
      where: { id: { in: jobIds } },
      select: { id: true, title: true, company: true, location: true }
    });
    const jobMap = new Map(jobs.map(j => [j.id, j]));
    const result = resumes.map(r => ({
      ...r,
      job: jobMap.get(r.jobId) || null
    }));
    res.json({ ok: true, tailoredResumes: result });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message || 'Failed to list tailored resumes' });
  }
});

// GET /api/tailor/job/:jobId - Get tailored resume for a specific job
router.get('/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const tailoredResume = await getTailoredResumeByJobId(jobId);
    if (!tailoredResume) {
      return res.status(404).json({ ok: false, error: 'No tailored resume found for this job' });
    }
    res.json({ ok: true, tailoredResume });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message || 'Failed to fetch tailored resume' });
  }
});

// GET /api/tailor/:id - Get tailored resume by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tailoredResume = await getTailoredResumeById(id);
    if (!tailoredResume) {
      return res.status(404).json({ ok: false, error: 'Tailored resume not found' });
    }
    res.json({ ok: true, tailoredResume });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message || 'Failed to fetch tailored resume' });
  }
});

// PUT /api/tailor/:id - Save direct in-place edits
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, atsScore } = req.body;
    if (!content) {
      return res.status(400).json({ ok: false, error: 'content is required' });
    }

    const updated = await updateTailoredResumeContent(id, content, atsScore);
    res.json({ ok: true, tailoredResume: updated });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message || 'Failed to update tailored resume' });
  }
});

// POST /api/tailor/:id/refine - Submit conversational revision feedback
router.post('/:id/refine', async (req, res) => {
  try {
    const { id } = req.params;
    const parse = RefineTailorSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ ok: false, error: 'Invalid feedback data', details: parse.error.errors });
    }

    const result = await refineTailoredResume({
      tailoredResumeId: id,
      feedback: parse.data.feedback,
      section: parse.data.section,
      bulletIndex: parse.data.bulletIndex,
      model: parse.data.model,
    });

    res.json({
      ok: true,
      tailoredResume: result.tailoredResume,
      suggestedGuideline: result.suggestedGuideline,
    });
  } catch (error: any) {
    console.error('[API Tailor] Refinement error:', error);
    res.status(500).json({ ok: false, error: error.message || 'Failed to refine tailored resume' });
  }
});

export default router;
