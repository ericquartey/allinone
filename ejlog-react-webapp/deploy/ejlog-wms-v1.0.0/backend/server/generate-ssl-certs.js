/**
 * Generate Self-Signed SSL Certificates using node-forge
 *
 * This script generates self-signed SSL certificates for HTTPS development.
 * DO NOT use these certificates in production!
 *
 * Usage: node generate-ssl-certs.js
 */

import forge from 'node-forge';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔐 Generating self-signed SSL certificates with node-forge...\n');

// Generate RSA key pair
console.log('⚙️  Generating 2048-bit RSA key pair...');
const keys = forge.pki.rsa.generateKeyPair(2048);

// Create certificate
console.log('📝 Creating X.509 certificate...');
const cert = forge.pki.createCertificate();

cert.publicKey = keys.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

// Certificate attributes
const attrs = [
  {
    name: 'commonName',
    value: 'localhost'
  },
  {
    name: 'countryName',
    value: 'IT'
  },
  {
    shortName: 'ST',
    value: 'Verona'
  },
  {
    name: 'localityName',
    value: 'Verona'
  },
  {
    name: 'organizationName',
    value: 'Ferretto Group'
  },
  {
    shortName: 'OU',
    value: 'EjLog WMS Development'
  }
];

cert.setSubject(attrs);
cert.setIssuer(attrs);

// Extensions
cert.setExtensions([
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
    emailProtection: true,
    timeStamping: true
  },
  {
    name: 'nsCertType',
    server: true,
    client: true,
    email: true,
    objsign: true,
    sslCA: true,
    emailCA: true,
    objCA: true
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
]);

// Self-sign certificate
console.log('✍️  Self-signing certificate...');
cert.sign(keys.privateKey, forge.md.sha256.create());

// Convert to PEM format
const pemPrivateKey = forge.pki.privateKeyToPem(keys.privateKey);
const pemCertificate = forge.pki.certificateToPem(cert);

// Create certs directory if doesn't exist
const certsDir = path.join(__dirname, 'certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

// Write certificate files
const keyPath = path.join(certsDir, 'server.key');
const certPath = path.join(certsDir, 'server.cert');

fs.writeFileSync(keyPath, pemPrivateKey);
fs.writeFileSync(certPath, pemCertificate);

console.log('\n✅ SSL Certificates generated successfully!\n');
console.log('📁 Certificate files:');
console.log(`   Private Key: ${keyPath}`);
console.log(`   Certificate: ${certPath}`);
console.log('\n📋 Certificate Details:');
console.log(`   Common Name: localhost`);
console.log(`   Organization: Ferretto Group / EjLog WMS Development`);
console.log(`   Country: IT (Italy)`);
console.log(`   Location: Verona`);
console.log(`   Valid From: ${cert.validity.notBefore.toISOString()}`);
console.log(`   Valid Until: ${cert.validity.notAfter.toISOString()}`);
console.log(`   Key Size: 2048 bits`);
console.log(`   Algorithm: RSA with SHA-256`);
console.log(`   Serial Number: ${cert.serialNumber}`);
console.log('\n⚠️  IMPORTANT: These are self-signed certificates for DEVELOPMENT only!');
console.log('   Your browser will show a security warning - this is expected.');
console.log('   In production, use certificates from a trusted Certificate Authority (CA).');
console.log('\n🔧 To accept self-signed cert in browser:');
console.log('   1. Navigate to https://localhost:3079');
console.log('   2. Click "Advanced" or "More details"');
console.log('   3. Click "Proceed to localhost" or "Accept the risk"');
console.log('\n🚀 Next Steps:');
console.log('   1. Configure server to use HTTPS with these certificates');
console.log('   2. Update .env file: ENABLE_HTTPS=true');
console.log('   3. Restart server: node server/api-server-https.js');
console.log('   4. Access API at: https://localhost:3079/api-docs');

