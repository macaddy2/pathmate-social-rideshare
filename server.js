import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const DIST_DIR = join(__dirname, 'dist');
const INDEX_HTML = join(DIST_DIR, 'index.html');
const GEMINI_MAX_BODY_BYTES = 64 * 1024;
const GEMINI_RATE_WINDOW_MS = 60 * 1000;
const GEMINI_RATE_LIMIT = 30;
const geminiRateBuckets = new Map();
const allowedFrontendOrigins = new Set(
  (process.env.PATHMATE_FRONTEND_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);
let geminiClient;

if (!existsSync(INDEX_HTML)) {
  console.error(`[server] Missing ${INDEX_HTML} — run "npm run build" before starting.`);
  process.exit(1);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.webp': 'image/webp',
};

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

function isAllowedFrontendOrigin(origin) {
  if (!origin) return true;
  return allowedFrontendOrigins.has(origin);
}

function applyCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (origin && isAllowedFrontendOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;

    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      size += Buffer.byteLength(chunk);
      if (size > GEMINI_MAX_BODY_BYTES) {
        reject(new Error('request_too_large'));
        req.resume();
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      if (size > GEMINI_MAX_BODY_BYTES) return;
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        reject(new Error('invalid_json'));
      }
    });
    req.on('error', () => reject(new Error('request_read_failed')));
  });
}

function getRateBucket(req) {
  const address = req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const current = geminiRateBuckets.get(address);
  if (!current || now - current.startedAt >= GEMINI_RATE_WINDOW_MS) {
    const next = { startedAt: now, count: 1 };
    geminiRateBuckets.set(address, next);
    return next;
  }
  current.count += 1;
  return current;
}

function stringInput(value, field, maxLength, required = true) {
  if (typeof value !== 'string') {
    if (!required && (value === undefined || value === null)) return '';
    throw new Error(`invalid_${field}`);
  }
  const result = value.trim();
  if (required && !result) throw new Error(`invalid_${field}`);
  if (result.length > maxLength) throw new Error(`invalid_${field}`);
  return result;
}

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error('gemini_not_configured');
  geminiClient ||= new GoogleGenAI({ apiKey });
  return geminiClient;
}

async function handleGeminiRequest(req, res) {
  applyCorsHeaders(req, res);
  const origin = req.headers.origin;

  if (!isAllowedFrontendOrigin(origin)) {
    sendJson(res, 403, { error: 'origin_not_allowed' });
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method_not_allowed' });
    return;
  }

  const bucket = getRateBucket(req);
  if (bucket.count > GEMINI_RATE_LIMIT) {
    sendJson(res, 429, { error: 'rate_limited' });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    sendJson(res, error.message === 'request_too_large' ? 413 : 400, { error: error.message });
    return;
  }

  try {
    const ai = getGeminiClient();
    let response;

    switch (body.operation) {
      case 'analyzeAppFeasibility': {
        const prompt = stringInput(body.prompt, 'prompt', 8000);
        response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: prompt,
          config: { thinkingConfig: { thinkingBudget: 32768 } },
        });
        break;
      }
      case 'getComplexCoordinationAdvice': {
        const chatHistory = stringInput(body.chatHistory, 'chatHistory', 8000, false);
        const query = stringInput(body.query, 'query', 4000);
        response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: `Context: You are PathMate AI, a smart carpooling assistant.\nRecent Chat History: ${chatHistory}\nUser Query: ${query}\n\nTask: Provide a detailed, thoughtful solution to this complex coordination problem. Think through logistical constraints like vehicle size, traffic, and safety.`,
          config: { thinkingConfig: { thinkingBudget: 32768 } },
        });
        break;
      }
      case 'getRouteInsights': {
        const origin = stringInput(body.origin, 'origin', 500);
        const destination = stringInput(body.destination, 'destination', 500);
        const hasCoordinates = body.lat !== undefined || body.lng !== undefined;
        if (hasCoordinates && (!Number.isFinite(body.lat) || !Number.isFinite(body.lng) || body.lat < -90 || body.lat > 90 || body.lng < -180 || body.lng > 180)) {
          throw new Error('invalid_coordinates');
        }
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-latest',
          contents: `I am planning a trip from ${origin} to ${destination}. Suggest some safe meetup points, popular landmarks, and top-rated restaurants near these locations. Check current local traffic conditions or area safety if possible.`,
          config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
              retrievalConfig: {
                latLng: hasCoordinates ? { latitude: body.lat, longitude: body.lng } : undefined,
              },
            },
          },
        });
        break;
      }
      case 'getMatchingExplanation': {
        const riderRequest = stringInput(body.riderRequest, 'riderRequest', 4000);
        if (!Array.isArray(body.availableRoutes) || body.availableRoutes.length > 50) throw new Error('invalid_availableRoutes');
        response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Rider Request: ${riderRequest}\nAvailable Routes: ${JSON.stringify(body.availableRoutes)}\n\nExplain which route is the best match for the rider and why, considering direction and timing. Keep it conversational and brief.`,
        });
        break;
      }
      default:
        sendJson(res, 400, { error: 'invalid_operation' });
        return;
    }

    const links = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || [])
      .map((chunk) => ({ title: chunk.maps?.title || 'Map Link', uri: chunk.maps?.uri || '#' }))
      .filter((link) => link.uri !== '#');
    sendJson(res, 200, { text: response.text || '', links });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    if (message === 'gemini_not_configured') {
      sendJson(res, 503, { error: 'gemini_not_configured' });
      return;
    }
    if (message.startsWith('invalid_')) {
      sendJson(res, 400, { error: message });
      return;
    }
    console.error('[server] Gemini request failed:', message);
    sendJson(res, 502, { error: 'gemini_request_failed' });
  }
}

const server = createServer((req, res) => {
  const urlPath = req.url.split('?')[0].split('#')[0];

  if (urlPath === '/api/gemini') {
    void handleGeminiRequest(req, res);
    return;
  }

  if (urlPath === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('ok');
    return;
  }

  let filePath = join(DIST_DIR, urlPath === '/' ? 'index.html' : urlPath);

  const fileExt = extname(filePath);
  if (!fileExt || !existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = INDEX_HTML;
  }

  try {
    const content = readFileSync(filePath);
    const contentType = MIME_TYPES[extname(filePath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.on('error', (err) => {
  console.error('[server] listen error:', err);
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`PathMate running on http://0.0.0.0:${PORT}`);
});
