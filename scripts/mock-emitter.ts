const baseUrl = process.env.AUDITHOOK_URL || 'http://localhost:4000';
const endpointId = process.env.ENDPOINT_ID || 'default';

function jitter(base: number, variance: number) {
  return base + Math.floor((Math.random() - 0.5) * 2 * variance);
}

function randomHex(len: number) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

function generateStripePayloads() {
  const customerId = `cus_R${randomHex(14)}`;
  const paymentIntentId = `pi_3${randomHex(14)}`;
  const chargeId = `ch_3${randomHex(14)}`;
  const invoiceId = `in_${randomHex(14)}`;
  const balanceTxId = `txn_${randomHex(14)}`;
  const reqIdBase = randomHex(12);
  const cfRayBase = randomHex(16);
  const t = Math.floor(Date.now() / 1000);

  return [
    {
      eventType: 'customer.created',
      path: `/ingest/${endpointId}/stripe/webhooks`,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'user-agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)',
        'stripe-signature': `t=${t},v1=${randomHex(64)},v0=${randomHex(64)}`,
        'cf-ray': `${cfRayBase}-FRA`,
        'x-request-id': `req_${reqIdBase}a`,
        'idempotency-key': `stripe-node-retry-${randomHex(8)}`
      },
      payload: {
        id: `evt_${randomHex(24)}`,
        object: 'event',
        api_version: '2024-06-20',
        created: t,
        livemode: false,
        pending_webhooks: 3,
        request: { id: `req_${reqIdBase}a`, idempotency_key: null },
        type: 'customer.created',
        data: {
          object: {
            id: customerId,
            object: 'customer',
            balance: 0,
            created: t,
            currency: null,
            default_source: null,
            delinquent: false,
            email: 'lena.hoffmann@nord-technik.de',
            invoice_prefix: 'NT9C2A',
            invoice_settings: {
              custom_fields: null,
              default_payment_method: null,
              footer: 'Nord Technik GmbH · Hamburger Str. 98 · 28205 Bremen',
              rendering_options: null
            },
            livemode: false,
            metadata: {
              erp_id: 'NT-8821-KND',
              crm_account: 'SF-004821',
              onboarding_source: 'enterprise_trial'
            },
            name: 'Lena Hoffmann',
            phone: '+49 421 8834712',
            preferred_locales: ['de', 'en'],
            shipping: {
              address: {
                city: 'Bremen',
                country: 'DE',
                line1: 'Hamburger Str. 98',
                line2: 'c/o Lena Hoffmann',
                postal_code: '28205',
                state: 'HB'
              },
              name: 'Lena Hoffmann',
              phone: '+49 421 8834712'
            },
            tax_exempt: 'none',
            tax_ids: { object: 'list', data: [], has_more: false, total_count: 0 }
          }
        }
      }
    },
    {
      eventType: 'payment_intent.created',
      path: `/ingest/${endpointId}/stripe/webhooks`,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'user-agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)',
        'stripe-signature': `t=${t + 1},v1=${randomHex(64)},v0=${randomHex(64)}`,
        'cf-ray': `${randomHex(16)}-FRA`,
        'x-request-id': `req_${reqIdBase}b`
      },
      payload: {
        id: `evt_${randomHex(24)}`,
        object: 'event',
        api_version: '2024-06-20',
        created: t + 1,
        livemode: false,
        type: 'payment_intent.created',
        data: {
          object: {
            id: paymentIntentId,
            object: 'payment_intent',
            amount: 348000,
            amount_capturable: 0,
            amount_received: 0,
            application: null,
            application_fee_amount: null,
            automatic_payment_methods: { allow_redirects: 'always', enabled: true },
            canceled_at: null,
            cancellation_reason: null,
            capture_method: 'automatic_async',
            client_secret: `${paymentIntentId}_secret_${randomHex(24)}`,
            confirmation_method: 'automatic',
            created: t + 1,
            currency: 'eur',
            customer: customerId,
            description: 'Enterprise License · Seat 12 · Nord Technik GmbH',
            invoice: invoiceId,
            last_payment_error: null,
            livemode: false,
            metadata: {
              erp_order: 'PO-2026-00412',
              seats: '12',
              plan: 'enterprise_annual'
            },
            payment_method: null,
            payment_method_configuration_details: null,
            payment_method_options: {
              card: { installments: null, mandate_options: null, network: null, request_three_d_secure: 'automatic' },
              sepa_debit: { mandate_options: {} },
              link: { persistent_token: null }
            },
            payment_method_types: ['card', 'sepa_debit', 'link'],
            processing: null,
            receipt_email: 'lena.hoffmann@nord-technik.de',
            review: null,
            setup_future_usage: 'off_session',
            shipping: null,
            source: null,
            statement_descriptor: null,
            statement_descriptor_suffix: null,
            status: 'requires_payment_method',
            transfer_data: null,
            transfer_group: null
          }
        }
      }
    },
    {
      eventType: 'payment_intent.succeeded',
      path: `/ingest/${endpointId}/stripe/webhooks`,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'user-agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)',
        'stripe-signature': `t=${t + 4},v1=${randomHex(64)},v0=${randomHex(64)}`,
        'cf-ray': `${randomHex(16)}-FRA`,
        'x-request-id': `req_${reqIdBase}c`
      },
      payload: {
        id: `evt_${randomHex(24)}`,
        object: 'event',
        api_version: '2024-06-20',
        created: t + 4,
        livemode: false,
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: paymentIntentId,
            object: 'payment_intent',
            amount: 348000,
            amount_received: 348000,
            currency: 'eur',
            customer: customerId,
            invoice: invoiceId,
            status: 'succeeded',
            charges: {
              object: 'list',
              data: [
                {
                  id: chargeId,
                  object: 'charge',
                  amount: 348000,
                  amount_captured: 348000,
                  amount_refunded: 0,
                  application_fee: null,
                  balance_transaction: balanceTxId,
                  billing_details: {
                    address: {
                      city: 'Bremen',
                      country: 'DE',
                      line1: 'Hamburger Str. 98',
                      postal_code: '28205',
                      state: 'HB'
                    },
                    email: 'lena.hoffmann@nord-technik.de',
                    name: 'Lena Hoffmann'
                  },
                  calculated_statement_descriptor: 'YOUR COMPANY',
                  captured: true,
                  created: t + 4,
                  currency: 'eur',
                  customer: customerId,
                  failure_code: null,
                  failure_message: null,
                  fraud_details: {},
                  invoice: invoiceId,
                  livemode: false,
                  metadata: {},
                  outcome: {
                    network_status: 'approved_by_network',
                    reason: null,
                    risk_level: 'normal',
                    risk_score: 27,
                    rule: { action: 'allow', id: `rule_${randomHex(10)}` },
                    seller_message: 'Payment complete.',
                    type: 'authorized'
                  },
                  paid: true,
                  payment_method_details: {
                    card: {
                      brand: 'visa',
                      checks: {
                        address_line1_check: 'pass',
                        address_postal_code_check: 'pass',
                        cvc_check: 'pass'
                      },
                      country: 'DE',
                      exp_month: 3,
                      exp_year: 2027,
                      fingerprint: randomHex(16),
                      funding: 'credit',
                      installments: null,
                      last4: '9209',
                      mandate: null,
                      network: 'visa',
                      three_d_secure: {
                        authenticated: true,
                        authentication_flow: 'challenge',
                        result: 'authenticated',
                        result_reason: null,
                        version: '2.2.0'
                      },
                      wallet: null
                    },
                    type: 'card'
                  },
                  receipt_email: 'lena.hoffmann@nord-technik.de',
                  receipt_number: null,
                  refunded: false,
                  review: null,
                  statement_descriptor: null,
                  status: 'succeeded'
                }
              ],
              has_more: false,
              total_count: 1
            }
          }
        }
      }
    }
  ];
}

function generateShopifyPayload() {
  const orderId = Math.floor(5810000000 + Math.random() * 99000000);
  const lineItemId1 = Math.floor(9200000000 + Math.random() * 900000000);
  const lineItemId2 = Math.floor(9200000000 + Math.random() * 900000000);
  const ts = new Date().toISOString();

  return {
    eventType: 'orders/create',
    path: `/ingest/${endpointId}/shopify/orders`,
    headers: {
      'content-type': 'application/json',
      'user-agent': 'Shopify-Captain-Hook',
      'x-shopify-topic': 'orders/create',
      'x-shopify-shop-domain': 'pakhaus-tools.myshopify.com',
      'x-shopify-order-id': String(orderId),
      'x-shopify-api-version': '2024-07',
      'x-shopify-hmac-sha256': randomHex(64),
      'x-shopify-webhook-id': `${randomHex(8)}-${randomHex(4)}-${randomHex(4)}-${randomHex(4)}-${randomHex(12)}`
    },
    payload: {
      id: orderId,
      admin_graphql_api_id: `gid://shopify/Order/${orderId}`,
      browser_ip: `94.${Math.floor(100 + Math.random() * 155)}.${Math.floor(10 + Math.random() * 240)}.${Math.floor(1 + Math.random() * 254)}`,
      buyer_accepts_marketing: false,
      cancel_reason: null,
      cancelled_at: null,
      cart_token: `c1-${randomHex(24)}`,
      checkout_id: Math.floor(100000000000 + Math.random() * 900000000000),
      checkout_token: randomHex(32),
      client_details: {
        accept_language: 'de-DE,de;q=0.9',
        browser_height: 900,
        browser_ip: '94.134.12.7',
        browser_width: 1440,
        session_hash: randomHex(32),
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      confirmed: true,
      contact_email: 'bestellung@pakhaus-tools.de',
      created_at: ts,
      currency: 'EUR',
      current_subtotal_price: '189.98',
      current_total_discounts: '0.00',
      current_total_duties_set: null,
      current_total_price: '226.08',
      current_total_tax: '36.10',
      email: 'bestellung@pakhaus-tools.de',
      estimated_taxes: false,
      financial_status: 'paid',
      fulfillment_status: null,
      gateway: 'shopify_payments',
      landing_site: '/collections/handwerkzeug',
      line_items: [
        {
          id: lineItemId1,
          admin_graphql_api_id: `gid://shopify/LineItem/${lineItemId1}`,
          fulfillable_quantity: 3,
          fulfillment_service: 'manual',
          fulfillment_status: null,
          gift_card: false,
          grams: 740,
          name: 'Knipex Cobra Wasserpumpenzange 250mm',
          price: '42.90',
          price_set: {
            shop_money: { amount: '42.90', currency_code: 'EUR' },
            presentment_money: { amount: '42.90', currency_code: 'EUR' }
          },
          product_id: Math.floor(7000000000000 + Math.random() * 999999999999),
          quantity: 3,
          requires_shipping: true,
          sku: 'KNP-8701250',
          taxable: true,
          title: 'Knipex Cobra Wasserpumpenzange',
          total_discount: '0.00',
          variant_id: Math.floor(40000000000000 + Math.random() * 9999999999999),
          variant_title: '250mm',
          vendor: 'Knipex',
          tax_lines: [
            { channel_liable: false, price: '24.41', rate: 0.19, title: 'MwSt. (19%)' }
          ]
        },
        {
          id: lineItemId2,
          admin_graphql_api_id: `gid://shopify/LineItem/${lineItemId2}`,
          fulfillable_quantity: 1,
          fulfillment_service: 'manual',
          fulfillment_status: null,
          gift_card: false,
          grams: 310,
          name: 'Wera Kraftform Kompakt 70 Screwdriver Set',
          price: '61.28',
          price_set: {
            shop_money: { amount: '61.28', currency_code: 'EUR' },
            presentment_money: { amount: '61.28', currency_code: 'EUR' }
          },
          product_id: Math.floor(7000000000000 + Math.random() * 999999999999),
          quantity: 1,
          requires_shipping: true,
          sku: 'WRA-KK-70-8',
          taxable: true,
          title: 'Wera Kraftform Kompakt 70 Set',
          total_discount: '0.00',
          variant_id: Math.floor(40000000000000 + Math.random() * 9999999999999),
          variant_title: '8-teilig',
          vendor: 'Wera',
          tax_lines: [
            { channel_liable: false, price: '11.69', rate: 0.19, title: 'MwSt. (19%)' }
          ]
        }
      ],
      note: 'Werkzeuglieferung für Werkstatt Hamburg-Nord',
      note_attributes: [
        { name: 'costcenter', value: 'WS-HH-04' },
        { name: 'requested_by', value: 'Thomas Dreher' }
      ],
      order_number: Math.floor(10000 + Math.random() * 89999),
      payment_gateway_names: ['shopify_payments'],
      phone: '+49 40 28491762',
      presentment_currency: 'EUR',
      processed_at: ts,
      processing_method: 'direct',
      referring_site: 'https://www.google.de',
      shipping_address: {
        first_name: 'Thomas',
        last_name: 'Dreher',
        company: 'Pakhaus Tools GmbH',
        address1: 'Billstraße 184',
        address2: 'Halle B',
        city: 'Hamburg',
        province: 'Hamburg',
        country: 'Germany',
        zip: '20539',
        phone: '+49 40 28491762',
        latitude: 53.5316,
        longitude: 10.0511,
        country_code: 'DE',
        province_code: 'HH'
      },
      source_name: 'web',
      subtotal_price: '189.98',
      tags: 'B2B, GEWERBE, WERKZEUG, 30-TAGE-ZAHLUNG',
      taxes_included: false,
      test: false,
      token: randomHex(32),
      total_discounts: '0.00',
      total_line_items_price: '189.98',
      total_price: '226.08',
      total_tax: '36.10',
      updated_at: ts
    }
  };
}

function generateGitHubDeploymentPayload() {
  return {
    eventType: 'deployment_status',
    path: `/ingest/${endpointId}/github/webhooks`,
    headers: {
      'content-type': 'application/json',
      'user-agent': `GitHub-Hookshot/${randomHex(7)}`,
      'x-github-event': 'deployment_status',
      'x-github-delivery': `${randomHex(8)}-${randomHex(4)}-${randomHex(4)}-${randomHex(4)}-${randomHex(12)}`,
      'x-github-hook-id': String(Math.floor(400000000 + Math.random() * 99999999)),
      'x-hub-signature': `sha1=${randomHex(40)}`,
      'x-hub-signature-256': `sha256=${randomHex(64)}`
    },
    payload: {
      deployment_status: {
        url: `https://api.github.com/repos/acme/backend-api/deployments/${Math.floor(1000000 + Math.random() * 9000000)}/statuses/${Math.floor(100000 + Math.random() * 900000)}`,
        id: Math.floor(100000 + Math.random() * 900000),
        node_id: `DST_${randomHex(20)}`,
        state: 'failure',
        creator: { login: 'cicd-bot', id: 92840311, type: 'Bot', site_admin: false },
        description: 'Deployment failed: health check timeout after 120s. 3/3 containers exited with SIGKILL.',
        environment: 'production',
        environment_url: 'https://api.acme.internal',
        log_url: `https://github.com/acme/backend-api/actions/runs/${Math.floor(10000000000 + Math.random() * 9000000000)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      deployment: {
        id: Math.floor(1000000 + Math.random() * 9000000),
        sha: randomHex(40),
        ref: 'main',
        task: 'deploy',
        payload: {
          strategy: 'rolling',
          cluster: 'prod-eu-central-1',
          min_ready_seconds: 30,
          replicas: 3
        },
        original_environment: 'production',
        environment: 'production',
        description: 'Deploy backend-api v2.14.3',
        creator: { login: 'deploy-action', id: 92840311, type: 'Bot' }
      },
      repository: {
        id: 598214901,
        node_id: `R_kgDO${randomHex(10)}`,
        name: 'backend-api',
        full_name: 'acme/backend-api',
        private: true,
        default_branch: 'main',
        language: 'TypeScript',
        pushed_at: new Date().toISOString()
      },
      sender: { login: 'cicd-bot', id: 92840311, type: 'Bot' },
      installation: { id: Math.floor(10000000 + Math.random() * 9000000), node_id: `I_kwDO${randomHex(10)}` }
    }
  };
}

async function sendRequest(item: { path: string; headers: Record<string, string>; payload: any; eventType: string }) {
  const url = `${baseUrl}${item.path}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: item.headers,
      body: JSON.stringify(item.payload)
    });
    const data = await res.json();
    console.log(`\x1b[32m✔ [${item.eventType}]\x1b[0m → Event ID: \x1b[36m${data.eventId}\x1b[0m  (${res.status})`);
    return data.eventId as string;
  } catch (err: any) {
    console.error(`\x1b[31m✖ [${item.eventType}]\x1b[0m  ${err.message}`);
    return null;
  }
}

async function triggerForwardToEchoTarget(eventId: string) {
  try {
    await fetch(`${baseUrl}/api/dispatch/replay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        targetUrl: `${baseUrl}/api/test-target/webhook`
      })
    });
  } catch {}
}

async function triggerForwardToDeadTarget(eventId: string) {
  try {
    await fetch(`${baseUrl}/api/dispatch/replay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        targetUrl: `http://127.0.0.1:9999/webhook`
      })
    });
  } catch {}
}

async function runStripeBillingBurst() {
  console.log(`\x1b[34m▶ Stripe Checkout & Billing lifecycle...\x1b[0m`);
  const events = generateStripePayloads();
  const delays = [jitter(112, 38), jitter(263, 74), jitter(91, 22)];

  for (let i = 0; i < events.length; i++) {
    const id = await sendRequest(events[i]);
    if (id) {
      if (i === 0) {
        await triggerForwardToDeadTarget(id);
        await new Promise((r) => setTimeout(r, jitter(80, 20)));
        await triggerForwardToEchoTarget(id);
      } else {
        await triggerForwardToEchoTarget(id);
      }
    }
    if (i < events.length - 1) {
      await new Promise((r) => setTimeout(r, delays[i]));
    }
  }
}

async function runShopifyOrder() {
  console.log(`\x1b[34m▶ Shopify B2B order...\x1b[0m`);
  const id = await sendRequest(generateShopifyPayload());
  if (id) {
    await triggerForwardToEchoTarget(id);
  }
}

async function runGitHubDeploymentFailure() {
  console.log(`\x1b[34m▶ GitHub deployment failure...\x1b[0m`);
  const id = await sendRequest(generateGitHubDeploymentPayload());
  if (id) {
    await triggerForwardToDeadTarget(id);
    await new Promise((r) => setTimeout(r, jitter(60, 25)));
    await triggerForwardToDeadTarget(id);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isLoop = args.includes('--loop');

  console.log(`\x1b[36m⚡ AuditHook Webhook Emitter\x1b[0m  ${baseUrl}/ingest/${endpointId}\n`);

  if (isLoop) {
    console.log(`Continuous mode — Ctrl+C to stop\n`);
    while (true) {
      await runStripeBillingBurst();
      await new Promise((r) => setTimeout(r, jitter(1800, 600)));
      await runShopifyOrder();
      await new Promise((r) => setTimeout(r, jitter(900, 400)));
      await runGitHubDeploymentFailure();
      await new Promise((r) => setTimeout(r, jitter(3000, 1000)));
    }
  } else {
    await runStripeBillingBurst();
    await new Promise((r) => setTimeout(r, jitter(220, 80)));
    await runShopifyOrder();
    await new Promise((r) => setTimeout(r, jitter(140, 60)));
    await runGitHubDeploymentFailure();
    console.log(`\n\x1b[32m✔ Done.\x1b[0m`);
  }
}

main();
