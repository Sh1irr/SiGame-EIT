import type { GameSession } from 'shared';
import { requestJson } from './packsApi';

export async function getActiveSession(): Promise<GameSession | null> {
  try {
    return await requestJson<GameSession>('/api/sessions/active');
  } catch {
    return null;
  }
}

export function createSession(session: GameSession): Promise<GameSession> {
  return requestJson('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  });
}

export function putSession(session: GameSession): Promise<GameSession> {
  return requestJson(`/api/sessions/${session.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  });
}

export async function deleteSession(id: string): Promise<void> {
  await requestJson(`/api/sessions/${id}`, { method: 'DELETE' });
}
