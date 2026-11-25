// Creates a local certificate authority and an HTTPS certificate for the dev server,
// using the `mkcert` npm package (https://www.npmjs.com/package/mkcert).
//
//   npm run cert            -> (re)create certificates
//   node scripts/generate-cert.js --if-missing   -> only create when absent (used by predev)
//
// Output: .cert/ca.crt, .cert/ca.key, .cert/cert.pem, .cert/key.pem
// The certificate covers localhost, 127.0.0.1, ::1 and this machine's LAN IPs,
// so you can also open the site from a phone on the same Wi-Fi.

import { createCA, createCert } from 'mkcert';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { networkInterfaces, hostname } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, '.cert');
const files = {
  caCert: join(dir, 'ca.crt'),
  caKey: join(dir, 'ca.key'),
  cert: join(dir, 'cert.pem'),
  key: join(dir, 'key.pem'),
};

if (process.argv.includes('--if-missing') && existsSync(files.cert) && existsSync(files.key)) {
  process.exit(0);
}

const lanIps = Object.values(networkInterfaces())
  .flat()
  .filter((i) => i && i.family === 'IPv4' && !i.internal)
  .map((i) => i.address);

const domains = [...new Set(['localhost', '127.0.0.1', '::1', hostname(), ...lanIps])];

const ca = await createCA({
  organization: 'SikhRI Local Dev CA',
  countryCode: 'IN',
  state: 'Local',
  locality: 'Local',
  validity: 825,
});

const cert = await createCert({
  ca: { key: ca.key, cert: ca.cert },
  domains,
  validity: 365,
  organization: 'SikhRI Donation Form (local)',
});

mkdirSync(dir, { recursive: true });
writeFileSync(files.caCert, ca.cert);
writeFileSync(files.caKey, ca.key, { mode: 0o600 });
writeFileSync(files.cert, `${cert.cert}${ca.cert}`); // leaf + CA chain
writeFileSync(files.key, cert.key, { mode: 0o600 });

console.log('HTTPS certificate created in .cert/ for:');
domains.forEach((d) => console.log('  -', d));
console.log('\nTo remove the browser warning, trust .cert/ca.crt once (see README > HTTPS).');
