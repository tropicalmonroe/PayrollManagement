"use client";
import React, { useState, useEffect } from 'react';
import { Play, ArrowLeft, Calculator, Users, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Employee, VariableElement as PrismaVariableElement, Advance } from '@prisma/client';
import { calculatePayroll, type EmployeePayrollData } from '../../../../../lib/payrollCalculations';

interface EmployeeWithRelations extends Employee {
  variableElements: PrismaVariableElement[];
  advances: Advance[];
  otherDeductions?: number;
}

interface PayrollCalculationResult {
  employeeId: string;
  employee: Employee;
  success: boolean;
  error?: string;
  calculation?: any;
}

const MonthlyCalculationPage = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [calculationResults, setCalculationResults] = useState<PayrollCalculationResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        const activeEmployees = data.filter((emp: Employee) => emp.status === 'ACTIVE');
        setEmployees(activeEmployees);
        // Select all active employees by default
        setSelectedEmployees(activeEmployees.map((emp: Employee) => emp.id));
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(emp => emp.id));
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

  const handleCalculatePayroll = async () => {
    if (selectedEmployees.length === 0) {
      alert('Please select at least one employee');
      return;
    }

    setCalculating(true);
    setCalculationResults([]);
    setShowResults(true);

    const results: PayrollCalculationResult[] = [];

    for (const employeeId of selectedEmployees) {
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) continue;

      try {

        // Calculate bonuses and overtime from variableElements
        const bonuses = employee.variableElements
          ?.filter((v: PrismaVariableElement) => v.type === 'BONUS')
          .reduce((sum: number, v: PrismaVariableElement) => sum + v.amount, 0) || 0;
  
        const overtimePay = employee.variableElements
          ?.filter((v: PrismaVariableElement) => v.type === 'OVERTIME')
          .reduce((sum: number, v: PrismaVariableElement) => sum + v.amount, 0) || 0;
  
        // Calculate salary advance from advances
        const salaryAdvance = employee.advances?.length
          ? { monthlyAmount: employee.advances.reduce((sum: number, a: Advance) => sum + a.installmentAmount, 0) }
          : undefined;

        // Prepare employee data for calculation
        // Prepare employee data for calculation - USE CONSISTENT APPROACH
const employeeData: EmployeePayrollData = {
  lastName: employee.lastName,
  firstName: employee.firstName,
  employeeId: employee.employeeId,
  idNumber: employee.idNumber || '',
  nssfNumber: employee.nssfNumber || '',
  maritalStatus: employee.maritalStatus,
  dateOfBirth: employee.dateOfBirth || new Date(),
  hireDate: employee.hireDate,
  seniority: getSeniorityInYears(employee.hireDate),
  numberOfDeductions: employee.numberOfDeductions,
  numberOfDaysPerMonth: employee.numberOfDaysPerMonth || 26, // Changed from 30 to 26 (Kenyan standard)
  baseSalary: employee.baseSalary,
  housingAllowance: employee.housingAllowance,
  mealAllowance: employee.mealAllowance,
  transportAllowance: employee.transportAllowance,
  representationAllowance: employee.representationAllowance,
  insurances: {
    comprehensiveHealthInsurance: false,
    foreignHealthCover: false,
    enhancedDisabilityCover: false,
  },
  mortgageCredit: employee.loanRepayment ? {
    monthlyAmount: employee.loanRepayment || 0,
    interest: 0,
  } : undefined,
  consumerCredit: employee.helbLoan ? {
    monthlyAmount: employee.helbLoan,
  } : undefined,
  salaryAdvance,
  bankAccount: employee.bankAccount || '',
  bankBranch: employee.bankBranch || '',
  // ✅ CRITICAL: Set contribution preferences to use DEFAULTS for consistency
  useNssfEmployee: employee.subjectToNssf,
  useShifEmployee: employee.subjectToShif, // Use default SHIF  
  usePensionEmployee: false, // Use default pension (2,000)
  useInsuranceDiversifiedEmployee: false, // Use default insurance (500)
  bonuses,
  overtimePay,
  loanRepayment: employee.loanRepayment,
  deductibleInterest: 0,
  otherDeductions: employee.otherDeductions || 0,
  helbLoan: employee.helbLoan,
  subjectToNssf: employee.subjectToNssf,
  subjectToShif: employee.subjectToShif,
  subjectToHousingLevy: employee.subjectToHousingLevy
};

        // Perform payroll calculation
        const payrollResult = calculatePayroll(employeeData);
        
        // Convert result to expected format
        const calculation = {
          grossSalary: payrollResult.grossSalary,
          totalDeductions: payrollResult.totalDeductions,
          payeTax: payrollResult.taxCalculation.incomeTax,
          netSalary: payrollResult.netSalaryPayable,
          employeeContributions: payrollResult.employeeContributions.totalEmployeeContributions,
          employerContributions: payrollResult.employerContributions.totalEmployerContributions,
          totalEmployerCost: payrollResult.totalEmployerCost,

           // ✅ ADD DETAILED BREAKDOWN FOR CONSISTENCY CHECKING
          detailedDeductions: {
            nssf: payrollResult.employeeContributions.nssfEmployee,
            shif: payrollResult.employeeContributions.shifEmployee,
            housingLevy: payrollResult.employeeContributions.housingLevy,
            pension: payrollResult.employeeContributions.pensionEmployee,
            insurance: payrollResult.employeeContributions.insuranceDiversifiedEmployee,
            paye: payrollResult.taxCalculation.incomeTax,
            otherDeductions: payrollResult.otherDeductions.totalOtherDeductions
          },

          taxableGrossSalary: payrollResult.taxableGrossSalary,
          professionalExpenses: payrollResult.taxCalculation.professionalExpenses,
          personalRelief: payrollResult.taxCalculation.personalRelief
        };

        results.push({
          employeeId,
          employee,
          success: true,
          calculation,
        });
      } catch (error) {
        console.error(`Error during calculation for ${employee.firstName} ${employee.lastName}:`, error);
        results.push({
          employeeId,
          employee,
          success: false,
          error: error instanceof Error ? error.message : 'Error during calculation',
        });
      }

      // Update results in real-time
      setCalculationResults([...results]);
      
      // Small delay for visual effect
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setCalculating(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getMonthLabel = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'long'
    }).format(date);
  };

  const successfulCalculations = calculationResults.filter(r => r.success);
  const failedCalculations = calculationResults.filter(r => !r.success);

  return (
      <div className="p-6 bg-white mt-[2vh] rounded-md">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center space-x-1 scale-95 hover:bg-[#3890bf] transition-colors duration-300 
            mb-4 bg-rose-400 px-4 py-1 rounded-md"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
            <span className='tracking-tighter text-white'>Back</span>
                </button>
          
          <div className="flex items-center space-x-3 my-8">
          <div className="flex items-center justify-center w-10 h-10 bg-zinc-700 rounded-xl p-1">
            <Play className="w-6 h-6 text-blue-50" />
          </div>
            <h1 className="text-2xl font-bold tracking-tighter text-zinc-800">Monthly Payroll Calculation</h1>
          </div>
          
          <p className="text-zinc-400 text-sm w-[20vw] mb-8">
            Automatic payroll calculation with application of tax brackets, social security, and tax contributions based on each employee’s situation.
          </p>
        </div>

        {!showResults ? (
          <>
            {/* Calculation configuration */}
            <div className="bg-[#1f435b] p-4 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-medium text-zinc-50 mb-4 tracking-tight">Calculation Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Calculation Period 
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="payroll-input"
                  />
                  <p className="text-sm text-white mt-1">
                    Calculation for {getMonthLabel(selectedMonth)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Selected Employees
                  </label>
                  <div className="text-lg font-medium text-white">
                    <span className='tracking-normal font-semibold'>{selectedEmployees.length} / {employees.length}</span>&nbsp;employees 
                  </div>
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center justify-center space-x-1 hover:bg-blue-400 transition-colors duration-300 
                    my-4 bg-blue-200 px-4 py-1 rounded-md hover:cursor-pointer"
                  >
                    {selectedEmployees.length === employees.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>
            </div>

            {/* Employee selection */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-zinc-200">
                <h3 className="text-lg font-medium text-zinc-900">
                  Employee Selection ({employees.length} active employees)
                </h3>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {employees.map((employee) => (
                  <div key={employee.id} className="px-6 py-4 border-b border-zinc-100 last:border-b-0">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`employee-${employee.id}`}
                        checked={selectedEmployees.includes(employee.id)}
                        onChange={() => handleEmployeeSelection(employee.id)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-zinc-300 rounded"
                      />
                      <label htmlFor={`employee-${employee.id}`} className="ml-3 flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-green-600">
                                  {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-zinc-900">
                                {employee.firstName} {employee.lastName}
                              </div>
                              <div className="text-sm text-zinc-500">
                                {employee.employeeId} • {employee.position}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-zinc-500">
                            {formatCurrency(employee.baseSalary)}
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Start calculation button */}
            <div className="bg-[#1f435b] p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-zinc-50">Start Calculation</h3>
                  <p className="text-sm text-white mt-1">
                    Calculation will be performed for {selectedEmployees.length} employee(s) for the period {getMonthLabel(selectedMonth)}
                  </p>
                </div>
                <button
                  onClick={handleCalculatePayroll}
                  disabled={selectedEmployees.length === 0 || calculating}
                  className="flex items-center justify-center space-x-2 text-white bg-fuchsia-500 cursor-pointer
                        hover:bg-blue-200 hover:text-zinc-900 transition duration-300 rounded-xl px-6 py-3"
                >
                  <Calculator className="w-5 h-5" />
                  <span>Calculate Payroll</span> 
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Calculation results */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-zinc-900">Calculation Results</h3>
                <button
                  onClick={() => {
                    setShowResults(false);
                    setCalculationResults([]);
                  }}
                  className="flex items-center justify-center cursor-pointer w-fit px-4 py-2 text-white hover:text-black bg-teal-500
                            rounded-md hover:bg-blue-200 transition duration-300 ease-in-out"
                >
                  New Calculation
                </button>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#6ea0c2] p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-10 h-10 bg-white rounded-xl p-1">
                    <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-white">Total Employees</div>
                      <div className="text-2xl font-bold text-white">{selectedEmployees.length}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#5c8ab4] p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-10 h-10 bg-white rounded-xl p-1">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-white">Successful Calculations</div> 
                      <div className="text-2xl font-bold text-white">{successfulCalculations.length}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#5179a4] p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-10 h-10 bg-white rounded-xl p-1">
                    <AlertCircle className="w-8 h-8 text-rose-600" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-white">Errors</div> 
                      <div className="text-2xl font-bold text-white">{failedCalculations.length}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            {calculating && (
              <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Clock className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-lg font-medium text-zinc-900">Calculation in Progress...</span>
                </div>
                <div className="w-full bg-zinc-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(calculationResults.length / selectedEmployees.length) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-zinc-500 mt-2">
                  {calculationResults.length} / {selectedEmployees.length} employees processed 
                </p>
              </div>
            )}

            {/* Results list */}
            <div className="space-y-4">
              {calculationResults.map((result) => (
                <div key={result.employeeId} className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-zinc-600">
                            {result.employee.firstName.charAt(0)}{result.employee.lastName.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-lg font-medium text-zinc-900">
                          {result.employee.firstName} {result.employee.lastName}
                        </div>
                        <div className="text-sm text-zinc-500">
                          {result.employee.employeeId} • {result.employee.position}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {result.success ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-rose-600" />
                      )}
                    </div>
                  </div>

                  {result.success && result.calculation ? (
                  <div className="space-y-4">
                    {/* Summary row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-zinc-500">Gross Salary:</span> 
                        <div className="font-medium">{formatCurrency(result.calculation.grossSalary)}</div>
                      </div>
                      <div>
                        <span className="text-zinc-500">Total Deductions:</span> 
                        <div className="font-medium">{formatCurrency(result.calculation.totalDeductions)}</div>
                      </div>
                      <div>
                        <span className="text-zinc-500">PAYE Tax:</span> 
                        <div className="font-medium">{formatCurrency(result.calculation.payeTax)}</div>
                      </div>
                      <div>
                        <span className="text-zinc-500">Net Salary:</span> 
                        <div className="font-medium text-green-600">{formatCurrency(result.calculation.netSalary)}</div>
                      </div>
                    </div>

                    {/* ✅ ADD DETAILED DEDUCTIONS BREAKDOWN */}
                    <div className="bg-zinc-50 p-4 rounded-lg">
                      <h4 className="font-medium text-zinc-900 mb-3 text-sm">Detailed Deductions Breakdown</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-600">NSSF:</span>
                          <span className="font-medium">{formatCurrency(result.calculation.detailedDeductions.nssf)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-600">SHIF:</span>
                          <span className="font-medium">{formatCurrency(result.calculation.detailedDeductions.shif)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-600">Housing Levy:</span>
                          <span className="font-medium">{formatCurrency(result.calculation.detailedDeductions.housingLevy)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-600">Pension:</span>
                          <span className="font-medium">{formatCurrency(result.calculation.detailedDeductions.pension)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-600">Insurance:</span>
                          <span className="font-medium">{formatCurrency(result.calculation.detailedDeductions.insurance)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-600">Other Deductions:</span>
                          <span className="font-medium">{formatCurrency(result.calculation.detailedDeductions.otherDeductions)}</span>
                        </div>
                      </div>
                      
                      {/* Tax calculation details */}
                      <div className="mt-3 pt-3 border-t border-zinc-200 grid grid-cols-2 gap-3 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-600">Taxable Gross:</span>
                          <span className="font-medium">{formatCurrency(result.calculation.taxableGrossSalary)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-600">Professional Expenses:</span>
                          <span className="font-medium">{formatCurrency(result.calculation.professionalExpenses)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-rose-600 text-sm">
                    <strong>Error:</strong> {result.error}
                  </div>
                )}
                </div>
              ))}
            </div>

            {/* Final summary */}
            {!calculating && calculationResults.length > 0 && (
              <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-medium text-zinc-900 mb-4">Calculation Summary</h3> 
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-zinc-900 mb-2">Statistics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Employees Processed:</span> 
                        <span className="font-medium">{calculationResults.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Successful Calculations:</span>
                        <span className="font-medium text-green-600">{successfulCalculations.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Errors:</span>
                        <span className="font-medium text-rose-600">{failedCalculations.length}</span>
                      </div>
                    </div>
                  </div>

                  {successfulCalculations.length > 0 && (
                    <div>
                      <h4 className="font-medium text-zinc-900 mb-2">Totals</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-600">Total Gross Salaries:</span> 
                          <span className="font-medium">
                            {formatCurrency(successfulCalculations.reduce((sum, r) => sum + (r.calculation?.grossSalary || 0), 0))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-600">Total Deductions:</span> 
                          <span className="font-medium">
                            {formatCurrency(successfulCalculations.reduce((sum, r) => sum + (r.calculation?.totalDeductions || 0), 0))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-600">Total Net Salaries:</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(successfulCalculations.reduce((sum, r) => sum + (r.calculation?.netSalary || 0), 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-200">
                  <p className="text-sm text-zinc-600">
                    Payslips have been generated and are available in the “Employee Documents” section.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
  );
};

export default MonthlyCalculationPage;