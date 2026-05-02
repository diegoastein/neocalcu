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
- **`Score`** — escalas clínicas; puede tener `bilirubinCalculator: true` o `ropCalculator: true` para activar componentes especiales
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
- **`BilirubinCalculator.tsx`** — calculadora de umbrales de fototerapia y exanguinotransfusión según AAP 2022. Interpolación por horas de vida, ajuste por EG y factores de riesgo.
- **`ROPCalculator.tsx`** — guía de screening ROP según SAP 2021. Criterio obligatorio (EG ≤32s o PN ≤1500g) y condicional (33–36s con factores de riesgo). Calcula fecha del primer examen.
- **`BottomNav.tsx`** — navegación inferior con iconos SVG minimalistas (Heroicons).

### Páginas y navegación

5 páginas sin router externo — la navegación es un simple `useState<ActivePage>` en `App.tsx`:

| `ActivePage`      | Página                | Contenido principal                                                                    |
|-------------------|-----------------------|----------------------------------------------------------------------------------------|
| `medicamentos`    | `MedicationsPage`     | Buscador + calculadora de dosis por peso + botón favoritos                             |
| `procedimientos`  | `ProceduresPage`      | 24 procedimientos con fórmulas interactivas + pasos                                    |
| `calculadoras`    | `CalculadorasPage`    | Índices clínicos + Fórmulas en un único selector con optgroups                         |
| `laboratorio`     | `LaboratoryPage`      | Valores de referencia neonatal por categoría (9 categorías, fuente Garrahan)           |
| `favoritos`       | `FavoritesPage`       | Listado de todos los items marcados como favoritos (drugs, procedures, scores, formulas)|

La barra de navegación inferior (`BottomNav`) es el único mecanismo de routing. Usa iconos SVG (no emojis).

#### Tab Calculadoras (`CalculadorasPage`)

Unifica `ScoresPage` y `FormulasPage` en una sola vista. El `<select>` usa `<optgroup>` para separar "Índices clínicos" de "Fórmulas". El estado interno (`selectedType: 'score' | 'formula'`) determina qué lógica de renderizado usar. Incluye `PatientInput` siempre visible para auto-rellenar el peso.

Calculadoras especiales activadas por flags en el tipo `Score`:
- `bilirubinCalculator: true` → renderiza `BilirubinCalculator`
- `ropCalculator: true` → renderiza `ROPCalculator`

#### Tab Laboratorio (`LaboratoryPage`)

Muestra valores de referencia neonatal organizados en 9 categorías con pills deslizables horizontales. Cada parámetro es expandible para ver rangos estratificados (por EG/edad postnatal), valores críticos y notas clínicas. Nota especial destacada para el pico fisiológico de PCT (0–72h hasta 21 ng/mL).

Fuentes: Hospital Garrahan (primaria), Harriet Lane 23ª ed., Gomella 8ª ed., COBICO Argentina (coagulación).

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
- Dark mode completo con toggle 🌙/☀️ en header superior
- Resultados de dosis en texto grande y negrita — legibilidad bedside en condiciones de luz variable
- Instrucción de enfermería siempre en un box con borde izquierdo verde — es lo que se transcribe a la indicación médica
- Warnings clínicos (contraindicaciones, incompatibilidades) en rojo/ámbar prominente
- `lightSensitive: true` en `preparation` → mostrar ícono de protección de luz en la UI
- Navegación inferior con 5 tabs (BottomNav) con iconos SVG minimalistas
- Medicamentos agrupados por categoría con headers no pegajosos

## Estado actual (2026-05-02)

**✅ Aplicación completamente funcional y en producción.**

**Medicamentos (MedicationsPage):**
- ✅ 223 medicamentos de NEOFAX 2024 (limpios, sin duplicados, en español)
- ✅ Buscador por nombre, genérico, indicaciones
- ✅ Agrupados por categoría
- ✅ Filtrado automático por peso, E.G., Días de vida
- ✅ Modal con calculadora de dosis
- ✅ **Calculador inotrópico interactivo** (sliders) para Dopamina, Dobutamina, Adrenalina, Milrinona, Norepinefrina

**Procedimientos (ProceduresPage):**
- ✅ **24 procedimientos**:
  - Vías/accesos: Punción Lumbar, Toracocentesis, Paracentesis, Acceso Intraóseo
  - Vía aérea: Surfactante, VM Convencional (inicio), CPAP Nasal, Cricotiroidotomía
  - Cardiovascular: Pericardiocentesis, RCP Neonatal
  - Nutrición: Nutrición Parenteral
  - Bilirrubina: Fototerapia Intensiva, Exanguinotransfusión Parcial, Exanguinotransfusión Doble Volumen
  - Metabólico/urgencias: Hipoglucemia, Hiperkalemia, Acidosis Metabólica, Hipotermia Terapéutica
  - Transporte: Transporte Neonatal
- ✅ Fórmulas interactivas con cálculo en tiempo real
- ✅ Pasos, materiales, advertencias y referencias

**Calculadoras (CalculadorasPage — tab unificado):**
- ✅ **Índices clínicos**: Silverman-Andersen, Apgar, Sarnat, Bilirrubina AAP 2022, Screening ROP SAP
- ✅ **Fórmulas** (12): BSA, Clearance Cr, Aporte Calórico, Proteínas, Osmolalidad, IMC, MAP, IO, CaO₂, Balance Hidroelectrolítico, BSA simplificada, Capacidad Cilindro O₂
- ✅ Selector único con `<optgroup>` para separar índices de fórmulas
- ✅ PatientInput siempre visible para auto-rellenar peso

**Laboratorio (LaboratoryPage):**
- ✅ **9 categorías**: Gasometría, Hemograma, Electrolitos, Química básica, Función hepática, Coagulación, Infección/Inflamación, Función tiroidea, LCR
- ✅ Parámetros estratificados por EG y edad postnatal
- ✅ Valores críticos marcados (criticalLow / criticalHigh)
- ✅ Nota especial sobre pico fisiológico de PCT (0–72h hasta 21 ng/mL)
- ✅ Fuente primaria: Hospital Garrahan; complementado con Harriet Lane, Gomella, COBICO Argentina

**Deploy:**
- ✅ GitHub Actions con Actions oficiales de Pages (configure-pages + upload-pages-artifact + deploy-pages)
- ✅ Push a `main` → deploy automático en ~1 minuto
- ✅ PWA con Service Worker offline

## Agregar un medicamento nuevo

1. Agregar el objeto en `docs/clinical_knowledge.json` → array `drugs[]`, respetando la interfaz `Drug`
2. Si es inotrópico: agregar `inotropicConfig` con rangos de dosis y flujo apropiados
3. Si usa regla de 3: agregar `infusionRules` con `ruleOf3.multiplier` correcto
4. Si es bolo: agregar `dosingRules` de más restrictiva a menos restrictiva
5. La UI lo muestra automáticamente — no se necesita código adicional

## Agregar valores de laboratorio

1. Editar `docs/clinical_knowledge.json` → array `laboratory[]`
2. Cada categoría tiene `id`, `name`, `source` y `parameters[]`
3. Cada parámetro tiene `id`, `name`, `abbreviation?`, `unit`, `references[]`, `notes?`, `criticalLow?`, `criticalHigh?`
4. Cada referencia tiene `label`, `min?`, `max?`, `notes?`
5. `src/data/laboratory.ts` re-exporta automáticamente — no se necesita código adicional

## Próximas tareas / Mejoras futuras

1. **Enriquecer medicamentos** — expandir estructura simplificada
   - Agregar `preparation` detallada (diluciones, estabilidad, reconstitución)
   - Agregar `administration` (routes, iv rates, incompatibilities)
   - Agregar `monitoring` y `contraindications`

2. **Exportación de datos** — generar PDF con cálculos para impresión/documentación

3. **Historial de pacientes** — almacenamiento de cálculos recientes (opcional)

4. **Tabla de velocidades para inotrópicos** — mostrar tabla de dosis vs. flujo para todas las combinaciones posibles
