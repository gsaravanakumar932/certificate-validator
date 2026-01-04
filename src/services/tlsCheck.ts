import tls from 'tls';
import { URL } from 'url';

export type CertCheckResult = {
  host: string;
  port: number;
  subject?: string;
  issuer?: string;
  validFrom?: string; // ISO
  validTo?: string;   // ISO
  daysRemaining?: number;
  expired: boolean;
};

function daysUntil(dateIso: string): number {
  const now = Date.now();
  const target = new Date(dateIso).getTime();
  return Math.ceil((target - now) / (24 * 3600 * 1000));
}

export function parseTarget(input: string): { host: string; port: number; servername: string } {
  try {
    // Accept full URLs or plain hosts
    if (input.startsWith('http://') || input.startsWith('https://')) {
      const u = new URL(input);
      return { host: u.hostname, port: u.port ? Number(u.port) : 443, servername: u.hostname };
    }
  } catch {
    // fallthrough
  }
  // If host:port provided
  if (input.includes(':')) {
    const [host, portStr] = input.split(':');
    const port = Number(portStr) || 443;
    return { host, port, servername: host };
  }
  return { host: input, port: 443, servername: input };
}

export async function checkCertificateExpiry(target: string, timeoutMs = 7000): Promise<CertCheckResult> {
  const { host, port, servername } = parseTarget(target);
  return new Promise<CertCheckResult>((resolve, reject) => {
    const socket = tls.connect({ host, port, servername, rejectUnauthorized: false });

    const onError = (err: Error) => {
      socket.destroy();
      reject(err);
    };

    const timer = setTimeout(() => onError(new Error(`TLS connect timeout after ${timeoutMs}ms`)), timeoutMs);

    socket.once('secureConnect', () => {
      clearTimeout(timer);
      const cert = socket.getPeerCertificate();
      socket.end();

      if (!cert || !cert.valid_to || !cert.valid_from) {
        return resolve({ host, port, expired: false, subject: cert?.subject?.CN, issuer: cert?.issuer?.CN });
      }
      const validToIso = new Date(cert.valid_to).toISOString();
      const validFromIso = new Date(cert.valid_from).toISOString();
      const remaining = daysUntil(validToIso);

      resolve({ host, port, subject: cert.subject?.CN, issuer: cert.issuer?.CN, validFrom: validFromIso, validTo: validToIso, daysRemaining: remaining, expired: remaining <= 0 });
    });

    socket.once('error', onError);
  });
}
