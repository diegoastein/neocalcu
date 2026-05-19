import { usePatient } from '../context/PatientContext';
import { useMembership } from '../context/MembershipContext';

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function Section({ title, icon, children }: SectionProps) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300">
          {icon}
        </span>
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wide">
          {title}
        </h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

interface RowProps {
  label: string;
  value: string;
  sub?: string;
}

function Row({ label, value, sub }: RowProps) {
  return (
    <div className="flex items-baseline justify-between border-l-4 border-brand-400 pl-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-r-lg">
      <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
      <div className="text-right">
        <span className="text-base font-bold text-slate-900 dark:text-white">{value}</span>
        {sub && <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">{sub}</span>}
      </div>
    </div>
  );
}

interface InotropicTableProps {
  label: string;
  prepLabel: string;
  rows: { dose: string; flow: string }[];
}

function InotropicTable({ label, prepLabel, rows }: InotropicTableProps) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden mb-2">
      <div className="bg-brand-50 dark:bg-brand-900/30 px-3 py-2 flex items-baseline justify-between">
        <span className="text-sm font-semibold text-brand-800 dark:text-brand-200">{label}</span>
        <span className="text-xs text-brand-600 dark:text-brand-400">Prep: {prepLabel}</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-100 dark:bg-slate-800">
            <th className="text-left px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400">Dosis (mcg/kg/min)</th>
            <th className="text-right px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400">Flujo (mL/h)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ dose, flow }) => (
            <tr key={dose} className="border-t border-slate-100 dark:border-slate-800">
              <td className="px-3 py-1.5 text-slate-700 dark:text-slate-300">{dose}</td>
              <td className="px-3 py-1.5 text-right font-bold text-slate-900 dark:text-white">{flow}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface PhpRow {
  dol: string;
  volMin: number;
  volMax: number;
  highlight?: boolean;
}

function PhpTable({ rows, weightKg }: { rows: PhpRow[]; weightKg: number }) {
  const vig = (volPerKg: number) => ((10 * volPerKg) / 144).toFixed(1);
  const goteo = (volPerKg: number) => ((volPerKg * weightKg) / 24).toFixed(1);
  const vol = (volPerKg: number) => Math.round(volPerKg * weightKg);

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden mb-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-100 dark:bg-slate-800">
            <th className="text-left px-2 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">Día</th>
            <th className="text-center px-2 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">mL/kg</th>
            <th className="text-center px-2 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">Vol total</th>
            <th className="text-center px-2 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">Flujo Dex10%</th>
            <th className="text-right px-2 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">Goteo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.dol}
              className={`border-t border-slate-100 dark:border-slate-800 ${row.highlight ? 'bg-brand-50 dark:bg-brand-900/20' : ''}`}
            >
              <td className={`px-2 py-1.5 font-medium ${row.highlight ? 'text-brand-700 dark:text-brand-300' : 'text-slate-700 dark:text-slate-300'}`}>
                {row.dol}
              </td>
              <td className="px-2 py-1.5 text-center text-slate-600 dark:text-slate-400">
                {row.volMin === row.volMax ? row.volMin : `${row.volMin}–${row.volMax}`}
              </td>
              <td className="px-2 py-1.5 text-center font-semibold text-slate-800 dark:text-slate-200">
                {row.volMin === row.volMax
                  ? `${vol(row.volMin)} mL`
                  : `${vol(row.volMin)}–${vol(row.volMax)} mL`}
              </td>
              <td className="px-2 py-1.5 text-center text-slate-600 dark:text-slate-400">
                {row.volMin === row.volMax
                  ? vig(row.volMin)
                  : `${vig(row.volMin)}–${vig(row.volMax)}`}
              </td>
              <td className="px-2 py-1.5 text-right font-bold text-slate-900 dark:text-white">
                {row.volMin === row.volMax
                  ? `${goteo(row.volMin)} mL/h`
                  : `${goteo(row.volMin)}–${goteo(row.volMax)} mL/h`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdmissionSummary() {
  const { patient } = usePatient();
  const membership = useMembership();

  if (!membership.active) {
    return (
      <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 flex flex-col items-center gap-3 text-center">
        <div className="w-10 h-10 rounded-full bg-brand-700 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-brand-800 dark:text-brand-200">Función para suscriptores</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          El Kit del Paciente Crítico calcula TET, accesos vasculares, surfactante, cafeína, PHP,
          inotrópicos y antibióticos según el peso y EG del paciente.
        </p>
      </div>
    );
  }

  if (!patient.weightGrams) {
    return (
      <div className="rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4 text-center">
        <p className="text-sm text-amber-700 dark:text-amber-300">Ingresá el peso del paciente para ver el Kit del Paciente Crítico.</p>
      </div>
    );
  }

  const weightKg = patient.weightGrams / 1000;
  const ga = patient.gestAgeWeeks;
  const dol = patient.dayOfLife ?? 0;

  // TET
  const tetSize = ga
    ? ga < 28 ? '2.5' : ga < 35 ? '3.0' : '3.5'
    : patient.weightGrams < 1000 ? '2.5' : patient.weightGrams < 2000 ? '3.0' : '3.5';
  const tetBasis = ga ? `EG ${ga} sem` : 'por peso (sin EG)';
  const tetFix = (weightKg + 6).toFixed(1);

  // Accesos vasculares
  const cav = (weightKg * 3 + 9).toFixed(1);
  const cvu = ((weightKg * 3 + 9) / 2 + 1).toFixed(1);

  // Cafeína (citrato 20 mg/mL)
  const cafLoadMg = (20 * weightKg).toFixed(0);
  const cafLoadVol = (20 * weightKg / 20).toFixed(1);
  const cafMaintMg = (5 * weightKg).toFixed(0);
  const cafMaintVol = (5 * weightKg / 20).toFixed(1);

  // Surfactantes
  const surfCuroMg = (200 * weightKg).toFixed(0);
  const surfCuroVol = (200 * weightKg / 80).toFixed(1);
  const surfSurvMg = (100 * weightKg).toFixed(0);
  const surfSurvVol = (100 * weightKg / 25).toFixed(1);
  const surfBabyMg = (100 * weightKg).toFixed(0);
  const surfBabyVol = (100 * weightKg / 30).toFixed(1);

  // PHP — filas de la tabla; se resalta la fila del DOL actual
  const phpRows: PhpRow[] = [
    { dol: 'Día 1', volMin: 60, volMax: 80, highlight: dol <= 1 },
    { dol: 'Día 2', volMin: 80, volMax: 100, highlight: dol === 2 },
    { dol: 'Día 3', volMin: 100, volMax: 120, highlight: dol === 3 },
    { dol: 'Día 4+', volMin: 120, volMax: 150, highlight: dol >= 4 },
  ];

  // Electrolitos (a partir del día 2-3)
  const naMinMl = ((2 * weightKg) / 3.4).toFixed(1);
  const naMaxMl = ((4 * weightKg) / 3.4).toFixed(1);
  const kMinMl = ((1 * weightKg) / 3).toFixed(1);
  const kMaxMl = ((2 * weightKg) / 3).toFixed(1);
  const showElecNote = dol <= 1;

  // Ampicilina (50 mg/mL)
  const ampMg = (50 * weightKg).toFixed(0);
  const ampVol = (50 * weightKg / 50).toFixed(1);
  const ampFreq =
    patient.weightGrams < 2000
      ? dol <= 7 ? 'c/12h' : 'c/8h'
      : dol <= 7 ? 'c/8h' : 'c/6h';

  // Gentamicina (10 mg/mL)
  const gentDosePerKg = !ga || ga < 30 ? 5 : ga < 35 ? 4.5 : 4;
  const gentFreq = !ga || ga < 30 ? 'c/48h' : ga < 35 ? 'c/36h' : 'c/24h';
  const gentMg = (gentDosePerKg * weightKg).toFixed(1);
  const gentVol = (gentDosePerKg * weightKg / 10).toFixed(1);

  // Penicilina G Acuosa (250.000 U/mL)
  const penDoseU = 50000 * weightKg;
  const penFreq =
    patient.weightGrams < 2000
      ? dol <= 7 ? 'c/12h' : 'c/8h'
      : dol <= 7 ? 'c/8h' : 'c/6h';
  const penVol = (penDoseU / 250000).toFixed(2);

  const noGA = !ga;

  return (
    <div className="space-y-1">
      {noGA && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mb-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2">
          Sin EG: TET calculado por peso. Gentamicina asume EG &lt;30 sem (dosis máxima de seguridad).
        </p>
      )}

      {/* VÍA AÉREA */}
      <Section
        title="Vía aérea"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 8V4m0 12l4-4m-4 4l-4-4" />
          </svg>
        }
      >
        <Row label={`TET (${tetBasis})`} value={`${tetSize} mm`} />
        <Row label="Fijación en labio" value={`${tetFix} cm`} sub="peso(kg) + 6" />
      </Section>

      {/* SURFACTANTE */}
      <Section
        title="Surfactante"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        }
      >
        <Row label="Curosurf 1ª dosis (200 mg/kg)" value={`${surfCuroMg} mg`} sub={`${surfCuroVol} mL`} />
        <Row label="Survanta (100 mg/kg)" value={`${surfSurvMg} mg`} sub={`${surfSurvVol} mL`} />
        <Row label="Baby Fact B (100 mg/kg)" value={`${surfBabyMg} mg`} sub={`${surfBabyVol} mL`} />
      </Section>

      {/* CAFEÍNA */}
      <Section
        title="Cafeína citrato"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
      >
        <Row label="Carga (20 mg/kg)" value={`${cafLoadMg} mg`} sub={`${cafLoadVol} mL IV en 30 min`} />
        <Row label="Mantenimiento (5 mg/kg/día)" value={`${cafMaintMg} mg/día`} sub={`${cafMaintVol} mL/día c/24h`} />
      </Section>

      {/* ACCESOS VASCULARES */}
      <Section
        title="Accesos vasculares"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        }
      >
        <Row label="CAV (catéter arterial)" value={`${cav} cm`} sub="peso×3+9" />
        <Row label="CVU (catéter venoso)" value={`${cvu} cm`} sub="(peso×3+9)/2+1" />
      </Section>

      {/* PHP */}
      <Section
        title="PHP — Plan de Hidratación Parenteral"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        }
      >
        <PhpTable rows={phpRows} weightKg={weightKg} />
        <p className="text-xs text-slate-500 dark:text-slate-400 px-1">
          Flujo calculado para Dextrosa 10%. Máx. 12,5% por vía periférica.
          {!ga || ga < 30 ? ' Prematuro extremo: considerar iniciar 80–100 mL/kg.' : ''}
        </p>

        {/* Electrolitos */}
        <div className="mt-3">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2 uppercase tracking-wide">
            Electrolitos{showElecNote ? ' (a partir del día 2–3)' : ''}
          </p>
          <Row
            label="Na⁺ 2–4 mEq/kg/día"
            value={`${(2 * weightKg).toFixed(1)}–${(4 * weightKg).toFixed(1)} mEq`}
            sub={`${naMinMl}–${naMaxMl} mL ClNa 20%`}
          />
          <Row
            label="K⁺ 1–2 mEq/kg/día"
            value={`${(1 * weightKg).toFixed(1)}–${(2 * weightKg).toFixed(1)} mEq`}
            sub={`${kMinMl}–${kMaxMl} mL ClK 3M`}
          />
          <p className="text-xs text-slate-400 dark:text-slate-500 px-1 mt-1">
            ClNa 20% = 3,4 mEq/mL · ClK 3M = 3 mEq/mL
          </p>
        </div>
      </Section>

      {/* INOTRÓPICOS */}
      <Section
        title="Inotrópicos"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        }
      >
        <InotropicTable
          label="Dopamina / Dobutamina"
          prepLabel={`${(3 * weightKg).toFixed(1)} mg en 50 mL`}
          rows={[2, 5, 7, 10, 15, 20].map(dose => ({ dose: `${dose}`, flow: dose.toFixed(1) }))}
        />
        <InotropicTable
          label="Adrenalina / Noradrenalina"
          prepLabel={`${(0.3 * weightKg).toFixed(2)} mg en 50 mL`}
          rows={[0.05, 0.1, 0.2, 0.3, 0.5, 1.0].map(dose => ({ dose: `${dose}`, flow: (dose * 10).toFixed(1) }))}
        />
        <InotropicTable
          label="Milrinona"
          prepLabel={`${(0.3 * weightKg).toFixed(2)} mg en 50 mL`}
          rows={[0.25, 0.375, 0.5, 0.75].map(dose => ({ dose: `${dose}`, flow: (dose * 10).toFixed(1) }))}
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 px-1 mt-1">
          Para ajuste fino de dosis y volumen, buscá la droga en la tab Medicamentos.
        </p>
      </Section>

      {/* ANTIBIÓTICOS */}
      <Section
        title="Antibióticos empíricos"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        }
      >
        <Row
          label={`Ampicilina 50 mg/kg ${ampFreq}`}
          value={`${ampMg} mg`}
          sub={`${ampVol} mL (50 mg/mL)`}
        />
        <Row
          label={`Gentamicina ${gentDosePerKg} mg/kg ${gentFreq}`}
          value={`${gentMg} mg`}
          sub={`${gentVol} mL (10 mg/mL)`}
        />
        <Row
          label={`Penicilina G acuosa 50.000 U/kg ${penFreq}`}
          value={`${Math.round(penDoseU).toLocaleString('es-AR')} U`}
          sub={`${penVol} mL (250.000 U/mL)`}
        />
        {noGA && (
          <p className="text-xs text-amber-600 dark:text-amber-400 pl-3">
            Gentamicina: dosis máxima (sin EG). Ajustar al confirmar edad gestacional.
          </p>
        )}
      </Section>
    </div>
  );
}
