// Minimal runtime validation and shared shapes

export function validateChatRequest(body) {
    if (!body || typeof body !== 'object') throw new Error('Invalid body');
    const { message, history = [], context = {} } = body;
    if (!message || typeof message !== 'string') throw new Error('message is required (string)');
  
    if (!Array.isArray(history)) throw new Error('history must be an array');
    for (const m of history) {
      if (!m || typeof m !== 'object') throw new Error('invalid history item');
      if (!['user', 'assistant'].includes(m.role)) throw new Error('history.role must be user|assistant');
      if (typeof m.content !== 'string') throw new Error('history.content must be string');
    }
  
    const ctx = {
      role: ['student', 'professor'].includes(context.role) ? context.role : 'student',
      subject: typeof context.subject === 'string' ? context.subject : 'general studies',
      grade: typeof context.grade === 'string' ? context.grade : 'K-12',
      region: typeof context.region === 'string' ? context.region : 'global',
      language: typeof context.language === 'string' ? context.language : 'English'
    };
  
    return { message, history, context: ctx };
  }
  
  export function chatResponseShape({ id, content, usage }) {
    return {
      id,
      role: 'assistant',
      content: content || '',
      createdAt: new Date().toISOString(),
      usage: usage || null
    };
  }
  