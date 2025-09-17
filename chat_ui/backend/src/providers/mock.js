import { BaseProvider } from './base.js';

export class MockProvider extends BaseProvider {
  async chat(message, history, context) {
    const { subject = 'general studies', grade = 'K-12', region = 'global', language = 'English' } = context || {};
    const content = `(MOCK) ${subject} [${grade}, ${region}, ${language}] — You asked: "${message}". Here's a concise explanation and a quick practice question: ...`;
    return {
      id: crypto.randomUUID?.() || `${Date.now()}`,
      content,
      usage: { mock: true }
    };
    }
}
