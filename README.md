# EduGenius

EduGenius is a full-stack learning assistant that blends chat-driven help with course management, analytics, and user progress tracking. The stack is MERN + Prisma (MongoDB), Vite/React on the frontend, and an Express API backend.

## Features
- Authenticated chat with course-linked conversations, titles, and transcript export (CSV).
- Courses: create, edit, delete, link chats, and set progress percentages.
- Analytics: conversation activity trend, per-course metadata, and course chips in chat history.
- Progress: profile page shows course completion, weekly message velocity, streaks, and user-set goals.
- Resources: announcements and materials (upload/URL) with instructor/student views.
- Responsive UI: dashboard/profile/chat tuned for desktop and mobile.

## Repository layout
- `edu-genius-api/` – Express/Prisma API, MongoDB backend.
- `edu-genius-ui/` – Vite + React frontend.

## Prerequisites
- Node.js 18+
- MongoDB (connection string via `DATABASE_URL`)
- (Optional) OpenAI or Ollama endpoints if switching chat provider.

## Quick start
```bash
git clone git@github.com:dst2609/edu-genius.git
cd edu-genius
```

### Backend
```bash
cd edu-genius-api
npm install
npm start   # starts API (default port 3000)
```

### Frontend
In a new terminal:
```bash
cd edu-genius-ui
npm install
npm run dev   # http://localhost:5173
```

## Environment
- Backend: copy `.env.example` (if present) and set `DATABASE_URL`, `PORT`, `OPENAI_API_KEY` (if using OpenAI), and chat provider settings.
- Frontend: set `VITE_API_BASE_URL` (e.g., `http://localhost:3000`) in `edu-genius-ui/.env`.

## Contact
For `.env` keys or access questions, contact Devarsh Thaker – devarsht@gmail.com.
