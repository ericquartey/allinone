/**
 * Legacy HTTPS Proxy
 * Keeps port 7079 available for external clients by forwarding to 3079.
 */

import fs from 'fs';
import https from 'https';
import path from 'path';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const TARGET = process.env.LEGACY_HTTPS_PROXY_TARGET || 'https://localhost:3079';
const PORT = Number(process.env.LEGACY_HTTPS_PROXY_PORT) || 7079;

const certDir = path.join(__dirname, 'certs');
const keyPath = process.env.LEGACY_HTTPS_PROXY_KEY || path.join(certDir, 'server.key');
const certPath = process.env.LEGACY_HTTPS_PROXY_CERT || path.join(certDir, 'server.cert');

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.error('[LEGACY-HTTPS-PROXY] Missing SSL certs. Run: node server/generate-ssl-certs.js');
  process.exit(1);
}

app.use((req, _res, next) => {
  console.log(`[LEGACY-HTTPS-PROXY] ${req.method} ${req.url} -> ${TARGET}`);
  next();
});

app.use(
  '/',
  createProxyMiddleware({
    target: TARGET,
    changeOrigin: true,
    ws: true,
    secure: false,
    onError(err, req, res) {
      console.error('[LEGACY-HTTPS-PROXY] Error:', err.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Legacy HTTPS proxy error',
          message: err.message,
          target: TARGET,
          path: req.url,
        })
      );
    },
  })
);

const server = https.createServer(
  {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  },
  app
);

server.listen(PORT, () => {
  console.log(`[LEGACY-HTTPS-PROXY] Listening on https://localhost:${PORT}`);
  console.log(`[LEGACY-HTTPS-PROXY] Forwarding to ${TARGET}`);
});
