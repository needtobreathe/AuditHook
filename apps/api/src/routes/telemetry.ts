import { Router } from 'express';
import crypto from 'node:crypto';
import { registerClient, unregisterClient } from '../services/telemetry.js';

export const telemetryRouter = Router();

telemetryRouter.get('/stream', (req, res) => {
  const endpointId = typeof req.query.endpointId === 'string' ? req.query.endpointId : undefined;
  const clientId = crypto.randomUUID();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  registerClient(clientId, res, endpointId);

  req.on('close', () => {
    unregisterClient(clientId);
  });
});
