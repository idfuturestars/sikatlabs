import express from 'express';
import cors from 'cors';

const app = express();

const allowed = [
  'http://localhost:5173',
  'https://<YOUR-VERCEL-PROJECT>.vercel.app'
];

app.use(cors({
  origin: allowed,
  credentials: true
}));

app.get('/api/health', (_, res) => res.json({ ok: true }));

export default app;
