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

- **`DrugDetail.tsx`** — modal de medicamento; si hay `inotropicConfig`, renderiza `InotropicCalculator` en lugar de la dosificación estándar.
- **`InotropicCalculator.tsx`** — sliders dosis/flujo + toggle volumen. Fórmula: `mg = dosis × peso × volumen × 60 / (flujo × 1000)`. Premium: tabla de velocidades expandible.
- **`PatientInput.tsx`** — barra sticky colapsable. Autofocus al campo peso cuando no hay peso y `anyModalOpen = false` (via `UIContext`). Premium: tabs multi-paciente (hasta 4).
- **`BilirubinCalculator.tsx`** — umbrales fototerapia/exanguino NICE CG98 2023. ≥38s: valores exactos; 35-37s: escalados con fórmula NICE.
- **`ROPCalculator.tsx`** — screening ROP SAP 2021; calcula fecha del primer examen.
- **`FinnceganCalculator.tsx`** — NAS, 22 ítems en 3 secciones, puntaje en tiempo real; verde/ámbar/rojo (0–7 / 8–12 / ≥13).
- **`SubscriptionModal.tsx`** — dos pasos: región → pago. AR: MercadoPago. Internacional: links Takenos (constante `TAKENOS`) + aviso DM Instagram. Props: `onClose`, `onArgentina(plan)`, `loadingPlan`.
- **`SettingsPanel.tsx`** — drawer lateral izquierdo. Sección apoyo condicional: card verde (membresía activa) o botón → SubscriptionModal.
- **`DonationToast.tsx`** — toast fijo sobre BottomNav, countdown 30s, visible cada 3 aperturas sin membresía.
- **`EmailCaptureModal.tsx`** — aparece tras primer pago/cupón hasta registrar email. Backdrop no cierra. Setea `neo_email_registered='1'` al guardar.
- **`PremiumFeaturesSheet.tsx`** — bottom sheet al abrir la app (600ms delay) si sin membresía; CTA → SubscriptionModal.
- **`ProcedureNotes.tsx`** — notas libres por procedimiento; `localStorage neo_procedure_notes`; premium gate.
- **`ShareResultButton.tsx`** — Web Share API + fallback clipboard; feedback 2s; premium gate.
- **`useDonationReminder.ts`** — lógica central de membresía. Con membresía en localStorage → no llama worker. Sin membresía → llama en cada apertura para restaurar automáticamente si el `device_id` sigue en KV.
- **`PromoResidenciasOverlay.tsx`** — badge ámbar parpadeante + overlay modal para promos. Reutilizable: ajustar `EXPIRY` y texto. Visible para todos.
- **`BottomNav.tsx`** — navegación inferior, 5 tabs, iconos SVG.

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

Buscador cross-categoría: el input filtra simultáneamente en todos los parámetros (`name` y `abbreviation`). Sin búsqueda activa, muestra todas las categorías como acordeones colapsables (**todas cerradas por defecto**). Al escribir, se expanden todas las categorías con matches y se ocultan las vacías.

**85 parámetros en 12 categorías (gratuitas):**
- Gasometría, Hemograma, Electrolitos, Química básica, Función hepática, Coagulación, Infección/Inflamación, Función tiroidea, LCR (originales)
- **Análisis de orina**: densidad, pH, proteinuria, hematuria, leucocituria, nitritos, Na urinario, relación Pr/Cr
- **Marcadores cardíacos**: Troponina I, NT-proBNP, CK-MB
- **Metabólico/Endócrino**: insulina, cortisol, ACTH, 17-OHP

Fuentes: Hospital Garrahan (primaria), Harriet Lane 23ª ed., Gomella 8ª ed., COBICO Argentina.

**Gate premium en laboratorio:** las categorías premium son visibles pero bloqueadas — se muestran con candado y al tocarlas aparece el bloque "Suscriptores". Todas las categorías premium incluyen un disclaimer de texto:
- Laboratorio: *"Los valores son orientativos y pueden diferir según la institución y el método de laboratorio utilizado."*
- Bacteriología: *"Los gérmenes prevalentes y los patrones de resistencia antibiótica pueden variar según la epidemiología de cada institución."*

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
- Header superior: ícono hamburguesa (vértice superior izquierdo) que abre `SettingsPanel` + **zona central de avisos** (opcional, `PromoHeaderBadge` cuando hay promo activa) + elemento dinámico en vértice superior derecho: si la membresía está activa → badge verde con corazón "¡Gracias!" (no clickeable); si no → botón **"Suscripción"** (brand colors, ícono SVG de taza) que abre `SubscriptionModal`
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
2. Botón "Suscripción" (header) o toast (cada 3 aperturas) → abre `SubscriptionModal`
3. **Argentina:** modal → llama al Worker → crea preferencia de pago en MercadoPago → usuario paga → webhook al Worker → Worker guarda `device_id` en KV → app vuelve con `?paid=1` → verifica → suprime toast 30 días
4. **Internacional (Takenos):** modal → link en nueva pestaña → usuario paga → DM por Instagram con comprobante → activación manual con cupón generado desde el admin

### Gateways de pago
- **Argentina:** MercadoPago Checkout Pro (automatizado con webhook)
- **Internacional:** Takenos — links hardcodeados en `SubscriptionModal.tsx`. Mensual USD 3, Anual USD 30. Activación manual: el usuario paga → DM por Instagram → se genera y envía un cupón desde el admin

### Worker (`worker/`)
- Deployado en Cloudflare Workers: `https://neocalcu-donations.diegosteinberg.workers.dev`
- **Endpoints públicos:** `GET /crear-pago`, `POST /webhook`, `GET /verificar`, `GET /generar-cupon`, `GET /canjear-cupon` (devuelve `email` si el cupón lo tenía asignado), `GET /recuperar`, `GET /registrar-email`
- **Endpoints admin** (requieren `ADMIN_SECRET`): `GET /admin/stats`, `GET /admin/coupons`, `POST /admin/generar-cupon`, `GET /admin/subscribers`, `POST /admin/generar-contenido`
- Secrets configurados en Cloudflare: `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `ADMIN_SECRET`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`
- KV namespace: `DONATIONS_KV` (id: `594254b8fb874cea90ae91bb21fa52ad`)
- CORS: endpoints públicos permiten `https://diegoastein.github.io` + localhost; endpoints admin permiten `*` (protegidos por secret)
- Para redesployar: `CLOUDFLARE_API_TOKEN=... npx wrangler deploy --cwd worker`

### Emails automáticos (Resend)
Todos los emails se envían desde `info@neomonitor.pro` vía Resend. Aplican tanto a suscriptores pagos como a usuarios con cupón.

**Mail de bienvenida** (`sendWelcomeEmail`) — se envía en tres situaciones:
1. Webhook de MercadoPago confirma pago aprobado
2. Canje de cupón que tiene email asignado
3. Suscriptor activo registra su email desde la app (`/registrar-email`)

Incluye: tipo de plan, fecha de vencimiento, lista completa de funciones premium y aviso de que las funciones futuras también estarán incluidas.

**Recordatorio de renovación** (`sendRenewalReminderEmail`) — cron diario a las 12:00 UTC (9:00 AM Argentina). Revisa todos los suscriptores con email registrado y envía el recordatorio a los que vencen en las próximas 72–96 horas. Anti-duplicado: guarda clave `reminder:{email}:{ts}` en KV con TTL de 7 días para no enviar dos veces por ciclo.

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

Repo separado (`github.com/diegoastein/neocalcu-admin`), Cloudflare Pages, protegido con Cloudflare Access. No se toca desde este repo.


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

**Patrón de teaser:** las features premium deben aparecer al **tope de su listado** para no suscriptores (badge "Pro" + card outline con candado que abre el gate al tocarlo). Al agregar una feature premium nueva, ordenar el array de display con `sort((a, b) => !isPremium ? (b.isPremium ? 1 : 0) - (a.isPremium ? 1 : 0) : 0)`.

#### Features implementadas (disponibles para suscriptores activos)

| Feature | Componente / Ubicación | Tab |
|---|---|---|
| **Kit del Paciente Crítico** | `AdmissionSummary.tsx` + score `admision_neonatal` | Calculadoras |
| **Tabla de velocidades de inotrópicos** | `InotropicCalculator.tsx` — sección expandible | Medicamentos (modal) |
| **Hasta 4 pacientes simultáneos** | `PatientInput.tsx` — tabs multi-paciente | Global (header) |
| **Exportar / compartir resultados** | `ShareResultButton.tsx` | Calculadoras / Procedimientos |
| **Notas en procedimientos** | `ProcedureNotes.tsx` | Procedimientos |
| **Nutrición Parenteral Total** | `NutricionParenteralCalculator.tsx` + fórmula `npt_calculator` | Calculadoras → Fórmulas |
| **Bacteriología clínica** | Categoría `bacteriologia` en `laboratory[]` (JSON) | Laboratorio |
| **Historial de cálculos** | `useCalculationHistory.ts` + UI en `MedicationsPage` | Medicamentos |
| **INTERGROWTH-21st completo** | `IntergrowthCalculator.tsx` + score `intergrowth_clasificador` — peso, longitud y PC con percentil + z-score + PEG/AEG/GEG (24–42s, por sexo). Fuente: gigs R package (ropensci). Incluye ShareResultButton. | Calculadoras → Índices |

#### Pendiente / Próximas sesiones
- **Expansión de laboratorio premium** — 6 nuevas categorías. Ver memoria `project_laboratorio_premium.md`:
  - Hormonas eje somatotrófico y mineral (IGF-1, PTH, vitamina D, aldosterona)
  - Hormonas gonadal / DSD — mini-pubertad (LH, FSH, testosterona, estradiol, AMH)
  - Química analítica ampliada (cistatina C, prealbúmina, alfa-1 antitripsina, piruvato, galactosa)
  - Niveles terapéuticos (fenobarbital, fenitoína, levetiracetam, cafeína, aminoglucósidos, vancomicina, digoxina)
- **Fichas completas de medicamentos** — diluciones, estabilidad, reconstitución y compatibilidades IV.
- **Temas de color adicionales** — incentivo freemium clásico.

### Analytics (GA4)

`src/utils/analytics.ts` exporta `trackEvent()`. Con `?debug=1` en la URL no envía nada a GA4. Eventos activos: `search_drug`, `open_drug`, `calculate_dose`, `open_procedure`, `select_calculator`, `tab_switch`, `view_inotropic_calculator`, `share_result`, `favorite_added`, `click_apoyar`, `payment_started`, `payment_success`, `coupon_redeemed`, `pwa_installed`, `pwa_install_prompt`.

### Google Play Store
Ver `docs/ROADMAP_PLAYSTORE.md`. Publicar gratis sin flujo de pago interno (MercadoPago viola política de Google); suscriptores se desbloquean vía `device_id`.
