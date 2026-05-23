import { useState } from 'react';

// Percentiles de peso al nacer (gramos): [P3, P10, P50, P90, P97]
// Muy prematuro (24-32s, sexo combinado) — INTERGROWTH-21st, Villar et al. Lancet 2016
// Término/tardío (33-42s, por sexo)    — INTERGROWTH-21st, Villar et al. Lancet 2014

type Row = [number, number, number, number, number];

const VERY_PRETERM: Record<number, Row> = {
  24: [355,  400,  490,  595,  640],
  25: [443,  500,  613,  740,  795],
  26: [543,  614,  752,  906,  975],
  27: [655,  740,  907, 1090, 1173],
  28: [778,  880, 1079, 1296, 1395],
  29: [915, 1035, 1269, 1525, 1641],
  30: [1063, 1202, 1475, 1772, 1908],
  31: [1221, 1381, 1695, 2036, 2193],
  32: [1388, 1571, 1930, 2317, 2496],
};

const MALE: Record<number, Row> = {
  33: [1590, 1750, 2105, 2460, 2620],
  34: [1740, 1920, 2305, 2690, 2870],
  35: [1900, 2090, 2510, 2930, 3120],
  36: [2060, 2270, 2720, 3170, 3390],
  37: [2200, 2430, 2915, 3400, 3630],
  38: [2350, 2590, 3110, 3630, 3870],
  39: [2490, 2750, 3300, 3850, 4110],
  40: [2640, 2910, 3488, 4070, 4340],
  41: [2760, 3050, 3655, 4260, 4550],
  42: [2870, 3170, 3800, 4430, 4730],
};

const FEMALE: Record<number, Row> = {
  33: [1510, 1670, 2000, 2330, 2490],
  34: [1660, 1820, 2190, 2560, 2730],
  35: [1800, 1990, 2385, 2780, 2970],
  36: [1950, 2150, 2584, 3020, 3220],
  37: [2090, 2310, 2769, 3230, 3440],
  38: [2230, 2450, 2945, 3440, 3670],
  39: [2370, 2610, 3135, 3660, 3900],
  40: [2500, 2760, 3314, 3870, 4120],
  41: [2620, 2890, 3472, 4050, 4320],
  42: [2730, 3010, 3610, 4210, 4490],
};

function getRow(ga: number, sex: 'M' | 'F'): Row | null {
  if (ga < 24 || ga > 42) return null;
  if (ga <= 32) return VERY_PRETERM[ga] ?? null;
  return sex === 'M' ? (MALE[ga] ?? null) : (FEMALE[ga] ?? null);
}

function estimatePercentile(w: number, [p3, p10, p50, p90, p97]: Row): number {
  if (w < p3)  return Math.max(0.5, 3 * (w / p3));
  if (w < p10) return 3  + 7  * ((w - p3)  / (p10 - p3));
  if (w < p50) return 10 + 40 * ((w - p10) / (p50 - p10));
  if (w < p90) return 50 + 40 * ((w - p50) / (p90 - p50));
  if (w < p97) return 90 + 7  * ((w - p90) / (p97 - p90));
  return Math.min(99.5, 97 + 3 * ((w - p97) / (p97 - p90)));
}

function fmtPct(p: number): string {
  if (p < 1)  return '< 1';
  if (p > 99) return '> 99';
  return p.toFixed(1);
}

interface Classification {
  label: string;
  color: 'red' | 'green' | 'amber';
  detail: string;
}

function classify(p: number): Classification {
  if (p < 10) return { label: 'PEG', color: 'red',   detail: 'Pequeño para la edad gestacional (< P10)' };
  if (p > 90) return { label: 'GEG', color: 'amber', detail: 'Grande para la edad gestacional (> P90)' };
  return         { label: 'AEG', color: 'green', detail: 'Adecuado para la edad gestacional (P10 – P90)' };
}

const COLORS = {
  red:   { badge: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100',     border: 'border-red-300 dark:border-red-700',   dot: 'bg-red-500' },
  green: { badge: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100', border: 'border-green-300 dark:border-green-700', dot: 'bg-green-500' },
  amber: { badge: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100', border: 'border-amber-300 dark:border-amber-700', dot: 'bg-amber-500' },
};

export default function IntergrowthCalculator() {
  const [ga, setGa]     = useState('');
  const [weight, setWeight] = useState('');
  const [sex, setSex]   = useState<'M' | 'F' | ''>('');

  const gaNum  = parseInt(ga);
  const wNum   = parseFloat(weight);
  const needsSex = !isNaN(gaNum) && gaNum >= 33;
  const ready  = !isNaN(gaNum) && !isNaN(wNum) && gaNum >= 24 && gaNum <= 42
               && wNum > 100 && (!needsSex || sex !== '');

  const row        = ready ? getRow(gaNum, needsSex ? (sex as 'M' | 'F') : 'M') : null;
  const percentile = row ? estimatePercentile(wNum, row) : null;
  const cls        = percentile !== null ? classify(percentile) : null;

  const markerPct = percentile !== null
    ? Math.min(98, Math.max(2, percentile))
    : null;

  return (
    <div className="space-y-4">
      {/* Inputs */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Edad gestacional al nacer (semanas completas)
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={24} max={42}
            value={ga}
            onChange={(e) => setGa(e.target.value)}
            placeholder="24 – 42"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Peso al nacer (gramos)
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={100} max={8000}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="ej. 1250"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>

        {needsSex && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Sexo</label>
            <div className="flex gap-3">
              {(['M', 'F'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSex(s)}
                  className={`flex-1 py-2 rounded-lg font-semibold text-sm border-2 transition ${
                    sex === s
                      ? 'bg-brand-700 text-white border-brand-700'
                      : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {s === 'M' ? 'Masculino' : 'Femenino'}
                </button>
              ))}
            </div>
          </div>
        )}

        {!isNaN(gaNum) && gaNum >= 24 && gaNum <= 32 && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Para &lt; 33 semanas se usan estándares combinados (sin diferenciación por sexo).
          </p>
        )}
      </div>

      {/* Resultado */}
      {ready && row && percentile !== null && cls && (
        <div className={`bg-white dark:bg-slate-900 rounded-lg border-2 ${COLORS[cls.color].border} p-4 space-y-4`}>
          {/* Badge + percentil */}
          <div className="flex items-center justify-between">
            <span className={`text-2xl font-extrabold px-4 py-1.5 rounded-xl ${COLORS[cls.color].badge}`}>
              {cls.label}
            </span>
            <div className="text-right">
              <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                P{fmtPct(percentile)}
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400">{cls.detail}</p>

          {/* Barra visual */}
          <div className="space-y-2">
            <div className="relative h-4 rounded-full overflow-hidden flex">
              <div className="bg-red-300 dark:bg-red-800"   style={{ width: '10%' }} />
              <div className="bg-green-200 dark:bg-green-900" style={{ width: '80%' }} />
              <div className="bg-amber-300 dark:bg-amber-800" style={{ width: '10%' }} />
            </div>
            {/* Marcador */}
            <div className="relative" style={{ height: '14px' }}>
              <div
                className={`absolute top-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 shadow ${COLORS[cls.color].dot} -translate-x-1/2`}
                style={{ left: `${markerPct}%` }}
              />
            </div>
            {/* Etiquetas */}
            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 px-0.5">
              <span>P10<br />{row[1]}g</span>
              <span className="text-center">P50<br />{row[2]}g</span>
              <span className="text-right">P90<br />{row[3]}g</span>
            </div>
          </div>

          {/* Grid de referencias */}
          <div className="grid grid-cols-5 gap-1">
            {([['P3', row[0]], ['P10', row[1]], ['P50', row[2]], ['P90', row[3]], ['P97', row[4]]] as [string, number][]).map(([label, val]) => (
              <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{val}g</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fuente */}
      <p className="text-xs text-slate-400 dark:text-slate-500 text-center px-2">
        INTERGROWTH-21st · Villar et al., Lancet 2014 (≥ 33s) y Lancet 2016 (&lt; 33s)
      </p>
    </div>
  );
}
