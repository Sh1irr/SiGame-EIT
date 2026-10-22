import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import express, { type ErrorRequestHandler } from 'express';
import { packsRouter } from './routes/packs.js';
import { sessionsRouter } from './routes/sessions.js';
import { mediaServeHandler } from './mediaServe.js';
import { HttpError } from './httpError.js';
import { seedDemoPackIfMissing } from './seedDemoPack.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, '../../client/dist');
const clientIndexHtml = path.join(clientDist, 'index.html');

const app = express();

const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT ?? 3000);

app.use(express.json({ limit: '10mb' }));

app.use('/api/packs', packsRouter);
app.use('/api/sessions', sessionsRouter);
app.get('/media/:packId/{*splat}', mediaServeHandler);

if (fs.existsSync(clientIndexHtml)) {
  app.use(express.static(clientDist));

  // Express 5 (path-to-regexp v8) requires named wildcards; "{}" makes it match "/" too.
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(clientIndexHtml);
  });
} else {
  app.get('/{*splat}', (_req, res) => {
    res
      .status(503)
      .send('Клієнт ще не зібраний. Запусти "npm run build" або "npm run dev".');
  });
}

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Внутрішня помилка сервера' });
};
app.use(errorHandler);

await seedDemoPackIfMissing();

app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
