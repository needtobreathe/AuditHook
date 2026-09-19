export type HttpMethod = 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';

export type WebhookStatus = 'PENDING' | 'FORWARDED' | 'FAILED';

export interface DeliveryAttempt {
  id: string;
  targetUrl: string;
  statusCode?: number;
  statusText?: string;
  responseTimeMs: number;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  error?: string;
  timestamp: string;
}

export interface WebhookEvent {
  id: string;
  endpointId: string;
  method: HttpMethod;
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  payload: any;
  ip: string;
  sourceOrigin?: string;
  receivedAt: string;
  status: WebhookStatus;
  deliveryAttempts: DeliveryAttempt[];
  contentLength?: number;
}

export interface EndpointConfig {
  id: string;
  name: string;
  targetUrl: string;
  autoForward: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReplayRequest {
  eventId: string;
  targetUrl?: string;
  customHeaders?: Record<string, string>;
  customPayload?: any;
}

export type TelemetryMessageType =
  | 'CONNECTED'
  | 'EVENT_CREATED'
  | 'DELIVERY_UPDATED'
  | 'ENDPOINT_UPDATED'
  | 'ENDPOINT_CREATED'
  | 'EVENTS_CLEARED';

export interface TelemetryMessage<T = any> {
  type: TelemetryMessageType;
  data: T;
  timestamp: string;
}
