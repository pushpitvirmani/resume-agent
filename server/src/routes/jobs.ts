import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// GET /api/jobs
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status: String(status) } : {};
    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.json({ jobs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/jobs
router.post('/', async (req, res) => {
  try {
    const { title, company, location, url, description, status, matchScore, keywords, postedDate } = req.body;
    if (!title || !company || !url || !description) {
      return res.status(400).json({ error: 'Title, company, url, and description are required' });
    }

    const job = await prisma.job.upsert({
      where: { url },
      update: {
        title,
        company,
        location: location || '',
        description,
        ...(status && { status }),
        ...(matchScore !== undefined && { matchScore }),
        ...(keywords && { keywords: JSON.stringify(keywords) }),
        ...(postedDate && { postedDate: new Date(postedDate) }),
      },
      create: {
        title,
        company,
        location: location || '',
        url,
        description,
        status: status || 'discovered',
        matchScore: matchScore || null,
        keywords: keywords ? JSON.stringify(keywords) : null,
        postedDate: postedDate ? new Date(postedDate) : null,
      }
    });

    res.status(201).json({ job });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ job });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/jobs/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.job.delete({ where: { id } });
    res.json({ success: true, message: 'Job deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
