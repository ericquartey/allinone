/**
 * Legacy Port Proxy
 * Keeps port 7077 available for external adapters by forwarding to 3077.
 */

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

const TARGET = process.env.LEGACY_PROXY_TARGET || 'http://localhost:3077';
const PORT = Number(process.env.LEGACY_PROXY_PORT) || 7077;

app.use((req, _res, next) => {
  console.log(`[LEGACY-PROXY] ${req.method} ${req.url} -> ${TARGET}`);
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
      console.error('[LEGACY-PROXY] Error:', err.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Legacy proxy error',
          message: err.message,
          target: TARGET,
          path: req.url,
        })
      );
    },
  })
);

app.listen(PORT, () => {
  console.log(`[LEGACY-PROXY] Listening on http://localhost:${PORT}`);
  console.log(`[LEGACY-PROXY] Forwarding to ${TARGET}`);
});
