# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # instalar dependencias (primera vez)
npm run dev          # servidor de desarrollo en localhost:5173
npm run build        # tsc + vite build → dist/
npm run preview      # previsualizar el build de producción
```

No hay tests automatizados por ahora. La validación es visual: abrir el navegador, ingresar un peso y verificar que dosis, volúmenes y preparaciones se calculen correctamente.

## Contexto del proyecto

**NeoCalcu** es una PWA (Progressive Web App) de uso clínico bedside para neonatología. Funciona **100 % offline** — no hay backend ni fetch en tiempo de ejecución. Toda la lógica y los datos clínicos se empaquetan en el bundle de Vite.

Stack: **Vite + React 18 + TypeScript + Tailwind CSS v3 + vite-plugin-pwa** (Workbox).

## Arquitectura

### Datos clínicos — fuente de verdad

`docs/clinical_knowledge.json` contiene todas las drogas, procedimientos e índices clínicos. Este archivo es **importado estáticamente** en la capa de datos de TypeScript; jamás se fetchea en runtime. Al modificar datos clínicos, siempre editar este JSON.

Estructura del JSON:
```
drugs[]        → medicamentos con dosingRules[] o infusionRules[]
procedures[]   → procedimientos con formulas[] y steps[]
scores[]       → escalas clínicas con items[] e interpretation[]
```

### Tipos

`src/types/index.ts` define todas las interfaces compartidas. Las más importantes:

- **`Patient`** — `{ weightGrams, gestAgeWeeks?, dayOfLife? }` — datos del paciente actuales
- **`Drug`** — puede tener `dosingRules` (bolos/intervalos) **o** `infusionRules` (infusiones continuas), o ambos
- **`DosingRule`** — filtra por `gaMin/gaMax`, `dolMin/dolMax`, `weightMinG/weightMaxG` para llegar a la dosis correcta
- **`InfusionRule`** — incluye `ruleOf3` con `multiplier` y `volumeMl` para calcular la "regla de 3" bedside
- **`Procedure`** — las fórmulas son strings descriptivos; el cálculo real se implementa en el componente
- **`Score`** — cada item tiene values con score 0/1/2; interpretation mapea rangos a colores y acciones

### Capa de datos (`src/data/`)

Los archivos de datos importan el JSON y re-exportan arrays tipados:
- `medications.ts` → `import data from '../../docs/clinical_knowledge.json'` → exporta `drugs: Drug[]`
- `procedures.ts` → exporta `procedures: Procedure[]`
- `scores.ts` → exporta `scores: Score[]`

Las funciones de cálculo de dosis viven en `src/utils/calculations.ts`:
- `matchDosingRule(rules, patient)` — devuelve la primera regla que cumple todos los matchers
- `calcDose(rule, weightGrams)` — devuelve `{ doseTotal, volumeMl, nursingInstruction }`
- `calcRuleOf3(infusionRule, weightKg)` — devuelve preparación y velocidad para infusiones continuas

### Contexto global (`src/context/PatientContext.tsx`)

`PatientContext` provee `patient: Patient` y `setPatient` a toda la app. El peso persiste en `sessionStorage` para sobrevivir navegación entre tabs sin necesidad de re-ingresar.

### Páginas y navegación

Tres páginas sin router externo — la navegación es un simple `useState<ActivePage>` en `App.tsx`:

| `ActivePage`      | Página                | Contenido principal                                      |
|-------------------|-----------------------|----------------------------------------------------------|
| `medicamentos`    | `MedicationsPage`     | Buscador + calculadora de dosis por peso                 |
| `procedimientos`  | `ProceduresPage`      | Fórmulas (CAU, CVU, TET, fluidos) + pasos del procedimiento |
| `indices`         | `ScoresPage`          | Silverman-Andersen, Apgar interactivos                   |

La barra de navegación inferior (`BottomNav`) es el único mecanismo de routing.

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

Para adrenalina (multiplier=0.3):
```
mgPreparar = 0.3 × pesoKg en 50 mL
→ 1 mL/h = 0.1 mcg/kg/min
```

Velocidad para dosis específica:
```
velocidad (mL/h) = dosis (mcg/kg/min) × pesoKg × 60 / concentración (mcg/mL)
```

## Convenciones de UI

- Colores `brand-800` (`#1e3a8a`) como color primario; usar variantes del objeto `brand` en `tailwind.config.js`
- Resultados de dosis en texto grande y negrita — legibilidad bedside en condiciones de luz variable
- Instrucción de enfermería siempre en un box resaltado (borde izquierdo azul) — es lo que se transcribe a la indicación médica
- Warnings clínicos (contraindicaciones, incompatibilidades) en rojo/ámbar prominente
- `lightSensitive: true` en `preparation` → mostrar ícono de protección de luz en la UI

## Estado actual

**Esqueleto React implementado:**
- ✅ `src/App.tsx` — navegación 3 páginas (medicamentos, procedimientos, índices)
- ✅ `src/main.tsx` — entry point React
- ✅ `src/index.css` — Tailwind imports
- ✅ `src/context/PatientContext.tsx` — gestión global de paciente (peso, GA, DOL) + sessionStorage
- ✅ `src/pages/` — 3 páginas stub (MedicationsPage, ProceduresPage, ScoresPage)
- ✅ `src/components/BottomNav.tsx` — navegación inferior con tabs
- ✅ `src/data/` — importadores de datos (medications.ts, procedures.ts, scores.ts)
- ✅ `src/utils/calculations.ts` — funciones de dosificación (matchDosingRule, calcDose, calcRuleOf3, calcInfusionVelocity)

**Dev server corriendo:** `npm run dev` → localhost:5173

## Agregar un medicamento nuevo

1. Agregar el objeto en `docs/clinical_knowledge.json` → array `drugs[]`, respetando la interfaz `Drug`
2. Si usa regla de 3, agregar `infusionRules` con `ruleOf3.multiplier` correcto
3. Si es bolo, agregar `dosingRules` ordenadas de más restrictiva (prematuros extremos) a menos restrictiva (término)
4. La UI lo muestra automáticamente — no se necesita código adicional

## Próximas tareas

1. **PatientInput** — componente reutilizable para ingreso de peso, GA, DOL (sessionStorage)
2. **MedicationsPage completa** — buscador + vista de detalles + calculadora de dosis
3. **ProceduresPage** — fórmulas (CAU, CVU, TET, fluidos)
4. **ScoresPage** — Silverman-Andersen, Apgar
