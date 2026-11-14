import { Router } from 'express';
import prisma from '../db.js';
import { guidelineSchema } from '../types/resume.js';

const router = Router();

// GET /api/guidelines
router.get('/', async (req, res) => {
  try {
    const profileId = (req.query.profileId as string) || 'default';
    const guidelines = await prisma.resumeGuideline.findMany({
      where: { profileId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ guidelines });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/guidelines
router.post('/', async (req, res) => {
  try {
    const parseResult = guidelineSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten()
      });
    }

    const { rule, category, active } = parseResult.data;
    const profileId = (req.body.profileId as string) || 'default';
    const guideline = await prisma.resumeGuideline.create({
      data: { profileId, rule, category, active }
    });

    res.status(201).json({
      guideline,
      message: 'Guideline saved successfully'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/guidelines/:id
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { active, rule, category } = req.body;

    const updated = await prisma.resumeGuideline.update({
      where: { id },
      data: {
        ...(active !== undefined && { active }),
        ...(rule && { rule }),
        ...(category && { category })
      }
    });

    res.json({ guideline: updated, message: 'Guideline updated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/guidelines/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.resumeGuideline.delete({
      where: { id }
    });
    res.json({ success: true, message: 'Guideline deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
