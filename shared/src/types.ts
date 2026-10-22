export type MediaBlock =
  | { id: string; type: 'text'; text: string }
  | { id: string; type: 'image' | 'audio' | 'video'; file: string; caption?: string };

export interface AnswerOption {
  id: string;
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface Question {
  id: string;
  content: MediaBlock[];
  options: AnswerOption[];
  correctOptionId?: string;
  answer: MediaBlock[];
}

export interface Category {
  id: string;
  name: string;
  slots: (Question | null)[];
}

export interface Round {
  id: string;
  name?: string;
  prices: [number, number, number, number, number];
  categories: Category[];
}

export interface Pack {
  id: string;
  title: string;
  subtitle: string;
  logo?: string;
  status: 'draft' | 'ready';
  rounds: Round[];
  createdAt: string;
  updatedAt: string;
}
