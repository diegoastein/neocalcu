import data from '../../docs/clinical_knowledge.json';
import { Score } from '../types';

export const scores: Score[] = data.scores as Score[];

export function getScoreById(id: string): Score | undefined {
  return scores.find((s) => s.id === id);
}
