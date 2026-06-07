interface Env {
  DONATIONS_KV: KVNamespace;
  MP_ACCESS_TOKEN: string;
  MP_WEBHOOK_SECRET: string;
  ADMIN_SECRET: string;
  ANTHROPIC_API_KEY: string;
  RESEND_API_KEY: string;
}

interface MPPaymentRaw {
  id: number;
  status: string;
  transaction_amount: number;
  external_reference?: string | null;
  payer?: { email?: string | null; first_name?: string | null; last_name?: string | null };
  date_created: string;
  date_approved?: string | null;
  money_release_date?: string | null;
}

interface DonationRecord {
  ts: number;
  plan: 'mensual' | 'anual';
  durationMs?: number;
}

interface EmailRecord {
  deviceId: string;
  ts: number;
  plan: 'mensual' | 'anual';
  durationMs?: number;
}

interface CouponRecord {
  active: boolean;
  createdAt: number;
  plan: 'mensual' | 'anual';
  source?: 'regalo' | 'takenos';
  email?: string;
  usedBy?: string;
  usedAt?: number;
}

const ALLOWED_ORIGINS = ['https://diegoastein.github.io', 'https://neocalcu.pro'];
const MP_API = 'https://api.mercadopago.com';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

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

// Admin endpoints permiten cualquier origen (protegidos por ADMIN_SECRET)
const adminCors: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Secret',
};

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function parseDonationRecord(value: string): DonationRecord {
  try {
    const parsed = JSON.parse(value);
    // Formato nuevo: objeto JSON con ts y plan
    if (parsed !== null && typeof parsed === 'object') return parsed as DonationRecord;
    // Formato legacy: timestamp como número puro
    const ts = typeof parsed === 'number' ? parsed : parseInt(value);
    return { ts, plan: 'mensual' };
  } catch {
    return { ts: parseInt(value), plan: 'mensual' };
  }
}

function isMembershipActive(record: DonationRecord): boolean {
  const duration = record.durationMs ?? (record.plan === 'anual' ? ONE_YEAR_MS : THIRTY_DAYS_MS);
  return Date.now() - record.ts < duration;
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

function checkAdminAuth(request: Request, url: URL, env: Env): boolean {
  const secretParam = url.searchParams.get('secret');
  const secretHeader = request.headers.get('X-Admin-Secret');
  return (secretParam ?? secretHeader) === env.ADMIN_SECRET;
}

const CONTENT_SYSTEM_PROMPT = `Sos el community manager de NeoCalcu, una app de neonatología usada en Argentina. La usan médicos y enfermeras en la UCIN: calcula dosis de medicamentos, procedimientos neonatales, índices clínicos (Silverman, Apgar, bilirrubina NICE, screening ROP, Finnegan) y laboratorio neonatal. Tiene período de prueba gratis y cuesta $3.500/mes o $28.000/año. El link es www.neocalcu.pro.

Tono: directo, de colega a colega. Como alguien que trabaja en la UCIN y encontró algo útil. Sin marketing, sin "revolucionario", sin "potente herramienta", sin "nos complace anunciar". Frases cortas y concretas.

Reglas fijas:
- Siempre "UCIN", nunca "NICU"
- Español rioplatense: vos, ustedes
- No inventés funciones que no existen
- Devolvés solo el contenido pedido, sin explicaciones ni preambles`;

type ContentType = 'post' | 'reel' | 'story' | 'whatsapp' | 'release';

function buildContentPrompt(tipo: ContentType, contexto: string): string {
  const prompts: Record<ContentType, string> = {
    post: `Generá el contenido para un post de Instagram sobre NeoCalcu:

"${contexto}"

Devolvé ÚNICAMENTE este JSON válido, sin markdown, sin texto adicional:
{"headline":"[título directo, máximo 8 palabras, sin signos de admiración innecesarios]","body":"[2-3 oraciones directas y útiles, máximo 180 caracteres, con emoji solo si aporta]","hashtags":"#neonatología #UCIN #pediatría #neonatólogos #medicamentos #calculadoramédica [3-4 hashtags más específicos al tema]"}`,

    reel: `Generá el contenido para un Reel de Instagram (4 slides) sobre NeoCalcu:

"${contexto}"

Devolvé ÚNICAMENTE este JSON válido, sin markdown, sin texto adicional:
{"slides":[{"label":"SLIDE 1","text":"[pregunta o dato que para el scroll, máx 10 palabras]"},{"label":"SLIDE 2","text":"[el dolor concreto que resuelve, máx 15 palabras]"},{"label":"SLIDE 3","text":"[cómo NeoCalcu lo resuelve, específico, máx 20 palabras]"},{"label":"SLIDE 4","text":"[acción concreta y simple, máx 8 palabras]"}]}`,

    story: `Generá el contenido para 4 stories de Instagram sobre NeoCalcu:

"${contexto}"

Devolvé ÚNICAMENTE este JSON válido, sin markdown, sin texto adicional:
{"slides":[{"label":"STORY 1","text":"[frase de impacto o pregunta que engancha, máx 10 palabras]"},{"label":"STORY 2","text":"[el problema concreto que resuelve, máx 15 palabras]"},{"label":"STORY 3","text":"[cómo NeoCalcu lo resuelve, específico, máx 20 palabras]"},{"label":"STORY 4","text":"[CTA directo — www.neocalcu.pro, máx 8 palabras]"}]}`,

    whatsapp: `Redactá un mensaje para grupos de WhatsApp de médicos neonatólogos sobre:

"${contexto}"

Máximo 4 líneas. Profesional y directo. Sin saludos genéricos. Incluí el link: www.neocalcu.pro
Máximo 2 emojis. Apropiado para grupos con jefes de servicio.

Devolvé solo el mensaje.`,

    release: `Generá las novedades de NeoCalcu para comunicar a los usuarios:

"${contexto}"

Formato:
🆕 Novedades — [mes año]

• [emoji] [novedad en una línea, orientada al beneficio clínico]
• ...

[línea final agradeciendo a suscriptores]

Sin jerga técnica. Como se lo contarías a un colega.`,
  };

  return prompts[tipo];
}

async function sendWelcomeEmail(email: string, plan: 'mensual' | 'anual', ts: number, env: Env, couponCode?: string, durationMs?: number): Promise<void> {
  const isPromo = plan === 'mensual' && durationMs && durationMs > THIRTY_DAYS_MS;
  const planLabel = plan === 'anual' ? 'Anual' : (isPromo ? 'Mensual · Promo 3×1' : 'Mensual');
  const duration = durationMs ?? (plan === 'anual' ? ONE_YEAR_MS : THIRTY_DAYS_MS);
  const expiresDate = new Date(ts + duration);
  const expiresStr = expiresDate.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1e293b;">
      <h2 style="color:#059669;margin-bottom:8px;">Bienvenido a NeoCalcu</h2>
      <p>Tu suscripción <strong>${planLabel}</strong> está activa y vence el <strong>${expiresStr}</strong>.</p>
      <p>Tenés acceso completo a todas las herramientas de la UCIN:</p>
      <ul style="line-height:1.8;">
        <li><strong>Medicamentos neonatales</strong> — dosis por peso, infusiones continuas y calculadoras inotrópicas interactivas (dopamina, dobutamina, adrenalina, milrinona, norepinefrina)</li>
        <li><strong>24 procedimientos</strong> con fórmulas interactivas y pasos detallados</li>
        <li><strong>Índices clínicos:</strong> Silverman-Anderson, Apgar, Finnegan/NAS, bilirrubina NICE CG98, screening ROP SAP 2021</li>
        <li><strong>Fórmulas médicas</strong> — superficie corporal, clearance de creatinina, balance hidroelectrolítico, cilindro de O₂ y más</li>
        <li><strong>Laboratorio neonatal</strong> — 85 valores de referencia en 12 categorías (gasometría, hemograma, electrolitos, coagulación, función hepática, tiroidea, LCR, orina, marcadores cardíacos y más)</li>
        <li><strong>Multi-paciente</strong> — hasta 4 pacientes simultáneos con datos independientes</li>
        <li><strong>Favoritos</strong> — acceso rápido a tus herramientas más usadas</li>
        <li><strong>Notas por procedimiento</strong> — anotaciones libres persistentes</li>
        <li><strong>Compartir resultados</strong> — compartí cálculos directamente desde la app</li>
      </ul>
      <p style="background:#f0fdf4;border-left:4px solid #059669;padding:10px 14px;border-radius:4px;font-size:14px;margin-top:16px;">
        Todas las funciones que se agreguen en el futuro estarán disponibles automáticamente para todos los usuarios premium sin costo adicional.
      </p>
      ${couponCode ? `
      <p style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px 16px;border-radius:6px;font-size:14px;margin-top:16px;">
        Tu código de acceso: <strong style="font-family:monospace;letter-spacing:0.15em;font-size:16px;">${couponCode}</strong>
      </p>` : ''}
      <p style="background:#fefce8;border-left:4px solid #ca8a04;padding:10px 14px;border-radius:4px;font-size:14px;margin-top:16px;">
        <strong>Guardá este email.</strong> Si cambiás de dispositivo o reinstalás la app, podés recuperar tu suscripción desde la pantalla de inicio ingresando esta dirección de email.
      </p>
      <p style="margin-top:24px;">
        <a href="https://www.neocalcu.pro"
           style="background:#059669;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">
          Abrir NeoCalcu
        </a>
      </p>
      <p style="color:#64748b;font-size:13px;margin-top:24px;">
        Si tenés algún problema, duda o inquietud podés plantearlo por este medio o por DM en Instagram.
      </p>
    </div>
  `;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'NeoCalcu <info@neomonitor.pro>',
        to: email,
        subject: '¡Bienvenido a NeoCalcu!',
        html,
      }),
    });
  } catch {
    // No bloqueamos el flujo si falla el envío
  }
}

async function sendRenewalReminderEmail(email: string, plan: 'mensual' | 'anual', expiresAt: Date, env: Env): Promise<void> {
  const planLabel = plan === 'anual' ? 'Anual' : 'Mensual';
  const expiresStr = expiresAt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1e293b;">
      <h2 style="color:#d97706;margin-bottom:8px;">Tu suscripción vence en 3 días</h2>
      <p>Tu suscripción <strong>${planLabel}</strong> a NeoCalcu vence el <strong>${expiresStr}</strong>.</p>
      <p>Para seguir teniendo acceso a todas las herramientas de la UCIN, renovála antes de esa fecha.</p>
      <p style="margin-top:24px;">
        <a href="https://www.neocalcu.pro"
           style="background:#059669;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">
          Renovar suscripción
        </a>
      </p>
      <p style="color:#64748b;font-size:13px;margin-top:24px;">
        Si tenés algún problema, duda o inquietud podés plantearlo por este medio o por DM en Instagram.
      </p>
    </div>
  `;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'NeoCalcu <info@neomonitor.pro>',
        to: email,
        subject: 'Tu suscripción a NeoCalcu vence en 3 días',
        html,
      }),
    });
  } catch {
    // No bloqueamos el flujo si falla el envío
  }
}

async function runRenewalReminders(env: Env): Promise<void> {
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const windowStart = now + THREE_DAYS_MS;
  const windowEnd = windowStart + 24 * 60 * 60 * 1000;

  const keys = await env.DONATIONS_KV.list({ prefix: 'email:' });

  await Promise.all(
    keys.keys.map(async key => {
      const email = key.name.replace('email:', '');
      const raw = await env.DONATIONS_KV.get(key.name);
      if (!raw) return;

      const data = JSON.parse(raw) as EmailRecord;
      const duration = data.durationMs ?? (data.plan === 'anual' ? ONE_YEAR_MS : THIRTY_DAYS_MS);
      const expiresAt = data.ts + duration;

      if (expiresAt < windowStart || expiresAt >= windowEnd) return;

      const reminderKey = `reminder:${email}:${data.ts}`;
      const alreadySent = await env.DONATIONS_KV.get(reminderKey);
      if (alreadySent) return;

      await sendRenewalReminderEmail(email, data.plan, new Date(expiresAt), env);
      await env.DONATIONS_KV.put(reminderKey, '1', { expirationTtl: 7 * 24 * 60 * 60 });
    })
  );
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    await runRenewalReminders(env);
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      const isAdmin = url.pathname.startsWith('/admin/');
      return new Response(null, { status: 204, headers: isAdmin ? adminCors : cors });
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
          payer?: { email?: string };
        };
        if (payment.status === 'approved' && payment.external_reference) {
          const plan: 'mensual' | 'anual' = payment.transaction_amount >= 28000 ? 'anual' : 'mensual';
          const promoRaw = await env.DONATIONS_KV.get('promo_3x1_active');
          const promoActive = promoRaw === '1';
          const durationMs = plan === 'mensual' && promoActive ? THREE_MONTHS_MS : undefined;
          const record: DonationRecord = { ts: Date.now(), plan, ...(durationMs ? { durationMs } : {}) };
          await env.DONATIONS_KV.put(payment.external_reference, JSON.stringify(record));
          if (payment.payer?.email) {
            const emailKey = `email:${payment.payer.email.toLowerCase()}`;
            const emailRecord: EmailRecord = { deviceId: payment.external_reference, ts: record.ts, plan, ...(durationMs ? { durationMs } : {}) };
            await env.DONATIONS_KV.put(emailKey, JSON.stringify(emailRecord));
            await sendWelcomeEmail(payment.payer.email.toLowerCase(), plan, record.ts, env, undefined, durationMs);
          }
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
        return new Response(JSON.stringify({ donated: true, timestamp: record.ts.toString(), plan: record.plan, ...(record.durationMs ? { durationMs: record.durationMs } : {}) }), {
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

      const coupon = JSON.parse(couponRaw) as CouponRecord;
      if (!coupon.active) {
        return new Response(JSON.stringify({ error: 'used_code' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      const now = Date.now();
      const plan = coupon.plan ?? 'mensual';
      await env.DONATIONS_KV.put(`coupon:${code}`, JSON.stringify({ active: false, usedBy: device, usedAt: now, plan, email: coupon.email }));
      const record: DonationRecord = { ts: now, plan };
      await env.DONATIONS_KV.put(device, JSON.stringify(record));

      // Si el cupón tenía email asignado, registrarlo automáticamente en KV
      if (coupon.email) {
        const emailRecord: EmailRecord = { deviceId: device, ts: now, plan };
        await env.DONATIONS_KV.put(`email:${coupon.email}`, JSON.stringify(emailRecord));
        await sendWelcomeEmail(coupon.email, plan, now, env, code);
      }

      return new Response(JSON.stringify({ success: true, plan, ...(coupon.email ? { email: coupon.email } : {}) }), {
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    // ── Recuperar suscripción por email (nuevo dispositivo) ───────────────
    if (url.pathname === '/recuperar' && request.method === 'GET') {
      const email = url.searchParams.get('email')?.toLowerCase();
      const device = url.searchParams.get('device');

      if (!email || !device) {
        return new Response(JSON.stringify({ success: false, error: 'missing_params' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      const raw = await env.DONATIONS_KV.get(`email:${email}`);
      if (!raw) {
        return new Response(JSON.stringify({ success: false, error: 'not_found' }), {
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      const emailRecord = JSON.parse(raw) as EmailRecord;
      const record: DonationRecord = { ts: emailRecord.ts, plan: emailRecord.plan, ...(emailRecord.durationMs ? { durationMs: emailRecord.durationMs } : {}) };

      // Copiar datos de usuario del dispositivo anterior al nuevo
      let userData: { favorites: string[]; notes: Record<string, string> } | null = null;
      const oldDeviceId = emailRecord.deviceId;
      if (oldDeviceId && oldDeviceId !== device) {
        const oldUserDataRaw = await env.DONATIONS_KV.get(`userdata:${oldDeviceId}`);
        if (oldUserDataRaw) {
          try {
            userData = JSON.parse(oldUserDataRaw) as { favorites: string[]; notes: Record<string, string> };
            await env.DONATIONS_KV.put(`userdata:${device}`, oldUserDataRaw);
          } catch { /* ignore */ }
        }
        // Invalidar el dispositivo anterior
        await env.DONATIONS_KV.delete(oldDeviceId);
      }

      await env.DONATIONS_KV.put(device, JSON.stringify(record));
      await env.DONATIONS_KV.put(`email:${email}`, JSON.stringify({ deviceId: device, ts: emailRecord.ts, plan: emailRecord.plan } as EmailRecord));

      return new Response(JSON.stringify({
        success: true,
        plan: record.plan,
        timestamp: record.ts.toString(),
        ...(record.durationMs ? { durationMs: record.durationMs } : {}),
        ...(userData ? { userData } : {}),
      }), {
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    // ── Recuperar suscripción por código de cupón ────────────────────────
    if (url.pathname === '/recuperar-cupon' && request.method === 'GET') {
      const device = url.searchParams.get('device');
      const code = url.searchParams.get('code')?.toUpperCase();

      if (!device || !code) {
        return new Response(JSON.stringify({ success: false, error: 'missing_params' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      const couponRaw = await env.DONATIONS_KV.get(`coupon:${code}`);
      if (!couponRaw) {
        return new Response(JSON.stringify({ success: false, error: 'not_found' }), {
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      const coupon = JSON.parse(couponRaw) as CouponRecord;
      if (coupon.active || !coupon.usedBy) {
        return new Response(JSON.stringify({ success: false, error: 'not_redeemed' }), {
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      const oldDeviceId = coupon.usedBy;
      const plan = coupon.plan;
      const ts = coupon.usedAt ?? Date.now();

      let userData: { favorites: string[]; notes: Record<string, string> } | null = null;
      if (oldDeviceId !== device) {
        const oldUserDataRaw = await env.DONATIONS_KV.get(`userdata:${oldDeviceId}`);
        if (oldUserDataRaw) {
          try {
            userData = JSON.parse(oldUserDataRaw) as { favorites: string[]; notes: Record<string, string> };
            await env.DONATIONS_KV.put(`userdata:${device}`, oldUserDataRaw);
          } catch { /* ignore */ }
        }
        await env.DONATIONS_KV.delete(oldDeviceId);
      }

      const record: DonationRecord = { ts, plan };
      await env.DONATIONS_KV.put(device, JSON.stringify(record));
      await env.DONATIONS_KV.put(`coupon:${code}`, JSON.stringify({ ...coupon, usedBy: device }));

      if (coupon.email) {
        await env.DONATIONS_KV.put(`email:${coupon.email}`, JSON.stringify({ deviceId: device, ts, plan } as EmailRecord));
      }

      return new Response(JSON.stringify({
        success: true,
        plan,
        timestamp: ts.toString(),
        hasEmail: !!coupon.email,
        ...(userData ? { userData } : {}),
      }), {
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    // ── Registrar email del suscriptor ────────────────────────────────────
    if (url.pathname === '/registrar-email' && request.method === 'GET') {
      const device = url.searchParams.get('device');
      const email = url.searchParams.get('email')?.toLowerCase().trim();

      if (!device || !email) {
        return new Response(JSON.stringify({ error: 'missing_params' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      const raw = await env.DONATIONS_KV.get(device);
      if (!raw) {
        return new Response(JSON.stringify({ error: 'not_found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      const record = parseDonationRecord(raw);
      if (!isMembershipActive(record)) {
        return new Response(JSON.stringify({ error: 'expired' }), {
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      const emailRecord: EmailRecord = { deviceId: device, ts: record.ts, plan: record.plan, ...(record.durationMs ? { durationMs: record.durationMs } : {}) };
      await env.DONATIONS_KV.put(`email:${email}`, JSON.stringify(emailRecord));
      await sendWelcomeEmail(email, record.plan, record.ts, env, undefined, record.durationMs);

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    // ── Guardar datos de usuario (favoritos + notas) ──────────────────────
    if (url.pathname === '/guardar-datos' && request.method === 'POST') {
      const device = url.searchParams.get('device');
      if (!device) {
        return new Response(JSON.stringify({ error: 'missing_params' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      const raw = await env.DONATIONS_KV.get(device);
      if (!raw) {
        return new Response(JSON.stringify({ error: 'not_found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      const record = parseDonationRecord(raw);
      if (!isMembershipActive(record)) {
        return new Response(JSON.stringify({ error: 'expired' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      try {
        const body = await request.json() as { favorites?: string[]; notes?: Record<string, string> };
        await env.DONATIONS_KV.put(`userdata:${device}`, JSON.stringify({
          favorites: body.favorites ?? [],
          notes: body.notes ?? {},
          savedAt: Date.now(),
        }));
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      } catch {
        return new Response(JSON.stringify({ error: 'invalid_body' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }
    }

    // ── Estado de promoción activa ────────────────────────────────────────
    if (url.pathname === '/promo-status' && request.method === 'GET') {
      const promoRaw = await env.DONATIONS_KV.get('promo_3x1_active');
      return new Response(JSON.stringify({ promo3x1: promoRaw === '1' }), {
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // ENDPOINTS DE ADMIN
    // ══════════════════════════════════════════════════════════════════════

    // ── Admin: estadísticas ────────────────────────────────────────────────
    if (url.pathname === '/admin/stats' && request.method === 'GET') {
      if (!checkAdminAuth(request, url, env)) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...adminCors },
        });
      }

      // Cache de 2 minutos; ?refresh=1 lo bypasea
      if (!url.searchParams.get('refresh')) {
        const cached = await env.DONATIONS_KV.get('cache:stats');
        if (cached) {
          return new Response(cached, { headers: { 'Content-Type': 'application/json', ...adminCors } });
        }
      }

      let deviceCount = 0;
      let couponActive = 0;
      let couponUsed = 0;
      const deviceActivePlans = new Map<string, 'mensual' | 'anual'>();
      const couponDeviceIds = new Set<string>();
      let cursor: string | undefined;

      do {
        const result = await env.DONATIONS_KV.list({ cursor, limit: 1000 });
        await Promise.all(result.keys.map(async key => {
          if (key.name.startsWith('coupon:')) {
            const raw = await env.DONATIONS_KV.get(key.name);
            if (raw) {
              const c = JSON.parse(raw) as CouponRecord;
              if (c.active) couponActive++;
              else {
                couponUsed++;
                if (c.usedBy) couponDeviceIds.add(c.usedBy);
              }
            }
          } else if (
            !key.name.startsWith('email:') &&
            !key.name.startsWith('reminder:') &&
            !key.name.startsWith('userdata:') &&
            !key.name.startsWith('cache:')
          ) {
            deviceCount++;
            const raw = await env.DONATIONS_KV.get(key.name);
            if (raw) {
              const record = parseDonationRecord(raw);
              if (isMembershipActive(record)) {
                deviceActivePlans.set(key.name, record.plan);
              }
            }
          }
        }));
        cursor = result.list_complete ? undefined : (result as { cursor?: string }).cursor;
      } while (cursor);

      let activeMensual = 0;
      let activeAnual = 0;
      let activeMensualPaid = 0;
      let activeAnualPaid = 0;

      for (const [deviceId, plan] of deviceActivePlans) {
        const isCoupon = couponDeviceIds.has(deviceId);
        if (plan === 'anual') {
          activeAnual++;
          if (!isCoupon) activeAnualPaid++;
        } else {
          activeMensual++;
          if (!isCoupon) activeMensualPaid++;
        }
      }

      const revenueEstimate = activeMensualPaid * 3500 + activeAnualPaid * 28000;

      const statsPayload = JSON.stringify({
        deviceCount,
        activeMensual,
        activeAnual,
        activeTotal: activeMensual + activeAnual,
        activeMensualPaid,
        activeAnualPaid,
        couponActive,
        couponUsed,
        revenueEstimate,
      });
      await env.DONATIONS_KV.put('cache:stats', statsPayload, { expirationTtl: 120 });

      return new Response(statsPayload, {
        headers: { 'Content-Type': 'application/json', ...adminCors },
      });
    }

    // ── Admin: listar cupones ──────────────────────────────────────────────
    if (url.pathname === '/admin/coupons' && request.method === 'GET') {
      if (!checkAdminAuth(request, url, env)) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...adminCors },
        });
      }

      const keys = await env.DONATIONS_KV.list({ prefix: 'coupon:' });
      const coupons = await Promise.all(
        keys.keys.map(async key => {
          const raw = await env.DONATIONS_KV.get(key.name);
          const code = key.name.replace('coupon:', '');
          if (!raw) return { code, active: false, plan: 'mensual', createdAt: 0 };
          const data = JSON.parse(raw) as CouponRecord;
          return { code, ...data };
        })
      );

      // Más recientes primero
      coupons.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

      return new Response(JSON.stringify({ coupons }), {
        headers: { 'Content-Type': 'application/json', ...adminCors },
      });
    }

    // ── Admin: borrar cupón ───────────────────────────────────────────────
    if (url.pathname === '/admin/delete-cupon' && request.method === 'POST') {
      if (!checkAdminAuth(request, url, env)) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...adminCors },
        });
      }

      const body = (await request.json()) as { code?: string };
      const code = body.code?.toUpperCase();
      if (!code) {
        return new Response(JSON.stringify({ error: 'missing_code' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...adminCors },
        });
      }

      const existing = await env.DONATIONS_KV.get(`coupon:${code}`);
      if (existing) {
        const record = JSON.parse(existing) as CouponRecord;
        if (record.active || record.email) {
          return new Response(JSON.stringify({ error: 'not_deletable' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', ...adminCors },
          });
        }
      }

      await env.DONATIONS_KV.delete(`coupon:${code}`);
      await env.DONATIONS_KV.delete('cache:stats');

      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json', ...adminCors },
      });
    }

    // ── Admin: generar cupón (desde dashboard) ────────────────────────────
    if (url.pathname === '/admin/generar-cupon' && request.method === 'POST') {
      if (!checkAdminAuth(request, url, env)) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...adminCors },
        });
      }

      const body = (await request.json()) as { plan?: string; cantidad?: number; code?: string; email?: string; source?: string };
      const plan: 'mensual' | 'anual' = body.plan === 'anual' ? 'anual' : 'mensual';
      const cantidad = Math.min(Math.max(parseInt(String(body.cantidad ?? 1)), 1), 50);
      const email = body.email?.toLowerCase().trim() || undefined;
      const source: 'regalo' | 'takenos' | undefined = body.source === 'takenos' ? 'takenos' : body.source === 'regalo' ? 'regalo' : undefined;

      const generated: string[] = [];
      for (let i = 0; i < cantidad; i++) {
        const code = body.code ? body.code.toUpperCase() : generateCode();
        const exists = await env.DONATIONS_KV.get(`coupon:${code}`);
        if (!exists) {
          const record: CouponRecord = { active: true, createdAt: Date.now(), plan, ...(source ? { source } : {}), ...(email ? { email } : {}) };
          await env.DONATIONS_KV.put(`coupon:${code}`, JSON.stringify(record));
          generated.push(code);
        }
      }

      return new Response(JSON.stringify({ generated, plan }), {
        headers: { 'Content-Type': 'application/json', ...adminCors },
      });
    }

    // ── Admin: generar contenido con IA ───────────────────────────────────
    if (url.pathname === '/admin/generar-contenido' && request.method === 'POST') {
      if (!checkAdminAuth(request, url, env)) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...adminCors },
        });
      }

      const body = (await request.json()) as { tipo: ContentType; contexto: string };
      const { tipo, contexto } = body;

      if (!tipo || !contexto) {
        return new Response(JSON.stringify({ error: 'missing_params' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...adminCors },
        });
      }

      const userPrompt = buildContentPrompt(tipo, contexto);

      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1200,
          system: CONTENT_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });

      if (!anthropicRes.ok) {
        const err = await anthropicRes.text();
        return new Response(JSON.stringify({ error: err }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', ...adminCors },
        });
      }

      const data = (await anthropicRes.json()) as {
        content: Array<{ type: string; text: string }>;
      };
      const text = data.content.find(c => c.type === 'text')?.text ?? '';

      // Para post y reel, intentar parsear JSON estructurado
      let structured: Record<string, unknown> | null = null;
      if (tipo === 'post' || tipo === 'reel' || tipo === 'story') {
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) structured = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
        } catch {
          // Fallback a texto plano
        }
      }

      return new Response(JSON.stringify({ content: text, structured }), {
        headers: { 'Content-Type': 'application/json', ...adminCors },
      });
    }

    // ── Admin: listar suscriptores con email ──────────────────────────────
    if (url.pathname === '/admin/subscribers' && request.method === 'GET') {
      if (!checkAdminAuth(request, url, env)) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...adminCors },
        });
      }

      // Construir el set de deviceIds que canjearon cupones y su código
      const couponKeys = await env.DONATIONS_KV.list({ prefix: 'coupon:' });
      const couponDeviceIds = new Set<string>();
      const couponDeviceToCode = new Map<string, string>();
      await Promise.all(
        couponKeys.keys.map(async key => {
          try {
            const raw = await env.DONATIONS_KV.get(key.name);
            if (!raw) return;
            const c = JSON.parse(raw) as CouponRecord;
            if (!c.active && c.usedBy) {
              couponDeviceIds.add(c.usedBy);
              couponDeviceToCode.set(c.usedBy, key.name.replace('coupon:', ''));
            }
          } catch { /* ignorar entradas corruptas */ }
        })
      );

      const keys = await env.DONATIONS_KV.list({ prefix: 'email:' });
      const subscribers = await Promise.all(
        keys.keys.map(async key => {
          try {
          const email = key.name.replace('email:', '');
          const raw = await env.DONATIONS_KV.get(key.name);
          if (!raw) return null;
          const data = JSON.parse(raw) as EmailRecord;
          const record: DonationRecord = { ts: data.ts, plan: data.plan, ...(data.durationMs ? { durationMs: data.durationMs } : {}) };
          const duration = data.durationMs ?? (data.plan === 'anual' ? ONE_YEAR_MS : THIRTY_DAYS_MS);
          const viaCoupon = couponDeviceIds.has(data.deviceId);
          return {
            email,
            deviceId: data.deviceId,
            plan: data.plan,
            ts: data.ts,
            active: isMembershipActive(record),
            expiresAt: new Date(data.ts + duration).toISOString(),
            viaCoupon,
            ...(viaCoupon ? { couponCode: couponDeviceToCode.get(data.deviceId) } : {}),
          };
          } catch { return null; }
        })
      );

      const result = subscribers.filter(Boolean);
      result.sort((a, b) => (b!.ts ?? 0) - (a!.ts ?? 0));

      return new Response(JSON.stringify({ subscribers: result }), {
        headers: { 'Content-Type': 'application/json', ...adminCors },
      });
    }

    // ── Admin: activación manual de suscripción ───────────────────────────────
    if (url.pathname === '/admin/activar-manual' && request.method === 'POST') {
      if (!checkAdminAuth(request, url, env)) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...adminCors },
        });
      }

      const body = (await request.json()) as { email?: string; plan?: string };
      const email = body.email?.toLowerCase().trim();
      const plan: 'mensual' | 'anual' = body.plan === 'anual' ? 'anual' : 'mensual';

      if (!email) {
        return new Response(JSON.stringify({ error: 'missing_email' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...adminCors },
        });
      }

      const existing = await env.DONATIONS_KV.get(`email:${email}`);
      if (existing) {
        return new Response(JSON.stringify({ error: 'already_exists' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json', ...adminCors },
        });
      }

      const deviceId = crypto.randomUUID();
      const ts = Date.now();
      const record: DonationRecord = { ts, plan };
      const emailRecord: EmailRecord = { deviceId, ts, plan };

      await env.DONATIONS_KV.put(deviceId, JSON.stringify(record));
      await env.DONATIONS_KV.put(`email:${email}`, JSON.stringify(emailRecord));
      await sendWelcomeEmail(email, plan, ts, env);

      return new Response(JSON.stringify({ ok: true, deviceId }), {
        headers: { 'Content-Type': 'application/json', ...adminCors },
      });
    }

    // ── Admin: pagos MercadoPago ──────────────────────────────────────────────
    if (url.pathname === '/admin/mp-payments' && request.method === 'GET') {
      if (!checkAdminAuth(request, url, env)) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...adminCors },
        });
      }

      const now = new Date();
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const [approvedData, inProcessData, pendingData] = await Promise.all([
        fetch(`${MP_API}/v1/payments/search?sort=date_created&criteria=desc&range=date_created&begin_date=${sixtyDaysAgo.toISOString()}&end_date=${now.toISOString()}&status=approved&limit=50`, {
          headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
        }).then(r => r.json()),
        fetch(`${MP_API}/v1/payments/search?sort=date_created&criteria=desc&status=in_process&limit=20`, {
          headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
        }).then(r => r.json()),
        fetch(`${MP_API}/v1/payments/search?sort=date_created&criteria=desc&status=pending&limit=20`, {
          headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
        }).then(r => r.json()),
      ]) as [{ results?: MPPaymentRaw[] }, { results?: MPPaymentRaw[] }, { results?: MPPaymentRaw[] }];

      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isNeoCalcuPayment = (p: MPPaymentRaw) =>
        !!p.external_reference && UUID_RE.test(p.external_reference);

      const approvedResults = (approvedData.results ?? []).filter(isNeoCalcuPayment);
      const pendingResults = [
        ...(inProcessData.results ?? []),
        ...(pendingData.results ?? []),
      ].filter(isNeoCalcuPayment)
        .sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime());

      const enrichedApproved = await Promise.all(
        approvedResults.map(async p => {
          const deviceId = p.external_reference ?? null;
          const payerEmail = p.payer?.email?.toLowerCase() ?? null;
          // Fetch individual payment para obtener money_release_date (no viene en search)
          const [emailEntry, deviceEntry, detailRes] = await Promise.all([
            payerEmail ? env.DONATIONS_KV.get(`email:${payerEmail}`) : Promise.resolve(null),
            deviceId ? env.DONATIONS_KV.get(deviceId) : Promise.resolve(null),
            fetch(`${MP_API}/v1/payments/${p.id}`, {
              headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
            }),
          ]);
          let moneyReleaseDate: string | null = null;
          try {
            const detail = await detailRes.json() as { money_release_date?: string | null };
            moneyReleaseDate = detail.money_release_date ?? null;
          } catch { /* si falla el fetch individual, moneyReleaseDate queda null */ }
          return {
            id: p.id,
            status: 'approved' as const,
            amount: p.transaction_amount,
            plan: (p.transaction_amount >= 28000 ? 'anual' : 'mensual') as 'mensual' | 'anual',
            payerEmail,
            payerName: p.payer?.first_name
              ? `${p.payer.first_name} ${p.payer.last_name ?? ''}`.trim()
              : null,
            deviceId,
            dateCreated: p.date_created,
            dateApproved: p.date_approved ?? null,
            moneyReleaseDate,
            emailInKV: !!emailEntry,
            deviceInKV: !!deviceEntry,
          };
        })
      );

      // Muestra todos los aprobados sin email, independientemente de si el webhook llegó
      const needsEmail = enrichedApproved.filter(p => !p.emailInKV);

      // Aprobados pero con liberación de fondos pendiente (money_release_date futuro)
      const nowTs = Date.now();
      const releasing = enrichedApproved.filter(p =>
        p.moneyReleaseDate && new Date(p.moneyReleaseDate).getTime() > nowTs
      );

      // Buscar devices en KV sin email asociado, consultando MP por su external_reference
      const allKeys = await env.DONATIONS_KV.list({ limit: 1000 });
      const knownPrefixes = ['email:', 'coupon:', 'reminder:', 'userdata:', 'cache:'];
      const emailKeysSet = new Set(
        allKeys.keys.filter(k => k.name.startsWith('email:')).map(k => k.name.replace('email:', ''))
      );
      const deviceKeys = allKeys.keys.filter(k => !knownPrefixes.some(p => k.name.startsWith(p)));

      const orphanDevices = await Promise.all(
        deviceKeys.map(async key => {
          const deviceId = key.name;
          // Saltar si ya hay email registrado para este device
          const hasEmail = [...emailKeysSet].some(async email => {
            const r = await env.DONATIONS_KV.get(`email:${email}`);
            if (!r) return false;
            try { return (JSON.parse(r) as EmailRecord).deviceId === deviceId; } catch { return false; }
          });
          if (hasEmail) return null;

          const raw = await env.DONATIONS_KV.get(deviceId);
          if (!raw) return null;
          let record: DonationRecord;
          try { record = parseDonationRecord(raw); } catch { return null; }
          if (!isMembershipActive(record)) return null;

          // Consultar MP para obtener email del comprador
          const mpRes = await fetch(
            `${MP_API}/v1/payments/search?external_reference=${encodeURIComponent(deviceId)}&status=approved&limit=1`,
            { headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` } }
          );
          let payerEmail: string | null = null;
          let payerName: string | null = null;
          let mpPaymentId: number | null = null;
          let dateApproved: string | null = null;
          if (mpRes.ok) {
            const mpData = (await mpRes.json()) as { results?: MPPaymentRaw[] };
            const mp = mpData.results?.[0];
            if (mp) {
              payerEmail = mp.payer?.email?.toLowerCase() ?? null;
              payerName = mp.payer?.first_name ? `${mp.payer.first_name} ${mp.payer.last_name ?? ''}`.trim() : null;
              mpPaymentId = mp.id;
              dateApproved = mp.date_approved ?? null;
            }
          }

          // Si el email ya está registrado (en KV), no mostrar
          if (payerEmail && emailKeysSet.has(payerEmail)) return null;

          return { deviceId, plan: record.plan, ts: record.ts, payerEmail, payerName, mpPaymentId, dateApproved };
        })
      );
      const activeOrphans = orphanDevices.filter(Boolean);

      const pending = pendingResults.map(p => ({
        id: p.id,
        status: p.status as 'in_process' | 'pending',
        amount: p.transaction_amount,
        plan: (p.transaction_amount >= 28000 ? 'anual' : 'mensual') as 'mensual' | 'anual',
        payerEmail: p.payer?.email?.toLowerCase() ?? null,
        payerName: p.payer?.first_name
          ? `${p.payer.first_name} ${p.payer.last_name ?? ''}`.trim()
          : null,
        deviceId: p.external_reference ?? null,
        dateCreated: p.date_created,
        dateApproved: null,
        emailInKV: false,
        deviceInKV: false,
      }));

      return new Response(JSON.stringify({ needsEmail, pending, releasing, activeOrphans }), {
        headers: { 'Content-Type': 'application/json', ...adminCors },
      });
    }

    // ── Admin: registrar email manualmente ───────────────────────────────────
    if (url.pathname === '/admin/registrar-email' && request.method === 'POST') {
      if (!checkAdminAuth(request, url, env)) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...adminCors },
        });
      }

      const body = (await request.json()) as { email?: string; deviceId?: string; plan?: string; dateApproved?: string };
      const email = body.email?.toLowerCase().trim();
      const deviceId = body.deviceId?.trim();

      if (!email || !deviceId) {
        return new Response(JSON.stringify({ error: 'missing_params' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...adminCors },
        });
      }

      let record: DonationRecord;
      const deviceRaw = await env.DONATIONS_KV.get(deviceId);
      if (deviceRaw) {
        record = parseDonationRecord(deviceRaw);
      } else if (body.plan) {
        // Webhook falló: crear el device entry manualmente con los datos del pago MP
        const plan: 'mensual' | 'anual' = body.plan === 'anual' ? 'anual' : 'mensual';
        const ts = body.dateApproved ? new Date(body.dateApproved).getTime() : Date.now();
        record = { ts, plan };
        await env.DONATIONS_KV.put(deviceId, JSON.stringify(record));
      } else {
        return new Response(JSON.stringify({ error: 'device_not_found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...adminCors },
        });
      }

      const emailRecord: EmailRecord = { deviceId, ts: record.ts, plan: record.plan };
      await env.DONATIONS_KV.put(`email:${email}`, JSON.stringify(emailRecord));
      await sendWelcomeEmail(email, record.plan, record.ts, env);

      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json', ...adminCors },
      });
    }

    // ── Admin: toggle promo 3×1 ──────────────────────────────────────────────
    if (url.pathname === '/admin/promo' && request.method === 'POST') {
      if (!checkAdminAuth(request, url, env)) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...adminCors },
        });
      }

      const key = url.searchParams.get('key');
      const value = url.searchParams.get('value');

      if (key !== 'promo_3x1_active' || (value !== '0' && value !== '1')) {
        return new Response(JSON.stringify({ error: 'invalid_params' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...adminCors },
        });
      }

      if (value === '1') {
        await env.DONATIONS_KV.put('promo_3x1_active', '1');
      } else {
        await env.DONATIONS_KV.delete('promo_3x1_active');
      }

      return new Response(JSON.stringify({ ok: true, promo3x1: value === '1' }), {
        headers: { 'Content-Type': 'application/json', ...adminCors },
      });
    }

    // ── Digital Asset Links (TWA Android) ────────────────────────────────────
    if (url.pathname === '/.well-known/assetlinks.json') {
      const assetLinks = [
        {
          // Play Store (AAB subido a Google) — package con doble l
          relation: ['delegate_permission/common.handle_all_urls'],
          target: {
            namespace: 'android_app',
            package_name: 'pro.neocalcul.twa',
            sha256_cert_fingerprints: [
              'ED:40:8D:92:44:E2:A0:B8:D5:6F:EF:77:24:D4:6C:CD:A9:07:84:E3:A9:45:AC:53:B9:CE:41:9C:66:94:11:6E',
            ],
          },
        },
        {
          // APK sideloaded (build local con bubblewrap) — package con una l
          relation: ['delegate_permission/common.handle_all_urls'],
          target: {
            namespace: 'android_app',
            package_name: 'pro.neocalcu.twa',
            sha256_cert_fingerprints: [
              'F3:DA:75:49:2B:C1:8C:B2:41:53:A5:A6:0C:3A:FC:A5:50:D6:72:5E:39:1A:B3:C0:26:69:00:57:66:82:A7:8F',
            ],
          },
        },
      ];
      return new Response(JSON.stringify(assetLinks, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // ── Manifest PWA (reescrito para TWA: scope y start_url correctos) ──────
    if (url.pathname === '/manifest.webmanifest' || url.pathname === '/neocalcu/manifest.webmanifest') {
      const manifest = {
        name: 'NeoCalcu - Calculadora Neonatal',
        short_name: 'NeoCalcu',
        start_url: '/',
        display: 'standalone',
        background_color: '#ecfdf5',
        lang: 'es',
        scope: '/',
        description: 'Calculadora médica bedside para neonatología',
        theme_color: '#065f46',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      };
      return new Response(JSON.stringify(manifest), {
        headers: {
          'Content-Type': 'application/manifest+json',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // ── Política de privacidad ─────────────────────────────────────────────
    if (url.pathname === '/privacy') {
      const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Política de Privacidad — NeoCalcu</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 720px; margin: 0 auto; padding: 24px 20px 48px; color: #1e293b; line-height: 1.7; }
    h1 { color: #065f46; font-size: 1.6rem; margin-bottom: 4px; }
    h2 { color: #047857; font-size: 1.1rem; margin-top: 32px; }
    p, li { font-size: 0.97rem; }
    ul { padding-left: 20px; }
    a { color: #065f46; }
    .updated { color: #64748b; font-size: 0.85rem; margin-bottom: 32px; }
  </style>
</head>
<body>
  <h1>Política de Privacidad</h1>
  <p class="updated">Última actualización: 1 de junio de 2025</p>

  <p>NeoCalcu es una herramienta de apoyo clínico para profesionales de la salud en neonatología. Esta política describe qué datos se recopilan y cómo se utilizan.</p>

  <h2>1. Datos recopilados</h2>
  <ul>
    <li><strong>Identificador de dispositivo (<code>device_id</code>):</strong> un UUID generado localmente y almacenado en el dispositivo. Se usa únicamente para verificar el estado de la suscripción. No está vinculado a ninguna identidad personal.</li>
    <li><strong>Correo electrónico (opcional):</strong> si el usuario elige registrar un email para recibir confirmaciones de suscripción, se almacena en nuestro servidor. No se comparte con terceros ni se usa con fines de marketing sin consentimiento.</li>
    <li><strong>Datos de pago:</strong> procesados por MercadoPago (Argentina) o Takenos (internacional). NeoCalcu no almacena datos de tarjetas de crédito ni información de pago; estos son manejados íntegramente por los procesadores de pago.</li>
    <li><strong>Datos clínicos ingresados (peso, edad gestacional, etc.):</strong> se almacenan localmente en el dispositivo mediante <code>localStorage</code> y nunca se transmiten a ningún servidor.</li>
  </ul>

  <h2>2. Uso de los datos</h2>
  <ul>
    <li>Verificar el estado de la suscripción y desbloquear funciones premium.</li>
    <li>Enviar correo de confirmación y recordatorio de renovación (solo si el usuario proporcionó su email).</li>
    <li>Estadísticas de uso agregadas y anónimas mediante Google Analytics 4 (sin datos personales identificables).</li>
  </ul>

  <h2>3. Almacenamiento y seguridad</h2>
  <p>Los datos del servidor se almacenan en Cloudflare Workers KV, ubicado en servidores de Cloudflare. Los datos locales (peso, pacientes, favoritos) permanecen exclusivamente en el dispositivo del usuario.</p>

  <h2>4. Retención de datos</h2>
  <p>Los registros de suscripción se conservan mientras la cuenta esté activa. Los datos de email se eliminan a solicitud del usuario. Los datos locales pueden borrarse en cualquier momento limpiando el almacenamiento del navegador o desinstalando la app.</p>

  <h2>5. Derechos del usuario</h2>
  <p>Podés solicitar la eliminación de tus datos enviando un correo a <a href="mailto:info@neomonitor.pro">info@neomonitor.pro</a>.</p>

  <h2>6. Menores de edad</h2>
  <p>NeoCalcu está destinada exclusivamente a profesionales de la salud adultos. No recopilamos datos de menores de 18 años de forma intencional.</p>

  <h2>7. Cambios a esta política</h2>
  <p>Cualquier cambio se publicará en esta página. El uso continuado de la app después de cambios implica aceptación de la política actualizada.</p>

  <h2>8. Contacto</h2>
  <p>Consultas sobre privacidad: <a href="mailto:info@neomonitor.pro">info@neomonitor.pro</a></p>
</body>
</html>`;
      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // Proxy neocalcu.pro/* → GitHub Pages (necesario para TWA/assetlinks)
    if (request.headers.get('host')?.includes('neocalcu.pro')) {
      const path = url.pathname === '/' ? '/neocalcu/' : url.pathname;
      const githubUrl = 'https://diegoastein.github.io' + path + (url.search || '');
      const res = await fetch(githubUrl, { headers: { 'User-Agent': request.headers.get('User-Agent') || '' } });
      return new Response(res.body, {
        status: res.status,
        headers: res.headers,
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
