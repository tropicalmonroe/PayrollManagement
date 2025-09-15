/**
 * Base data file for payroll calculations
 * This file centralizes all base data and impacts the entire HR application
 * 
 * Base Reference Data:
 * - Base Salary: 150,000 KES
 * - Seniority: 15 years
 * - Number of days/month: 26 days
 */

// ===== BASE REFERENCE DATA =====
export const BASE_REFERENCE_DATA = {
  baseSalary: 150000,
  seniority: 15,
  numberOfDaysPerMonth: 26,
  // Salary components according to new specifications
  seniorityRate: 0.25, // 25.00%
  seniorityBonus: 37500, // 37,500 KES
  housingAllowance: 0.00, // 0.00 KES
  mealAllowance: 0.00, // 0.00 KES
  transportAllowance: 5000.00, // 5,000 KES
  representationAllowance: 0.00, // 0.00 KES
  // Calculated gross salary: 150,000 + 37,500 + 0 + 0 + 5,000 + 0 = 192,500 KES
  grossSalaryReference: 192500, // 192,500 KES
  creditInterest: 25000,
  creditRepayment: 45000
};

// ===== RATES AND PERCENTAGES =====
export const CONTRIBUTION_RATES = {
  // Employee contributions (DEDUCTIONS)
  nssfEmployee: {
    taxRate: 0.06, // 6% (tiered)
    ceiling: 18000 // Monthly NSSF ceiling
  },
  shifEmployee: 0.0275, // 2.75%
  pensionEmployee: {
    taxRate: 0.06, // 6.00%
    ceiling: null, // No ceiling for pension
    minimumThreshold: 6000 // Minimum threshold to contribute
  },
  insuranceDiversifiedEmployee: {
    taxRate: 0.0125, // 1.25% - Adjusted for exact precision
    minimumThreshold: 6000 // Minimum threshold to contribute
  },
  
  // Employer contributions
  nssfEmployer: 0.06, // 6% (tiered)
  housingLevy: 0.015, // 1.5%
  trainingLevy: 0.01, // 1.0%
  shifEmployer: 0.0275, // 2.75%
  participationSHIF: 0.01, // 1.0%
  workInjury: 0.005, // 0.5%
  pensionEmployer: {
    taxRate: 0.06, // 6.00%
    minimumThreshold: 6000 // Minimum threshold to contribute
  },
  insuranceDiversifiedEmployer: {
    taxRate: 0.0125, // 1.25%
    minimumThreshold: 6000 // Minimum threshold to contribute
  },
  
  // Professional expenses and tax deductions
  professionalExpenses: {
    taxRate: 0.20, // 20%
    ceiling: 2500, // Theoretical ceiling
    appliedAmount: 1987.07 // Corrected amount
  },
  
  // Specific tax deductions
  taxDeductions: {
    creditInterest: {
      maxDeductionRate: 0.10, // 10% of taxable net maximum
      description: "Mortgage credit interest"
    },
    familyDeductions: {
      amountPerPerson: 2400, // KES per dependent per year
      description: "Family deductions"
    }
  }
};

// ===== SENIORITY BONUS SCALE =====
export const SENIORITY_SCALE = [
  { min: 0, max: 2, rate: 0.00 }, // 0% for 0-1 years
  { min: 2, max: 5, rate: 0.05 }, // 5% for 2-4 years
  { min: 5, max: 12, rate: 0.10 }, // 10% for 5-11 years
  { min: 12, max: 20, rate: 0.15 }, // 15% for 12-19 years
  { min: 20, max: 25, rate: 0.20 }, // 20% for 20-24 years
  { min: 25, max: Infinity, rate: 0.25 } // 25% for 25+ years
];

// ===== INCOME TAX BRACKETS - MONTHLY BRACKETS =====
// Based on the provided table with new brackets:
// 0 - 24,000 KES = 10% (deduction: 0)
// 24,001 - 32,333 KES = 15% (deduction: 600)
// 32,334 - 41,667 KES = 20% (deduction: 1,083)
// 41,668 - 57,143 KES = 25% (deduction: 1,875)
// Above 57,143 KES = 30% (deduction: 2,857)
export const INCOME_TAX_BRACKETS = [
  { min: 0, max: 24000, rate: 0.10, deduction: 0 },
  { min: 24001, max: 32333, rate: 0.15, deduction: 600 },
  { min: 32334, max: 41667, rate: 0.20, deduction: 1083 },
  { min: 41668, max: 57143, rate: 0.25, deduction: 1875 },
  { min: 57144, max: Infinity, rate: 0.30, deduction: 2857 }
];

// ===== CORRECTED CALCULATION FUNCTIONS =====

/**
 * Calculates seniority bonus according to the scale
 */
export function calculateSeniorityBonus(baseSalary: number, seniority: number): number {
  // Find the appropriate bracket according to the seniority scale
  // Rates apply from the exact year indicated
  const bracket = SENIORITY_SCALE.find(t => seniority >= t.min && (t.max === Infinity || seniority < t.max));
  if (!bracket) return 0;
  
  const bonus = baseSalary * bracket.rate;
  return bonus; // No rounding to maintain precision
}

/**
 * Calculates gross salary according to the correct formula:
 * Gross Salary = Base Salary + Seniority Bonus + Transport Allowance + Representation Allowance
 */
export function calculateGrossSalary(
  baseSalary: number,
  seniorityBonus: number,
  transportAllowance: number,
  representationAllowance: number = 0
): number {
  return baseSalary + seniorityBonus + transportAllowance + representationAllowance;
}

/**
 * Calculates taxable gross salary
 */
export function calculateTaxableGrossSalary(
  grossSalary: number,
  representationAllowance: number,
  transportAllowance: number
): number {
  return grossSalary - representationAllowance - transportAllowance;
}

/**
 * Calculates NSSF contributions with ceiling
 */
export function calculateNSSFContributions(taxableGrossSalary: number): {
  employee: number;
  employer: number;
  ceilingBase: number;
} {
  // NSSF is always calculated on the ceiling of 18,000 KES
  const ceilingBase = CONTRIBUTION_RATES.nssfEmployee.ceiling;
  
  return {
    employee: ceilingBase * CONTRIBUTION_RATES.nssfEmployee.taxRate,
    employer: ceilingBase * CONTRIBUTION_RATES.nssfEmployer,
    ceilingBase
  };
}

/**
 * Calculates SHIF contributions
 */
export function calculateSHIFContributions(taxableGrossSalary: number): {
  employee: number;
  employer: number;
  participation: number;
} {
  return {
    employee: taxableGrossSalary * CONTRIBUTION_RATES.shifEmployee,
    employer: taxableGrossSalary * CONTRIBUTION_RATES.shifEmployer,
    participation: taxableGrossSalary * CONTRIBUTION_RATES.participationSHIF
  };
}

/**
 * Calculates pension contributions (only for salaries > 6,000 KES)
 */
export function calculatePensionContributions(taxableGrossSalary: number): {
  employee: number;
  employer: number;
} {
  // No pension contribution for salaries <= 6,000 KES
  if (taxableGrossSalary <= CONTRIBUTION_RATES.pensionEmployee.minimumThreshold) {
    return { employee: 0, employer: 0 };
  }
  
  return {
    employee: taxableGrossSalary * CONTRIBUTION_RATES.pensionEmployee.taxRate,
    employer: taxableGrossSalary * CONTRIBUTION_RATES.pensionEmployer.taxRate
  };
}

/**
 * Calculates diversified insurance
 * Formula: taxable gross salary * 1.25%
 */
export function calculateDiversifiedInsurance(taxableGrossSalary: number): {
  employee: number;
  employer: number;
} {
  return {
    employee: taxableGrossSalary * CONTRIBUTION_RATES.insuranceDiversifiedEmployee.taxRate,
    employer: taxableGrossSalary * CONTRIBUTION_RATES.insuranceDiversifiedEmployer.taxRate
  };
}

/**
 * Calculates housing levy
 */
export function calculateHousingLevy(taxableGrossSalary: number): number {
  return taxableGrossSalary * CONTRIBUTION_RATES.housingLevy;
}

/**
 * Calculates training levy
 */
export function calculateTrainingLevy(taxableGrossSalary: number): number {
  return taxableGrossSalary * CONTRIBUTION_RATES.trainingLevy;
}

/**
 * Calculates work injury insurance
 */
export function calculateWorkInjury(taxableGrossSalary: number): number {
  return taxableGrossSalary * CONTRIBUTION_RATES.workInjury;
}

/**
 * Calculates professional expenses according to the new formula:
 * IF(taxable gross salary*12<300,000;MIN(30,000/12;35%*taxable gross salary);MIN(35,000/12;25%*taxable gross salary))
 */
export function calculateProfessionalExpenses(taxableGrossSalary: number): number {
  const annualSalary = taxableGrossSalary * 12;
  
  if (annualSalary < 300000) {
    // Annual salary < 300,000 KES
    // MIN(30,000/12, 35% × taxable gross salary)
    const monthlyCeiling = 30000 / 12; // 2,500 KES
    const percentage = taxableGrossSalary * 0.35; // 35%
    return Math.min(monthlyCeiling, percentage);
  } else {
    // Annual salary ≥ 300,000 KES
    // MIN(35,000/12, 25% × taxable gross salary)
    const monthlyCeiling = 35000 / 12; // 2,916.67 KES
    const percentage = taxableGrossSalary * 0.25; // 25%
    return Math.min(monthlyCeiling, percentage);
  }
}

/**
 * Calculates taxable net according to the new formula:
 * Taxable Net = Taxable Gross Salary - NSSF Employee Contribution - SHIF Employee Contribution - Pension Employee Contribution - Professional Expenses - Insurance Diversified Employee Contribution
 */
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

/**
 * Calculates net taxable (after deduction of credit interest)
 * Formula: Taxable Net - MIN(Credit Interest, 10% * Taxable Net)
 */
export function calculateNetTaxable(taxableNet: number, creditInterest: number): number {
  const maxDeduction = taxableNet * 0.10; // 10% of taxable net
  const appliedDeduction = Math.min(creditInterest, maxDeduction);
  return taxableNet - appliedDeduction;
}

/**
 * Calculates income tax according to the progressive scale
 * Formula: (Net Taxable * Rate - Amount to deduct) * (Days worked / 26) - (Personal relief * Number of deductions)
 */
export function calculateIncomeTax(netTaxable: number, daysWorked: number = 26, numberOfDeductions: number = 0): number {
  let incomeTax = 0;
  
  for (const bracket of INCOME_TAX_BRACKETS) {
    if (netTaxable >= bracket.min && netTaxable <= bracket.max) {
      incomeTax = (netTaxable * bracket.rate) - bracket.deduction;
      break;
    }
  }
  
  // Application of proration factor
  const proratedIncomeTax = incomeTax * (daysWorked / 26);
  
  // Application of deductions for family
  const familyDeductions = 200 * numberOfDeductions; // 200 KES per dependent per month
  
  return Math.max(0, proratedIncomeTax - familyDeductions);
}

/**
 * Calculates total deductions according to specifications:
 * Deductions = Employee Contributions + Personal Deductions
 * 
 * Employee Contributions:
 * - NSSF Employee Contribution
 * - SHIF Employee Contribution  
 * - Pension Employee Contribution
 * - Insurance Diversified Employee Contribution
 * 
 * Personal Deductions:
 * - Income tax
 * - Mortgage credit repayment
 * - Consumer credit
 * - Social contribution
 * - Advance repayment
 */
export function calculateTotalDeductions(
  employeeContributions: number,
  incomeTax: number,
  mortgageRepayment: number,
  consumerCredit: number,
  socialContribution: number,
  advanceRepayment: number
): number {
  const deductions = {
    employeeContributions,
    personalDeductions: {
      incomeTax,
      mortgageRepayment,
      consumerCredit,
      socialContribution,
      advanceRepayment,
      total: incomeTax + mortgageRepayment + consumerCredit + socialContribution + advanceRepayment
    }
  };
  
  return employeeContributions + deductions.personalDeductions.total;
}

/**
 * Calculates detailed employee contributions
 * Returns details of each deduction component
 */
export function calculateContributionDetails(taxableGrossSalary: number): {
  nssf: number;
  shif: number;
  pension: number;
  insuranceDiversified: number;
  totalEmployeeContributions: number;
  details: {
    nssf: { rate: number; ceiling: number; base: number };
    shif: { rate: number; base: number };
    pension: { rate: number; minimumThreshold: number; base: number };
    insuranceDiversified: { rate: number; minimumThreshold: number; base: number };
  };
} {
  // Calculate NSSF with ceiling
  const nssfBase = CONTRIBUTION_RATES.nssfEmployee.ceiling;
  const nssf = nssfBase * CONTRIBUTION_RATES.nssfEmployee.taxRate;
  
  // Calculate SHIF
  const shif = taxableGrossSalary * CONTRIBUTION_RATES.shifEmployee;
  
  // Calculate Pension (only if salary > 6,000 KES)
  const pension = taxableGrossSalary > CONTRIBUTION_RATES.pensionEmployee.minimumThreshold 
    ? taxableGrossSalary * CONTRIBUTION_RATES.pensionEmployee.taxRate 
    : 0;
  
  // Calculate Diversified Insurance
  const insuranceDiversified = taxableGrossSalary * CONTRIBUTION_RATES.insuranceDiversifiedEmployee.taxRate;
  
  const totalEmployeeContributions = nssf + shif + pension + insuranceDiversified;
  
  return {
    nssf,
    shif,
    pension,
    insuranceDiversified,
    totalEmployeeContributions,
    details: {
      nssf: {
        rate: CONTRIBUTION_RATES.nssfEmployee.taxRate,
        ceiling: CONTRIBUTION_RATES.nssfEmployee.ceiling,
        base: nssfBase
      },
      shif: {
        rate: CONTRIBUTION_RATES.shifEmployee,
        base: taxableGrossSalary
      },
      pension: {
        rate: CONTRIBUTION_RATES.pensionEmployee.taxRate,
        minimumThreshold: CONTRIBUTION_RATES.pensionEmployee.minimumThreshold,
        base: taxableGrossSalary > CONTRIBUTION_RATES.pensionEmployee.minimumThreshold ? taxableGrossSalary : 0
      },
      insuranceDiversified: {
        rate: CONTRIBUTION_RATES.insuranceDiversifiedEmployee.taxRate,
        minimumThreshold: CONTRIBUTION_RATES.insuranceDiversifiedEmployee.minimumThreshold,
        base: taxableGrossSalary
      }
    }
  };
}

/**
 * Calculates net salary payable
 */
export function calculateNetSalary(grossSalary: number, totalDeductions: number): number {
  return grossSalary - totalDeductions;
}

// ===== COMPLETE CALCULATION ACCORDING TO BASE DATA =====

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
  // Earnings
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
  
  // Gross salaries
  grossSalary: number;
  taxableGrossSalary: number;
  
  // Employee contributions
  employeeContributions: {
    nssfEmployee: number;
    shifEmployee: number;
    pensionEmployee: number;
    insuranceDiversifiedEmployee: number;
    optionalInsurances: number;
    totalEmployeeContributions: number;
    housingLevy: number; // Optional, only if applicable
  };
  
  // Employer contributions
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
  
  // Income tax calculation
  taxCalculation: {
    professionalExpenses: number;
    taxableNet: number;
    netTaxable: number;
    theoreticalTax: number;
    incomeTax: number;
    helb?: number;
    personalRelief?: number;
  };
  
  // Other deductions
  otherDeductions: {
    mortgageCredit: number;
    consumerCredit: number;
    salaryAdvance: number;
    totalOtherDeductions: number;
  };
  
  // Final result
  totalDeductions: number;
  netSalaryPayable: number;
  totalEmployerCost: number;
}


/**
 * Main calculation function according to base data
 */
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

  // 1. Seniority bonus
  const seniorityBonus = calculateSeniorityBonus(baseSalary, seniority);
  
  // 2. Gross salary (according to new components)
  const grossSalary = baseSalary + seniorityBonus + housingAllowance + mealAllowance + transportAllowance + representationAllowance;
  
  // 3. Taxable gross salary
  const taxableGrossSalary = calculateTaxableGrossSalary(grossSalary, representationAllowance, transportAllowance);
  
  // 4. Employee contributions
  const nssf = calculateNSSFContributions(taxableGrossSalary);
  const shif = calculateSHIFContributions(taxableGrossSalary);
  const pension = calculatePensionContributions(taxableGrossSalary);
  const insurance = calculateDiversifiedInsurance(taxableGrossSalary);
  
  const totalEmployeeContributions = nssf.employee + shif.employee + pension.employee + insurance.employee;
  
  // 5. Employer contributions
  const housingLevy = calculateHousingLevy(taxableGrossSalary);
  const trainingLevy = calculateTrainingLevy(taxableGrossSalary);
  const workInjury = calculateWorkInjury(taxableGrossSalary);
  
  const totalEmployerContributions = pension.employer + insurance.employer + nssf.employer + 
                                    housingLevy + trainingLevy + shif.employer + 
                                    shif.participation + workInjury;
  
  // 6. Professional expenses
  const professionalExpenses = calculateProfessionalExpenses(taxableGrossSalary);
  
  // 7. Taxable net according to the new formula
  const taxableNet = calculateTaxableNet(
    taxableGrossSalary,
    nssf.employee,
    shif.employee,
    pension.employee,
    professionalExpenses,
    insurance.employee
  );
  
  // 8. Net taxable
  const netTaxable = calculateNetTaxable(taxableNet, creditInterest);
  
  // 9. Income tax
  const incomeTax = calculateIncomeTax(netTaxable, daysWorked, numberOfDeductions);
  
  // 10. Total deductions
  const totalDeductions = calculateTotalDeductions(
    totalEmployeeContributions, 
    incomeTax, 
    otherDeductions, // mortgageRepayment
    0, // consumerCredit
    0, // socialContribution
    0  // advanceRepayment
  );
  
  // 11. Net salary
  const netSalaryPayable = calculateNetSalary(grossSalary, totalDeductions);
  
  return {
    earnings: {
      baseSalary,
    seniorityBonus,
    housingAllowance,
    mealAllowance,
    transportAllowance,
    representationAllowance,
    totalEarnings: grossSalary, // or sum of components
    bonuses: 0 // or actual bonuses if you calculate them
    },

    // Gross salaries
  grossSalary,
  taxableGrossSalary,
    
    // Employee contributions
  employeeContributions: {
    nssfEmployee: nssf.employee,
    shifEmployee: shif.employee,
    pensionEmployee: pension.employee,
    insuranceDiversifiedEmployee: insurance.employee,
    optionalInsurances: 0,
    totalEmployeeContributions,
    housingLevy
  },
    
     // Employer contributions
  employerContributions: {
    pensionEmployer: pension.employer,
    insuranceDiversifiedEmployer: insurance.employer,
    nssfEmployer: nssf.employer,
    housingLevy,
    trainingLevy,
    shifEmployer: shif.employer,
    participationSHIF: shif.participation,
    workInjury,
    totalEmployerContributions
  },
    
    // Income tax
  taxCalculation: {
    professionalExpenses,
    taxableNet,
    netTaxable,
    theoreticalTax: 0, // fill if needed
    incomeTax
  },

  // Other deductions
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

// ===== CALCULATION VALIDATION =====

/**
 * Validates calculations with reference data
 */
export function validateReferenceCalculations(): PayrollCalculationResult {
  return calculateCompletePayroll({
    baseSalary: BASE_REFERENCE_DATA.baseSalary,
    seniority: BASE_REFERENCE_DATA.seniority
  });
}

// Export base data for use throughout the application
export default {
  BASE_REFERENCE_DATA,
  CONTRIBUTION_RATES,
  SENIORITY_SCALE,
  INCOME_TAX_BRACKETS,
  calculateCompletePayroll,
  validateReferenceCalculations
};