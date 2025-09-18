import { Employee, Credit, Advance, VariableElement } from '@prisma/client';
import { calculateCompletePayroll, type  PayrollCalculationResult} from '../lib/payrollBaseData';
import { EmployeePayrollData } from '@/lib/payrollCalculations';

interface PayslipProps {
employee: Employee & {
    credits?: Credit[];
    advances?: Advance[];
    variableElements?: VariableElement[];
};
month: string;
year: string;
}

export default function Payslip({ employee, month, year }: PayslipProps) {
// Calculate credit deductions - FILTER STRICTLY BY EMPLOYEE
const activeCredits = employee.credits?.filter(
    (credit) => credit.status === 'ACTIVE' && credit.employeeId === employee.id
) || [];
const totalCreditDeductions = activeCredits.reduce((total, credit) => total + credit.monthlyPayment, 0);

// Calculate active advances - FILTER STRICTLY BY EMPLOYEE
const activeAdvances = employee.advances?.filter(
    (advance) => advance.status === 'IN_PROGRESS' && advance.employeeId === employee.id
) || [];
const totalAdvanceDeductions = activeAdvances.reduce((total, advance) => total + advance.installmentAmount, 0);

// Process variable elements - FILTER STRICTLY BY EMPLOYEE AND PERIOD
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
    // Otherwise, estimate interest (approx. 44% of monthly payment for mortgage)
    return total + (credit.type === 'HOUSING' ? credit.monthlyPayment * 0.44 : 0);
}, 0);

// Calculate complete payroll with all deductions (credits + advances + variable elements)
const totalOtherDeductions = totalCreditDeductions + totalAdvanceDeductions + totalVariableDeductions;
const payrollResult: PayrollCalculationResult = calculateCompletePayroll({
    lastName: employee.lastName,
    firstName: employee.firstName,
    employeeId: employee.employeeId,
    idNumber: employee.idNumber || '',
    nssfNumber: employee.nssfNumber || '',
    maritalStatus: employee.maritalStatus as 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED',
    dateOfBirth: employee.dateOfBirth || new Date(),
    hireDate: employee.hireDate,
    seniority: employee.seniority || 0,
    numberOfDeductions: employee.numberOfDeductions || 0,
    numberOfDaysPerMonth: employee.numberOfDaysPerMonth || 30,
    baseSalary: employee.baseSalary + totalVariableGains, // Add variable gains to base salary
    housingAllowance: employee.housingAllowance || 0,
    mealAllowance: employee.mealAllowance || 0,
    transportAllowance: employee.transportAllowance || 0,
    representationAllowance: employee.representationAllowance || 0,
    insurances: {
    comprehensiveHealthInsurance: false,
    foreignHealthCover: false,
    enhancedDisabilityCover: false,
    },
    mortgageCredit: activeCredits.find((c) => c.type === 'HOUSING')
    ? { monthlyAmount: activeCredits.find((c) => c.type === 'HOUSING')!.monthlyPayment, interest: deductibleInterest }
    : undefined,
    consumerCredit: activeCredits.find((c) => c.type === 'CONSUMER')
    ? { monthlyAmount: activeCredits.find((c) => c.type === 'CONSUMER')!.monthlyPayment }
    : undefined,
    salaryAdvance: activeAdvances.length > 0 ? { monthlyAmount: totalAdvanceDeductions } : undefined,
    variableElements: variableElements.map((el) => ({
    type: el.type as 'OVERTIME' | 'BONUS' | 'ABSENCE' | 'LATE' | 'ADVANCE' | 'LEAVE' | 'OTHER',
    amount: el.amount,
    hours: el.hours || 0,
    description: el.description || '',
    })),
    bankAccount: employee.bankAccount || '',
    bankBranch: employee.bankBranch || '',
    useNssfEmployee: employee.subjectToNssf ?? true,
    useShifEmployee: employee.subjectToShif ?? true,
    usePensionEmployee: false,
    useInsuranceDiversifiedEmployee: false,
    bonuses: totalVariableGains,
    overtimePay: variableGains.find((el) => el.type === 'OVERTIME')?.amount || 0,
    loanRepayment: employee.loanRepayment || 0,
    deductibleInterest,
    otherDeductions: totalOtherDeductions,
    helbLoan: employee.helbLoan || 0,
    subjectToNssf: employee.subjectToNssf ?? true,
    subjectToShif: employee.subjectToShif ?? true,
    subjectToHousingLevy: employee.subjectToHousingLevy ?? true,
} as EmployeePayrollData);

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    }).format(amount);
};

const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-KE', {
    day: '2-digit',
    month: 'long',
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
    case 'SINGLE': return 'Single';
    case 'MARRIED': return 'Married';
    case 'DIVORCED': return 'Divorced';
    case 'WIDOWED': return 'Widowed';
    default: return employee.maritalStatus;
    }
};

// Kenyan contribution rates
const nssfRate = 0.06; // 6% (capped as per Kenyan NSSF rules)
const shifRate = 0.0275; // 2.75% (SHIF contribution)
const housingLevyRate = 0.015; // 1.5% (Housing Levy)

return (
    <div className="payslip bg-white p-8 max-w-4xl mx-auto print:p-4" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
    {/* Header */}
    <div className="text-center mb-6">
        <h1 className="text-lg font-bold underline">
        Payslip for {getMonthName(month)} {year}
        </h1>
    </div>

    {/* Employee Information */}
    <div className="mb-6">
        <h2 className="text-base font-bold mb-3">{employee.firstName} {employee.lastName}</h2>

        <div className="grid grid-cols-2 gap-8 text-xs">
        <div className="space-y-1">
            <div className="flex">
            <span className="w-32">Position</span>
            <span className="mr-4">:</span>
            <span>{employee.position}</span>
            </div>
            <div className="flex">
            <span className="w-32">Date of Birth</span>
            <span className="mr-4">:</span>
            <span>{employee.dateOfBirth ? formatDate(employee.dateOfBirth) : 'Not Provided'}</span>
            </div>
            <div className="flex">
            <span className="w-32">Hire Date</span>
            <span className="mr-4">:</span>
            <span>{formatDate(employee.hireDate)}</span>
            </div>
        </div>

        <div className="space-y-1">
            <div className="flex">
            <span className="w-32">Employee ID</span>
            <span className="mr-4">:</span>
            <span>{employee.employeeId}</span>
            </div>
            <div className="flex">
            <span className="w-32">Marital Status</span>
            <span className="mr-4">:</span>
            <span>{getMaritalStatus()}</span>
            </div>
            <div className="flex">
            <span className="w-32">Bank Account</span>
            <span className="mr-4">:</span>
            <span>{employee.bankAccount || 'Not Provided'}</span>
            </div>
            <div className="flex">
            <span className="w-32">ID Number</span>
            <span className="mr-4">:</span>
            <span>{employee.idNumber || 'Not Provided'}</span>
            </div>
            <div className="flex">
            <span className="w-32">NSSF Number</span>
            <span className="mr-4">:</span>
            <span>{employee.nssfNumber || 'Not Provided'}</span>
            </div>
        </div>
        </div>
    </div>

    {/* Payslip Table */}
    <div className="border-2 border-black text-xs">
        {/* Table Header */}
        <div className="grid grid-cols-6 border-b-2 border-black bg-zinc-100 font-bold">
        <div className="border-r border-black p-1 text-center">Item</div>
        <div className="border-r border-black p-1 text-center">Days</div>
        <div className="border-r border-black p-1 text-center">Base</div>
        <div className="border-r border-black p-1 text-center">Rate</div>
        <div className="border-r border-black p-1 text-center">Earnings</div>
        <div className="p-1 text-center">Deductions</div>
        </div>

        {/* Earnings Rows */}
        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1">Base Salary</div>
        <div className="border-r border-black p-1 text-center">{employee.numberOfDaysPerMonth}</div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(payrollResult.grossSalary)}</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(payrollResult.grossSalary)}</div>
        <div className="p-1"></div>
        </div>

        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1">Seniority Bonus</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-center">{(payrollResult.earnings.seniorityBonus / payrollResult.grossSalary * 100).toFixed(1)}%</div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(payrollResult.earnings.seniorityBonus)}</div>
        <div className="p-1"></div>
        </div>

        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1">Housing Allowance</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(employee.housingAllowance || 0)}</div>
        <div className="p-1"></div>
        </div>

        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1">Transport Allowance</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(employee.transportAllowance || 0)}</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(employee.transportAllowance || 0)}</div>
        <div className="p-1"></div>
        </div>

        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1">Representation Allowance</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(employee.representationAllowance || 0)}</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(employee.representationAllowance || 0)}</div>
        <div className="p-1"></div>
        </div>

        {/* Variable Elements - Earnings */}
        {variableGains.map((element) => (
        <div key={element.id} className="grid grid-cols-6 border-b border-black">
            <div className="border-r border-black p-1">
            {element.type === 'OVERTIME' ? 'Overtime Pay' :
            element.type === 'BONUS' ? 'Exceptional Bonus' :
            element.description}
            </div>
            <div className="border-r border-black p-1 text-center">
            {element.hours ? `${element.hours}h` : ''}
            </div>
            <div className="border-r border-black p-1 text-right">
            {element.rate ? formatCurrency(element.rate) : ''}
            </div>
            <div className="border-r border-black p-1"></div>
            <div className="border-r border-black p-1 text-right">{formatCurrency(element.amount)}</div>
            <div className="p-1"></div>
        </div>
        ))}

        {/* Empty Row */}
        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="p-1"></div>
        </div>

        {/* Gross Salary */}
        <div className="grid grid-cols-6 border-b border-black font-bold">
        <div className="border-r border-black p-1">Gross Salary</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(payrollResult.grossSalary)}</div>
        <div className="p-1"></div>
        </div>

        {/* Taxable Gross Salary */}
        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1">Taxable Gross Salary</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(payrollResult.taxableGrossSalary)}</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="p-1"></div>
        </div>

        {/* Employee Contributions */}
        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1">NSSF Contribution</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(payrollResult.taxableGrossSalary)}</div>
        <div className="border-r border-black p-1 text-center">{(nssfRate * 100).toFixed(2)}%</div>
        <div className="border-r border-black p-1"></div>
        <div className="p-1 text-right">{formatCurrency(payrollResult.employeeContributions.nssfEmployee)}</div>
        </div>

        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1">SHIF Contribution</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(payrollResult.taxableGrossSalary)}</div>
        <div className="border-r border-black p-1 text-center">{(shifRate * 100).toFixed(2)}%</div>
        <div className="border-r border-black p-1"></div>
        <div className="p-1 text-right">{formatCurrency(payrollResult.employeeContributions.shifEmployee)}</div>
        </div>

        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1">Housing Levy</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(payrollResult.taxableGrossSalary)}</div>
        <div className="border-r border-black p-1 text-center">{(housingLevyRate * 100).toFixed(2)}%</div>
        <div className="border-r border-black p-1"></div>
        <div className="p-1 text-right">{formatCurrency(payrollResult.employeeContributions.housingLevy)}</div>
        </div>

        {/* PAYE Tax */}
        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1">PAYE Tax</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(payrollResult.taxCalculation.netTaxable)}</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="p-1 text-right">{formatCurrency(payrollResult.taxCalculation.incomeTax)}</div>
        </div>

        {/* Other Deductions - Active Credits */}
        {activeCredits.map((credit, index) => (
        <div key={credit.id} className="grid grid-cols-6 border-b border-black">
            <div className="border-r border-black p-1">
            {credit.type === 'HOUSING' ? 'Mortgage Repayment' : 'Consumer Loan Repayment'}
            </div>
            <div className="border-r border-black p-1"></div>
            <div className="border-r border-black p-1"></div>
            <div className="border-r border-black p-1"></div>
            <div className="border-r border-black p-1"></div>
            <div className="p-1 text-right">{formatCurrency(credit.monthlyPayment)}</div>
        </div>
        ))}

        {/* Other Deductions - Active Advances */}
        {activeAdvances.map((advance, index) => (
        <div key={advance.id} className="grid grid-cols-6 border-b border-black">
            <div className="border-r border-black p-1">Salary Advance Repayment</div>
            <div className="border-r border-black p-1"></div>
            <div className="border-r border-black p-1"></div>
            <div className="border-r border-black p-1"></div>
            <div className="border-r border-black p-1"></div>
            <div className="p-1 text-right">{formatCurrency(advance.installmentAmount)}</div>
        </div>
        ))}

        {/* Variable Elements - Deductions */}
        {variableDeductions.map((element) => (
        <div key={element.id} className="grid grid-cols-6 border-b border-black">
            <div className="border-r border-black p-1">
            {element.type === 'ABSENCE' ? 'Absence Deduction' :
            element.type === 'LATENESS' ? 'Late Deduction' :
            element.type === 'ADVANCE' ? 'Salary Advance' :
            element.description}
            </div>
            <div className="border-r border-black p-1"></div>
            <div className="border-r border-black p-1"></div>
            <div className="border-r border-black p-1"></div>
            <div className="border-r border-black p-1"></div>
            <div className="p-1 text-right">{formatCurrency(Math.abs(element.amount))}</div>
        </div>
        ))}

        {/* Empty Row */}
        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="p-1"></div>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-6 border-b-2 border-black font-bold">
        <div className="border-r border-black p-1">Totals</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(payrollResult.grossSalary)}</div>
        <div className="p-1 text-right">{formatCurrency(payrollResult.totalDeductions)}</div>
        </div>

        {/* Empty Row */}
        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="p-1"></div>
        </div>

        {/* Net Payable */}
        <div className="grid grid-cols-6 font-bold text-base">
        <div className="border-r border-black p-2">Net Payable</div>
        <div className="border-r border-black p-2"></div>
        <div className="border-r border-black p-2"></div>
        <div className="border-r border-black p-2"></div>
        <div className="border-r border-black p-2 text-right">{formatCurrency(payrollResult.netSalaryPayable)}</div>
        <div className="p-2"></div>
        </div>
    </div>

    {/* Action Buttons for Printing */}
    <div className="mt-6 text-center print:hidden">
        <button
        onClick={() => window.print()}
        className="payroll-button mr-4"
        >
        Print
        </button>
        <button
        onClick={() => {
            const element = document.querySelector('.payslip');
            if (element) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                <html>
                    <head>
                    <title>Payslip - ${employee.firstName} ${employee.lastName}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .payslip { max-width: none; }
                        table { border-collapse: collapse; width: 100%; }
                        td, th { border: 1px solid black; padding: 4px; text-align: left; }
                        .text-right { text-align: right; }
                        .text-center { text-align: center; }
                        .font-bold { font-weight: bold; }
                        .underline { text-decoration: underline; }
                    </style>
                    </head>
                    <body>
                    ${element.innerHTML}
                    </body>
                </html>
                `);
                printWindow.document.close();
                printWindow.print();
            }
            }
        }}
        className="payroll-button-secondary"
        >
        Download PDF
        </button>
    </div>
    </div>
);
}