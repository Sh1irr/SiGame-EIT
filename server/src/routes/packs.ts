import { Router } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { isPackShape, validatePack, type Pack, type ValidationError } from 'shared';
import { PACKS_DIR, packDir, packJsonPath, packMediaDir } from '../paths.js';
import { readJsonFile, writeJsonFileAtomic } from '../jsonStore.js';
import { HttpError } from '../httpError.js';
import { cleanupOrphanedMedia } from '../mediaCleanup.js';
import { ALLOWED_MEDIA_EXTENSIONS, MAX_UPLOAD_BYTES, isAllowedMediaFile } from '../mediaRules.js';
import { buildPackZipBuffer, importPackFromZipBuffer } from '../packZip.js';
import { paramAsString } from '../routeParams.js';

export const packsRouter = Router();

async function listPackIds(): Promise<string[]> {
  try {
    const entries = await fs.readdir(PACKS_DIR, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

async function loadPack(id: string): Promise<Pack> {
  const pack = await readJsonFile<Pack>(packJsonPath(id));
  if (!pack) throw new HttpError(404, 'Пак не знайдено');
  return pack;
}

function mediaExistsChecker(packId: string) {
  return (file: string) => fsSync.existsSync(path.join(packMediaDir(packId), file));
}

packsRouter.get('/', async (_req, res) => {
  const ids = await listPackIds();
  const packs = await Promise.all(ids.map((id) => readJsonFile<Pack>(packJsonPath(id))));
  const summaries = packs
    .filter((pack): pack is Pack => pack !== null)
    .map((pack) => ({
      id: pack.id,
      title: pack.title,
      status: pack.status,
      roundsCount: pack.rounds.length,
      updatedAt: pack.updatedAt,
    }));
  res.json(summaries);
});

packsRouter.get('/:id', async (req, res) => {
  res.json(await loadPack(req.params.id));
});

packsRouter.post('/', async (_req, res) => {
  const now = new Date().toISOString();
  const pack: Pack = {
    id: crypto.randomUUID(),
    title: 'Новий пак',
    subtitle: 'від',
    status: 'draft',
    rounds: [],
    createdAt: now,
    updatedAt: now,
  };
  await writeJsonFileAtomic(packJsonPath(pack.id), pack);
  res.status(201).json(pack);
});

packsRouter.put('/:id', async (req, res) => {
  const id = req.params.id;
  const existing = await loadPack(id);

  if (!isPackShape(req.body)) {
    throw new HttpError(400, 'Некоректна структура паку');
  }
  const incoming = req.body;

  let pack: Pack = {
    ...incoming,
    id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  let validationErrors: ValidationError[] = [];
  if (pack.status === 'ready') {
    validationErrors = validatePack(pack, { mediaFileExists: mediaExistsChecker(id) });
    if (validationErrors.length > 0) {
      pack = { ...pack, status: 'draft' };
    }
  }

  await writeJsonFileAtomic(packJsonPath(id), pack);
  await cleanupOrphanedMedia(id, pack);

  res.json(validationErrors.length > 0 ? { pack, validationErrors } : { pack });
});

packsRouter.delete('/:id', async (req, res) => {
  await loadPack(req.params.id);
  await fs.rm(packDir(req.params.id), { recursive: true, force: true });
  res.status(204).end();
});

packsRouter.post('/:id/duplicate', async (req, res) => {
  const source = await loadPack(req.params.id);
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();
  const duplicated: Pack = { ...source, id: newId, title: `${source.title} (копія)`, createdAt: now, updatedAt: now };

  await fs.mkdir(packDir(newId), { recursive: true });
  const sourceMediaDir = packMediaDir(req.params.id);
  if (fsSync.existsSync(sourceMediaDir)) {
    await fs.cp(sourceMediaDir, packMediaDir(newId), { recursive: true });
  }
  await writeJsonFileAtomic(packJsonPath(newId), duplicated);

  res.status(201).json(duplicated);
});

packsRouter.get('/:id/export', async (req, res) => {
  const pack = await loadPack(req.params.id);
  const buffer = buildPackZipBuffer(pack.id, pack);
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${pack.id}.zip"`);
  res.send(buffer);
});

const importUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES } });

packsRouter.post('/import', importUpload.single('file'), async (req, res) => {
  if (!req.file) {
    throw new HttpError(400, 'Zip-файл не надано');
  }
  const pack = await importPackFromZipBuffer(req.file.buffer);
  res.status(201).json(pack);
});

const mediaUpload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const dir = packMediaDir(paramAsString(req.params.id));
      fs.mkdir(dir, { recursive: true })
        .then(() => cb(null, dir))
        .catch((error: unknown) => cb(error as Error, dir));
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).slice(1).toLowerCase();
      cb(null, `${crypto.randomUUID()}.${ext}`);
    },
  }),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).slice(1).toLowerCase();
    if (!(ext in ALLOWED_MEDIA_EXTENSIONS)) {
      cb(new HttpError(400, `Непідтримуване розширення файлу: .${ext}`));
      return;
    }
    if (!isAllowedMediaFile(ext, file.mimetype)) {
      cb(new HttpError(400, `MIME-тип "${file.mimetype}" не відповідає розширенню .${ext}`));
      return;
    }
    cb(null, true);
  },
});

packsRouter.post('/:id/media', async (req, res, next) => {
  if (!fsSync.existsSync(packDir(req.params.id))) {
    next(new HttpError(404, 'Пак не знайдено'));
    return;
  }

  mediaUpload.single('file')(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      next(new HttpError(413, 'Файл перевищує ліміт 500 МБ'));
      return;
    }
    if (error) {
      next(error);
      return;
    }
    if (!req.file) {
      next(new HttpError(400, 'Файл не надано'));
      return;
    }
    res.status(201).json({ file: req.file.filename });
  });
});
