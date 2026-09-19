<script setup lang="ts">
import { ref } from 'vue';
import {
  Server,
  Zap,
  Layers,
  Terminal,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Radio
} from 'lucide-vue-next';

const copiedSnippet = ref<string | null>(null);

function copyText(key: string, text: string) {
  navigator.clipboard.writeText(text);
  copiedSnippet.value = key;
  setTimeout(() => {
    copiedSnippet.value = null;
  }, 2000);
}
</script>

<template>
  <div class="flex-1 overflow-y-auto bg-zinc-950 dark:bg-zinc-950 light:bg-slate-50 text-slate-100 dark:text-slate-100 light:text-slate-900 font-sans select-text">
    <div class="max-w-6xl mx-auto px-6 py-10 space-y-16">

      <section class="space-y-4">
        <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/60 dark:bg-emerald-950/60 light:bg-emerald-100 border border-emerald-800/60 dark:border-emerald-800/60 light:border-emerald-300 text-xs font-mono text-emerald-400 dark:text-emerald-400 light:text-emerald-700">
          <Zap class="w-3.5 h-3.5" />
          <span>AuditHook v2 Documentation & Technical Reference</span>
        </div>
        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Webhook Observability & Dispatch Engine
        </h1>
        <p class="text-base text-slate-400 dark:text-slate-400 light:text-slate-600 max-w-3xl leading-relaxed">
          AuditHook captures incoming HTTP webhooks from external platforms (Stripe, Shopify, GitHub, Meta, etc.),
          stores them persistently in an embedded SQLite WAL database, streams them live via Server-Sent Events to a high-density
          three-pane workbench, and enables one-click replaying against local development servers.
        </p>
      </section>

      <section class="space-y-6">
        <div class="flex items-center space-x-3 border-b border-slate-700 dark:border-slate-800 light:border-slate-300 pb-3">
          <Layers class="w-5 h-5 text-emerald-400" />
          <h2 class="text-xl font-bold font-mono">1. System Architecture</h2>
        </div>

        <div class="bg-zinc-900/90 dark:bg-zinc-900/90 light:bg-white rounded-xl border border-slate-700 dark:border-slate-800 light:border-slate-300 p-6 overflow-x-auto">
          <svg viewBox="0 0 960 360" class="w-full min-w-[760px] h-auto font-mono text-xs select-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#0284c7" />
                <stop offset="100%" stop-color="#0369a1" />
              </linearGradient>
              <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#059669" />
                <stop offset="100%" stop-color="#047857" />
              </linearGradient>
              <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#7c3aed" />
                <stop offset="100%" stop-color="#6d28d9" />
              </linearGradient>
              <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#d97706" />
                <stop offset="100%" stop-color="#b45309" />
              </linearGradient>
            </defs>

            <rect x="20" y="40" width="180" height="280" rx="8" fill="#18181b" stroke="#3f3f46" stroke-width="1.5" />
            <text x="110" y="70" text-anchor="middle" fill="#e4e4e7" font-weight="bold" font-size="13">INBOUND SOURCES</text>
            <rect x="40" y="95" width="140" height="34" rx="5" fill="#27272a" stroke="#52525b" />
            <text x="110" y="117" text-anchor="middle" fill="#38bdf8" font-size="11">Stripe Webhooks</text>
            <rect x="40" y="140" width="140" height="34" rx="5" fill="#27272a" stroke="#52525b" />
            <text x="110" y="162" text-anchor="middle" fill="#4ade80" font-size="11">Shopify Orders</text>
            <rect x="40" y="185" width="140" height="34" rx="5" fill="#27272a" stroke="#52525b" />
            <text x="110" y="207" text-anchor="middle" fill="#c084fc" font-size="11">GitHub Events</text>
            <rect x="40" y="230" width="140" height="34" rx="5" fill="#27272a" stroke="#52525b" />
            <text x="110" y="252" text-anchor="middle" fill="#facc15" font-size="11">Meta / Slack / Any</text>
            <text x="110" y="295" text-anchor="middle" fill="#71717a" font-size="10">HTTPS POST / PUT</text>

            <path d="M 200 180 L 260 180" stroke="#10b981" stroke-width="2" stroke-dasharray="4,4" />
            <polygon points="260,176 268,180 260,184" fill="#10b981" />

            <rect x="270" y="40" width="380" height="280" rx="8" fill="#18181b" stroke="#059669" stroke-width="2" />
            <rect x="270" y="40" width="380" height="36" rx="8" fill="#064e3b" />
            <text x="460" y="63" text-anchor="middle" fill="#a7f3d0" font-weight="bold" font-size="13">AUDITHOOK INGESTION ENGINE (:4000)</text>

            <rect x="290" y="95" width="340" height="42" rx="5" fill="#27272a" stroke="#3f3f46" />
            <text x="305" y="115" fill="#34d399" font-weight="bold" font-size="11">POST /ingest/:endpointId/*</text>
            <text x="305" y="129" fill="#a1a1aa" font-size="10">Origin Detection · Header Extraction · IP Tagging</text>

            <path d="M 460 137 L 460 160" stroke="#52525b" stroke-width="1.5" />

            <rect x="290" y="160" width="160" height="60" rx="5" fill="#27272a" stroke="#3b82f6" />
            <text x="370" y="183" text-anchor="middle" fill="#93c5fd" font-weight="bold" font-size="11">node:sqlite (WAL)</text>
            <text x="370" y="200" text-anchor="middle" fill="#71717a" font-size="10">Zero-dependency DB</text>
            <text x="370" y="213" text-anchor="middle" fill="#71717a" font-size="9">audithook.sqlite</text>

            <rect x="470" y="160" width="160" height="60" rx="5" fill="#27272a" stroke="#a855f7" />
            <text x="550" y="183" text-anchor="middle" fill="#d8b4fe" font-weight="bold" font-size="11">SSE Dispatcher</text>
            <text x="550" y="200" text-anchor="middle" fill="#71717a" font-size="10">Realtime Stream</text>
            <text x="550" y="213" text-anchor="middle" fill="#71717a" font-size="9">/api/telemetry/stream</text>

            <rect x="290" y="240" width="340" height="60" rx="5" fill="#27272a" stroke="#f59e0b" />
            <text x="305" y="262" fill="#fbbf24" font-weight="bold" font-size="11">Replay & Forwarder Engine</text>
            <text x="305" y="278" fill="#a1a1aa" font-size="10">Captures status code, response time (ms), body & headers</text>
            <text x="305" y="291" fill="#71717a" font-size="9">Automatic retry & error diagnostics</text>

            <path d="M 630 190 L 710 190" stroke="#c084fc" stroke-width="2" />
            <polygon points="710,186 718,190 710,194" fill="#c084fc" />

            <rect x="720" y="40" width="220" height="150" rx="8" fill="#18181b" stroke="#7c3aed" stroke-width="1.5" />
            <text x="830" y="68" text-anchor="middle" fill="#e4e4e7" font-weight="bold" font-size="12">VUE 3 WORKBENCH</text>
            <rect x="735" y="85" width="190" height="26" rx="4" fill="#27272a" />
            <text x="830" y="102" text-anchor="middle" fill="#cbd5e1" font-size="10">Feed & Filter Panel</text>
            <rect x="735" y="118" width="190" height="26" rx="4" fill="#27272a" />
            <text x="830" y="135" text-anchor="middle" fill="#cbd5e1" font-size="10">JSON & Headers Inspector</text>
            <rect x="735" y="151" width="190" height="26" rx="4" fill="#27272a" />
            <text x="830" y="168" text-anchor="middle" fill="#cbd5e1" font-size="10">Dispatch & Attempt History</text>

            <path d="M 630 270 L 710 270" stroke="#f59e0b" stroke-width="2" stroke-dasharray="4,4" />
            <polygon points="710,266 718,270 710,274" fill="#f59e0b" />

            <rect x="720" y="220" width="220" height="100" rx="8" fill="#18181b" stroke="#f59e0b" stroke-width="1.5" />
            <text x="830" y="248" text-anchor="middle" fill="#fbbf24" font-weight="bold" font-size="12">LOCAL DESTINATIONS</text>
            <text x="830" y="272" text-anchor="middle" fill="#94a3b8" font-size="11">http://localhost:3000/*</text>
            <text x="830" y="292" text-anchor="middle" fill="#94a3b8" font-size="11">https://webhook.site/*</text>
            <text x="830" y="308" text-anchor="middle" fill="#64748b" font-size="9">Target response captured live</text>
          </svg>
        </div>
      </section>

      <section class="space-y-6">
        <div class="flex items-center space-x-3 border-b border-slate-700 dark:border-slate-800 light:border-slate-300 pb-3">
          <Server class="w-5 h-5 text-sky-400" />
          <h2 class="text-xl font-bold font-mono">2. Three-Pane Workbench Layout</h2>
        </div>

        <div class="bg-zinc-900/90 dark:bg-zinc-900/90 light:bg-white rounded-xl border border-slate-700 dark:border-slate-800 light:border-slate-300 p-6 overflow-x-auto">
          <svg viewBox="0 0 960 280" class="w-full min-w-[760px] h-auto font-mono text-xs select-none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="940" height="260" rx="6" fill="#09090b" stroke="#27272a" />

            <rect x="10" y="10" width="940" height="35" rx="6" fill="#18181b" stroke="#3f3f46" />
            <circle cx="30" cy="27" r="5" fill="#10b981" />
            <text x="45" y="31" fill="#ffffff" font-weight="bold" font-size="11">AuditHook</text>
            <rect x="140" y="18" width="120" height="18" rx="3" fill="#27272a" />
            <text x="200" y="31" text-anchor="middle" fill="#94a3b8" font-size="9">All Endpoints (*)</text>
            <rect x="520" y="18" width="220" height="18" rx="3" fill="#27272a" />
            <text x="630" y="31" text-anchor="middle" fill="#10b981" font-size="9">http://localhost:4000/ingest/default</text>
            <circle cx="760" cy="27" r="4" fill="#10b981" />
            <text x="772" y="31" fill="#94a3b8" font-size="9">stream active</text>

            <rect x="10" y="45" width="280" height="225" fill="#121215" stroke="#3f3f46" stroke-width="1" />
            <rect x="10" y="45" width="280" height="30" fill="#1c1917" />
            <text x="25" y="65" fill="#38bdf8" font-weight="bold" font-size="10">1. FEED & FILTER (380px)</text>
            <rect x="20" y="85" width="260" height="22" rx="3" fill="#27272a" />
            <text x="30" y="100" fill="#71717a" font-size="9">Filter requests... [ALL/POST/GET]</text>
            <rect x="20" y="115" width="260" height="38" rx="3" fill="#27272a" stroke="#10b981" stroke-width="1" />
            <text x="30" y="132" fill="#4ade80" font-weight="bold" font-size="9">POST /ingest/shopify/orders</text>
            <text x="30" y="146" fill="#a1a1aa" font-size="8">Shopify · 200 OK · 3.4 KB · 14:02:11.821</text>
            <rect x="20" y="160" width="260" height="38" rx="3" fill="#18181b" />
            <text x="30" y="177" fill="#fb7185" font-weight="bold" font-size="9">POST /ingest/github/webhooks</text>
            <text x="30" y="191" fill="#a1a1aa" font-size="8">GitHub · ERR FAILED · 1.2 KB · 14:02:11.959</text>
            <rect x="10" y="240" width="280" height="30" fill="#1c1917" />
            <text x="25" y="259" fill="#94a3b8" font-size="9">5 total | 25 / page | Page 1 / 1</text>

            <rect x="290" y="45" width="380" height="225" fill="#09090b" stroke="#3f3f46" stroke-width="1" />
            <rect x="290" y="45" width="380" height="30" fill="#18181b" />
            <text x="305" y="65" fill="#a855f7" font-weight="bold" font-size="10">2. INSPECTOR (Flexible Width)</text>
            <text x="305" y="92" fill="#94a3b8" font-size="9">Headers (17) [Expand / Filter]</text>
            <rect x="305" y="100" width="350" height="32" rx="3" fill="#18181b" stroke="#27272a" />
            <text x="315" y="115" fill="#818cf8" font-size="9">user-agent: Shopify-Captain-Hook</text>
            <text x="315" y="126" fill="#818cf8" font-size="9">x-shopify-topic: orders/create</text>
            <text x="305" y="148" fill="#94a3b8" font-size="9">Payload [Filter keys... | Minimap | Export JSON]</text>
            <rect x="305" y="156" width="350" height="100" rx="3" fill="#18181b" stroke="#27272a" />
            <text x="315" y="175" fill="#38bdf8" font-size="9">"id": 820982911946154500,</text>
            <text x="315" y="190" fill="#4ade80" font-size="9">"currency": "TRY",</text>
            <text x="315" y="205" fill="#fbbf24" font-size="9">"current_total_price": "1291.98"</text>
            <rect x="640" y="156" width="15" height="100" fill="#27272a" />
            <rect x="642" y="170" width="11" height="10" fill="#f59e0b" />

            <rect x="670" y="45" width="280" height="225" fill="#121215" stroke="#3f3f46" stroke-width="1" />
            <rect x="670" y="45" width="280" height="30" fill="#1c1917" />
            <text x="685" y="65" fill="#f59e0b" font-weight="bold" font-size="10">3. DELIVERY TERMINAL (380px)</text>
            <text x="685" y="92" fill="#94a3b8" font-size="9">Target: http://localhost:3000/webhook [edit]</text>
            <rect x="685" y="102" width="250" height="26" rx="4" fill="#27272a" stroke="#10b981" />
            <text x="810" y="119" text-anchor="middle" fill="#4ade80" font-weight="bold" font-size="10">▶ Replay → localhost:3000</text>
            <rect x="685" y="138" width="250" height="40" rx="3" fill="#18181b" stroke="#27272a" />
            <text x="695" y="155" fill="#4ade80" font-weight="bold" font-size="10">200 OK · 9ms</text>
            <text x="695" y="170" fill="#94a3b8" font-size="8">Response: {"status":"success"}</text>
            <text x="685" y="196" fill="#71717a" font-size="9">ATTEMPT HISTORY (2 total)</text>
            <text x="685" y="212" fill="#4ade80" font-size="9">#2  200 OK (9ms)  14:02:15</text>
            <text x="685" y="226" fill="#f43f5e" font-size="9">#1  ERR fetch failed (41ms)  14:02:11</text>
          </svg>
        </div>
      </section>

      <section class="space-y-6">
        <div class="flex items-center space-x-3 border-b border-slate-700 dark:border-slate-800 light:border-slate-300 pb-3">
          <Terminal class="w-5 h-5 text-emerald-400" />
          <h2 class="text-xl font-bold font-mono">3. Deployment Options</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div class="bg-zinc-900/80 dark:bg-zinc-900/80 light:bg-white rounded-xl border border-slate-700 dark:border-slate-800 light:border-slate-300 p-6 space-y-4 flex flex-col justify-between">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold font-mono flex items-center space-x-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  <span>Railway (Full-Stack 1-Click)</span>
                </h3>
                <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">Recommended</span>
              </div>
              <p class="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">
                Runs both API server and built Vue dashboard in a single persistent container with persistent SQLite volume.
              </p>
              <div class="bg-zinc-950 dark:bg-zinc-950 light:bg-slate-100 rounded-lg p-3 font-mono text-xs text-slate-300 dark:text-slate-300 light:text-slate-800 overflow-x-auto relative">
                <code>railway up</code>
              </div>
            </div>
            <a
              href="https://railway.com/new"
              target="_blank"
              class="inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition"
            >
              <span>Deploy on Railway</span>
              <ExternalLink class="w-3.5 h-3.5" />
            </a>
          </div>

          <div class="bg-zinc-900/80 dark:bg-zinc-900/80 light:bg-white rounded-xl border border-slate-700 dark:border-slate-800 light:border-slate-300 p-6 space-y-4 flex flex-col justify-between">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold font-mono flex items-center space-x-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span>Fly.io (Global Edge Docker)</span>
                </h3>
                <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">Production</span>
              </div>
              <p class="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">
                Uses the multi-stage Dockerfile with an attached Fly persistent volume mounted to <code>/app/data</code>.
              </p>
              <div class="bg-zinc-950 dark:bg-zinc-950 light:bg-slate-100 rounded-lg p-3 font-mono text-xs text-slate-300 dark:text-slate-300 light:text-slate-800 overflow-x-auto">
                <code>fly launch --copy-config</code>
              </div>
            </div>
            <a
              href="https://fly.io/docs/hands-on/launch-app/"
              target="_blank"
              class="inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition"
            >
              <span>Deploy on Fly.io</span>
              <ExternalLink class="w-3.5 h-3.5" />
            </a>
          </div>

          <div class="bg-zinc-900/80 dark:bg-zinc-900/80 light:bg-white rounded-xl border border-slate-700 dark:border-slate-800 light:border-slate-300 p-6 space-y-4 flex flex-col justify-between">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold font-mono flex items-center space-x-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Docker & Docker Compose</span>
                </h3>
                <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">Self-Hosted</span>
              </div>
              <p class="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">
                Zero configuration self-hosted deployment. Runs Node 26 alpine with persistent database directory.
              </p>
              <div class="bg-zinc-950 dark:bg-zinc-950 light:bg-slate-100 rounded-lg p-3 font-mono text-xs text-slate-300 dark:text-slate-300 light:text-slate-800 overflow-x-auto">
                <code>docker compose up -d</code>
              </div>
            </div>
            <button
              @click="copyText('docker', 'docker compose up -d')"
              class="inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition"
            >
              <Check v-if="copiedSnippet === 'docker'" class="w-3.5 h-3.5" />
              <Copy v-else class="w-3.5 h-3.5" />
              <span>{{ copiedSnippet === 'docker' ? 'Command Copied!' : 'Copy Docker Run Command' }}</span>
            </button>
          </div>

          <div class="bg-zinc-900/80 dark:bg-zinc-900/80 light:bg-white rounded-xl border border-slate-700 dark:border-slate-800 light:border-slate-300 p-6 space-y-4 flex flex-col justify-between">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold font-mono flex items-center space-x-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                  <span>Vercel (Frontend Static Host)</span>
                </h3>
                <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">Client-Only</span>
              </div>
              <p class="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">
                Hosts the built Vue 3 static client on Vercel's global CDN and proxies <code>/api/*</code> to your deployed backend.
              </p>
              <div class="bg-zinc-950 dark:bg-zinc-950 light:bg-slate-100 rounded-lg p-3 font-mono text-xs text-slate-300 dark:text-slate-300 light:text-slate-800 overflow-x-auto">
                <code>vercel --prod</code>
              </div>
            </div>
            <a
              href="https://vercel.com/new"
              target="_blank"
              class="inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition border border-slate-700"
            >
              <span>Deploy on Vercel</span>
              <ExternalLink class="w-3.5 h-3.5" />
            </a>
          </div>

        </div>
      </section>

      <section class="space-y-6">
        <div class="flex items-center space-x-3 border-b border-slate-700 dark:border-slate-800 light:border-slate-300 pb-3">
          <ShieldCheck class="w-5 h-5 text-amber-400" />
          <h2 class="text-xl font-bold font-mono">4. Platform Integration Examples</h2>
        </div>

        <div class="space-y-4">
          <div class="bg-zinc-900/80 dark:bg-zinc-900/80 light:bg-white rounded-xl border border-slate-700 dark:border-slate-800 light:border-slate-300 p-5 space-y-3">
            <h3 class="font-bold text-sm font-mono text-emerald-400 dark:text-emerald-400 light:text-emerald-700">Shopify Integration</h3>
            <ol class="list-decimal list-inside space-y-1 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed">
              <li>Open your Shopify Admin panel: <strong>Settings &rarr; Notifications &rarr; Webhooks</strong>.</li>
              <li>Click <strong>Create webhook</strong>.</li>
              <li>Select Event: <code>Order creation</code> or <code>Order payment</code>.</li>
              <li>Set Format: <code>JSON</code>.</li>
              <li>Set URL: <code>https://your-domain.com/ingest/shopify/orders</code> (or your ngrok / tunnel URL).</li>
              <li>Click <strong>Send test notification</strong> — the order payload will pop up live in AuditHook!</li>
            </ol>
          </div>

          <div class="bg-zinc-900/80 dark:bg-zinc-900/80 light:bg-white rounded-xl border border-slate-700 dark:border-slate-800 light:border-slate-300 p-5 space-y-3">
            <h3 class="font-bold text-sm font-mono text-sky-400 dark:text-sky-400 light:text-sky-700">Stripe Integration</h3>
            <ol class="list-decimal list-inside space-y-1 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed">
              <li>Go to <strong>Stripe Dashboard &rarr; Developers &rarr; Webhooks</strong>.</li>
              <li>Click <strong>Add destination</strong>.</li>
              <li>Set Endpoint URL: <code>https://your-domain.com/ingest/stripe/webhooks</code>.</li>
              <li>Select events to listen for (e.g. <code>payment_intent.succeeded</code>, <code>charge.succeeded</code>).</li>
              <li>AuditHook detects the <code>stripe-signature</code> header and tags origin automatically.</li>
            </ol>
          </div>

          <div class="bg-zinc-900/80 dark:bg-zinc-900/80 light:bg-white rounded-xl border border-slate-700 dark:border-slate-800 light:border-slate-300 p-5 space-y-3">
            <h3 class="font-bold text-sm font-mono text-purple-400 dark:text-purple-400 light:text-purple-700">Public Tunnel with ngrok or Cloudflare</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div class="p-3 bg-zinc-950 dark:bg-zinc-950 light:bg-slate-100 rounded-lg border border-slate-800 dark:border-slate-800 light:border-slate-200">
                <span class="font-bold text-slate-200 dark:text-slate-200 light:text-slate-900">ngrok:</span>
                <code class="block mt-1 text-emerald-400 dark:text-emerald-400 light:text-emerald-600">ngrok http 4000</code>
              </div>
              <div class="p-3 bg-zinc-950 dark:bg-zinc-950 light:bg-slate-100 rounded-lg border border-slate-800 dark:border-slate-800 light:border-slate-200">
                <span class="font-bold text-slate-200 dark:text-slate-200 light:text-slate-900">Cloudflare Tunnel:</span>
                <code class="block mt-1 text-emerald-400 dark:text-emerald-400 light:text-emerald-600">cloudflared tunnel --url http://localhost:4000</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="space-y-6">
        <div class="flex items-center space-x-3 border-b border-slate-700 dark:border-slate-800 light:border-slate-300 pb-3">
          <Radio class="w-5 h-5 text-indigo-400" />
          <h2 class="text-xl font-bold font-mono">5. Core API Endpoints Reference</h2>
        </div>

        <div class="bg-zinc-900/80 dark:bg-zinc-900/80 light:bg-white rounded-xl border border-slate-700 dark:border-slate-800 light:border-slate-300 overflow-hidden">
          <table class="w-full text-left text-xs font-mono">
            <thead class="bg-zinc-950/80 dark:bg-zinc-950/80 light:bg-slate-100 border-b border-slate-700 dark:border-slate-800 light:border-slate-300 text-slate-400 dark:text-slate-400 light:text-slate-600">
              <tr>
                <th class="p-3">Method</th>
                <th class="p-3">Endpoint Path</th>
                <th class="p-3">Description</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 dark:divide-slate-800 light:divide-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-700">
              <tr>
                <td class="p-3 text-emerald-400 font-bold">ALL</td>
                <td class="p-3 text-white dark:text-white light:text-slate-900">/ingest/:endpointId/*</td>
                <td class="p-3">Universal ingress route. Accepts any payload and tags origin.</td>
              </tr>
              <tr>
                <td class="p-3 text-sky-400 font-bold">GET</td>
                <td class="p-3 text-white dark:text-white light:text-slate-900">/api/telemetry/stream</td>
                <td class="p-3">Server-Sent Events connection for real-time browser notifications.</td>
              </tr>
              <tr>
                <td class="p-3 text-emerald-400 font-bold">POST</td>
                <td class="p-3 text-white dark:text-white light:text-slate-900">/api/dispatch/replay</td>
                <td class="p-3">Forward a captured event to any target URL and record latency + status.</td>
              </tr>
              <tr>
                <td class="p-3 text-sky-400 font-bold">GET</td>
                <td class="p-3 text-white dark:text-white light:text-slate-900">/api/events</td>
                <td class="p-3">Query stored events with optional <code>?endpointId=</code> and <code>?limit=</code>.</td>
              </tr>
              <tr>
                <td class="p-3 text-rose-400 font-bold">DELETE</td>
                <td class="p-3 text-white dark:text-white light:text-slate-900">/api/events</td>
                <td class="p-3">Purge all logs or logs for a specific endpoint.</td>
              </tr>
              <tr>
                <td class="p-3 text-amber-400 font-bold">ALL</td>
                <td class="p-3 text-white dark:text-white light:text-slate-900">/api/test-target/webhook</td>
                <td class="p-3">Built-in echo target that returns 200 OK with received payload and headers.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </div>
  </div>
</template>
