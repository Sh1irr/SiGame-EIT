import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DATA_DIR = path.resolve(__dirname, '../../data');
export const PACKS_DIR = path.join(DATA_DIR, 'packs');
export const SESSIONS_DIR = path.join(DATA_DIR, 'sessions');

export function packDir(packId: string): string {
  return path.join(PACKS_DIR, packId);
}

export function packJsonPath(packId: string): string {
  return path.join(packDir(packId), 'pack.json');
}

export function packMediaDir(packId: string): string {
  return path.join(packDir(packId), 'media');
}

export function sessionJsonPath(sessionId: string): string {
  return path.join(SESSIONS_DIR, `${sessionId}.json`);
}
