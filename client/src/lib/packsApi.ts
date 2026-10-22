import type { Pack } from 'shared';

export interface PackSummary {
  id: string;
  title: string;
  status: 'draft' | 'ready';
  roundsCount: number;
  updatedAt: string;
}

export async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? `Помилка сервера (${response.status})`;
  } catch {
    return `Помилка сервера (${response.status})`;
  }
}

export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function listPacks(): Promise<PackSummary[]> {
  return requestJson('/api/packs');
}

export function getPack(id: string): Promise<Pack> {
  return requestJson(`/api/packs/${id}`);
}

export function mediaUrl(packId: string, file: string): string {
  return `/media/${packId}/${file}`;
}
