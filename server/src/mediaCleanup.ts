import fs from 'node:fs/promises';
import path from 'node:path';
import { listReferencedMediaFiles, type Pack } from 'shared';
import { packMediaDir } from './paths.js';

export async function cleanupOrphanedMedia(packId: string, pack: Pack): Promise<void> {
  const referenced = listReferencedMediaFiles(pack);
  const mediaDir = packMediaDir(packId);

  let entries: string[];
  try {
    entries = await fs.readdir(mediaDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw error;
  }

  await Promise.all(
    entries
      .filter((name) => !referenced.has(name))
      .map((name) => fs.rm(path.join(mediaDir, name), { force: true })),
  );
}
