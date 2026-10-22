import type { Pack, ValidationError } from 'shared';
import { parseErrorMessage, requestJson } from '../lib/packsApi';

export { listPacks, getPack, mediaUrl } from '../lib/packsApi';
export type { PackSummary } from '../lib/packsApi';

export interface SavePackResult {
  pack: Pack;
  validationErrors?: ValidationError[];
}

export function createPack(): Promise<Pack> {
  return requestJson('/api/packs', { method: 'POST' });
}

export function savePack(pack: Pack): Promise<SavePackResult> {
  return requestJson(`/api/packs/${pack.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pack),
  });
}

export async function deletePack(id: string): Promise<void> {
  await requestJson(`/api/packs/${id}`, { method: 'DELETE' });
}

export function duplicatePack(id: string): Promise<Pack> {
  return requestJson(`/api/packs/${id}/duplicate`, { method: 'POST' });
}

export async function exportPack(id: string, title: string): Promise<void> {
  const response = await fetch(`/api/packs/${id}/export`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title || id}.zip`;
  link.click();
  URL.revokeObjectURL(url);
}

export function importPack(file: File): Promise<Pack> {
  const formData = new FormData();
  formData.append('file', file);
  return requestJson('/api/packs/import', { method: 'POST', body: formData });
}

export async function uploadMedia(packId: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const result = await requestJson<{ file: string }>(`/api/packs/${packId}/media`, {
    method: 'POST',
    body: formData,
  });
  return result.file;
}
