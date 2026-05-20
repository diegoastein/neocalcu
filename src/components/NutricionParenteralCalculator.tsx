import { useState, useEffect } from 'react';
import { usePatient } from '../context/PatientContext';
import { useMembership } from '../context/MembershipContext';
import ShareResultButton from './ShareResultButton';

interface Props {
  reference: string;
}

const LOCK_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
  </svg>
);

function InputField({
  label, unit, value, onChange, min, max, step, hint,
}: {
  label: string; unit: string; value: number;
  onChange: (v: number) => void;
  min?: number; max?: number; step?: number; hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label} <span className="text-slate-400 font-normal">({unit})</span>
      </label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step ?? 0.1}
        onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v); }}
        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:text-slate-200"
      />
      {hint && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
}

function ResultCard({ label, value, unit, secondary }: { label: string; value: string; unit: string; secondary?: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800 rounded p-3">
      <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold text-brand-900 dark:text-brand-200">
        {value} <span className="text-sm font-normal">{unit}</span>
      </p>
      {secondary && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{secondary}</p>}
    </div>
  );
}

function WarnBanner({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded p-3">
      <span className="text-amber-500 text-base leading-none mt-0.5">⚠</span>
      <p className="text-xs text-amber-800 dark:text-amber-200">{text}</p>
    </div>
  );
}

export default function NutricionParenteralCalculator({ reference }: Props) {
  const { patient } = usePatient();
  const membership = useMembership();

  const weightKg = patient.weightGrams / 1000;

  const [peso, setPeso] = useState(weightKg > 0 ? weightKg : 1);
  const [volTotal, setVolTotal] = useState(100);
  const [flujGlucosa, setFlujGlucosa] = useState(6);
  const [concGlucosa, setConcGlucosa] = useState(10);
  const [proteinas, setProteinas] = useState(2.5);
  const [lipidos, setLipidos] = useState(2);
  const [na, setNa] = useState(3);
  const [k, setK] = useState(2);
  const [ca, setCa] = useState(1.5);
  const [p, setP] = useState(1.5);
  const [mg, setMg] = useState(0.15);

  useEffect(() => {
    if (weightKg > 0) setPeso(weightKg);
  }, [weightKg]);

  if (!membership.active) {
    return (
      <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 flex flex-col items-center gap-3 text-center">
        <div className="w-14 h-14 bg-brand-700 rounded-full flex items-center justify-center">
          {LOCK_ICON}
        </div>
        <p className="font-semibold text-slate-800 dark:text-slate-200">Función para suscriptores</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          La calculadora de NPT incluye flujo de glucosa, proteínas, lípidos, electrolitos y aporte calórico en tiempo real.
        </p>
      </div>
    );
  }

  // ── Cálculos ──────────────────────────────────────────────────────────────
  const volTotalDia = volTotal * peso;

  // Flujo de glucosa (mg/kg/min) = conc(g%) × vol(mL/h) × 10 / (peso × 6)
  // → vol_mL/h = flujoGlucosa × peso × 6 / (conc × 10)
  const volGlucosaH = (flujGlucosa * peso * 6) / (concGlucosa * 10);
  const volGlucosaDia = volGlucosaH * 24;

  // Aminoácidos — Aminoven 10% (0.1 g/mL)
  const volAA = proteinas * peso * 10;

  // Lípidos — Intralipid 20% (0.2 g/mL), en línea separada
  const volLipidos = lipidos * peso * 5;

  // Agua para completar el volumen base (lípidos van en línea separada)
  const volBase = volTotalDia - volLipidos;
  const volAgua = Math.max(0, volBase - volGlucosaDia - volAA);

  // Aporte calórico
  const kcalGlucosa = (flujGlucosa * peso * 1440 * 3.4) / 1000;
  const kcalAA = proteinas * peso * 4;
  const kcalLipidos = volLipidos * 2; // Intralipid 20% = 2 kcal/mL
  const kcalTotal = kcalGlucosa + kcalAA + kcalLipidos;
  const kcalKgDia = peso > 0 ? kcalTotal / peso : 0;
  const kcalNoProt = kcalGlucosa + kcalLipidos;

  // Electrolitos totales
  const naTot = na * peso;
  const kTot  = k  * peso;
  const caTot = ca * peso;
  const pTot  = p  * peso;
  const mgTot = mg * peso;

  // Advertencias clínicas
  const warnings: string[] = [];
  if (flujGlucosa < 4)  warnings.push('Flujo de glucosa < 4 mg/kg/min — riesgo de hipoglucemia.');
  if (flujGlucosa > 12) warnings.push('Flujo de glucosa > 12 mg/kg/min — riesgo de hiperglucemia. Titular con insulina si persiste.');
  if (proteinas > 4)    warnings.push('Proteínas > 4 g/kg/día — riesgo de azotemia. Monitorear urea y amonio.');
  if (lipidos > 3)      warnings.push('Lípidos > 3 g/kg/día — supera el límite recomendado para neonatos.');
  if (volGlucosaDia + volAA > volBase) warnings.push('El volumen de glucosa + AA supera el volumen base disponible. Reducir flujo, concentración de glucosa o macronutrientes.');

  const shareText = [
    'Nutrición Parenteral Total — NeoCalcu',
    `Peso: ${peso.toFixed(2)} kg`,
    '',
    'MACRONUTRIENTES',
    `Flujo de glucosa: ${flujGlucosa} mg/kg/min (D${concGlucosa}% ${volGlucosaDia.toFixed(0)} mL/día)`,
    `Aminoácidos 10%: ${volAA.toFixed(0)} mL/día (${proteinas} g/kg/día)`,
    `Lípidos 20%: ${volLipidos.toFixed(0)} mL/día (${lipidos} g/kg/día) — línea separada`,
    `Agua c.s.p.: ${volAgua.toFixed(0)} mL/día`,
    `Volumen base: ${volBase.toFixed(0)} mL/día | Total incl. lípidos: ${volTotalDia.toFixed(0)} mL/día`,
    '',
    'APORTE CALÓRICO',
    `Total: ${kcalTotal.toFixed(0)} kcal/día (${kcalKgDia.toFixed(0)} kcal/kg/día)`,
    `No proteicas: ${kcalNoProt.toFixed(0)} kcal/día`,
    '',
    'ELECTROLITOS',
    `Na: ${naTot.toFixed(1)} mEq/día | K: ${kTot.toFixed(1)} mEq/día`,
    `Ca: ${caTot.toFixed(1)} mmol/día | P: ${pTot.toFixed(1)} mmol/día | Mg: ${mgTot.toFixed(2)} mEq/día`,
  ].join('\n');

  return (
    <div className="space-y-5">

      {/* Paciente */}
      <section className="space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wide">Paciente</h3>
        <InputField label="Peso" unit="kg" value={peso} onChange={setPeso} min={0.3} max={10} step={0.05} hint="Se autocompleta con el peso ingresado arriba." />
      </section>

      {/* Macronutrientes */}
      <section className="space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wide">Macronutrientes</h3>
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Volumen total" unit="mL/kg/día" value={volTotal} onChange={setVolTotal} min={40} max={200} step={5} hint="60–150 según edad" />
          <InputField label="Flujo de glucosa" unit="mg/kg/min" value={flujGlucosa} onChange={setFlujGlucosa} min={1} max={20} step={0.5} hint="Inicio: 4–8" />
          <InputField label="Concentración glucosa" unit="%" value={concGlucosa} onChange={setConcGlucosa} min={5} max={25} step={5} hint="D5%, D10%, D12.5%..." />
          <InputField label="Proteínas" unit="g/kg/día" value={proteinas} onChange={setProteinas} min={0.5} max={5} step={0.5} hint="1.5–3.5 (Aminoven 10%)" />
          <InputField label="Lípidos" unit="g/kg/día" value={lipidos} onChange={setLipidos} min={0.5} max={4} step={0.5} hint="1–3 (Intralipid 20%)" />
        </div>
      </section>

      {/* Electrolitos */}
      <section className="space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wide">Electrolitos</h3>
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Sodio" unit="mEq/kg/día" value={na} onChange={setNa} min={0} max={8} step={0.5} hint="2–5" />
          <InputField label="Potasio" unit="mEq/kg/día" value={k} onChange={setK} min={0} max={5} step={0.5} hint="1–3" />
          <InputField label="Calcio" unit="mmol/kg/día" value={ca} onChange={setCa} min={0} max={4} step={0.25} hint="1.3–2" />
          <InputField label="Fósforo" unit="mmol/kg/día" value={p} onChange={setP} min={0} max={4} step={0.25} hint="1–2" />
          <InputField label="Magnesio" unit="mEq/kg/día" value={mg} onChange={setMg} min={0} max={1} step={0.05} hint="0.1–0.2" />
        </div>
      </section>

      {/* Advertencias */}
      {warnings.length > 0 && (
        <section className="space-y-2">
          {warnings.map((w) => <WarnBanner key={w} text={w} />)}
        </section>
      )}

      {/* Resultados — volúmenes */}
      <section className="space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wide">Resultados — Volúmenes</h3>
        <ResultCard
          label={`Glucosa D${concGlucosa}%`}
          value={volGlucosaDia.toFixed(0)}
          unit="mL/día"
          secondary={`${volGlucosaH.toFixed(1)} mL/h · flujo ${flujGlucosa} mg/kg/min`}
        />
        <ResultCard
          label="Aminoácidos 10% (Aminoven)"
          value={volAA.toFixed(0)}
          unit="mL/día"
          secondary={`${proteinas} g/kg/día · ${(proteinas * peso).toFixed(1)} g totales`}
        />
        <ResultCard
          label="Lípidos 20% (Intralipid) — línea separada"
          value={volLipidos.toFixed(0)}
          unit="mL/día"
          secondary={`${lipidos} g/kg/día · ${(lipidos * peso).toFixed(1)} g totales`}
        />
        <ResultCard
          label="Agua para inyección (c.s.p. volumen base)"
          value={volAgua.toFixed(0)}
          unit="mL/día"
        />
        <div className="bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-brand-800 rounded p-3 text-sm text-brand-900 dark:text-brand-200 space-y-1">
          <p><span className="font-semibold">Volumen base (bolsa NP):</span> {volBase.toFixed(0)} mL/día</p>
          <p><span className="font-semibold">Vol. total incl. lípidos:</span> {volTotalDia.toFixed(0)} mL/día · {volTotal} mL/kg/día</p>
        </div>
      </section>

      {/* Aporte calórico */}
      <section className="space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wide">Aporte Calórico</h3>
        <div className="bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800 rounded p-4">
          <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mb-2">Total</p>
          <p className="text-4xl font-bold text-brand-900 dark:text-brand-200">
            {kcalTotal.toFixed(0)} <span className="text-lg font-normal">kcal/día</span>
          </p>
          <p className="text-sm text-brand-700 dark:text-brand-300 mt-1">{kcalKgDia.toFixed(0)} kcal/kg/día</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Glucosa', val: kcalGlucosa },
            { label: 'Proteínas', val: kcalAA },
            { label: 'Lípidos', val: kcalLipidos },
          ].map(({ label, val }) => (
            <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{val.toFixed(0)}</p>
              <p className="text-xs text-slate-400">kcal/día</p>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-3 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Kcal no proteicas</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{kcalNoProt.toFixed(0)}</p>
            <p className="text-xs text-slate-400">kcal/día</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Relación NP/P</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {(proteinas * peso) > 0 ? (kcalNoProt / (proteinas * peso)).toFixed(0) : '—'}
            </p>
            <p className="text-xs text-slate-400">kcal NP / g proteína</p>
          </div>
        </div>
      </section>

      {/* Electrolitos totales */}
      <section className="space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wide">Electrolitos Totales</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Sodio',    val: naTot,  unit: 'mEq/día' },
            { label: 'Potasio', val: kTot,   unit: 'mEq/día' },
            { label: 'Calcio',  val: caTot,  unit: 'mmol/día' },
            { label: 'Fósforo', val: pTot,   unit: 'mmol/día' },
            { label: 'Magnesio',val: mgTot,  unit: 'mEq/día' },
          ].map(({ label, val, unit }) => (
            <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{val.toFixed(2)}</p>
              <p className="text-xs text-slate-400">{unit}</p>
            </div>
          ))}
        </div>
      </section>

      <ShareResultButton title="Nutrición Parenteral Total" text={shareText} />

      {/* Pie de fuentes */}
      <footer className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-1">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Fuentes</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">{reference}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Glucosa: 3.4 kcal/g · Proteínas: 4 kcal/g · Intralipid 20%: 2 kcal/mL · Aminoven 10%: 0.1 g/mL
        </p>
      </footer>
    </div>
  );
}
