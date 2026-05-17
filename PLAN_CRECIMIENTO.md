# NeoCalcu — Plan de crecimiento: Play Store + Campaña Residencias

## Contexto de la decisión

- App nueva (<1 mes), ~400 usuarios activos/mes, canal principal: **Instagram**
- El problema: Instagram abre links en su in-app browser → el PWA no se instala → usuarios se van en 16 segundos
- Solución: publicar en Play Store → link de Instagram va a ficha de Play Store → install real → ícono permanente en launcher
- **MercadoPago no se toca**: el TWA corre en Chrome, el pago ocurre en contexto web → Google lo tolera
- **No hay que reescribir nada**: la técnica es TWA (Trusted Web Activity), una carcasa Android que abre el PWA en Chrome sin barra de URL

---

## Decisiones tomadas

| Decisión | Elección |
|----------|----------|
| Técnica | TWA via PWABuilder (no app nativa, no React Native) |
| Fase 1 | App gratuita completa en Play Store, sin mencionar premium |
| MercadoPago | Se mantiene tal cual (pago web desde Settings) |
| Modelo de pago futuro | Pago único (~ARS $8.000-10.000) en lugar de suscripción mensual |
| Fase 2 | Monetización recién cuando haya ~1.000 usuarios |

---

## Prerrequisito bloqueante: migración de dominio

El `assetlinks.json` (que vincula el APK con el dominio) debe estar en el root del dominio. Hoy la app está en `diegoastein.github.io/neocalcu/` — no se puede poner nada en el root de ese dominio.

**Solución:** convertir `neocalcul.pro` de redirect a dominio real de GitHub Pages.

### Pasos en Cloudflare (DNS)

1. Ir a Cloudflare → dominio `neocalcul.pro` → DNS
2. Cambiar el record actual (que es un redirect/Page Rule) por:
   ```
   Tipo: CNAME
   Nombre: @ (o neocalcul.pro)
   Destino: diegoastein.github.io
   Proxy: DNS only (nube gris, NO naranja)
   ```
3. Eliminar cualquier Page Rule o Redirect Rule que haga el redirect a GitHub Pages

### Pasos en el repo

```bash
# 1. Agregar archivo CNAME en public/
echo "neocalcul.pro" > public/CNAME

# 2. Cambiar base en vite.config.ts
# base: '/neocalcu/'  →  base: '/'

# 3. Actualizar start_url y scope en el manifest (vite.config.ts)
# start_url: '/neocalcu/'  →  start_url: '/'
# scope: '/neocalcu/'      →  scope: '/'

# 4. Actualizar referencias en el worker si apuntan a diegoastein.github.io/neocalcu/
# (revisar CORS origins en worker/index.ts)

# 5. Build y push a main → GitHub Pages detecta el CNAME y configura el dominio
npm run build
git add public/CNAME vite.config.ts
git commit -m "migrar a dominio neocalcul.pro"
git push origin main
```

### Verificar en GitHub

Ir a Settings → Pages del repo → debería mostrar `neocalcul.pro` como dominio custom con ✅ verde. Puede tardar hasta 24h el certificado SSL.

---

## Paso 2: ícono maskable correcto

El `icon-512.png` actual está declarado como maskable pero puede no tener safe zones correctas. Android recorta el ícono en círculo/forma adaptiva — el logo debe estar en el 80% central.

1. Ir a **maskable.app/editor**
2. Subir `public/icon-512.png`
3. Verificar que el logo quede dentro del círculo seguro
4. Si no entra: ajustar, exportar como `icon-512-maskable.png`
5. Agregarlo en `public/` y actualizar `vite.config.ts`:
   ```ts
   { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
   ```

---

## Paso 3: Digital Asset Links

Este archivo vincula el APK firmado con el dominio. **No se puede completar hasta tener el keystore generado en el Paso 4**, pero el archivo va en el repo:

Crear `public/.well-known/assetlinks.json`:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "pro.neomonitor.neocalcu",
    "sha256_cert_fingerprints": ["REEMPLAZAR_CON_SHA256_DEL_KEYSTORE"]
  }
}]
```

El SHA256 se obtiene en el Paso 4. Subir el archivo con el placeholder, luego actualizar con el valor real.

---

## Paso 4: generar el APK/AAB con PWABuilder

1. Esperar a que `neocalcul.pro` esté activo con SSL ✅
2. Ir a **pwabuilder.com**
3. Ingresar `https://neocalcul.pro`
4. Verificar que pase el análisis PWA (debe pasar todo en verde)
5. → "Package for stores" → Android
6. Configurar:
   - Package ID: `pro.neomonitor.neocalcu`
   - App name: `NeoCalcu`
   - Version: `1.0.0`
   - Signing: generar nuevo keystore o subir uno existente
7. Descargar el `.aab` y el keystore
8. **Guardar el keystore en lugar seguro** — sin él no se pueden publicar actualizaciones

### Obtener el SHA256 para assetlinks.json

```bash
keytool -list -v -keystore neocalcu.keystore -alias neocalcu
# Copiar el valor "SHA256:" y pegarlo en public/.well-known/assetlinks.json
# Push a main → el archivo queda en https://neocalcul.pro/.well-known/assetlinks.json
```

---

## Paso 5: cuenta de Play Store y publicación

1. Crear cuenta en **play.google.com/console** → USD $25 (único, de por vida)
2. Crear nueva app → "NeoCalcu - Calculadora Neonatal"
3. Completar el listing:

### Textos sugeridos para el listing

**Descripción corta (80 chars):**
```
Calculadora de dosis neonatal para guardia. 100% offline.
```

**Descripción larga:**
```
NeoCalcu es la herramienta bedside para neonatología. Calculá dosis de 
más de 220 medicamentos en segundos, accedé a 24 procedimientos con 
fórmulas interactivas, escalas clínicas (Apgar, Silverman, Finnegan, 
bilirrubina NICE), valores de laboratorio neonatal y mucho más.

Funciona 100% sin conexión — ideal para guardia.

Desarrollada por médicos, para médicos de UCIN.
```

**Categoría:** Medicina  
**Content rating:** llenar el cuestionario (no es app de diagnóstico, es calculadora)

### Privacy Policy (requerida por Google para apps de salud)

Necesita una URL pública. Opciones:
- Una página simple en `neocalcul.pro/privacy` (agregar ruta estática)
- Un Google Doc público con la política
- Contenido mínimo: qué datos se recopilan (device_id, analytics), para qué, contacto

### Screenshots (2 mínimo, 8 máximo)

Tomar capturas de pantalla en emulador Android o dispositivo real:
- Pantalla de medicamentos con dosis calculada
- Pantalla de procedimientos
- Calculadora de bilirrubina
- Pantalla de laboratorio

Tamaño mínimo: 320×568px. Recomendado: 1080×1920px.

---

## Paso 6: verificar TWA

Antes de publicar, verificar que el TWA funciona correctamente:

```bash
# Instalar bubblewrap para testear
npm install -g @bubblewrap/cli

# O usar Android Studio con el .aab generado por PWABuilder
# Instalar en dispositivo/emulador y verificar:
# ✅ No aparece barra de URL de Chrome
# ✅ App funciona offline
# ✅ Splash screen correcto
# ✅ Ícono adaptivo correcto en launcher
```

---

## Checklist completo

- [ ] DNS de neocalcul.pro cambiado a CNAME → diegoastein.github.io (DNS only)
- [ ] `public/CNAME` con `neocalcul.pro` commiteado y pusheado
- [ ] `base: '/'` en vite.config.ts
- [ ] `start_url: '/'` y `scope: '/'` en el manifest
- [ ] SSL de neocalcul.pro activo en GitHub Pages ✅
- [ ] Ícono maskable con safe zones correctas
- [ ] `.well-known/assetlinks.json` en el repo (con SHA placeholder)
- [ ] PWABuilder genera el AAB correctamente
- [ ] Keystore guardado en lugar seguro
- [ ] SHA256 del keystore en assetlinks.json (pusheado a main)
- [ ] Cuenta de Play Store creada ($25)
- [ ] Privacy policy URL disponible
- [ ] Screenshots tomados (mínimo 2)
- [ ] AAB subido a Play Console
- [ ] Content rating completado
- [ ] App enviada a revisión

---

## Worker: cambio de CORS necesario

Al migrar a `neocalcul.pro`, actualizar los CORS en `worker/index.ts`:

```ts
// Agregar neocalcul.pro a los orígenes permitidos
const allowedOrigins = [
  'https://diegoastein.github.io',  // mantener durante transición
  'https://neocalcul.pro',           // agregar
  'http://localhost:5173'
];
```

Redesployar el worker después de este cambio.

---

## Futuro: modelo de pago único

Cuando haya ~1.000 usuarios y se quiera monetizar en Play Store:

- Cambiar de suscripción mensual/anual a **pago único** (~ARS $8.000-10.000)
- Agregar endpoint en el worker: `/pagar-unico` que crea preferencia MP con precio único y guarda expiración a 10 años en KV
- El botón "Apoyar" en Settings del TWA abre MP en browser externo → Google lo tolera (es transacción web)
- Si en el futuro se quiere Google Play Billing nativo → requiere reescribir en Kotlin/Flutter (decisión para cuando el volumen lo justifique)

---

## Referencias

- PWABuilder: pwabuilder.com
- Maskable icon checker: maskable.app
- Digital Asset Links validator: developers.google.com/digital-asset-links/tools/generator
- Play Console: play.google.com/console
- Bubblewrap CLI: github.com/GoogleChromeLabs/bubblewrap

---

---

# Campaña 2×1 — Residencias Médicas (agosto)

## Contexto

- Las residencias médicas en Argentina comienzan en **septiembre/octubre**
- El momento de mayor receptividad es **agosto** — los R1 están equipándose antes de arrancar
- El contacto a jefes de residentes debe hacerse en **julio**, antes del caos del inicio
- Canal principal actual: Instagram (ya trae ~400 usuarios/mes)

## Concepto

**"Entrá con tu R"**

Un residente paga, el otro entra gratis. Apunta a la dinámica natural de las residencias: siempre trabajan en duplas, comparten guardias, comparten herramientas.

El framing no es "descuento" — es "invitá a alguien". La app no vale menos; querés que tu colega también la tenga.

## Target

**Residentes de Pediatría y Neonatología, R1 y R2, que rotan por UCIN.**

El decisor no es el hospital — es el **jefe de residentes** o el residente más senior del grupo. Un solo contacto puede activar 4-8 usuarios.

Par natural del 2×1: **R1 que arranca** + **R2 o R3 que lo tutorear**.

## Mecánica

- Un residente paga el plan (mensual o anual)
- Recibe automáticamente un cupón de regalo para un colega
- El colega canjea sin pagar — activa su membresía por el mismo período
- Ninguno puede transferir ni acumular más cupones

⚠️ **Cambio técnico necesario:** hoy el cupón se genera manualmente desde el admin. Para escalar la campaña hay que modificar el worker para que al verificar un pago genere y envíe automáticamente un cupón al email del comprador. Sin esto, cada venta requiere intervención manual.

## Mensajes

**Instagram:**
> *"En la guardia de UCIN nunca estás solo. Tu suscripción tampoco."*
> *"Pagá una, úsala dos. Para los que hacen guardia juntos."*

**WhatsApp (el comprador reenvía):**
> *"Tengo NeoCalcu premium y te mando un cupón para que entres gratis."*

**Directo a jefe de residentes (julio):**
> *"Si la adoptás en tu residencia, el primero entra gratis."*

**Story/campaña agosto:**
> *"Empezás la residencia en septiembre. Empezá equipado."*

## Canales y secuencia

| Mes | Acción |
|-----|--------|
| Julio | Contacto directo a jefes de residentes (10-15 hospitales clave) |
| Agosto semana 1 | Lanzar campaña en Instagram + activar 2×1 en el worker |
| Agosto semanas 2-3 | Stories con countdown, WhatsApp groups |
| Agosto semana 4 | Cerrar el 2×1, volver a precio normal |

**Hospitales prioritarios para contacto directo:**
Garrahan, Elizalde, Sardá, Gutiérrez (CABA) + hospitales provinciales con residencia de neonatología activa.

## Duración

3 semanas. Suficiente para generar urgencia sin diluir la oferta.

## Métrica de éxito

En esta etapa no es conversión económica — es **pares activados**:
- Cuántos cupones 2×1 fueron generados
- Cuántos fueron canjeados (tasa de activación del segundo usuario)
- Si el segundo usuario retiene (vuelve después de la primera semana)

Si un par retiene → dos residentes usan NeoCalcu en guardia → la recomiendan a la siguiente cohorte.

## Contenido visual

Generar desde el admin (generador de contenido con Claude) en julio, cerca de agosto. No tiene sentido crearlo antes. Formatos necesarios:
- 1 Reel: dos residentes en guardia, flujo de uso de la app
- 2-3 Stories con countdown de duración limitada
- 1 mensaje de WhatsApp listo para reenviar
