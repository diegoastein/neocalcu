const STORAGE_KEY = 'neo_calc_history';
const MAX_ENTRIES = 20;

export interface HistoryEntry {
  id: string;
  timestamp: number;
  drugId: string;
  drugName: string;
  weightGrams: number;
  doseTotal: number;
  volumeMl: number;
  unit: string;
  nursingInstruction: string;
}

export function getHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch { return []; }
}

export function addHistoryEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>) {
  const history = getHistory();
  const last = history[0];
  if (last && last.drugId === entry.drugId && last.weightGrams === entry.weightGrams) return;
  const newEntry: HistoryEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newEntry, ...history].slice(0, MAX_ENTRIES)));
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

export function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return new Date(ts).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}
