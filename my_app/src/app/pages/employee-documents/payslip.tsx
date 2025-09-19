import React, { useState, useEffect } from 'react';
import Layout from '../../layout';
import { FileText, ArrowLeft, Download, User, Calendar, Search, Filter } from 'lucide-react';
import { useRouter } from 'next/router';
import { Employee, VariableElement as PrismaVariableElement, Advance } from '@prisma/client';
import { calculatePayroll, type EmployeePayrollData } from '../../../lib/payrollCalculations';

// Extend Employee type to include relations
interface EmployeeWithRelations extends Employee {
  variableElements: PrismaVariableElement[];
  advances: Advance[];
  otherDeductions?: number;
}

const PayslipPage = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [payrollData, setPayrollData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees?include=variableElements,advances');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.filter((emp: EmployeeWithRelations) => emp.status === 'ACTIVE'));
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
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

  const handleGeneratePayslip = async () => {
    if (!selectedEmployee) {
      alert('Please select an employee');
      return;
    }

    setGenerating(true);
    
    try {
      const employee = employees.find(emp => emp.id === selectedEmployee);
      if (!employee) {
        throw new Error('Employee not found');
      }

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
        numberOfDaysPerMonth: employee.numberOfDaysPerMonth,
        baseSalary: employee.baseSalary,
        housingAllowance: employee.housingAllowance,
        mealAllowance: employee.mealAllowance,
        bonuses,
        overtimePay,
        loanRepayment: employee.loanRepayment,
        helbLoan: employee.helbLoan,
        transportAllowance: employee.transportAllowance,
        representationAllowance: employee.representationAllowance,
        subjectToHousingLevy: employee.subjectToHousingLevy,
        subjectToNssf: employee.subjectToNssf,
        subjectToShif: employee.subjectToShif,
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
        otherDeductions: employee.otherDeductions || 0,
      };

      // Calculate payroll
      const payrollResult = calculatePayroll(employeeData);
      
      setPayrollData({
        employee,
        payroll: payrollResult,
        period: selectedMonth
      });
      setShowPreview(true);

    } catch (error) {
      console.error('Error during generation:', error);
      alert('Error generating payslip');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!payrollData) return;

    try {
      const [year, month] = payrollData.period.split('-');
      const response = await fetch('/api/documents/payslip/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: payrollData.employee.id,
          month: month,
          year: parseInt(year)
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `payslip_${payrollData.employee.employeeId}_${payrollData.period}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Error downloading PDF');
      }
    } catch (error) {
      console.error('Error during download:', error);
      alert('Error downloading PDF');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  const getMonthLabel = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long'
    }).format(date);
  };

  const filteredEmployees = employees.filter(employee =>
    employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-zinc-600">Loading...</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-zinc-600 hover:text-zinc-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span> {/* Translated Retour */}
          </button>
          
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-zinc-900">Payslip</h1>
          </div>
          
          <p className="text-zinc-600 text-lg">
            Generation of individual payslip in PDF, intended for delivery to the employee.
          </p>
        </div>

        {!showPreview ? (
          <>
            {/* Payslip configuration */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-medium text-zinc-900 mb-4">Payslip Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Period
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="payroll-input"
                  />
                  <p className="text-sm text-zinc-500 mt-1">
                    Payslip for {getMonthLabel(selectedMonth)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    <Search className="w-4 h-4 inline mr-1" />
                    Search Employee {/* Translated Rechercher un employé */}
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Name, surname, employee ID..."
                    className="payroll-input"
                  />
                </div>
              </div>
            </div>

            {/* Employee selection */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-zinc-200">
                <h3 className="text-lg font-medium text-zinc-900">
                  Select Employee ({filteredEmployees.length} employee(s))
                </h3>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {filteredEmployees.length === 0 ? (
                  <div className="p-6 text-center text-zinc-500">
                    No employees found
                  </div>
                ) : (
                  filteredEmployees.map((employee) => (
                    <div key={employee.id} className="px-6 py-4 border-b border-zinc-100 last:border-b-0">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id={`employee-${employee.id}`}
                          name="selectedEmployee"
                          value={employee.id}
                          checked={selectedEmployee === employee.id}
                          onChange={(e) => setSelectedEmployee(e.target.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-zinc-300"
                        />
                        <label htmlFor={`employee-${employee.id}`} className="ml-3 flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-600">
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
                  ))
                )}
              </div>
            </div>

            {/* Generate button */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-zinc-900">Generate Payslip</h3> 
                  <p className="text-sm text-zinc-500 mt-1">
                    {selectedEmployee ? 
                      `Payslip for ${getMonthLabel(selectedMonth)}` :
                      'Select an employee to continue'}
                  </p>
                </div>
                <button
                  onClick={handleGeneratePayslip}
                  disabled={!selectedEmployee || generating}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-5 h-5" />
                  <span>{generating ? 'Generating...' : 'Generate Payslip'}</span> 
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Payslip preview */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-zinc-900">Payslip Preview</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-sm text-zinc-600 hover:text-zinc-900"
                  >
                    Back to Selection
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span> 
                  </button>
                </div>
              </div>
            </div>

            {/* Payslip */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="p-8">
                {/* Header */}
                <div className="border-b-2 border-zinc-200 pb-6 mb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-zinc-900">PAYSLIP</h2> 
                      <p className="text-zinc-600 mt-1">Period: {getMonthLabel(payrollData.period)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-zinc-600">Employee ID</div> 
                      <div className="font-medium">{payrollData.employee.employeeId}</div>
                    </div>
                  </div>
                </div>

                {/* Employee information */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="font-medium text-zinc-900 mb-3">Employee Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Full Name:</span> 
                        <span className="font-medium">{payrollData.employee.firstName} {payrollData.employee.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Position:</span>
                        <span className="font-medium">{payrollData.employee.position}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">NSSF Number:</span> 
                        <span className="font-medium">{payrollData.employee.nssfNumber || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Hire Date:</span>
                        <span className="font-medium">{formatDate(payrollData.employee.hireDate)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-zinc-900 mb-3">Work Period</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Days Worked:</span>
                        <span className="font-medium">{payrollData.employee.numberOfDaysPerMonth} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Marital Status:</span> 
                        <span className="font-medium">{payrollData.employee.maritalStatus}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Number of Dependents:</span>
                        <span className="font-medium">{payrollData.employee.numberOfDeductions}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Earnings details */}
                <div className="mb-8">
                  <h3 className="font-medium text-zinc-900 mb-4 bg-green-50 p-3 rounded">EARNINGS</h3> 
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base Salary</span> 
                      <span className="font-medium">{formatCurrency(payrollData.employee.baseSalary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Seniority Bonus</span> 
                      <span className="font-medium">{formatCurrency(payrollData.payroll.earnings.seniorityBonus)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Housing Allowance</span> 
                      <span className="font-medium">{formatCurrency(payrollData.employee.housingAllowance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Meal Allowance</span>
                      <span className="font-medium">{formatCurrency(payrollData.employee.mealAllowance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transport Allowance</span>
                      <span className="font-medium">{formatCurrency(payrollData.employee.transportAllowance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Representation Allowance</span>
                      <span className="font-medium">{formatCurrency(payrollData.employee.representationAllowance)}</span>
                    </div>
                    {payrollData.payroll.earnings.bonuses > 0 && (
                      <div className="flex justify-between">
                        <span>Bonuses</span>
                        <span className="font-medium">{formatCurrency(payrollData.payroll.earnings.bonuses)}</span>
                      </div>
                    )}
                    {payrollData.payroll.earnings.overtimePay > 0 && (
                      <div className="flex justify-between">
                        <span>Overtime Pay</span>
                        <span className="font-medium">{formatCurrency(payrollData.payroll.earnings.overtimePay)}</span>
                      </div>
                    )}
                    <div className="border-t border-zinc-200 pt-2 flex justify-between font-medium text-lg">
                      <span>TOTAL EARNINGS</span> 
                      <span className="text-green-600">{formatCurrency(payrollData.payroll.grossSalary)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions details */}
                <div className="mb-8">
                  <h3 className="font-medium text-zinc-900 mb-4 bg-rose-50 p-3 rounded">DEDUCTIONS</h3>
                  <div className="space-y-2 text-sm">
                    <div className="font-medium text-zinc-800 mb-2">Employee Contributions:</div>
                    <div className="ml-4 space-y-1">
                      <div className="flex justify-between">
                        <span>NSSF Contribution</span> 
                        <span className="font-medium">{formatCurrency(payrollData.payroll.employeeContributions.nssfEmployee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SHIF Contribution</span>
                        <span className="font-medium">{formatCurrency(payrollData.payroll.employeeContributions.shifEmployee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pension Contribution</span>
                        <span className="font-medium">{formatCurrency(payrollData.payroll.employeeContributions.pensionEmployee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Insurance Contribution</span> 
                        <span className="font-medium">{formatCurrency(payrollData.payroll.employeeContributions.insuranceDiversifiedEmployee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Housing Levy</span> 
                        <span className="font-medium">{formatCurrency(payrollData.payroll.employeeContributions.housingLevy)}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between mt-3">
                      <span>Income Tax (PAYE)</span> 
                      <span className="font-medium">{formatCurrency(payrollData.payroll.taxCalculation.incomeTax)}</span>
                    </div>
                    
                    {payrollData.payroll.otherDeductions.totalOtherDeductions > 0 && (
                      <>
                        <div className="font-medium text-zinc-800 mb-2 mt-3">Other Deductions:</div>
                        <div className="ml-4 space-y-1">
                          {payrollData.payroll.otherDeductions.mortgageCredit > 0 && (
                            <div className="flex justify-between">
                              <span>Mortgage Loan Repayment</span>
                              <span className="font-medium">{formatCurrency(payrollData.payroll.otherDeductions.mortgageCredit)}</span>
                            </div>
                          )}
                          {payrollData.payroll.otherDeductions.consumerCredit > 0 && (
                            <div className="flex justify-between">
                              <span>Consumer Loan (HELB)</span>
                              <span className="font-medium">{formatCurrency(payrollData.payroll.otherDeductions.consumerCredit)}</span>
                            </div>
                          )}
                          {payrollData.payroll.otherDeductions.salaryAdvance > 0 && (
                            <div className="flex justify-between">
                              <span>Salary Advance Repayment</span>
                              <span className="font-medium">{formatCurrency(payrollData.payroll.otherDeductions.salaryAdvance)}</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    
                    <div className="border-t border-zinc-200 pt-2 flex justify-between font-medium text-lg">
                      <span>TOTAL DEDUCTIONS</span> 
                      <span className="text-rose-600">{formatCurrency(payrollData.payroll.totalDeductions)}</span>
                    </div>
                  </div>
                </div>

                {/* Net payable */}
                <div className="bg-zinc-50 p-6 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-zinc-900">NET PAYABLE</span> 
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(payrollData.payroll.netSalaryPayable)}
                    </span>
                  </div>
                </div>

                {/* Bank information */}
                {payrollData.employee.bankAccount && (
                  <div className="mt-6 pt-6 border-t border-zinc-200">
                    <h3 className="font-medium text-zinc-900 mb-2">Bank Information</h3> 
                    <div className="text-sm text-zinc-600">
                      <div>Account: {payrollData.employee.bankAccount}</div>
                      {payrollData.employee.bankBranch && <div>Branch: {payrollData.employee.bankBranch}</div>} 
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default PayslipPage;