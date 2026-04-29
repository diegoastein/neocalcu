import data from '../../docs/clinical_knowledge.json';
import { Drug } from '../types';

export const drugs: Drug[] = data.drugs;

export function getDrugById(id: string): Drug | undefined {
  return drugs.find((d) => d.id === id);
}

export function searchDrugs(query: string): Drug[] {
  const q = query.toLowerCase();
  return drugs.filter(
    (d) =>
      d.name.toLowerCase().includes(q) ||
      d.genericName?.toLowerCase().includes(q) ||
      d.indications.some((ind) => ind.toLowerCase().includes(q)),
  );
}
