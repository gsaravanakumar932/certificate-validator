import { Certificate, RiskInsight } from '../models/types';

function daysUntil(dateIso: string): number {
  const now = Date.now();
  const target = new Date(dateIso).getTime();
  return Math.ceil((target - now) / (24 * 3600 * 1000));
}

export function scoreRisk(cert: Certificate): RiskInsight {
  const reasons: string[] = [];
  let score = 0;

  const days = daysUntil(cert.validTo);
  if (days <= 0) {
    score += 90;
    reasons.push('Certificate expired');
  } else if (days < 15) {
    score += 70;
    reasons.push('Certificate expiring within 15 days');
  } else if (days < 30) {
    score += 40;
    reasons.push('Certificate expiring within 30 days');
  }

  if (cert.keySize < 2048) {
    score += 40;
    reasons.push('Key size below 2048');
  }

  if (cert.signatureAlgorithm.toUpperCase().includes('SHA-1')) {
    score += 30;
    reasons.push('Weak signature algorithm SHA-1');
  }

  if (!cert.chainTrusted) {
    score += 20;
    reasons.push('Chain not trusted');
  }

  // Clamp score 0..100
  score = Math.min(100, score);

  return {
    certificateId: cert.id,
    riskScore: score,
    reasons,
    predictedDaysToExpiry: days
  };
}

export function predictExpiringSoon(certificates: Certificate[], withinDays = 30) {
  return certificates
    .map(scoreRisk)
    .filter((ri) => (ri.predictedDaysToExpiry ?? 0) <= withinDays);
}
