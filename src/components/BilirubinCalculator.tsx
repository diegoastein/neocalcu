import { useState } from 'react';

// AAP 2022 — Phototherapy thresholds for ≥38w, no risk factors (mg/dL)
const HOURS = [0, 12, 24, 36, 48, 60, 72, 96, 120, 168];
const BASE = [5.0, 8.0, 10.0, 12.0, 13.0, 14.5, 15.0, 16.5, 17.0, 17.0];

// Subtract per GA week below 38
const GA_ADJ: Record<number, number> = { 35: 3, 36: 2, 37: 1, 38: 0 };

const RISK_FACTORS = [
  { id: 'hemolisis', label: 'Enfermedad hemolítica isoinmune', desc: 'Incompatibilidad Rh o ABO con TAD positivo' },
  { id: 'g6pd', label: 'Déficit de G6PD', desc: 'Confirmado o sospechado' },
  { id: 'asfixia', label: 'Asfixia perinatal', desc: 'Apgar ≤5 a los 5 min, pH <7.0 o EB ≤−12' },
  { id: 'sepsis', label: 'Sepsis', desc: 'Confirmada o en tratamiento antibiótico' },
  { id: 'temperatura', label: 'Inestabilidad térmica', desc: 'Hipotermia o temperatura inestable' },
];

function lerp(x: number): number {
  if (x <= HOURS[0]) return BASE[0];
  if (x >= HOURS[HOURS.length - 1]) return BASE[BASE.length - 1];
  for (let i = 0; i < HOURS.length - 1; i++) {
    if (x >= HOURS[i] && x <= HOURS[i + 1]) {
      const t = (x - HOURS[i]) / (HOURS[i + 1] - HOURS[i]);
      return BASE[i] + t * (BASE[i + 1] - BASE[i]);
    }
  }
  return BASE[BASE.length - 1];
}

function calcUmbrales(horas: number, ga: number, conRiesgo: boolean) {
  const base = lerp(horas);
  const fotoUmbral = Math.max(1, base - (GA_ADJ[ga] ?? 0) - (conRiesgo ? 2 : 0));
  const exanguinoUmbral = fotoUmbral + 5;
  return { fotoUmbral, exanguinoUmbral };
}

export default function BilirubinCalculator({ references }: { references: string[] }) {
  const [bilirrubina, setBilirrubina] = useState<string>('');
  const [horas, setHoras] = useState(48);
  const [ga, setGa] = useState(38);
  const [riskFactors, setRiskFactors] = useState<Set<string>>(new Set());

  const toggleRisk = (id: string) => {
    const next = new Set(riskFactors);
    next.has(id) ? next.delete(id) : next.add(id);
    setRiskFactors(next);
  };

  const conRiesgo = riskFactors.size > 0;
  const { fotoUmbral, exanguinoUmbral } = calcUmbrales(horas, ga, conRiesgo);
  const bili = parseFloat(bilirrubina);
  const hasBili = !isNaN(bili) && bili > 0;

  const status = hasBili
    ? bili >= exanguinoUmbral ? 'exanguino'
    : bili >= fotoUmbral ? 'fototerapia'
    : 'normal'
    : null;

  const statusConfig = {
    normal: {
      bg: 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700',
      text: 'text-green-900 dark:text-green-200',
      icon: '✓',
      label: 'Por debajo del umbral de fototerapia',
      action: 'No requiere fototerapia en este momento. Continuar vigilancia clínica.',
    },
    fototerapia: {
      bg: 'bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-700',
      text: 'text-amber-900 dark:text-amber-200',
      icon: '⚠️',
      label: 'Indicación de fototerapia',
      action: 'Iniciar fototerapia. Reevaluar bilirrubina en 4–6 h si sube rápidamente, o en 12–24 h si responde bien.',
    },
    exanguino: {
      bg: 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700',
      text: 'text-red-900 dark:text-red-200',
      icon: '🚨',
      label: 'Indicación de exanguinotransfusión',
      action: 'Iniciar fototerapia intensiva de inmediato y preparar exanguinotransfusión. Contactar hematología/banco de sangre.',
    },
  };

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

      {/* Factores de riesgo */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Factores de riesgo de neurotoxicidad
        </label>
        <div className="space-y-2">
          {RISK_FACTORS.map((rf) => (
            <label
              key={rf.id}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                riskFactors.has(rf.id)
                  ? 'bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-700'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={riskFactors.has(rf.id)}
                onChange={() => toggleRisk(rf.id)}
                className="mt-0.5 w-4 h-4 accent-brand-700 flex-shrink-0"
              />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{rf.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{rf.desc}</p>
              </div>
            </label>
          ))}
        </div>
        {conRiesgo && (
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-2 font-medium">
            ⚠️ Factor de riesgo activo — umbral reducido en 2 mg/dL
          </p>
        )}
      </div>

      {/* Umbrales calculados */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-brand-700 rounded-lg p-3">
          <p className="text-xs text-brand-700 dark:text-brand-400 font-medium mb-1">Umbral Fototerapia</p>
          <p className="text-3xl font-bold text-brand-900 dark:text-brand-200">{fotoUmbral.toFixed(1)}</p>
          <p className="text-xs text-brand-600 dark:text-brand-400 mt-1">mg/dL</p>
        </div>
        <div className="bg-red-50 dark:bg-slate-800 border border-red-200 dark:border-red-700 rounded-lg p-3">
          <p className="text-xs text-red-700 dark:text-red-400 font-medium mb-1">Umbral Exanguino</p>
          <p className="text-3xl font-bold text-red-900 dark:text-red-300">{exanguinoUmbral.toFixed(1)}</p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">mg/dL</p>
        </div>
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
      </div>

      {/* Resultado */}
      {hasBili && status && (
        <div className={`rounded-xl p-4 border-2 ${statusConfig[status].bg}`}>
          <div className={`font-bold text-lg mb-1 ${statusConfig[status].text}`}>
            {statusConfig[status].icon} {statusConfig[status].label}
          </div>
          <p className={`text-sm ${statusConfig[status].text}`}>
            {statusConfig[status].action}
          </p>
          <div className={`mt-3 pt-3 border-t border-current border-opacity-20 text-xs ${statusConfig[status].text}`}>
            <p>Bilirrubina: <strong>{bili.toFixed(1)} mg/dL</strong> · Umbral foto: <strong>{fotoUmbral.toFixed(1)}</strong> · Umbral exanguino: <strong>{exanguinoUmbral.toFixed(1)}</strong></p>
          </div>
        </div>
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
