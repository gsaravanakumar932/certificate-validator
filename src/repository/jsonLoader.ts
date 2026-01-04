import fs from 'fs';
import path from 'path';
import { Certificate, ScanTarget, CompliancePolicy } from '../models/types';

const dataDir = path.resolve(process.cwd(), 'data');

function loadJsonFile<T>(name: string): T | undefined {
  try {
    const filePath = path.join(dataDir, name);
    if (!fs.existsSync(filePath)) return undefined;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function loadCertificates(): Certificate[] | undefined {
  return loadJsonFile<Certificate[]>('certificates.json');
}

export function loadScanTargets(): ScanTarget[] | undefined {
  return loadJsonFile<ScanTarget[]>('scanTargets.json');
}

export function loadCompliancePolicies(): CompliancePolicy[] | undefined {
  return loadJsonFile<CompliancePolicy[]>('compliancePolicies.json');
}
