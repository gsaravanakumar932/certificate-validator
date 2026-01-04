# CertIntel (Backend API)

Lightweight, agentless, AI-integrated certificate intelligence platform backend.

## Features
- Agentless discovery stubs: domains/IP ranges → mock certificates
- AI risk scoring + expiry prediction
- Compliance policy enforcement
- Centralized REST API (Express)
- Reporting summary and AWS SDK stubs (S3 upload commented)
- DB connection stubs (PostgreSQL + Elasticsearch commented)

## Tech
- Node.js + TypeScript + Express
- AWS SDK v3 (commented stubs)
- PostgreSQL + Elasticsearch (commented stubs)

## Quick Start

1. Install dependencies
```cmd
npm install
```

2. Run development server
```cmd
npm run dev
```

3. Health check
```cmd
curl http://localhost:9000/health
```

## API
- GET `/health` – service health
- POST `/api/discovery/run` – body: `{ domains?: string[], ipRanges?: string[] }`
- GET `/api/discovery/targets` – list mock targets
- GET `/api/certificates` – list certificates
- GET `/api/certificates/:id` – certificate details
- GET `/api/analytics/expiry?withinDays=30` – nearing expiry
- GET `/api/analytics/risk` – risk insights
- GET `/api/compliance/policies` – list policies
- POST `/api/compliance/policies` – add policy
- GET `/api/compliance/violations` – current violations
- GET `/api/reports/daily` – daily summary
- POST `/api/reports/export/s3` – stub
- POST `/api/integrations/itsm/servicenow` – stub
- POST `/api/integrations/siem/splunk` – stub
- POST `/api/automation/renew` – renewal stub
- GET `/api/search?q=example` – simulated search

## Enable DB (optional)
- See `src/repository/db.ts` for commented Postgres + Elasticsearch clients.
- Example uses AWS Secrets Manager for DB credentials.

## Notes
- Data persisted in two arrays: `scanTargets`, `certificates` (plus `compliancePolicies`).
- Focused on functionality; UI not included.
- Expand discovery engine to real TLS scans in future iterations.
