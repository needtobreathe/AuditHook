import { Router } from 'express';
import type { ReplayRequest } from '@audithook/shared-types';
import { getWebhookEvent } from '../services/storage.js';
import { forwardWebhookEvent } from '../services/forwarder.js';

export const dispatchRouter = Router();

dispatchRouter.post('/replay', async (req, res) => {
  const body = req.body as ReplayRequest;

  if (!body.eventId) {
    res.status(400).json({ error: 'eventId is required' });
    return;
  }

  const event = getWebhookEvent(body.eventId);
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }

  try {
    const attempt = await forwardWebhookEvent(
      event,
      body.targetUrl,
      body.customHeaders,
      body.customPayload
    );

    res.json({
      success: true,
      attempt,
      event: getWebhookEvent(body.eventId)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to replay event' });
  }
});

dispatchRouter.post('/forward/:eventId', async (req, res) => {
  const eventId = req.params.eventId;
  const targetUrl = req.body.targetUrl;

  const event = getWebhookEvent(eventId);
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }

  try {
    const attempt = await forwardWebhookEvent(event, targetUrl);
    res.json({
      success: true,
      attempt,
      event: getWebhookEvent(eventId)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to forward event' });
  }
});
