import express from 'express';
import cors from 'cors';
// import helmet from 'helmet'; // Temporarily disabled per request to relax security checks
import { router as apiRouter } from './routes';
import { authMiddleware } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 8800;

// app.use(helmet()); // Re-enable when auth/security is desired
app.use(cors({ origin: '*'}));
// Disabled auth: this middleware is a no-op and allows all requests
app.use(authMiddleware);
app.use(express.json());
// Serve static dashboard from /public
app.use(express.static('public'));

// Root route to avoid 404s: provides quick guidance and status
app.get('/', (_req, res) => {
  res.json({
    message: 'CertIntel API',
    status: 'ok',
    port: PORT,
    endpoints: [
      '/health',
      '/api/discovery/*',
      '/api/certificates/*',
      '/api/analytics/*',
      '/api/compliance/*',
      '/api/reports/*',
      '/api/integrations/*',
      '/api/automation/*',
      '/api/search'
    ]
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'CertIntel API', timestamp: new Date().toISOString() });
});

app.use('/api', apiRouter);

app.listen(PORT, () => {
  console.log(`CertIntel API running on http://localhost:${PORT}`);
});
