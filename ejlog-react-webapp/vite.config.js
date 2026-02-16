import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { mockAuthMiddleware } from './mock-auth.js'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const EJLOG_HTTP_TARGET =
    env.EJLOG_HTTP_TARGET || env.VITE_EJLOG_HTTP_TARGET || 'http://localhost:3077';
  const EJLOG_HTTPS_TARGET =
    env.EJLOG_HTTPS_TARGET || env.VITE_EJLOG_HTTPS_TARGET || 'https://localhost:3079';

  return {
  plugins: [
    react(),
    mockAuthMiddleware(), // Mock authentication for dev mode
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'EjLog WMS',
        short_name: 'EjLog',
        description: 'Sistema di gestione magazzino automatizzato',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Cache strategies for different asset types
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: parseInt(process.env.PORT) || 3000,
    proxy: {
      // ========================================================================
      // PROXY SPECIFICO PER BACKEND JAVA - PRIORITÀ MASSIMA
      // Questa regola DEVE essere PRIMA di '/api' per intercettare
      // richieste come /api/EjLogHostVertimag/Stock e inoltrarle a 7077
      // ========================================================================

      // Proxy per /api/adapter/* → Backend Node.js api-server.js su porta 7077 (Adapter EjLog Integrato)
      // IMPORTANTE: Questo proxy fornisce accesso all'adapter EjLog completamente integrato in Node.js
      //             Endpoint: GET /api/adapter/version, GET /api/adapter/items, POST /api/adapter/items/:id/pick, etc.
      '/api/adapter': {
        target: EJLOG_HTTP_TARGET,
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('[PROXY-ADAPTER] Request:', req.method, req.url, '→ http://localhost:7077');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('[PROXY-ADAPTER] Response:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err, req, res) => {
            console.error('[PROXY-ADAPTER] Error:', err.message);
            console.error('[PROXY-ADAPTER] Verifica che api-server.js sia attivo su porta 7077');
          });
        }
      },

      // Proxy per adapter .NET EjLog ufficiale (porta 9000)
      '/api/ejlog-adapter': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/ejlog-adapter/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('[PROXY-EJLOG-DOTNET] Request:', req.method, req.url, '-> http://localhost:9000');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('[PROXY-EJLOG-DOTNET] Response:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err, req, res) => {
            console.error('[PROXY-EJLOG-DOTNET] Error:', err.message);
            console.error('[PROXY-EJLOG-DOTNET] Verifica che l\'adapter .NET sia attivo su porta 9000');
          });
        }
      },

      // Proxy per adapter .NET MAS ufficiale (porta 10000)
      '/api/mas-adapter': {
        target: 'http://localhost:10000',
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path.replace(/^\/api\/mas-adapter/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('[PROXY-MAS-DOTNET] Request:', req.method, req.url, '-> http://localhost:10000');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('[PROXY-MAS-DOTNET] Response:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err, req, res) => {
            console.error('[PROXY-MAS-DOTNET] Error:', err.message);
            console.error('[PROXY-MAS-DOTNET] Verifica che l\'adapter MAS sia attivo su porta 10000');
          });
        }
      },

      // Proxy per MAS Automation Service (porta 5000) - PPC UI
      '/api/mas-automation': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path.replace(/^\/api\/mas-automation/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('[PROXY-MAS-AUTOMATION] Request:', req.method, req.url, '-> http://localhost:5000');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('[PROXY-MAS-AUTOMATION] Response:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err, req, res) => {
            console.error('[PROXY-MAS-AUTOMATION] Error:', err.message);
            console.error('[PROXY-MAS-AUTOMATION] Verifica che MAS Automation Service sia attivo su porta 5000');
          });
        }
      },

      // Proxy per /api/scheduler/* → Backend Node.js api-server.js su porta 7077 (Scheduler Service)
      // IMPORTANTE: Questo proxy fornisce accesso completo al servizio Scheduler
      //             Endpoint: GET /api/scheduler/status, POST /api/scheduler/start, etc.
      '/api/scheduler': {
        target: EJLOG_HTTP_TARGET,
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('[PROXY-SCHEDULER] Request:', req.method, req.url, '→ http://localhost:7077');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('[PROXY-SCHEDULER] Response:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err, req, res) => {
            console.error('[PROXY-SCHEDULER] Error:', err.message);
            console.error('[PROXY-SCHEDULER] Verifica che api-server.js sia attivo su porta 7077');
          });
        }
      },

      // Proxy per /api/ai-config/* → Backend Node.js api-server.js su porta 7077 (AI Config)
      // IMPORTANTE: Questo proxy fornisce accesso alla configurazione AI Assistant
      //             Endpoint: GET /api/ai-config, POST /api/ai-config/api-key, POST /api/ai-config/test
      '/api/ai-config': {
        target: EJLOG_HTTP_TARGET,
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('[PROXY-AI-CONFIG] Request:', req.method, req.url, '→ http://localhost:7077');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('[PROXY-AI-CONFIG] Response:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err, req, res) => {
            console.error('[PROXY-AI-CONFIG] Error:', err.message);
            console.error('[PROXY-AI-CONFIG] Verifica che api-server.js sia attivo su porta 7077');
          });
        }
      },

      // Proxy per /api/ai/* → Backend Node.js api-server.js su porta 7077 (AI Assistant Chat)
      // IMPORTANTE: Questo proxy fornisce accesso all'AI Assistant per chat e comandi
      //             Endpoint: POST /api/ai/chat, GET /api/ai/context, POST /api/ai/troubleshoot
      '/api/ai': {
        target: EJLOG_HTTP_TARGET,
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('[PROXY-AI] Request:', req.method, req.url, '→ http://localhost:7077');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('[PROXY-AI] Response:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err, req, res) => {
            console.error('[PROXY-AI] Error:', err.message);
            console.error('[PROXY-AI] Verifica che api-server.js sia attivo su porta 7077');
          });
        }
      },

      // Proxy per /api/events/* → Backend Node.js api-server.js su porta 8080 (Eventi REALI da SQL)
      // IMPORTANTE: Questo proxy fornisce dati REALI dal database SQL Server "promag"
      //             Endpoint: GET /api/events, GET /api/events/stats, GET /api/events/:id
      '/api/events': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('[PROXY-EVENTS] Request:', req.method, req.url, '→ http://localhost:7077');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('[PROXY-EVENTS] Response:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err, req, res) => {
            console.error('[PROXY-EVENTS] Error:', err.message);
            console.error('[PROXY-EVENTS] Verifica che api-server.js sia attivo su porta 7077');
          });
        }
      },

      // Proxy per /api/udc/* → Backend Node.js api-server.js su porta 7077 (UDC e Cassetti reali da SQL)
      // IMPORTANTE: Questo proxy fornisce dati REALI dal database SQL Server "promag"
      //             Endpoint: GET /api/udc, GET /api/udc/:id, GET /api/udc/:id/compartments
      '/api/udc': {
        target: EJLOG_HTTP_TARGET,
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('[PROXY-UDC] Request:', req.method, req.url, '→ http://localhost:7077');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('[PROXY-UDC] Response:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err, req, res) => {
            console.error('[PROXY-UDC] Error:', err.message);
            console.error('[PROXY-UDC] Verifica che api-server.js sia attivo su porta 7077');
          });
        }
      },

      // Proxy per /api/lists/* → Backend Node.js api-server.js su porta 7077 (Liste REALI da SQL)
      // IMPORTANTE: Questo proxy punta al backend Node.js con dati REALI dal database SQL Server "promag"
      //             Endpoint: GET /api/lists, GET /api/lists/:id, PUT /api/lists/:id/execute, POST /api/lists/:id/terminate, PUT /api/lists/:id/waiting
      '/api/lists': {
        target: EJLOG_HTTP_TARGET,
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('[PROXY-LISTS] Request:', req.method, req.url, '→ http://localhost:8080');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('[PROXY-LISTS] Response:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err, req, res) => {
            console.error('[PROXY-LISTS] Error:', err.message);
            console.error('[PROXY-LISTS] Verifica che api-server.js sia attivo su porta 8080');
          });
        }
      },

      // Proxy per /api/locations/* → Backend Node.js api-server.js su porta 7077 (Locations REALI da SQL)
      // IMPORTANTE: Questo proxy fornisce dati REALI dal database SQL Server "promag"
      //             Endpoint: GET /api/locations, GET /api/locations/:code
      '/api/locations': {
        target: EJLOG_HTTP_TARGET,
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('[PROXY-LOCATIONS] Request:', req.method, req.url, '→ http://localhost:8080');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('[PROXY-LOCATIONS] Response:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err, req, res) => {
            console.error('[PROXY-LOCATIONS] Error:', err.message);
            console.error('[PROXY-LOCATIONS] Verifica che api-server.js sia attivo su porta 8080');
          });
        }
      },

      // Proxy per /api/item-lists/* → Backend Node.js su porta 7077 (Liste Operations)
      // IMPORTANTE: Il backend REST API moderno espone direttamente /api/item-lists/*
      //             NON usare il prefisso /EjLogHostVertimag per questi endpoint
      //             Riferimento: ejlog-rest-backend (BACKEND su porta 7077)
      '/api/item-lists': {
        target: EJLOG_HTTP_TARGET,
        changeOrigin: true,
        secure: false,
        // NO REWRITE - il path /api/item-lists/* è già corretto per il backend REST API
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('[PROXY-ITEM-LISTS] Request:', req.method, req.url, '→', proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('[PROXY-ITEM-LISTS] Response:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err, req, res) => {
            console.error('[PROXY-ITEM-LISTS] Error:', err.message);
            console.error('[PROXY-ITEM-LISTS] Verifica che ItemListsApiController sia attivo su porta 8080');
          });
        }
      },

      // Proxy per /api/ListTemplates/* → Backend ejlog-rest-backend su porta 9000 (MOCK DATA)
      // IMPORTANTE: Questo endpoint usa DATI MOCK dal backend TypeScript ejlog-rest-backend
      //             Endpoint: GET /api/ListTemplates, POST /api/ListTemplates, etc.
      '/api/ListTemplates': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('[PROXY-LIST-TEMPLATES] Request:', req.method, req.url, '→ http://localhost:9000');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('[PROXY-LIST-TEMPLATES] Response:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err, req, res) => {
            console.error('[PROXY-LIST-TEMPLATES] Error:', err.message);
            console.error('[PROXY-LIST-TEMPLATES] Verifica che ejlog-rest-backend sia attivo su porta 9000');
          });
        }
      },

      // Proxy per /api/EjLogHostVertimag/Stock/* → Backend Node.js api-server.js su porta 7077 (Stock REALE da SQL)
      // IMPORTANTE: Questo proxy fornisce dati REALI dal database SQL Server "promag"
      //             Endpoint: GET /api/EjLogHostVertimag/Stock
      '/api/EjLogHostVertimag/Stock': {
        target: EJLOG_HTTP_TARGET,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),  // Remove /api prefix
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('[PROXY-STOCK] Request:', req.method, req.url, '→ http://localhost:7077');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('[PROXY-STOCK] Response:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err, req, res) => {
            console.error('[PROXY-STOCK] Error:', err.message);
            console.error('[PROXY-STOCK] Verifica che api-server.js sia attivo su porta 7077');
          });
        }
      },

      // Proxy per /api/EjLogHostVertimag/* → Backend Java su porta 7077
      // IMPORTANTE: Rimuove /api e inoltra a http://localhost:7077/EjLogHostVertimag/*
      '/api/EjLogHostVertimag': {
        target: EJLOG_HTTP_TARGET,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Map 'take' parameter to 'limit' for backend compatibility
            if (req.url.includes('take=')) {
              req.url = req.url.replace(/([?&])take=/g, '$1limit=');
              proxyReq.path = req.url;
            }
            console.log('[PROXY-EJLOG] Request:', req.method, req.url, '→ http://localhost:8080');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('[PROXY-EJLOG] Response:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err, req, res) => {
            console.error('[PROXY-EJLOG] Error:', err.message);
            console.error('⚠️  Assicurati che ejlog-rest-backend sia in esecuzione su porta 8080');
          });
        }
      },

      // ========================================================================
      // PROXY API PRINCIPALE - Backend Node.js su porta 7077 (PRIORITÀ)
      // Frontend calls: /api/* → Backend Node.js proxy-api.js
      // Backend exposes: http://localhost:7077/api/*
      // ========================================================================

      // Proxy per chiamate /api/* → Backend Java su porta 7077
      // IMPORTANTE: Il backend Java usa /EjLogHostVertimag come base path
      // Esempio: Frontend chiama /api/item-lists/search → Backend riceve /EjLogHostVertimag/api/item-lists/search
      // NOTA: /api/scheduler/* è gestito da un proxy dedicato sopra, non passa da qui
      '/api': {
        target: EJLOG_HTTP_TARGET,
        changeOrigin: true,
        secure: false,
        // Bypass: Non processare richieste scheduler/adapter, sono gestite dai proxy dedicati
        bypass: function(req, res, options) {
          if (req.url.startsWith('/api/scheduler') || req.url.startsWith('/api/adapter')) {
            return req.url; // Lascia passare ai proxy dedicati
          }
        },
        // REWRITE: Rimuove /api per gli endpoint EjLogHostVertimag
        rewrite: (path) => {
          // Skip scheduler/adapter endpoints - gestiti da proxy dedicati
          if (path.startsWith('/api/scheduler') || path.startsWith('/api/adapter')) {
            return path; // Non riscrivere, lascia gestire ai proxy dedicati
          }
          // Se il path contiene già /EjLogHostVertimag, rimuovi solo /api
          if (path.includes('/EjLogHostVertimag')) {
            return path.replace(/^\/api/, '');
          }
          // Altrimenti lascia il path così com'è
          return path;
        },
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Aggiungi header Accept per evitare 406 Not Acceptable
            proxyReq.setHeader('Accept', 'application/json');

            // E2E Fix: Enhanced logging for debugging
            const rewrittenPath = req.url.replace(/^\/api/, '/EjLogHostVertimag');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('[PROXY-API] 📤 OUTGOING REQUEST');
            console.log('  Method:      ', req.method);
            console.log('  Original:    ', req.url);
            console.log('  Rewritten:   ', rewrittenPath);
            console.log('  Target:      ', `http://localhost:7077${rewrittenPath}`);
            console.log('  Headers:     ', JSON.stringify(req.headers, null, 2));
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('[PROXY-API] 📥 INCOMING RESPONSE');
            console.log('  URL:         ', req.url);
            console.log('  Status:      ', proxyRes.statusCode, proxyRes.statusMessage);
            console.log('  Content-Type:', proxyRes.headers['content-type']);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          });
          proxy.on('error', (err, req, res) => {
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('[PROXY-API] ❌ ERROR');
            console.error('  URL:         ', req.url);
            console.error('  Error:       ', err.message);
            console.error('  Stack:       ', err.stack);
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('⚠️  IMPORTANTE: Assicurati che il backend Java sia in esecuzione su porta 7077');
            console.error('    Backend base path: /EjLogHostVertimag');
            console.error('    Verifica con: curl http://localhost:7077/EjLogHostVertimag/User');
          });
        }
      },

      // ========================================================================
      // BACKEND REALE SU porta 7077 - EjLog MainProgram (COMMENTATO)
      // ⚠️ Decommentare quando il backend Java sarà ricompilato
      // ========================================================================

      // Proxy for /api API endpoints to backend on port 7077 (EjLog REST Server)
      // '/api': {
      //   target: EJLOG_HTTP_TARGET,
      //   changeOrigin: true,
      //   secure: false,
      //   rewrite: (path) => path.replace(/^\/api/, ''),
      //   configure: (proxy, options) => {
      //     proxy.on('proxyReq', (proxyReq, req, res) => {
      //       // Map 'take' parameter to 'limit' for backend compatibility
      //       if (req.url.includes('take=')) {
      //         req.url = req.url.replace(/([?&])take=/g, '$1limit=');
      //         proxyReq.path = req.url;
      //       }
      //       console.log('[PROXY] Request:', req.method, req.url);
      //     });
      //     proxy.on('proxyRes', (proxyRes, req, res) => {
      //       console.log('[PROXY] Response:', proxyRes.statusCode, req.url);
      //     });
      //     proxy.on('error', (err, req, res) => {
      //       console.error('[PROXY] Error:', err.message);
      //     });
      //   }
      // },
      // Legacy /EjLogHostVertimag proxy for backwards compatibility (HTTPS JWT)
      '/EjLogHostVertimag': {
        target: EJLOG_HTTPS_TARGET,
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Map 'take' parameter to 'limit' for backend compatibility
            if (req.url.includes('take=')) {
              req.url = req.url.replace(/([?&])take=/g, '$1limit=');
              proxyReq.path = req.url;
            }
            console.log('[PROXY-LEGACY] Request:', req.method, req.url);
          });
          proxy.on('error', (err, req, res) => {
            console.error('[PROXY-LEGACY] Error:', err.message);
          });
        }
      }
    }
  },
  build: {
    // Target modern browsers for smaller bundle size
    target: 'es2015',
    // Increase chunk size warning limit (default is 500kB)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunks strategy for optimal code splitting
        manualChunks: (id) => {
          // React core libraries - loaded on every page
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-is') ||
              id.includes('node_modules/scheduler')) {
            return 'vendor-react';
          }

          // React Router - loaded on every page for navigation
          if (id.includes('node_modules/react-router-dom') ||
              id.includes('node_modules/react-router') ||
              id.includes('node_modules/@remix-run')) {
            return 'vendor-router';
          }

          // UI libraries - icons and components used across the app
          if (id.includes('node_modules/lucide-react') ||
              id.includes('node_modules/@headlessui/react') ||
              id.includes('node_modules/@heroicons/react')) {
            return 'vendor-ui';
          }

          // Date utilities - used in multiple report pages
          if (id.includes('node_modules/date-fns')) {
            return 'vendor-date';
          }

          // Tables library - used only in reports pages
          if (id.includes('node_modules/@tanstack/react-table') ||
              id.includes('node_modules/@tanstack/table-core')) {
            return 'vendor-table';
          }

          // Charts library - lazy loaded only for reports with charts
          if (id.includes('node_modules/recharts')) {
            return 'vendor-recharts';
          }

          // Export/PDF libraries - lazy loaded only when exporting
          if (id.includes('node_modules/jspdf') ||
              id.includes('node_modules/jspdf-autotable') ||
              id.includes('node_modules/html2canvas')) {
            return 'vendor-pdf';
          }

          // CSV export library - lazy loaded only when exporting to CSV
          if (id.includes('node_modules/papaparse')) {
            return 'vendor-csv';
          }

          // Excel export library - lazy loaded only when exporting to Excel
          if (id.includes('node_modules/xlsx')) {
            return 'vendor-excel';
          }

          // React Query - used across the app for data fetching
          if (id.includes('node_modules/@tanstack/react-query') ||
              id.includes('node_modules/@tanstack/query-core')) {
            return 'vendor-query';
          }

          // Redux Toolkit - state management (can be removed in future)
          if (id.includes('node_modules/@reduxjs/toolkit') ||
              id.includes('node_modules/redux') ||
              id.includes('node_modules/react-redux') ||
              id.includes('node_modules/reselect')) {
            return 'vendor-redux';
          }

          // Zustand - lightweight state management
          if (id.includes('node_modules/zustand')) {
            return 'vendor-zustand';
          }

          // Form libraries
          if (id.includes('node_modules/react-hook-form') ||
              id.includes('node_modules/@hookform')) {
            return 'vendor-forms';
          }

          // Barcode/QR libraries - lazy loaded when scanning
          if (id.includes('node_modules/html5-qrcode') ||
              id.includes('node_modules/qrcode') ||
              id.includes('node_modules/jsqr')) {
            return 'vendor-qr';
          }

          // Toast notifications
          if (id.includes('node_modules/react-hot-toast')) {
            return 'vendor-toast';
          }

          // Utilities (lodash, clsx, etc)
          if (id.includes('node_modules/lodash') ||
              id.includes('node_modules/clsx') ||
              id.includes('node_modules/classnames') ||
              id.includes('node_modules/tailwind-merge')) {
            return 'vendor-utils';
          }

          // All other node_modules - generic vendor chunk (should be much smaller now)
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
        },
        // Asset file naming with content hash for cache busting
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff2?|ttf|otf|eot/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        // Chunk file naming with content hash
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    // Source maps for production debugging (hidden for security)
    sourcemap: 'hidden',
    // Minification settings - using terser for better compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2, // Run compression multiple times for better results
      },
      mangle: {
        safari10: true, // Safari 10 compatibility
      },
      format: {
        comments: false, // Remove all comments
      },
    },
  },
  };
})



