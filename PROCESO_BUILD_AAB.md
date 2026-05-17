# Proceso completo: PWA → .aab para Google Play Store

> Documentación para uso propio. No subir al servidor.
> Basado en el proceso real de NeoMonitor (14 de mayo de 2026).
> Reconstruido del historial de git commit a commit.

---

## Resumen ejecutivo

Para publicar una PWA en Google Play Store como app Android nativa (TWA), el proceso que **funcionó** fue:

1. Generar el proyecto Android con `bubblewrap init` de forma **interactiva en GitHub Codespaces**
2. Commitear esos archivos al repo
3. Compilar el `.aab` con **GitHub Actions** usando Gradle directamente (sin bubblewrap en CI)
4. Corregir el SHA-256 en `assetlinks.json` con el certificado de **Google Play App Signing** (no el del keystore propio)

Tiempo invertido: ~10 horas, la mayoría en intentos fallidos de automatizar bubblewrap en CI.

---

## Contexto y enfoque

### ¿Qué es una TWA?

Una **Trusted Web Activity (TWA)** es una app Android que abre tu PWA en Chrome sin barra de navegación, dando la apariencia de app nativa. Requiere que tu dominio esté verificado con un archivo `assetlinks.json`.

### Herramientas

- **Bubblewrap CLI** (`@bubblewrap/cli`) — genera el proyecto Android (Gradle) a partir del `manifest.json` de tu PWA
- **GitHub Codespaces** — entorno de desarrollo en la nube de GitHub (browser-based VS Code con Java, Node, Android SDK preinstalados)
- **GitHub Actions** — CI/CD de GitHub para compilar el `.aab` automáticamente

### ¿Por qué no PWABuilder?

`pwabuilder.com` da error 500 intermitente y no es confiable como servicio online.

---

## Requisitos previos (la PWA)

Antes de empezar, la PWA debe tener:

1. **`manifest.json`** válido en la raíz, con al menos:
   - `name`, `short_name`, `start_url`, `display: "standalone"`
   - `icons` con 192x192 y 512x512 (y maskable para Play Store)
   - `theme_color`, `background_color`

2. **Service Worker** registrado y activo.

3. **HTTPS** obligatorio. El dominio debe ser tuyo y con certificado válido.

4. **Íconos reales** en los tamaños requeridos (no placeholders).

---

## Lo que NO funcionó: bubblewrap en GitHub Actions

Se intentó durante ~9 horas correr `bubblewrap build` directamente en el workflow de CI. Esto **no funciona** porque bubblewrap es una herramienta interactiva que hace preguntas en el terminal.

### Intento 1 — `printf` para pasar la contraseña (01:36 hs)

```yaml
run: printf '%s\n%s\n' "$KS_PASS" "$KS_PASS" | bubblewrap build --skipPwaValidation
```

**Falla**: bubblewrap pregunta también paths del JDK, Android SDK y acepta licencias — `printf` solo respondía el primer prompt.

### Intento 2 — script `expect` inline en el YAML (01:47 hs)

Se agregó `expect` (herramienta Unix para automatizar prompts interactivos):

```yaml
run: |
  cat > /tmp/build.exp << 'EXPECT_EOF'
  #!/usr/bin/expect -f
  spawn bubblewrap build --skipPwaValidation
  expect {
    -re {[Pp]assword} { send "$ks_pass\r"; exp_continue }
    eof
  }
  EXPECT_EOF
  expect /tmp/build.exp
```

**Falla**: el heredoc YAML tenía problemas de indentación y escaping con el script `expect`.

### Intento 3 — separar el script expect a un archivo propio (02:08 hs)

Se creó `.github/build-twa.exp` para evitar los problemas de YAML:

```
#!/usr/bin/expect -f
set timeout 600
spawn bubblewrap build --skipPwaValidation
expect {
  -re {[Pp]assword} { send "$ks_pass\r"; exp_continue }
  eof
}
```

**Falla**: el script solo manejaba la contraseña, pero bubblewrap también preguntaba rutas del JDK y Android SDK.

### Intento 4 — expect maneja todos los prompts (02:28 hs)

Se expandió el script para responder a todo:

```
expect {
  -re {(?i)jdk|java.*(path|home)} { send "$java_home\r"; exp_continue }
  -re {(?i)android.*(sdk|path|home)} { send "$android_sdk\r"; exp_continue }
  -re {(?i)password} { send "$ks_pass\r"; exp_continue }
  -re {\?\s*\[} { send "y\r"; exp_continue }
  eof
}
```

**Falla crítica**: el output que bubblewrap imprimía al confirmar el JDK path contenía la palabra "Java", lo que **re-disparaba el patrón**, generando un loop infinito. El workflow corría 6 horas hasta el timeout sin producir nada.

### Intento 5 — pre-escribir la config de bubblewrap (10:19 hs)

Idea: si `~/.bubblewrap/config.json` ya existe con los paths correctos, bubblewrap no pregunta. El script `expect` solo maneja passwords y licencias:

```yaml
- name: Configure Bubblewrap
  run: |
    mkdir -p ~/.bubblewrap
    cat > ~/.bubblewrap/config.json << EOF
    {
      "jdkPath": "$JAVA_HOME",
      "androidSdkPath": "$ANDROID_HOME"
    }
    EOF
```

**Falla**: `sdkmanager` (llamado por bubblewrap para instalar dependencias) mostraba `Accept? (y/N):` con **paréntesis**, no corchetes. El patrón `{\[y/N\]|\[Y/n\]}` no lo matcheaba, entonces `expect` no respondía y el proceso moría por timeout.

### Intento 6 — corregir el patrón de sdkmanager (10:40 hs)

```
-re {[Aa]ccept\?|[yY]/[nN]|[nN]/[yY]|yes/no|Yes/No} {
  send "y\r"
  exp_continue
}
```

**Estado**: este fue el último intento con bubblewrap en CI antes de cambiar de estrategia. Es posible que haya llegado más lejos pero el build final seguía fallando.

### Conclusión sobre bubblewrap en CI

**Bubblewrap no está diseñado para correr en CI.** Es una herramienta interactiva cuyo comportamiento depende del entorno, versión del SDK, y output variable. Automatizarla con `expect` es frágil por definición. La solución es usarla **una sola vez de forma interactiva** para generar el proyecto, y nunca más volver a correrla.

---

## Lo que SÍ funcionó

### Paso 1: Generar el proyecto Android con `bubblewrap init` en GitHub Codespaces

GitHub Codespaces es un entorno de desarrollo en la nube que provee una terminal con Java, Node.js y Android SDK ya instalados. Permite correr bubblewrap de forma interactiva sin configurar nada localmente.

**Cómo abrir un Codespace:**
1. Ir al repo en `github.com`
2. Click en **Code** (botón verde) → tab **Codespaces**
3. Click en **Create codespace on main**
4. Esperar ~1-2 minutos a que abra el VS Code en el browser

**En la terminal del Codespace:**

```bash
# Instalar bubblewrap
npm install -g @bubblewrap/cli

# Inicializar el proyecto Android
bubblewrap init --manifest https://tu-dominio.com/manifest.json
```

Bubblewrap hace preguntas interactivas — respondelas normalmente:
- **Package ID**: usar convención inversa del dominio, ej. `pro.neomonitor.twa` o `com.tuapp.twa`
- **App version**: empezar en `1`
- **App version name**: `"1"`
- **Colores**: los toma del manifest, confirmar con Enter
- **Keystore path**: dejarlo en `./signing.keystore`
- **Key alias**: `my-key-alias` (o el que quieras, pero recordarlo)
- **Contraseña del keystore**: elegir una fuerte, **guardarla en un lugar seguro ahora mismo**
- **Licencias Android SDK**: aceptar todo con `y`

Esto genera todos los archivos del proyecto Android en el directorio actual.

**⚠️ Crítico: bajar el keystore del Codespace antes de cerrarlo**

El Codespace genera `signing.keystore`. Hay que descargarlo:
- Click derecho sobre `signing.keystore` en el explorador de archivos del VS Code → **Download**
- Guardarlo en almacenamiento seguro (gestor de contraseñas, etc.)
- **Sin este archivo no se puede actualizar la app en Play Store nunca más**

**Commitear los archivos generados:**

```bash
git add app/ build.gradle settings.gradle gradle/ gradlew gradlew.bat gradle.properties twa-manifest.json store_icon.png manifest-checksum.txt
git commit -m "feat: inicializar proyecto Android con bubblewrap init"
git push
```

El `signing.keystore` **NO** se commitea (ya debe estar en `.gitignore`).

Después de pushear, el Codespace ya no es necesario. Se puede cerrar y borrar.

---

### Paso 2: Excluir el keystore del repo

`.gitignore` debe tener:

```gitignore
signing.keystore
*.keystore
*.jks
```

---

### Paso 3: Cargar el keystore como GitHub Secret

El workflow necesita el keystore para firmar la app. Se carga codificado en base64.

**En la terminal local (o en el Codespace antes de cerrarlo):**

```bash
base64 -w 0 signing.keystore
```

Copiar toda la salida (una sola línea muy larga).

**En GitHub → repo → Settings → Secrets and variables → Actions → New repository secret:**

| Secret name | Valor |
|---|---|
| `KEYSTORE_BASE64` | El base64 del keystore |
| `KEYSTORE_PASSWORD` | La contraseña elegida al crear el keystore |

---

### Paso 4: Crear el workflow de GitHub Actions

Crear `.github/workflows/build-android.yml`:

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
            -Pandroid.injected.signing.key.alias=my-key-alias \
            -Pandroid.injected.signing.key.password=$KEYSTORE_PASSWORD

      - name: Upload AAB artifact
        uses: actions/upload-artifact@v4
        with:
          name: mi-app-release
          path: app/build/outputs/bundle/release/app-release.aab
          if-no-files-found: error
```

**Por qué funciona:** el proyecto Android ya está en el repo (generado en el Paso 1). Gradle no es interactivo, simplemente compila y firma. No necesita bubblewrap, no necesita Node.js, no hace preguntas.

**Notas:**
- `workflow_dispatch` = se ejecuta solo cuando lo disparás manualmente, no en cada push
- `my-key-alias` debe coincidir exactamente con el alias que usaste al crear el keystore
- El path del AAB `app/build/outputs/bundle/release/app-release.aab` es siempre el mismo cuando lo genera Gradle (no usar `find` dinámico — devuelve vacío y el upload falla)

---

### Paso 5: Ejecutar el workflow y descargar el .aab

1. Ir a `github.com/usuario/repo/actions/workflows/build-android.yml`
2. Click en **Run workflow** → seleccionar rama `main` → **Run workflow**
3. Esperar ~3-5 minutos
4. En la corrida completada, bajar hasta la sección **Artifacts**
5. Descargar `mi-app-release` (viene como `.zip`)
6. Descomprimir → adentro está `app-release.aab`

---

### Paso 6: Digital Asset Links — assetlinks.json

Este archivo es lo que **verifica** que tu app Android tiene permiso para abrir tu dominio en modo TWA (sin barra de Chrome). Sin él, la app abre el sitio con la barra de URL visible.

**Ubicación**: debe estar accesible en `https://tu-dominio.com/.well-known/assetlinks.json`

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "pro.tuapp.twa",
    "sha256_cert_fingerprints": [
      "XX:XX:XX:XX:..."
    ]
  }
}]
```

---

### ⚠️ El problema del SHA-256 (y por qué hay dos)

Este fue el último problema antes de que todo funcionara.

**Hay dos SHA-256 distintos:**

**1. El del keystore propio** — el que usás para firmar el `.aab` antes de subirlo:
```bash
keytool -list -v -keystore signing.keystore -alias my-key-alias
```

**2. El de Google Play App Signing** — el que realmente importa.

Cuando subís el `.aab` a Google Play, Google **re-firma la app con su propia clave** antes de distribuirla a los usuarios. Eso significa que la app que instalan los usuarios está firmada por Google, no por vos. El `assetlinks.json` debe contener el SHA-256 del certificado de **Google**, no del tuyo.

**Si ponés el SHA-256 de tu keystore:**
- La app se instala y abre
- Pero Chrome no reconoce la verificación Digital Asset Links
- Resultado: la app abre con la barra de URL visible (no se ve como app nativa)

**Cómo obtener el SHA-256 correcto:**

Play Console → tu app → **Configuración** (menú lateral) → **Integridad de la app** → sección **Certificado de firma de la app** → copiar el valor **SHA-256**

**Nota importante**: ese SHA-256 solo aparece después de haber subido el primer `.aab` a Play Store. Es decir, primero subís el `.aab`, después actualizás el `assetlinks.json`.

**Cómo verificar que está bien:**

```
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://tu-dominio.com&relation=delegate_permission/common.handle_all_urls
```

Si devuelve tu `package_name` en el resultado, el vínculo está verificado.

---

## Estructura de archivos resultante

```
repo/
├── .github/
│   └── workflows/
│       └── build-android.yml     ← el workflow de CI
├── .well-known/
│   └── assetlinks.json           ← subir al servidor web
├── app/                          ← generado por bubblewrap init en Codespaces
│   ├── build.gradle              ← config de la app Android (packageId, versión, colores)
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml
│           ├── java/             ← código Java generado (LauncherActivity, etc.)
│           └── res/              ← íconos, splash, shortcuts
├── gradle/
│   └── wrapper/
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── icons/                        ← íconos de la PWA
├── build.gradle                  ← top-level Gradle (dependencias del build system)
├── gradle.properties
├── gradlew                       ← script Gradle para Linux/Mac
├── gradlew.bat                   ← script Gradle para Windows
├── manifest.json                 ← Web App Manifest de la PWA
├── settings.gradle
├── sw.js                         ← Service Worker
├── twa-manifest.json             ← config de Bubblewrap (referencia, no se usa en CI)
└── signing.keystore              ← en .gitignore — NUNCA al repo
```

---

## Flujo para versiones siguientes

Una vez que el proyecto Android está en el repo, para cada nueva versión:

1. En `app/build.gradle`, incrementar `versionCode` (número entero) y `versionName` (string):
   ```groovy
   versionCode 3
   versionName "3"
   ```
2. Push al repo
3. Ir a GitHub Actions → **Run workflow**
4. Descargar el artifact `.aab`
5. Play Console → Producción → Nueva versión → subir el `.aab`

El keystore siempre es el mismo. Si lo perdés, no podés actualizar la app (tendrías que publicarla de nuevo como app nueva).

---

## Resumen de errores y sus causas reales

| Error | Causa real |
|---|---|
| `bubblewrap build` cuelga en CI | Espera input interactivo del usuario; no funciona en entornos no-TTY |
| Loop infinito en script `expect` | El output de bubblewrap contenía la palabra "Java", re-disparando el patrón del JDK |
| Licencias de sdkmanager no se aceptan | `sdkmanager` muestra `Accept? (y/N):` con paréntesis, no corchetes — el patrón no matcheaba |
| `upload-artifact` falla con "path not supplied" | Se usaba `find` dinámico para el path del AAB; cuando devuelve vacío, el path queda vacío |
| App abre con barra de Chrome visible | `assetlinks.json` tenía el SHA-256 del keystore propio, no el de Google Play App Signing |

---

## Datos que hay que guardar (gestor de contraseñas o almacenamiento seguro)

Para cada app publicada guardar:

- `signing.keystore` — el archivo completo como adjunto
- Alias del keystore — ej. `my-key-alias`
- Contraseña del keystore
- Package ID — ej. `pro.neomonitor.twa`
- SHA-256 del keystore propio — para referencia
- SHA-256 de Google Play App Signing — el que va en `assetlinks.json`

---

## Referencias

- [Bubblewrap CLI en GitHub](https://github.com/GoogleChromeLabs/bubblewrap)
- [Trusted Web Activities — documentación Chrome](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [Digital Asset Links — verificación](https://developers.google.com/digital-asset-links/v1/getting-started)
- [Google Play App Signing — explicación oficial](https://support.google.com/googleplay/android-developer/answer/9842756)
- [GitHub Codespaces](https://github.com/features/codespaces)
