import { Router } from 'express';
import { listCertificates, getCertificateById } from '../repository/db';
import { certificates } from '../repository/inMemory';

export const router = Router();

router.get('/', async (_req, res) => {
  const list = await listCertificates();
  res.json(list);
});

router.get('/:id', async (req, res) => {
  const cert = await getCertificateById(req.params.id);
  if (!cert) return res.status(404).json({ error: 'Not found' });
  res.json(cert);
});

// Add or update mock certificate (no DB)
router.post('/', (req, res) => {
  const body = req.body;
  if (!body || !body.commonName) return res.status(400).json({ error: 'commonName required' });
  const existingIdx = certificates.findIndex((c) => c.id === body.id);
  if (existingIdx >= 0) {
    certificates[existingIdx] = { ...certificates[existingIdx], ...body };
    return res.json(certificates[existingIdx]);
  }
  const created = { ...body, id: body.id || String(Date.now()) };
  certificates.push(created);
  res.status(201).json(created);
});
