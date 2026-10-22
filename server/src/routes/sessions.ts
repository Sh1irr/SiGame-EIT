import { Router } from 'express';
import fs from 'node:fs/promises';
import { isGameSessionShape, type GameSession } from 'shared';
import { SESSIONS_DIR, sessionJsonPath } from '../paths.js';
import { readJsonFile, writeJsonFileAtomic } from '../jsonStore.js';
import { HttpError } from '../httpError.js';

export const sessionsRouter = Router();

async function listSessionIds(): Promise<string[]> {
  try {
    const entries = await fs.readdir(SESSIONS_DIR, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => entry.name.slice(0, -'.json'.length));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

sessionsRouter.get('/active', async (_req, res) => {
  const ids = await listSessionIds();
  for (const id of ids) {
    const raw = await readJsonFile<unknown>(sessionJsonPath(id));
    if (raw && isGameSessionShape(raw) && raw.status === 'active') {
      res.json(raw);
      return;
    }
  }
  res.status(404).json({ error: 'Активної сесії немає' });
});

sessionsRouter.post('/', async (req, res) => {
  if (!isGameSessionShape(req.body)) {
    throw new HttpError(400, 'Некоректна структура сесії');
  }
  const session: GameSession = { ...req.body };
  await writeJsonFileAtomic(sessionJsonPath(session.id), session);
  res.status(201).json(session);
});

sessionsRouter.put('/:id', async (req, res) => {
  const id = req.params.id;
  if (!isGameSessionShape(req.body)) {
    throw new HttpError(400, 'Некоректна структура сесії');
  }
  const session: GameSession = { ...req.body, id, updatedAt: new Date().toISOString() };
  await writeJsonFileAtomic(sessionJsonPath(id), session);
  res.json(session);
});

sessionsRouter.delete('/:id', async (req, res) => {
  await fs.rm(sessionJsonPath(req.params.id), { force: true });
  res.status(204).end();
});
