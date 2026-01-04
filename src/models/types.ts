export type Environment = 'windows' | 'linux' | 'ubuntu' | 'macos' | 'cloud' | 'unknown';

export interface ScanTarget {
  id: string;
  type: 'domain' | 'ip' | 'ipRange' | 'endpoint';
  target: string; // e.g., domain name or CIDR
  port?: number; // default 443
  environment: Environment;
  tags?: string[];
}

export interface Certificate {
  id: string;
  commonName: string;
  issuer: string;
  validFrom: string; // ISO string
  validTo: string; // ISO string
  keyType: 'RSA' | 'ECDSA' | 'ED25519';
  keySize: number; // e.g., 2048
  signatureAlgorithm: string; // e.g., SHA-256
  environment: Environment;
  location: 'internal' | 'external';
  domain?: string;
  ip?: string;
  port?: number;
  san?: string[];
  tlsVersion?: string;
  chainTrusted?: boolean;
  fingerprintSha256?: string;
  source: 'discovered' | 'manual';
  lastScannedAt?: string;
  riskScore?: number; // 0-100
  complianceStatus?: 'pass' | 'fail' | 'warning';
}

export interface CompliancePolicy {
  id: string;
  name: string;
  minKeySize: number; // e.g., 2048
  allowedKeyTypes: Array<Certificate['keyType']>;
  allowedSignatureAlgorithms: string[]; // e.g., ['SHA-256']
  minTlsVersion?: string; // e.g., 'TLSv1.2'
}

export interface RiskInsight {
  certificateId: string;
  riskScore: number;
  reasons: string[];
  predictedDaysToExpiry?: number;
}

export interface ReportSummary {
  date: string;
  totals: {
    certificates: number;
    expiringSoon: number;
    nonCompliant: number;
    highRisk: number;
  };
}
