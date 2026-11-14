import { Router } from 'express';
import prisma from '../db.js';
import { settingsSchema } from '../types/resume.js';

const router = Router();

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    let settings = await prisma.appSettings.findFirst({
      where: { id: 'default' }
    });

    if (!settings) {
      settings = await prisma.appSettings.create({
        data: {
          id: 'default',
          activeAiProvider: 'gemini',
          dailyScheduleCron: '0 9 * * *',
          maxScrapeJobs: 25,
          dateFilterPreset: 'past_week',
          keywords: 'Product Manager',
          location: 'Remote',
          headless: true
        }
      });
    }

    res.json({ settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings
router.put('/', async (req, res) => {
  try {
    const parseResult = settingsSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten()
      });
    }

    const data = parseResult.data;
    const updated = await prisma.appSettings.upsert({
      where: { id: 'default' },
      update: {
        ...(data.activeAiProvider && { activeAiProvider: data.activeAiProvider }),
        ...(data.dailyScheduleCron && { dailyScheduleCron: data.dailyScheduleCron }),
        ...(data.maxScrapeJobs !== undefined && { maxScrapeJobs: data.maxScrapeJobs }),
        ...(data.scrapeDateFrom !== undefined && {
          scrapeDateFrom: data.scrapeDateFrom ? new Date(data.scrapeDateFrom) : null
        }),
        ...(data.dateFilterPreset && { dateFilterPreset: data.dateFilterPreset }),
        ...(data.keywords && { keywords: data.keywords }),
        ...(data.location && { location: data.location }),
        ...(data.headless !== undefined && { headless: data.headless }),
      },
      create: {
        id: 'default',
        activeAiProvider: data.activeAiProvider || 'gemini',
        dailyScheduleCron: data.dailyScheduleCron || '0 9 * * *',
        maxScrapeJobs: data.maxScrapeJobs !== undefined ? data.maxScrapeJobs : 25,
        scrapeDateFrom: data.scrapeDateFrom ? new Date(data.scrapeDateFrom) : null,
        dateFilterPreset: data.dateFilterPreset || 'past_week',
        keywords: data.keywords || 'Product Manager',
        location: data.location || 'Remote',
        headless: data.headless !== undefined ? data.headless : true
      }
    });

    res.json({
      settings: updated,
      message: 'Settings saved successfully'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
