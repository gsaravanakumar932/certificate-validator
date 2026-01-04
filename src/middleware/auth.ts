import { Request, Response, NextFunction } from 'express';

// Auth middleware disabled: allows all requests.
// To enable API key checks later, replace this with header validation.
export function authMiddleware(_req: Request, _res: Response, next: NextFunction) {
  // Example (commented):
  // const apiKey = _req.header('x-api-key');
  // if (!apiKey || apiKey !== process.env.API_KEY) {
  //   return _res.status(401).json({ error: 'Unauthorized: missing or invalid x-api-key' });
  // }
  return next();
}
