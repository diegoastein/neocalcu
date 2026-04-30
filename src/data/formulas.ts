import data from '../../docs/clinical_knowledge.json';
import { Formula } from '../types';

export const formulas: Formula[] = data.formulas as Formula[];

export function getFormulaById(id: string): Formula | undefined {
  return formulas.find((f) => f.id === id);
}
