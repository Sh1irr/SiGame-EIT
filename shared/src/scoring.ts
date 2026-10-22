export function correctAnswerPoints(price: number): number {
  return price;
}

// Rounds down, so odd prices split in the team's favour on the remainder (125 -> -62, 150 -> -75).
export function wrongAnswerPenalty(price: number): number {
  return -Math.floor(price / 2);
}

export function applyScoreDelta(score: number, delta: number): number {
  return score + delta;
}
