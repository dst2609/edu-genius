# EduGenius UI Refactor (from Travel Agent)

This refactor removes travel-specific prompts and introduces a provider-agnostic AI layer.

## How it works
- **Provider switch**:  
  - `VITE_USE_API_SERVER=true` → UI calls your API server.  
  - `VITE_USE_API_SERVER=false` → UI calls OpenAI directly (dev only).

- **System prompt**: Built in `src/lib/ai/client.js` based on subject, grade, region, language, and role.

- **Role**: For now taken from `localStorage.role` (student/professor). Your auth will set it later.

## Setup
```bash
cd frontend
cp .env.example .env
npm install
npm run dev

## frontend/.env content
# === EduGenius UI Config ===
VITE_APP_NAME=EduGenius

# Set true once your API server exists
VITE_USE_API_SERVER=false
VITE_API_SERVER_BASE=http://localhost:3001
VITE_API_SERVER_CHAT_PATH=/chat

# Direct OpenAI (DEV ONLY). Do not use in production
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
VITE_OPENAI_MODEL=gpt-4
VITE_OPENAI_API_KEY=[add your own key here]
