const { createProxyMiddleware } = require('http-proxy-middleware');

// This will be your Render backend URL
const API_URL = process.env.RENDER_BACKEND_URL || 'https://your-render-app.onrender.com';

module.exports = (req, res) => {
  // Create proxy middleware
  const apiProxy = createProxyMiddleware({
    target: API_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api': ''  // Remove /api prefix when forwarding to backend
    },
    onProxyReq: (proxyReq) => {
      // Add any required headers here
      proxyReq.setHeader('x-forwarded-proto', 'https');
    }
  });

  // Handle the proxy request
  return apiProxy(req, res, (err) => {
    if (err) {
      console.error('Proxy error:', err);
      res.status(500).json({ error: 'Proxy error', details: err.message });
    }
  });
};
