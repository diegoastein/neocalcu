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

- **`PatientContext.tsx`** — provee `patient` y `setPatient` a toda la app. Peso, E.G. (edad gestacional), Días persisten en `sessionStorage`
- **`FavoritesContext.tsx`** — maneja marcadores (favoritos) de medicamentos, procedimientos, índices y fórmulas. Persiste en `localStorage`

### Componentes clave

- **`DrugDetail.tsx`** — modal de detalle de medicamento. Si el drug tiene `inotropicConfig`, muestra `InotropicCalculator` en lugar de la sección de dosificación estándar.
- **`InotropicCalculator.tsx`** — calculador interactivo para inotrópicos: sliders de dosis y flujo, toggle de volumen (12/24/50 mL). Fórmula: `mg = dosis × peso × volumen × 60 / (flujo × 1000)`.
- **`BilirubinCalculator.tsx`** — calculadora de umbrales de fototerapia y exanguinotransfusión según **NICE CG98 (2023)**. ≥38s: valores exactos del Excel oficial NICE (interpolación hora a hora). 35-37s: escalados con fórmula NICE para pretérminos (EG×10−100 µmol/L). Muestra umbrales en mg/dL y µmol/L. 5 zonas: normal / limítrofe / fototerapia / intensiva / exanguino. Factores de monitorización (no modifican umbral, solo frecuencia de control).
- **`ROPCalculator.tsx`** — guía de screening ROP según SAP 2021. Criterio obligatorio (EG ≤32s o PN ≤1500g) y condicional (33–36s con factores de riesgo). Calcula fecha del primer examen.
- **`FinnceganCalculator.tsx`** — evaluación del Síndrome de Abstinencia Neonatal (NAS). 22 ítems hardcodeados en 3 secciones (SNC / Metabólico-Vasomotor-Respiratorio / GI) con puntajes ponderados no lineales (0/2/3, 0/3/4, 0/5). Puntaje en tiempo real con color coding: 0–7 verde / 8–12 ámbar / ≥13 rojo. Activado por `finneganCalculator: true` en el score del JSON.
- **`BottomNav.tsx`** — navegación inferior con iconos SVG minimalistas (Heroicons).
- **`SettingsPanel.tsx`** — drawer lateral izquierdo de configuración. Props: `isOpen`, `onClose`, `themeMode`, `onThemeChange`, `canInstall`, `onInstall`, `onDonate`, `onRedeem`, `membership`. Secciones: selector de tema (Sistema/Día/Noche), instalación PWA (condicional a `canInstall`), sección de apoyo (ver abajo), contacto, enlace Neomonitor, aviso legal. La sección de apoyo es condicional: si `membership.active` muestra una card verde "¡Gracias por apoyar NeoCalcu!" con tipo de plan y fecha de vencimiento; si no, muestra los botones de pago y el canje de cupón.
- **`DonationToast.tsx`** — toast de donación fijo sobre el BottomNav. Se muestra cada 5 aperturas si el usuario no tiene membresía activa. Tiene countdown de 30s y se cierra automáticamente. Props: `onDonate`, `onDismiss`, `loading`.
- **`useDonationReminder.ts`** (`src/hooks/`) — hook que maneja toda la lógica de donación y membresía. Exporta `showToast`, `dismissToast`, `handleDonate`, `handleVerify`, `handleRedeem`, `loadingPlan`, `membership`. La interfaz `MembershipInfo` (`{ active, plan, expiresAt }`) se exporta para usarla como prop en otros componentes. `membership` se recalcula automáticamente tras verificar pago o canjear cupón. Falla silenciosamente sin conexión.

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
- **Nunca usar `dark:bg-brand-950`** — usar `dark:bg-slate-800` como fondo oscuro estándar (brand-950 existe en el config pero puede tener problemas de cacheo en Vite)
- Dark mode con tres modos: **Sistema** (sigue `prefers-color-scheme`), **Día**, **Noche** — controlado desde `SettingsPanel`. El estado `themeMode: 'system'|'light'|'dark'` persiste en `localStorage`
- Header superior: ícono hamburguesa (vértice superior izquierdo) que abre `SettingsPanel` + elemento dinámico en vértice superior derecho: si la membresía está activa → badge verde con corazón "¡Gracias!" (no clickeable); si no → botón **"Apoyar"** (brand colors, ícono SVG de taza) que llama a `handleDonate()`
- Resultados de dosis en texto grande y negrita — legibilidad bedside en condiciones de luz variable
- Instrucción de enfermería siempre en un box con borde izquierdo verde — es lo que se transcribe a la indicación médica
- Warnings clínicos (contraindicaciones, incompatibilidades) en rojo/ámbar prominente
- `lightSensitive: true` en `preparation` → mostrar ícono de protección de luz en la UI
- Navegación inferior con 5 tabs (BottomNav) con iconos SVG minimalistas
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
- **Endpoints públicos:** `GET /crear-pago`, `POST /webhook`, `GET /verificar`, `GET /generar-cupon`, `GET /canjear-cupon`
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

## Dashboard admin (`neocalcu-admin`)

Herramienta externa de gestión, separada de la app. Repo: `github.com/diegoastein/neocalcu-admin`. Hosteada en Cloudflare Pages, protegida con Cloudflare Access (solo `diegosteinberg@gmail.com`).

### Secciones
- **Dashboard** — métricas en tiempo real via Worker: dispositivos totales, membresías activas (mensual/anual), cupones disponibles/usados, ingresos estimados
- **Cupones** — generar cupones individuales o en lote (hasta 50), tabla de activos/usados, copy directo
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

## Estado actual (2026-05-12, últ. actualización 2026-05-12)

**✅ Aplicación completamente funcional y en producción.**

**Medicamentos (MedicationsPage):**
- ✅ 223 medicamentos de NEOFAX 2024 (limpios, sin duplicados, en español)
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

**Calculadoras (CalculadorasPage — tab unificado):**
- ✅ **Índices clínicos**: Silverman-Andersen, Apgar, Sarnat, **Bilirrubina NICE CG98 (2023)**, Screening ROP SAP, **Finnegan Modificado (NAS)**
- ✅ **Fórmulas** (12): BSA, Clearance Cr, Aporte Calórico, Proteínas, Osmolalidad, IMC, MAP, IO, CaO₂, Balance Hidroelectrolítico, BSA simplificada, Capacidad Cilindro O₂
- ✅ Selector único con `<optgroup>` para separar índices de fórmulas
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
- ✅ `neo_donated_plan` en localStorage guarda el plan canjeado/pagado
- ✅ `MembershipInfo` (`{ active, plan, expiresAt }`) disponible en toda la app vía hook
- ✅ Falla silenciosamente sin conexión (no bloquea funciones clínicas)

**Dashboard admin (`neocalcu-admin`):**
- ✅ Hosteado en Cloudflare Pages, protegido con Cloudflare Access
- ✅ Dashboard de métricas en tiempo real (dispositivos, membresías, ingresos estimados)
- ✅ Gestión de cupones: generar individual/lote, tabla de activos/usados
- ✅ Suscriptores: lista de usuarios que pagaron con email, búsqueda local, contador activos/total
- ✅ Generador de contenido con Claude Haiku: Post (PNG 1080×1080), Reel (4 slides PNG 9:16 con labels SLIDE 1-4), Stories, WhatsApp, Release notes
- ✅ Tono rioplatense, UCIN (no NICU), prompts directos sin frases de marketing
- ✅ Banco de contenido guardado en localStorage

**Deploy:**
- ✅ GitHub Actions con Actions oficiales de Pages (configure-pages + upload-pages-artifact + deploy-pages)
- ✅ Push a `main` → deploy automático en ~1 minuto
- ✅ PWA con Service Worker offline e íconos PNG nativos (icon-192, icon-512, apple-touch-icon, favicon-32)
- ✅ Manifest con `start_url` y `scope` correctos → genera acceso directo en lanzador Android/iOS
- ✅ Google Analytics 4 integrado (ID: `G-V37SQEN7J7`) — snippet en `<head>` de `index.html`

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

### Bugs pendientes
1. **Fix dosis m² en DrugDetail** — al abrir Didanosina sigue apareciendo "1 mg/kg" (pendiente de depurar; el `isPerM2` no está bloqueando el cálculo en todos los casos)

### Funciones premium para donantes (próximamente)

La app va camino a modelo freemium. El core clínico permanece gratuito; las siguientes funciones serán exclusivas para suscriptores.

**Alta prioridad (menor esfuerzo, mayor valor bedside):**
- **Tabla de velocidades de inotrópicos** — tabla completa dosis × flujo × volumen para un peso dado. La lógica ya existe en `InotropicCalculator`; es solo UI adicional.
- **Múltiples pacientes simultáneos** — guardar 3–5 pacientes con nombre/cama y alternar. Requiere refactorizar `PatientContext` para soportar array.
- **Exportar cálculo como texto** — copiar al portapapeles un resumen listo para indicación médica (paciente, peso, droga, dosis, instrucción de enfermería).

**Media prioridad:**
- **Curvas de crecimiento Fenton 2013** — plotear peso/talla/PC por semana gestacional con percentil calculado. Completamente offline.
- **Calculadora de Nutrición Parenteral completa** — VIG, proteínas g/kg/día, lípidos, volumen total. Más completa que el "Aporte Calórico" actual.
- **Fichas completas de medicamentos** — diluciones, estabilidad, reconstitución y compatibilidades IV. Solo para donantes.

**Largo plazo:**
- **Historial de cálculos** — últimos N cálculos con fecha y peso.
- **Notas personales** — notas libres en medicamentos/procedimientos (ej: protocolo local del servicio).
- **Temas de color adicionales** — incentivo freemium clásico.
