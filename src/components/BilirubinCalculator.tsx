import { useState } from 'react';
import ShareResultButton from './ShareResultButton';

// NICE CG98 — Phototherapy & exchange transfusion thresholds
// ≥38 semanas: valores exactos del Excel oficial NICE (nice.org.uk/guidance/cg98)
// 35-37 semanas: escalados desde la curva ≥38s usando fórmula NICE para pretérminos (EG×10−100 µmol/L)
// Vigilancia excepcional NICE 2023: sin cambios en umbrales

const NICE_HOURS = [0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96];
const PHOTO_38W  = [100, 125, 150, 175, 200, 212, 225, 237, 250, 262, 275, 287, 300, 312, 325, 337, 350];
const EXCH_38W   = [100, 150, 200, 250, 300, 350, 400, 450, 450, 450, 450, 450, 450, 450, 450, 450, 450];

const UMOL_TO_MGDL = 1 / 17.1;
const MGDL_TO_UMOL = 17.1;
const BORDERLINE_UMOL = 50;

function lerp38(hours: number, table: number[]): number {
  const h = Math.min(hours, NICE_HOURS[NICE_HOURS.length - 1]);
  if (h <= 0) return table[0];
  for (let i = 0; i < NICE_HOURS.length - 1; i++) {
    if (h >= NICE_HOURS[i] && h <= NICE_HOURS[i + 1]) {
      const t = (h - NICE_HOURS[i]) / (NICE_HOURS[i + 1] - NICE_HOURS[i]);
      return table[i] + t * (table[i + 1] - table[i]);
    }
  }
  return table[table.length - 1];
}

function calcUmbralesUmol(hours: number, ga: number): { photo: number; exchange: number } {
  const photo38 = lerp38(hours, PHOTO_38W);
  const exch38  = lerp38(hours, EXCH_38W);

  if (ga >= 38) return { photo: photo38, exchange: exch38 };

  // Pretérminos: escalar usando fórmula NICE CG98 → umbral estabilizado = EG×10−100 µmol/L
  const plateauPhoto = ga * 10 - 100; // 35s→250, 36s→260, 37s→270
  const plateauExch  = ga * 10;       // 35s→350, 36s→360, 37s→370

  return {
    photo:    Math.max(0, Math.round(photo38 * plateauPhoto / 350)),
    exchange: Math.max(0, Math.round(exch38  * plateauExch  / 450)),
  };
}

const fmt    = (umol: number) => `${(umol * UMOL_TO_MGDL).toFixed(1)} mg/dL`;
const fmtBoth = (umol: number) => `${(umol * UMOL_TO_MGDL).toFixed(1)} mg/dL (${umol} µmol/L)`;

const MONITORING_FACTORS = [
  {
    id: 'hermano',
    label: 'Hermano/a con ictericia neonatal que requirió fototerapia',
    desc: 'Antecedente familiar de ictericia tratada',
  },
  {
    id: 'lactancia',
    label: 'Intención de lactancia materna exclusiva',
    desc: 'Factor de riesgo para ictericia prolongada',
  },
];

type Status = 'exanguino' | 'intensiva' | 'fototerapia' | 'borderline' | 'normal';

const STATUS_CONFIG: Record<Status, { bg: string; text: string; icon: string; label: string; action: string }> = {
  normal: {
    bg:     'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700',
    text:   'text-green-900 dark:text-green-200',
    icon:   '✓',
    label:  'Por debajo del umbral de fototerapia',
    action: 'No requiere fototerapia. Continuar vigilancia clínica.',
  },
  borderline: {
    bg:     'bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-700',
    text:   'text-yellow-900 dark:text-yellow-200',
    icon:   '⚡',
    label:  'Zona limítrofe',
    action: '', // se genera dinámicamente
  },
  fototerapia: {
    bg:     'bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-700',
    text:   'text-amber-900 dark:text-amber-200',
    icon:   '⚠️',
    label:  'Indicación de fototerapia',
    action: 'Iniciar fototerapia. Reevaluar bilirrubina en 4–6 h si asciende rápidamente, o en 6–12 h si responde bien.',
  },
  intensiva: {
    bg:     'bg-orange-50 dark:bg-orange-950 border-orange-300 dark:border-orange-700',
    text:   'text-orange-900 dark:text-orange-200',
    icon:   '🚨',
    label:  'Fototerapia intensiva urgente',
    action: 'Bilirrubina dentro de los 50 µmol/L del umbral de exanguinotransfusión. Iniciar fototerapia intensiva de inmediato. Controlar en 2–4 h y preparar exanguinotransfusión.',
  },
  exanguino: {
    bg:     'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700',
    text:   'text-red-900 dark:text-red-200',
    icon:   '🚨',
    label:  'Indicación de exanguinotransfusión',
    action: 'Iniciar fototerapia intensiva de inmediato y preparar exanguinotransfusión de doble volumen. Contactar hematología y banco de sangre.',
  },
};

export default function BilirubinCalculator({ references }: { references: string[] }) {
  const [bilirrubina, setBilirrubina] = useState<string>('');
  const [horas, setHoras] = useState(48);
  const [ga, setGa] = useState(38);
  const [monitorFactors, setMonitorFactors] = useState<Set<string>>(new Set());

  const toggleFactor = (id: string) => {
    const next = new Set(monitorFactors);
    next.has(id) ? next.delete(id) : next.add(id);
    setMonitorFactors(next);
  };

  const { photo: photoUmol, exchange: exchUmol } = calcUmbralesUmol(horas, ga);
  const bili = parseFloat(bilirrubina);
  const hasBili = !isNaN(bili) && bili > 0;
  const biliUmol = bili * MGDL_TO_UMOL;
  const conFactores = monitorFactors.size > 0;
  const repeatHours = conFactores ? 18 : 24;

  let status: Status | null = null;
  if (hasBili) {
    if (biliUmol >= exchUmol)                         status = 'exanguino';
    else if (biliUmol >= exchUmol - BORDERLINE_UMOL)  status = 'intensiva';
    else if (biliUmol >= photoUmol)                   status = 'fototerapia';
    else if (biliUmol >= photoUmol - BORDERLINE_UMOL) status = 'borderline';
    else                                               status = 'normal';
  }

  const getBorderlineAction = () =>
    `Bilirrubina dentro de los 50 µmol/L (2.9 mg/dL) del umbral de fototerapia. Repetir en ${repeatHours} horas${conFactores ? ' (factor de riesgo presente)' : ''}.`;

  const horasStr = horas < 24
    ? `${horas}h`
    : `${Math.floor(horas / 24)}d ${horas % 24 > 0 ? `${horas % 24}h` : ''}`.trim();

  return (
    <div className="space-y-4">
      {/* Edad gestacional */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Edad gestacional al nacer
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[35, 36, 37, 38].map((w) => (
            <button
              key={w}
              onClick={() => setGa(w)}
              className={`py-2 rounded-lg font-bold text-sm transition ${
                ga === w
                  ? 'bg-brand-800 dark:bg-brand-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {w === 38 ? '≥38s' : `${w}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Horas de vida */}
      <div>
        <div className="flex justify-between items-baseline mb-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Horas de vida
          </label>
          <span className="text-xl font-bold text-brand-800 dark:text-brand-300">{horasStr}</span>
        </div>
        <input
          type="range"
          min={0}
          max={168}
          step={1}
          value={horas}
          onChange={(e) => setHoras(parseInt(e.target.value))}
          className="w-full accent-brand-700"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>0h</span>
          <span>7 días</span>
        </div>
      </div>

      {/* Umbrales calculados */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-brand-700 rounded-lg p-3">
          <p className="text-xs text-brand-700 dark:text-brand-400 font-medium mb-1">Umbral Fototerapia</p>
          <p className="text-2xl font-bold text-brand-900 dark:text-brand-200">{fmt(photoUmol)}</p>
          <p className="text-xs text-brand-500 dark:text-brand-500 mt-0.5">{photoUmol} µmol/L</p>
        </div>
        <div className="bg-red-50 dark:bg-slate-800 border border-red-200 dark:border-red-700 rounded-lg p-3">
          <p className="text-xs text-red-700 dark:text-red-400 font-medium mb-1">Umbral Exanguino</p>
          <p className="text-2xl font-bold text-red-900 dark:text-red-300">{fmt(exchUmol)}</p>
          <p className="text-xs text-red-500 dark:text-red-500 mt-0.5">{exchUmol} µmol/L</p>
        </div>
      </div>

      {/* Zona de fototerapia intensiva */}
      <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-700 rounded-lg px-3 py-2 text-xs text-orange-800 dark:text-orange-300">
        <span className="font-semibold">Fototerapia intensiva</span> si bilirrubina ≥ {fmtBoth(exchUmol - BORDERLINE_UMOL)}
      </div>

      {/* Factores de monitorización */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Factores para frecuencia de monitorización
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          No modifican el umbral de fototerapia. Indican cuándo repetir bilirrubina si está en zona limítrofe.
        </p>
        <div className="space-y-2">
          {MONITORING_FACTORS.map((rf) => (
            <label
              key={rf.id}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                monitorFactors.has(rf.id)
                  ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-700'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={monitorFactors.has(rf.id)}
                onChange={() => toggleFactor(rf.id)}
                className="mt-0.5 w-4 h-4 accent-brand-700 flex-shrink-0"
              />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{rf.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{rf.desc}</p>
              </div>
            </label>
          ))}
        </div>
        {conFactores && (
          <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-2 font-medium">
            ⚡ Factor presente — repetir en 18h si la bilirrubina está en zona limítrofe
          </p>
        )}
      </div>

      {/* Bilirrubina del paciente */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Bilirrubina total sérica del paciente
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={bilirrubina}
            onChange={(e) => setBilirrubina(e.target.value)}
            placeholder="0.0"
            step="0.1"
            min="0"
            className="flex-1 text-center text-3xl font-bold border border-slate-300 dark:border-slate-600 rounded-lg p-3 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <span className="text-sm text-slate-500 dark:text-slate-400 flex-shrink-0">mg/dL</span>
        </div>
        {hasBili && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-center">
            {Math.round(biliUmol)} µmol/L
          </p>
        )}
      </div>

      {/* Resultado */}
      {hasBili && status && (
        <div className={`rounded-xl p-4 border-2 ${STATUS_CONFIG[status].bg}`}>
          <div className={`font-bold text-lg mb-1 ${STATUS_CONFIG[status].text}`}>
            {STATUS_CONFIG[status].icon} {STATUS_CONFIG[status].label}
          </div>
          <p className={`text-sm ${STATUS_CONFIG[status].text}`}>
            {status === 'borderline' ? getBorderlineAction() : STATUS_CONFIG[status].action}
          </p>
          <div className={`mt-3 pt-3 border-t border-current border-opacity-20 text-xs ${STATUS_CONFIG[status].text}`}>
            <p>
              Bili: <strong>{bili.toFixed(1)} mg/dL ({Math.round(biliUmol)} µmol/L)</strong>
              {' · '}Foto: <strong>{fmt(photoUmol)}</strong>
              {' · '}Exanguino: <strong>{fmt(exchUmol)}</strong>
            </p>
          </div>
        </div>
      )}

      {hasBili && status && (
        <ShareResultButton
          title="Bilirrubina NICE CG98"
          text={[
            `Bilirrubina NICE CG98 — NeoCalcu`,
            `EG: ${ga} sem | DOL: ${horas}h | Bili: ${bili.toFixed(1)} mg/dL (${Math.round(biliUmol)} µmol/L)`,
            `${STATUS_CONFIG[status].icon} ${STATUS_CONFIG[status].label}`,
            status === 'borderline' ? getBorderlineAction() : STATUS_CONFIG[status].action,
            `Umbral foto: ${(photoUmol * UMOL_TO_MGDL).toFixed(1)} mg/dL | Umbral exanguino: ${(exchUmol * UMOL_TO_MGDL).toFixed(1)} mg/dL`,
          ].join('\n')}
        />
      )}

      {/* Referencias */}
      {references.length > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium">Referencias:</span> {references.join(' • ')}
        </p>
      )}
    </div>
  );
}
