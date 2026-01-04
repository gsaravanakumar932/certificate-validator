import { v4 as uuid } from 'uuid';
import { Certificate, ScanTarget, CompliancePolicy } from '../models/types';
import { loadCertificates, loadScanTargets, loadCompliancePolicies } from './jsonLoader';

// Two mock arrays used instead of a DB
const defaultScanTargets: ScanTarget[] = [
  {
    id: uuid(),
    type: 'domain',
    target: 'api.example.com',
    port: 443,
    environment: 'cloud',
    tags: ['external', 'prod']
  },
  {
    id: uuid(),
    type: 'ipRange',
    target: '10.0.0.0/24',
    port: 443,
    environment: 'linux',
    tags: ['internal', 'dev']
  }
];

const defaultCertificates: Certificate[] = [
  {
    id: uuid(),
    commonName: 'api.example.com',
    issuer: 'Let\'s Encrypt',
    validFrom: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    validTo: new Date(Date.now() + 50 * 24 * 3600 * 1000).toISOString(),
    keyType: 'RSA',
    keySize: 2048,
    signatureAlgorithm: 'SHA-256',
    environment: 'cloud',
    location: 'external',
    domain: 'api.example.com',
    port: 443,
    san: ['api.example.com', 'www.api.example.com'],
    tlsVersion: 'TLSv1.3',
    chainTrusted: true,
    fingerprintSha256: 'FA:KE:FI:NG:ER:PR:IN:T',
    source: 'manual',
    lastScannedAt: new Date().toISOString(),
    riskScore: 20,
    complianceStatus: 'pass'
  },
  {
    id: uuid(),
    commonName: 'internal.dev.local',
    issuer: 'Internal CA',
    validFrom: new Date(Date.now() - 200 * 24 * 3600 * 1000).toISOString(),
    validTo: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
    keyType: 'RSA',
    keySize: 1024,
    signatureAlgorithm: 'SHA-1',
    environment: 'linux',
    location: 'internal',
    domain: 'internal.dev.local',
    port: 443,
    san: ['internal.dev.local'],
    tlsVersion: 'TLSv1.1',
    chainTrusted: false,
    fingerprintSha256: 'FA:KE:IN:TE:RN:AL',
    source: 'discovered',
    lastScannedAt: new Date().toISOString(),
    riskScore: 85,
    complianceStatus: 'fail'
  }
];

const defaultCompliancePolicies: CompliancePolicy[] = [
  {
    id: uuid(),
    name: 'Enterprise Default',
    minKeySize: 2048,
    allowedKeyTypes: ['RSA', 'ECDSA'],
    allowedSignatureAlgorithms: ['SHA-256', 'SHA-384'],
    minTlsVersion: 'TLSv1.2'
  }
];

// Export either JSON-loaded mocks (if present) or fall back to defaults
export const scanTargets: ScanTarget[] = loadScanTargets() || defaultScanTargets;
export const certificates: Certificate[] = loadCertificates() || defaultCertificates;
export const compliancePolicies: CompliancePolicy[] = loadCompliancePolicies() || defaultCompliancePolicies;
