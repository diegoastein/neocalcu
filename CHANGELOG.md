# Changelog

Todas las novedades importantes del proyecto se documentan en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [2026-08-06]

### Fixed

#### 🔐 Pérdida de membresía por purga de storage en Android
- **Persistencia de storage + auto-recuperación silenciosa por email**
  - Causa: la membresía vivía solo en `localStorage` (`neo_device_id` incluido); Chrome/Android puede purgar el storage de un sitio bajo presión de espacio o bajo engagement, regenerando el `device_id` y desvinculando al usuario de su suscripción activa en el worker
  - Síntoma: suscriptores que dejaban de usar la app un tiempo volvían a ver el flujo de "Suscripción"/"Recuperar" como si nunca hubieran pagado
  - Fix (capa 1): `navigator.storage.persist()` al bootstrap (`src/main.tsx`) — reduce la probabilidad de que Chrome purgue el storage del sitio
  - Fix (capa 2, red de seguridad): el email del suscriptor se guarda también en una cookie de larga duración (`neo_email_backup`, 400 días), independiente de `localStorage`. Si al abrir la app el `device_id` no está reconocido por el worker, se intenta automáticamente `/recuperar` con ese email en segundo plano — sin mostrarle ningún modal al usuario
  - Refactor: `applyDonationData()` / `applyRestoredUserData()` centralizan la escritura de los campos de membresía y la restauración de favoritos/notas, antes duplicada en `handleVerify`, `handleRedeem`, `handleRecover` y `handleRecoverByCoupon`

#### 💊 Etiquetado de unidad incorrecto en dosis calculadas ("mg" fijo)
- **Causa:** `calcDose()` escribía literalmente "mg" en la dosis calculada y la instrucción de enfermería sin mirar la unidad real de la regla (`rule.unit`)
- **Impacto real verificado contra los datos:** 30 reglas de dosificación de drogas reales mostraban una unidad incorrecta en pantalla — fentanilo, digoxina y clonidina (mcg), heparina, penicilinas y vitaminas (U/UI/IU), bicarbonato y KCl (mEq), albúmina y dextrosa (g), sodium glycerophosphate (mmol), entre otras
- Fix: nueva `extractDoseUnit()` en `src/utils/calculations.ts` extrae la unidad real del string `rule.unit` (validada contra las 29 variantes de unidad presentes en `clinical_knowledge.json`); `calcDose()` ahora devuelve `unit` y lo usa en `nursingInstruction`
- Se actualizaron todos los puntos de renderizado que tenían "mg" hardcodeado: `DrugDetail.tsx` (caja "Dosis calculada", texto de `ShareResultButton`) y el historial de cálculos en `MedicationsPage.tsx`

#### 💊 Insulina — entrada vacía / duplicada
- Causa: existían **dos entradas duplicadas** de insulina en el JSON, ambas mal formadas para la UI — una con `doseMin/doseMax` en vez de `dosePerKg` (calculaba `NaN`), la otra con `concentrationMgMl: null` a propósito, lo que hacía que la UI ocultara dosis, frecuencia y notas por completo
- Se consolidaron en una única entrada (`id: insulina`, se preserva para no romper favoritos existentes) con tres reglas: bolo de corrección (0.1 U/kg/dosis, calcula volumen), infusión IV continua (0.01–0.1 U/kg/h, informativa) y aditivo en NPT (informativa)
- Nuevo campo opcional `concentrationUnit` en `DrugPreparation` — permite mostrar "100 U/mL" en vez de "100 mg/mL" para drogas que no se dosifican en mg (por ahora solo insulina lo usa)
- Fix general (beneficia a ~28 drogas más, no solo insulina): cuando una regla por kg no tiene volumen calculable (falta concentración, o la regla es puramente informativa como un aditivo de NPT), la UI ahora sigue mostrando dosis/intervalo/notas en vez de ocultar todo detrás de un cartel genérico — afectaba entre otras a captopril, vitamina D, cloruro de potasio y vecuronio

## [2026-07-09]

### Added (Premium - Suscriptores)

#### 🔓 Gestión Multi-Paciente Mejorada
- **Aumento de límite de pacientes a 10** (`be1b8cf`)
  - Anteriormente: máximo 4 pacientes simultáneos
  - Ahora: hasta 10 pacientes para suscriptores
  - Interfaz responsiva: tabs en desktop, dropdown en móviles (< 768px)
  - No-suscriptores mantienen el límite de 4 pacientes

- **Opción para borrar todos los pacientes** (`a6ec1e5`)
  - Nuevo botón "Borrar todos los pacientes" en Settings
  - Modal de confirmación para evitar borrados accidentales
  - Muestra cantidad de pacientes a borrar antes de confirmar
  - Feedback visual (spinner + checkmark animado)

#### 📊 Variación de Peso
- **Campo de variación de peso diario** (`cc52240`, `092ae57`)
  - Nuevo campo: variación de peso respecto al día anterior (en gramos)
  - Soporta valores positivos (+aumento) y negativos (-pérdida)
  - Campo opcional y gateado para suscriptores
  - Sincronización automática entre pacientes multi-paciente

#### 💾 Auto Guardado (Premium)
- **Auto guardado de datos del paciente** (`092ae57`)
  - Cambio de paradigma: de "Registrar datos" a guardado continuo
  - Debounce de 500ms para evitar sobrecarga de localStorage
  - Indicador visual sutil: "Auto guardado" en gris, checkmark verde tras guardar
  - Sin interrupciones: guardado transparente en background
  - Disponible solo para suscriptores; no-suscriptores mantienen botón "Registrar"

#### 🔗 Compartir Resultados Mejorado
- **Incluir nombre del paciente en datos compartidos** (`fce7104`)
  - Al compartir resultados, se incluye: "Paciente: [nombre]"
  - Funciona con Web Share API y fallback a clipboard
  - Premium feature: gateado para suscriptores

#### 📋 Balance Hidroelectrolítico
- **Reset de valores en balance hidroelectrolítico** (`ff5e157`)
  - Ahora inicia con todos los campos en blanco
  - No hereda valores del paciente anterior
  - El peso sí se pre-rellena automáticamente si fue ingresado
  
- **Balance marcado como premium** (`19545e3`)
  - Agregado flag `isPremium: true` en datos clínicos
  - Gateado automáticamente: no-suscriptores ven bloque de suscripción

### Technical

- **Actualización de interfaz Patient** (`cc52240`)
  - Nuevo campo: `previousDayWeightDelta?: number`
  - Sincronización automática en localStorage

- **Mejoras en PatientContext** (`a6ec1e5`, `be1b8cf`, `092ae57`)
  - Nuevo método: `removeAllPatients()`
  - Nueva función: `setPatientDebounced()` con debounce de 500ms
  - Aumento de `MAX_PATIENTS` de 4 a 10 con gate premium

- **Mejoras en componentes**
  - `PatientInput.tsx`: Lógica responsiva, auto guardado, nuevo campo
  - `SettingsPanel.tsx`: Sección "Datos del paciente" con borrar bulk
  - `ShareResultButton.tsx`: Inclusión de nombre del paciente
  - `CalculadorasPage.tsx`: Reset de campos del balance

### Build

- Compilación exitosa sin errores TypeScript
- Bundle size: 649.72 kB (gzip: 161.22 kB)
- PWA precachea 17 entradas (1599.94 KiB)

---

## Notas para Futuras Versiones

### En Consideración

- Expansión de laboratorio premium (6 categorías adicionales)
- Google Play Billing (Digital Goods API)
- Fichas completas de medicamentos (diluciones, estabilidad, compatibilidades)
- Temas de color adicionales
- INTERGROWTH-21st: agregar talla y perímetro cefálico

---

**Convención de Commits:**
- `feat:` — Nueva funcionalidad
- `fix:` — Corrección de bug
- `refactor:` — Cambios sin funcionalidad nueva
- `chore:` — Tareas automatizadas, build, etc.
- `data:` — Cambios en datos clínicos (JSON)
- `docs:` — Documentación

Cada commit relacionado con una nueva feature incluye el hash para trazabilidad.
