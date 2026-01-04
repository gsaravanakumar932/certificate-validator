import { Certificate, CompliancePolicy } from '../models/types';

export interface ComplianceResult {
  certificateId: string;
  status: 'pass' | 'fail' | 'warning';
  violations: string[];
}

export function evaluateCompliance(cert: Certificate, policy: CompliancePolicy): ComplianceResult {
  const violations: string[] = [];

  if (cert.keySize < policy.minKeySize) {
    violations.push(`Key size ${cert.keySize} < ${policy.minKeySize}`);
  }
  if (!policy.allowedKeyTypes.includes(cert.keyType)) {
    violations.push(`Key type ${cert.keyType} not in ${policy.allowedKeyTypes.join(', ')}`);
  }
  if (!policy.allowedSignatureAlgorithms.some((alg) => cert.signatureAlgorithm.toUpperCase().includes(alg.toUpperCase()))) {
    violations.push(`Signature algorithm ${cert.signatureAlgorithm} not allowed`);
  }
  if (policy.minTlsVersion && cert.tlsVersion) {
    const order = ['TLSv1.0', 'TLSv1.1', 'TLSv1.2', 'TLSv1.3'];
    const certIdx = order.indexOf(cert.tlsVersion);
    const minIdx = order.indexOf(policy.minTlsVersion);
    if (certIdx !== -1 && minIdx !== -1 && certIdx < minIdx) {
      violations.push(`TLS version ${cert.tlsVersion} < ${policy.minTlsVersion}`);
    }
  }

  const status: 'pass' | 'fail' | 'warning' = violations.length === 0 ? 'pass' : 'fail';

  return { certificateId: cert.id, status, violations };
}

export function evaluateAll(certificates: Certificate[], policies: CompliancePolicy[]): ComplianceResult[] {
  const defaultPolicy = policies[0];
  return certificates.map((c) => evaluateCompliance(c, defaultPolicy));
}
