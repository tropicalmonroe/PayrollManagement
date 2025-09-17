import React, { useState, useEffect } from 'react';
import Layout from '../../layout';
import { BookOpen, ArrowLeft, Download, Calendar, Users, FileSpreadsheet, Filter } from 'lucide-react';
import { useRouter } from 'next/router';
import { Employee } from '@prisma/client';
import { calculatePayroll, OptionalInsurances, type EmployeePayrollData } from '../../../lib/payrollCalculations';

interface PayrollJournalEntry {
  employee: Employee;
  payrollData: any;
  earnings: {
    baseSalary: number;
    seniorityBonus: number;
    housingAllowance: number;
    mealAllowance: number;
    transportAllowance: number;
    representationAllowance: number;
    total: number;
  };
  deductions: {
    nssfEmployee: number;
    shifEmployee: number;
    pensionEmployee: number;
    insuranceDiversifiedEmployee: number;
    incomeTax: number;
    otherDeductions: number;
    total: number;
  };
  employerContributions: {
    nssfEmployer: number;
    shifEmployer: number;
    pensionEmployer: number;
    insuranceDiversifiedEmployer: number;
    trainingLevy: number;
    total: number;
  };
  netPayable: number;
  totalCost: number;
}

const PayrollJournalPage = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterDepartment, setFilterDepartment] = useState('');
  const [journalData, setJournalData] = useState<PayrollJournalEntry[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.filter((emp: Employee) => emp.status === 'ACTIVE'));
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

  const handleGenerateJournal = async () => {
    setGenerating(true);
    setJournalData([]);
    setShowResults(true);

    const filteredEmployees = filterDepartment 
      ? employees.filter(emp => emp.position.toLowerCase().includes(filterDepartment.toLowerCase()))
      : employees;

    const journalEntries: PayrollJournalEntry[] = [];
    let totalEarnings = 0;
    let totalDeductions = 0;
    let totalEmployerContributions = 0;
    let totalNetPayable = 0;
    let totalEmployerCost = 0;

    for (const employee of filteredEmployees) {
      try {
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
          numberOfDeductions: 0, // calculate based on dependents
          numberOfDaysPerMonth: employee.numberOfDaysPerMonth,
          
          // Salary & allowances
          baseSalary: employee.baseSalary,
          housingAllowance: employee.housingAllowance,
          mealAllowance: employee.mealAllowance,
          transportAllowance: employee.transportAllowance,
          representationAllowance: employee.representationAllowance ?? 0,
          
          // Insurances
          insurances: (employee.insurances as OptionalInsurances | null) ?? {
            comprehensiveHealthInsurance: false,
            foreignHealthCover: false,
            enhancedDisabilityCover: false,
          },
    
          
          // Additional payroll fields
          bonuses: 0,
          overtimePay: 0,
          otherDeductions: 0,
          loanRepayment: employee.loanRepayment,
          helbLoan: employee.helbLoan,
          subjectToNssf: employee.subjectToNssf,
          subjectToShif: employee.subjectToShif,
          subjectToHousingLevy: employee.subjectToHousingLevy,
          
          // Bank
          bankAccount: employee.bankAccount || '',
          bankBranch: employee.bankBranch || '',
        };

        // Calculate payroll
        const payrollResult = calculatePayroll(employeeData);

        const earnings = {
          baseSalary: employee.baseSalary,
          seniorityBonus: payrollResult.earnings.seniorityBonus,
          housingAllowance: employee.housingAllowance,
          mealAllowance: employee.mealAllowance,
          transportAllowance: employee.transportAllowance,
          representationAllowance: employee.representationAllowance,
          total: payrollResult.grossSalary
        };

        const deductions = {
          nssfEmployee: payrollResult.employeeContributions.nssfEmployee,
          shifEmployee: payrollResult.employeeContributions.shifEmployee,
          pensionEmployee: payrollResult.employeeContributions.pensionEmployee,
          insuranceDiversifiedEmployee: payrollResult.employeeContributions.insuranceDiversifiedEmployee,
          incomeTax: payrollResult.taxCalculation.incomeTax,
          otherDeductions: payrollResult.otherDeductions.totalOtherDeductions,
          total: payrollResult.totalDeductions
        };

        const employerContributions = {
          nssfEmployer: payrollResult.employerContributions.nssfEmployer,
          shifEmployer: payrollResult.employerContributions.shifEmployer,
          pensionEmployer: payrollResult.employerContributions.pensionEmployer,
          insuranceDiversifiedEmployer: payrollResult.employerContributions.insuranceDiversifiedEmployer,
          trainingLevy: payrollResult.employerContributions.trainingLevy,
          total: payrollResult.employerContributions.totalEmployerContributions
        };

        const entry: PayrollJournalEntry = {
          employee,
          payrollData: payrollResult,
          earnings,
          deductions,
          employerContributions,
          netPayable: payrollResult.netSalaryPayable,
          totalCost: payrollResult.totalEmployerCost
        };

        journalEntries.push(entry);

        // Accumulate totals
        totalEarnings += earnings.total;
        totalDeductions += deductions.total;
        totalEmployerContributions += employerContributions.total;
        totalNetPayable += entry.netPayable;
        totalEmployerCost += entry.totalCost;

      } catch (error) {
        console.error(`Error calculating for ${employee.firstName} ${employee.lastName}:`, error);
      }
    }

    setJournalData(journalEntries);
    setSummary({
      totalEmployees: journalEntries.length,
      totalEarnings,
      totalDeductions,
      totalEmployerContributions,
      totalNetPayable,
      totalEmployerCost
    });

    setGenerating(false);
  };

  const handleExportExcel = () => {
    // Create data for Excel export
    const excelData = journalData.map(entry => ({
      'Employee ID': entry.employee.employeeId,
      'Last Name': entry.employee.lastName,
      'First Name': entry.employee.firstName,
      'Position': entry.employee.position,
      'Base Salary': entry.earnings.baseSalary,
      'Seniority Bonus': entry.earnings.seniorityBonus,
      'Housing Allowance': entry.earnings.housingAllowance,
      'Meal Allowance': entry.earnings.mealAllowance,
      'Transport Allowance': entry.earnings.transportAllowance,
      'Representation Allowance': entry.earnings.representationAllowance,
      'Total Earnings': entry.earnings.total,
      'NSSF Employee': entry.deductions.nssfEmployee,
      'SHIF Employee': entry.deductions.shifEmployee,
      'Pension Employee': entry.deductions.pensionEmployee,
      'Insurance Employee': entry.deductions.insuranceDiversifiedEmployee,
      'Income Tax': entry.deductions.incomeTax,
      'Other Deductions': entry.deductions.otherDeductions,
      'Total Deductions': entry.deductions.total,
      'Net Payable': entry.netPayable,
      'NSSF Employer': entry.employerContributions.nssfEmployer,
      'SHIF Employer': entry.employerContributions.shifEmployer,
      'Pension Employer': entry.employerContributions.pensionEmployer,
      'Insurance Employer': entry.employerContributions.insuranceDiversifiedEmployer,
      'Training Levy': entry.employerContributions.trainingLevy,
      'Total Employer Contributions': entry.employerContributions.total,
      'Total Employer Cost': entry.totalCost
    }));

    // Convert to CSV for download
    const csvContent = [
      Object.keys(excelData[0]).join(','),
      ...excelData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payroll_journal_${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long'
    }).format(date);
  };

  const departments = Array.from(new Set(employees.map(emp => emp.position)));

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Loading...</div>
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
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          <div className="flex items-center space-x-3 mb-4">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Payroll Journal</h1>
          </div>
          
          <p className="text-gray-600 text-lg">
            Consolidation of all payroll entries for the month by employee for accounting and HR purposes.
          </p>
        </div>

        {!showResults ? (
          <>
            {/* Configuration */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Journal Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Period
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="payroll-input"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Journal for {getMonthLabel(selectedMonth)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Filter className="w-4 h-4 inline mr-1" />
                    Filter by position
                  </label>
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="payroll-input"
                  >
                    <option value="">All positions</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Employees included
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {filterDepartment 
                      ? employees.filter(emp => emp.position.toLowerCase().includes(filterDepartment.toLowerCase())).length
                      : employees.length
                    } employee(s)
                  </div>
                </div>
              </div>
            </div>

            {/* Employees Preview */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Employees included in the journal
                </h3>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {(filterDepartment 
                  ? employees.filter(emp => emp.position.toLowerCase().includes(filterDepartment.toLowerCase()))
                  : employees
                ).map((employee) => (
                  <div key={employee.id} className="px-6 py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">
                              {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {employee.employeeId} • {employee.position}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(employee.baseSalary)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Generate Payroll Journal</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Calculation and consolidation of payroll data for {getMonthLabel(selectedMonth)}
                  </p>
                </div>
                <button
                  onClick={handleGenerateJournal}
                  disabled={generating}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>{generating ? 'Generating...' : 'Generate Journal'}</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Results */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Payroll Journal - {getMonthLabel(selectedMonth)}</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowResults(false)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    New Generation
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export Excel</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Summary */}
            {summary && (
              <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Journal Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{summary.totalEmployees}</div>
                    <div className="text-sm text-gray-600">Employees</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{formatCurrency(summary.totalEarnings)}</div>
                    <div className="text-sm text-gray-600">Total Earnings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{formatCurrency(summary.totalDeductions)}</div>
                    <div className="text-sm text-gray-600">Total Deductions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">{formatCurrency(summary.totalEmployerContributions)}</div>
                    <div className="text-sm text-gray-600">Employer Contributions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{formatCurrency(summary.totalEmployerCost)}</div>
                    <div className="text-sm text-gray-600">Total Cost</div>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Earnings
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deductions
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net Payable
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employer Contributions
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {journalData.map((entry) => (
                      <tr key={entry.employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-600">
                                  {entry.employee.firstName.charAt(0)}{entry.employee.lastName.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {entry.employee.firstName} {entry.employee.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {entry.employee.employeeId} • {entry.employee.position}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                          {formatCurrency(entry.earnings.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600">
                          {formatCurrency(entry.deductions.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-600">
                          {formatCurrency(entry.netPayable)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-orange-600">
                          {formatCurrency(entry.employerContributions.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-purple-600">
                          {formatCurrency(entry.totalCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        TOTALS
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600">
                        {formatCurrency(summary?.totalEarnings || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-red-600">
                        {formatCurrency(summary?.totalDeductions || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-blue-600">
                        {formatCurrency(summary?.totalNetPayable || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-orange-600">
                        {formatCurrency(summary?.totalEmployerContributions || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-purple-600">
                        {formatCurrency(summary?.totalEmployerCost || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default PayrollJournalPage;