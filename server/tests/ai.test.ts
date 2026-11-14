import { checkAIStatus } from '../src/services/ai.js';

async function run() {
  console.log('Testing checkAIStatus()...');
  const status = await checkAIStatus();
  console.log('Active provider:', status.activeProvider);
  console.log('Gemini configured:', status.providers.gemini.configured);
  console.log('Gemini connected:', status.providers.gemini.connected);
  console.log('Gemini model:', status.providers.gemini.model);
  console.log('Gemini message:', status.providers.gemini.message);
  if (status.providers.gemini.latencyMs) {
    console.log('Gemini latency:', status.providers.gemini.latencyMs, 'ms');
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
