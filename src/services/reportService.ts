import { Certificate, ReportSummary } from '../models/types';

export function generateDailySummary(certificates: Certificate[]): ReportSummary {
  const today = new Date().toISOString().slice(0, 10);
  const expiringSoon = certificates.filter((c) => {
    const days = Math.ceil((new Date(c.validTo).getTime() - Date.now()) / (24 * 3600 * 1000));
    return days <= 30;
  }).length;
  const nonCompliant = certificates.filter((c) => c.complianceStatus === 'fail').length;
  const highRisk = certificates.filter((c) => (c.riskScore ?? 0) >= 70).length;

  return {
    date: today,
    totals: {
      certificates: certificates.length,
      expiringSoon,
      nonCompliant,
      highRisk
    }
  };
}

// In production, optionally export JSON/PDF reports to AWS S3.
// Example (commented) using AWS SDK v3:
/*
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

export async function uploadReportToS3(bucket: string, key: string, data: object) {
  const body = JSON.stringify(data, null, 2);
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: 'application/json' }));
}
*/
