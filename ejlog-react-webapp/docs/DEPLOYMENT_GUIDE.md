# 🚀 EjLog WMS - Deployment Guide

**Version:** 1.0.0 (Phase 1)
**Last Updated:** 2025-11-27
**Target:** DevOps, System Administrators

---

## 📑 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Build Process](#build-process)
4. [Deployment Options](#deployment-options)
5. [Production Checklist](#production-checklist)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

**Server:**
- **CPU:** 2+ cores recommended
- **RAM:** 4GB minimum, 8GB recommended
- **Disk:** 10GB free space
- **OS:** Windows Server 2016+, Linux (Ubuntu 20.04+, CentOS 7+)

**Software:**
- **Node.js:** v18.x or v20.x (LTS)
- **npm:** v9.x or higher
- **Java:** JDK 8 or 11 (for backend)
- **Web Server:** Nginx 1.20+ or Apache 2.4+
- **Browser Support:** Chrome 90+, Firefox 88+, Edge 90+, Safari 14+

### Backend Requirements

Il backend Java EjLog WMS deve essere running:

- **REST API:** Port 3077 (primary)
- **Host Vertimag:** Port 3079 (machine communication)
- **Web Admin:** Port 8080 (administrative interface)

### Network Requirements

- **Inbound:** Port 80 (HTTP), 443 (HTTPS)
- **Outbound:** Access to backend ports (3077, 3079, 8080)
- **Firewall:** Allow communication between frontend and backend

---

## Environment Configuration

### Environment Variables

Create `.env.production` file in project root:

```bash
# Backend API URL
VITE_API_BASE_URL=http://your-backend-server:3077/api

# Application Mode
VITE_APP_ENV=production

# Feature Flags
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false

# Analytics (optional)
VITE_GA_TRACKING_ID=UA-XXXXXXXXX-X

# Sentry Error Tracking (optional)
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### Backend Integration

Configure backend endpoint in `src/config/api.ts`:

```typescript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3077/api';
```

### CORS Configuration

**Backend (Java/Spring)** must allow frontend origin:

```java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                    .allowedOrigins("http://your-frontend-domain.com")
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true);
            }
        };
    }
}
```

---

## Build Process

### Development Build

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Access at http://localhost:3005
```

### Production Build

```bash
# Install dependencies (production only)
npm ci --production=false

# Build for production
npm run build

# Output in ./dist directory
```

**Build output:**
```
dist/
├── assets/
│   ├── index-[hash].js       # Main bundle
│   ├── vendor-[hash].js      # Vendor chunk (React, Redux)
│   ├── [page]-[hash].js      # Lazy-loaded page chunks
│   └── index-[hash].css      # Stylesheets
├── index.html
├── manifest.json             # PWA manifest
└── service-worker.js         # Service worker
```

### Build Optimization

Vite automatically:
- ✅ Code splitting (route-based)
- ✅ Tree shaking (dead code elimination)
- ✅ Minification (Terser)
- ✅ Asset optimization (images, fonts)
- ✅ Cache busting (content hash in filenames)

### Bundle Analysis

```bash
# Analyze bundle size
npm run build -- --mode analyze

# View report at http://localhost:8888
```

---

## Deployment Options

### Option 1: Nginx (Recommended)

#### Install Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

#### Configure Nginx

Create `/etc/nginx/sites-available/ejlog-wms`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Root directory
    root /var/www/ejlog-wms/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/javascript application/javascript application/json;

    # Cache static assets
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker (no cache)
    location = /service-worker.js {
        expires off;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://backend-server:3077;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA fallback (all routes -> index.html)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

#### Enable & Start

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/ejlog-wms /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Option 2: Apache

Create `/etc/apache2/sites-available/ejlog-wms.conf`:

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/ejlog-wms/dist

    <Directory /var/www/ejlog-wms/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # SPA fallback
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # Proxy API requests
    ProxyPass /api http://backend-server:3077/api
    ProxyPassReverse /api http://backend-server:3077/api

    # Compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
    </IfModule>

    # Caching
    <IfModule mod_expires.c>
        ExpiresActive On
        ExpiresByType image/* "access plus 1 year"
        ExpiresByType text/css "access plus 1 year"
        ExpiresByType application/javascript "access plus 1 year"
    </IfModule>
</VirtualHost>
```

### Option 3: Docker

#### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose

```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "80:80"
    environment:
      - VITE_API_BASE_URL=http://backend:3077/api
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    image: ejlog-wms-backend:latest
    ports:
      - "3077:3077"
      - "3079:3079"
      - "8080:8080"
    restart: unless-stopped
```

#### Build & Run

```bash
# Build image
docker build -t ejlog-wms-frontend:1.0.0 .

# Run container
docker run -d -p 80:80 --name ejlog-wms ejlog-wms-frontend:1.0.0

# Or use docker-compose
docker-compose up -d
```

---

## Production Checklist

### Pre-Deployment

- [ ] **Environment variables configured** (.env.production)
- [ ] **Backend API accessible** (test endpoints)
- [ ] **CORS configured** on backend
- [ ] **SSL certificate** installed (HTTPS)
- [ ] **Build successful** (npm run build)
- [ ] **Bundle size acceptable** (<1.5MB total)
- [ ] **Tests passing** (npm run test)

### Security

- [ ] **HTTPS enabled** (SSL/TLS certificate)
- [ ] **Security headers** configured (nginx/apache)
- [ ] **API authentication** working (JWT tokens)
- [ ] **CORS restricted** to frontend domain only
- [ ] **CSP policy** configured (Content Security Policy)
- [ ] **Sensitive data** not exposed in client
- [ ] **Error messages** sanitized (no stack traces)

### Performance

- [ ] **Gzip compression** enabled
- [ ] **Static asset caching** (1 year)
- [ ] **Service worker** registered (PWA)
- [ ] **Lazy loading** working (route-based)
- [ ] **CDN configured** (optional, for static assets)
- [ ] **Load testing** completed (concurrent users)

### Monitoring

- [ ] **Error tracking** configured (Sentry/Bugsnag)
- [ ] **Analytics** configured (Google Analytics)
- [ ] **Performance monitoring** (Web Vitals)
- [ ] **Uptime monitoring** (Pingdom/UptimeRobot)
- [ ] **Log aggregation** (Elasticsearch/CloudWatch)

---

## Monitoring & Maintenance

### Health Checks

**Frontend health endpoint:**
```bash
curl http://your-domain.com/
# Should return 200 OK
```

**Backend health endpoint:**
```bash
curl http://backend:3077/api/health
# Should return {"status": "UP"}
```

### Log Locations

**Nginx logs:**
```bash
# Access log
/var/log/nginx/access.log

# Error log
/var/log/nginx/error.log
```

**Application logs (browser):**
- Chrome DevTools → Console
- Sentry dashboard (if configured)

### Performance Monitoring

**Web Vitals (Google PageSpeed):**
```bash
# Check performance
https://pagespeed.web.dev/

# Lighthouse CLI
npx lighthouse http://your-domain.com --view
```

**Bundle analysis:**
```bash
npm run build -- --mode analyze
```

### Updates & Patches

**Update procedure:**
```bash
# 1. Backup current version
cp -r /var/www/ejlog-wms /var/www/ejlog-wms-backup

# 2. Pull latest code
git pull origin main

# 3. Install dependencies
npm ci

# 4. Build
npm run build

# 5. Deploy
cp -r dist/* /var/www/ejlog-wms/dist/

# 6. Clear service worker cache
# (users will get update on next visit)

# 7. Test
curl http://your-domain.com/
```

---

## Troubleshooting

### Common Issues

#### "Page shows 404"

**Cause:** Nginx/Apache not configured for SPA routing

**Solution:**
- Verify `try_files` directive in nginx config
- Verify `RewriteRule` in apache config
- Ensure fallback to `index.html`

#### "API calls fail with CORS error"

**Cause:** Backend not allowing frontend origin

**Solution:**
- Check backend CORS configuration
- Verify `Access-Control-Allow-Origin` header
- Use proxy configuration in nginx/apache

#### "Service Worker not updating"

**Cause:** Aggressive caching

**Solution:**
```bash
# Force clear service worker cache
# In browser console:
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(r => r.unregister());
});
caches.keys().then(keys => {
  keys.forEach(k => caches.delete(k));
});
```

#### "Build fails with memory error"

**Cause:** Insufficient Node.js memory

**Solution:**
```bash
# Increase Node.js memory
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

### Performance Issues

#### "Slow initial load"

**Solutions:**
- Enable gzip compression
- Configure CDN for static assets
- Check bundle size with analyzer
- Verify HTTP/2 enabled

#### "High memory usage"

**Solutions:**
- Disable auto-refresh on large datasets
- Implement virtual scrolling for long lists
- Clear RTK Query cache periodically

---

## Rollback Procedure

If deployment fails:

```bash
# 1. Stop web server
sudo systemctl stop nginx

# 2. Restore previous version
rm -rf /var/www/ejlog-wms/dist
cp -r /var/www/ejlog-wms-backup/dist /var/www/ejlog-wms/

# 3. Start web server
sudo systemctl start nginx

# 4. Verify
curl http://your-domain.com/
```

---

## Support & Contacts

**DevOps Support:**
- 📧 Email: devops@ejlog.com
- 💬 Slack: #ejlog-deployments
- 📚 Internal Wiki: https://wiki.ejlog.com/deployment

**On-Call:**
- 📞 Phone: +39 123 456 7890 (24/7)

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-27
**Maintained by:** EjLog DevOps Team

