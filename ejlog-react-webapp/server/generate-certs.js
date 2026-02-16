/**
 * Generate Self-Signed SSL Certificates for Development
 *
 * This script generates self-signed SSL certificates for HTTPS development.
 * DO NOT use these certificates in production!
 *
 * Usage: node generate-certs.js
 */

import selfsigned from 'selfsigned';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔐 Generating self-signed SSL certificates...\n');

// Certificate attributes
const attrs = [
  { name: 'commonName', value: 'localhost' },
  { name: 'countryName', value: 'IT' },
  { shortName: 'ST', value: 'Verona' },
  { name: 'localityName', value: 'Verona' },
  { name: 'organizationName', value: 'Ferretto Group' },
  { shortName: 'OU', value: 'EjLog WMS Development' }
];

// Certificate options
const options = {
  keySize: 2048,
  days: 365,
  algorithm: 'sha256',
  extensions: [
    {
      name: 'basicConstraints',
      cA: true
    },
    {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true,
      codeSigning: true,
      timeStamping: true
    },
    {
      name: 'subjectAltName',
      altNames: [
        {
          type: 2, // DNS
          value: 'localhost'
        },
        {
          type: 2, // DNS
          value: 'localhost.localdomain'
        },
        {
          type: 7, // IP
          ip: '127.0.0.1'
        },
        {
          type: 7, // IP
          ip: '::1'
        }
      ]
    }
  ]
};

// Generate certificate
const pems = selfsigned.generate(attrs, options);

console.log('Generated PEM structure:', Object.keys(pems));

// Create certs directory if it doesn't exist
const certsDir = path.join(__dirname, 'certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

// Write certificate files
const keyPath = path.join(certsDir, 'server.key');
const certPath = path.join(certsDir, 'server.cert');

// selfsigned returns { private, public, cert } or { private, cert }
const privateKey = pems.private || pems.privateKey;
const certificate = pems.cert || pems.public;

if (!privateKey || !certificate) {
  console.error('❌ Error: Could not extract private key or certificate from generated PEM');
  console.error('Available keys:', Object.keys(pems));
  process.exit(1);
}

fs.writeFileSync(keyPath, privateKey);
fs.writeFileSync(certPath, certificate);

console.log('✅ SSL Certificates generated successfully!\n');
console.log('📁 Certificate files:');
console.log(`   Private Key: ${keyPath}`);
console.log(`   Certificate: ${certPath}`);
console.log('\n⚠️  IMPORTANT: These are self-signed certificates for DEVELOPMENT only!');
console.log('   Your browser will show a security warning - this is expected.');
console.log('   In production, use certificates from a trusted Certificate Authority (CA).');
console.log('\n🔧 To accept self-signed cert in browser:');
console.log('   1. Navigate to https://localhost:3079');
console.log('   2. Click "Advanced" or "More details"');
console.log('   3. Click "Proceed to localhost" or "Accept the risk"');
console.log('\n📝 Certificate Details:');
console.log(`   Common Name: localhost`);
console.log(`   Organization: Ferretto Group / EjLog WMS Development`);
console.log(`   Valid for: 365 days`);
console.log(`   Key Size: 2048 bits`);
console.log(`   Algorithm: SHA-256`);

