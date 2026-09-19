# AuditHook

A self-hosted webhook observability workbench. Captures inbound HTTP calls from Stripe, Shopify, GitHub, Meta and any other source, streams them to a live three-pane inspector, and lets you replay or forward any event to a local server with a single click.

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/new)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## Why

External webhook deliveries are a black box. When a payment fails at 2 AM you have no copy of the raw payload, no response log and no way to replay the event against a fixed build. AuditHook puts a transparent proxy in front of your endpoint so every call is captured, stored and replayable indefinitely.

---

## Features

- **Universal ingestion** — any HTTP method, any content type, any source
- **Source origin detection** — automatically tags Stripe, Shopify, GitHub, Meta, Slack, Svix, cURL and Postman from headers and User-Agent
- **Live stream** — Server-Sent Events push every new event to the browser within milliseconds, no polling
- **Three-pane workbench** — feed list / request inspector / delivery terminal, all visible at once
- **Full request capture** — method, status, headers, query params, raw body, payload size, exact millisecond timestamp
- **JSON inspector** — syntax highlight, line numbers, filter-by-key search, minimap for long payloads, raw / formatted toggle, one-click copy
- **Pagination** — paginated feed list (25, 50, 100 items per page) with instant switching
- **Export** — single event JSON download and complete event log batch export
- **Dark / Light mode** — theme switcher with persistent storage across sessions
- **In-App Documentation** — `/docs` interactive technical guide with pure inline SVG architecture and layout diagrams (zero PNG dependency)
- **Replay engine** — forward any stored event to any target URL, captures response status, body and headers
- **Attempt history** — every dispatch attempt logged with status code, latency and timestamp
- **Auto-forward** — optionally pipe all inbound events straight to a local server in real time
- **Multi-endpoint** — create isolated ingest URLs with independent target and auto-forward settings
- **Zero external dependencies** — storage uses Node 26's built-in `node:sqlite` (WAL mode), no Postgres, no Redis

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  External services (Stripe / Shopify / GitHub / ...)        │
│  POST https://your-domain/ingest/<endpoint-id>/...          │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  apps/api  (Node.js + Express, port 4000)                   │
│                                                             │
│  routes/ingress.ts ──▶ services/storage.ts (SQLite WAL)     │
│       │                                                     │
│       ├── services/telemetry.ts ──▶ SSE stream ──▶ browser  │
│       └── services/forwarder.ts ──▶ localhost target        │
│                                                             │
│  /api/dispatch/replay  — on-demand forward + capture        │
│  /api/test-target/*    — local echo receiver for testing    │
└────────────────────────┬────────────────────────────────────┘
                         │ SSE + REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  apps/web  (Vue 3 + Vite, port 5173 in dev)                 │
│                                                             │
│  FeedList ──▶ Inspector ──▶ DeliveryTerminal ──▶ /docs      │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Language | TypeScript (end-to-end) | Single type system across API, frontend and scripts |
| Backend | Node.js 26 + Express | Native `node:sqlite`, high I/O throughput |
| Database | `node:sqlite` (WAL) | Zero-install, ACID, embedded — no daemon required |
| Real-time | Server-Sent Events | Unidirectional, reconnects automatically, works through proxies |
| Frontend | Vue 3 + Vue Router | Composition API, client-side routing (`/` and `/docs`) |
| Styling | Tailwind CSS + JetBrains Mono | Dark & light workbench themes, monospace density |
| Build | Vite + vue-tsc | Sub-2s production builds, strict type checking |
| Monorepo | npm workspaces | `packages/shared-types` shared between API and web |

---

## Monorepo Layout

```
AuditHook/
├── Dockerfile                 Multi-stage Node 26 alpine container
├── docker-compose.yml         1-command self-hosted stack
├── railway.toml               Railway 1-click full-stack config
├── fly.toml                   Fly.io production edge deployment
├── vercel.json                Vercel frontend host configuration
├── apps/
│   ├── api/                   Express API server
│   │   └── src/
│   │       ├── routes/
│   │       │   ├── ingress.ts     Universal webhook ingestion
│   │       │   ├── dispatch.ts    Replay and forward
│   │       │   ├── endpoints.ts   Endpoint CRUD + event queries
│   │       │   └── telemetry.ts   SSE stream
│   │       ├── services/
│   │       │   ├── storage.ts     SQLite WAL (events, endpoints, attempts)
│   │       │   ├── forwarder.ts   HTTP dispatch with response capture
│   │       │   └── telemetry.ts   SSE client registry + heartbeat
│   │       └── server.ts
│   └── web/                   Vue 3 + Vite frontend
│       └── src/
│           ├── router/        Vue Router (/ and /docs)
│           ├── pages/
│           │   ├── WorkbenchPage.vue
│           │   └── DocsPage.vue   Pure SVG technical documentation
│           ├── composables/
│           │   ├── useTelemetry.ts  SSE connection, reactive state
│           │   └── useTheme.ts      Dark/light mode state manager
│           └── components/
│               ├── AuditHookLogo.vue
│               ├── HeaderBar.vue
│               ├── FeedList.vue     Paginated request list
│               ├── Inspector.vue    Headers & JSON inspector + Export
│               ├── JsonView.vue     Syntax highlight + search + minimap
│               ├── DeliveryTerminal.vue
│               └── NewEndpointModal.vue
├── packages/
│   └── shared-types/          WebhookEvent, DeliveryAttempt, EndpointConfig
└── scripts/
    └── mock-emitter.ts        Realistic multi-source test burst
```

---

## Quickstart (Local Development)

**Requirements:** Node.js ≥ 26, npm ≥ 10

```bash
git clone https://github.com/needtobreathe/AuditHook.git
cd AuditHook
npm install
npm run build
```

Open two terminals:

```bash
# Terminal 1 — API server
npm run dev:api

# Terminal 2 — Vite dev server (proxies /api and /ingest to :4000)
npm run dev:web
```

Open `http://localhost:5173`, then fire test events:

```bash
npm run emit
```

To view the in-app documentation and architectural diagrams, navigate to `http://localhost:5173/docs` or click the **Docs** button in the header bar.

---

## Deployment Options

### 1. Docker & Docker Compose (Self-Hosted)

Run AuditHook with persistent SQLite volume mounting:

```bash
docker compose up -d
```

The web dashboard and ingestion engine will be available immediately at `http://localhost:4000`. Data is stored persistently in `./data/audithook.sqlite`.

### 2. Railway (1-Click Full-Stack)

AuditHook includes a native `railway.toml`.
1. Click the **Deploy on Railway** button above or link your GitHub repo in Railway.
2. Railway detects `Dockerfile` and builds both backend and frontend.
3. Attach a persistent volume to `/app/data`.

### 3. Fly.io (Production Edge)

Deploy to Fly.io using the preconfigured `fly.toml`:

```bash
fly launch --copy-config
fly deploy
```

Fly mounts a persistent volume `audithook_data` at `/app/data` to preserve your SQLite database across restarts.

### 4. Vercel (Frontend Client Host)

AuditHook includes `vercel.json` configured for Vite SPA routing and backend proxying:

```bash
vercel --prod
```

---

## Emitting Test Events

`scripts/mock-emitter.ts` sends a realistic multi-source burst:

| Source | Event | Notes |
|---|---|---|
| Stripe | `customer.created` | Full customer object, first attempt fails (dead port), second succeeds |
| Stripe | `payment_intent.created` | Full payment intent with SEPA + card payment methods |
| Stripe | `payment_intent.succeeded` | Visa 3DS charge, balance transaction, outcome block |
| Shopify | `orders/create` | Knipex + Wera B2B order from Hamburg, German tax lines |
| GitHub | `deployment_status` | `failure` state, production cluster, 3 containers exited SIGKILL |

The emitter uses jitter on all delays so timestamps in the feed are irregular, not metronomic.

```bash
# One burst
npm run emit

# Continuous loop
npx tsx scripts/mock-emitter.ts --loop
```

---

## Ingest URL Format

```
POST /ingest/<endpoint-id>
POST /ingest/<endpoint-id>/<any-sub-path>
```

Both routes are equivalent. Sub-paths let external services that enforce path prefixes (e.g. `/ingest/production/stripe/webhooks`) route correctly without extra configuration.

Create additional endpoints via the **+** button in the header bar or:

```bash
curl -X POST http://localhost:4000/api/endpoints \
  -H "Content-Type: application/json" \
  -d '{"name":"Stripe Production","id":"stripe-prod","targetUrl":"http://localhost:3000/webhooks/stripe","autoForward":false}'
```

---

## API Reference

### Ingest

| Method | Path | Description |
|---|---|---|
| `ANY` | `/ingest/:endpointId` | Capture webhook, optionally auto-forward |
| `ANY` | `/ingest/:endpointId/*` | Same, accepts sub-paths |

### Events

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/events?endpointId=&limit=` | List events (newest first) |
| `GET` | `/api/events/:id` | Single event with all delivery attempts |
| `DELETE` | `/api/events?endpointId=` | Clear events (all or per endpoint) |

### Dispatch

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/api/dispatch/replay` | `{ eventId, targetUrl }` | Forward stored event, capture response |
| `POST` | `/api/dispatch/forward/:eventId` | — | Forward using endpoint's configured target |

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/endpoints` | List all endpoints |
| `POST` | `/api/endpoints` | Create endpoint |
| `PATCH` | `/api/endpoints/:id` | Update name, targetUrl, autoForward |

### Telemetry

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/telemetry/stream` | SSE stream (heartbeat every 15s) |

### Test Target

| Method | Path | Description |
|---|---|---|
| `ANY` | `/api/test-target/webhook` | Local echo receiver — returns 200 with received payload |

---

## Data Schema

### WebhookEvent

```typescript
{
  id: string
  endpointId: string
  receivedAt: string       // ISO 8601 with milliseconds
  method: string
  path: string
  sourceOrigin: string     // "Stripe" | "Shopify" | "GitHub" | "Meta" | "Slack" | ...
  headers: Record<string, string>
  queryParams: Record<string, string>
  body: unknown
  contentLength: number    // bytes
  status: "PENDING" | "FORWARDED" | "FAILED"
  deliveryAttempts: DeliveryAttempt[]
}
```

### DeliveryAttempt

```typescript
{
  id: string
  eventId: string
  targetUrl: string
  statusCode?: number
  statusText?: string
  responseTimeMs: number
  responseHeaders?: Record<string, string>
  responseBody?: string
  error?: string
  timestamp: string
}
```

### EndpointConfig

```typescript
{
  id: string
  name: string
  targetUrl: string
  autoForward: boolean
  createdAt: string
  updatedAt: string
}
```

---

## SSE Event Types

The `/api/telemetry/stream` connection pushes JSON messages:

| Type | When |
|---|---|
| `WEBHOOK_RECEIVED` | New event ingested |
| `DELIVERY_UPDATED` | Dispatch attempt completed |
| `ENDPOINT_CREATED` | New endpoint added |
| `ENDPOINT_UPDATED` | Endpoint config changed |
| `EVENTS_CLEARED` | Events deleted |
| `ping` | Heartbeat every 15s, keeps connection alive through proxies |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | API server port |
| `NODE_ENV` | `development` | Set to `production` to serve built Vue app from `../web/dist` |
| `AUDITHOOK_URL` | `http://localhost:4000` | Used by mock-emitter |
| `ENDPOINT_ID` | `default` | Default endpoint the emitter targets |

---

## Production Build

```bash
npm run build
NODE_ENV=production node apps/api/dist/server.js
```

The API server detects `apps/web/dist` and serves the Vue build as a static SPA on the same port. No separate web server needed.

---

## License

MIT
