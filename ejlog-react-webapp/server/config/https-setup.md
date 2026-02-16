# HTTPS Configuration Guide - EjLog WMS

Guida completa per configurare HTTPS in production per l'applicazione EjLog WMS.

## Indice

1. [Prerequisiti](#prerequisiti)
2. [Generazione Certificati SSL](#generazione-certificati-ssl)
3. [Configurazione Node.js Server](#configurazione-nodejs-server)
4. [Configurazione Nginx Reverse Proxy](#configurazione-nginx-reverse-proxy)
5. [Auto-Renewal con Let's Encrypt](#auto-renewal-con-lets-encrypt)
6. [Testing e Troubleshooting](#testing-e-troubleshooting)

---

## Prerequisiti

- Dominio pubblico (es: `ejlog.ferretto.it`)
- Server con IP pubblico
- Porte 80 e 443 aperte sul firewall
- Node.js 18+ installato
- (Opzionale) Nginx installato per reverse proxy

---

## Generazione Certificati SSL

### Opzione 1: Let's Encrypt (Consigliato per Production)

Let's Encrypt fornisce certificati SSL gratuiti e automatici.

#### Installazione Certbot

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot

# CentOS/RHEL
sudo yum install certbot

# Windows (usa WSL o scarica da certbot.eff.org)
```

#### Generazione Certificato

```bash
# Standalone mode (porta 80 libera)
sudo certbot certonly --standalone -d ejlog.ferretto.it

# Webroot mode (con server web esistente)
sudo certbot certonly --webroot -w /var/www/html -d ejlog.ferretto.it
```

Certificati generati in:
- Certificato: `/etc/letsencrypt/live/ejlog.ferretto.it/fullchain.pem`
- Chiave privata: `/etc/letsencrypt/live/ejlog.ferretto.it/privkey.pem`

### Opzione 2: Certificati Self-Signed (Solo Development/Testing)

```bash
# Genera chiave privata
openssl genrsa -out server-key.pem 2048

# Genera Certificate Signing Request (CSR)
openssl req -new -key server-key.pem -out server-csr.pem \
  -subj "/C=IT/ST=Vicenza/L=Montecchio/O=Ferretto/CN=ejlog.ferretto.local"

# Genera certificato self-signed (valido 365 giorni)
openssl x509 -req -days 365 -in server-csr.pem \
  -signkey server-key.pem -out server-cert.pem

# Rimuovi CSR (non più necessario)
rm server-csr.pem
```

Salva i file in: `server/config/ssl/`

---

## Configurazione Node.js Server

### Crea file HTTPS server

**File**: `server/https-server.js`

```javascript
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './api-server.js'; // Import Express app

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione HTTPS
const HTTPS_PORT = process.env.HTTPS_PORT || 7078;
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || '/etc/letsencrypt/live/ejlog.ferretto.it/fullchain.pem';
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || '/etc/letsencrypt/live/ejlog.ferretto.it/privkey.pem';

// Opzioni HTTPS
const httpsOptions = {
  key: fs.readFileSync(SSL_KEY_PATH),
  cert: fs.readFileSync(SSL_CERT_PATH),

  // Security options
  honorCipherOrder: true,
  minVersion: 'TLSv1.2',
  ciphers: [
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES128-SHA256',
    'ECDHE-RSA-AES256-SHA384'
  ].join(':')
};

// Crea server HTTPS
const httpsServer = https.createServer(httpsOptions, app);

// Avvia server
httpsServer.listen(HTTPS_PORT, () => {
  console.log(`🔒 HTTPS Server running on port ${HTTPS_PORT}`);
  console.log(`🔒 https://localhost:${HTTPS_PORT}`);
});

// Gestione errori
httpsServer.on('error', (error) => {
  if (error.code === 'EACCES') {
    console.error(`❌ Porta ${HTTPS_PORT} richiede privilegi elevati`);
  } else if (error.code === 'EADDRINUSE') {
    console.error(`❌ Porta ${HTTPS_PORT} già in uso`);
  } else {
    console.error('❌ Errore HTTPS server:', error);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM ricevuto, chiusura HTTPS server...');
  httpsServer.close(() => {
    console.log('HTTPS server chiuso');
    process.exit(0);
  });
});

export default httpsServer;
```

### Modifica package.json

```json
{
  "scripts": {
    "start": "node server/api-server.js",
    "start:https": "node server/https-server.js",
    "start:prod": "NODE_ENV=production node server/https-server.js"
  }
}
```

### Environment Variables

**File**: `.env.production`

```bash
# Server Configuration
NODE_ENV=production
PORT=3077
HTTPS_PORT=7078

# SSL Certificates
SSL_CERT_PATH=/etc/letsencrypt/live/ejlog.ferretto.it/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/ejlog.ferretto.it/privkey.pem

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-token-secret-different-from-access

# Database
DB_SERVER=localhost
DB_NAME=promag
DB_USER=ejlog_user
DB_PASSWORD=secure_password_here
```

---

## Configurazione Nginx Reverse Proxy

### Installazione Nginx

```bash
# Ubuntu/Debian
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx

# Avvia e abilita all'avvio
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Configurazione Nginx

**File**: `/etc/nginx/sites-available/ejlog`

```nginx
# HTTP → HTTPS redirect
server {
    listen 80;
    server_name ejlog.ferretto.it;

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name ejlog.ferretto.it;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/ejlog.ferretto.it/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ejlog.ferretto.it/privkey.pem;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;

    # HSTS (HTTP Strict Transport Security)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Proxy to Node.js Backend
    location /api/ {
        proxy_pass http://localhost:3077;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Frontend Static Files
    location / {
        root /var/www/ejlog/dist;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Error pages
    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

### Abilita configurazione

```bash
# Symlink a sites-enabled
sudo ln -s /etc/nginx/sites-available/ejlog /etc/nginx/sites-enabled/

# Test configurazione
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Auto-Renewal con Let's Encrypt

### Configura Renewal automatico

```bash
# Test renewal (dry-run)
sudo certbot renew --dry-run

# Certbot aggiunge automaticamente cron job
# Verifica:
sudo cat /etc/cron.d/certbot

# Output:
# 0 */12 * * * root certbot renew --quiet --deploy-hook "systemctl reload nginx"
```

### Hook per reload automatico

**File**: `/etc/letsencrypt/renewal-hooks/deploy/reload-services.sh`

```bash
#!/bin/bash
# Reload services dopo rinnovo certificato

echo "Certificato rinnovato, reload services..."

# Reload Nginx
systemctl reload nginx

# Restart Node.js (se usa HTTPS direttamente)
# systemctl restart ejlog-api

echo "Services reloaded successfully"
```

```bash
# Rendi eseguibile
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-services.sh
```

---

## Testing e Troubleshooting

### Test SSL Configuration

```bash
# Test con curl
curl -I https://ejlog.ferretto.it

# Test con OpenSSL
openssl s_client -connect ejlog.ferretto.it:443 -servername ejlog.ferretto.it

# Test SSL Labs (online)
# https://www.ssllabs.com/ssltest/analyze.html?d=ejlog.ferretto.it
```

### Verifica Certificato

```bash
# Check expiration
sudo certbot certificates

# Output:
# Certificate Name: ejlog.ferretto.it
#   Domains: ejlog.ferretto.it
#   Expiry Date: 2025-03-09 (89 days)
#   Certificate Path: /etc/letsencrypt/live/ejlog.ferretto.it/fullchain.pem
#   Private Key Path: /etc/letsencrypt/live/ejlog.ferretto.it/privkey.pem
```

### Common Issues

#### Porta 443 non accessibile
```bash
# Verifica firewall
sudo ufw status
sudo ufw allow 443/tcp

# SELinux (CentOS/RHEL)
sudo semanage port -a -t http_port_t -p tcp 443
```

#### Certificato non trusted (self-signed)
```bash
# Aggiungi eccezione browser
# O usa certificato Let's Encrypt per production
```

#### Nginx 502 Bad Gateway
```bash
# Verifica Node.js server running
pm2 status

# Check logs
sudo tail -f /var/log/nginx/error.log
pm2 logs api-server
```

---

## Systemd Service (Production)

**File**: `/etc/systemd/system/ejlog-api.service`

```ini
[Unit]
Description=EjLog API Server
After=network.target

[Service]
Type=simple
User=ejlog
WorkingDirectory=/opt/ejlog
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server/api-server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=ejlog-api

[Install]
WantedBy=multi-user.target
```

```bash
# Enable e start service
sudo systemctl enable ejlog-api
sudo systemctl start ejlog-api
sudo systemctl status ejlog-api
```

---

## Checklist Production

- [ ] Certificato SSL installato (Let's Encrypt)
- [ ] Nginx configurato come reverse proxy
- [ ] HTTP → HTTPS redirect attivo
- [ ] Security headers configurati
- [ ] Auto-renewal certificati configurato
- [ ] Firewall porte 80/443 aperte
- [ ] HSTS header abilitato
- [ ] SSL Labs test A+ rating
- [ ] Environment variables production configurate
- [ ] Systemd service configurato
- [ ] Monitoring e logging attivi

---

## Risorse Utili

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [SSL Labs Test](https://www.ssllabs.com/ssltest/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Node.js HTTPS Module](https://nodejs.org/api/https.html)

---

**Autore**: Elio (Full-Stack Architect)
**Data**: 2025-12-09
**Versione**: 1.0.0

