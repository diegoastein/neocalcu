import { useState } from 'react';
import { useMembership } from '../context/MembershipContext';

interface Props {
  text: string;
  title?: string;
}

export default function ShareResultButton({ text, title = 'NeoCalcu' }: Props) {
  const { active: isPremium } = useMembership();
  const [feedback, setFeedback] = useState<'idle' | 'done'>('idle');

  if (!isPremium) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-600 select-none w-fit">
        <div className="bg-brand-700 dark:bg-brand-600 rounded p-1">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Compartir resultado</span>
        <span className="text-xs font-bold text-brand-700 dark:text-brand-400">Suscriptores</span>
      </div>
    );
  }

  async function handleShare() {
    if (feedback === 'done') return;
    try {
      if ('share' in navigator && typeof (navigator as Navigator & { share: unknown }).share === 'function') {
        await navigator.share({ title, text });
      } else {
        await (navigator as Navigator & { clipboard: Clipboard }).clipboard.writeText(text);
      }
      setFeedback('done');
      setTimeout(() => setFeedback('idle'), 2000);
    } catch {
      // usuario canceló el share sheet o sin permisos de clipboard
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-slate-800 text-brand-800 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-slate-700 transition text-xs font-semibold w-fit"
    >
      {feedback === 'done' ? (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          {'share' in navigator ? 'Compartido' : 'Copiado'}
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Compartir
        </>
      )}
    </button>
  );
}
