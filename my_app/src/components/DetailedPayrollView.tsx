"use client";
import { Employee, Credit, Advance, VariableElement } from '@prisma/client';
import { calculatePayroll, type PayrollResult, SENIORITY_SCALE } from '../lib/payrollCalculations';
import { FaUser, FaRegIdCard } from 'react-icons/fa';
import { useEffect } from 'react';

interface DetailedPayrollViewProps {
employee: Employee & {
    credits?: Credit[];
    advances?: Advance[];
    variableElements?: VariableElement[];
};
month: string;
year: string;
}

export default function DetailedPayrollView({ employee, month, year }: DetailedPayrollViewProps) {
// Calculate credit deductions, strictly filtering by employee
const activeCredits = employee.credits?.filter(
    (credit: Credit) => credit.status === 'ACTIVE' && credit.employeeId === employee.id
) || [];
const totalCreditDeductions = activeCredits.reduce((total, credit) => total + credit.monthlyPayment, 0);

// Calculate active advances, strictly filtering by employee
const activeAdvances = employee.advances?.filter(
    (advance) => advance.status === 'IN_PROGRESS' && advance.employeeId === employee.id
) || [];
const totalAdvanceDeductions = activeAdvances.reduce((total, advance) => total + advance.installmentAmount, 0);

// Process variable elements, strictly filtering by employee and period
const variableElements = employee.variableElements?.filter(
    (el) => el.employeeId === employee.id && el.month === month && el.year === year
) || [];
const variableGains = variableElements.filter(
    (el) =>
    ['OVERTIME', 'BONUS'].includes(el.type) ||
    (['LEAVE', 'OTHER'].includes(el.type) && el.amount > 0)
);
const variableDeductions = variableElements.filter(
    (el) =>
    ['ABSENCE', 'LATE', 'ADVANCE'].includes(el.type) ||
    (['LEAVE', 'OTHER'].includes(el.type) && el.amount < 0)
);

const totalVariableGains = variableGains.reduce((total, el) => total + el.amount, 0);
const totalVariableDeductions = variableDeductions.reduce((total, el) => total + Math.abs(el.amount), 0);

// Calculate deductible interest (based on notes or estimation)
const deductibleInterest = activeCredits.reduce((total, credit) => {
    // If notes contain deductible interest, extract it
    if (credit.notes && credit.notes.includes('Deductible Interest:')) {
    const match = credit.notes.match(/Deductible Interest:\s*([\d,]+\.?\d*)/);
    if (match) {
        return total + parseFloat(match[1].replace(',', ''));
    }
    }
    // Otherwise, estimate interest (e.g., 15% of monthly payment for mortgage in Kenya)
    return total + (credit.type === 'HOUSING' ? credit.monthlyPayment * 0.15 : 0);
}, 0);

// Calculate complete payroll with all deductions (credits + advances + variable elements)
const totalOtherDeductions = totalCreditDeductions + totalAdvanceDeductions + totalVariableDeductions;

const payrollResult: PayrollResult = calculatePayroll({
    // Personal data
    lastName: employee.lastName,
    firstName: employee.firstName,
    employeeId: employee.employeeId,
    idNumber: employee.idNumber || '',
    nssfNumber: employee.nssfNumber || '',
    maritalStatus: employee.maritalStatus,
    dateOfBirth: employee.dateOfBirth || new Date(),
    hireDate: employee.hireDate,
    seniority: employee.seniority,
    numberOfDeductions: employee.numberOfDeductions || 0,
    numberOfDaysPerMonth: employee.numberOfDaysPerMonth,

    // Salary and allowances
    baseSalary: employee.baseSalary + totalVariableGains, // Add variable gains to base salary
    housingAllowance: employee.housingAllowance,
    mealAllowance: employee.mealAllowance,
    transportAllowance: employee.transportAllowance,
    representationAllowance: employee.representationAllowance,

    // Optional insurances
    insurances: employee.insurances as {
        comprehensiveHealthInsurance: boolean;
        foreignHealthCover: boolean;
        enhancedDisabilityCover: boolean;
    } || {
        comprehensiveHealthInsurance: false,
        foreignHealthCover: false,
        enhancedDisabilityCover: false,
    },

    // Credits and advances
    mortgageCredit: activeCredits.find((c) => c.type === 'HOUSING') ? {
        monthlyAmount: activeCredits.find((c) => c.type === 'HOUSING')!.monthlyPayment,
        interest: deductibleInterest,
    } : undefined,
    consumerCredit: activeCredits.find((c) => c.type === 'CONSUMER') ? {
        monthlyAmount: activeCredits.find((c) => c.type === 'CONSUMER')!.monthlyPayment,
    } : undefined,
    salaryAdvance: activeAdvances.length > 0 ? {
        monthlyAmount: totalAdvanceDeductions,
    } : undefined,

    // Bank
    bankAccount: employee.bankAccount || '',
    bankBranch: employee.bankBranch || '',

    // Contribution flags
    useNssfEmployee: employee.subjectToNssf ?? true,
    useShifEmployee: employee.subjectToShif ?? true,
    usePensionEmployee: false, // Default to false unless specified
    useInsuranceDiversifiedEmployee: false, // Default to false unless specified

    // Additional fields
    bonuses: totalVariableGains,
    overtimePay: variableGains.find((el) => el.type === 'OVERTIME')?.amount || 0,
    loanRepayment: totalCreditDeductions,
    deductibleInterest,
    otherDeductions: totalOtherDeductions,
    helbLoan: employee.helbLoan || 0,
    subjectToNssf: employee.subjectToNssf ?? true,
    subjectToShif: employee.subjectToShif ?? true,
    subjectToHousingLevy: employee.subjectToHousingLevy ?? true,
  });

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    }).format(amount);
};

const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    }).format(new Date(date));
};

const getMonthName = (monthNum: string) => {
    const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return months[parseInt(monthNum) - 1] || 'January';
};

const getMaritalStatus = () => {
    switch (employee.maritalStatus) {
    case 'SINGLE':
        return 'Single';
    case 'MARRIED':
        return 'Married';
    case 'DIVORCED':
        return 'Divorced';
    case 'WIDOWED':
        return 'Widowed';
    default:
        return employee.maritalStatus;
    }
};

// Calculate seniority in years and months
const calculateSeniority = () => {
    const hireDate = new Date(employee.hireDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - hireDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    return `${years} years ${months} months`;
};

// Calculate the correct seniority rate
const getCorrectSeniorityRate = () => {
    const tranche = SENIORITY_SCALE.find(
    (t) => employee.seniority >= t.min && (t.max === Infinity || employee.seniority < t.max)
    );
    return tranche ? tranche.rate : 0;
};

// Add this function inside your DetailedPayrollView component
const savePayrollCalculation = async () => {
try {
    const response = await fetch('/api/payroll', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        employeeId: employee.id,
        month: month,
        year: year
    }),
    });

    if (response.ok) {
    const result = await response.json();
    console.log('✅ Payroll calculation saved:', result);
    } else {
    console.error('❌ Failed to save payroll calculation');
    }
} catch (error) {
    console.error('❌ Error saving payroll calculation:', error);
}
};

// Call this when payroll is calculated
useEffect(() => {
if (payrollResult) {
    savePayrollCalculation();
}
}, [payrollResult]);

// Calculate total employer cost
const totalEmployerCost = payrollResult.grossSalary + payrollResult.employerContributions.totalEmployerContributions;

return (
    <div className="bg-zinc-50 min-h-screen">
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow border border-zinc-200">
        <div className="p-4 border-b border-zinc-200">
            <h2 className="text-lg font-semibold text-zinc-900">
            {employee.firstName} {employee.lastName}
            </h2>
            <p className="text-sm text-zinc-600">
            {employee.position} - {getMonthName(month)} {year}
            </p>
        </div>

        <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
                <p className="text-zinc-500">Employee ID</p>
                <p className="font-medium">{employee.employeeId}</p>
            </div>
            <div>
                <p className="text-zinc-500">NSSF Number</p>
                <p className="font-medium">{employee.nssfNumber || 'N/A'}</p>
            </div>
            <div>
                <p className="text-zinc-500">Hire Date</p>
                <p className="font-medium">{formatDate(employee.hireDate)}</p>
            </div>
            <div>
                <p className="text-zinc-500">Seniority</p>
                <p className="font-medium">{calculateSeniority()}</p>
            </div>
            </div>
        </div>
        </div>

        {/* Earnings */}
        <div className="bg-white rounded-lg shadow border border-zinc-200">
        <div className="p-4 border-b border-zinc-200">
            <h3 className="text-base font-semibold text-zinc-900">Earnings</h3>
        </div>

        <div className="p-4">
            <div className="space-y-3 text-sm">
            <div className="flex justify-between">
                <span>Base Salary</span>
                <span className="font-medium">{formatCurrency(employee.baseSalary)} KES</span>
            </div>
            <div className="flex justify-between">
                <span>Seniority Allowance ({(getCorrectSeniorityRate() * 100).toFixed(1)}%)</span>
                <span className="font-medium">{formatCurrency(payrollResult.earnings.seniorityBonus)} KES</span>
            </div>
            <div className="flex justify-between">
                <span>Housing Allowance</span>
                <span className="font-medium">{formatCurrency(employee.housingAllowance)} KES</span>
            </div>
            <div className="flex justify-between">
                <span>Meal Allowance</span>
                <span className="font-medium">{formatCurrency(employee.mealAllowance)} KES</span>
            </div>
            <div className="flex justify-between">
                <span>Transport Allowance</span>
                <span className="font-medium">{formatCurrency(employee.transportAllowance)} KES</span>
            </div>
            <div className="flex justify-between">
                <span>Representation Allowance</span>
                <span className="font-medium">{formatCurrency(employee.representationAllowance)} KES</span>
            </div>

            {variableGains.length > 0 && (
                <>
                <div className="border-t pt-2 mt-2">
                    <p className="text-xs text-zinc-500 mb-2">Variable Elements</p>
                    {variableGains.map((element) => (
                    <div key={element.id} className="flex justify-between">
                        <span>{element.description}</span>
                        <span className="font-medium">{formatCurrency(element.amount)} KES</span>
                    </div>
                    ))}
                </div>
                </>
            )}

            <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                <span>GROSS SALARY</span>
                <span>{formatCurrency(payrollResult.grossSalary)} KES</span>
            </div>
            </div>
        </div>
        </div>

        {/* Gross Salaries */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow border border-zinc-200 p-4">
            <h3 className="text-sm font-semibold text-zinc-900 mb-2">Gross Salary</h3>
            <p className="text-xl font-bold text-zinc-900">{formatCurrency(payrollResult.grossSalary)} KES</p>
        </div>

        <div className="bg-white rounded-lg shadow border border-zinc-200 p-4">
            <h3 className="text-sm font-semibold text-zinc-900 mb-2">Taxable Gross Salary</h3>
            <p className="text-xl font-bold text-zinc-900">{formatCurrency(payrollResult.taxCalculation.taxableNet)} KES</p>
        </div>
        </div>

        {/* Employee Contributions */}
        <div className="bg-white rounded-lg shadow border border-zinc-200">
        <div className="p-4 border-b border-zinc-200">
            <h3 className="text-base font-semibold text-zinc-900">Employee Contributions</h3>
        </div>

        <div className="p-4">
            <div className="space-y-3 text-sm">
            <div className="flex justify-between">
                <span>NSSF Contribution</span>
                <span className="font-medium">{formatCurrency(payrollResult.employeeContributions.nssfEmployee)} KES</span>
            </div>
            <div className="flex justify-between">
                <span>SHIF Contribution</span>
                <span className="font-medium">{formatCurrency(payrollResult.employeeContributions.shifEmployee)} KES</span>
            </div>
            <div className="flex justify-between">
                <span>Housing Levy</span>
                <span className="font-medium">{formatCurrency(payrollResult.employeeContributions.housingLevy)} KES</span>
            </div>
            <div className="flex justify-between">
                <span>HELB Loan Repayment</span>
                <span className="font-medium">{formatCurrency(employee.helbLoan || 0)} KES</span>
            </div>

            <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                <span>Total Employee Contributions</span>
                <span>{formatCurrency(payrollResult.employeeContributions.totalEmployeeContributions)} KES</span>
            </div>
            </div>
        </div>
        </div>

        {/* Employer Contributions */}
        <div className="bg-white rounded-lg shadow border border-zinc-200">
        <div className="p-4 border-b border-zinc-200">
            <h3 className="text-base font-semibold text-zinc-900">Employer Contributions</h3>
        </div>

        <div className="p-4">
            <div className="space-y-3 text-sm">
            <div className="flex justify-between">
                <span>NSSF Employer Contribution</span>
                <span className="font-medium">{formatCurrency(payrollResult.employerContributions.nssfEmployer)} KES</span>
            </div>
            <div className="flex justify-between">
                <span>SHIF Employer Contribution</span>
                <span className="font-medium">{formatCurrency(payrollResult.employerContributions.shifEmployer)} KES</span>
            </div>

            <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                <span>Total Employer Contributions</span>
                <span>{formatCurrency(payrollResult.employerContributions.totalEmployerContributions)} KES</span>
            </div>
            </div>
        </div>
        </div>

        {/* PAYE Calculation */}
        <div className="bg-white rounded-lg shadow border border-zinc-200">
        <div className="p-4 border-b border-zinc-200">
            <h3 className="text-base font-semibold text-zinc-900">Pay As You Earn (PAYE) Calculation</h3>
        </div>

        <div className="p-4">
            <div className="space-y-3 text-sm">
            <div className="flex justify-between">
                <span>Professional Expenses</span>
                <span className="font-medium">{formatCurrency(payrollResult.taxCalculation.professionalExpenses)} KES</span>
            </div>
            <div className="flex justify-between">
                <span>Taxable Net</span>
                <span className="font-medium">{formatCurrency(payrollResult.taxCalculation.taxableNet)} KES</span>
            </div>
            <div className="flex justify-between">
                <span>Deductible Interest (Mortgage)</span>
                <span className="font-medium">{formatCurrency(deductibleInterest)} KES</span>
            </div>
            <div className="flex justify-between">
                <span>Net Taxable Income</span>
                <span className="font-medium">{formatCurrency(payrollResult.taxCalculation.netTaxable)} KES</span>
            </div>

            <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                <span>PAYE Tax</span>
                <span>{formatCurrency(payrollResult.taxCalculation.incomeTax)} KES</span>
            </div>
            </div>
        </div>
        </div>

        {/* Other Deductions */}
        <div className="bg-white rounded-lg shadow border border-zinc-200">
        <div className="p-4 border-b border-zinc-200">
            <h3 className="text-base font-semibold text-zinc-900">Other Deductions</h3>
        </div>

        <div className="p-4">
            <div className="space-y-3 text-sm">
            {/* Credits */}
            {activeCredits.length > 0 && (
                <>
                <p className="text-xs text-zinc-500 mb-2">Loan Repayments</p>
                {activeCredits.map((credit) => (
                    <div key={credit.id} className="flex justify-between">
                    <span>Loan ({credit.type === 'HOUSING' ? 'Housing' : 'Consumer'})</span>
                    <span className="font-medium">{formatCurrency(credit.monthlyPayment)} KES</span>
                    </div>
                ))}
                </>
            )}

            {/* Advances */}
            {activeAdvances.length > 0 && (
                <>
                <p className="text-xs text-zinc-500 mb-2">Advance Repayments</p>
                {activeAdvances.map((advance) => (
                    <div key={advance.id} className="flex justify-between">
                    <span>Advance Repayment</span>
                    <span className="font-medium">{formatCurrency(advance.installmentAmount)} KES</span>
                    </div>
                ))}
                </>
            )}

            {/* Variable Deductions */}
            {variableDeductions.length > 0 && (
                <>
                <p className="text-xs text-zinc-500 mb-2">Other Variable Deductions</p>
                {variableDeductions.map((element) => (
                    <div key={element.id} className="flex justify-between">
                    <span>{element.description}</span>
                    <span className="font-medium">{formatCurrency(Math.abs(element.amount))} KES</span>
                    </div>
                ))}
                </>
            )}

            {/* Housing Levy (already included in employee contributions, but shown for clarity) */}
            <div className="flex justify-between">
                <span>Affordable Housing Levy</span>
                <span className="font-medium">{formatCurrency(payrollResult.employeeContributions.housingLevy)} KES</span>
            </div>

            <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                <span>Total Deductions</span>
                <span>{formatCurrency(payrollResult.totalDeductions)} KES</span>
            </div>
            </div>
        </div>
        </div>

        {/* Final Result */}
        <div className="bg-white rounded-lg shadow border border-zinc-200">
        <div className="p-4 border-b border-zinc-200">
            <h3 className="text-base font-semibold text-zinc-900">Final Result</h3>
        </div>

        <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
                <div className="flex justify-between">
                <span>Gross Salary</span>
                <span className="font-medium">{formatCurrency(payrollResult.grossSalary)} KES</span>
                </div>
                <div className="flex justify-between">
                <span>Total Deductions</span>
                <span className="font-medium">-{formatCurrency(payrollResult.totalDeductions)} KES</span>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between font-semibold text-base">
                <span>NET SALARY PAYABLE</span>
                <span>{formatCurrency(payrollResult.netSalaryPayable)} KES</span>
                </div>
                <div className="flex justify-between">
                <span>Total Employer Cost</span>
                <span className="font-medium">{formatCurrency(totalEmployerCost)} KES</span>
                </div>
            </div>
            </div>
        </div>
        </div>
    </div>
    </div>
);
}