import { v4 as uuid } from 'uuid';
import { Certificate, ScanTarget } from '../models/types';
import os from 'os';
import { exec as execCb } from 'child_process';
import dns from 'dns';
import tls from 'tls';
import { promisify } from 'util';

const exec = promisify(execCb);
const dnsReverse = promisify(dns.reverse);

export interface DiscoveryOptions {
  timeoutMs?: number;
  quick?: boolean; // limit host scan per subnet
  concurrency?: number; // parallel connections
  includePrivateRanges?: boolean; // also scan common private ranges
}

// Agentless discovery stub: In real use, sweep IPs/domains and fetch TLS certs.
// Here we simulate results deterministically from the targets.
export async function discoverCertificates(targets: ScanTarget[], _opts: DiscoveryOptions = {}): Promise<Certificate[]> {
  const results: Certificate[] = [];
  for (const t of targets) {
    if (t.type === 'domain') {
      results.push({
        id: uuid(),
        commonName: t.target,
        issuer: "Let's Encrypt",
        validFrom: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
        validTo: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
        keyType: 'RSA',
        keySize: 2048,
        signatureAlgorithm: 'SHA-256',
        environment: t.environment,
        location: 'external',
        domain: t.target,
        port: t.port ?? 443,
        san: [t.target],
        tlsVersion: 'TLSv1.3',
        chainTrusted: true,
        fingerprintSha256: 'MO:CK:FP',
        source: 'discovered',
        lastScannedAt: new Date().toISOString()
      });
    } else if (t.type === 'ipRange' || t.type === 'ip') {
      // Simulate one internal cert per range/ip
      results.push({
        id: uuid(),
        commonName: 'internal.service.local',
        issuer: 'Internal CA',
        validFrom: new Date(Date.now() - 100 * 24 * 3600 * 1000).toISOString(),
        validTo: new Date(Date.now() + 20 * 24 * 3600 * 1000).toISOString(),
        keyType: 'RSA',
        keySize: 1024,
        signatureAlgorithm: 'SHA-1',
        environment: t.environment,
        location: 'internal',
        ip: t.target,
        port: t.port ?? 443,
        san: ['internal.service.local'],
        tlsVersion: 'TLSv1.1',
        chainTrusted: false,
        fingerprintSha256: 'IN:TE:RN:AL:MO:CK',
        source: 'discovered',
        lastScannedAt: new Date().toISOString()
      });
    }
  }
  return results;
}

// -----------------------------
// Network crawling (agentless)
// -----------------------------

function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, oct) => (acc << 8) + Number(oct), 0) >>> 0;
}

function intToIp(int: number): string {
  return [24, 16, 8, 0].map((shift) => ((int >>> shift) & 0xff)).join('.');
}

function maskToBits(mask: string): number {
  const int = ipToInt(mask);
  return int.toString(2).split('0')[0].length; // count leading 1s
}

function isPrivateIp(ip: string): boolean {
  const [a, b] = ip.split('.').map(Number);
  if (a === 10) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

function listLocalCidrs(): Array<{ cidr: string; network: string; maskBits: number }> {
  const nics = os.networkInterfaces();
  const cidrs: Array<{ cidr: string; network: string; maskBits: number }> = [];
  for (const name of Object.keys(nics)) {
    for (const addr of nics[name] || []) {
      if (addr.family !== 'IPv4' || addr.internal) continue;
      const maskBits = maskToBits(addr.netmask);
      // derive network address
      const ipInt = ipToInt(addr.address);
      const maskInt = ipToInt(addr.netmask);
      const networkInt = ipInt & maskInt;
      const network = intToIp(networkInt);
      cidrs.push({ cidr: `${network}/${maskBits}`, network, maskBits });
    }
  }
  return cidrs;
}

async function getDefaultGatewayWindows(): Promise<string | null> {
  try {
    const { stdout } = await exec('route print');
    const lines = stdout.split(/\r?\n/);
    // Find line with 0.0.0.0 gateway
    for (const line of lines) {
      if (line.includes('0.0.0.0')) {
        const parts = line.trim().split(/\s+/);
        // Destination 0.0.0.0 Mask 0.0.0.0 Gateway X.X.X.X
        const gw = parts.find((p) => /\d+\.\d+\.\d+\.\d+/.test(p));
        if (gw && gw !== '0.0.0.0') return gw;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

async function tryTls(host: string, port = 443, timeoutMs = 5000): Promise<{ cn?: string; issuer?: string; validFrom?: string; validTo?: string } | null> {
  return new Promise((resolve) => {
    const socket = tls.connect({ host, port, servername: host, rejectUnauthorized: false });
    const timer = setTimeout(() => {
      socket.destroy();
      resolve(null);
    }, timeoutMs);
    const done = (val: any) => { clearTimeout(timer); try { socket.end(); } catch {} resolve(val); };
    socket.once('secureConnect', () => {
      const cert = socket.getPeerCertificate();
      if (!cert || !cert.valid_to || !cert.valid_from) return done(null);
      const cn = cert.subject?.CN;
      const issuer = cert.issuer?.CN;
      const validToIso = new Date(cert.valid_to).toISOString();
      const validFromIso = new Date(cert.valid_from).toISOString();
      done({ cn, issuer, validFrom: validFromIso, validTo: validToIso });
    });
    socket.once('error', () => done(null));
  });
}

async function reverseLookup(host: string): Promise<string | null> {
  try { const names = await dnsReverse(host); return names?.[0] || null; } catch { return null; }
}

function enumerateHosts(network: string, maskBits: number, limitPerSubnet = 256): string[] {
  const startInt = ipToInt(network);
  const hostBits = 32 - maskBits;
  const totalHosts = Math.max(0, (1 << hostBits) - 2); // exclude network/broadcast
  const count = Math.min(totalHosts, limitPerSubnet);
  const hosts: string[] = [];
  // skip .0 and start from .1
  for (let i = 1; i <= count; i++) {
    hosts.push(intToIp(startInt + i));
  }
  return hosts;
}

export async function autoDiscoverCertificates(opts: DiscoveryOptions = {}): Promise<Certificate[]> {
  const timeoutMs = opts.timeoutMs ?? 5000;
  const concurrency = Math.max(1, Math.min(100, opts.concurrency ?? 30));
  const limitPerSubnet = opts.quick ? 64 : 256;

  const cidrs = listLocalCidrs();
  const gw = await getDefaultGatewayWindows();
  const hostsToScan: Array<{ host: string; label: string; internal: boolean }> = [];

  for (const c of cidrs) {
    const hosts = enumerateHosts(c.network, Math.min(c.maskBits, 24), limitPerSubnet); // cap at /24 for practicality
    hosts.forEach((h) => hostsToScan.push({ host: h, label: c.cidr, internal: isPrivateIp(h) }));
  }
  if (gw) hostsToScan.push({ host: gw, label: 'gateway', internal: isPrivateIp(gw) });

  // Optional additional private ranges
  if (opts.includePrivateRanges) {
    // Add common router IPs
    ['192.168.0.1', '192.168.1.1', '10.0.0.1'].forEach((h) => hostsToScan.push({ host: h, label: 'router-common', internal: true }));
  }

  const results: Certificate[] = [];
  let index = 0;
  async function worker() {
    while (index < hostsToScan.length) {
      const i = index++;
      const { host, internal } = hostsToScan[i];
      const cert = await tryTls(host, 443, timeoutMs);
      if (!cert) continue;
      const name = (await reverseLookup(host)) || cert.cn || undefined;
      results.push({
        id: uuid(),
        commonName: name || host,
        issuer: cert.issuer || 'Unknown',
        validFrom: cert.validFrom!,
        validTo: cert.validTo!,
        keyType: 'RSA',
        keySize: 2048,
        signatureAlgorithm: 'SHA-256',
        environment: internal ? 'linux' : 'cloud',
        location: internal ? 'internal' : 'external',
        domain: name || undefined,
        ip: host,
        port: 443,
        san: name ? [name] : undefined,
        tlsVersion: 'TLSv1.2',
        chainTrusted: true,
        fingerprintSha256: 'AUTO:DISCOVERY',
        source: 'discovered',
        lastScannedAt: new Date().toISOString(),
      });
    }
  }

  // Run workers for concurrency
  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  return results;
}
