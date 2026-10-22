export const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

// Extension -> acceptable Content-Type values. Both must match; the two
// checks catch different mistakes (wrong extension vs. a spoofed header).
export const ALLOWED_MEDIA_EXTENSIONS: Record<string, string[]> = {
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  webp: ['image/webp'],
  gif: ['image/gif'],
  mp3: ['audio/mpeg'],
  ogg: ['audio/ogg', 'application/ogg'],
  wav: ['audio/wav', 'audio/x-wav', 'audio/wave'],
  mp4: ['video/mp4'],
  webm: ['video/webm'],
};

export function isAllowedMediaFile(extension: string, mimetype: string): boolean {
  const allowedMimes = ALLOWED_MEDIA_EXTENSIONS[extension.toLowerCase()];
  return allowedMimes !== undefined && allowedMimes.includes(mimetype);
}
