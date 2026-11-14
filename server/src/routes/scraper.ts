import { Router } from 'express';
import { z } from 'zod';
import { getScraperStatus, startScrape, reloadSchedule } from '../services/scheduler.js';

const router = Router();

const TriggerScrapeSchema = z.object({
  keywords: z.string().optional(),
  location: z.string().optional(),
  maxJobs: z.number().int().min(1).max(100).optional(),
  datePreset: z.enum(['past_24h', 'past_week', 'past_month', 'custom']).optional(),
  dateFrom: z.string().optional(),
});

// GET /api/scraper/status
router.get('/status', (req, res) => {
  const status = getScraperStatus();
  res.json({ ok: true, status });
});

// POST /api/scraper/trigger
router.post('/trigger', async (req, res) => {
  try {
    const parseResult = TriggerScrapeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid scraping options',
        details: parseResult.error.errors,
      });
    }

    const result = await startScrape(parseResult.data);
    res.json({
      ok: result.started,
      message: result.message,
      status: getScraperStatus(),
    });
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      error: error.message || 'Failed to trigger scraper',
    });
  }
});

// POST /api/scraper/schedule
router.post('/schedule', (req, res) => {
  const { cronExpression } = req.body;
  if (!cronExpression || typeof cronExpression !== 'string') {
    return res.status(400).json({ ok: false, error: 'Valid cronExpression string required' });
  }

  const success = reloadSchedule(cronExpression);
  if (!success) {
    return res.status(400).json({ ok: false, error: 'Invalid cron expression format' });
  }

  res.json({ ok: true, message: `Schedule updated to ${cronExpression}` });
});

export default router;
