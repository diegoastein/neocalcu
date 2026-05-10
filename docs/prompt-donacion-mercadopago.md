# NeoCalcu — Sistema de donación con MercadoPago + Cloudflare Workers

## Contexto del proyecto

NeoCalcu es una PWA clínica offline (React 18 + TypeScript + Tailwind CSS v3 + Vite).
Repo: https://github.com/diegoastein/neocalcu
Deploy: https://diegoastein.github.io/neocalcu/
Branch de desarrollo: claude/payment-engagement-exploration-lqYMh

La app no tiene backend. Todo corre en el cliente. Ahora queremos agregar
un sistema de donación verificado via MercadoPago, con un Cloudflare Worker
como backend mínimo.

## Objetivo

Mostrar un toast de donación cada 5 aperturas de la app. Si el usuario dona
via MercadoPago, el toast desaparece por 30 días (verificado con backend real,
no honor system). Si no hay conexión al verificar, no molestar al usuario.

## Arquitectura decidida

1. La app genera un `device_id` único (UUID) en localStorage al primer uso.
2. Usuario hace clic en "Invitar un cafecito" → app llama al Worker para
   crear una preferencia de pago con ese device_id como external_reference.
3. Worker crea la preferencia en MercadoPago → devuelve init_point URL.
4. App redirige al checkout de MercadoPago.
5. Usuario paga → MercadoPago dispara webhook al Worker.
6. Worker verifica firma x-signature (HMAC-SHA256), guarda device_id en KV Store.
7. MercadoPago redirige al usuario de vuelta a la app (back_url.success).
8. App consulta Worker: ¿este device_id donó? → Worker responde sí/no.
9. Si sí: guardar en localStorage, suprimir toast 30 días.
10. Si no hay internet al verificar: no mostrar toast, reintentar próxima apertura.

## Qué construir

### A) Cloudflare Worker (`worker/index.ts`)

Endpoints:

**GET /crear-pago?device=<device_id>**
- Crear preferencia en MercadoPago Checkout Pro:
  ```json
  {
    "items": [{ "title": "Cafecito para NeoCalcu", "quantity": 1,
                "currency_id": "ARS", "unit_price": 1000 }],
    "back_urls": {
      "success": "https://diegoastein.github.io/neocalcu/?paid=1",
      "failure": "https://diegoastein.github.io/neocalcu/?paid=0",
      "pending": "https://diegoastein.github.io/neocalcu/?paid=0"
    },
    "auto_return": "approved",
    "notification_url": "https://<tu-worker>.workers.dev/webhook",
    "external_reference": "<device_id>"
  }
  ```
- Devolver `{ init_point: "https://..." }`
- CORS: permitir origen `https://diegoastein.github.io`

**POST /webhook**
- Recibir notificación de MercadoPago
- Verificar firma `x-signature` con HMAC-SHA256 (Web Crypto API — no Node crypto):
  ```
  manifest = `id:${data.id};request-id:${x-request-id};ts:${ts};`
  ```
- Si válida: GET `https://api.mercadopago.com/v1/payments/{data.id}`
  con Authorization Bearer
- Si payment.status === "approved": guardar en KV:
  `{ key: external_reference, value: Date.now().toString() }`
- Responder 200 siempre (MP reintenta si no recibe 200)

**GET /verificar?device=<device_id>**
- Leer KV con key = device_id
- Responder `{ donated: true, timestamp: "..." }` o `{ donated: false }`
- CORS: permitir origen `https://diegoastein.github.io`

Variables de entorno del Worker (configurar en Cloudflare dashboard):
- `MP_ACCESS_TOKEN` — token de producción de MercadoPago
- `MP_WEBHOOK_SECRET` — secret key del panel de webhooks de MercadoPago
- KV namespace binding: `DONATIONS_KV`

### B) App React — Hook `src/hooks/useDonationReminder.ts`

```typescript
// Lógica:
// - Al montar: incrementar contador en localStorage ("neo_open_count")
// - Si contador % 5 === 0: intentar verificar con Worker
//   - Si verificado como donado: no mostrar toast
//   - Si no donado o sin conexión: mostrar toast
// - Si localStorage tiene "neo_donated_at" con menos de 30 días: no mostrar toast

// Exportar:
// showToast: boolean
// dismissToast: () => void         — cierra sin acción
// handleDonate: () => Promise<void> — llama /crear-pago, redirige a init_point
// handleVerify: () => Promise<void> — llama /verificar, actualiza estado
```

### C) App React — Componente `src/components/DonationToast.tsx`

UI: fixed, bottom-20 (encima del BottomNav), z-50, ancho casi completo en mobile.
Animación: slide-up con Tailwind transition/translate-y.
Dark mode: clases dark: en todos los elementos.
Colores brand del proyecto: brand-700, brand-800, brand-50 (verde esmeralda, ver tailwind.config.js).

Contenido:
- Texto: "¿Te resulta útil NeoCalcu? Invitame un cafecito ☕"
- Botón primario (verde esmeralda): "Invitar un cafecito" → handleDonate()
- Botón X (top-right): dismissToast() — vuelve a aparecer en 5 aperturas más
- Estado de loading mientras crea la preferencia de pago

### D) Integrar en `src/App.tsx`

- Usar el hook `useDonationReminder`
- Al montar: si URL tiene `?paid=1`, llamar handleVerify() y limpiar el param
- Renderizar `<DonationToast />` condicionalmente

## Setup que el desarrollador debe hacer antes de codear

1. **MercadoPago**: ir a mercadopago.com.ar/developers → crear aplicación →
   copiar Access Token de producción → en Webhooks configurar notification_url
   y copiar el Secret Key generado.

2. **Cloudflare**: crear cuenta → nuevo Worker → crear KV namespace "DONATIONS" →
   bindear como DONATIONS_KV → agregar variables de entorno MP_ACCESS_TOKEN
   y MP_WEBHOOK_SECRET.

3. Una vez deployado el Worker, actualizar la notification_url en MercadoPago
   con la URL real del Worker.

## Restricciones importantes

- No instalar dependencias externas en la app React
- El Worker usa Web Crypto API (no Node crypto) para HMAC-SHA256
- La app debe funcionar 100% offline para funciones clínicas — el sistema
  de donación falla gracefully sin conexión (no bloquea nada)
- No modificar lógica clínica, tipos, datos, ni otros componentes existentes
- Respetar dark mode existente y colores brand del proyecto
- CORS del Worker: solo permitir origen https://diegoastein.github.io

## Verificación manual

1. Crear preferencia de pago en sandbox de MercadoPago y verificar que
   el init_point abre el checkout correctamente
2. Simular webhook con la herramienta de testing del panel de MP
3. Verificar que /verificar responde correctamente después del webhook
4. Probar flujo completo: abrir app 5 veces → toast aparece → donar →
   volver → toast desaparece
5. Probar sin conexión: funciones clínicas deben seguir funcionando,
   toast no debe aparecer ni bloquear

## Archivos a crear/modificar

Crear:
- `worker/index.ts` — Cloudflare Worker completo
- `src/hooks/useDonationReminder.ts`
- `src/components/DonationToast.tsx`

Modificar:
- `src/App.tsx` — integrar hook y componente, manejar ?paid=1 en URL
