/**
 * Base data file for payroll calculations, optimized for Kenyan standards
 * Centralizes all base data and impacts the entire HR application
 * 
 * Base Reference Data (Example):
 * - Base Salary: 50,000 KES
 * - Seniority: 5 years
 * - Number of days/month: 26 days
 * - Housing Allowance: 10,000 KES
 * - Meal Allowance: 4,000 KES
 * - Transport Allowance: 5,000 KES
 * - Representation Allowance: 0 KES
 */

export interface PayrollCalculationParams {
  baseSalary: number;
  seniority: number;
  transportAllowance?: number;
  representationAllowance?: number;
  housingAllowance?: number;
  mealAllowance?: number;
  creditInterest?: number;
  otherDeductions?: number;
  daysWorked?: number;
  numberOfDeductions?: number;
}

export interface PayrollCalculationResult {
  earnings: {
    baseSalary: number;
    seniorityBonus: number;
    housingAllowance: number;
    mealAllowance: number;
    transportAllowance: number;
    representationAllowance: number;
    overtimePay?: number;
    exceptionalBonuses?: number;
    otherEarnings?: number;
    totalEarnings: number;
    bonuses: number;
  };
  grossSalary: number;
  taxableGrossSalary: number;
  employeeContributions: {
    nssfEmployee: number;
    shifEmployee: number;
    pensionEmployee: number;
    insuranceDiversifiedEmployee: number;
    optionalInsurances: number;
    totalEmployeeContributions: number;
    housingLevy: number;
  };
  employerContributions: {
    nssfEmployer: number;
    housingLevy: number;
    trainingLevy: number;
    shifEmployer: number;
    participationSHIF: number;
    workInjury: number;
    pensionEmployer: number;
    insuranceDiversifiedEmployer: number;
    totalEmployerContributions: number;
  };
  taxCalculation: {
    professionalExpenses: number;
    taxableNet: number;
    netTaxable: number;
    theoreticalTax: number;
    incomeTax: number;
    personalRelief: number;
  };
  otherDeductions: {
    mortgageCredit: number;
    consumerCredit: number;
    salaryAdvance: number;
    totalOtherDeductions: number;
  };
  totalDeductions: number;
  netSalaryPayable: number;
  totalEmployerCost: number;
}

// ===== BASE REFERENCE DATA =====
export const BASE_REFERENCE_DATA = {
  baseSalary: 50000,
  seniority: 5,
  numberOfDaysPerMonth: 26,
  seniorityRate: 0.05,
  seniorityBonus: 2500,
  housingAllowance: 10000,
  mealAllowance: 4000,
  transportAllowance: 5000,
  representationAllowance: 0,
  grossSalaryReference: 71500,
  creditInterest: 0,
  creditRepayment: 0
};

// ===== ALLOWANCE CEILINGS (Kenyan Standards) =====
export const ALLOWANCE_CEILINGS = {
  housing: {
    maxPercentage: 0.20,
    absoluteCeiling: 20000
  },
  meal: 4800,
  transport: 15000,
  representation: {
    maxPercentage: 0.10,
    absoluteCeiling: 10000
  }
};

// ===== RATES AND PERCENTAGES =====
export const CONTRIBUTION_RATES = {
  nssfEmployee: {
    taxRate: 0.06,
    ceiling: 72000  // Updated for 2025 UEL
  },
  shifEmployee: 0.0275,
  pensionEmployee: {
    taxRate: 0.06,
    ceiling: null,
    minimumThreshold: 6000
  },
  insuranceDiversifiedEmployee: {
    taxRate: 0.0125,
    minimumThreshold: 6000
  },
  nssfEmployer: 0.06,
  housingLevy: 0.015,
  trainingLevy: 0.01,
  shifEmployer: 0.0275,
  participationSHIF: 0.01,
  workInjury: 0.005,
  pensionEmployer: {
    taxRate: 0.06,
    minimumThreshold: 6000
  },
  insuranceDiversifiedEmployer: {
    taxRate: 0.0125,
    minimumThreshold: 6000
  },
  professionalExpenses: {
    taxRate: 0.20,
    ceiling: 2500,
    appliedAmount: 1987.07
  },
  taxDeductions: {
    creditInterest: {
      maxDeductionRate: 0.10,
      description: "Mortgage credit interest"
    },
    familyDeductions: {
      amountPerPerson: 2400,
      description: "Family deductions"
    }
  }
};

// ===== SENIORITY BONUS SCALE =====
export const SENIORITY_SCALE = [
  { min: 0, max: 2, rate: 0.00 },
  { min: 2, max: 5, rate: 0.05 },
  { min: 5, max: 12, rate: 0.10 },
  { min: 12, max: 20, rate: 0.15 },
  { min: 20, max: 25, rate: 0.20 },
  { min: 25, max: Infinity, rate: 0.25 }
];

// ===== INCOME TAX BRACKETS - MONTHLY BRACKETS (KRA 2025) =====
export const INCOME_TAX_BRACKETS = [
  { min: 0, max: 24000, rate: 0.10, deduction: 0 },
  { min: 24001, max: 32333, rate: 0.25, deduction: 2400 },
  { min: 32334, max: 500000, rate: 0.30, deduction: 3900 },
  { min: 500001, max: 800000, rate: 0.325, deduction: 13900 },
  { min: 800001, max: Infinity, rate: 0.35, deduction: 33900 }
];

// ===== CALCULATION FUNCTIONS =====

export function calculateSeniorityBonus(baseSalary: number, seniority: number): number {
  const bracket = SENIORITY_SCALE.find(t => seniority >= t.min && (t.max === Infinity || seniority < t.max));
  return bracket ? baseSalary * bracket.rate : 0;
}

export function calculateHousingAllowance(baseSalary: number, requestedAmount: number): number {
  const percentageCeiling = baseSalary * ALLOWANCE_CEILINGS.housing.maxPercentage;
  const absoluteCeiling = ALLOWANCE_CEILINGS.housing.absoluteCeiling;
  const effectiveCeiling = Math.min(percentageCeiling, absoluteCeiling);
  return Math.min(requestedAmount, effectiveCeiling);
}

export function calculateMealAllowance(requestedAmount: number): number {
  return Math.min(requestedAmount, ALLOWANCE_CEILINGS.meal);
}

export function calculateTransportAllowance(requestedAmount: number): number {
  return Math.min(requestedAmount, ALLOWANCE_CEILINGS.transport);
}

export function calculateRepresentationAllowance(baseSalary: number, requestedAmount: number): number {
  const percentageCeiling = baseSalary * ALLOWANCE_CEILINGS.representation.maxPercentage;
  const absoluteCeiling = ALLOWANCE_CEILINGS.representation.absoluteCeiling;
  const effectiveCeiling = Math.min(percentageCeiling, absoluteCeiling);
  return Math.min(requestedAmount, effectiveCeiling);
}

export function calculateGrossSalary(
  baseSalary: number,
  seniorityBonus: number,
  housingAllowance: number,
  mealAllowance: number,
  transportAllowance: number,
  representationAllowance: number
): number {
  return baseSalary + seniorityBonus + housingAllowance + mealAllowance + transportAllowance + representationAllowance;
}

export function calculateTaxableGrossSalary(
  grossSalary: number,
  mealAllowance: number,
  transportAllowance: number,
  representationAllowance: number
): number {
  return grossSalary - mealAllowance - transportAllowance - representationAllowance;
}

export function calculateNSSFContributions(grossSalary: number, taxableGrossSalary: number): {
  nssfEmployee: number;
  nssfEmployer: number;
  housingLevy: number;
  trainingLevy: number;
} {
  const ceilingBase = Math.min(grossSalary, CONTRIBUTION_RATES.nssfEmployee.ceiling);  // Use grossSalary for pensionable earnings
  return {
    nssfEmployee: ceilingBase * CONTRIBUTION_RATES.nssfEmployee.taxRate,
    nssfEmployer: ceilingBase * CONTRIBUTION_RATES.nssfEmployer,
    housingLevy: grossSalary * CONTRIBUTION_RATES.housingLevy,  // Use grossSalary
    trainingLevy: grossSalary * CONTRIBUTION_RATES.trainingLevy  // Use grossSalary
  };
}

export function calculateSHIFContributions(grossSalary: number): {  // Changed param to grossSalary
  employee: number;
  employer: number;
  participation: number;
} {
  const shifEmployee = grossSalary * CONTRIBUTION_RATES.shifEmployee;  // Removed cap, use grossSalary
  return {
    employee: shifEmployee,
    employer: grossSalary * CONTRIBUTION_RATES.shifEmployer,
    participation: grossSalary * CONTRIBUTION_RATES.participationSHIF
  };
}

export function calculatePensionContributions(taxableGrossSalary: number): {
  employee: number;
  employer: number;
} {
  if (taxableGrossSalary <= CONTRIBUTION_RATES.pensionEmployee.minimumThreshold) {
    return { employee: 0, employer: 0 };
  }
  return {
    employee: taxableGrossSalary * CONTRIBUTION_RATES.pensionEmployee.taxRate,
    employer: taxableGrossSalary * CONTRIBUTION_RATES.pensionEmployer.taxRate
  };
}

export function calculateDiversifiedInsurance(taxableGrossSalary: number): {
  employee: number;
  employer: number;
} {
  return {
    employee: taxableGrossSalary * CONTRIBUTION_RATES.insuranceDiversifiedEmployee.taxRate,
    employer: taxableGrossSalary * CONTRIBUTION_RATES.insuranceDiversifiedEmployer.taxRate
  };
}

export function calculateHousingLevy(grossSalary: number): number {  // Changed to grossSalary
  return grossSalary * CONTRIBUTION_RATES.housingLevy;
}

export function calculateTrainingLevy(grossSalary: number): number {  // Changed to grossSalary
  return grossSalary * CONTRIBUTION_RATES.trainingLevy;
}

export function calculateWorkInjury(taxableGrossSalary: number): number {
  return taxableGrossSalary * CONTRIBUTION_RATES.workInjury;
}

export function calculateProfessionalExpenses(taxableGrossSalary: number): number {
  const annualSalary = taxableGrossSalary * 12;
  if (annualSalary < 300000) {
    const monthlyCeiling = 30000 / 12;
    const percentage = taxableGrossSalary * 0.35;
    return Math.min(monthlyCeiling, percentage);
  } else {
    const monthlyCeiling = 35000 / 12;
    const percentage = taxableGrossSalary * 0.25;
    return Math.min(monthlyCeiling, percentage);
  }
}

export function calculateTaxableNet(
  taxableGrossSalary: number,
  nssfEmployee: number,
  shifEmployee: number,
  pensionEmployee: number,
  professionalExpenses: number,
  insuranceDiversifiedEmployee: number
): number {
  return taxableGrossSalary - nssfEmployee - shifEmployee - pensionEmployee - professionalExpenses - insuranceDiversifiedEmployee;
}

export function calculateNetTaxable(taxableNet: number, creditInterest: number): number {
  const maxDeduction = taxableNet * CONTRIBUTION_RATES.taxDeductions.creditInterest.maxDeductionRate;
  const appliedDeduction = Math.min(creditInterest, maxDeduction);
  return taxableNet - appliedDeduction;
}

export function calculateIncomeTax(netTaxable: number, daysWorked: number = 26, numberOfDeductions: number = 0): {
  incomeTax: number;
  personalRelief: number;
} {
  let incomeTax = 0;
  for (const bracket of INCOME_TAX_BRACKETS) {
    if (netTaxable > bracket.min && (bracket.max === Infinity || netTaxable <= bracket.max)) {
      incomeTax = (netTaxable * bracket.rate) - bracket.deduction;
      break;
    }
  }
  const proratedIncomeTax = incomeTax * (daysWorked / 26);
  const personalRelief = 2400 + (2400 * numberOfDeductions); // Base relief for employee + per dependent
  return {
    incomeTax: Math.max(0, proratedIncomeTax - personalRelief),
    personalRelief
  };
}

export function calculateTotalDeductions(
  employeeContributions: number,
  incomeTax: number,
  mortgageRepayment: number,
  consumerCredit: number,
  socialContribution: number,
  advanceRepayment: number
): number {
  return employeeContributions + incomeTax + mortgageRepayment + consumerCredit + socialContribution + advanceRepayment;
}

export function calculateNetSalary(grossSalary: number, totalDeductions: number): number {
  return grossSalary - totalDeductions;
}

export function calculateCompletePayroll(params: PayrollCalculationParams): PayrollCalculationResult {
  const {
    baseSalary,
    seniority,
    transportAllowance = BASE_REFERENCE_DATA.transportAllowance,
    representationAllowance = BASE_REFERENCE_DATA.representationAllowance,
    housingAllowance = BASE_REFERENCE_DATA.housingAllowance,
    mealAllowance = BASE_REFERENCE_DATA.mealAllowance,
    creditInterest = BASE_REFERENCE_DATA.creditInterest,
    otherDeductions = BASE_REFERENCE_DATA.creditRepayment,
    daysWorked = BASE_REFERENCE_DATA.numberOfDaysPerMonth,
    numberOfDeductions = 0
  } = params;

  const cappedHousingAllowance = calculateHousingAllowance(baseSalary, housingAllowance);
  const cappedMealAllowance = calculateMealAllowance(mealAllowance);
  const cappedTransportAllowance = calculateTransportAllowance(transportAllowance);
  const cappedRepresentationAllowance = calculateRepresentationAllowance(baseSalary, representationAllowance);
  const seniorityBonus = calculateSeniorityBonus(baseSalary, seniority);

  const grossSalary = calculateGrossSalary(
    baseSalary,
    seniorityBonus,
    cappedHousingAllowance,
    cappedMealAllowance,
    cappedTransportAllowance,
    cappedRepresentationAllowance
  );

  const taxableGrossSalary = calculateTaxableGrossSalary(
    grossSalary,
    cappedMealAllowance,
    cappedTransportAllowance,
    cappedRepresentationAllowance
  );

  const nssf = calculateNSSFContributions(grossSalary, taxableGrossSalary);
  const shif = calculateSHIFContributions(grossSalary);  // Updated to use grossSalary
  const pension = calculatePensionContributions(taxableGrossSalary);
  const insurance = calculateDiversifiedInsurance(taxableGrossSalary);
  const totalEmployeeContributions = nssf.nssfEmployee + shif.employee + pension.employee + insurance.employee;

  const workInjury = calculateWorkInjury(taxableGrossSalary);
  const totalEmployerContributions = nssf.nssfEmployer + nssf.housingLevy + nssf.trainingLevy + shif.employer +
    shif.participation + workInjury + pension.employer + insurance.employer;

  const professionalExpenses = calculateProfessionalExpenses(taxableGrossSalary);

  const taxableNet = calculateTaxableNet(
    taxableGrossSalary,
    nssf.nssfEmployee,
    shif.employee,
    pension.employee,
    professionalExpenses,
    insurance.employee
  );

  const netTaxable = calculateNetTaxable(taxableNet, creditInterest);

  const { incomeTax, personalRelief } = calculateIncomeTax(netTaxable, daysWorked, numberOfDeductions);

  const totalDeductions = calculateTotalDeductions(
    totalEmployeeContributions,
    incomeTax,
    otherDeductions,
    0,
    0,
    0
  );

  const netSalaryPayable = calculateNetSalary(grossSalary, totalDeductions);

  return {
    earnings: {
      baseSalary,
      seniorityBonus,
      housingAllowance: cappedHousingAllowance,
      mealAllowance: cappedMealAllowance,
      transportAllowance: cappedTransportAllowance,
      representationAllowance: cappedRepresentationAllowance,
      totalEarnings: grossSalary,
      bonuses: seniorityBonus + cappedHousingAllowance + cappedMealAllowance +
        cappedTransportAllowance + cappedRepresentationAllowance
    },
    grossSalary,
    taxableGrossSalary,
    employeeContributions: {
      nssfEmployee: nssf.nssfEmployee,
      shifEmployee: shif.employee,
      pensionEmployee: pension.employee,
      insuranceDiversifiedEmployee: insurance.employee,
      optionalInsurances: 0,
      totalEmployeeContributions,
      housingLevy: nssf.housingLevy
    },
    employerContributions: {
      nssfEmployer: nssf.nssfEmployer,
      housingLevy: nssf.housingLevy,
      trainingLevy: nssf.trainingLevy,
      shifEmployer: shif.employer,
      participationSHIF: shif.participation,
      workInjury,
      pensionEmployer: pension.employer,
      insuranceDiversifiedEmployer: insurance.employer,
      totalEmployerContributions
    },
    taxCalculation: {
      professionalExpenses,
      taxableNet,
      netTaxable,
      theoreticalTax: incomeTax + personalRelief,
      incomeTax,
      personalRelief
    },
    otherDeductions: {
      mortgageCredit: otherDeductions,
      consumerCredit: 0,
      salaryAdvance: 0,
      totalOtherDeductions: otherDeductions
    },
    totalDeductions,
    netSalaryPayable,
    totalEmployerCost: grossSalary + totalEmployerContributions
  };
}

export function validateReferenceCalculations(): PayrollCalculationResult {
  return calculateCompletePayroll({
    baseSalary: BASE_REFERENCE_DATA.baseSalary,
    seniority: BASE_REFERENCE_DATA.seniority
  });
}

export default {
  BASE_REFERENCE_DATA,
  CONTRIBUTION_RATES,
  SENIORITY_SCALE,
  INCOME_TAX_BRACKETS,
  ALLOWANCE_CEILINGS,
  calculateCompletePayroll,
  validateReferenceCalculations
};