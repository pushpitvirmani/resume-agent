import cron from 'node-cron';
import { prisma } from '../db.js';
import { scrapeLinkedInJobs, ScrapeOptions, ScrapeSummary } from './scraper.js';

export interface ScraperState {
  isRunning: boolean;
  progress: string;
  currentCount: number;
  maxJobs: number;
  lastRunAt: string | null;
  lastResult: { scraped: number; inserted: number; updated: number } | null;
  error: string | null;
}

const state: ScraperState = {
  isRunning: false,
  progress: 'Idle',
  currentCount: 0,
  maxJobs: 0,
  lastRunAt: null,
  lastResult: null,
  error: null,
};

let scheduledTask: cron.ScheduledTask | null = null;

export function getScraperStatus(): ScraperState {
  return { ...state };
}

export async function startScrape(customOptions?: Partial<ScrapeOptions>): Promise<{ started: boolean; message: string }> {
  if (state.isRunning) {
    return { started: false, message: 'Scraping is already running.' };
  }

  // Load configured settings from database
  let settings = await prisma.appSettings.findUnique({
    where: { id: 'default' },
  });

  if (!settings) {
    settings = await prisma.appSettings.create({
      data: {
        id: 'default',
        keywords: 'Product Manager',
        location: 'Remote',
        maxScrapeJobs: 25,
        dateFilterPreset: 'past_week',
      },
    });
  }

  const keywords = customOptions?.keywords || settings.keywords || 'Product Manager';
  const location = customOptions?.location || settings.location || 'Remote';
  const maxJobs = customOptions?.maxJobs || settings.maxScrapeJobs || 25;
  const datePreset = customOptions?.datePreset || settings.dateFilterPreset || 'past_week';
  const dateFrom = customOptions?.dateFrom || (settings.scrapeDateFrom ? settings.scrapeDateFrom.toISOString() : undefined);

  state.isRunning = true;
  state.error = null;
  state.currentCount = 0;
  state.maxJobs = maxJobs;
  state.progress = `Starting scrape for "${keywords}" in "${location}" (max: ${maxJobs})...`;

  // Run asynchronously without blocking response
  (async () => {
    try {
      console.log(`[Scheduler] Initiating scrape: "${keywords}" (${location}) max: ${maxJobs}, preset: ${datePreset}`);
      const result: ScrapeSummary = await scrapeLinkedInJobs({
        keywords,
        location,
        maxJobs,
        datePreset,
        dateFrom,
        onProgress: (p) => {
          state.currentCount = p.current;
          state.progress = `Scraped ${p.current} of ${p.total}: ${p.title} at ${p.company}`;
        },
      });

      state.lastResult = {
        scraped: result.scraped,
        inserted: result.inserted,
        updated: result.updated,
      };
      state.progress = `Completed: Scraped ${result.scraped} jobs (${result.inserted} new added to feed).`;
      state.lastRunAt = new Date().toISOString();
      console.log(`[Scheduler] Scrape finished successfully: ${JSON.stringify(state.lastResult)}`);
    } catch (err: any) {
      console.error('[Scheduler] Scrape execution error:', err);
      state.error = err.message || 'Error occurred during scraping';
      state.progress = 'Scraping failed.';
    } finally {
      state.isRunning = false;
    }
  })();

  return { started: true, message: 'Scraping task initiated successfully.' };
}

export async function initScheduler(): Promise<void> {
  try {
    const settings = await prisma.appSettings.findUnique({
      where: { id: 'default' },
    });

    const cronExpr = settings?.dailyScheduleCron || '0 9 * * *';
    reloadSchedule(cronExpr);
  } catch (err) {
    console.warn('[Scheduler] Could not initialize scheduler with DB settings, using default 9am:', err);
    reloadSchedule('0 9 * * *');
  }
}

export function reloadSchedule(cronExpression: string): boolean {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }

  if (!cron.validate(cronExpression)) {
    console.warn(`[Scheduler] Invalid cron expression: "${cronExpression}"`);
    return false;
  }

  scheduledTask = cron.schedule(cronExpression, async () => {
    console.log(`[Scheduler] Cron trigger firing at ${new Date().toISOString()}`);
    await startScrape();
  });

  console.log(`[Scheduler] Background schedule configured with cron: "${cronExpression}"`);
  return true;
}
