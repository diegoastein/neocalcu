import { useState, useRef } from 'react';
import { useMembership } from '../context/MembershipContext';

const STORAGE_KEY = 'neo_procedure_notes';

function loadNotes(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveNote(procedureId: string, text: string) {
  const all = loadNotes();
  if (text.trim()) {
    all[procedureId] = text;
  } else {
    delete all[procedureId];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export default function ProcedureNotes({ procedureId }: { procedureId: string }) {
  const { active: isPremium } = useMembership();
  const [text, setText] = useState(() => loadNotes()[procedureId] || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function adjustHeight(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    adjustHeight(e.target);
  }

  function handleBlur() {
    saveNote(procedureId, text);
  }

  if (!isPremium) {
    return (
      <div className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border-2 border-dashed border-slate-300 dark:border-slate-600 select-none">
        <div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Notas</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Anotaciones varias, adaptaciones a los protocolos del servicio, etc.</p>
        </div>
        <div className="flex flex-col items-center gap-1 ml-3">
          <div className="bg-brand-700 dark:bg-brand-600 rounded-lg p-2">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <span className="text-xs font-bold text-brand-700 dark:text-brand-400 whitespace-nowrap">Suscriptores</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        Notas
      </p>
      <textarea
        ref={textareaRef}
        rows={1}
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Anotaciones varias, adaptaciones a los protocolos del servicio, etc."
        className="w-full resize-none overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
      />
    </div>
  );
}
