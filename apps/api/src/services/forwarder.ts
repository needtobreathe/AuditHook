import crypto from 'node:crypto';
import type { DeliveryAttempt, WebhookEvent } from '@audithook/shared-types';
import { getEndpoint, insertDeliveryAttempt, updateEventStatus } from './storage.js';
import { broadcastTelemetry } from './telemetry.js';

const DISALLOWED_HEADERS = new Set([
  'host',
  'connection',
  'content-length',
  'transfer-encoding',
  'keep-alive',
  'accept-encoding'
]);

export async function forwardWebhookEvent(
  event: WebhookEvent,
  customTargetUrl?: string,
  customHeaders?: Record<string, string>,
  customPayload?: any
): Promise<DeliveryAttempt> {
  const endpoint = getEndpoint(event.endpointId);
  const targetUrl = customTargetUrl || endpoint?.targetUrl || 'http://localhost:3000/webhook';

  const startTime = Date.now();
  const attemptId = crypto.randomUUID();

  const headersToSend: Record<string, string> = {
    'content-type': 'application/json',
    'x-audithook-event-id': event.id,
    'x-audithook-delivery-id': attemptId,
    'x-audithook-timestamp': new Date().toISOString()
  };

  for (const [key, val] of Object.entries(event.headers || {})) {
    if (!DISALLOWED_HEADERS.has(key.toLowerCase())) {
      headersToSend[key] = val;
    }
  }

  if (customHeaders) {
    for (const [key, val] of Object.entries(customHeaders)) {
      headersToSend[key] = val;
    }
  }

  let bodyData: string | undefined = undefined;
  if (['POST', 'PUT', 'PATCH'].includes(event.method)) {
    const payload = customPayload !== undefined ? customPayload : event.payload;
    bodyData = typeof payload === 'string' ? payload : JSON.stringify(payload);
  }

  let attempt: DeliveryAttempt;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(targetUrl, {
      method: event.method,
      headers: headersToSend,
      body: bodyData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;

    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((val, key) => {
      responseHeaders[key] = val;
    });

    let responseBody: string | undefined;
    try {
      responseBody = await res.text();
    } catch {}

    attempt = {
      id: attemptId,
      targetUrl,
      statusCode: res.status,
      statusText: res.statusText,
      responseTimeMs,
      responseHeaders,
      responseBody,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    const responseTimeMs = Date.now() - startTime;
    attempt = {
      id: attemptId,
      targetUrl,
      statusCode: undefined,
      statusText: undefined,
      responseTimeMs,
      error: err.name === 'AbortError' ? 'Connection timed out (10s)' : (err.message || 'Connection failed'),
      timestamp: new Date().toISOString()
    };
  }

  insertDeliveryAttempt(event.id, attempt);

  const finalStatus = attempt.statusCode && attempt.statusCode >= 200 && attempt.statusCode < 400
    ? 'FORWARDED'
    : 'FAILED';

  updateEventStatus(event.id, finalStatus);

  broadcastTelemetry({
    type: 'DELIVERY_UPDATED',
    data: {
      eventId: event.id,
      status: finalStatus,
      attempt
    },
    timestamp: new Date().toISOString()
  }, event.endpointId);

  return attempt;
}
