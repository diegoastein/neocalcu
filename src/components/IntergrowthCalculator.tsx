import { useState } from 'react';

// INTERGROWTH-21st Newborn Size Standards (intergrowth21st.org.uk)
// Percentiles: [P3, P10, P50, P90, P97]

type Row = [number, number, number, number, number];

// ── PESO (g) ────────────────────────────────────────────────────────────────
// Fuente: gigs R package / INTERGROWTH-21st — ig_nbs weight percentile CSVs
// <33s: promedio M+F (combinado, coherente con Villar 2016 sexo combinado)

const VERY_PRETERM_W: Record<number, Row> = {
  24: [ 430,  485,  620,  795,  895],
  25: [ 495,  555,  710,  905, 1020],
  26: [ 565,  630,  805, 1035, 1165],
  27: [ 640,  720,  920, 1175, 1320],
  28: [ 725,  815, 1040, 1335, 1500],
  29: [ 820,  925, 1180, 1515, 1700],
  30: [ 925, 1040, 1335, 1710, 1915],
  31: [1050, 1175, 1505, 1925, 2165],
  32: [1175, 1320, 1690, 2170, 2435],
};

const MALE_W: Record<number, Row> = {
  33: [1180, 1430, 1950, 2520, 2820],
  34: [1450, 1710, 2220, 2790, 3080],
  35: [1700, 1950, 2470, 3030, 3320],
  36: [1930, 2180, 2690, 3250, 3540],
  37: [2130, 2380, 2890, 3450, 3740],
  38: [2320, 2570, 3070, 3630, 3920],
  39: [2490, 2730, 3240, 3790, 4080],
  40: [2630, 2880, 3380, 3940, 4220],
  41: [2760, 3010, 3510, 4060, 4350],
  42: [2880, 3120, 3620, 4170, 4460],
};

const FEMALE_W: Record<number, Row> = {
  33: [1200, 1410, 1860, 2350, 2610],
  34: [1470, 1680, 2130, 2640, 2900],
  35: [1710, 1920, 2380, 2890, 3160],
  36: [1920, 2140, 2600, 3120, 3390],
  37: [2110, 2330, 2800, 3320, 3600],
  38: [2280, 2500, 2970, 3510, 3780],
  39: [2420, 2650, 3130, 3660, 3940],
  40: [2550, 2780, 3260, 3800, 4080],
  41: [2650, 2890, 3370, 3920, 4200],
  42: [2740, 2980, 3460, 4010, 4300],
};

// ── LONGITUD (cm) ────────────────────────────────────────────────────────────
// Fuente: gigs R package / INTERGROWTH-21st — ig_nbs percentile CSVs

const VERY_PRETERM_L: Record<number, Row> = {
  24: [27.3, 28.9, 32.2, 35.5, 37.1],
  25: [28.6, 30.2, 33.5, 36.8, 38.4],
  26: [29.9, 31.4, 34.8, 38.1, 39.6],
  27: [31.1, 32.7, 36.0, 39.4, 40.9],
  28: [32.4, 34.0, 37.3, 40.6, 42.2],
  29: [33.7, 35.2, 38.6, 41.9, 43.5],
  30: [34.9, 36.5, 39.8, 43.2, 44.7],
  31: [36.2, 37.8, 41.1, 44.4, 46.0],
  32: [37.5, 39.0, 42.4, 45.7, 47.3],
};

const MALE_L: Record<number, Row> = {
  33: [39.7, 41.1, 43.8, 46.6, 48.0],
  34: [41.1, 42.4, 45.0, 47.6, 48.9],
  35: [42.3, 43.5, 46.0, 48.5, 49.8],
  36: [43.4, 44.6, 47.0, 49.4, 50.6],
  37: [44.3, 45.5, 47.8, 50.1, 51.3],
  38: [45.2, 46.4, 48.6, 50.8, 52.0],
  39: [46.0, 47.1, 49.3, 51.5, 52.6],
  40: [46.8, 47.8, 49.9, 52.0, 53.1],
  41: [47.4, 48.5, 50.5, 52.6, 53.6],
  42: [48.0, 49.0, 51.0, 53.0, 54.1],
};

const FEMALE_L: Record<number, Row> = {
  33: [39.8, 41.0, 43.4, 45.7, 46.9],
  34: [41.0, 42.2, 44.6, 46.8, 47.9],
  35: [42.1, 43.3, 45.6, 47.8, 48.9],
  36: [43.1, 44.3, 46.5, 48.6, 49.7],
  37: [44.0, 45.1, 47.3, 49.4, 50.4],
  38: [44.8, 45.9, 48.0, 50.1, 51.1],
  39: [45.5, 46.6, 48.7, 50.7, 51.7],
  40: [46.1, 47.2, 49.2, 51.2, 52.2],
  41: [46.7, 47.7, 49.8, 51.7, 52.7],
  42: [47.2, 48.2, 50.2, 52.2, 53.1],
};

// ── PERÍMETRO CEFÁLICO (cm) ──────────────────────────────────────────────────

const VERY_PRETERM_HC: Record<number, Row> = {
  24: [19.4, 20.3, 22.3, 24.3, 25.3],
  25: [20.3, 21.2, 23.2, 25.2, 26.2],
  26: [21.2, 22.1, 24.1, 26.1, 27.1],
  27: [22.1, 23.0, 25.0, 27.0, 27.9],
  28: [23.0, 23.9, 25.9, 27.9, 28.8],
  29: [23.8, 24.8, 26.8, 28.8, 29.7],
  30: [24.7, 25.7, 27.7, 29.7, 30.6],
  31: [25.6, 26.6, 28.6, 30.6, 31.5],
  32: [26.5, 27.4, 29.4, 31.4, 32.4],
};

const MALE_HC: Record<number, Row> = {
  33: [28.2, 29.1, 30.9, 32.7, 33.6],
  34: [28.9, 29.8, 31.5, 33.2, 34.1],
  35: [29.6, 30.4, 32.0, 33.7, 34.6],
  36: [30.2, 30.9, 32.5, 34.2, 35.0],
  37: [30.7, 31.5, 33.0, 34.6, 35.4],
  38: [31.2, 32.0, 33.5, 35.0, 35.8],
  39: [31.7, 32.4, 33.9, 35.4, 36.2],
  40: [32.2, 32.9, 34.3, 35.8, 36.6],
  41: [32.6, 33.3, 34.7, 36.2, 36.9],
  42: [33.0, 33.7, 35.1, 36.5, 37.2],
};

const FEMALE_HC: Record<number, Row> = {
  33: [27.9, 28.8, 30.5, 32.2, 33.1],
  34: [28.6, 29.4, 31.1, 32.8, 33.7],
  35: [29.3, 30.1, 31.6, 33.3, 34.1],
  36: [29.9, 30.6, 32.1, 33.7, 34.6],
  37: [30.4, 31.1, 32.6, 34.2, 34.9],
  38: [30.9, 31.6, 33.0, 34.5, 35.3],
  39: [31.3, 32.0, 33.4, 34.9, 35.6],
  40: [31.7, 32.4, 33.8, 35.2, 35.9],
  41: [32.1, 32.7, 34.1, 35.5, 36.2],
  42: [32.4, 33.1, 34.4, 35.7, 36.4],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getRow(
  tables: { vp: Record<number, Row>; m: Record<number, Row>; f: Record<number, Row> },
  ga: number,
  sex: 'M' | 'F',
): Row | null {
  if (ga < 24 || ga > 42) return null;
  if (ga <= 32) return tables.vp[ga] ?? null;
  return sex === 'M' ? (tables.m[ga] ?? null) : (tables.f[ga] ?? null);
}

const W_TABLES  = { vp: VERY_PRETERM_W,  m: MALE_W,  f: FEMALE_W  };
const L_TABLES  = { vp: VERY_PRETERM_L,  m: MALE_L,  f: FEMALE_L  };
const HC_TABLES = { vp: VERY_PRETERM_HC, m: MALE_HC, f: FEMALE_HC };

function estimatePercentile(val: number, [p3, p10, p50, p90, p97]: Row): number {
  if (val < p3)  return Math.max(0.5, 3 * (val / p3));
  if (val < p10) return 3  + 7  * ((val - p3)  / (p10 - p3));
  if (val < p50) return 10 + 40 * ((val - p10) / (p50 - p10));
  if (val < p90) return 50 + 40 * ((val - p50) / (p90 - p50));
  if (val < p97) return 90 + 7  * ((val - p90) / (p97 - p90));
  return Math.min(99.5, 97 + 3 * ((val - p97) / (p97 - p90)));
}

function fmtPct(p: number): string {
  if (p < 1)  return '< 1';
  if (p > 99) return '> 99';
  return p.toFixed(1);
}

// Algoritmo de Acklam — probit(p) = z-score para percentil p ∈ (0,1)
function probit(p: number): number {
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
              1.383577518672690e+02, -3.066479806614716e+01,  2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
              6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
             -2.549732539343734e+00,  4.374664141464968e+00,  2.938163982698783e+00];
  const d = [ 7.784695709041462e-03,  3.224671290700398e-01,
              2.445134137142996e+00,  3.754408661907416e+00];
  const pLow = 0.02425;
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
           ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
  if (p <= 1 - pLow) {
    const q = p - 0.5, r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
           (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  }
  const q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
          ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
}

function pctToZ(pct: number): string {
  const p = Math.min(99.5, Math.max(0.5, pct)) / 100;
  const z = probit(p);
  const s = Math.abs(z).toFixed(2);
  return z >= 0 ? `+${s}` : `−${s}`;
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
  red:   { badge: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100',       border: 'border-red-300 dark:border-red-700',     dot: 'bg-red-500'   },
  green: { badge: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100', border: 'border-green-300 dark:border-green-700', dot: 'bg-green-500' },
  amber: { badge: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100', border: 'border-amber-300 dark:border-amber-700', dot: 'bg-amber-500' },
};

const PCTL_LABELS = ['P3', 'P10', 'P50', 'P90', 'P97'] as const;

// ── Sub-componente de resultado ───────────────────────────────────────────────

interface MeasurementResultProps {
  title: string;
  displayValue: string;
  row: Row;
  percentile: number;
  unit: string;
}

function MeasurementResult({ title, displayValue, row, percentile, unit }: MeasurementResultProps) {
  const cls = classify(percentile);
  const markerPct = Math.min(98, Math.max(2, percentile));

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-lg border-2 ${COLORS[cls.color].border} p-4 space-y-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">{title}</p>
          <p className="text-base font-bold text-slate-700 dark:text-slate-300">{displayValue}</p>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-extrabold px-4 py-1.5 rounded-xl ${COLORS[cls.color].badge}`}>
            {cls.label}
          </span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            P{fmtPct(percentile)}
          </p>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            z: {pctToZ(percentile)}
          </p>
        </div>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400">{cls.detail}</p>

      {/* Barra visual */}
      <div className="space-y-2">
        <div className="relative h-4 rounded-full overflow-hidden flex">
          <div className="bg-red-300 dark:bg-red-800"     style={{ width: '10%' }} />
          <div className="bg-green-200 dark:bg-green-900" style={{ width: '80%' }} />
          <div className="bg-amber-300 dark:bg-amber-800" style={{ width: '10%' }} />
        </div>
        <div className="relative" style={{ height: '14px' }}>
          <div
            className={`absolute top-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 shadow ${COLORS[cls.color].dot} -translate-x-1/2`}
            style={{ left: `${markerPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 px-0.5">
          <span>P10<br />{Number.isInteger(row[1]) ? row[1] : row[1].toFixed(1)}{unit}</span>
          <span className="text-center">P50<br />{Number.isInteger(row[2]) ? row[2] : row[2].toFixed(1)}{unit}</span>
          <span className="text-right">P90<br />{Number.isInteger(row[3]) ? row[3] : row[3].toFixed(1)}{unit}</span>
        </div>
      </div>

      {/* Grid de percentiles de referencia */}
      <div className="grid grid-cols-5 gap-1">
        {PCTL_LABELS.map((label, i) => (
          <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {Number.isInteger(row[i]) ? row[i] : (row[i] as number).toFixed(1)}{unit}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function IntergrowthCalculator() {
  const [ga,     setGa]     = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [hc,     setHc]     = useState('');
  const [sex,    setSex]    = useState<'M' | 'F' | ''>('');

  const gaNum = parseInt(ga);
  const wNum  = parseFloat(weight);
  const lNum  = parseFloat(length);
  const hcNum = parseFloat(hc);

  const needsSex   = !isNaN(gaNum) && gaNum >= 33;
  const gaValid    = !isNaN(gaNum) && gaNum >= 24 && gaNum <= 42;
  const sexOk      = !needsSex || sex !== '';
  const commonReady = gaValid && sexOk;

  const effectiveSex = needsSex ? (sex as 'M' | 'F') : 'M';

  const wRow  = commonReady && !isNaN(wNum)  && wNum > 100
    ? getRow(W_TABLES,  gaNum, effectiveSex) : null;
  const lRow  = commonReady && !isNaN(lNum)  && lNum > 20
    ? getRow(L_TABLES,  gaNum, effectiveSex) : null;
  const hcRow = commonReady && !isNaN(hcNum) && hcNum > 10
    ? getRow(HC_TABLES, gaNum, effectiveSex) : null;

  const wPct  = wRow  ? estimatePercentile(wNum,  wRow)  : null;
  const lPct  = lRow  ? estimatePercentile(lNum,  lRow)  : null;
  const hcPct = hcRow ? estimatePercentile(hcNum, hcRow) : null;

  const inputClass = 'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:text-slate-200';
  const labelClass = 'block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1';

  return (
    <div className="space-y-4">
      {/* ── Inputs ── */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-4">

        {/* Edad gestacional */}
        <div>
          <label className={labelClass}>Edad gestacional al nacer (semanas completas)</label>
          <input
            type="number" inputMode="numeric" min={24} max={42}
            value={ga} onChange={(e) => setGa(e.target.value)}
            placeholder="24 – 42"
            className={inputClass}
          />
        </div>

        {/* Sexo */}
        {needsSex && (
          <div>
            <label className={labelClass}>Sexo</label>
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

        {gaValid && gaNum <= 32 && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Para &lt; 33 semanas se usan estándares combinados (sin diferenciación por sexo).
          </p>
        )}

        {/* Peso */}
        <div>
          <label className={labelClass}>Peso al nacer (gramos)</label>
          <input
            type="number" inputMode="numeric" min={100} max={8000}
            value={weight} onChange={(e) => setWeight(e.target.value)}
            placeholder="ej. 1250"
            className={inputClass}
          />
        </div>

        {/* Medidas adicionales */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-4">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
            Medidas adicionales (opcional)
          </p>

          <div>
            <label className={labelClass}>Longitud (cm)</label>
            <input
              type="number" inputMode="decimal" min={20} max={65} step={0.1}
              value={length} onChange={(e) => setLength(e.target.value)}
              placeholder="ej. 38.5"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Perímetro cefálico (cm)</label>
            <input
              type="number" inputMode="decimal" min={10} max={50} step={0.1}
              value={hc} onChange={(e) => setHc(e.target.value)}
              placeholder="ej. 27.5"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* ── Resultado peso ── */}
      {wRow && wPct !== null && (
        <MeasurementResult
          title="Peso al nacer"
          displayValue={`${wNum.toFixed(0)} g`}
          row={wRow}
          percentile={wPct}
          unit="g"
        />
      )}

      {/* ── Resultado longitud ── */}
      {lRow && lPct !== null && (
        <MeasurementResult
          title="Longitud"
          displayValue={`${lNum.toFixed(1)} cm`}
          row={lRow}
          percentile={lPct}
          unit=" cm"
        />
      )}

      {/* ── Resultado perímetro cefálico ── */}
      {hcRow && hcPct !== null && (
        <MeasurementResult
          title="Perímetro cefálico"
          displayValue={`${hcNum.toFixed(1)} cm`}
          row={hcRow}
          percentile={hcPct}
          unit=" cm"
        />
      )}

      {/* Fuente */}
      <p className="text-xs text-slate-400 dark:text-slate-500 text-center px-2">
        INTERGROWTH-21st Newborn Size Standards · intergrowth21st.org.uk
      </p>
    </div>
  );
}
