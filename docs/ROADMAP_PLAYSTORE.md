# Hoja de ruta: NeoCalcu → Google Play Store

> Basada en el proceso real de NeoMonitor (mayo 2026).
> Ver proceso detallado con errores y soluciones en `PROCESO_BUILD_AAB.md`.

---

## Estado actual de NeoCalcu

Lo que ya está listo para publicar como TWA:

- ✅ PWA con manifest válido (`vite-plugin-pwa`)
- ✅ Service Worker con precacheo completo (Workbox)
- ✅ HTTPS en producción (GitHub Pages)
- ✅ Íconos 192×192 y 512×512
- ✅ `display: standalone`, `start_url`, `scope` correctos
- ✅ Cuenta de Google Play Developer activa
- ⚠️ Ícono maskable: configurado en manifest pero requiere verificar que tenga safe zone (fondo + padding del 10%)
- ❌ Proyecto Android (archivos Gradle) — se genera en Paso 2
- ❌ `assetlinks.json` publicado
- ❌ Política de privacidad en URL pública
- ❌ Screenshots para el listing del Play Store

---

## Decisiones pendientes (antes de arrancar)

| Decisión | Opciones | Recomendación |
|---|---|---|
| **Package ID** | `pro.neocalcul.twa` / `com.neocalcu.app` | `pro.neocalcul.twa` — usa el dominio propio |
| **Alias del keystore** | Cualquier string | `neocalcu-key` (simple y descriptivo) |
| **Dominio TWA** | `neocalcu.pro` o `diegoastein.github.io` | `neocalcu.pro` — más profesional para el listing |
| **Dónde servir `assetlinks.json`** | Worker de Cloudflare o repo `diegoastein.github.io` | Cloudflare Worker (ya existe, endpoint nuevo) |
| **Categoría Play Store** | Medical / Health & Fitness | Medical — más precisa |

---

## Hoja de ruta paso a paso

### Fase 1 — Preparación (estimado: 2-3 hs)

#### 1.1 Verificar ícono maskable
El manifest declara `purpose: "maskable"` en el ícono 512×512, pero la imagen actual es la misma que el ícono normal (sin safe zone). Play Store la muestra recortada en círculo.

- Regenerar `icon-512-maskable.png`: fondo verde sólido (`#065f46`) + logo centrado ocupando el 72% del área (safe zone OUXP)
- Actualizar `vite.config.ts` para apuntar el maskable a esta nueva imagen
- Commitear y hacer deploy

#### 1.2 Política de privacidad
Google Play exige una URL pública de política de privacidad.

- Crear una página simple en Google Sites, Notion o similar
- Contenido mínimo: qué datos recopila la app (device_id, email opcional), cómo se usan, contacto
- Guardar la URL — se necesita al crear el listing

#### 1.3 Screenshots Android
Hacer capturas de pantalla en un dispositivo Android o emulador mostrando:
- Pantalla de medicamentos con una dosis calculada
- Pantalla de calculadoras (Bilirrubina o Finnegan)
- Pantalla de procedimientos
- Pantalla de laboratorio

Play Store requiere mínimo 2 screenshots. Recomendado: 4-5.

---

### Fase 2 — Generar proyecto Android (estimado: 1 hs, interactivo)

Hacerlo en **GitHub Codespaces** (no localmente — requiere Android SDK).

```bash
# En la terminal del Codespace
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://neocalcu.pro/manifest.webmanifest
```

Datos a ingresar cuando bubblewrap los pida:
- **Package ID**: `pro.neocalcul.twa`
- **App version**: `1`
- **App version name**: `"1"`
- **Colores**: confirmar con Enter (los toma del manifest)
- **Keystore path**: `./signing.keystore`
- **Key alias**: `neocalcu-key`
- **Contraseña**: elegir una fuerte — **guardarla en gestor de contraseñas ahora mismo**
- **Licencias SDK**: aceptar todo con `y`

**⚠️ Antes de cerrar el Codespace:**
- Descargar `signing.keystore` (click derecho → Download)
- Guardar en lugar seguro — sin este archivo no se puede actualizar la app nunca más

**Commitear los archivos generados (sin el keystore):**
```bash
git add app/ build.gradle settings.gradle gradle/ gradlew gradlew.bat gradle.properties twa-manifest.json
git commit -m "feat: inicializar proyecto Android TWA con bubblewrap"
git push
```

---

### Fase 3 — CI/CD en GitHub Actions (estimado: 30 min)

#### 3.1 Cargar el keystore como GitHub Secret
En GitHub → repo → Settings → Secrets and variables → Actions:

```bash
# Obtener el base64 del keystore (correr localmente o en el Codespace)
base64 -w 0 signing.keystore
```

| Secret | Valor |
|---|---|
| `KEYSTORE_BASE64` | output del comando base64 |
| `KEYSTORE_PASSWORD` | la contraseña elegida |

#### 3.2 Crear el workflow
Archivo: `.github/workflows/build-android.yml`

```yaml
name: Build Android AAB

on:
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Decode keystore
        env:
          KEYSTORE_BASE64: ${{ secrets.KEYSTORE_BASE64 }}
        run: echo "$KEYSTORE_BASE64" | base64 -d > signing.keystore

      - name: Build AAB
        env:
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
        run: |
          chmod +x gradlew
          ./gradlew bundleRelease \
            -Pandroid.injected.signing.store.file=$(pwd)/signing.keystore \
            -Pandroid.injected.signing.store.password=$KEYSTORE_PASSWORD \
            -Pandroid.injected.signing.key.alias=neocalcu-key \
            -Pandroid.injected.signing.key.password=$KEYSTORE_PASSWORD

      - name: Upload AAB
        uses: actions/upload-artifact@v4
        with:
          name: neocalcu-release
          path: app/build/outputs/bundle/release/app-release.aab
          if-no-files-found: error
```

#### 3.3 Correr el workflow y descargar el AAB
- GitHub → Actions → `Build Android AAB` → **Run workflow**
- Esperar ~3-5 minutos
- Descargar artifact `neocalcu-release` → descomprimir → `app-release.aab`

---

### Fase 4 — Listing en Play Console (estimado: 1-2 hs)

- Crear nueva app en Play Console
- Completar ficha: nombre, descripción corta, descripción larga, categoría (Medical), email de contacto
- Subir screenshots
- Subir `app-release.aab` a la track de Producción (o Prueba cerrada primero)
- Ingresar URL de política de privacidad

**Texto sugerido para descripción corta:**
> Calculadora médica bedside para neonatología. Dosis, procedimientos, índices clínicos y valores de laboratorio. 100% offline.

**Disclaimer obligatorio en descripción** (Play Store lo exige para apps médicas):
> Esta app es una herramienta de apoyo para profesionales de la salud. No reemplaza el criterio clínico ni la evaluación médica individualizada.

---

### Fase 5 — Digital Asset Links (estimado: 1 hs, después de subir el AAB)

El `assetlinks.json` debe estar en `https://neocalcu.pro/.well-known/assetlinks.json`.

Como `neocalcu.pro` corre en Cloudflare, la forma más simple es agregar un endpoint al Worker existente:

**En `worker/index.ts`, agregar antes del handler principal:**
```typescript
if (url.pathname === '/.well-known/assetlinks.json') {
  return new Response(JSON.stringify([{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'pro.neocalcul.twa',
      sha256_cert_fingerprints: ['XX:XX:XX:...'] // SHA-256 de Google Play App Signing
    }
  }]), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

**⚠️ El SHA-256 correcto se obtiene DESPUÉS de subir el AAB:**
- Play Console → tu app → Configuración → Integridad de la app → Certificado de firma → copiar SHA-256

**Verificar que funciona:**
```
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://neocalcu.pro&relation=delegate_permission/common.handle_all_urls
```

---

### Fase 6 — Revisión de Google (3-7 días hábiles)

Primera revisión suele tardar más. Para apps en categoría Medical puede extenderse. No hay nada que hacer salvo esperar.

Si Google rechaza por "wrapper de sitio web":
- Responder en Play Console explicando que es una TWA (tecnología oficial de Google Chrome)
- Adjuntar el link a la documentación oficial de TWA

---

## Flujo para versiones futuras

Una vez publicada, para cada update:

1. Incrementar versión en `app/build.gradle`:
   ```groovy
   versionCode 2
   versionName "2"
   ```
2. Push a `main`
3. GitHub Actions → Run workflow → descargar AAB
4. Play Console → Producción → Nueva versión → subir AAB

El contenido de la app (medicamentos, dosis, etc.) se actualiza instantáneamente con cada deploy a GitHub Pages — sin nueva versión en Play Store.

---

## Datos críticos a guardar (gestor de contraseñas)

| Dato | Dónde guardarlo |
|---|---|
| `signing.keystore` (archivo) | Adjunto en gestor de contraseñas |
| Alias del keystore | `neocalcu-key` |
| Contraseña del keystore | Gestor de contraseñas |
| Package ID | `pro.neocalcul.twa` |
| SHA-256 keystore propio | Para referencia — no va en assetlinks.json |
| SHA-256 Google Play App Signing | El que va en assetlinks.json |

---

## Estimación total de trabajo activo

| Fase | Tiempo |
|---|---|
| Preparación (ícono, privacy policy, screenshots) | 2-3 hs |
| Generar proyecto Android en Codespaces | 1 hs |
| CI/CD workflow | 30 min |
| Listing en Play Console | 1-2 hs |
| assetlinks.json en Cloudflare Worker | 30 min |
| **Total trabajo activo** | **~6-7 hs** |
| Revisión de Google | 3-7 días hábiles |
