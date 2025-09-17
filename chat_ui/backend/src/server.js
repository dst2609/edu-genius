import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { settings } from './config.js';
import chatRouter from './routes/chat.js';

const app = express();

// CORS
const origins = (settings.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: origins.length ? origins : true,
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

app.get('/healthz', (req, res) => {
  res.json({ ok: true, provider: settings.AI_PROVIDER });
});

app.use('/', chatRouter);

const port = settings.PORT || 3001;
app.listen(port, () => {
  console.log(`EduGenius API listening on http://localhost:${port}`);
});
