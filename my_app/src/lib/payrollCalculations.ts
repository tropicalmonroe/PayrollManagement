// Payroll calculation system compliant with centralized base data
// Based on current Kenyan regulations and reference data

import {
  BASE_REFERENCE_DATA,
  CONTRIBUTION_RATES,
  SENIORITY_SCALE,
  INCOME_TAX_BRACKETS,
  calculateCompletePayroll,
  calculateProfessionalExpenses,
  calculateTaxableNet,
  type PayrollCalculationParams,
  type PayrollCalculationResult
} from './payrollBaseData';

export interface PayrollConfig {
  nssfRates: {
    employeeContribution: number;
    employerContribution: number;
    housingLevy: number;
    trainingLevy: number;
  };
  shifRates: {
    employee: number;
    employer: number;
    participation: number;
  };
  insuranceRates: {
    employeeDiversified: number;
    employerDiversified: number;
    workInjury: number;
  };
  pensionRates: {
    employee: number;
    employer: number;
  };
  ceilings: {
    nssfCeiling: number;
    professionalExpenses: number;
  };
}

// Configuration based on centralized base data
export const PAYROLL_CONFIG: PayrollConfig = {
  nssfRates: {
    employeeContribution: CONTRIBUTION_RATES.nssfEmployee.taxRate,
    employerContribution: CONTRIBUTION_RATES.nssfEmployer,
    housingLevy: CONTRIBUTION_RATES.housingLevy,
    trainingLevy: CONTRIBUTION_RATES.trainingLevy,
  },
  shifRates: {
    employee: CONTRIBUTION_RATES.shifEmployee,
    employer: CONTRIBUTION_RATES.shifEmployer,
    participation: CONTRIBUTION_RATES.participationSHIF,
  },
  insuranceRates: {
    employeeDiversified: CONTRIBUTION_RATES.insuranceDiversifiedEmployee.taxRate,
    employerDiversified: CONTRIBUTION_RATES.insuranceDiversifiedEmployer.taxRate,
    workInjury: CONTRIBUTION_RATES.workInjury,
  },
  pensionRates: {
    employee: CONTRIBUTION_RATES.pensionEmployee.taxRate,
    employer: CONTRIBUTION_RATES.pensionEmployer.taxRate,
  },
  ceilings: {
    nssfCeiling: CONTRIBUTION_RATES.nssfEmployee.ceiling,
    professionalExpenses: CONTRIBUTION_RATES.professionalExpenses.appliedAmount,
  }
};

// Progressive income tax brackets (monthly)
export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
  deduction: number;
}

// Export tax brackets from base data
export { INCOME_TAX_BRACKETS };

// Default values for NSSF Employee Contributions
export const NSSF_DEFAULTS = {
  nssfEmployee: 1080,      // Based on current NSSF rates
  shifEmployee: 1080,      // Based on current SHIF rates
  pensionEmployee: 2000,   // Example pension contribution
  insuranceDiversifiedEmployee: 500 // Example insurance
};

// Seniority bonus scale
export interface SeniorityBracket {
  min: number;
  max: number;
  rate: number;
}

// Export seniority scale from base data
export { SENIORITY_SCALE };


export const OPTIONAL_INSURANCE_RATES = {
  comprehensiveHealthInsurance: 0.025,   // 2.5%
  foreignHealthCover: 0.005,             // 0.5%
  enhancedDisabilityCover: 0.00316,      // 0.316%
};

// Allowance ceilings
export const ALLOWANCE_CEILINGS = {
  housing: {
    maxPercentage: 0.20,    // 20% of salary
    absoluteCeiling: 20000,  // 20,000 KES max
  },
  representation: {
    maxPercentage: 0.10,    // 10% of salary
    absoluteCeiling: 10000,  // 10,000 KES max
  },
  meal: 2000,               // 2,000 KES standard
  transport: [3000, 5000],  // Options 3,000 or 5,000 KES
};

// Interface for variable elements
export interface VariableElement {
  id: string;
  type: 'OVERTIME' | 'ABSENCE' |  'BONUS' |'EXCEPTIONAL_BONUS' | 'LEAVE' | 'LATENESS' | 'ADVANCE' | 'OTHER';
  description: string;
  amount: number;
  hours?: number;
  rate?: number;
  date: Date;
  month: string;
  year: string;
}

// Types of optional insurances
export interface OptionalInsurances {
  comprehensiveHealthInsurance: boolean;
  foreignHealthCover: boolean;
  enhancedDisabilityCover: boolean;
}

// Interface for calculation data
export interface EmployeePayrollData {
  // Personal data
  lastName: string;
  firstName: string;
  employeeId: string;
  idNumber: string;
  nssfNumber: string;
  maritalStatus: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
  dateOfBirth: Date;
  hireDate: Date;
  seniority: number;
  numberOfDeductions: number; // Dependents
  numberOfDaysPerMonth: number;
  
  // Salary and allowances
  baseSalary: number;
  housingAllowance: number;
  mealAllowance: number;
  transportAllowance: number;
  representationAllowance: number;
  
  // Optional insurances
  insurances: OptionalInsurances;
  
  // Credits and advances
  mortgageCredit?: {
    monthlyAmount: number;
    interest: number;
  };
  consumerCredit?: {
    monthlyAmount: number;
  };
  salaryAdvance?: {
    monthlyAmount: number;
  };
  
  // Variable elements (optional for compatibility)
  variableElements?: VariableElement[];
  
  // Bank
  bankAccount: string;
  bankBranch: string;
  
  // NSSF Employee Contributions (optional)
  useNssfEmployee?: boolean;
  useShifEmployee?: boolean;
  usePensionEmployee?: boolean;
  useInsuranceDiversifiedEmployee?: boolean;

  // Additional fields for payroll calculation
  bonuses: number;
  overtimePay: number;
  loanRepayment: number;
  deductibleInterest?: number;
  otherDeductions: number;
  helbLoan: number;
  subjectToNssf: boolean;
  subjectToShif: boolean;
  subjectToHousingLevy: boolean;
}

// Payroll calculation result
export interface PayrollResult {
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
 * Calculates seniority bonus according to progressive scale
 */
export function calculateSeniorityBonus(baseSalary: number, seniority: number): number {
  const bracket = SENIORITY_SCALE.find((t: SeniorityBracket) => seniority >= t.min && seniority < t.max);
  return bracket ? baseSalary * bracket.rate : 0;
}

/**
 * Calculates housing allowance with ceiling
 */
export function calculateHousingAllowance(baseSalary: number, requestedAmount: number): number {
  const percentageCeiling = baseSalary * ALLOWANCE_CEILINGS.housing.maxPercentage;
  const absoluteCeiling = ALLOWANCE_CEILINGS.housing.absoluteCeiling;
  const effectiveCeiling = Math.min(percentageCeiling, absoluteCeiling);
  
  return Math.min(requestedAmount, effectiveCeiling);
}

/**
 * Calculates representation allowance with ceiling
 */
export function calculateRepresentationAllowance(baseSalary: number, requestedAmount: number): number {
  const percentageCeiling = baseSalary * ALLOWANCE_CEILINGS.representation.maxPercentage;
  const absoluteCeiling = ALLOWANCE_CEILINGS.representation.absoluteCeiling;
  const effectiveCeiling = Math.min(percentageCeiling, absoluteCeiling);
  
  return Math.min(requestedAmount, effectiveCeiling);
}

/**
 * Calculates NSSF contributions with ceiling
 */
export function calculateNSSFContributions(grossSalary: number, taxableGrossSalary: number): {
  nssfEmployee: number;
  housingLevy: number;
  trainingLevy: number;
} {
  const nssfBase = Math.min(grossSalary, PAYROLL_CONFIG.ceilings.nssfCeiling);
  
  return {
    nssfEmployee: nssfBase * PAYROLL_CONFIG.nssfRates.employeeContribution,
    housingLevy: taxableGrossSalary * PAYROLL_CONFIG.nssfRates.housingLevy,
    trainingLevy: taxableGrossSalary * PAYROLL_CONFIG.nssfRates.trainingLevy,
  };
}

/**
 * Calculates SHIF contributions
 */
export function calculateSHIFContributions(taxableGrossSalary: number): {
  shifEmployee: number;
  shifEmployer: number;
  participationSHIF: number;
} {
  return {
    shifEmployee: taxableGrossSalary * PAYROLL_CONFIG.shifRates.employee,
    shifEmployer: taxableGrossSalary * PAYROLL_CONFIG.shifRates.employer,
    participationSHIF: taxableGrossSalary * PAYROLL_CONFIG.shifRates.participation,
  };
}

/**
 * Calculates pension contributions (only for salaries above threshold)
 */
export function calculatePensionContributions(taxableGrossSalary: number): {
  pensionEmployee: number;
  pensionEmployer: number;
} {
  // No pension contribution for salaries below threshold
  if (taxableGrossSalary <= CONTRIBUTION_RATES.pensionEmployee.minimumThreshold) {
    return { pensionEmployee: 0, pensionEmployer: 0 };
  }
  
  return {
    pensionEmployee: taxableGrossSalary * PAYROLL_CONFIG.pensionRates.employee,
    pensionEmployer: taxableGrossSalary * PAYROLL_CONFIG.pensionRates.employer,
  };
}

/**
 * Calculates diversified insurance
 * Formula: taxable gross salary * standard rate (without adjustment)
 * IMPORTANT: Maintains full precision without intermediate rounding
 */
export function calculateDiversifiedInsurance(taxableGrossSalary: number): {
  insuranceDiversifiedEmployee: number;
  insuranceDiversifiedEmployer: number;
  workInjury: number;
} {
  return {
    insuranceDiversifiedEmployee: taxableGrossSalary * PAYROLL_CONFIG.insuranceRates.employeeDiversified,
    insuranceDiversifiedEmployer: taxableGrossSalary * PAYROLL_CONFIG.insuranceRates.employerDiversified,
    workInjury: taxableGrossSalary * PAYROLL_CONFIG.insuranceRates.workInjury,
  };
}

/**
 * Calculates optional insurances
 */
export function calculateOptionalInsurances(
  taxableGrossSalary: number, 
  insurances: OptionalInsurances
): number {
  let total = 0;
  
  if (insurances.comprehensiveHealthInsurance) {
    total += taxableGrossSalary * OPTIONAL_INSURANCE_RATES.comprehensiveHealthInsurance;
  }
  
  if (insurances.foreignHealthCover) {
    total += taxableGrossSalary * OPTIONAL_INSURANCE_RATES.foreignHealthCover;
  }
  
  if (insurances.enhancedDisabilityCover) {
    total += taxableGrossSalary * OPTIONAL_INSURANCE_RATES.enhancedDisabilityCover;
  }
  
  return total;
}

/**
 * Calculates income tax according to progressive scale with proration and new deduction formula
 * Theoretical tax formula: ((net taxable * rate) - deduction) * (number of days in month / 26)
 * Final formula: IF((theoretical tax-(personal relief*number of deductions))<=0;0;theoretical tax-(personal relief*number of deductions))
 * IMPORTANT: Maintains full precision in all intermediate calculations
 */
export function calculateIncomeTax(
  taxableNet: number, 
  creditInterest: number = 0,
  maritalStatus: string,
  numberOfDeductions: number,
  numberOfDaysPerMonth: number = 26
): {
  taxableNet: number;
  netTaxable: number;
  theoreticalTax: number;
  incomeTax: number;
} {
  // Calculate net taxable (after deduction of credit interest)
  // Maintain full precision without rounding
  const maxDeduction = taxableNet * 0.10; // 10% of taxable net
  const appliedDeduction = Math.min(creditInterest, maxDeduction);
  const netTaxable = taxableNet - appliedDeduction;
  
  // Find applicable tax bracket
  const bracket = INCOME_TAX_BRACKETS.find((t: TaxBracket) => netTaxable >= t.min && netTaxable <= t.max);
  
  if (!bracket) {
    return {
      taxableNet,
      netTaxable,
      theoreticalTax: 0,
      incomeTax: 0
    };
  }
  
  // Calculate theoretical tax with proration based on number of working days
  // Formula: ((net taxable * rate) - deduction) * (number of days in month / 26)
  // Maintain full precision in all calculations
  const monthlyTaxComplete = Math.max(0, (netTaxable * bracket.rate) - bracket.deduction);
  const theoreticalTax = monthlyTaxComplete * (numberOfDaysPerMonth / 26);
  
  // Application of new deduction formula for dependents
  // Formula: IF((theoretical tax-(personal relief*number of deductions))<=0;0;theoretical tax-(personal relief*number of deductions))
  // Personal relief is 2400 KES per year (200 KES per month)
  const monthlyDeduction = 200 * numberOfDeductions;
  const taxAfterDeduction = theoreticalTax - monthlyDeduction;
  
  // If result is <= 0, then tax = 0, otherwise apply deduction
  // Maintain full precision until final result
  const incomeTax = Math.max(0, taxAfterDeduction);
  
  return {
    taxableNet,
    netTaxable,
    theoreticalTax,
    incomeTax
  };
}

/**
 * Processes variable elements for payroll calculation
 */
export function processVariableElements(variableElements: VariableElement[] = []): {
  overtimePay: number;
  exceptionalBonuses: number;
  absences: number;
  lateness: number;
  variableAdvances: number;
  otherEarnings: number;
  otherDeductions: number;
} {
  let overtimePay = 0;
  let exceptionalBonuses = 0;
  let absences = 0;
  let lateness = 0;
  let variableAdvances = 0;
  let otherEarnings = 0;
  let otherDeductions = 0;

  variableElements.forEach(element => {
    switch (element.type) {
      case 'OVERTIME':
        overtimePay += element.amount;
        break;
      case 'EXCEPTIONAL_BONUS':
        exceptionalBonuses += element.amount;
        break;
      case 'ABSENCE':
        absences += element.amount; // Negative amount (deduction)
        break;
      case 'LATENESS':
        lateness += element.amount; // Negative amount (deduction)
        break;
      case 'ADVANCE':
        variableAdvances += element.amount; // Negative amount (deduction)
        break;
      case 'LEAVE':
        // Leave can be paid or unpaid depending on context
        if (element.amount > 0) {
          otherEarnings += element.amount;
        } else {
          otherDeductions += Math.abs(element.amount);
        }
        break;
      case 'OTHER':
        // Other elements can be earnings or deductions
        if (element.amount > 0) {
          otherEarnings += element.amount;
        } else {
          otherDeductions += Math.abs(element.amount);
        }
        break;
    }
  });

  return {
    overtimePay,
    exceptionalBonuses,
    absences: Math.abs(absences), // Convert to positive for deductions
    lateness: Math.abs(lateness),
    variableAdvances: Math.abs(variableAdvances),
    otherEarnings,
    otherDeductions
  };
}

/**
 * Main payroll calculation function
 * IMPORTANT: Maintains full precision in all intermediate calculations
 * Rounding is only applied at the final display level
 */
export function calculatePayroll(employee: EmployeePayrollData): PayrollResult {
  // 0. Process variable elements
  const variableElements = processVariableElements(employee.variableElements);

  // 1. Calculate earnings
  const seniorityBonus = calculateSeniorityBonus(employee.baseSalary, employee.seniority);
  const housingAllowance = calculateHousingAllowance(employee.baseSalary, employee.housingAllowance);
  const representationAllowance = calculateRepresentationAllowance(employee.baseSalary, employee.representationAllowance);
  
  const earnings = {
    baseSalary: employee.baseSalary,
    seniorityBonus,
    housingAllowance,
    mealAllowance: employee.mealAllowance,
    transportAllowance: employee.transportAllowance,
    representationAllowance,
    // Add positive variable elements
    overtimePay: variableElements.overtimePay,
    exceptionalBonuses: variableElements.exceptionalBonuses,
    otherEarnings: variableElements.otherEarnings,
    totalEarnings: employee.baseSalary + seniorityBonus + housingAllowance + 
                employee.mealAllowance + employee.transportAllowance + representationAllowance +
                variableElements.overtimePay + variableElements.exceptionalBonuses + 
                variableElements.otherEarnings,
      bonuses: seniorityBonus + housingAllowance + employee.mealAllowance + employee.transportAllowance + representationAllowance
  };
  
  // 2. Calculate gross salaries
  const grossSalary = earnings.totalEarnings;
  const taxableGrossSalary = grossSalary - employee.transportAllowance - employee.representationAllowance; // Transport and representation not taxable
  
  // 3. Calculate employee contributions
  const nssfContributions = calculateNSSFContributions(grossSalary, taxableGrossSalary);
  const shifContributions = calculateSHIFContributions(taxableGrossSalary);
  const pensionContributions = calculatePensionContributions(taxableGrossSalary);
  const diversifiedInsurance = calculateDiversifiedInsurance(taxableGrossSalary);
  const optionalInsurances = calculateOptionalInsurances(taxableGrossSalary, employee.insurances);
  
  // Use default values if checkboxes are checked, otherwise calculate
  const employeeContributions = {
    nssfEmployee: employee.useNssfEmployee ? NSSF_DEFAULTS.nssfEmployee : nssfContributions.nssfEmployee,
    shifEmployee: employee.useShifEmployee ? NSSF_DEFAULTS.shifEmployee : shifContributions.shifEmployee,
    pensionEmployee: employee.usePensionEmployee ? NSSF_DEFAULTS.pensionEmployee : pensionContributions.pensionEmployee,
    insuranceDiversifiedEmployee: employee.useInsuranceDiversifiedEmployee ? NSSF_DEFAULTS.insuranceDiversifiedEmployee : diversifiedInsurance.insuranceDiversifiedEmployee,
    optionalInsurances,
    housingLevy: employee.subjectToHousingLevy ? nssfContributions.housingLevy : 0,
    totalEmployeeContributions: 0 // Calculated below
  };
  
  // Calculate total employee contributions
  employeeContributions.totalEmployeeContributions = 
    employeeContributions.nssfEmployee + employeeContributions.shifEmployee + 
    employeeContributions.pensionEmployee + employeeContributions.insuranceDiversifiedEmployee + 
    employeeContributions.optionalInsurances;
  
  // 4. Calculate employer contributions
  const employerContributions = {
    nssfEmployer: Math.min(grossSalary, PAYROLL_CONFIG.ceilings.nssfCeiling) * PAYROLL_CONFIG.nssfRates.employerContribution,
    housingLevy: nssfContributions.housingLevy,
    trainingLevy: nssfContributions.trainingLevy,
    shifEmployer: shifContributions.shifEmployer,
    participationSHIF: shifContributions.participationSHIF,
    workInjury: diversifiedInsurance.workInjury,
    pensionEmployer: pensionContributions.pensionEmployer,
    insuranceDiversifiedEmployer: diversifiedInsurance.insuranceDiversifiedEmployer,
    totalEmployerContributions: 0 // Calculated below
  };
  
  employerContributions.totalEmployerContributions = 
    employerContributions.nssfEmployer + employerContributions.housingLevy +
    employerContributions.trainingLevy + employerContributions.shifEmployer +
    employerContributions.participationSHIF + employerContributions.workInjury +
    employerContributions.pensionEmployer + employerContributions.insuranceDiversifiedEmployer;
  
  // 5. Calculate professional expenses and taxable net according to new formula
  const professionalExpenses = calculateProfessionalExpenses(taxableGrossSalary);
  const taxableNet = calculateTaxableNet(
    taxableGrossSalary,
    employeeContributions.nssfEmployee,
    employeeContributions.shifEmployee,
    employeeContributions.pensionEmployee,
    professionalExpenses,
    employeeContributions.insuranceDiversifiedEmployee
  );
  
  // 6. Calculate income tax with proration based on number of working days
  const creditInterest = employee.mortgageCredit?.interest || 0;
  const taxCalculation = calculateIncomeTax(taxableNet, creditInterest, employee.maritalStatus, employee.numberOfDeductions, employee.numberOfDaysPerMonth);
  
  // 7. Other deductions
  const otherDeductions = {
    mortgageCredit: employee.mortgageCredit?.monthlyAmount || 0,
    consumerCredit: employee.consumerCredit?.monthlyAmount || 0,
    salaryAdvance: employee.salaryAdvance?.monthlyAmount || 0,
    totalOtherDeductions: (employee.mortgageCredit?.monthlyAmount || 0) + 
                        (employee.consumerCredit?.monthlyAmount || 0) + 
                        (employee.salaryAdvance?.monthlyAmount || 0)
  };
  
  // 8. Final calculation
  const totalDeductions = employeeContributions.totalEmployeeContributions + taxCalculation.incomeTax + otherDeductions.totalOtherDeductions;
  const netSalaryPayable = grossSalary - totalDeductions;
  const totalEmployerCost = grossSalary + employerContributions.totalEmployerContributions;
  
  return {
    earnings,
    grossSalary,
    taxableGrossSalary,
    employeeContributions,
    employerContributions,
    taxCalculation: {
      professionalExpenses,
      ...taxCalculation
    },
    otherDeductions,
    totalDeductions,
    netSalaryPayable,
    totalEmployerCost
  };
}