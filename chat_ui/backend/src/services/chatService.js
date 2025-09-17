import { settings } from '../config.js';
import { OpenAIProvider } from '../providers/openai.js';
import { MockProvider } from '../providers/mock.js';
import { getCollection } from '../db/mongo.js';

function getProvider() {
  return settings.AI_PROVIDER === 'openai' ? new OpenAIProvider() : new MockProvider();
}

export async function handleChat({ message, history, context }) {
  const provider = getProvider();

  const result = await provider.chat(message, history, context);
  const doc = {
    createdAt: new Date(),
    provider: settings.AI_PROVIDER,
    request: { message, history, context },
    response: result
  };

  try {
    const col = await getCollection();
    await col.insertOne(doc);
  } catch {
    // If Mongo isn't ready, don't fail the request
  }

  return result;
}
