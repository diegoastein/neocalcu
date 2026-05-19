# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Flujo de trabajo Git

**Ramas principales:**
- `main` — producción (GitHub Pages)
- `beta` — testing

**Flujo de desarrollo:**
1. Desarrollar y probar en `localhost:5173` (`npm run dev`)
2. Commits diarios manteniendo el historial limpio
3. Push a `main` → GitHub Actions despliega automáticamente en GitHub Pages (~1 min)

## Commands

```bash
npm install          # instalar dependencias (primera vez)
npm run dev          # servidor de desarrollo en localhost:5173
npm run build        # tsc + vite build → dist/
npm run preview      # previsualizar el build de producción
```

No hay tests automatizados. La validación es visual: abrir el navegador, ingresar un peso y verificar que dosis, volúmenes y preparaciones se calculen correctamente.

## Contexto del proyecto

**NeoCalcu** es una PWA (Progressive Web App) de uso clínico bedside para neonatología. Funciona **100 % offline** — no hay backend ni fetch en tiempo de ejecución. Toda la lógica y los datos clínicos se empaquetan en el bundle de Vite.

Stack: **Vite + React 18 + TypeScript + Tailwind CSS v3 + vite-plugin-pwa** (Workbox).

## Deploy (GitHub Pages)

El workflow `.github/workflows/deploy.yml` usa las Actions oficiales de GitHub Pages:
- `actions/configure-pages` + `actions/upload-pages-artifact` + `actions/deploy-pages`
- Se dispara en cada push a `main`
- Despliega directo al CDN sin rama `gh-pages` intermediaria
- URL de producción: **https://diegoastein.github.io/neocalcu/**

**No usar** `peaceiris/actions-gh-pages` — fue reemplazado por incompatibilidad con la configuración de Pages.

## Arquitectura

### Datos clínicos — fuente de verdad

`docs/clinical_knowledge.json` contiene todas las drogas, procedimientos, índices clínicos, fórmulas y valores de laboratorio. Este archivo es **importado estáticamente** en la capa de datos de TypeScript; jamás se fetchea en runtime. Al modificar datos clínicos, siempre editar este JSON.

Estructura del JSON:
```
drugs[]        → medicamentos con dosingRules[], infusionRules[] y/o inotropicConfig
procedures[]   → procedimientos con formulas[] y steps[]
scores[]       → escalas clínicas con items[] e interpretation[]
formulas[]     → calculadoras médicas (BSA, clearance, etc.)
laboratory[]   → valores de referencia neonatal por categoría
```

### Tipos

`src/types/index.ts` define todas las interfaces compartidas. Las más importantes:

- **`Patient`** — `{ weightGrams, gestAgeWeeks?, dayOfLife? }` — datos del paciente actuales
- **`Drug`** — puede tener `dosingRules` (bolos/intervalos), `infusionRules` (infusiones), y/o `inotropicConfig` (calculador inotrópico interactivo)
- **`DosingRule`** — filtra por `gaMin/gaMax`, `dolMin/dolMax`, `weightMinG/weightMaxG` para llegar a la dosis correcta
- **`InfusionRule`** — incluye `ruleOf3` con `multiplier` y `volumeMl` para calcular la "regla de 3" bedside
- **`InotropicConfig`** — configuración del calculador interactivo: rangos de dosis (`doseMin/doseMax/doseStep`), flujo (`flowMin/flowMax/flowStep`), volúmenes disponibles
- **`Score`** — escalas clínicas; puede tener `bilirubinCalculator: true`, `ropCalculator: true` o `finneganCalculator: true` para activar componentes especiales
- **`Formula`** — calculadoras médicas con inputs dinámicos; puede tener `calculations` (objeto de fórmulas dependientes) con `calculationsLabels`, `calculationsUnits`, `calculationsHidden`
- **`LabCategory`** / **`LabParameter`** / **`LabReference`** — estructura para valores de referencia de laboratorio neonatal

### Capa de datos (`src/data/`)

Los archivos de datos importan el JSON y re-exportan arrays tipados:
- `medications.ts` → exporta `drugs: Drug[]` y función `searchDrugs(query)`
- `procedures.ts` → exporta `procedures: Procedure[]`
- `scores.ts` → exporta `scores: Score[]`
- `formulas.ts` → exporta `formulas: Formula[]`
- `laboratory.ts` → exporta `labCategories: LabCategory[]`

Las funciones de cálculo de dosis viven en `src/utils/calculations.ts`:
- `matchDosingRule(rules, patient)` — devuelve la primera regla que cumple todos los matchers
- `calcDose(rule, weightGrams)` — devuelve `{ doseTotal, volumeMl, nursingInstruction }`
- `calcRuleOf3(infusionRule, weightKg)` — devuelve preparación y velocidad para infusiones continuas

### Contextos globales (`src/context/`)

- **`PatientContext.tsx`** — provee `patient`, `setPatient` y la API multi-paciente a toda la app. Internamente maneja un array de `SavedPatient[]` (`{ id, label, patient }`) persistido en `localStorage` (`neo_patients`, `neo_active_patient`). La API pública (`patient`, `setPatient`) sigue siendo la misma para el resto de la app. Exporta además: `savedPatients`, `activeId`, `switchPatient(id)`, `addPatient()`, `removePatient(id)`, `renamePatient(id, label)`, `MAX_PATIENTS` (= 4). Migra automáticamente desde `sessionStorage` si existe un paciente previo.
- **`MembershipContext.tsx`** — provee `useMembership()` a cualquier componente sin prop drilling. `MembershipProvider` recibe `membership` (de `useDonationReminder`) en `App.tsx` y lo expone globalmente. Usado para gatear funciones premium.
- **`FavoritesContext.tsx`** — maneja marcadores (favoritos) de medicamentos, procedimientos, índices y fórmulas. Persiste en `localStorage`

### Componentes clave

- **`DrugDetail.tsx`** — modal de detalle de medicamento. Si el drug tiene `inotropicConfig`, muestra `InotropicCalculator` en lugar de la sección de dosificación estándar.
- **`InotropicCalculator.tsx`** — calculador interactivo para inotrópicos: sliders de dosis y flujo, toggle de volumen (12/24/50 mL). Fórmula: `mg = dosis × peso × volumen × 60 / (flujo × 1000)`. **Premium:** botón "Tabla de velocidades" expandible que muestra flujos (mL/h) para cada combinación dosis × volumen, usando los mg actuales como preparación base. Sin suscripción muestra un bloque con candado (patrón estándar de gate premium). Usa `useMembership()`.
- **`PatientInput.tsx`** — barra sticky de datos del paciente activo. **Colapsable:** se colapsa al registrar mostrando barra compacta `Peso / EG / Días` (con labels del mismo tamaño que los valores); campos sin completar en ámbar. Se re-expande al tocar la barra. Auto-colapsa en `onBlur` cuando todos los campos están completos. Botón "Registrar datos" pulsa en verde cuando hay cambios sin guardar (`isDirty`), apagado cuando está sincronizado. **Premium:** barra de tabs horizontal con todos los pacientes guardados (nombre + peso), botón "+" para agregar (hasta `MAX_PATIENTS = 4`), botón "×" para eliminar, campo "Nombre / cama" que se guarda on blur. Sin suscripción muestra bloque con candado. Usa `useMembership()` y la API multi-paciente de `PatientContext`.
- **`BilirubinCalculator.tsx`** — calculadora de umbrales de fototerapia y exanguinotransfusión según **NICE CG98 (2023)**. ≥38s: valores exactos del Excel oficial NICE (interpolación hora a hora). 35-37s: escalados con fórmula NICE para pretérminos (EG×10−100 µmol/L). Muestra umbrales en mg/dL y µmol/L. 5 zonas: normal / limítrofe / fototerapia / intensiva / exanguino. Factores de monitorización (no modifican umbral, solo frecuencia de control).
- **`ROPCalculator.tsx`** — guía de screening ROP según SAP 2021. Criterio obligatorio (EG ≤32s o PN ≤1500g) y condicional (33–36s con factores de riesgo). Calcula fecha del primer examen.
- **`FinnceganCalculator.tsx`** — evaluación del Síndrome de Abstinencia Neonatal (NAS). 22 ítems hardcodeados en 3 secciones (SNC / Metabólico-Vasomotor-Respiratorio / GI) con puntajes ponderados no lineales (0/2/3, 0/3/4, 0/5). Puntaje en tiempo real con color coding: 0–7 verde / 8–12 ámbar / ≥13 rojo. Activado por `finneganCalculator: true` en el score del JSON.
- **`BottomNav.tsx`** — navegación inferior con iconos SVG minimalistas (Heroicons).
- **`SettingsPanel.tsx`** — drawer lateral izquierdo de configuración. Props: `isOpen`, `onClose`, `themeMode`, `onThemeChange`, `canInstall`, `onInstall`, `onDonate`, `onRedeem`, `membership`. Secciones: selector de tema (Sistema/Día/Noche), instalación PWA (condicional a `canInstall`), sección de apoyo (ver abajo), contacto, enlace Neomonitor, aviso legal. La sección de apoyo es condicional: si `membership.active` muestra una card verde "¡Gracias por apoyar NeoCalcu!" con tipo de plan y fecha de vencimiento; si no, muestra los botones de pago y el canje de cupón.
- **`DonationToast.tsx`** — toast de donación fijo sobre el BottomNav. Se muestra cada 3 aperturas si el usuario no tiene membresía activa. Tiene countdown de 30s y se cierra automáticamente. Props: `onDonate`, `onDismiss`, `onRecover`, `loadingPlan`.
- **`EmailCaptureModal.tsx`** — modal centrado que aparece tras el primer pago verificado o cupón canjeado (y en cada apertura mientras el email no esté registrado). Llama a `/registrar-email` en el worker. Al guardar exitosamente escribe `neo_email_registered = '1'` en localStorage. El backdrop **no cierra** el modal — solo el botón "Lo hago en otro momento". Si el cupón canjeado ya tenía email asignado desde el admin, el modal no aparece y `neo_email_registered` se setea automáticamente. Props: `onRegister`, `onDismiss`.
- **`PremiumFeaturesSheet.tsx`** — bottom sheet que se muestra al abrir la app (600ms de delay) si el usuario no tiene membresía activa. Lista las funciones premium disponibles y próximas con badges "Disponible" / "Próximamente". CTA con botones mensual/anual y link "Ahora no". Se cierra tocando el backdrop, el botón X, o el link. Props: `onSubscribe`, `onDismiss`.
- **`ProcedureNotes.tsx`** — campo de notas libre por procedimiento. Lee/escribe `localStorage` en la clave `neo_procedure_notes` (objeto `{ [procedureId]: string }`). Guarda `onBlur`. Textarea de 1 línea que crece automáticamente al escribir. Gate premium: bloque dashed con candado. Sin relación con el paciente activo — las notas persisten siempre.
- **`ShareResultButton.tsx`** — botón premium para compartir el resultado de cualquier cálculo. Usa Web Share API si está disponible (abre share sheet nativo); fallback a `navigator.clipboard.writeText()`. Props: `text: string`, `title?: string`. Muestra feedback "Compartido" / "Copiado" por 2s. Gate premium: bloque compacto inline con candado.
- **`useDonationReminder.ts`** (`src/hooks/`) — hook que maneja toda la lógica de donación y membresía. Exporta `showToast`, `dismissToast`, `showEmailCapture`, `dismissEmailCapture`, `handleDonate`, `handleVerify`, `handleRedeem`, `handleRecover`, `handleRegisterEmail`, `loadingPlan`, `membership`. La interfaz `MembershipInfo` (`{ active, plan, expiresAt }`) se exporta para usarla como prop en otros componentes. `membership` se recalcula automáticamente tras verificar pago o canjear cupón. Falla silenciosamente sin conexión. **Lógica de verificación:** si hay membresía activa en localStorage → no llama al worker (eficiente), pero sí muestra `EmailCaptureModal` si el email no está registrado. Si no hay membresía → llama al worker en **cada apertura** (no solo cada 3) para restaurar automáticamente si el storage fue borrado. El toast de donación sigue mostrándose solo cada 3 aperturas.
- **`PromoResidenciasOverlay.tsx`** — sistema de avisos/promociones en el header. Exporta dos elementos: `PromoHeaderBadge` (badge ámbar parpadeante entre hamburguesa y botón derecho, muestra texto + countdown; retorna `null` cuando `EXPIRY` vence) y `PromoResidenciasOverlay` (overlay modal con descripción de la promo, countdown en tiempo real, botones de pago mensual/anual a MercadoPago, y link a Instagram). Visible para todos (suscriptores y no suscriptores). **Para futuras promos:** ajustar `EXPIRY`, el texto del badge y el contenido del overlay — el espacio, colores ámbar y tipografía están definidos para reutilizarse. El overlay se cierra antes de navegar a MercadoPago para evitar que bfcache lo restaure abierto al volver.

### Páginas y navegación

5 páginas sin router externo — la navegación es un simple `useState<ActivePage>` en `App.tsx`:

| `ActivePage`      | Página                | Contenido principal                                                                    |
|-------------------|-----------------------|----------------------------------------------------------------------------------------|
| `medicamentos`    | `MedicationsPage`     | Buscador + calculadora de dosis por peso + botón favoritos                             |
| `procedimientos`  | `ProceduresPage`      | 24 procedimientos con fórmulas interactivas + pasos                                    |
| `calculadoras`    | `CalculadorasPage`    | Índices clínicos + Fórmulas en un único selector con optgroups                         |
| `laboratorio`     | `LaboratoryPage`      | Valores de referencia neonatal — buscador cross-categoría + acordeones (12 categorías) |
| `favoritos`       | `FavoritesPage`       | Listado de todos los items marcados como favoritos (drugs, procedures, scores, formulas)|

La barra de navegación inferior (`BottomNav`) es el único mecanismo de routing. Usa iconos SVG (no emojis).

#### Tab Calculadoras (`CalculadorasPage`)

Unifica `ScoresPage` y `FormulasPage` en una sola vista. El `<select>` usa `<optgroup>` para separar "Índices clínicos" de "Fórmulas". El estado interno (`selectedType: 'score' | 'formula'`) determina qué lógica de renderizado usar. Incluye `PatientInput` siempre visible para auto-rellenar el peso.

Calculadoras especiales activadas por flags en el tipo `Score`:
- `bilirubinCalculator: true` → renderiza `BilirubinCalculator`
- `ropCalculator: true` → renderiza `ROPCalculator`
- `finneganCalculator: true` → renderiza `FinnceganCalculator`

Cuando un score tiene cualquiera de estos flags, la UI de ítems/resultado/limpiar queda completamente suprimida y solo se muestra el componente especializado.

#### Tab Laboratorio (`LaboratoryPage`)

Buscador cross-categoría: el input filtra simultáneamente en todos los parámetros (`name` y `abbreviation`). Sin búsqueda activa, muestra todas las categorías como acordeones colapsables (la primera expandida por defecto). Al escribir, se expanden todas las categorías con matches y se ocultan las vacías.

**85 parámetros en 12 categorías:**
- Gasometría, Hemograma, Electrolitos, Química básica, Función hepática, Coagulación, Infección/Inflamación, Función tiroidea, LCR (originales)
- **Análisis de orina** (nueva): densidad, pH, proteinuria, hematuria, leucocituria, nitritos, Na urinario, relación Pr/Cr
- **Marcadores cardíacos** (nueva): Troponina I, NT-proBNP, CK-MB
- **Metabólico/Endócrino** (nueva): insulina, cortisol, ACTH, 17-OHP

Fuentes: Hospital Garrahan (primaria), Harriet Lane 23ª ed., Gomella 8ª ed., COBICO Argentina.

### PWA / Offline

`vite.config.ts` configura `vite-plugin-pwa` con Workbox. El service worker precachea **todos** los assets (JS, CSS, HTML, JSON, PNG). No hay runtime caching — todo debe estar en el bundle. Para agregar datos nuevos, siempre agregarlos al JSON o importarlos estáticamente.

**Íconos PWA** (`public/`):
- `icon-192.png` y `icon-512.png` — íconos del manifest (Android/desktop)
- `apple-touch-icon.png` — ícono 180×180 para iOS ("Agregar a pantalla de inicio")
- `favicon-32.png` — favicon de pestaña del navegador
- Fuente original: `docs/Gemini_Generated_Image_gz1wa5gz1wa5gz1w.png` (2816×1536), recortada al cuadrado central con `sharp`

**Instalación PWA desde la app**: `App.tsx` captura el evento `beforeinstallprompt` y expone `handleInstall()` al `SettingsPanel`. El botón de instalación solo aparece cuando el evento está disponible (`canInstall = true`).

## Lógica de dosificación

### Drogas en bolo (`dosingRules`)

El algoritmo recorre el array `dosingRules` en orden y devuelve la **primera** regla donde todos los matchers opcionales se satisfacen:
- `gaMin <= patient.gestAgeWeeks < gaMax`
- `dolMin <= patient.dayOfLife < dolMax`
- `weightMinG <= patient.weightGrams < weightMaxG`

Si no hay GA ni DOL ingresados, mostrar **todas** las reglas con el peso calculado.

Cálculo de dosis y volumen:
```
doseTotal (mg) = rule.dosePerKg × (weightGrams / 1000)
volumeMl       = doseTotal / preparation.concentrationMgMl
```

### Infusiones continuas (`infusionRules` con `ruleOf3`)

Regla de 3 estándar para dopamina/dobutamina (multiplier=3):
```
mgPreparar = multiplier × pesoKg
Diluir en volumeMl (50 mL)
→ 1 mL/h = 1 mcg/kg/min
```

### Calculador inotrópico interactivo (`inotropicConfig`)

Para drogas con `inotropicConfig`, la UI muestra `InotropicCalculator` en lugar de la dosificación estándar. El usuario elige dosis y flujo con sliders, y volumen con un toggle; la app calcula los mg a preparar:

```
mg = dosis (mcg/kg/min) × peso (kg) × volumen (mL) × 60 / (flujo (mL/h) × 1000)
```

Drogas con calculador inotrópico: **Dopamina**, **Dobutamina**, **Adrenalina (infusión)**, **Milrinona**, **Norepinefrina**.

Para agregar un nuevo inotrópico, agregar `inotropicConfig` al objeto del drug en el JSON:
```json
"inotropicConfig": {
  "doseMin": 0.05,
  "doseMax": 1,
  "doseStep": 0.05,
  "defaultDose": 0.1,
  "flowMin": 0.5,
  "flowMax": 5,
  "flowStep": 0.5,
  "defaultFlow": 1,
  "volumes": [12, 24, 50],
  "defaultVolume": 50,
  "diluent": "D5% o SF 0.9%",
  "unit": "mcg/kg/min"
}
```

### Fórmulas con múltiples resultados (`calculations`)

Algunas fórmulas (Balance Hidroelectrolítico, Cilindro O₂) definen un objeto `calculations` con fórmulas dependientes. El orden de evaluación es fijo y los resultados intermedios se acumulan en `variables` antes de calcular los derivados. Variables con números en el nombre (ingreso1, ingreso2) requieren el regex `/\b([a-z_][a-z0-9_]*)\b/g`.

Metadatos opcionales:
- `calculationsLabels` — mapa `key → label` para mostrar en la UI
- `calculationsUnits` — mapa `key → unidad`
- `calculationsHidden` — array de keys a no mostrar en resultados

## Convenciones de UI

- Colores `brand-*` (verde esmeralda: `#022c22` a `#ecfdf5`, incluye `950`) como color primario; usar variantes del objeto `brand` en `tailwind.config.js`
- **Variantes disponibles en tailwind.config.js**: 50, 100, 200, 300, 500, 700, 800, 900, 950. **No existen brand-400 ni brand-600** — usar brand-500 o brand-700 en su lugar o Tailwind las ignorará silenciosamente.
- **Nunca usar `dark:bg-brand-950`** — usar `dark:bg-slate-800` como fondo oscuro estándar (brand-950 existe en el config pero puede tener problemas de cacheo en Vite)
- Dark mode con tres modos: **Sistema** (sigue `prefers-color-scheme`), **Día**, **Noche** — controlado desde `SettingsPanel`. El estado `themeMode: 'system'|'light'|'dark'` persiste en `localStorage`
- Header superior: ícono hamburguesa (vértice superior izquierdo) que abre `SettingsPanel` + **zona central de avisos** (opcional, `PromoHeaderBadge` cuando hay promo activa) + elemento dinámico en vértice superior derecho: si la membresía está activa → badge verde con corazón "¡Gracias!" (no clickeable); si no → botón **"Apoyar"** (brand colors, ícono SVG de taza) que llama a `handleDonate()`
- Resultados de dosis en texto grande y negrita — legibilidad bedside en condiciones de luz variable
- Instrucción de enfermería siempre en un box con borde izquierdo verde — es lo que se transcribe a la indicación médica
- Warnings clínicos (contraindicaciones, incompatibilidades) en rojo/ámbar prominente
- `lightSensitive: true` en `preparation` → mostrar ícono de protección de luz en la UI
- Navegación inferior con 5 tabs (BottomNav) con iconos SVG minimalistas
- **Favoritos:** icono SVG estrella — outline gris (`text-slate-300 fill-none`) cuando no es favorito, relleno ámbar (`text-amber-400 fill-amber-400`) cuando sí. Sin animación de escala. Tamaño `w-5 h-5`.
- Medicamentos: **Antibióticos siempre primero**, resto de categorías alfabético, medicamentos dentro de cada categoría también alfabéticos

## Sistema de donación (MercadoPago + Cloudflare Worker)

La app tiene un sistema de donación verificado con backend real — no honor system.

### Arquitectura
1. `device_id` único por dispositivo (UUID en localStorage)
2. Botón "Apoyar" (header) o toast (cada 3 aperturas) → llama al Worker → crea preferencia de pago en MercadoPago
3. Usuario paga → MercadoPago dispara webhook al Worker → Worker guarda `device_id` en KV Store
4. App vuelve con `?paid=1` → verifica con Worker → suprime toast 30 días

### Worker (`worker/`)
- Deployado en Cloudflare Workers: `https://neocalcu-donations.diegosteinberg.workers.dev`
- **Endpoints públicos:** `GET /crear-pago`, `POST /webhook`, `GET /verificar`, `GET /generar-cupon`, `GET /canjear-cupon` (devuelve `email` si el cupón lo tenía asignado), `GET /recuperar`, `GET /registrar-email`
- **Endpoints admin** (requieren `ADMIN_SECRET`): `GET /admin/stats`, `GET /admin/coupons`, `POST /admin/generar-cupon`, `GET /admin/subscribers`, `POST /admin/generar-contenido`
- Secrets configurados en Cloudflare: `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `ADMIN_SECRET`, `ANTHROPIC_API_KEY`
- KV namespace: `DONATIONS_KV` (id: `594254b8fb874cea90ae91bb21fa52ad`)
- CORS: endpoints públicos permiten `https://diegoastein.github.io` + localhost; endpoints admin permiten `*` (protegidos por secret)
- Para redesployar: `CLOUDFLARE_API_TOKEN=... npx wrangler deploy --cwd worker`

### Precio y configuración
- Plan mensual: **ARS $3.500** | Plan anual: **ARS $28.000** (editar precios en `worker/index.ts` y redesployar)
- El worker recibe `?plan=mensual|anual` y usa el precio correspondiente
- Toast cada **3 aperturas** (editar `% 3` en `src/hooks/useDonationReminder.ts`)
- Supresión de **30 días** tras donación verificada (`THIRTY_DAYS_MS` en el hook)

### localStorage keys
- `neo_device_id` — UUID del dispositivo
- `neo_open_count` — contador de aperturas
- `neo_donated_at` — timestamp de última donación verificada
- `neo_donated_plan` — plan activo (`mensual` | `anual`)
- `neo_email_registered` — `'1'` si el usuario ya registró su email; se setea automáticamente si el cupón tenía email asignado desde el admin

## Dashboard admin (`neocalcu-admin`)

Herramienta externa de gestión, separada de la app. Repo: `github.com/diegoastein/neocalcu-admin`. Hosteada en Cloudflare Pages, protegida con Cloudflare Access (solo `diegosteinberg@gmail.com`).

### Secciones
- **Dashboard** — métricas en tiempo real via Worker: dispositivos totales, membresías activas (mensual/anual), cupones disponibles/usados, ingresos estimados
- **Cupones** — generar cupones individuales (con email opcional del destinatario) o en lote (hasta 50), tabla de activos/usados con columna email, copy directo
- **Contenido** — generador de material para Instagram y WhatsApp via Claude Haiku (`claude-haiku-4-5-20251001`):
  - **Post** → tarjeta visual editable (título/cuerpo/hashtags) → descarga PNG 1080×1080
  - **Reel** → 4 slides editables en formato 9:16 (SLIDE 1–4) → descarga PNG individual para importar en Instagram o CapCut
  - **Stories** → secuencia de 4 slides en texto
  - **WhatsApp** → mensaje para grupos médicos
  - **Novedades** → release notes en tono clínico

### Configuración del dashboard
- `VITE_ADMIN_SECRET` — variable de entorno en Cloudflare Pages (misma clave que `ADMIN_SECRET` del Worker)
- `ANTHROPIC_API_KEY` — secret en el Worker (no en el frontend)
- Stack: Vite + React + TypeScript + Tailwind + html-to-image
- Deploy: push a `main` → Cloudflare Pages rebuilds automáticamente

### Prompts de contenido
- Tono rioplatense, directo, "de colega a colega"
- Siempre "UCIN", nunca "NICU"
- Post y Reel: Claude devuelve JSON estructurado que el Worker parsea antes de enviarlo al frontend
- Para ajustar prompts: editar `buildContentPrompt()` en `worker/index.ts` y redesployar

## Estado actual (2026-05-13, últ. actualización 2026-05-19 — sesión 7)

**✅ Aplicación completamente funcional y en producción.**

**Medicamentos (MedicationsPage):**
- ✅ 223 medicamentos de referencia neonatal internacional (limpios, sin duplicados, en español)
- ✅ Buscador por nombre, genérico, indicaciones
- ✅ Agrupados por categoría: **Antibióticos siempre primero**, resto en orden alfabético; medicamentos dentro de cada categoría también alfabéticos
- ✅ Filtrado automático por peso, E.G., Días de vida
- ✅ Modal con calculadora de dosis
- ✅ **Calculador inotrópico interactivo** (sliders) para Dopamina, Dobutamina, Adrenalina, Milrinona, Norepinefrina
- ✅ Dosis por m² (ej. Didanosina): muestran la dosis informativa sin calcular, con aviso de que requieren SC

**Procedimientos (ProceduresPage):**
- ✅ **24 procedimientos**:
  - Vías/accesos: Punción Lumbar, Toracocentesis, Paracentesis, Acceso Intraóseo
  - Vía aérea: Surfactante, VM Convencional (inicio), CPAP Nasal, Cricotiroidotomía
  - Cardiovascular: Pericardiocentesis, RCP Neonatal
  - Nutrición: Nutrición Parenteral
  - Bilirrubina: Fototerapia Intensiva, Exanguinotransfusión Parcial, Exanguinotransfusión Doble Volumen
  - Metabólico/urgencias: Hipoglucemia, Hiperkalemia, Acidosis Metabólica, Hipotermia Terapéutica
  - Transporte: Transporte Neonatal
- ✅ Ordenados alfabéticamente por nombre
- ✅ Fórmulas interactivas con cálculo en tiempo real
- ✅ Pasos, materiales, advertencias y referencias
- ✅ Referencias de Fototerapia y Exanguinotransfusión actualizadas a NICE CG98 (2023)
- ✅ **Notas del servicio (premium)** — `ProcedureNotes` al final de cada procedimiento expandido; persiste en `localStorage` independiente del paciente activo

**Calculadoras (CalculadorasPage — tab unificado):**
- ✅ **Índices clínicos**: Silverman-Andersen, Apgar, Sarnat, **Bilirrubina NICE CG98 (2023)**, Screening ROP SAP, **Finnegan Modificado (NAS)**
- ✅ **Fórmulas** (12): BSA, Clearance Cr, Aporte Calórico, Proteínas, Osmolalidad, IMC, MAP, IO, CaO₂, Balance Hidroelectrolítico, BSA simplificada, Capacidad Cilindro O₂
- ✅ **Lista de acordeones** (igual a Procedimientos) en lugar de `<select>`: dos tabs fijos ("Índices clínicos" / "Fórmulas"), cada ítem expandible con `+/−`
- ✅ **Kit del Paciente Crítico** como card destacada verde sobre los tabs — separado visualmente de los índices clínicos, siempre visible
- ✅ PatientInput siempre visible para auto-rellenar peso
- ✅ Todos los inputs de fórmulas son visibles y editables (incluyendo peso, pre-poblado desde contexto del paciente)
- ✅ BSA simplificada corregida: fórmula usa kg directamente (`Math.pow(peso, 0.67) * 4.84 / 100`)

**Laboratorio (LaboratoryPage):**
- ✅ **12 categorías, 85 parámetros**: Gasometría, Hemograma, Electrolitos, Química básica, Función hepática, Coagulación, Infección/Inflamación, Función tiroidea, LCR, Análisis de orina, Marcadores cardíacos, Metabólico/Endócrino
- ✅ Buscador cross-categoría (reemplaza pills de categoría) con acordeones colapsables
- ✅ Parámetros estratificados por EG y edad postnatal
- ✅ Valores críticos marcados (criticalLow / criticalHigh)
- ✅ Nota especial sobre pico fisiológico de PCT (0–72h hasta 21 ng/mL)
- ✅ Fuente primaria: Hospital Garrahan; complementado con Harriet Lane, Gomella, COBICO Argentina

**Favoritos (FavoritesPage):**
- ✅ Navegación funcional desde favoritos: click en procedimiento → abre `ProceduresPage` expandido; click en índice/fórmula → abre `CalculadorasPage` con el ítem preseleccionado

**Configuración (SettingsPanel):**
- ✅ Ícono hamburguesa en vértice superior izquierdo del header
- ✅ Elemento dinámico en vértice superior derecho: badge verde "¡Gracias!" (membresía activa) o botón "Apoyar" (sin membresía)
- ✅ Selector de tema: Sistema / Día / Noche (persiste en `localStorage`)
- ✅ Botón de instalación PWA (visible solo cuando el navegador lo permite)
- ✅ Sección de apoyo condicional en SettingsPanel: card verde con fecha de vencimiento (membresía activa) o botones de pago + cupón (sin membresía)
- ✅ Contacto: info@neomonitor.pro
- ✅ Enlace "Más de Neomonitor" → www.getneomonitor.pro
- ✅ Aviso legal / disclaimer de responsabilidad

**Sistema de donación:**
- ✅ Toast cada **3 aperturas** con countdown de 30s — cubre el BottomNav desde `bottom-0`; no aparece si la membresía está activa
- ✅ Dos planes: mensual ($3.500, suprime 30 días) y anual ($28.000, suprime 365 días)
- ✅ Sistema de cupones: `/generar-cupon` (admin) y `/canjear-cupon` (usuario)
- ✅ Verificación real con Cloudflare Worker + MercadoPago Checkout Pro
- ✅ `MembershipInfo` (`{ active, plan, expiresAt }`) disponible en toda la app vía `MembershipContext` (`useMembership()`)
- ✅ Falla silenciosamente sin conexión (no bloquea funciones clínicas)
- ✅ **Verificación robusta**: si no hay membresía en localStorage, el worker se consulta en cada apertura (no solo cada 3) — restaura automáticamente si el device_id sigue en KV
- ✅ **Registro de email persistente**: `EmailCaptureModal` aparece en cada apertura hasta que el usuario registre su email; no se puede cerrar tocando el backdrop
- ✅ **Email en cupones**: al generar un cupón en el admin se puede asignar un email de destinatario; al canjearlo, el email se registra automáticamente en KV y la app setea `neo_email_registered='1'` sin mostrar el modal
- ✅ **Un dispositivo a la vez**: `/recuperar` invalida el dispositivo anterior en KV al transferir la suscripción; imposible tener la misma suscripción activa en dos dispositivos simultáneamente
- ✅ **Promo Residencias 2×1** (activa hasta 2026-06-01): badge ámbar parpadeante en header con countdown; overlay con descripción, countdown, botones de pago y link a Instagram. Visible para todos. `PromoResidenciasOverlay.tsx` reutilizable para futuras promos ajustando `EXPIRY` y texto. Campaña activa desde 2026-05-18: difusión por Instagram + DM manual; el suscriptor recibe un cupón de regalo por DM para compartir con otro residente.

**Funciones premium (freemium):**
- ✅ **Tabla de velocidades de inotrópicos** — toggle en `InotropicCalculator`, tabla dosis × volumen con flujos en mL/h; candado para no suscriptores
- ✅ **Múltiples pacientes simultáneos** — `PatientContext` con array, `PatientInput` con barra de tabs, hasta 4 pacientes, nombre editable; candado para no suscriptores
- ✅ **Notas en procedimientos** — `ProcedureNotes.tsx` al final de cada procedimiento; textarea autoexpandible, guarda `onBlur`, persiste en `neo_procedure_notes` en localStorage
- ✅ **Compartir resultados de cálculo** — `ShareResultButton.tsx` integrado en DrugDetail, InotropicCalculator, CalculadorasPage (scores y fórmulas), BilirubinCalculator, ROPCalculator y FinnceganCalculator; Web Share API con fallback a clipboard

**Dashboard admin (`neocalcu-admin`):**
- ✅ Hosteado en Cloudflare Pages, protegido con Cloudflare Access
- ✅ Dashboard de métricas en tiempo real (dispositivos, membresías, ingresos estimados)
- ✅ Gestión de cupones: generar individual (con email del destinatario)/lote, tabla de activos/usados con columna email
- ✅ Suscriptores: lista de usuarios que pagaron con email, búsqueda local, contador activos/total
- ✅ Generador de contenido con Claude Haiku: Post (PNG 1080×1080), Reel (4 slides PNG 9:16 con labels SLIDE 1-4), Stories, WhatsApp, Release notes
- ✅ Tono rioplatense, UCIN (no NICU), prompts directos sin frases de marketing
- ✅ Banco de contenido guardado en localStorage

**Deploy:**
- ✅ GitHub Actions con Actions oficiales de Pages (configure-pages + upload-pages-artifact + deploy-pages)
- ✅ Push a `main` → deploy automático en ~1 minuto
- ✅ PWA con Service Worker offline e íconos PNG nativos (icon-192, icon-512, apple-touch-icon, favicon-32)
- ✅ Manifest con `start_url` y `scope` correctos → genera acceso directo en lanzador Android/iOS
- ✅ `apple-mobile-web-app-title` en `index.html` → nombre "NeoCalcu" bajo el ícono en iOS (sin este tag iOS trunca el `<title>` de la página)
- ✅ Google Analytics 4 integrado (ID: `G-V37SQEN7J7`) — snippet en `<head>` de `index.html`
- ✅ Dominio `neocalcu.pro` — redirect via Cloudflare hacia `https://diegoastein.github.io/neocalcu/` (sin cambios en el código ni el worker)
- ✅ **SEO y social sharing** — `index.html` con Open Graph (og:title, og:description, og:image, og:url), Twitter Card, `<link rel="canonical" href="https://neocalcu.pro/">`, structured data JSON-LD (SoftwareApplication / MedicalApplication), title y meta description con keywords clínicos. **No mencionar NEOFAX** en ningún texto público — es marca registrada.
- ✅ **Google Search Console** — propiedad `neocalcu.pro` verificada automáticamente via GA4. Indexación manual solicitada el 2026-05-18.

## Agregar un medicamento nuevo

1. Agregar el objeto en `docs/clinical_knowledge.json` → array `drugs[]`, respetando la interfaz `Drug`
2. Si es inotrópico: agregar `inotropicConfig` con rangos de dosis y flujo apropiados
3. Si usa regla de 3: agregar `infusionRules` con `ruleOf3.multiplier` correcto
4. Si es bolo: agregar `dosingRules` de más restrictiva a menos restrictiva
5. Si la dosis es por m²: usar `unit: "mg/m²/dosis"` — la UI omite el cálculo automático y muestra aviso de SC
6. La UI lo muestra automáticamente — no se necesita código adicional

## Agregar valores de laboratorio

1. Editar `docs/clinical_knowledge.json` → array `laboratory[]`
2. Cada categoría tiene `id`, `name`, `source` y `parameters[]`
3. Cada parámetro tiene `id`, `name`, `abbreviation?`, `unit`, `references[]`, `notes?`, `criticalLow?`, `criticalHigh?`
4. Cada referencia tiene `label`, `min?`, `max?`, `notes?`
5. `src/data/laboratory.ts` re-exporta automáticamente — no se necesita código adicional

## Próximas tareas / Mejoras futuras

### Funciones premium para donantes

La app es freemium. El core clínico es gratuito; las funciones de productividad son exclusivas para suscriptores.

**Patrón de gate premium:** usar `useMembership()` de `MembershipContext`. Sin suscripción mostrar un bloque con `border-2 border-dashed border-slate-300`, ícono candado sobre `bg-brand-700` y texto "Suscriptores" en brand verde.

**Implementadas:**
- ✅ **Tabla de velocidades de inotrópicos** — `InotropicCalculator.tsx`. Toggle expandible, tabla dosis × volumen, flujos en mL/h.
- ✅ **Múltiples pacientes simultáneos** — `PatientContext.tsx` + `PatientInput.tsx`. Hasta 4 pacientes, barra de tabs, nombre editable on blur.
- ✅ **Notas en procedimientos** — `ProcedureNotes.tsx`. Textarea autoexpandible al final de cada procedimiento, guarda `onBlur`, persiste por `procedureId` en `neo_procedure_notes`.
- ✅ **Compartir resultados de cálculo** — `ShareResultButton.tsx`. Web Share API + fallback clipboard. Integrado en DrugDetail, InotropicCalculator, CalculadorasPage, BilirubinCalculator, ROPCalculator, FinnceganCalculator.

**Pendientes:**
- **Calculadora de Nutrición Parenteral completa** — VIG, proteínas g/kg/día, lípidos, volumen total. Más completa que el "Aporte Calórico" actual.
- **Fichas completas de medicamentos** — diluciones, estabilidad, reconstitución y compatibilidades IV. Solo para suscriptores.

**Largo plazo:**
- **Historial de cálculos** — últimos N cálculos con fecha y peso.
- **Temas de color adicionales** — incentivo freemium clásico.

### Retención y descubrimiento

Contexto: analytics (18 abril — 15 mayo) muestra 392 usuarios, 16.9s de sesión promedio, retención casi nula. Tráfico 100% dependiente de posts de Instagram (@neomonitor.pro, 780 seguidores), sin orgánico.

**✅ Implementado (sesión 6 — 2026-05-18):**

**Eventos GA4** — `src/utils/analytics.ts` exporta `trackEvent()`. Eventos activos:
- `search_drug` (query + results_count), `open_drug`, `calculate_dose` (drug + weight_g) — `MedicationsPage` / `DrugDetail`
- `open_procedure` — `ProceduresPage`
- `select_calculator` — `CalculadorasPage`
- `tab_switch` (tab) — `BottomNav` (solo al cambiar, no al re-tocar el activo)
- `view_inotropic_calculator` (drug_id + name) — `DrugDetail`
- `share_result` (method: share/clipboard) — `ShareResultButton`
- `favorite_added` (id) — `FavoritesContext`
- `click_apoyar` (source: header/toast/premium_sheet/promo_residencias, plan) — `App.tsx`
- `payment_started` (plan) — `useDonationReminder` al redirigir a MercadoPago
- `payment_success` (plan) — `useDonationReminder` al verificar donación exitosa
- `coupon_redeemed` (plan) — `useDonationReminder` al canjear cupón
- `pwa_installed`, `pwa_install_prompt` (outcome) — `App.tsx`

**Onboarding por tabs** — `OnboardingTooltip` con pasos específicos por sección (medicamentos 4 pasos, procedimientos, calculadoras, laboratorio, favoritos 1 paso cada uno). Se activa tras aceptar el disclaimer, keys `neo_onboarding_${tab}`.

**Banner de instalación PWA** — aparece 2s después del primer cálculo de dosis (`neo:first_dose` event). Se suprime con `neo_install_prompted`. Solo visible si `installPrompt` está disponible y no hay toast de donación activo.

**Pendiente:**
- **Play Store** — ver `docs/ROADMAP_PLAYSTORE.md`. Sin flujo de pago interno (viola política de Google); suscriptores se desbloquean por `device_id`.
- **Estrategia Instagram** — Reels de formato "escenario clínico → app resuelve en pantalla" (mayor alcance que posts estáticos). Sticker de link directo a `neocalcu.pro` en Stories. Anuncios: mínimo 15 días continuos, objetivo tráfico, link directo (no Linktree).
- **Próxima auditoría de marketing** — agendada para 2026-06-01 (cierre Promo Residencias). Revisar: cupones canjeados, eventos GA4 de funnel, Search Console, performance de Reels.

### Google Play Store
Ver hoja de ruta completa en `docs/ROADMAP_PLAYSTORE.md`.

Decisión de monetización: publicar gratis en Play Store sin flujo de pago interno (MercadoPago viola política de Google). Los suscriptores existentes se desbloquean automáticamente vía `device_id`. Nuevos suscriptores se dirigen a neocalcu.pro desde dentro de la app.
