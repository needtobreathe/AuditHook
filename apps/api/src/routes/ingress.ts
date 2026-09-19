import { Router } from 'express';
import crypto from 'node:crypto';
import type { HttpMethod, WebhookEvent } from '@audithook/shared-types';
import { getEndpoint, insertWebhookEvent } from '../services/storage.js';
import { broadcastTelemetry } from '../services/telemetry.js';
import { forwardWebhookEvent } from '../services/forwarder.js';

export const ingressRouter = Router();

function detectOrigin(headers: Record<string, string>, userAgent: string): string {
  const ua = userAgent.toLowerCase();
  const headerKeys = Object.keys(headers).map((k) => k.toLowerCase());

  if (headerKeys.includes('stripe-signature') || ua.includes('stripe')) {
    return 'Stripe';
  }
  if (headerKeys.includes('x-shopify-hmac-sha256') || ua.includes('shopify')) {
    return 'Shopify';
  }
  if (headerKeys.includes('x-github-event') || ua.includes('github-hookshot')) {
    return 'GitHub';
  }
  if (headerKeys.includes('x-hub-signature') || headerKeys.includes('x-hub-signature-256') || ua.includes('facebook') || ua.includes('meta')) {
    return 'Meta';
  }
  if (headerKeys.includes('x-slack-signature') || ua.includes('slackbot')) {
    return 'Slack';
  }
  if (headerKeys.includes('svix-signature') || ua.includes('svix')) {
    return 'Svix';
  }
  if (ua.includes('postman')) {
    return 'Postman';
  }
  if (ua.includes('curl')) {
    return 'cURL';
  }

  return 'Custom Webhook';
}

ingressRouter.all('/:endpointId', handleIngress);
ingressRouter.all('/:endpointId/*', handleIngress);

async function handleIngress(req: any, res: any) {
  const endpointId = String(req.params.endpointId || 'default');
  const subPath = req.params[0] ? `/${req.params[0]}` : '';
  const fullPath = `/ingest/${endpointId}${subPath}`;

  const normalizedHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') {
      normalizedHeaders[key] = value;
    } else if (Array.isArray(value)) {
      normalizedHeaders[key] = value.join(', ');
    }
  }

  const queryParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.query)) {
    if (typeof value === 'string') {
      queryParams[key] = value;
    } else if (Array.isArray(value)) {
      queryParams[key] = value.join(',');
    }
  }

  let clientIp = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '127.0.0.1';
  if (clientIp.includes(',')) {
    clientIp = clientIp.split(',')[0].trim();
  }
  if (clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.replace('::ffff:', '');
  }

  const userAgent = normalizedHeaders['user-agent'] || '';
  const origin = detectOrigin(normalizedHeaders, userAgent);

  let payload = req.body;
  if (typeof payload === 'string' && payload.length > 0) {
    try {
      payload = JSON.parse(payload);
    } catch {}
  }

  const rawBodySize = Buffer.isBuffer(req.body)
    ? req.body.length
    : typeof req.body === 'string'
    ? Buffer.byteLength(req.body)
    : Buffer.byteLength(JSON.stringify(payload || {}));

  const event: WebhookEvent = {
    id: crypto.randomUUID(),
    endpointId,
    method: (req.method || 'POST').toUpperCase() as HttpMethod,
    path: fullPath,
    headers: normalizedHeaders,
    query: queryParams,
    payload: payload ?? {},
    ip: clientIp,
    sourceOrigin: origin,
    receivedAt: new Date().toISOString(),
    status: 'PENDING',
    contentLength: rawBodySize,
    deliveryAttempts: []
  };

  insertWebhookEvent(event);

  broadcastTelemetry({
    type: 'EVENT_CREATED',
    data: event,
    timestamp: new Date().toISOString()
  }, endpointId);

  const endpoint = getEndpoint(endpointId);
  if (endpoint && endpoint.autoForward) {
    forwardWebhookEvent(event, endpoint.targetUrl).catch(() => {});
  }

  res.status(202).json({
    success: true,
    eventId: event.id,
    endpointId: event.endpointId,
    receivedAt: event.receivedAt
  });
}
