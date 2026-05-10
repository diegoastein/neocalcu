interface Env {
  DONATIONS_KV: KVNamespace;
  MP_ACCESS_TOKEN: string;
  MP_WEBHOOK_SECRET: string;
}

const ALLOWED_ORIGINS = ['https://diegoastein.github.io', 'http://localhost:5173', 'http://localhost:4173'];
const MP_API = 'https://api.mercadopago.com';

type Plan = 'mensual' | 'anual';

interface KVEntry {
  ts: number;
  plan: Plan;
}

interface CouponEntry {
  used: boolean;
  plan: Plan;
}

const PRICES: Record<Plan, number> = {
  mensual: 3500,
  anual: 28000,
};

function parseKVEntry(raw: string): KVEntry {
  try {
    const parsed = JSON.parse(raw) as KVEntry;
    if (parsed.ts && parsed.plan) return parsed;
  } catch { /* legacy string format */ }
  return { ts: parseInt(raw) || Date.now(), plan: 'mensual' };
}

function corsHeaders(origin: string): HeadersInit {
  if (ALLOWED_ORIGINS.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
  }
  return {};
}

async function verifySignature(
  secret: string,
  xSignature: string,
  xRequestId: string,
  dataId: string
): Promise<boolean> {
  const parts: Record<string, string> = {};
  xSignature.split(',').forEach(part => {
    const [k, v] = part.split('=');
    if (k && v) parts[k.trim()] = v.trim();
  });
  const ts = parts['ts'];
  const v1 = parts['v1'];
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(manifest));
  const computed = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return computed === v1;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // POST /crear-pago?device=<id>&plan=mensual|anual
    if (url.pathname === '/crear-pago' && request.method === 'GET') {
      const device = url.searchParams.get('device');
      const planParam = url.searchParams.get('plan');
      const plan: Plan = planParam === 'anual' ? 'anual' : 'mensual';

      if (!device) {
        return new Response(JSON.stringify({ error: 'missing device' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      const notificationUrl = `${url.protocol}//${url.host}/webhook`;
      const title = plan === 'anual' ? 'NeoCalcu — Apoyo anual' : 'NeoCalcu — Cafecito mensual';

      const body = {
        items: [{ title, quantity: 1, currency_id: 'ARS', unit_price: PRICES[plan] }],
        back_urls: {
          success: 'https://diegoastein.github.io/neocalcu/?paid=1',
          failure: 'https://diegoastein.github.io/neocalcu/?paid=0',
          pending: 'https://diegoastein.github.io/neocalcu/?paid=0',
        },
        auto_return: 'approved',
        notification_url: notificationUrl,
        external_reference: device,
        metadata: { plan },
      };

      const mpRes = await fetch(`${MP_API}/checkout/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(body),
      });

      if (!mpRes.ok) {
        const err = await mpRes.text();
        return new Response(JSON.stringify({ error: err }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      const data = (await mpRes.json()) as { init_point: string };
      return new Response(JSON.stringify({ init_point: data.init_point }), {
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    // POST /webhook — MercadoPago payment notification
    if (url.pathname === '/webhook' && request.method === 'POST') {
      const xSignature = request.headers.get('x-signature') || '';
      const xRequestId = request.headers.get('x-request-id') || '';

      let body: Record<string, unknown>;
      try {
        body = (await request.json()) as Record<string, unknown>;
      } catch {
        return new Response('ok', { status: 200 });
      }

      const dataId = String((body.data as Record<string, unknown>)?.id ?? body.id ?? '');
      if (!dataId) return new Response('ok', { status: 200 });

      const valid = await verifySignature(env.MP_WEBHOOK_SECRET, xSignature, xRequestId, dataId);
      if (!valid) return new Response('ok', { status: 200 });

      const paymentRes = await fetch(`${MP_API}/v1/payments/${dataId}`, {
        headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
      });

      if (paymentRes.ok) {
        const payment = (await paymentRes.json()) as {
          status: string;
          external_reference: string;
          metadata?: { plan?: string };
        };
        if (payment.status === 'approved' && payment.external_reference) {
          const plan: Plan = payment.metadata?.plan === 'anual' ? 'anual' : 'mensual';
          const entry: KVEntry = { ts: Date.now(), plan };
          await env.DONATIONS_KV.put(payment.external_reference, JSON.stringify(entry));
        }
      }

      return new Response('ok', { status: 200 });
    }

    // GET /verificar?device=<id>
    if (url.pathname === '/verificar' && request.method === 'GET') {
      const device = url.searchParams.get('device');
      if (!device) {
        return new Response(JSON.stringify({ donated: false }), {
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      const raw = await env.DONATIONS_KV.get(device);
      if (raw) {
        const entry = parseKVEntry(raw);
        return new Response(
          JSON.stringify({ donated: true, timestamp: entry.ts.toString(), plan: entry.plan }),
          { headers: { 'Content-Type': 'application/json', ...cors } }
        );
      }

      return new Response(JSON.stringify({ donated: false }), {
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    // GET /canjear-cupon?device=<id>&code=<code>
    // Para crear cupones: wrangler kv:key put "coupon:SORTEO2026" '{"used":false,"plan":"anual"}'
    if (url.pathname === '/canjear-cupon' && request.method === 'GET') {
      const device = url.searchParams.get('device');
      const code = url.searchParams.get('code')?.toUpperCase().trim();

      if (!device || !code) {
        return new Response(JSON.stringify({ ok: false, error: 'missing_params' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      const couponRaw = await env.DONATIONS_KV.get(`coupon:${code}`);
      if (!couponRaw) {
        return new Response(JSON.stringify({ ok: false, error: 'invalid' }), {
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      let coupon: CouponEntry;
      try {
        coupon = JSON.parse(couponRaw) as CouponEntry;
      } catch {
        return new Response(JSON.stringify({ ok: false, error: 'invalid' }), {
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      if (coupon.used) {
        return new Response(JSON.stringify({ ok: false, error: 'used' }), {
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      await env.DONATIONS_KV.put(`coupon:${code}`, JSON.stringify({ ...coupon, used: true }));
      const entry: KVEntry = { ts: Date.now(), plan: coupon.plan };
      await env.DONATIONS_KV.put(device, JSON.stringify(entry));

      return new Response(JSON.stringify({ ok: true, plan: coupon.plan }), {
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
