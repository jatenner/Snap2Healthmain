const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

// Skip showing the emergency pages
const SKIP_EMERGENCY = true;

// Create the Next.js app
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = 4000;

// Prepare the app
app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;
    
    // Skip all emergency pages and redirects
    if (SKIP_EMERGENCY && (
      pathname === '/reset.html' || 
      pathname === '/reset-all.html' || 
      pathname === '/emergency-reset' ||
      pathname === '/auth-reset.html' ||
      pathname === '/clear-cache.html' ||
      pathname === '/fix-typing'
    )) {
      // Redirect to main app
      res.writeHead(302, { Location: '/' });
      res.end();
      return;
    }
    
    // Handle normal pages
    handle(req, res, parsedUrl);
  }).listen(PORT, (err) => {
    if (err) throw err;
    console.log(`
======================================================
  SNAP2HEALTH DIRECT TEST SERVER
======================================================
🌐 Test server running at: http://localhost:${PORT}
⚠️ This server skips all emergency pages and redirects
======================================================
    `);
  });
}); 