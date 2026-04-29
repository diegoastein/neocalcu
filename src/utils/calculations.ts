import { Patient, DosingRule, InfusionRule, DrugPreparation } from '../types';

export function matchDosingRule(rules: DosingRule[], patient: Patient): DosingRule | undefined {
  return rules.find((rule) => {
    if (rule.gaMin !== undefined && patient.gestAgeWeeks !== undefined && patient.gestAgeWeeks < rule.gaMin) {
      return false;
    }
    if (rule.gaMax !== undefined && patient.gestAgeWeeks !== undefined && patient.gestAgeWeeks >= rule.gaMax) {
      return false;
    }
    if (rule.dolMin !== undefined && patient.dayOfLife !== undefined && patient.dayOfLife < rule.dolMin) {
      return false;
    }
    if (rule.dolMax !== undefined && patient.dayOfLife !== undefined && patient.dayOfLife >= rule.dolMax) {
      return false;
    }
    if (rule.weightMinG !== undefined && patient.weightGrams < rule.weightMinG) {
      return false;
    }
    if (rule.weightMaxG !== undefined && patient.weightGrams >= rule.weightMaxG) {
      return false;
    }
    return true;
  });
}

interface DoseCalculation {
  doseTotal: number;
  volumeMl: number;
  nursingInstruction: string;
}

export function calcDose(
  rule: DosingRule,
  preparation: DrugPreparation,
  weightGrams: number,
): DoseCalculation {
  const weightKg = weightGrams / 1000;
  const doseTotal = rule.dosePerKg * weightKg;
  const volumeMl = doseTotal / preparation.concentrationMgMl;

  return {
    doseTotal: parseFloat(doseTotal.toFixed(2)),
    volumeMl: parseFloat(volumeMl.toFixed(2)),
    nursingInstruction: `${doseTotal.toFixed(2)} mg (${volumeMl.toFixed(2)} mL) ${rule.frequency}`,
  };
}

interface RuleOf3Preparation {
  mg: number;
  volumeMl: number;
  concentration: string;
  velocityPerMcg: string;
}

export function calcRuleOf3(infusionRule: InfusionRule, weightKg: number): RuleOf3Preparation | null {
  const ruleOf3 = infusionRule.ruleOf3;
  if (!ruleOf3) return null;

  const mg = ruleOf3.multiplier * weightKg;
  const concentration = `${mg.toFixed(1)} mg en ${ruleOf3.volumeMl} mL`;
  const velocityPerMcg = `1 mL/h = ${(ruleOf3.multiplier / ruleOf3.volumeMl).toFixed(3)} mcg/kg/min`;

  return {
    mg: parseFloat(mg.toFixed(1)),
    volumeMl: ruleOf3.volumeMl,
    concentration,
    velocityPerMcg,
  };
}

interface InfusionVelocity {
  volumeMlPerHour: number;
  instruction: string;
}

export function calcInfusionVelocity(
  doseMcgPerKgPerMin: number,
  weightKg: number,
  concentrationMcgMl: number,
): InfusionVelocity {
  const numerator = doseMcgPerKgPerMin * weightKg * 60;
  const volumeMlPerHour = numerator / concentrationMcgMl;

  return {
    volumeMlPerHour: parseFloat(volumeMlPerHour.toFixed(2)),
    instruction: `${volumeMlPerHour.toFixed(2)} mL/h`,
  };
}
