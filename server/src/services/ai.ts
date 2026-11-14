import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export type AIProvider = 'gemini' | 'claude' | 'openai';

let activeProvider: AIProvider = 'gemini';

export function setActiveProvider(provider: AIProvider) {
  activeProvider = provider;
}

export function getActiveProvider(): AIProvider {
  return activeProvider;
}

export interface ProviderStatus {
  configured: boolean;
  model: string;
  connected: boolean;
  message: string;
  latencyMs?: number;
}

export interface AIStatusReport {
  activeProvider: AIProvider;
  providers: Record<AIProvider, ProviderStatus>;
}

export async function checkAIStatus(): Promise<AIStatusReport> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim() || '';
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim() || '';
  const openaiKey = process.env.OPENAI_API_KEY?.trim() || '';

  const report: AIStatusReport = {
    activeProvider,
    providers: {
      gemini: {
        configured: Boolean(geminiKey),
        model: 'gemini-flash-latest',
        connected: false,
        message: geminiKey ? 'API Key configured' : 'GEMINI_API_KEY not configured in .env'
      },
      claude: {
        configured: Boolean(anthropicKey),
        model: 'claude-3-5-sonnet-20241022',
        connected: false,
        message: anthropicKey ? 'Configured' : 'ANTHROPIC_API_KEY not configured'
      },
      openai: {
        configured: Boolean(openaiKey),
        model: 'gpt-4o',
        connected: false,
        message: openaiKey ? 'Configured' : 'OPENAI_API_KEY not configured'
      }
    }
  };

  // Fast verify Gemini credentials via lightweight models endpoint with 4s timeout
  if (geminiKey) {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`, {
        signal: controller.signal
      });
      clearTimeout(timer);

      if (res.ok) {
        report.providers.gemini.connected = true;
        report.providers.gemini.latencyMs = Date.now() - start;
        report.providers.gemini.message = 'Connected to Gemini API (Authentication Verified)';
      } else {
        const errorData = await res.json().catch(() => ({}));
        report.providers.gemini.connected = false;
        report.providers.gemini.message = (errorData as any)?.error?.message || `HTTP ${res.status}`;
      }
    } catch (err: any) {
      report.providers.gemini.connected = false;
      report.providers.gemini.message = err.name === 'AbortError' ? 'Connection check timed out' : err.message;
    }
  }

  return report;
}

export async function generateText(
  prompt: string,
  systemInstruction?: string,
  providerOverride?: AIProvider
): Promise<string> {
  const provider = providerOverride || activeProvider;

  if (provider === 'gemini') {
    const key = process.env.GEMINI_API_KEY?.trim();
    if (!key) throw new Error('GEMINI_API_KEY is not configured');
    const genAI = new GoogleGenerativeAI(key);
    // Use gemini-flash-latest with fallback
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-flash-latest',
        systemInstruction: systemInstruction ? { role: 'system', parts: [{ text: systemInstruction }] } : undefined
      });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err: any) {
      const model = genAI.getGenerativeModel({
        model: 'gemini-3.8-flash',
        systemInstruction: systemInstruction ? { role: 'system', parts: [{ text: systemInstruction }] } : undefined
      });
      const result = await model.generateContent(prompt);
      return result.response.text();
    }
  }

  if (provider === 'claude') {
    const key = process.env.ANTHROPIC_API_KEY?.trim();
    if (!key) throw new Error('ANTHROPIC_API_KEY is not configured');
    const anthropic = new Anthropic({ apiKey: key });
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      system: systemInstruction,
      messages: [{ role: 'user', content: prompt }]
    });
    return response.content
      .filter((block) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n');
  }

  if (provider === 'openai') {
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) throw new Error('OPENAI_API_KEY is not configured');
    const openai = new OpenAI({ apiKey: key });
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        ...(systemInstruction ? [{ role: 'system' as const, content: systemInstruction }] : []),
        { role: 'user' as const, content: prompt }
      ]
    });
    return response.choices[0]?.message?.content || '';
  }

  throw new Error(`Unsupported AI provider: ${provider}`);
}
