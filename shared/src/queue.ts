export interface Queue {
  order: string[];
  currentIndex: number;
}

export function createQueue(teamIds: string[], startIndex: number): Queue {
  return { order: teamIds, currentIndex: startIndex };
}

// Always moves to the team after the one whose turn it was, regardless of
// who (if anyone) answered correctly during an interception.
export function advanceQueue(queue: Queue): Queue {
  return { ...queue, currentIndex: (queue.currentIndex + 1) % queue.order.length };
}

export function currentTeamId(queue: Queue): string {
  return queue.order[queue.currentIndex];
}

export function pickRandomStartIndex(teamCount: number, random: () => number = Math.random): number {
  return Math.floor(random() * teamCount);
}
