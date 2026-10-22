import { describe, expect, it } from 'vitest';
import { listReferencedMediaFiles } from './media.js';
import type { Pack } from './types.js';

function makePack(overrides: Partial<Pack> = {}): Pack {
  return {
    id: 'p1',
    title: 'Пак',
    subtitle: 'від',
    status: 'draft',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    rounds: [],
    ...overrides,
  };
}

describe('listReferencedMediaFiles', () => {
  it('collects the logo and every media block across content/answer', () => {
    const pack = makePack({
      logo: 'logo.png',
      rounds: [
        {
          id: 'r1',
          prices: [100, 200, 300, 400, 500],
          categories: [
            {
              id: 'c1',
              name: 'Категорія',
              slots: [
                {
                  id: 'q1',
                  content: [{ id: 'b1', type: 'image', file: 'pic.png' }],
                  options: [],
                  answer: [{ id: 'b2', type: 'audio', file: 'clip.mp3' }],
                },
                null,
                null,
                null,
                null,
              ],
            },
          ],
        },
      ],
    });

    expect(listReferencedMediaFiles(pack)).toEqual(new Set(['logo.png', 'pic.png', 'clip.mp3']));
  });

  it('ignores text blocks and empty slots', () => {
    const pack = makePack();
    expect(listReferencedMediaFiles(pack)).toEqual(new Set());
  });
});
