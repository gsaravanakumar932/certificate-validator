import { Router, Request, Response } from 'express';
import { evaluateAll } from '../services/complianceService';
import { certificates, compliancePolicies } from '../repository/inMemory';

export const router = Router();

router.get('/policies', (_req: Request, res: Response) => {
  res.json(compliancePolicies);
});

router.post('/policies', (req: Request, res: Response) => {
  const body = req.body;
  if (!body || !body.name) return res.status(400).json({ error: 'name required' });
  const created = { ...body, id: String(Date.now()) };
  compliancePolicies.push(created);
  res.status(201).json(created);
});

router.get('/violations', (_req: Request, res: Response) => {
  const results = evaluateAll(certificates, compliancePolicies);
  res.json(results.filter((r) => r.status === 'fail'));
});
