export interface Patient {
  weightGrams: number;
  gestAgeWeeks?: number;
  dayOfLife?: number;
}

export type DrugCategory =
  | 'antibiotico'
  | 'antiviral'
  | 'antifungico'
  | 'cardiovascular'
  | 'analgesico_sedante'
  | 'diuretico'
  | 'surfactante'
  | 'respiratorio'
  | 'emergencia'
  | 'vitaminas_electrolitos';

export interface DosingRule {
  label: string;
  gaMin?: number;
  gaMax?: number;
  dolMin?: number;
  dolMax?: number;
  weightMinG?: number;
  weightMaxG?: number;
  dosePerKg: number;
  unit: string;
  frequency: string;
  routes: string[];
  maxDoseTotal?: number;
  notes?: string;
}

export interface InfusionRule {
  label: string;
  doseMin: number;
  doseMax: number;
  startDose: number;
  unit: 'mcg/kg/min' | 'mcg/kg/h' | 'mg/kg/h';
  ruleOf3?: {
    multiplier: number;
    volumeMl: number;
    diluent: string;
  };
  notes?: string;
}

export interface DrugPreparation {
  stockForm: string;
  reconstitution?: string;
  concentrationMgMl: number;
  diluent: string;
  dilutionInstructions: string[];
  stability?: string;
  lightSensitive?: boolean;
}

export interface Drug {
  id: string;
  name: string;
  genericName?: string;
  category: DrugCategory[];
  indications: string[];
  dosingRules?: DosingRule[];
  infusionRules?: InfusionRule[];
  preparation: DrugPreparation;
  administration: {
    routes: string[];
    ivRate?: string;
    imNotes?: string;
    compatibleWith?: string[];
    incompatibleWith?: string[];
  };
  monitoring?: string[];
  adverseEffects?: string[];
  contraindications?: string[];
  references: string[];
}

export type ProcedureCategory = 'cateter' | 'via_aerea' | 'calculo' | 'fluidos';

export interface ProcedureFormula {
  label: string;
  description: string;
  formula: string;
  variableLabel: string;
  variableUnit: string;
  resultUnit: string;
  calculate: (input: number) => number;
  reference?: string;
}

export interface ProcedureStep {
  step: string;
  note?: string;
}

export interface Procedure {
  id: string;
  name: string;
  category: ProcedureCategory;
  description: string;
  formulas?: ProcedureFormula[];
  steps?: ProcedureStep[];
  materials?: string[];
  warnings?: string[];
  references: string[];
}

export type ScoreItemValue = {
  score: number;
  label: string;
  description?: string;
};

export interface ScoreItem {
  id: string;
  name: string;
  values: ScoreItemValue[];
}

export interface ScoreInterpretation {
  min: number;
  max: number;
  label: string;
  action: string;
  color: 'green' | 'yellow' | 'orange' | 'red';
}

export interface Score {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  items: ScoreItem[];
  interpretation: ScoreInterpretation[];
  minScore: number;
  maxScore: number;
  references: string[];
}

export interface FormulaInput {
  id: string;
  label: string;
  unit: string;
  required: boolean;
}

export interface Formula {
  id: string;
  name: string;
  description: string;
  inputs: FormulaInput[];
  formula: string;
  resultLabel: string;
  resultUnit: string;
  notes?: string;
  reference: string;
}

export type ActivePage = 'medicamentos' | 'procedimientos' | 'indices' | 'favoritos' | 'formulas';
