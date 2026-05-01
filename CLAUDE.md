# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Flujo de trabajo Git

**Ramas principales:**
- `main` — producción (GitHub Pages)
- `beta` — testing

**Flujo de desarrollo:**
1. Desarrollar y probar en `localhost:5173` (`npm run dev`)
2. Commits diarios manteniendo el historial limpio
3. Una vez validado → push a `beta`
4. Testing en `beta` (previsualizar con `npm run build`)
5. Si está OK → merge a `main` (automáticamente en GitHub Pages)

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

`docs/clinical_knowledge.json` contiene todas las drogas, procedimientos, índices clínicos y fórmulas. Este archivo es **importado estáticamente** en la capa de datos de TypeScript; jamás se fetchea en runtime. Al modificar datos clínicos, siempre editar este JSON.

Estructura del JSON:
```
drugs[]        → medicamentos con dosingRules[] o infusionRules[]
procedures[]   → procedimientos con formulas[] y steps[]
scores[]       → escalas clínicas con items[] e interpretation[]
formulas[]     → calculadoras médicas (BSA, clearance, etc.)
```

### Tipos

`src/types/index.ts` define todas las interfaces compartidas. Las más importantes:

- **`Patient`** — `{ weightGrams, gestAgeWeeks?, dayOfLife? }` — datos del paciente actuales
- **`Drug`** — puede tener `dosingRules` (bolos/intervalos) **o** `infusionRules` (infusiones continuas), o ambos
- **`DosingRule`** — filtra por `gaMin/gaMax`, `dolMin/dolMax`, `weightMinG/weightMaxG` para llegar a la dosis correcta
- **`InfusionRule`** — incluye `ruleOf3` con `multiplier` y `volumeMl` para calcular la "regla de 3" bedside
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

### Páginas y navegación

5 páginas sin router externo — la navegación es un simple `useState<ActivePage>` en `App.tsx`:

| `ActivePage`      | Página                | Contenido principal                                      |
|-------------------|-----------------------|----------------------------------------------------------|
| `medicamentos`    | `MedicationsPage`     | Buscador + calculadora de dosis por peso + botón favoritos |
| `procedimientos`  | `ProceduresPage`      | Procedimientos (CAU, CVU, TET, Fluidos, VIG) con fórmulas + pasos |
| `indices`         | `ScoresPage`          | Silverman-Andersen, Apgar, Sarnat interactivos + botón favoritos |
| `formulas`        | `FormulasPage`        | 7 calculadoras (BSA, Clearance, Osmolalidad, etc.) + botón favoritos |
| `favoritos`       | `FavoritesPage`       | Listado de todos los items marcados como favoritos       |

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

- Colores `brand-*` (verde esmeralda: `#065f46` a `#ecfdf5`) como color primario; usar variantes del objeto `brand` en `tailwind.config.js`
- Dark mode completo con toggle 🌙/☀️ en header superior
- Resultados de dosis en texto grande y negrita — legibilidad bedside en condiciones de luz variable
- Instrucción de enfermería siempre en un box resaltado (borde izquierdo verde) — es lo que se transcribe a la indicación médica
- Warnings clínicos (contraindicaciones, incompatibilidades) en rojo/ámbar prominente
- `lightSensitive: true` en `preparation` → mostrar ícono de protección de luz en la UI
- Navegación inferior con 5 tabs (Medicamentos, Procedimientos, Índices, Fórmulas, Favoritos)
- Medicamentos agrupados por categoría con headers no pegajosos

## Estado actual (2026-05-01 - Implementación completa + Rediseño visual + Deploy GitHub Pages + Balance Hidroelectrolítico funcional)

**✅ Aplicación completamente funcional y en producción:**

**Medicamentos (MedicationsPage):**
- ✅ **239 medicamentos agregados** de NEOFAX 2024 (26 originales + 213 expandidos)
- ✅ Buscador por nombre, genérico, indicaciones
- ✅ **Medicamentos agrupados por categoría** (Antibióticos, Cardiovascular, Diuréticos, etc.)
- ✅ Filtrado automático por peso, E.G. (edad gestacional), Días de vida
- ✅ Modal con calculadora de dosis
- ✅ Indicaciones con referencias (Neofax, SEGNNEO, etc.)
- ✅ Botón de favoritos (⭐) en cada medicamento
- ✅ Estructura simplificada (dosificación básica, sin preparaciones detalladas — mejora futura)

**Procedimientos (ProceduresPage):**
- ✅ 5 procedimientos: CAU, CVU, TET, Fluidos, VIG
- ✅ Fórmulas interactivas con cálculo en tiempo real
- ✅ Pasos paso-a-paso con advertencias clínicas
- ✅ Materiales y referencias
- ✅ Botón de favoritos en cada procedimiento

**Índices Clínicos (ScoresPage):**
- ✅ Silverman-Andersen (5 items) — dificultad respiratoria
- ✅ Apgar (5 items) — estado vital al nacer
- ✅ Sarnat (10 items) — encefalopatía hipóxico-isquémica
- ✅ Radio buttons interactivos → puntuación total → interpretación con acción clínica
- ✅ Colores por severidad (verde/amarillo/naranja/rojo)
- ✅ Botón de favoritos en cada escala

**Fórmulas (FormulasPage):**
- ✅ **11 calculadoras médicas:**
  - BSA (Mosteller), Clearance de Creatinina, BSA simplificada
  - Aporte Calórico, Proteínas, Osmolalidad, IMC
  - **MAP (Mean Airway Pressure)** — presión media de vía aérea en ventilación
  - **IO (Oxygenation Index)** — índice de oxigenación (criterio ECMO)
  - **CDO₂ (Oxygen Delivery)** — aporte de oxígeno
  - **Balance Hidroelectrolítico 24h** — Ingreso/kg, Egreso/kg, Relación E/I, Ritmo Diurético
- ✅ Auto-relleno de peso desde PatientInput
- ✅ Inputs dinámicos según fórmula
- ✅ Cálculo en tiempo real con referencias
- ✅ Botón de favoritos en cada fórmula
- ✅ **Cálculos con múltiples fórmulas y dependencias** — Balance calcula totales intermedios para usar en derivadas

**Favoritos (FavoritesPage):**
- ✅ Listado de todos los items marcados como favoritos
- ✅ Agrupación por tipo (medicamento, procedimiento, índice, fórmula)
- ✅ Acceso rápido a detalles de medicamentos desde favoritos
- ✅ Persistencia en localStorage

**Contextos y utilidades:**
- ✅ PatientContext — gestión de peso, E.G., Días en sessionStorage
- ✅ FavoritesContext — gestión de marcadores en localStorage
- ✅ Cálculos de dosificación completos (matchDosingRule, calcDose, calcRuleOf3, calcInfusionVelocity)
- ✅ Búsqueda de medicamentos

**Rediseño Visual (2026-04-30):**
- ✅ Tema verde esmeralda (brand colors) en lugar de azul
- ✅ Dark mode completo con toggle 🌙/☀️ en header superior
- ✅ Navegación inferior con 5 tabs (BottomNav)
- ✅ Dark mode con clases `dark:` en todos los componentes
- ✅ Medicamentos agrupados por categoría

**Deploy:**
- ✅ Repositorio GitHub: https://github.com/diegoastein/neocalcu
- ✅ GitHub Pages: https://diegoastein.github.io/neocalcu/
- ✅ PWA con Service Worker (funciona offline)
- ✅ Configurado `base: '/neocalcu/'` en vite.config.ts para rutas relativas

**Dev server corriendo:** `npm run dev` → localhost:5176 (varía según disponibilidad)

**Correcciones técnicas recientes (2026-05-01):**
- ✅ **Regex de variables actualizado** — Ahora detecta nombres con números (ingreso1, ingreso2, etc.)
  - Cambio: `/\b([a-z_]+)\b/g` → `/\b([a-z_][a-z0-9_]*)\b/g`
  - Aplicado en FormulasPage y ProceduresPage
- ✅ **Cálculos multi-fórmula con dependencias** — Las fórmulas pueden usar resultados de otras fórmulas
  - Ingreso/kg y Egreso/kg ahora usan los totales calculados previamente
  - Relación E/I usa tanto ingreso_total como egreso_total
- ✅ **Balance Hidroelectrolítico** — Muestra 4 resultados (Ingreso/kg, Egreso/kg, E/I, Ritmo Diurético)
  - Inputs: Ingreso 1/2/3 (opcionales), Diuresis (requerido), Catarsis/Otros (opcionales)
  - Auto-relleno de peso desde PatientContext
  - Cálculo correcto de ingresos/egresos extrapolados a kg

## Agregar un medicamento nuevo

1. Agregar el objeto en `docs/clinical_knowledge.json` → array `drugs[]`, respetando la interfaz `Drug`
2. Si usa regla de 3, agregar `infusionRules` con `ruleOf3.multiplier` correcto
3. Si es bolo, agregar `dosingRules` ordenadas de más restrictiva (prematuros extremos) a menos restrictiva (término)
4. La UI lo muestra automáticamente — no se necesita código adicional

## Próximas tareas / Mejoras futuras

**INMEDIATO (después de completar 240+ medicamentos):**

1. **Enriquecer medicamentos** — expandir estructura simplificada
   - Agregar preparation detallada (diluciones, estabilidad, reconstitución)
   - Agregar administration (routes, iv rates, incompatibilities)
   - Agregar monitoring (parámetros a seguir)
   - Agregar contraindications (restricciones clínicas)

2. **Build y PWA** — verificar `npm run build` y test offline
   - Service Worker precache de Workbox
   - Probar en navegador sin conexión
   - Validar velocidad de cálculos bedside

3. **Presentación especial para drogas inotrópicas**
   - Dopamina, dobutamina, adrenalina con cálculo detallado de preparación
   - Titulación visual, tabla de velocidades
   - Compatibilidades IV específicas

**FUTURO (Features avanzadas):**

4. ✅ **Tema claro/oscuro** — COMPLETADO, toggle 🌙/☀️ en header superior
5. **Exportación de datos** — generar PDF con cálculos para impresión/documentación
6. **Integración con hardware** — lector de código de barras para medicamentos
7. **Agregar más procedimientos** — según protocolos neonatológicos locales
8. **Historial de pacientes** — almacenamiento de cálculos recientes (opcional)
9. **Sliders para inputs numéricos** — mejora UX en cálculos
10. **Presentación especial para inotrópicos** — Dopamina, dobutamina, adrenalina con titulación visual
