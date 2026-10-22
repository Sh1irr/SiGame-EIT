import type { RequestHandler } from 'express';
import { packMediaDir } from './paths.js';
import { paramAsString } from './routeParams.js';

// `root` makes `send` (used internally by res.sendFile) resolve the path and
// reject anything that escapes the pack's media directory. Range requests
// (video/audio seeking) are handled automatically by the same mechanism.
export const mediaServeHandler: RequestHandler = (req, res, next) => {
  const splatParam = req.params.splat as string[] | string | undefined;
  const relativePath = Array.isArray(splatParam) ? splatParam.join('/') : (splatParam ?? '');

  if (!relativePath) {
    res.status(404).end();
    return;
  }

  res.sendFile(relativePath, { root: packMediaDir(paramAsString(req.params.packId)) }, (error) => {
    if (!error) return;
    const status = (error as NodeJS.ErrnoException & { status?: number }).status;
    if (status === 404 || (error as NodeJS.ErrnoException).code === 'ENOENT') {
      res.status(404).end();
      return;
    }
    next(error);
  });
};
