import type { Response } from 'express';
import type { TelemetryMessage } from '@audithook/shared-types';

interface SseClient {
  id: string;
  res: Response;
  endpointId?: string;
}

const clients: Map<string, SseClient> = new Map();

export function registerClient(id: string, res: Response, endpointId?: string): void {
  clients.set(id, { id, res, endpointId });

  res.write(`data: ${JSON.stringify({
    type: 'CONNECTED',
    data: { clientId: id, endpointId: endpointId || 'all' },
    timestamp: new Date().toISOString()
  })}\n\n`);
}

export function unregisterClient(id: string): void {
  clients.delete(id);
}

export function broadcastTelemetry(message: TelemetryMessage, targetEndpointId?: string): void {
  const payload = `data: ${JSON.stringify(message)}\n\n`;

  for (const client of clients.values()) {
    if (
      !targetEndpointId ||
      !client.endpointId ||
      client.endpointId === 'all' ||
      client.endpointId === targetEndpointId
    ) {
      try {
        client.res.write(payload);
      } catch {
        clients.delete(client.id);
      }
    }
  }
}

export function getActiveClientCount(): number {
  return clients.size;
}

setInterval(() => {
  const pingMessage = `: heartbeat\n\n`;
  for (const [id, client] of clients.entries()) {
    try {
      client.res.write(pingMessage);
    } catch {
      clients.delete(id);
    }
  }
}, 15000);
