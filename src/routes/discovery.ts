import { Router, Request, Response } from 'express';
import { discoverCertificates, autoDiscoverCertificates } from '../services/discoveryEngine';
import { certificates, scanTargets } from '../repository/inMemory';

export const router = Router();

// POST /api/discovery/run { ipRanges?: string[], domains?: string[] }
router.post('/run', async (req: Request, res: Response) => {
  const { ipRanges = [], domains = [] } = req.body || {};
  const targets = [
    ...domains.map((d: string) => ({ id: d, type: 'domain', target: d, port: 443, environment: 'cloud' as const })),
    ...ipRanges.map((r: string) => ({ id: r, type: 'ipRange', target: r, port: 443, environment: 'linux' as const })),
  ];
  // Save targets to mock array
  targets.forEach((t) => scanTargets.push(t as any));

  const found = await discoverCertificates(targets as any);
  found.forEach((c) => certificates.push(c));
  res.json({ added: found.length, certificates: found });
});

// GET /api/discovery/targets
router.get('/targets', (_req: Request, res: Response) => {
  res.json(scanTargets);
});

// POST /api/discovery/crawl { quick?: boolean, timeoutMs?: number, concurrency?: number, includePrivateRanges?: boolean }
router.post('/crawl', async (req: Request, res: Response) => {
  const { quick = true, timeoutMs = 5000, concurrency = 30, includePrivateRanges = true } = req.body || {};
  try {
    const found = await autoDiscoverCertificates({ quick, timeoutMs, concurrency, includePrivateRanges });
    found.forEach((c) => certificates.push(c));
    res.json({ added: found.length, certificates: found });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || String(err) });
  }
});
