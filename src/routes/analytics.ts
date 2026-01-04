import { Router, Request, Response } from 'express';
import { predictExpiringSoon, scoreRisk } from '../services/aiEngine';
import { certificates } from '../repository/inMemory';
import { checkCertificateExpiry } from '../services/tlsCheck';

export const router = Router();

router.get('/expiry', (req: Request, res: Response) => {
  const within = Number(req.query.withinDays || 30);
  const soon = predictExpiringSoon(certificates, within);
  res.json(soon);
});

router.get('/risk', (_req: Request, res: Response) => {
  const insights = certificates.map((c) => scoreRisk(c));
  res.json(insights);
});

// GET /api/analytics/cert-check?host=id.atlassian.com or ?url=https://id.atlassian.com/
router.get('/cert-check', async (req: Request, res: Response) => {
  const target = (req.query.url as string) || (req.query.host as string);
  if (!target) return res.status(400).json({ error: 'Provide ?host=domain or ?url=https://domain' });
  try {
    const result = await checkCertificateExpiry(target);
    res.json(result);
  } catch (err: any) {
    res.status(502).json({ error: 'TLS check failed', details: err?.message || String(err) });
  }
});
