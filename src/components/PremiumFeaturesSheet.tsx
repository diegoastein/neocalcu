import { useEffect, useState } from 'react';

interface Props {
  onSubscribe: () => void;
  onDismiss: () => void;
}


const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
    label: 'Kit del Paciente Crítico',
    description: 'TET, accesos vasculares, PHP, surfactante, cafeína, inotrópicos y antibióticos calculados para el peso y EG del paciente.',
    available: true,
    isNew: true,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5l3 3 3-3m0 0l-3-3m3 3H3m9-9h9m-4.5-3l3 3-3 3" />
      </svg>
    ),
    label: 'Tabla de velocidades de inotrópicos',
    description: 'Flujos en mL/h para cada combinación de dosis × volumen.',
    available: true,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    label: 'Hasta 4 pacientes simultáneos',
    description: 'Cambiá entre pacientes sin perder los datos de ninguno.',
    available: true,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
      </svg>
    ),
    label: 'Exportar resultados de cálculo',
    description: 'Exportá el resultado de cualquier cálculo como texto para copiarlo o compartirlo.',
    available: true,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
    label: 'Notas en procedimientos',
    description: 'Agregá notas propias a cada procedimiento para adaptarlos al protocolo de tu servicio.',
    available: true,
    isNew: false,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    label: 'Calculadora de Nutrición Parenteral',
    description: 'VIG, proteínas g/kg/día, lípidos y volumen total en un solo cálculo.',
    available: false,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    label: 'Fichas completas de medicamentos',
    description: 'Diluciones, estabilidad, reconstitución y compatibilidades IV.',
    available: false,
  },
];

export default function PremiumFeaturesSheet({ onSubscribe, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 280);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${visible ? 'opacity-50' : 'opacity-0'}`}
        onClick={handleDismiss}
      />

      {/* Sheet */}
      <div
        className={`relative bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '82vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Cerrar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-2">
          {/* Header */}
          <div className="flex flex-col items-center text-center pt-2 pb-5">
            <div className="w-14 h-14 rounded-2xl bg-brand-700 flex items-center justify-center mb-3 shadow-lg">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">NeoCalcu Pro</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              Accedé al conjunto completo de herramientas clínicas de NeoCalcu.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-3 mb-3">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className={`shrink-0 mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center ${
                  f.available
                    ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                }`}>
                  {f.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-semibold ${f.isNew ? 'text-amber-700 dark:text-amber-300' : 'text-slate-800 dark:text-slate-100'}`}>{f.label}</span>
                    {f.isNew ? (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-semibold shrink-0 animate-pulse">
                        ✦ Nuevo
                      </span>
                    ) : f.available ? (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 font-medium shrink-0">
                        Disponible
                      </span>
                    ) : (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 font-medium shrink-0">
                        Próximamente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{f.description}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="text-xs text-slate-400 dark:text-slate-500 text-center pb-4">
            Y más funciones en camino.
          </p>
        </div>

        {/* CTA — fixed at bottom */}
        <div className="shrink-0 px-5 pt-3 pb-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="mb-2">
            <button
              onClick={onSubscribe}
              className="w-full bg-brand-700 hover:bg-brand-800 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
            >
              Ver planes de suscripción
            </button>
          </div>
          <button
            onClick={handleDismiss}
            className="w-full text-xs text-slate-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors py-1"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}
