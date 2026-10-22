import { describe, expect, it } from 'vitest';
import { isPackShape } from './packShape.js';

const validPack = {
  id: 'p1',
  title: 'Пак',
  subtitle: 'від',
  status: 'draft',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  rounds: [
    {
      id: 'r1',
      prices: [100, 200, 300, 400, 500],
      categories: [{ id: 'c1', name: 'Категорія', slots: [null, null, null, null, null] }],
    },
  ],
};

describe('isPackShape', () => {
  it('accepts a well-formed pack', () => {
    expect(isPackShape(validPack)).toBe(true);
  });

  it('rejects non-objects and null', () => {
    expect(isPackShape(null)).toBe(false);
    expect(isPackShape('pack')).toBe(false);
    expect(isPackShape([])).toBe(false);
  });

  it('rejects a pack missing required fields', () => {
    expect(isPackShape({ ...validPack, title: undefined })).toBe(false);
  });

  it('rejects a round with a malformed category', () => {
    const broken = {
      ...validPack,
      rounds: [{ ...validPack.rounds[0], categories: [{ id: 'c1' }] }],
    };
    expect(isPackShape(broken)).toBe(false);
  });
});
