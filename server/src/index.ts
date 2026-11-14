import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import resumeRouter from './routes/resume.js';
import settingsRouter from './routes/settings.js';
import guidelinesRouter from './routes/guidelines.js';
import jobsRouter from './routes/jobs.js';
import aiRouter from './routes/ai.js';
import scraperRouter from './routes/scraper.js';
import tailorRouter from './routes/tailor.js';
import { initScheduler } from './services/scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/resume', resumeRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/guidelines', guidelinesRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/gemini', aiRouter); // Backward-compatible alias
app.use('/api/scraper', scraperRouter);
app.use('/api/tailor', tailorRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV !== 'test' && !process.argv.includes('--test-run') && !process.env.IN_TEST) {
  initScheduler().catch(console.error);
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

export default app;
