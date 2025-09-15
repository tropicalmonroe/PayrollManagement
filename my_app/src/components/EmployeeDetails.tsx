import { Employee } from '@prisma/client';
import { calculatePayroll, type EmployeePayrollData, type PayrollResult, INCOME_TAX_BRACKETS, TaxBracket } from '../lib/payrollCalculations';

interface EmployeeDetailsProps {
employee: Employee;
onClose: () => void;
onEdit: () => void;
}

export default function EmployeeDetails({ employee, onClose, onEdit }: EmployeeDetailsProps) {
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
    }).format(amount);
};

const formatDate = (date: Date | null) => {
    if (!date) return 'Not Provided';
    return new Intl.DateTimeFormat('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    }).format(new Date(date));
};

const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(2)}%`;
};

const calculateAge = (birthDate: Date | null) => {
    if (!birthDate) return 'Not Provided';
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return `${age - 1} years`;
    }
    return `${age} years`;
};

const calculateSeniority = (hireDate: Date) => {
    const today = new Date();
    const hire = new Date(hireDate);
    const years = today.getFullYear() - hire.getFullYear();
    const months = today.getMonth() - hire.getMonth();

    let totalMonths = years * 12 + months;
    if (today.getDate() < hire.getDate()) {
    totalMonths--;
    }

    const seniorityYears = Math.floor(totalMonths / 12);
    const seniorityMonths = totalMonths % 12;

    if (seniorityYears === 0) {
    return `${seniorityMonths} months`;
    } else if (seniorityMonths === 0) {
    return `${seniorityYears} year${seniorityYears > 1 ? 's' : ''}`;
    } else {
    return `${seniorityYears} year${seniorityYears > 1 ? 's' : ''} and ${seniorityMonths} months`;
    }
};

const getSeniorityInYears = (hireDate: Date) => {
    const today = new Date();
    const hire = new Date(hireDate);
    const years = today.getFullYear() - hire.getFullYear();
    const months = today.getMonth() - hire.getMonth();

    let totalMonths = years * 12 + months;
    if (today.getDate() < hire.getDate()) {
    totalMonths--;
    }

    return totalMonths / 12;
};

const getMaritalStatus = (status: string) => {
    switch (status) {
    case 'SINGLE':
        return 'Single';
    case 'MARRIED':
        return 'Married';
    case 'DIVORCED':
        return 'Divorced';
    case 'WIDOWED':
        return 'Widowed';
    default:
        return status;
    }
};

const getStatusBadge = (status: string) => {
    switch (status) {
    case 'ACTIVE':
        return <span className="status-active">Active</span>;
    case 'SUSPENDED':
        return <span className="status-pending">Suspended</span>;
    case 'RESIGNED':
    case 'TERMINATED':
    case 'RETIRED':
        return <span className="status-inactive">{status.charAt(0) + status.slice(1).toLowerCase()}</span>;
    default:
        return <span className="status-pending">{status}</span>;
    }
};

// Calculate complete payroll for this employee
const employeeData: EmployeePayrollData = {
    lastName: employee.lastName,
    firstName: employee.firstName,
    employeeId: employee.employeeId,
    idNumber: employee.idNumber || '',
    nssfNumber: employee.nssfNumber || '',
    maritalStatus: employee.maritalStatus as 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED',
    dateOfBirth: employee.dateOfBirth || new Date(),
    hireDate: employee.hireDate,
    seniority: getSeniorityInYears(employee.hireDate),
    numberOfDeductions: employee.numberOfDeductions || 0,
    numberOfDaysPerMonth: employee.numberOfDaysPerMonth || 30,
    baseSalary: employee.baseSalary,
    housingAllowance: employee.housingAllowance || 0,
    mealAllowance: employee.mealAllowance || 0,
    transportAllowance: employee.transportAllowance || 0,
    representationAllowance: employee.representationAllowance || 0,
    insurances: {
    comprehensiveHealthInsurance: false,
    foreignHealthCover: false,
    enhancedDisabilityCover: false,
    },
    mortgageCredit:  undefined,
    consumerCredit: undefined, // Removed due to missing property
    salaryAdvance: undefined, // Removed due to missing property
    variableElements: [],
    bankAccount: employee.bankAccount || '',
    bankBranch: employee.bankBranch || '',
    useNssfEmployee: employee.subjectToNssf ?? true,
    useShifEmployee: employee.subjectToShif ?? true,
    usePensionEmployee: false,
    useInsuranceDiversifiedEmployee: false,
    bonuses: 0,
    overtimePay: 0,
    loanRepayment: employee.loanRepayment || 0,
    deductibleInterest: 0, // Set to 0 as it’s not available
    otherDeductions: 0,
    helbLoan: employee.helbLoan || 0,
    subjectToNssf: employee.subjectToNssf ?? true,
    subjectToShif: employee.subjectToShif ?? true,
    subjectToHousingLevy: employee.subjectToHousingLevy ?? true,
};

const payrollResult = calculatePayroll(employeeData);

return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
        <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-lg font-medium text-blue-600">
                {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                </span>
            </div>
            </div>
            <div className="ml-4">
            <h2 className="text-xl font-semibold text-gray-900">
                Full Payroll Details - {employee.firstName} {employee.lastName}
            </h2>
            <p className="text-sm text-gray-500">
                {employee.employeeId} • {employee.position}
            </p>
            </div>
        </div>
        <div className="flex items-center space-x-2">
            {getStatusBadge(employee.status)}
            <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            >
            ✕
            </button>
        </div>
        </div>

        {/* Content */}
        <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Column 1: Personal & Professional Info */}
            <div className="space-y-6">
            {/* Personal Information */}
            <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-blue-900 mb-4">Personal Information</h3>
                <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                    <span className="font-medium text-blue-700">First Name & Last Name:</span>
                    <div className="text-blue-900">{employee.firstName} {employee.lastName}</div>
                    </div>
                    <div>
                    <span className="font-medium text-blue-700">Employee ID:</span>
                    <div className="text-blue-900">{employee.employeeId}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                    <span className="font-medium text-blue-700">Position:</span>
                    <div className="text-blue-900">{employee.position}</div>
                    </div>
                    <div>
                    <span className="font-medium text-blue-700">ID Number:</span>
                    <div className="text-blue-900">{employee.idNumber || 'Not Provided'}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                    <span className="font-medium text-blue-700">KRA PIN:</span>
                    <div className="text-blue-900">{employee.kraPin || 'Not Provided'}</div>
                    </div>
                    <div>
                    <span className="font-medium text-blue-700">NSSF Number:</span>
                    <div className="text-blue-900">{employee.nssfNumber || 'Not Provided'}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                    <span className="font-medium text-blue-700">Marital Status:</span>
                    <div className="text-blue-900">{getMaritalStatus(employee.maritalStatus)}</div>
                    </div>
                    <div>
                    <span className="font-medium text-blue-700">Date of Birth:</span>
                    <div className="text-blue-900">{formatDate(employee.dateOfBirth)}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                    <span className="font-medium text-blue-700">Hire Date:</span>
                    <div className="text-blue-900">{formatDate(employee.hireDate)}</div>
                    </div>
                    <div>
                    <span className="font-medium text-blue-700">Seniority:</span>
                    <div className="text-blue-900">{calculateSeniority(employee.hireDate)}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                    <span className="font-medium text-blue-700">Number of Deductions:</span>
                    <div className="text-blue-900">{employee.numberOfDeductions || 0}</div>
                    </div>
                    <div>
                    <span className="font-medium text-blue-700">Days per Month:</span>
                    <div className="text-blue-900">{employee.numberOfDaysPerMonth || 30} days</div>
                    </div>
                </div>
                </div>
            </div>

            {/* Salary and Allowances */}
            <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-green-900 mb-4">Salary and Allowances</h3>
                <div className="space-y-3 text-sm">
                <div>
                    <span className="font-medium text-green-700">Base Salary:</span>
                    <div className="text-lg font-semibold text-green-900">{formatCurrency(employee.baseSalary)}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                    <span className="font-medium text-green-700">Seniority Rate:</span>
                    <div className="text-green-900">{formatPercentage(payrollResult.earnings.seniorityBonus / employee.baseSalary)}</div>
                    </div>
                    <div>
                    <span className="font-medium text-green-700">Seniority Allowance:</span>
                    <div className="text-green-900">{formatCurrency(payrollResult.earnings.seniorityBonus)}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                    <span className="font-medium text-green-700">Housing Allowance:</span>
                    <div className="text-green-900">{formatCurrency(employee.housingAllowance || 0)}</div>
                    </div>
                    <div>
                    <span className="font-medium text-green-700">Meal Allowance:</span>
                    <div className="text-green-900">{formatCurrency(employee.mealAllowance || 0)}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                    <span className="font-medium text-green-700">Transport Allowance:</span>
                    <div className="text-green-900">{formatCurrency(employee.transportAllowance || 0)}</div>
                    </div>
                    <div>
                    <span className="font-medium text-green-700">Representation Allowance:</span>
                    <div className="text-green-900">{formatCurrency(employee.representationAllowance || 0)}</div>
                    </div>
                </div>

                <div className="border-t border-green-200 pt-2">
                    <span className="font-medium text-green-700">Gross Salary:</span>
                    <div className="text-xl font-bold text-green-900">{formatCurrency(payrollResult.grossSalary)}</div>
                </div>

                <div>
                    <span className="font-medium text-green-700">Taxable Gross Salary:</span>
                    <div className="text-lg font-semibold text-green-900">{formatCurrency(payrollResult.taxableGrossSalary)}</div>
                </div>
                </div>
            </div>

            {/* Bank Account */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Bank Account</h3>
                <div className="space-y-2 text-sm">
                <div>
                    <span className="font-medium text-gray-700">Bank Account:</span>
                    <div className="text-gray-900">{employee.bankAccount || 'Not Provided'}</div>
                </div>
                <div>
                    <span className="font-medium text-gray-700">Bank Branch:</span>
                    <div className="text-gray-900">{employee.bankBranch || 'Not Provided'}</div>
                </div>
                </div>
            </div>
            </div>

            {/* Column 2: Contributions and Taxes */}
            <div className="space-y-6">
            {/* Employee Contributions */}
            <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-orange-900 mb-4">Employee Contributions</h3>
                <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium text-orange-700">NSSF Contribution:</span>
                    <div className="text-orange-900 text-right">{formatCurrency(payrollResult.employeeContributions.nssfEmployee)}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium text-orange-700">SHIF Contribution:</span>
                    <div className="text-orange-900 text-right">{formatCurrency(payrollResult.employeeContributions.shifEmployee)}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium text-orange-700">Housing Levy:</span>
                    <div className="text-orange-900 text-right">{formatCurrency(payrollResult.employeeContributions.housingLevy)}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium text-orange-700">Pension Contribution:</span>
                    <div className="text-orange-900 text-right">{formatCurrency(payrollResult.employeeContributions.pensionEmployee)}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium text-orange-700">Insurance Diversified:</span>
                    <div className="text-orange-900 text-right">{formatCurrency(payrollResult.employeeContributions.insuranceDiversifiedEmployee)}</div>
                </div>

                <div className="border-t border-orange-200 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium text-orange-700">Total Employee Contributions:</span>
                    <div className="text-lg font-semibold text-orange-900 text-right">{formatCurrency(payrollResult.employeeContributions.totalEmployeeContributions)}</div>
                    </div>
                </div>
                </div>
            </div>

            {/* Employer Contributions */}
            <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-purple-900 mb-4">Employer Contributions</h3>
                <div className="space-y-3 text-sm">
                <div>
                    <span className="font-medium text-purple-700">NSSF Employer Contribution:</span>
                    <div className="text-purple-900">{formatCurrency(payrollResult.employerContributions.nssfEmployer)}</div>
                </div>

                <div>
                    <span className="font-medium text-purple-700">SHIF Employer Contribution:</span>
                    <div className="text-purple-900">{formatCurrency(payrollResult.employerContributions.shifEmployer)}</div>
                </div>

                <div>
                    <span className="font-medium text-purple-700">Housing Levy:</span>
                    <div className="text-purple-900">{formatCurrency(payrollResult.employerContributions.housingLevy)}</div>
                </div>

                <div>
                    <span className="font-medium text-purple-700">Training Levy:</span>
                    <div className="text-purple-900">{formatCurrency(payrollResult.employerContributions.trainingLevy)}</div>
                </div>

                <div>
                    <span className="font-medium text-purple-700">Pension Employer Contribution:</span>
                    <div className="text-purple-900">{formatCurrency(payrollResult.employerContributions.pensionEmployer)}</div>
                </div>

                <div>
                    <span className="font-medium text-purple-700">Insurance Diversified Employer:</span>
                    <div className="text-purple-900">{formatCurrency(payrollResult.employerContributions.insuranceDiversifiedEmployer)}</div>
                </div>

                <div>
                    <span className="font-medium text-purple-700">Work Injury Contribution:</span>
                    <div className="text-purple-900">{formatCurrency(payrollResult.employerContributions.workInjury)}</div>
                </div>

                <div>
                    <span className="font-medium text-purple-700">SHIF Participation:</span>
                    <div className="text-purple-900">{formatCurrency(payrollResult.employerContributions.participationSHIF)}</div>
                </div>

                <div className="border-t border-purple-200 pt-2">
                    <span className="font-medium text-purple-700">Total Employer Contributions:</span>
                    <div className="text-lg font-semibold text-purple-900">{formatCurrency(payrollResult.employerContributions.totalEmployerContributions)}</div>
                </div>
                </div>
            </div>

            {/* PAYE Calculation */}
            <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-indigo-900 mb-4">PAYE (Pay As You Earn) Calculation</h3>
                <div className="space-y-4 text-sm">
                {/* Step 1: Calculate Taxable Net */}
                <div className="bg-white p-3 rounded border border-indigo-200">
                    <div className="font-medium text-indigo-800 mb-2">📊 Step 1: Calculate Taxable Net</div>
                    <div className="space-y-1 text-xs ml-2">
                    <div className="flex justify-between">
                        <span className="text-indigo-600">Taxable Gross Salary:</span>
                        <span className="font-medium text-indigo-800">{formatCurrency(payrollResult.taxableGrossSalary)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-indigo-600">- Employee Contributions:</span>
                        <span className="font-medium text-red-600">-{formatCurrency(payrollResult.employeeContributions.totalEmployeeContributions)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-indigo-600">- Professional Expenses:</span>
                        <span className="font-medium text-red-600">-{formatCurrency(payrollResult.taxCalculation.professionalExpenses)}</span>
                    </div>
                    <div className="border-t border-indigo-300 pt-1 flex justify-between font-medium">
                        <span className="text-indigo-700">Taxable Net:</span>
                        <span className="text-indigo-900">{formatCurrency(payrollResult.taxCalculation.taxableNet)}</span>
                    </div>
                    </div>
                </div>

                {/* Step 2: Deduct Mortgage Interest */}
                <div className="bg-white p-3 rounded border border-indigo-200">
                    <div className="font-medium text-indigo-800 mb-2">🏠 Step 2: Deduct Mortgage Interest</div>
                    <div className="space-y-1 text-xs ml-2">
                    <div className="flex justify-between">
                        <span className="text-indigo-600">Taxable Net:</span>
                        <span className="font-medium text-indigo-800">{formatCurrency(payrollResult.taxCalculation.taxableNet)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-indigo-600">- Deductible Interest (Mortgage):</span>
                        <span className="font-medium text-red-600">-{formatCurrency(0)}</span>
                    </div>
                    <div className="border-t border-indigo-300 pt-1 flex justify-between font-medium">
                        <span className="text-indigo-700">Net Taxable Income:</span>
                        <span className="text-indigo-900">{formatCurrency(payrollResult.taxCalculation.netTaxable)}</span>
                    </div>
                    </div>
                </div>

                {/* Step 3: Apply PAYE Tax Brackets */}
                <div className="bg-white p-3 rounded border border-indigo-200">
                    <div className="font-medium text-indigo-800 mb-2">📈 Step 3: Apply PAYE Tax Brackets</div>
                    <div className="space-y-1 text-xs ml-2">
                    {(() => {
                        const netTaxable = payrollResult.taxCalculation.netTaxable;
                        const bracket = INCOME_TAX_BRACKETS.find(
                        (b: TaxBracket) => netTaxable >= b.min && (b.max === Infinity || netTaxable <= b.max)
                        );
                        // If no bracket found, default to the lowest bracket
                        // This should not happen as the lowest bracket starts from 0
                        // but we add this for safety
                        const slice = bracket ? `${formatCurrency(bracket.min)} - ${bracket.max === Infinity ? 'Above' : formatCurrency(bracket.max)}` : 'N/A';
                        const theRate = bracket ? bracket.rate * 100 : 0;
                        const deduction = bracket ? bracket.deduction : 0;
                        const theoreticalTax = Math.max(0, netTaxable * (theRate / 100) - deduction);

                        return (
                        <>
                            <div className="flex justify-between">
                            <span className="text-indigo-600">Applicable Bracket:</span>
                            <span className="font-medium text-indigo-800">{slice}</span>
                            </div>
                            <div className="flex justify-between">
                            <span className="text-indigo-600">Tax Rate:</span>
                            <span className="font-medium text-indigo-800">{theRate}%</span>
                            </div>
                            <div className="flex justify-between">
                            <span className="text-indigo-600">Tax Deduction:</span>
                            <span className="font-medium text-indigo-800">{formatCurrency(deduction)}</span>
                            </div>
                            <div className="flex justify-between">
                            <span className="text-indigo-600">Calculation: ({formatCurrency(netTaxable)} × {theRate}%) - {formatCurrency(deduction)}</span>
                            <span className="font-medium text-indigo-800">{formatCurrency(theoreticalTax)}</span>
                            </div>
                        </>
                        );
                    })()}
                    </div>
                </div>

                {/* Step 4: Apply Personal Relief */}
                <div className="bg-white p-3 rounded border border-indigo-200">
                    <div className="font-medium text-indigo-800 mb-2">👨‍👩‍👧‍👦 Step 4: Apply Personal Relief</div>
                    <div className="space-y-1 text-xs ml-2">
                    <div className="flex justify-between">
                        <span className="text-indigo-600">Theoretical Tax:</span>
                        <span className="font-medium text-indigo-800">{formatCurrency(payrollResult.taxCalculation.theoreticalTax)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-indigo-600">Personal Relief (Monthly):</span>
                        <span className="font-medium text-indigo-800">{formatCurrency(2400)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-indigo-600">Calculation: MAX(0, {formatCurrency(payrollResult.taxCalculation.theoreticalTax)} - {formatCurrency(2400)})</span>
                        <span className="font-medium text-indigo-800">{formatCurrency(payrollResult.taxCalculation.incomeTax)}</span>
                    </div>
                    </div>
                </div>

                {/* Final PAYE Result */}
                <div className="bg-indigo-100 p-3 rounded border-2 border-indigo-300">
                    <div className="flex justify-between items-center">
                    <span className="font-bold text-indigo-900">💰 Final PAYE Tax:</span>
                    <span className="text-xl font-bold text-indigo-900">{formatCurrency(payrollResult.taxCalculation.incomeTax)}</span>
                    </div>
                    <div className="text-xs text-indigo-700 mt-1">
                    Formula: MAX(0, Theoretical Tax - Personal Relief)
                    </div>
                </div>
                </div>
            </div>
            </div>

            {/* Column 3: Other Deductions and Final Result */}
            <div className="space-y-6">
            {/* Other Deductions */}
            <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-red-900 mb-4">Other Deductions</h3>
                <div className="space-y-3 text-sm">
                <div>
                    <span className="font-medium text-red-700">Mortgage Loan Repayment:</span>
                    <div className="text-red-900">{formatCurrency(employee.loanRepayment || 0)}</div>
                </div>

                <div>
                    <span className="font-medium text-red-700">HELB Loan:</span>
                    <div className="text-red-900">{formatCurrency(employee.helbLoan || 0)}</div>
                </div>

                <div className="border-t border-red-200 pt-2">
                    <span className="font-medium text-red-700">Total Other Deductions:</span>
                    <div className="text-lg font-semibold text-red-900">{formatCurrency(payrollResult.otherDeductions.totalOtherDeductions)}</div>
                </div>
                </div>
            </div>

            {/* Total Deductions */}
            <div className="bg-red-100 p-4 rounded-lg border-2 border-red-300">
                <h3 className="text-lg font-medium text-red-900 mb-4">Total Deductions</h3>
                <div className="space-y-2 text-sm">
                <div className="bg-red-50 p-3 rounded border border-red-200">
                    <div className="font-medium text-red-800 mb-2">Employee Contributions:</div>
                    <div className="space-y-1 text-xs ml-2">
                    <div className="flex justify-between">
                        <span className="text-red-600">NSSF Contribution:</span>
                        <span className="font-medium text-red-800">{formatCurrency(payrollResult.employeeContributions.nssfEmployee)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-red-600">SHIF Contribution:</span>
                        <span className="font-medium text-red-800">{formatCurrency(payrollResult.employeeContributions.shifEmployee)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-red-600">Housing Levy:</span>
                        <span className="font-medium text-red-800">{formatCurrency(payrollResult.employeeContributions.housingLevy)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-red-600">Pension Contribution:</span>
                        <span className="font-medium text-red-800">{formatCurrency(payrollResult.employeeContributions.pensionEmployee)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-red-600">Insurance Diversified:</span>
                        <span className="font-medium text-red-800">{formatCurrency(payrollResult.employeeContributions.insuranceDiversifiedEmployee)}</span>
                    </div>
                    <div className="border-t border-red-300 pt-1 flex justify-between font-medium">
                        <span className="text-red-700">Total:</span>
                        <span className="text-red-900">{formatCurrency(payrollResult.employeeContributions.totalEmployeeContributions)}</span>
                    </div>
                    </div>
                </div>

                <div className="flex justify-between">
                    <span className="text-red-700">PAYE Tax:</span>
                    <span className="font-medium text-red-900">{formatCurrency(payrollResult.taxCalculation.incomeTax)}</span>
                </div>

                <div className="bg-red-50 p-3 rounded border border-red-200">
                    <div className="font-medium text-red-800 mb-2">Other Deductions:</div>
                    <div className="space-y-1 text-xs ml-2">
                    <div className="flex justify-between">
                        <span className="text-red-600">Mortgage Loan Repayment:</span>
                        <span className="font-medium text-red-800">{formatCurrency(employee.loanRepayment || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-red-600">HELB Loan:</span>
                        <span className="font-medium text-red-800">{formatCurrency(employee.helbLoan || 0)}</span>
                    </div>
                    <div className="border-t border-red-300 pt-1 flex justify-between font-medium">
                        <span className="text-red-700">Total:</span>
                        <span className="text-red-900">{formatCurrency(payrollResult.otherDeductions.totalOtherDeductions)}</span>
                    </div>
                    </div>
                </div>

                <div className="border-t border-red-300 pt-2 flex justify-between font-bold">
                    <span className="text-red-900">Total Deductions:</span>
                    <span className="text-xl font-bold text-red-900">{formatCurrency(payrollResult.totalDeductions)}</span>
                </div>
                </div>
            </div>

            {/* Final Result */}
            <div className="bg-green-100 p-6 rounded-lg border-2 border-green-300">
                <h3 className="text-xl font-bold text-green-900 mb-4">Final Result</h3>
                <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg">
                    <span className="font-medium text-green-700">Net Salary Payable:</span>
                    <div className="text-3xl font-bold text-green-900">{formatCurrency(payrollResult.netSalaryPayable)}</div>
                </div>

                <div className="bg-white p-3 rounded-lg">
                    <span className="font-medium text-green-700">Total Employer Cost:</span>
                    <div className="text-xl font-semibold text-green-900">{formatCurrency(payrollResult.totalEmployerCost)}</div>
                </div>
                </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
                <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-700">Gross Salary:</span>
                    <span className="font-medium">{formatCurrency(payrollResult.grossSalary)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-700">- Employee Contributions:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(payrollResult.employeeContributions.totalEmployeeContributions)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-700">- PAYE Tax:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(payrollResult.taxCalculation.incomeTax)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-700">- Other Deductions:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(payrollResult.otherDeductions.totalOtherDeductions)}</span>
                </div>
                <div className="border-t border-gray-300 pt-2 flex justify-between font-bold text-lg">
                    <span className="text-gray-900">Net Payable:</span>
                    <span className="text-green-600">{formatCurrency(payrollResult.netSalaryPayable)}</span>
                </div>
                </div>
            </div>

            {/* System Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
                <div className="space-y-2 text-xs text-gray-600">
                <div>
                    <span>Created At: </span>
                    {formatDate(employee.createdAt)}
                </div>
                <div>
                    <span>Updated At: </span>
                    {formatDate(employee.updatedAt)}
                </div>
                </div>
            </div>
            </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
            onClick={onClose}
            className="payroll-button-secondary"
            >
            Close
            </button>
            <button
            onClick={onEdit}
            className="payroll-button"
            >
            Edit
            </button>
        </div>
        </div>
    </div>
    </div>
);
}