import { sponsors } from '../data/sponsors';

// Franja fina bajo el header: "Con el apoyo de ..." o, si no hay apoyos cargados, el espacio reservado con contacto.
export default function SponsorStrip() {
  if (sponsors.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Espacio para apoyo institucional</span>
        <a
          href="mailto:info@dastudio.com.ar?subject=Apoyo%20a%20NeoCalcu"
          className="text-[10px] font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-400 hover:underline"
        >
          Contactar
        </a>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap px-3 py-1 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Con el apoyo de</span>
      {sponsors.map(sp => {
        const content = sp.logo ? (
          <img src={sp.logo} alt={sp.name} className="h-5 w-auto object-contain" />
        ) : (
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{sp.name}</span>
        );
        return sp.url ? (
          <a key={sp.name} href={sp.url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
            {content}
          </a>
        ) : (
          <span key={sp.name}>{content}</span>
        );
      })}
    </div>
  );
}
