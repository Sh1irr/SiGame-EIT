import type { MediaBlock, Pack } from './types.js';

function collectBlockFiles(blocks: MediaBlock[], files: Set<string>): void {
  for (const block of blocks) {
    if (block.type !== 'text') {
      files.add(block.file);
    }
  }
}

// Every media file path a pack currently points to (logo + question content/answer blocks).
// Used to find and delete files on disk that are no longer referenced after an edit.
export function listReferencedMediaFiles(pack: Pack): Set<string> {
  const files = new Set<string>();

  if (pack.logo) {
    files.add(pack.logo);
  }

  for (const round of pack.rounds) {
    for (const category of round.categories) {
      for (const slot of category.slots) {
        if (slot === null) continue;
        collectBlockFiles(slot.content, files);
        collectBlockFiles(slot.answer, files);
      }
    }
  }

  return files;
}
