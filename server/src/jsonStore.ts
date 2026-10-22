import fs from 'node:fs/promises';
import path from 'node:path';

export async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

// Write to a temp file in the same directory, then rename, so a crash
// mid-write never leaves a corrupted/partial JSON file behind.
export async function writeJsonFileAtomic(filePath: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${process.pid}.tmp`);
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmpPath, filePath);
}
