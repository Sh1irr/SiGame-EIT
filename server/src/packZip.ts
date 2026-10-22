import AdmZip from 'adm-zip';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { isPackShape, type Pack } from 'shared';
import { packDir, packJsonPath, packMediaDir } from './paths.js';
import { writeJsonFileAtomic } from './jsonStore.js';
import { HttpError } from './httpError.js';

export function buildPackZipBuffer(packId: string, pack: Pack): Buffer {
  const zip = new AdmZip();
  zip.addFile('pack.json', Buffer.from(JSON.stringify(pack, null, 2), 'utf8'));

  const mediaDir = packMediaDir(packId);
  if (fsSync.existsSync(mediaDir)) {
    zip.addLocalFolder(mediaDir, 'media');
  }

  return zip.toBuffer();
}

// Rejects entry names that try to escape the media/ prefix (zip-slip).
function isSafeRelativePath(relativePath: string): boolean {
  if (!relativePath || relativePath.startsWith('/') || relativePath.includes('\\')) return false;
  const normalized = path.posix.normalize(relativePath);
  return normalized !== '..' && !normalized.startsWith('../');
}

export async function importPackFromZipBuffer(buffer: Buffer): Promise<Pack> {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  const packJsonEntry = entries.find((entry) => !entry.isDirectory && entry.entryName === 'pack.json');
  if (!packJsonEntry) {
    throw new HttpError(400, 'У zip-архіві немає pack.json');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(packJsonEntry.getData().toString('utf8'));
  } catch {
    throw new HttpError(400, 'pack.json містить некоректний JSON');
  }
  if (!isPackShape(parsed)) {
    throw new HttpError(400, 'pack.json має неправильну структуру паку');
  }

  const idTaken = fsSync.existsSync(packDir(parsed.id));
  const newId = idTaken ? crypto.randomUUID() : parsed.id;
  const pack: Pack = { ...parsed, id: newId, updatedAt: new Date().toISOString() };

  const mediaDir = packMediaDir(newId);
  await fs.mkdir(mediaDir, { recursive: true });

  for (const entry of entries) {
    if (entry.isDirectory || entry.entryName === 'pack.json' || !entry.entryName.startsWith('media/')) {
      continue;
    }

    const relativeInMedia = entry.entryName.slice('media/'.length);
    if (!isSafeRelativePath(relativeInMedia)) continue;

    const destPath = path.resolve(mediaDir, relativeInMedia);
    if (!destPath.startsWith(mediaDir + path.sep)) continue;

    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.writeFile(destPath, entry.getData());
  }

  await writeJsonFileAtomic(packJsonPath(newId), pack);
  return pack;
}
