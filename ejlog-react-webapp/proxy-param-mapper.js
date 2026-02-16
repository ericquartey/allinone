// Middleware to map 'take' parameter to 'limit' for backend compatibility
export function createParamMapper() {
  return (proxyReq, req, res) => {
    if (req.url && req.url.includes('take=')) {
      const originalUrl = req.url;
      req.url = req.url.replace(/([?&])take=/g, '$1limit=');
      proxyReq.path = req.url;
      console.log('[PROXY-MAPPER] Mapped:', originalUrl, '->', req.url);
    }
  };
}
