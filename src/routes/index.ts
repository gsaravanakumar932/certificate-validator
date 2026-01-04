import { Router } from 'express';
import { router as discoveryRouter } from './discovery';
import { router as certificatesRouter } from './certificates';
import { router as analyticsRouter } from './analytics';
import { router as complianceRouter } from './compliance';
import { router as reportsRouter } from './reports';
import { router as integrationsRouter } from './integrations';
import { router as automationRouter } from './automation';
import { router as searchRouter } from './search';

export const router = Router();

router.use('/discovery', discoveryRouter);
router.use('/certificates', certificatesRouter);
router.use('/analytics', analyticsRouter);
router.use('/compliance', complianceRouter);
router.use('/reports', reportsRouter);
router.use('/integrations', integrationsRouter);
router.use('/automation', automationRouter);
router.use('/search', searchRouter);
