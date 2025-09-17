import { BaseProvider } from './base.js';
import { settings } from '../config.js';
import { buildSystemPrompt } from '../utils/buildSystemPrompt.js';

export class OpenAIProvider extends BaseProvider {
  async chat(message, history, context) {
    if (!settings.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY missing');
    }

    const sys = buildSystemPrompt(context);
    const messages = [
      { role: 'system', content: sys },
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    const res = await fetch(`${settings.OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: settings.OPENAI_MODEL,
        messages,
        temperature: settings.OPENAI_TEMPERATURE
      })
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`OpenAI error ${res.status}: ${txt}`);
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? '';
    return {
      id: crypto.randomUUID?.() || `${Date.now()}`,
      content,
      usage: data?.usage || null
    };
  }
}
