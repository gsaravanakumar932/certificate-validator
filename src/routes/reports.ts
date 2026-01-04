import { Router, Request, Response } from 'express';
import { generateDailySummary } from '../services/reportService';
import { certificates } from '../repository/inMemory';

export const router = Router();

router.get('/daily', (_req: Request, res: Response) => {
  const summary = generateDailySummary(certificates);
  res.json(summary);
});

// Optional: export to AWS S3 (stub)
router.post('/export/s3', (_req: Request, res: Response) => {
  // See commented example in reportService.ts
  res.json({ status: 'stub', message: 'Integrate AWS S3 PutObject here' });
});
