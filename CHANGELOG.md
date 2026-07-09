# Changelog

Todas las novedades importantes del proyecto se documentan en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

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
