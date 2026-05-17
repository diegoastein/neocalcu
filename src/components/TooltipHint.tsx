interface TooltipHintProps {
  text: string;
  onDismiss: () => void;
}

export default function TooltipHint({ text, onDismiss }: TooltipHintProps) {
  return (
    <div className="mx-3 my-2 flex items-start gap-2.5 bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth={1.8}
        stroke="currentColor"
        className="w-4 h-4 text-brand-600 dark:text-brand-400 mt-0.5 shrink-0"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
      <p className="flex-1 text-xs text-brand-900 dark:text-slate-200 leading-relaxed">{text}</p>
      <button
        onClick={onDismiss}
        className="shrink-0 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:text-brand-900 dark:hover:text-brand-200 transition px-1.5 py-0.5 rounded"
        aria-label="Cerrar tip"
      >
        Entendido
      </button>
    </div>
  );
}
