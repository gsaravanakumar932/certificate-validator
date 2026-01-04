import { Router, Request, Response } from 'express';
import { certificates } from '../repository/inMemory';

export const router = Router();

// Simulated search (Elasticsearch-backed in production)
router.get('/', (req: Request, res: Response) => {
  const q = String(req.query.q || '').toLowerCase();
  const out = certificates.filter((c) =>
    c.commonName.toLowerCase().includes(q) ||
    (c.domain || '').toLowerCase().includes(q) ||
    (c.issuer || '').toLowerCase().includes(q)
  );
  res.json(out);
});
