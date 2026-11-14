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
        model: 'gemini-3.1-flash-lite',
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
  providerOverride?: AIProvider,
  options?: { jsonMode?: boolean; model?: string }
): Promise<string> {
  const provider = providerOverride || activeProvider;

  if (provider === 'gemini') {
    const key = process.env.GEMINI_API_KEY?.trim();
    if (!key) throw new Error('GEMINI_API_KEY is not configured');

    const tryGenerate = async (modelName: string): Promise<string> => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`;
      const payload: any = {
        contents: [{ parts: [{ text: prompt }] }],
      };
      if (systemInstruction) {
        payload.systemInstruction = { parts: [{ text: systemInstruction }] };
      }
      if (options?.jsonMode) {
        payload.generationConfig = { responseMimeType: 'application/json' };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error((errorData as any)?.error?.message || `Gemini API returned ${res.status}`);
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response from Gemini API');
      return text;
    };

    const targetModel = options?.model || 'gemini-3.1-flash-lite';
    try {
      return await tryGenerate(targetModel);
    } catch (err: any) {
      if (targetModel !== 'gemini-3.1-flash-lite') {
        console.warn(`[AI Service] ${targetModel} error (${err.message}), trying gemini-3.1-flash-lite fallback...`);
        return await tryGenerate('gemini-3.1-flash-lite');
      }
      console.warn(`[AI Service] gemini-3.1-flash-lite error (${err.message}), trying gemini-2.5-flash fallback...`);
      return await tryGenerate('gemini-2.5-flash');
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
      response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
      messages: [
        ...(systemInstruction ? [{ role: 'system' as const, content: systemInstruction }] : []),
        { role: 'user' as const, content: prompt }
      ]
    });
    return response.choices[0]?.message?.content || '';
  }

  throw new Error(`Unsupported AI provider: ${provider}`);
}
