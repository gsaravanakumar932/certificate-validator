// Database connections are commented to keep the app agentless and mock-driven.
// Uncomment and configure when hooking up PostgreSQL and Elasticsearch.

/*
import { Pool } from 'pg';
import { Client as ESClient } from '@elastic/elasticsearch';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const secrets = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });

async function getDbCredentials() {
  if (!process.env.DB_SECRET_ID) throw new Error('DB_SECRET_ID not set');
  const resp = await secrets.send(new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ID }));
  const secretString = resp.SecretString || '{}';
  return JSON.parse(secretString);
}

export async function getPgPool(): Promise<Pool> {
  const creds = await getDbCredentials();
  const pool = new Pool({
    host: creds.host,
    port: creds.port,
    user: creds.username,
    password: creds.password,
    database: creds.database,
    max: 10,
  });
  return pool;
}

export function getElasticClient(): ESClient {
  const node = process.env.ELASTIC_URL || 'http://localhost:9200';
  return new ESClient({ node });
}
*/

// Placeholder repository functions using in-memory arrays
import { certificates } from './inMemory';
import { Certificate } from '../models/types';

export async function listCertificates(): Promise<Certificate[]> {
  return certificates;
}

export async function getCertificateById(id: string): Promise<Certificate | undefined> {
  return certificates.find((c) => c.id === id);
}
