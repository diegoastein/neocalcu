import { drugs, drugCategoryLabels } from '../data/medications';
import { procedures } from '../data/procedures';
import { scores } from '../data/scores';
import { formulas } from '../data/formulas';
import { labCategories } from '../data/laboratory';

export type GlobalSearchResultType = 'drug' | 'procedure' | 'calculadora' | 'laboratorio';

export interface GlobalSearchResult {
  type: GlobalSearchResultType;
  id: string;
  title: string;
  subtitle?: string;
  isPremium?: boolean;
  /** Solo para resultados de laboratorio: a qué categoría pertenece el parámetro. */
  categoryId?: string;
}

/** Normaliza quitando acentos/diacríticos y pasando a minúsculas, para una búsqueda tolerante. */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function matchesQuery(normQuery: string, ...fields: Array<string | undefined>): boolean {
  return fields.some((field) => !!field && normalizeText(field).includes(normQuery));
}

const MIN_QUERY_LENGTH = 2;

export function searchGlobal(query: string): GlobalSearchResult[] {
  const q = normalizeText(query);
  if (q.length < MIN_QUERY_LENGTH) return [];

  const results: GlobalSearchResult[] = [];

  drugs.forEach((drug) => {
    const categoryLabels = drug.category.map((c) => drugCategoryLabels[c]);
    if (matchesQuery(q, drug.name, drug.genericName, ...drug.indications, ...categoryLabels)) {
      results.push({
        type: 'drug',
        id: drug.id,
        title: drug.name,
        subtitle: drug.genericName || categoryLabels[0],
      });
    }
  });

  procedures.forEach((procedure) => {
    if (matchesQuery(q, procedure.name, procedure.description)) {
      results.push({
        type: 'procedure',
        id: procedure.id,
        title: procedure.name,
        subtitle: procedure.description,
      });
    }
  });

  scores.forEach((score) => {
    if (matchesQuery(q, score.name, score.subtitle, score.description)) {
      results.push({
        type: 'calculadora',
        id: score.id,
        title: score.name,
        subtitle: score.subtitle,
        isPremium: score.isPremium,
      });
    }
  });

  formulas.forEach((formula) => {
    if (matchesQuery(q, formula.name, formula.description)) {
      results.push({
        type: 'calculadora',
        id: formula.id,
        title: formula.name,
        subtitle: formula.description,
        isPremium: formula.isPremium,
      });
    }
  });

  labCategories.forEach((category) => {
    category.parameters.forEach((param) => {
      if (matchesQuery(q, param.name, param.abbreviation, category.name)) {
        results.push({
          type: 'laboratorio',
          id: param.id,
          title: param.name,
          subtitle: category.name,
          isPremium: category.isPremium,
          categoryId: category.id,
        });
      }
    });
  });

  return results;
}
