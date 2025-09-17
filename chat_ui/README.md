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
