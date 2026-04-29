import data from '../../docs/clinical_knowledge.json';
import { Procedure } from '../types';

export const procedures: Procedure[] = data.procedures;

export function getProcedureById(id: string): Procedure | undefined {
  return procedures.find((p) => p.id === id);
}
