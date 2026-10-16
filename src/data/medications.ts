import data from '../../docs/clinical_knowledge.json';
import { Drug, DrugCategory } from '../types';

export const drugs: Drug[] = data.drugs as Drug[];

export const drugCategoryLabels: Record<DrugCategory | 'otros', string> = {
  antibiotico: 'Antibióticos',
  antiviral: 'Antivirales',
  antifungico: 'Antifúngicos',
  cardiovascular: 'Cardiovascular',
  analgesico_sedante: 'Analgésicos y Sedantes',
  diuretico: 'Diuréticos',
  surfactante: 'Surfactantes',
  respiratorio: 'Respiratorio',
  emergencia: 'Emergencia',
  vitaminas_electrolitos: 'Vitaminas y Electrolitos',
  otros: 'Otros',
};

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
