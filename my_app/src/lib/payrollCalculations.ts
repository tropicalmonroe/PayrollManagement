import {
  BASE_REFERENCE_DATA,
  CONTRIBUTION_RATES,
  SENIORITY_SCALE,
  INCOME_TAX_BRACKETS,
  ALLOWANCE_CEILINGS,
  calculateCompletePayroll,
  calculateNSSFContributions,
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

// Configuration based on centralized base data and example output
export const PAYROLL_CONFIG: PayrollConfig = {
  nssfRates: {
    employeeContribution: CONTRIBUTION_RATES.nssfEmployee.taxRate, // 0.06
    employerContribution: 0.06, // Matches 1,080 for 18,000 ceiling
    housingLevy: 0.015, // Matches 600 for 40,000
    trainingLevy: 0.01, // Matches 400 for 40,000
  },
  shifRates: {
    employee: CONTRIBUTION_RATES.shifEmployee, // 0.0275
    employer: 0.0275, // Matches 1,100 for 40,000
    participation: 0.01, // Matches 400 for 40,000
  },
  insuranceRates: {
    employeeDiversified: 0.0125, // Matches 500 for 40,000
    employerDiversified: 0.0125, // Matches 500 for 40,000
    workInjury: 0.005, // Matches 200 for 40,000
  },
  pensionRates: {
    employee: 0.06, // Matches 2,400 for 40,000
    employer: 0.06, // Matches 2,400 for 40,000
  },
  ceilings: {
    nssfCeiling: 18000, // Ensures nssfEmployer = 1,080 (18,000 * 0.06)
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

export { INCOME_TAX_BRACKETS };

// Default values for contributions
export const NSSF_DEFAULTS = {
  nssfEmployee: 1080,
  shifEmployee: 1080,
  pensionEmployee: 2000,
  insuranceDiversifiedEmployee: 500,
  nssfEmployer: 1080, // Matches example
  shifEmployer: 1100, // Matches example
  pensionEmployer: 2400, // Matches example
  insuranceDiversifiedEmployer: 500, // Matches example
  workInjury: 200, // Matches example
  participationSHIF: 400, // Matches example
  trainingLevy: 400, // Matches example
  housingLevy: 600 // Matches example
};

// Contribution rates for percentage-based calculations
export const CONTRIBUTION_RATES_PERCENTAGE = {
  nssfEmployee: 0.06,
  shifEmployee: 0.0275,
  pensionEmployee: 0.06,
  insuranceDiversifiedEmployee: 0.0125,
  nssfEmployer: 0.06,
  shifEmployer: 0.0275,
  pensionEmployer: 0.06,
  insuranceDiversifiedEmployer: 0.0125,
  workInjury: 0.005,
  participationSHIF: 0.01,
  trainingLevy: 0.01,
  housingLevy: 0.015
};

// Contribution caps (maximum amounts)
export const CONTRIBUTION_CAPS = {
  nssf: 1080,
  shif: 5000,
  pension: null,
  insurance: null
};

// Seniority bonus scale
export interface SeniorityBracket {
  min: number;
  max: number;
  rate: number;
}

export { SENIORITY_SCALE };

export const OPTIONAL_INSURANCE_RATES = {
  comprehensiveHealthInsurance: 0.025,
  foreignHealthCover: 0.005,
  enhancedDisabilityCover: 0.00316,
};

export interface VariableElement {
  id: string;
  type: 'OVERTIME' | 'ABSENCE' | 'BONUS' | 'EXCEPTIONAL_BONUS' | 'LEAVE' | 'LATENESS' | 'ADVANCE' | 'OTHER';
  description: string;
  amount: number;
  hours?: number;
  rate?: number;
  date: Date;
  month: string;
  year: string;
}

export interface OptionalInsurances {
  comprehensiveHealthInsurance: boolean;
  foreignHealthCover: boolean;
  enhancedDisabilityCover: boolean;
}

export interface EmployeePayrollData {
  lastName: string;
  firstName: string;
  employeeId: string;
  idNumber: string;
  nssfNumber: string;
  maritalStatus: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
  dateOfBirth: Date;
  hireDate: Date;
  seniority: number;
  numberOfDeductions: number;
  numberOfDaysPerMonth: number;
  baseSalary: number;
  housingAllowance: number;
  mealAllowance: number;
  transportAllowance: number;
  representationAllowance: number;
  insurances: OptionalInsurances;
  mortgageCredit?: { monthlyAmount: number; interest: number };
  consumerCredit?: { monthlyAmount: number };
  salaryAdvance?: { monthlyAmount: number };
  variableElements?: VariableElement[];
  bankAccount: string;
  bankBranch: string;
  useNssfEmployee?: boolean;
  useShifEmployee?: boolean;
  usePensionEmployee?: boolean;
  useInsuranceDiversifiedEmployee?: boolean;
  useNssfEmployer?: boolean;
  useShifEmployer?: boolean;
  usePensionEmployer?: boolean;
  useInsuranceDiversifiedEmployer?: boolean;
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

export interface PayrollResult {
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

export function calculateSeniorityBonus(baseSalary: number, seniority: number): number {
  const bracket = SENIORITY_SCALE.find((t: SeniorityBracket) => seniority >= t.min && seniority < t.max);
  return bracket ? baseSalary * bracket.rate : 0;
}

export function calculateHousingAllowance(baseSalary: number, requestedAmount: number): number {
  const percentageCeiling = baseSalary * ALLOWANCE_CEILINGS.housing.maxPercentage;
  const absoluteCeiling = ALLOWANCE_CEILINGS.housing.absoluteCeiling;
  const effectiveCeiling = Math.min(percentageCeiling, absoluteCeiling);
  return Math.min(requestedAmount, effectiveCeiling);
}

export function calculateRepresentationAllowance(baseSalary: number, requestedAmount: number): number {
  const percentageCeiling = baseSalary * ALLOWANCE_CEILINGS.representation.maxPercentage;
  const absoluteCeiling = ALLOWANCE_CEILINGS.representation.absoluteCeiling;
  const effectiveCeiling = Math.min(percentageCeiling, absoluteCeiling);
  return Math.min(requestedAmount, effectiveCeiling);
}



export function calculateSHIFContributions(taxableGrossSalary: number): {
  shifEmployee: number;
  shifEmployer: number;
  participationSHIF: number;
} {
  const calculatedSHIF = taxableGrossSalary * PAYROLL_CONFIG.shifRates.employee;
  const cappedSHIF = Math.min(calculatedSHIF, CONTRIBUTION_CAPS.shif);
  return {
    shifEmployee: cappedSHIF,
    shifEmployer: taxableGrossSalary * PAYROLL_CONFIG.shifRates.employer,
    participationSHIF: taxableGrossSalary * PAYROLL_CONFIG.shifRates.participation,
  };
}

export function calculatePensionContributions(taxableGrossSalary: number): {
  pensionEmployee: number;
  pensionEmployer: number;
} {
  if (taxableGrossSalary <= CONTRIBUTION_RATES.pensionEmployee.minimumThreshold) {
    return { pensionEmployee: 0, pensionEmployer: 0 };
  }
  const calculatedPension = taxableGrossSalary * PAYROLL_CONFIG.pensionRates.employee;
  const cappedPension = CONTRIBUTION_CAPS.pension ? Math.min(calculatedPension, CONTRIBUTION_CAPS.pension) : calculatedPension;
  return {
    pensionEmployee: cappedPension,
    pensionEmployer: taxableGrossSalary * PAYROLL_CONFIG.pensionRates.employer,
  };
}

export function calculateDiversifiedInsurance(taxableGrossSalary: number): {
  insuranceDiversifiedEmployee: number;
  insuranceDiversifiedEmployer: number;
  workInjury: number;
} {
  const calculatedInsurance = taxableGrossSalary * PAYROLL_CONFIG.insuranceRates.employeeDiversified;
  const cappedInsurance = CONTRIBUTION_CAPS.insurance ? Math.min(calculatedInsurance, CONTRIBUTION_CAPS.insurance) : calculatedInsurance;
  return {
    insuranceDiversifiedEmployee: cappedInsurance,
    insuranceDiversifiedEmployer: taxableGrossSalary * PAYROLL_CONFIG.insuranceRates.employerDiversified,
    workInjury: taxableGrossSalary * PAYROLL_CONFIG.insuranceRates.workInjury,
  };
}

export function calculateOptionalInsurances(taxableGrossSalary: number, insurances: OptionalInsurances): number {
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
  personalRelief: number;
} {
  const maxDeduction = taxableNet * 0.10;
  const appliedDeduction = Math.min(creditInterest, maxDeduction);
  const netTaxable = taxableNet - appliedDeduction;
  
  const bracket = INCOME_TAX_BRACKETS.find((t: TaxBracket) => netTaxable >= t.min && netTaxable <= t.max);
  
  if (!bracket) {
    return {
      taxableNet,
      netTaxable,
      theoreticalTax: 0,
      incomeTax: 0,
      personalRelief: 0
    };
  }
  
  const monthlyTaxComplete = Math.max(0, (netTaxable * bracket.rate) - bracket.deduction);
  const theoreticalTax = monthlyTaxComplete * (numberOfDaysPerMonth / 30);
  
  // FIX: Remove the +1 - personal relief is per dependent, and the employee counts as 1
  const monthlyPersonalRelief = 2400 + (2400 * numberOfDeductions); // NOT numberOfDeductions + 1
  
  const taxAfterRelief = theoreticalTax - monthlyPersonalRelief;
  const incomeTax = Math.max(0, taxAfterRelief);
  
  return {
    taxableNet,
    netTaxable,
    theoreticalTax,
    incomeTax,
    personalRelief: monthlyPersonalRelief
  };
}
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
        absences += element.amount;
        break;
      case 'LATENESS':
        lateness += element.amount;
        break;
      case 'ADVANCE':
        variableAdvances += element.amount;
        break;
      case 'LEAVE':
        if (element.amount > 0) {
          otherEarnings += element.amount;
        } else {
          otherDeductions += Math.abs(element.amount);
        }
        break;
      case 'OTHER':
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
    absences: Math.abs(absences),
    lateness: Math.abs(lateness),
    variableAdvances: Math.abs(variableAdvances),
    otherEarnings,
    otherDeductions
  };
}

export function calculatePayroll(employee: EmployeePayrollData): PayrollResult {
  const variableElements = processVariableElements(employee.variableElements);
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
    overtimePay: variableElements.overtimePay,
    exceptionalBonuses: variableElements.exceptionalBonuses,
    otherEarnings: variableElements.otherEarnings,
    totalEarnings: employee.baseSalary + seniorityBonus + housingAllowance +
      employee.mealAllowance + employee.transportAllowance + representationAllowance +
      variableElements.overtimePay + variableElements.exceptionalBonuses +
      variableElements.otherEarnings,
    bonuses: seniorityBonus + housingAllowance + employee.mealAllowance + employee.transportAllowance + representationAllowance
  };

  const grossSalary = earnings.totalEarnings;
  const taxableGrossSalary = grossSalary - employee.transportAllowance - employee.representationAllowance;
  const nssfContributions = employee.subjectToNssf ? calculateNSSFContributions(grossSalary, taxableGrossSalary) : {
    nssfEmployee: 0,
    housingLevy: 0,
    trainingLevy: 0,
    nssfEmployer: 0
  };
  const shifContributions = employee.subjectToShif ? calculateSHIFContributions(taxableGrossSalary) : {
    shifEmployee: 0,
    shifEmployer: 0,
    participationSHIF: 0
  };
  const pensionContributions = calculatePensionContributions(taxableGrossSalary);
  const diversifiedInsurance = calculateDiversifiedInsurance(taxableGrossSalary);
  const optionalInsurances = calculateOptionalInsurances(taxableGrossSalary, employee.insurances);

  const employeeContributions = {
    nssfEmployee: employee.useNssfEmployee ?? true ? nssfContributions.nssfEmployee : NSSF_DEFAULTS.nssfEmployee,
    shifEmployee: employee.useShifEmployee ?? true ? shifContributions.shifEmployee : NSSF_DEFAULTS.shifEmployee,
    pensionEmployee: employee.usePensionEmployee ?? true ? pensionContributions.pensionEmployee : NSSF_DEFAULTS.pensionEmployee,
    insuranceDiversifiedEmployee: employee.useInsuranceDiversifiedEmployee ?? true ? diversifiedInsurance.insuranceDiversifiedEmployee : NSSF_DEFAULTS.insuranceDiversifiedEmployee,
    optionalInsurances,
    housingLevy: employee.subjectToHousingLevy ? nssfContributions.housingLevy : 0,
    totalEmployeeContributions: 0
  };

  employeeContributions.totalEmployeeContributions =
    employeeContributions.nssfEmployee + employeeContributions.shifEmployee +
    employeeContributions.pensionEmployee + employeeContributions.insuranceDiversifiedEmployee +
    employeeContributions.optionalInsurances + employeeContributions.housingLevy;

  const employerContributions = {
    nssfEmployer: employee.useNssfEmployer ?? true ? (employee.subjectToNssf ? nssfContributions.nssfEmployer : 0) : NSSF_DEFAULTS.nssfEmployer,
    housingLevy: employee.subjectToHousingLevy ? nssfContributions.housingLevy : NSSF_DEFAULTS.housingLevy,
    trainingLevy: employee.useNssfEmployer ?? true ? nssfContributions.trainingLevy : NSSF_DEFAULTS.trainingLevy,
    shifEmployer: employee.useShifEmployer ?? true ? shifContributions.shifEmployer : NSSF_DEFAULTS.shifEmployer,
    participationSHIF: employee.useShifEmployer ?? true ? shifContributions.participationSHIF : NSSF_DEFAULTS.participationSHIF,
    workInjury: employee.useInsuranceDiversifiedEmployer ?? true ? diversifiedInsurance.workInjury : NSSF_DEFAULTS.workInjury,
    pensionEmployer: employee.usePensionEmployer ?? true ? pensionContributions.pensionEmployer : NSSF_DEFAULTS.pensionEmployer,
    insuranceDiversifiedEmployer: employee.useInsuranceDiversifiedEmployer ?? true ? diversifiedInsurance.insuranceDiversifiedEmployer : NSSF_DEFAULTS.insuranceDiversifiedEmployer,
    totalEmployerContributions: 0
  };

  employerContributions.totalEmployerContributions =
    employerContributions.nssfEmployer + employerContributions.housingLevy +
    employerContributions.trainingLevy + employerContributions.shifEmployer +
    employerContributions.participationSHIF + employerContributions.workInjury +
    employerContributions.pensionEmployer + employerContributions.insuranceDiversifiedEmployer;

  const professionalExpenses = calculateProfessionalExpenses(taxableGrossSalary);

  const taxableNet = calculateTaxableNet(
    taxableGrossSalary,
    employeeContributions.nssfEmployee,
    employeeContributions.shifEmployee,
    employeeContributions.pensionEmployee,
    professionalExpenses,
    employeeContributions.insuranceDiversifiedEmployee
  );


  const creditInterest = employee.mortgageCredit?.interest || 0;
  const taxCalculation = calculateIncomeTax(taxableNet, creditInterest, employee.maritalStatus, employee.numberOfDeductions, employee.numberOfDaysPerMonth);
  const otherDeductions = {
    mortgageCredit: employee.mortgageCredit?.monthlyAmount || 0,
    consumerCredit: employee.consumerCredit?.monthlyAmount || 0,
    salaryAdvance: employee.salaryAdvance?.monthlyAmount || 0,
    totalOtherDeductions: (employee.mortgageCredit?.monthlyAmount || 0) +
      (employee.consumerCredit?.monthlyAmount || 0) +
      (employee.salaryAdvance?.monthlyAmount || 0)
  };
  const totalDeductions = employeeContributions.totalEmployeeContributions + taxCalculation.incomeTax + otherDeductions.totalOtherDeductions;
  const netSalaryPayable = grossSalary - totalDeductions;
  const totalEmployerCost = grossSalary + employerContributions.totalEmployerContributions;

  console.log('Gross Salary:', grossSalary);
  console.log('Taxable Gross Salary:', taxableGrossSalary);
  console.log('Employee Contributions:', employeeContributions);
  console.log('Professional Expenses:', professionalExpenses);
  console.log('Taxable Net:', taxableNet);
  console.log('Net Taxable:', taxCalculation.netTaxable);
  console.log('Income Tax:', taxCalculation.incomeTax);
  console.log('Personal Relief:', taxCalculation.personalRelief);
  console.log('Total Deductions:', totalDeductions);
  console.log('Net Salary Payable:', netSalaryPayable);

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