import { useState } from 'react';

interface FinnceganItem {
  id: string;
  name: string;
  values: { score: number; label: string }[];
}

interface FinnceganSection {
  id: string;
  name: string;
  items: FinnceganItem[];
}

const SECTIONS: FinnceganSection[] = [
  {
    id: 'snc',
    name: 'Sistema nervioso central',
    items: [
      {
        id: 'llanto',
        name: 'Llanto',
        values: [
          { score: 0, label: 'Sin llanto excesivo' },
          { score: 2, label: 'Agudo y excesivo' },
          { score: 3, label: 'Agudo continuo e inconsolable' },
        ],
      },
      {
        id: 'sueno',
        name: 'Sueño tras alimentación',
        values: [
          { score: 0, label: 'Duerme > 3 h' },
          { score: 1, label: 'Duerme 2–3 h' },
          { score: 2, label: 'Duerme 1–2 h' },
          { score: 3, label: 'Duerme < 1 h' },
        ],
      },
      {
        id: 'moro',
        name: 'Reflejo de Moro',
        values: [
          { score: 0, label: 'Normal' },
          { score: 2, label: 'Hiperactivo' },
          { score: 3, label: 'Muy hiperactivo y sostenido' },
        ],
      },
      {
        id: 'temblores_perturbado',
        name: 'Temblores (al perturbar)',
        values: [
          { score: 0, label: 'Ausente' },
          { score: 1, label: 'Leves' },
          { score: 2, label: 'Moderados a severos' },
        ],
      },
      {
        id: 'temblores_espontaneo',
        name: 'Temblores (espontáneos)',
        values: [
          { score: 0, label: 'Ausente' },
          { score: 3, label: 'Leves' },
          { score: 4, label: 'Moderados a severos' },
        ],
      },
      {
        id: 'tono',
        name: 'Tono muscular',
        values: [
          { score: 0, label: 'Normal' },
          { score: 2, label: 'Hipertonía' },
        ],
      },
      {
        id: 'excoriaciones',
        name: 'Excoriaciones (mentón, rodillas, codos, nariz)',
        values: [
          { score: 0, label: 'Ausentes' },
          { score: 1, label: 'Presentes' },
        ],
      },
      {
        id: 'mioclonias',
        name: 'Mioclonías',
        values: [
          { score: 0, label: 'Ausentes' },
          { score: 3, label: 'Presentes' },
        ],
      },
      {
        id: 'convulsiones',
        name: 'Convulsiones generalizadas',
        values: [
          { score: 0, label: 'Ausentes' },
          { score: 5, label: 'Presentes' },
        ],
      },
    ],
  },
  {
    id: 'mvr',
    name: 'Metabólico / Vasomotor / Respiratorio',
    items: [
      {
        id: 'sudoracion',
        name: 'Sudoración',
        values: [
          { score: 0, label: 'Ausente' },
          { score: 1, label: 'Presente' },
        ],
      },
      {
        id: 'fiebre',
        name: 'Fiebre',
        values: [
          { score: 0, label: 'Ausente (< 37.8 °C)' },
          { score: 1, label: '37.8–38.3 °C' },
          { score: 2, label: '> 38.3 °C' },
        ],
      },
      {
        id: 'bostezos',
        name: 'Bostezos frecuentes',
        values: [
          { score: 0, label: '< 3 / evaluación' },
          { score: 1, label: '≥ 3 / evaluación' },
        ],
      },
      {
        id: 'moteado',
        name: 'Piel moteada',
        values: [
          { score: 0, label: 'Ausente' },
          { score: 1, label: 'Presente' },
        ],
      },
      {
        id: 'congestion',
        name: 'Congestión nasal',
        values: [
          { score: 0, label: 'Ausente' },
          { score: 1, label: 'Presente' },
        ],
      },
      {
        id: 'estornudos',
        name: 'Estornudos frecuentes',
        values: [
          { score: 0, label: '< 3 / evaluación' },
          { score: 1, label: '≥ 3 / evaluación' },
        ],
      },
      {
        id: 'aleteo',
        name: 'Aleteo nasal',
        values: [
          { score: 0, label: 'Ausente' },
          { score: 2, label: 'Presente' },
        ],
      },
      {
        id: 'taquipnea',
        name: 'Taquipnea',
        values: [
          { score: 0, label: 'FR ≤ 60 / min' },
          { score: 1, label: 'FR > 60 / min sin retracción' },
          { score: 2, label: 'FR > 60 / min con retracción' },
        ],
      },
    ],
  },
  {
    id: 'gi',
    name: 'Gastrointestinal',
    items: [
      {
        id: 'succion',
        name: 'Succión excesiva',
        values: [
          { score: 0, label: 'Ausente' },
          { score: 1, label: 'Presente' },
        ],
      },
      {
        id: 'mamar',
        name: 'Dificultad para mamar',
        values: [
          { score: 0, label: 'Normal' },
          { score: 2, label: 'Pobre / incoordinada' },
        ],
      },
      {
        id: 'regurgitacion',
        name: 'Regurgitación',
        values: [
          { score: 0, label: 'Ausente' },
          { score: 2, label: 'Presente' },
        ],
      },
      {
        id: 'vomitos',
        name: 'Vómitos en proyectil',
        values: [
          { score: 0, label: 'Ausentes' },
          { score: 3, label: 'Presentes' },
        ],
      },
      {
        id: 'deposiciones',
        name: 'Deposiciones',
        values: [
          { score: 0, label: 'Normales' },
          { score: 2, label: 'Blandas' },
          { score: 3, label: 'Líquidas / acuosas' },
        ],
      },
    ],
  },
];

const ALL_ITEMS = SECTIONS.flatMap((s) => s.items);

const SECTION_COLORS: Record<string, { bg: string; text: string }> = {
  snc: {
    bg: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800',
    text: 'text-purple-800 dark:text-purple-300',
  },
  mvr: {
    bg: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-300',
  },
  gi: {
    bg: 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800',
    text: 'text-orange-800 dark:text-orange-300',
  },
};

const SCORE_COLORS: Record<string, string> = {
  green: 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700 text-green-900 dark:text-green-200',
  yellow: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-700 text-yellow-900 dark:text-yellow-200',
  red: 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700 text-red-900 dark:text-red-200',
};

interface Props {
  references: string[];
}

export default function FinnceganCalculator({ references }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const total = Object.values(answers).reduce((a, b) => a + b, 0);
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === ALL_ITEMS.length;

  const getScoreLevel = () => {
    if (total < 8) return 'green';
    if (total < 13) return 'yellow';
    return 'red';
  };

  const getInterpretation = () => {
    if (total < 8) return {
      label: 'Sin abstinencia / abstinencia mínima',
      action: 'No requiere tratamiento farmacológico. Continuar evaluaciones cada 4 h. Optimizar manejo no farmacológico.',
    };
    if (total < 13) return {
      label: 'Abstinencia moderada',
      action: 'Manejo no farmacológico: reducir estímulos, swaddling, lactancia materna o donante, succión no nutritiva. Reevaluar en 2 h. Iniciar farmacológico si 2 puntajes consecutivos ≥ 8.',
    };
    return {
      label: 'Abstinencia severa',
      action: 'Iniciar tratamiento farmacológico según protocolo institucional (morfina, metadona o buprenorfina). Considerar clonidina como adyuvante. Notificar al equipo.',
    };
  };

  const level = getScoreLevel();
  const interpretation = allAnswered ? getInterpretation() : null;

  return (
    <div className="space-y-4">
      {/* Puntaje total */}
      <div className={`rounded-xl border-2 p-4 flex items-center justify-between ${SCORE_COLORS[level]}`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Puntaje total</p>
          <p className="text-5xl font-bold leading-none mt-1">{total}</p>
          <p className="text-xs opacity-60 mt-2">{answeredCount} / {ALL_ITEMS.length} ítems respondidos</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium opacity-70">
            {level === 'green' && '0–7'}
            {level === 'yellow' && '8–12'}
            {level === 'red' && '≥ 13'}
          </p>
          <p className="text-sm font-bold mt-0.5">
            {level === 'green' && 'Sin abstinencia'}
            {level === 'yellow' && 'Moderada'}
            {level === 'red' && 'Severa'}
          </p>
        </div>
      </div>

      {/* Secciones de ítems */}
      {SECTIONS.map((section) => {
        const colors = SECTION_COLORS[section.id];
        return (
          <div key={section.id} className={`rounded-xl border p-4 space-y-3 ${colors.bg}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wide ${colors.text}`}>
              {section.name}
            </h3>
            {section.items.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-3"
              >
                <div className="flex justify-between items-center gap-2 mb-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                  {answers[item.id] !== undefined && (
                    <span className="text-sm font-bold text-brand-800 dark:text-brand-300 bg-brand-50 dark:bg-slate-800 px-2 py-0.5 rounded flex-shrink-0">
                      {answers[item.id]} pts
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {item.values.map((val) => (
                    <label key={val.score} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={item.id}
                        value={val.score}
                        checked={answers[item.id] === val.score}
                        onChange={() => setAnswers({ ...answers, [item.id]: val.score })}
                        className="w-4 h-4 text-brand-800 focus:ring-brand-500 flex-shrink-0"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">{val.label}</span>
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500 flex-shrink-0 w-10 text-right">
                        {val.score} pts
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {/* Interpretación */}
      {allAnswered && interpretation && (
        <div className={`rounded-xl border-2 p-4 ${SCORE_COLORS[level]}`}>
          <p className="font-bold text-base mb-2">{interpretation.label}</p>
          <p className="text-sm leading-relaxed">{interpretation.action}</p>
        </div>
      )}

      {/* Guía de umbrales */}
      <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">
          Umbrales clínicos
        </p>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-600 dark:text-slate-400">Sin abstinencia / mínima</span>
            <span className="text-xs font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded-full">
              0–7
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-600 dark:text-slate-400">Moderada — manejo no farmacológico</span>
            <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900 px-2 py-0.5 rounded-full">
              8–12
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-600 dark:text-slate-400">Severa — iniciar tratamiento</span>
            <span className="text-xs font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900 px-2 py-0.5 rounded-full">
              ≥ 13
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
          Evaluar cada 4 h (o cada 2 h si puntaje 8–12). Muchos protocolos requieren 2 evaluaciones consecutivas ≥ 8 para iniciar tratamiento farmacológico, o puntaje único ≥ 13.
        </p>
      </div>

      {/* Botón limpiar */}
      {Object.keys(answers).length > 0 && (
        <button
          onClick={() => setAnswers({})}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-sm"
        >
          Limpiar evaluación
        </button>
      )}

      {references.length > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          <span className="font-medium">Referencias:</span> {references.join(' • ')}
        </p>
      )}
    </div>
  );
}
