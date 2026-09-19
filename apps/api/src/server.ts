import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { initStorage } from './services/storage.js';
import { ingressRouter } from './routes/ingress.js';
import { dispatchRouter } from './routes/dispatch.js';
import { telemetryRouter } from './routes/telemetry.js';
import { endpointsRouter } from './routes/endpoints.js';

initStorage();

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

app.use(cors());

app.use('/ingest', express.text({ type: '*/*', limit: '10mb' }), (req, _res, next) => {
  if (typeof req.body === 'string' && req.body.trim().length > 0) {
    try {
      req.body = JSON.parse(req.body);
    } catch {}
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/ingest', ingressRouter);
app.use('/api/dispatch', dispatchRouter);
app.use('/api/telemetry', telemetryRouter);
app.use('/api', endpointsRouter);

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'AuditHook Ingestion & Dispatch Engine',
    timestamp: new Date().toISOString()
  });
});

const possibleWebDistPaths = [
  path.resolve(process.cwd(), '../web/dist'),
  path.resolve(process.cwd(), 'apps/web/dist'),
  path.resolve(process.cwd(), 'dist/web')
];

let webDistPath = possibleWebDistPaths.find((p) => fs.existsSync(p));

if (webDistPath) {
  app.use(express.static(webDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ingest')) {
      return next();
    }
    res.sendFile(path.join(webDistPath!, 'index.html'));
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`\x1b[36m⚡ AuditHook Engine running on http://localhost:${port}\x1b[0m`);
  console.log(`\x1b[32m✔ Ingest Webhooks: http://localhost:${port}/ingest/:endpointId\x1b[0m`);
  console.log(`\x1b[35m✔ Telemetry Stream: http://localhost:${port}/api/telemetry/stream\x1b[0m`);
  if (webDistPath) {
    console.log(`\x1b[34m✔ Web Dashboard served at http://localhost:${port}\x1b[0m`);
  }
});
