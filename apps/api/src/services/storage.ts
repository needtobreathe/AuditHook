import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import type { DeliveryAttempt, EndpointConfig, WebhookEvent, WebhookStatus } from '@audithook/shared-types';

let db: DatabaseSync;

export function initStorage(customDbPath?: string): DatabaseSync {
  if (db) {
    return db;
  }

  const dbDir = customDbPath ? path.dirname(customDbPath) : path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const finalPath = customDbPath || path.resolve(dbDir, 'audithook.sqlite');
  db = new DatabaseSync(finalPath);

  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;

    CREATE TABLE IF NOT EXISTS endpoints (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      target_url TEXT NOT NULL,
      auto_forward INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      endpoint_id TEXT NOT NULL,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      headers TEXT NOT NULL,
      query TEXT NOT NULL,
      payload TEXT NOT NULL,
      ip TEXT NOT NULL,
      source_origin TEXT,
      received_at TEXT NOT NULL,
      status TEXT NOT NULL,
      content_length INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_events_endpoint ON events(endpoint_id);
    CREATE INDEX IF NOT EXISTS idx_events_received_at ON events(received_at DESC);

    CREATE TABLE IF NOT EXISTS delivery_attempts (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      target_url TEXT NOT NULL,
      status_code INTEGER,
      status_text TEXT,
      response_time_ms INTEGER NOT NULL,
      response_headers TEXT,
      response_body TEXT,
      error TEXT,
      timestamp TEXT NOT NULL,
      FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_delivery_event ON delivery_attempts(event_id);
  `);

  try {
    db.exec(`ALTER TABLE delivery_attempts ADD COLUMN status_text TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE delivery_attempts ADD COLUMN response_headers TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE delivery_attempts ADD COLUMN response_body TEXT;`);
  } catch {}

  const defaultEndpoint = getEndpoint('default');
  if (!defaultEndpoint) {
    createEndpoint({
      id: 'default',
      name: 'Default Webhook Listener',
      targetUrl: 'http://localhost:3000/webhook',
      autoForward: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  return db;
}

export function createEndpoint(endpoint: EndpointConfig): EndpointConfig {
  const stmt = db.prepare(`
    INSERT INTO endpoints (id, name, target_url, auto_forward, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    endpoint.id,
    endpoint.name,
    endpoint.targetUrl,
    endpoint.autoForward ? 1 : 0,
    endpoint.createdAt,
    endpoint.updatedAt
  );
  return endpoint;
}

export function getEndpoint(id: string): EndpointConfig | null {
  const stmt = db.prepare(`SELECT * FROM endpoints WHERE id = ?`);
  const row = stmt.get(id) as any;
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    targetUrl: row.target_url,
    autoForward: Boolean(row.auto_forward),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function listEndpoints(): EndpointConfig[] {
  const stmt = db.prepare(`SELECT * FROM endpoints ORDER BY created_at ASC`);
  const rows = stmt.all() as any[];
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    targetUrl: row.target_url,
    autoForward: Boolean(row.auto_forward),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export function updateEndpoint(id: string, updates: Partial<EndpointConfig>): EndpointConfig | null {
  const current = getEndpoint(id);
  if (!current) return null;

  const updated: EndpointConfig = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  const stmt = db.prepare(`
    UPDATE endpoints
    SET name = ?, target_url = ?, auto_forward = ?, updated_at = ?
    WHERE id = ?
  `);
  stmt.run(
    updated.name,
    updated.targetUrl,
    updated.autoForward ? 1 : 0,
    updated.updatedAt,
    id
  );

  return updated;
}

export function insertWebhookEvent(event: WebhookEvent): void {
  const stmt = db.prepare(`
    INSERT INTO events (id, endpoint_id, method, path, headers, query, payload, ip, source_origin, received_at, status, content_length)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    event.id,
    event.endpointId,
    event.method,
    event.path,
    JSON.stringify(event.headers),
    JSON.stringify(event.query),
    typeof event.payload === 'string' ? event.payload : JSON.stringify(event.payload),
    event.ip,
    event.sourceOrigin || null,
    event.receivedAt,
    event.status,
    event.contentLength || 0
  );
}

export function getDeliveryAttemptsForEvent(eventId: string): DeliveryAttempt[] {
  const stmt = db.prepare(`
    SELECT * FROM delivery_attempts WHERE event_id = ? ORDER BY timestamp DESC
  `);
  const rows = stmt.all(eventId) as any[];
  return rows.map((row) => {
    let responseHeaders: Record<string, string> | undefined;
    if (row.response_headers) {
      try {
        responseHeaders = JSON.parse(row.response_headers);
      } catch {}
    }

    return {
      id: row.id,
      targetUrl: row.target_url,
      statusCode: row.status_code ?? undefined,
      statusText: row.status_text ?? undefined,
      responseTimeMs: row.response_time_ms,
      responseHeaders,
      responseBody: row.response_body ?? undefined,
      error: row.error ?? undefined,
      timestamp: row.timestamp
    };
  });
}

export function listWebhookEvents(options: { endpointId?: string; limit?: number } = {}): WebhookEvent[] {
  const limit = options.limit || 100;
  let rows: any[] = [];

  if (options.endpointId && options.endpointId !== 'all') {
    const stmt = db.prepare(`
      SELECT * FROM events WHERE endpoint_id = ? ORDER BY received_at DESC LIMIT ?
    `);
    rows = stmt.all(options.endpointId, limit) as any[];
  } else {
    const stmt = db.prepare(`
      SELECT * FROM events ORDER BY received_at DESC LIMIT ?
    `);
    rows = stmt.all(limit) as any[];
  }

  return rows.map((row) => {
    let payload = row.payload;
    try {
      payload = JSON.parse(row.payload);
    } catch {
      payload = row.payload;
    }

    return {
      id: row.id,
      endpointId: row.endpoint_id,
      method: row.method,
      path: row.path,
      headers: JSON.parse(row.headers),
      query: JSON.parse(row.query),
      payload,
      ip: row.ip,
      sourceOrigin: row.source_origin ?? undefined,
      receivedAt: row.received_at,
      status: row.status as WebhookStatus,
      contentLength: row.content_length,
      deliveryAttempts: getDeliveryAttemptsForEvent(row.id)
    };
  });
}

export function getWebhookEvent(id: string): WebhookEvent | null {
  const stmt = db.prepare(`SELECT * FROM events WHERE id = ?`);
  const row = stmt.get(id) as any;
  if (!row) return null;

  let payload = row.payload;
  try {
    payload = JSON.parse(row.payload);
  } catch {
    payload = row.payload;
  }

  return {
    id: row.id,
    endpointId: row.endpoint_id,
    method: row.method,
    path: row.path,
    headers: JSON.parse(row.headers),
    query: JSON.parse(row.query),
    payload,
    ip: row.ip,
    sourceOrigin: row.source_origin ?? undefined,
    receivedAt: row.received_at,
    status: row.status as WebhookStatus,
    contentLength: row.content_length,
    deliveryAttempts: getDeliveryAttemptsForEvent(row.id)
  };
}

export function insertDeliveryAttempt(eventId: string, attempt: DeliveryAttempt): void {
  const stmt = db.prepare(`
    INSERT INTO delivery_attempts (id, event_id, target_url, status_code, status_text, response_time_ms, response_headers, response_body, error, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    attempt.id,
    eventId,
    attempt.targetUrl,
    attempt.statusCode ?? null,
    attempt.statusText ?? null,
    attempt.responseTimeMs,
    attempt.responseHeaders ? JSON.stringify(attempt.responseHeaders) : null,
    attempt.responseBody ?? null,
    attempt.error ?? null,
    attempt.timestamp
  );
}

export function updateEventStatus(eventId: string, status: WebhookStatus): void {
  const stmt = db.prepare(`UPDATE events SET status = ? WHERE id = ?`);
  stmt.run(status, eventId);
}

export function clearEvents(endpointId?: string): void {
  if (endpointId && endpointId !== 'all') {
    const getIdsStmt = db.prepare(`SELECT id FROM events WHERE endpoint_id = ?`);
    const rows = getIdsStmt.all(endpointId) as any[];
    const ids = rows.map((r) => r.id);
    if (ids.length > 0) {
      const placeholders = ids.map(() => '?').join(',');
      db.prepare(`DELETE FROM delivery_attempts WHERE event_id IN (${placeholders})`).run(...ids);
      db.prepare(`DELETE FROM events WHERE endpoint_id = ?`).run(endpointId);
    }
  } else {
    db.exec(`
      DELETE FROM delivery_attempts;
      DELETE FROM events;
    `);
  }
}
