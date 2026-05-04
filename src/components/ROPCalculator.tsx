import { useState } from 'react';
import { usePatient } from '../context/PatientContext';

const RISK_FACTORS = [
  { id: 'o2', label: 'Oxigenoterapia prolongada', desc: '> 30 días o FiO₂ elevada' },
  { id: 'vm', label: 'Ventilación mecánica', desc: 'ARM o CPAP prolongado' },
  { id: 'transfusion', label: 'Transfusiones repetidas', desc: '≥ 3 transfusiones de GR' },
  { id: 'sepsis', label: 'Sepsis', desc: 'Confirmada o probable' },
  { id: 'hemo', label: 'Inestabilidad hemodinámica', desc: 'Hipotensión, shock, drogas vasoactivas' },
  { id: 'cirugia', label: 'Cirugía cardíaca', desc: 'En el período neonatal' },
];

// Semanas de vida para el primer examen según EG al nacer (SAP 2021)
function semanasHastaPrimerExamen(ga: number): number {
  if (ga <= 27) return Math.max(4, 31 - ga);
  if (ga <= 30) return 4;
  if (ga === 31) return 3;
  return 2; // 32 semanas
}

function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ROPCalculator({ references }: { references: string[] }) {
  const { patient } = usePatient();
  const [ga, setGa] = useState<number>(patient.gestAgeWeeks ?? 30);
  const [weight, setWeight] = useState<number>(patient.weightGrams > 0 ? patient.weightGrams : 0);
  const [birthDate, setBirthDate] = useState<string>('');
  const [riskFactors, setRiskFactors] = useState<Set<string>>(new Set());

  const toggleRisk = (id: string) => {
    const next = new Set(riskFactors);
    next.has(id) ? next.delete(id) : next.add(id);
    setRiskFactors(next);
  };

  const hasRiskFactor = riskFactors.size > 0;

  // Determinar indicación
  const indicacionObligatoria = ga <= 32 || (weight > 0 && weight <= 1500);
  const indicacionCondicional = !indicacionObligatoria && ga >= 33 && ga <= 36 && hasRiskFactor;
  const indicado = indicacionObligatoria || indicacionCondicional;
  const noIndicado = !indicado && ga > 36;
  const requiereFactores = !indicacionObligatoria && ga >= 33 && ga <= 36 && !hasRiskFactor;

  // Calcular semanas hasta primer examen (solo si indicado con criterio obligatorio o rango 33-36)
  const semanasExamen = indicacionObligatoria ? semanasHastaPrimerExamen(Math.min(ga, 32)) : null;
  const edadCorregidaExamen = indicacionObligatoria ? ga + semanasExamen! : null;

  // Fecha real si se ingresó fecha de nacimiento
  const fechaExamen = birthDate && semanasExamen
    ? addWeeks(new Date(birthDate + 'T12:00:00'), semanasExamen)
    : null;

  return (
    <div className="space-y-4">
      {/* EG y peso - pre-rellenados desde el contexto */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            EG al nacer (semanas)
          </label>
          <input
            type="number"
            value={ga || ''}
            min={23}
            max={40}
            onChange={(e) => setGa(parseInt(e.target.value) || 0)}
            className="w-full text-center text-2xl font-bold border border-slate-300 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Peso de nacimiento (g)
          </label>
          <input
            type="number"
            value={weight || ''}
            min={0}
            step={10}
            onChange={(e) => setWeight(parseInt(e.target.value) || 0)}
            className="w-full text-center text-2xl font-bold border border-slate-300 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Factores de riesgo — solo relevantes para EG 33–36s */}
      {ga >= 33 && ga <= 36 && (
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Factores de riesgo asociados
            <span className="ml-2 text-xs font-normal text-amber-600 dark:text-amber-400">
              (determinantes para EG 33–36s)
            </span>
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
        </div>
      )}

      {/* Resultado de indicación */}
      {ga > 0 && (
        <div className={`rounded-xl p-4 border-2 ${
          indicacionObligatoria
            ? 'bg-brand-50 dark:bg-slate-800 border-brand-300 dark:border-brand-700'
            : indicacionCondicional
            ? 'bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-700'
            : requiereFactores
            ? 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600'
            : 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700'
        }`}>
          <p className={`font-bold text-base mb-1 ${
            indicacionObligatoria ? 'text-brand-900 dark:text-brand-200'
            : indicacionCondicional ? 'text-amber-900 dark:text-amber-200'
            : requiereFactores ? 'text-slate-700 dark:text-slate-300'
            : 'text-green-900 dark:text-green-200'
          }`}>
            {indicacionObligatoria && '📋 Screening obligatorio'}
            {indicacionCondicional && '⚠️ Screening recomendado'}
            {requiereFactores && '— Evaluar según factores de riesgo'}
            {noIndicado && '✓ No requiere screening de ROP'}
          </p>
          <p className={`text-sm ${
            indicacionObligatoria ? 'text-brand-800 dark:text-brand-300'
            : indicacionCondicional ? 'text-amber-800 dark:text-amber-300'
            : requiereFactores ? 'text-slate-600 dark:text-slate-400'
            : 'text-green-800 dark:text-green-300'
          }`}>
            {indicacionObligatoria && `Criterio: EG ≤ 32s${weight > 0 && weight <= 1500 ? ' y PN ≤ 1500g' : ''}`}
            {indicacionCondicional && 'Criterio: EG 33–36s con factor de riesgo presente'}
            {requiereFactores && 'EG 33–36s: screening solo si presenta factores de riesgo'}
            {noIndicado && 'EG > 36s — no cumple criterios de screening SAP'}
          </p>
        </div>
      )}

      {/* Timing del primer examen */}
      {indicacionObligatoria && semanasExamen !== null && edadCorregidaExamen !== null && (
        <div className="bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-brand-700 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 uppercase">
            Primer examen oftalmológico
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Semanas de vida</p>
              <p className="text-4xl font-bold text-brand-900 dark:text-brand-200">{semanasExamen}</p>
              <p className="text-xs text-brand-600 dark:text-brand-400 mt-1">semanas de vida cronológica</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Edad corregida</p>
              <p className="text-4xl font-bold text-brand-900 dark:text-brand-200">{edadCorregidaExamen}</p>
              <p className="text-xs text-brand-600 dark:text-brand-400 mt-1">semanas de EPC</p>
            </div>
          </div>

          {/* Fecha de nacimiento opcional */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Fecha de nacimiento (opcional — para calcular fecha del examen)
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded text-sm dark:bg-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {fechaExamen && (
            <div className="bg-white dark:bg-slate-700 rounded-lg p-3 border border-brand-200 dark:border-brand-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Fecha estimada del primer examen</p>
              <p className="text-base font-bold text-brand-900 dark:text-brand-200 capitalize">
                {formatDate(fechaExamen)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Seguimiento */}
      {indicado && (
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Frecuencia de seguimiento</p>
          <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
            <li>• Retina inmadura sin ROP: cada 2–3 semanas</li>
            <li>• ROP estadio 1–2 zona II: cada 1–2 semanas</li>
            <li>• ROP estadio 3 o zona I: cada 3–7 días</li>
            <li>• ROP tipo 1 (umbral de tratamiento): tratamiento en ≤ 72 h</li>
            <li>• Alta: vascularización completa o involución confirmada</li>
          </ul>
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
