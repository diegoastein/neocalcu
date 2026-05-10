import data from '../../docs/clinical_knowledge.json';
import { LabCategory } from '../types';

export const labCategories: LabCategory[] = (data as any).laboratory as LabCategory[];
