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

`docs/clinical_knowledge.json` contiene todas las drogas, procedimientos, índices clínicos y fórmulas. Este archivo es **importado estáticamente** en la capa de datos de TypeScript; jamás se fetchea en runtime. Al modificar datos clínicos, siempre editar este JSON.

Estructura del JSON:
```
drugs[]        → medicamentos con dosingRules[], infusionRules[] y/o inotropicConfig
procedures[]   → procedimientos con formulas[] y steps[]
scores[]       → escalas clínicas con items[] e interpretation[]
formulas[]     → calculadoras médicas (BSA, clearance, etc.)
```

### Tipos

`src/types/index.ts` define todas las interfaces compartidas. Las más importantes:

- **`Patient`** — `{ weightGrams, gestAgeWeeks?, dayOfLife? }` — datos del paciente actuales
- **`Drug`** — puede tener `dosingRules` (bolos/intervalos), `infusionRules` (infusiones), y/o `inotropicConfig` (calculador inotrópico interactivo)
- **`DosingRule`** — filtra por `gaMin/gaMax`, `dolMin/dolMax`, `weightMinG/weightMaxG` para llegar a la dosis correcta
- **`InfusionRule`** — incluye `ruleOf3` con `multiplier` y `volumeMl` para calcular la "regla de 3" bedside
- **`InotropicConfig`** — configuración del calculador interactivo: rangos de dosis, flujo, volúmenes disponibles
- **`Procedure`** — procedimientos con fórmulas y pasos paso-a-paso
- **`Score`** — escalas clínicas con items evaluables e interpretación por rango de puntuación
- **`Formula`** — calculadoras médicas con inputs dinámicos y evaluación de fórmulas

### Capa de datos (`src/data/`)

Los archivos de datos importan el JSON y re-exportan arrays tipados:
- `medications.ts` → exporta `drugs: Drug[]` y función `searchDrugs(query)`
- `procedures.ts` → exporta `procedures: Procedure[]`
- `scores.ts` → exporta `scores: Score[]`
- `formulas.ts` → exporta `formulas: Formula[]`

Las funciones de cálculo de dosis viven en `src/utils/calculations.ts`:
- `matchDosingRule(rules, patient)` — devuelve la primera regla que cumple todos los matchers
- `calcDose(rule, weightGrams)` — devuelve `{ doseTotal, volumeMl, nursingInstruction }`
- `calcRuleOf3(infusionRule, weightKg)` — devuelve preparación y velocidad para infusiones continuas

### Contextos globales (`src/context/`)

- **`PatientContext.tsx`** — provee `patient` y `setPatient` a toda la app. Peso, E.G. (edad gestacional), Días persisten en `sessionStorage`
- **`FavoritesContext.tsx`** — maneja marcadores (favoritos) de medicamentos, procedimientos y fórmulas. Persiste en `localStorage`

### Componentes clave

- **`DrugDetail.tsx`** — modal de detalle de medicamento. Si el drug tiene `inotropicConfig`, muestra `InotropicCalculator` en lugar de la sección de dosificación estándar.
- **`InotropicCalculator.tsx`** — calculador interactivo para inotrópicos: slider de dosis, selector de flujo (+/−), toggle de volumen (12/24/50 mL). Fórmula: `mg = dosis × peso × volumen × 60 / (flujo × 1000)`.
- **`BottomNav.tsx`** — navegación inferior con iconos SVG minimalistas (Heroicons).

### Páginas y navegación

5 páginas sin router externo — la navegación es un simple `useState<ActivePage>` en `App.tsx`:

| `ActivePage`      | Página                | Contenido principal                                                     |
|-------------------|-----------------------|-------------------------------------------------------------------------|
| `medicamentos`    | `MedicationsPage`     | Buscador + calculadora de dosis por peso + botón favoritos              |
| `procedimientos`  | `ProceduresPage`      | 23 procedimientos con fórmulas interactivas + pasos                     |
| `indices`         | `ScoresPage`          | Silverman-Andersen, Apgar, Sarnat interactivos + botón favoritos        |
| `formulas`        | `FormulasPage`        | 11 calculadoras médicas + botón favoritos                               |
| `favoritos`       | `FavoritesPage`       | Listado de todos los items marcados como favoritos                      |

La barra de navegación inferior (`BottomNav`) es el único mecanismo de routing. Usa iconos SVG (no emojis).

### PWA / Offline

`vite.config.ts` configura `vite-plugin-pwa` con Workbox. El service worker precachea **todos** los assets (JS, CSS, HTML, JSON, SVG). No hay runtime caching — todo debe estar en el bundle. Para agregar datos nuevos, siempre agregarlos al JSON o importarlos estáticamente.

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

Para drogas con `inotropicConfig`, la UI muestra `InotropicCalculator` en lugar de la dosificación estándar. El usuario elige dosis, flujo y volumen; la app calcula los mg a preparar:

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
  "defaultFlow": 1,
  "volumes": [12, 24, 50],
  "defaultVolume": 50,
  "diluent": "D5% o SF 0.9%",
  "unit": "mcg/kg/min"
}
```

### Fórmulas con múltiples resultados (`calculations`)

Algunas fórmulas (Balance Hidroelectrolítico) definen un objeto `calculations` con fórmulas dependientes. El orden de evaluación es fijo y los resultados intermedios se acumulan en `variables` antes de calcular los derivados. Variables con números en el nombre (ingreso1, ingreso2) requieren el regex `/\b([a-z_][a-z0-9_]*)\b/g`.

## Convenciones de UI

- Colores `brand-*` (verde esmeralda: `#065f46` a `#ecfdf5`) como color primario; usar variantes del objeto `brand` en `tailwind.config.js`
- Dark mode completo con toggle 🌙/☀️ en header superior
- Resultados de dosis en texto grande y negrita — legibilidad bedside en condiciones de luz variable
- Instrucción de enfermería siempre en un box con borde izquierdo verde — es lo que se transcribe a la indicación médica
- Warnings clínicos (contraindicaciones, incompatibilidades) en rojo/ámbar prominente
- `lightSensitive: true` en `preparation` → mostrar ícono de protección de luz en la UI
- Navegación inferior con 5 tabs (BottomNav) con iconos SVG minimalistas
- Medicamentos agrupados por categoría con headers no pegajosos

## Estado actual (2026-05-01)

**✅ Aplicación completamente funcional y en producción.**

**Medicamentos (MedicationsPage):**
- ✅ 239+ medicamentos de NEOFAX 2024
- ✅ Buscador por nombre, genérico, indicaciones
- ✅ Agrupados por categoría
- ✅ Filtrado automático por peso, E.G., Días de vida
- ✅ Modal con calculadora de dosis
- ✅ **Calculador inotrópico interactivo** para Dopamina, Dobutamina, Adrenalina, Milrinona, Norepinefrina

**Procedimientos (ProceduresPage):**
- ✅ **23 procedimientos** (5 originales + 18 nuevos):
  - Vías/accesos: Punción Lumbar, Toracocentesis, Paracentesis, Acceso Intraóseo
  - Vía aérea: Surfactante, VM Convencional (inicio), CPAP Nasal, Cricotiroidotomía
  - Cardiovascular: Pericardiocentesis, RCP Neonatal
  - Nutrición: Nutrición Parenteral
  - Bilirrubina: Fototerapia Intensiva, Exanguinotransfusión Parcial, Exanguinotransfusión Doble Volumen
  - Metabólico/urgencias: Hipoglucemia, Hiperkalemia, Acidosis Metabólica, Hipotermia Terapéutica
- ✅ Fórmulas interactivas con cálculo en tiempo real
- ✅ Pasos, materiales, advertencias y referencias

**Índices Clínicos (ScoresPage):**
- ✅ Silverman-Andersen, Apgar, Sarnat — interactivos con interpretación por severidad

**Fórmulas (FormulasPage):**
- ✅ 11 calculadoras: BSA, Clearance Cr, Aporte Calórico, Proteínas, Osmolalidad, IMC, MAP, IO, CDO₂, Balance Hidroelectrolítico, BSA simplificada
- ✅ MAP usa FR (rpm) en lugar de Ttotal — fórmula: `(pip - peep) × (ti × fr / 60) + peep`
- ✅ Balance Hidroelectrolítico con cálculos dependientes en orden fijo

**Deploy:**
- ✅ GitHub Actions con Actions oficiales de Pages (configure-pages + upload-pages-artifact + deploy-pages)
- ✅ Push a `main` → deploy automático en ~1 minuto
- ✅ PWA con Service Worker offline

## Agregar un medicamento nuevo

1. Agregar el objeto en `docs/clinical_knowledge.json` → array `drugs[]`, respetando la interfaz `Drug`
2. Si es inotrópico: agregar `inotropicConfig` con rangos de dosis apropiados
3. Si usa regla de 3: agregar `infusionRules` con `ruleOf3.multiplier` correcto
4. Si es bolo: agregar `dosingRules` de más restrictiva a menos restrictiva
5. La UI lo muestra automáticamente — no se necesita código adicional

## Próximas tareas / Mejoras futuras

1. **Enriquecer medicamentos** — expandir estructura simplificada
   - Agregar `preparation` detallada (diluciones, estabilidad, reconstitución)
   - Agregar `administration` (routes, iv rates, incompatibilities)
   - Agregar `monitoring` y `contraindications`

2. **Exportación de datos** — generar PDF con cálculos para impresión/documentación

3. **Historial de pacientes** — almacenamiento de cálculos recientes (opcional)

4. **Tabla de velocidades para inotrópicos** — mostrar tabla de dosis vs. flujo para todas las combinaciones posibles
