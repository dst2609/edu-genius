export const settings = {
    PORT: Number(process.env.PORT || 3001),
    CORS_ORIGINS: process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000',
  
    AI_PROVIDER: (process.env.AI_PROVIDER || 'openai').toLowerCase(),
  
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    OPENAI_TEMPERATURE: Number(process.env.OPENAI_TEMPERATURE || 0.2),
  
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    MONGODB_DB: process.env.MONGODB_DB || 'edugenius',
    MONGODB_COLLECTION: process.env.MONGODB_COLLECTION || 'messages'
  };
  