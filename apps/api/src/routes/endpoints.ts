import { Router } from 'express';
import crypto from 'node:crypto';
import type { EndpointConfig } from '@audithook/shared-types';
import {
  clearEvents,
  createEndpoint,
  getEndpoint,
  getWebhookEvent,
  listEndpoints,
  listWebhookEvents,
  updateEndpoint
} from '../services/storage.js';
import { broadcastTelemetry } from '../services/telemetry.js';

export const endpointsRouter = Router();

endpointsRouter.get('/endpoints', (_req, res) => {
  const endpoints = listEndpoints();
  res.json(endpoints);
});

endpointsRouter.post('/endpoints', (req, res) => {
  const { name, targetUrl, autoForward } = req.body;
  const rawId = req.body.id || name?.toLowerCase().replace(/[^a-z0-9]/g, '-') || crypto.randomUUID().slice(0, 8);
  const id = rawId.trim();

  if (getEndpoint(id)) {
    res.status(409).json({ error: 'Endpoint ID already exists' });
    return;
  }

  const endpoint: EndpointConfig = {
    id,
    name: name || `Endpoint ${id}`,
    targetUrl: targetUrl || 'http://localhost:3000/webhook',
    autoForward: Boolean(autoForward),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  createEndpoint(endpoint);

  broadcastTelemetry({
    type: 'ENDPOINT_CREATED',
    data: endpoint,
    timestamp: new Date().toISOString()
  });

  res.status(201).json(endpoint);
});

endpointsRouter.patch('/endpoints/:id', (req, res) => {
  const { id } = req.params;
  const { name, targetUrl, autoForward } = req.body;

  const updated = updateEndpoint(id, {
    ...(name !== undefined ? { name } : {}),
    ...(targetUrl !== undefined ? { targetUrl } : {}),
    ...(autoForward !== undefined ? { autoForward: Boolean(autoForward) } : {})
  });

  if (!updated) {
    res.status(404).json({ error: 'Endpoint not found' });
    return;
  }

  broadcastTelemetry({
    type: 'ENDPOINT_UPDATED',
    data: updated,
    timestamp: new Date().toISOString()
  });

  res.json(updated);
});

endpointsRouter.get('/events', (req, res) => {
  const endpointId = typeof req.query.endpointId === 'string' ? req.query.endpointId : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
  const events = listWebhookEvents({ endpointId, limit });
  res.json(events);
});

endpointsRouter.get('/events/:id', (req, res) => {
  const event = getWebhookEvent(req.params.id);
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  res.json(event);
});

endpointsRouter.delete('/events', (req, res) => {
  const endpointId = typeof req.query.endpointId === 'string' ? req.query.endpointId : undefined;
  clearEvents(endpointId);

  broadcastTelemetry({
    type: 'EVENTS_CLEARED',
    data: { endpointId: endpointId || 'all' },
    timestamp: new Date().toISOString()
  }, endpointId);

  res.json({ success: true });
});

endpointsRouter.all('/test-target/webhook', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AuditHook local echo receiver received the request',
    method: req.method,
    headersReceived: req.headers,
    bodyReceived: req.body,
    receivedAt: new Date().toISOString()
  });
});
