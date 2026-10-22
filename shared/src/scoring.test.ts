import { describe, expect, it } from 'vitest';
import { applyScoreDelta, correctAnswerPoints, wrongAnswerPenalty } from './scoring.js';

describe('correctAnswerPoints', () => {
  it('awards the full price', () => {
    expect(correctAnswerPoints(100)).toBe(100);
    expect(correctAnswerPoints(500)).toBe(500);
  });
});

describe('wrongAnswerPenalty', () => {
  it('deducts half the price, rounded down', () => {
    expect(wrongAnswerPenalty(100)).toBe(-50);
    expect(wrongAnswerPenalty(125)).toBe(-62);
    expect(wrongAnswerPenalty(150)).toBe(-75);
  });
});

describe('applyScoreDelta', () => {
  it('allows the score to go negative', () => {
    expect(applyScoreDelta(10, wrongAnswerPenalty(125))).toBe(-52);
    expect(applyScoreDelta(-52, wrongAnswerPenalty(100))).toBe(-102);
  });
});
