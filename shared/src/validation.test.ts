import { describe, expect, it } from 'vitest';
import { canMarkPackReady, validatePack } from './validation.js';
import type { Pack, Question } from './types.js';

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q1',
    content: [{ id: 'q1-c1', type: 'text', text: 'Питання' }],
    options: [],
    answer: [{ id: 'q1-a1', type: 'text', text: 'Відповідь' }],
    ...overrides,
  };
}

function makeValidPack(): Pack {
  return {
    id: 'pack1',
    title: 'Демо-пак',
    subtitle: 'від',
    status: 'draft',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    rounds: [
      {
        id: 'r1',
        name: 'Раунд 1',
        prices: [100, 200, 300, 400, 500],
        categories: [
          {
            id: 'c1',
            name: 'Категорія 1',
            slots: [makeQuestion({ id: 'q1' }), null, null, null, null],
          },
        ],
      },
    ],
  };
}

describe('validatePack: positive cases', () => {
  it('returns no errors for a well-formed pack', () => {
    expect(validatePack(makeValidPack())).toEqual([]);
  });

  it('allows a pack to be marked ready when there are no errors', () => {
    expect(canMarkPackReady(makeValidPack())).toBe(true);
  });

  it('accepts a question with 2-4 answer options and a marked correct one', () => {
    const pack = makeValidPack();
    pack.rounds[0].categories[0].slots[0] = makeQuestion({
      options: [
        { id: 'a', label: 'A', text: 'Варіант A' },
        { id: 'b', label: 'B', text: 'Варіант B' },
      ],
      correctOptionId: 'a',
    });

    expect(validatePack(pack)).toEqual([]);
  });
});

describe('validatePack: negative cases', () => {
  it('flags a missing title', () => {
    const pack = makeValidPack();
    pack.title = '  ';

    const errors = validatePack(pack);
    expect(errors.some((e) => e.message.includes('назву'))).toBe(true);
  });

  it('flags a pack with no rounds', () => {
    const pack = makeValidPack();
    pack.rounds = [];

    const errors = validatePack(pack);
    expect(errors.some((e) => e.message.includes('раунд'))).toBe(true);
  });

  it('flags a round with too many categories', () => {
    const pack = makeValidPack();
    const category = pack.rounds[0].categories[0];
    pack.rounds[0].categories = Array.from({ length: 6 }, (_, i) => ({
      ...category,
      id: `c${i}`,
    }));

    const errors = validatePack(pack);
    expect(errors.some((e) => e.roundIndex === 0 && e.message.includes('категорій'))).toBe(true);
  });

  it('flags a category with an empty name', () => {
    const pack = makeValidPack();
    pack.rounds[0].categories[0].name = '';

    const errors = validatePack(pack);
    expect(errors.some((e) => e.categoryIndex === 0 && e.message.includes('Назва категорії'))).toBe(true);
  });

  it('flags a category with no questions', () => {
    const pack = makeValidPack();
    pack.rounds[0].categories[0].slots = [null, null, null, null, null];

    const errors = validatePack(pack);
    expect(errors.some((e) => e.message.includes('хоча б одне питання'))).toBe(true);
  });

  it('flags a question with no content blocks', () => {
    const pack = makeValidPack();
    pack.rounds[0].categories[0].slots[0] = makeQuestion({ content: [] });

    const errors = validatePack(pack);
    expect(errors.some((e) => e.slotIndex === 0 && e.message.includes('контенту'))).toBe(true);
  });

  it('flags a question with no answer blocks', () => {
    const pack = makeValidPack();
    pack.rounds[0].categories[0].slots[0] = makeQuestion({ answer: [] });

    const errors = validatePack(pack);
    expect(errors.some((e) => e.slotIndex === 0 && e.message.includes('відповіді'))).toBe(true);
  });

  it('flags exactly one answer option as invalid', () => {
    const pack = makeValidPack();
    pack.rounds[0].categories[0].slots[0] = makeQuestion({
      options: [{ id: 'a', label: 'A', text: 'Варіант A' }],
    });

    const errors = validatePack(pack);
    expect(errors.some((e) => e.message.includes('0 або від 2 до 4'))).toBe(true);
  });

  it('flags more than four answer options as invalid', () => {
    const pack = makeValidPack();
    pack.rounds[0].categories[0].slots[0] = makeQuestion({
      options: [
        { id: 'a', label: 'A', text: 'A' },
        { id: 'b', label: 'B', text: 'B' },
        { id: 'c', label: 'C', text: 'C' },
        { id: 'd', label: 'D', text: 'D' },
      ].concat([{ id: 'e', label: 'A', text: 'E' }] as never),
    });

    const errors = validatePack(pack);
    expect(errors.some((e) => e.message.includes('0 або від 2 до 4'))).toBe(true);
  });

  it('flags answer options with no correct option marked', () => {
    const pack = makeValidPack();
    pack.rounds[0].categories[0].slots[0] = makeQuestion({
      options: [
        { id: 'a', label: 'A', text: 'Варіант A' },
        { id: 'b', label: 'B', text: 'Варіант B' },
      ],
    });

    const errors = validatePack(pack);
    expect(errors.some((e) => e.message.includes('правильний варіант'))).toBe(true);
  });

  it('flags a correctOptionId that does not match any option', () => {
    const pack = makeValidPack();
    pack.rounds[0].categories[0].slots[0] = makeQuestion({
      options: [
        { id: 'a', label: 'A', text: 'Варіант A' },
        { id: 'b', label: 'B', text: 'Варіант B' },
      ],
      correctOptionId: 'zzz',
    });

    const errors = validatePack(pack);
    expect(errors.some((e) => e.message.includes('правильний варіант'))).toBe(true);
  });

  it('flags a non-positive price', () => {
    const pack = makeValidPack();
    pack.rounds[0].prices = [0, 200, 300, 400, 500];

    const errors = validatePack(pack);
    expect(errors.some((e) => e.message.includes('додатними цілими'))).toBe(true);
  });

  it('flags a non-integer price', () => {
    const pack = makeValidPack();
    pack.rounds[0].prices = [100.5, 200, 300, 400, 500];

    const errors = validatePack(pack);
    expect(errors.some((e) => e.message.includes('додатними цілими'))).toBe(true);
  });

  it('flags a missing media file referenced by a question', () => {
    const pack = makeValidPack();
    pack.rounds[0].categories[0].slots[0] = makeQuestion({
      content: [{ id: 'q1-c1', type: 'image', file: 'missing.png' }],
    });

    const errors = validatePack(pack, { mediaFileExists: () => false });
    expect(errors.some((e) => e.message.includes('missing.png'))).toBe(true);
  });

  it('flags a missing pack logo file', () => {
    const pack = makeValidPack();
    pack.logo = 'missing-logo.png';

    const errors = validatePack(pack, { mediaFileExists: () => false });
    expect(errors.some((e) => e.message.includes('missing-logo.png'))).toBe(true);
  });

  it('demotes a previously-ready pack that is no longer valid', () => {
    const pack = makeValidPack();
    pack.status = 'ready';
    pack.title = '';

    expect(canMarkPackReady(pack)).toBe(false);
  });
});
