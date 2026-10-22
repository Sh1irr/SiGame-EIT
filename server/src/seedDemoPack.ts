import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { packDir } from './paths.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO_PACK_SOURCE = path.resolve(__dirname, '../assets/demo-pack');
const DEMO_PACK_ID = 'demo';

// Ships a ready-to-play demo pack so a fresh `npm install && npm start`
// has something to click through immediately, without a trip to the admin.
export async function seedDemoPackIfMissing(): Promise<void> {
  if (fsSync.existsSync(packDir(DEMO_PACK_ID))) return;
  await fs.cp(DEMO_PACK_SOURCE, packDir(DEMO_PACK_ID), { recursive: true });
  console.log('Seeded demo pack into data/packs/demo');
}
