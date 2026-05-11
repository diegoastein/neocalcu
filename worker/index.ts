interface Env {
  DONATIONS_KV: KVNamespace;
  MP_ACCESS_TOKEN: string;
  MP_WEBHOOK_SECRET: string;
  ADMIN_SECRET: string;
}

interface DonationRecord {
  ts: number;
  plan: 'mensual' | 'anual';
}

const ALLOWED_ORIGINS = ['https://diegoastein.github.io'];
const MP_API = 'https://api.mercadopago.com';

function corsHeaders(origin: string): HeadersInit {
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin);
  if (isAllowed) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
  }
  return {};
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function parseDonationRecord(value: string): DonationRecord {
  try {
    return JSON.parse(value) as DonationRecord;
  } catch {
    // Formato anterior: solo timestamp → asumir mensual
    return { ts: parseInt(value), plan: 'mensual' };
  }
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

    // ── Crear pago MercadoPago ─────────────────────────────────────────────
    if (url.pathname === '/crear-pago' && request.method === 'GET') {
      const device = url.searchParams.get('device');
      if (!device) {
        return new Response(JSON.stringify({ error: 'missing device' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      const plan = url.searchParams.get('plan') ?? 'mensual';
      const unitPrice = plan === 'anual' ? 28000 : 3500;
      const itemTitle = plan === 'anual' ? 'Apoyo anual a NeoCalcu' : 'Apoyo mensual a NeoCalcu';

      const notificationUrl = `${url.protocol}//${url.host}/webhook`;
      const body = {
        items: [{ title: itemTitle, quantity: 1, currency_id: 'ARS', unit_price: unitPrice }],
        back_urls: {
          success: 'https://diegoastein.github.io/neocalcu/?paid=1',
          failure: 'https://diegoastein.github.io/neocalcu/?paid=0',
          pending: 'https://diegoastein.github.io/neocalcu/?paid=0',
        },
        auto_return: 'approved',
        notification_url: notificationUrl,
        external_reference: device,
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

    // ── Webhook MercadoPago ────────────────────────────────────────────────
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
          transaction_amount: number;
        };
        if (payment.status === 'approved' && payment.external_reference) {
          const plan: 'mensual' | 'anual' = payment.transaction_amount >= 28000 ? 'anual' : 'mensual';
          const record: DonationRecord = { ts: Date.now(), plan };
          await env.DONATIONS_KV.put(payment.external_reference, JSON.stringify(record));
        }
      }

      return new Response('ok', { status: 200 });
    }

    // ── Verificar donación ─────────────────────────────────────────────────
    if (url.pathname === '/verificar' && request.method === 'GET') {
      const device = url.searchParams.get('device');
      if (!device) {
        return new Response(JSON.stringify({ donated: false }), {
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      const value = await env.DONATIONS_KV.get(device);
      if (value) {
        const record = parseDonationRecord(value);
        return new Response(JSON.stringify({ donated: true, timestamp: record.ts.toString(), plan: record.plan }), {
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      return new Response(JSON.stringify({ donated: false }), {
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    // ── Generar cupón (admin) ──────────────────────────────────────────────
    if (url.pathname === '/generar-cupon' && request.method === 'GET') {
      const secret = url.searchParams.get('secret');
      if (!secret || secret !== env.ADMIN_SECRET) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const plan: 'mensual' | 'anual' = url.searchParams.get('plan') === 'anual' ? 'anual' : 'mensual';
      const code = (url.searchParams.get('code') ?? generateCode()).toUpperCase();
      const existing = await env.DONATIONS_KV.get(`coupon:${code}`);
      if (existing) {
        return new Response(JSON.stringify({ error: 'code_exists', code }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      await env.DONATIONS_KV.put(`coupon:${code}`, JSON.stringify({ active: true, createdAt: Date.now(), plan }));
      return new Response(JSON.stringify({ code, plan }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ── Canjear cupón ─────────────────────────────────────────────────────
    if (url.pathname === '/canjear-cupon' && request.method === 'GET') {
      const device = url.searchParams.get('device');
      const code = url.searchParams.get('code')?.toUpperCase();

      if (!device || !code) {
        return new Response(JSON.stringify({ error: 'missing_params' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      const couponRaw = await env.DONATIONS_KV.get(`coupon:${code}`);
      if (!couponRaw) {
        return new Response(JSON.stringify({ error: 'invalid_code' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      const coupon = JSON.parse(couponRaw) as { active: boolean; plan: 'mensual' | 'anual' };
      if (!coupon.active) {
        return new Response(JSON.stringify({ error: 'used_code' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      const now = Date.now();
      const plan = coupon.plan ?? 'mensual';
      await env.DONATIONS_KV.put(`coupon:${code}`, JSON.stringify({ active: false, usedBy: device, usedAt: now, plan }));
      const record: DonationRecord = { ts: now, plan };
      await env.DONATIONS_KV.put(device, JSON.stringify(record));

      return new Response(JSON.stringify({ success: true, plan }), {
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
