import { Router } from 'express';
import { checkAIStatus, setActiveProvider, getActiveProvider, generateText, AIProvider } from '../services/ai.js';
import prisma from '../db.js';

const router = Router();

// GET /api/ai/status
router.get('/status', async (req, res) => {
  try {
    const status = await checkAIStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/select
router.post('/select', async (req, res) => {
  try {
    const { provider } = req.body;
    if (!['gemini', 'claude', 'openai'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider. Must be gemini, claude, or openai' });
    }
    setActiveProvider(provider as AIProvider);
    // Persist to appSettings
    await prisma.appSettings.upsert({
      where: { id: 'default' },
      update: { activeAiProvider: provider },
      create: { id: 'default', activeAiProvider: provider }
    });
    res.json({ success: true, activeProvider: provider });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/test
router.post('/test', async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    const output = await generateText(prompt, systemInstruction);
    res.json({ output, activeProvider: getActiveProvider() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
