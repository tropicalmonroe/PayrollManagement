"use client";
import React, { useState, useEffect } from 'react';
import { Receipt, ArrowLeft, Download, Calendar, Users, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Employee } from '@prisma/client';
import { calculatePayroll, OptionalInsurances, type EmployeePayrollData } from '../../../../../lib/payrollCalculations';

interface TaxStatementEntry {
  employee: Employee;
  grossSalary: number;
  taxableNet: number;
  taxDeductions: number;
  taxableBase: number;
  payeCalculated: number;
  payeWithheld: number;
  averageRate: number;
}

const TaxStatementPage = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString());
  const [statementData, setStatementData] = useState<TaxStatementEntry[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [reportType, setReportType] = useState<'monthly' | 'annual'>('monthly');
  const [companyInfo, setCompanyInfo] = useState({
    name: 'YOUR COMPANY',
    taxNumber: 'P051123456A',
    address: 'Company Address',
    city: 'Nairobi'
  });

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

  const handleGenerateStatement = async () => {
    setGenerating(true);
    setStatementData([]);
    setShowResults(true);

    const statementEntries: TaxStatementEntry[] = [];
    let totalGrossSalary = 0;
    let totalTaxableNet = 0;
    let totalTaxDeductions = 0;
    let totalTaxableBase = 0;
    let totalPayeCalculated = 0;
    let totalPayeWithheld = 0;

    for (const employee of employees) {
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
          numberOfDeductions: 0, // Calculate based on dependents
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
          loanRepayment: employee.loanRepayment,
          helbLoan: employee.helbLoan,
          subjectToNssf: employee.subjectToNssf,
          subjectToShif: employee.subjectToShif,
          subjectToHousingLevy: employee.subjectToHousingLevy,
          otherDeductions: 0,
          
          // Bank
          bankAccount: employee.bankAccount || '',
          bankBranch: employee.bankBranch || '',
        };

        // Calculate payroll
        const payrollResult = calculatePayroll(employeeData);

        // PAYE-specific calculations
        const grossSalary = payrollResult.grossSalary;
        const taxableNet = payrollResult.taxCalculation.taxableNet;
        const taxDeductions = payrollResult.taxCalculation.professionalExpenses;
        const taxableBase = payrollResult.taxCalculation.netTaxable;
        const payeCalculated = payrollResult.taxCalculation.incomeTax;
        const payeWithheld = payrollResult.taxCalculation.incomeTax; // Same value for PAYE withheld
        
        const averageRate = taxableBase > 0 ? (payeCalculated / taxableBase) * 100 : 0;

        const entry: TaxStatementEntry = {
          employee,
          grossSalary,
          taxableNet,
          taxDeductions,
          taxableBase,
          payeCalculated,
          payeWithheld,
          averageRate
        };

        statementEntries.push(entry);

        // Accumulate totals
        totalGrossSalary += grossSalary;
        totalTaxableNet += taxableNet;
        totalTaxDeductions += taxDeductions;
        totalTaxableBase += taxableBase;
        totalPayeCalculated += payeCalculated;
        totalPayeWithheld += payeWithheld;

      } catch (error) {
        console.error(`Error calculating for ${employee.firstName} ${employee.lastName}:`, error);
      }
    }

    setStatementData(statementEntries);
    setSummary({
      totalEmployees: statementEntries.length,
      totalGrossSalary,
      totalTaxableNet,
      totalTaxDeductions,
      totalTaxableBase,
      totalPayeCalculated,
      totalPayeWithheld,
      averageRateGlobal: totalTaxableBase > 0 ? (totalPayeCalculated / totalTaxableBase) * 100 : 0
    });

    setGenerating(false);
  };

  const handleExportTaxFile = () => {
    const period = reportType === 'monthly' ? getMonthLabel(selectedMonth) : `Year ${selectedYear}`;
    
    // Simplified tax file format for Kenya
    const taxContent = [
      '# PAYE TAX STATEMENT',
      `# Company: ${companyInfo.name}`,
      `# PIN: ${companyInfo.taxNumber}`,
      `# Period: ${period}`,
      `# Report Type: ${reportType === 'monthly' ? 'Monthly' : 'Annual'}`,
      `# Generation Date: ${new Date().toLocaleDateString('en-KE')}`,
      '',
      '# TAX SUMMARY',
      `# Number of Employees: ${summary?.totalEmployees || 0}`,
      `# Total Gross Salaries: ${(summary?.totalGrossSalary || 0).toFixed(2)} KES`,
      `# Total Taxable Net: ${(summary?.totalTaxableNet || 0).toFixed(2)} KES`,
      `# Total Tax Deductions: ${(summary?.totalTaxDeductions || 0).toFixed(2)} KES`,
      `# Total Taxable Base: ${(summary?.totalTaxableBase || 0).toFixed(2)} KES`,
      `# Total PAYE Calculated: ${(summary?.totalPayeCalculated || 0).toFixed(2)} KES`,
      `# Total PAYE Withheld: ${(summary?.totalPayeWithheld || 0).toFixed(2)} KES`,
      `# Global Average Rate: ${(summary?.averageRateGlobal || 0).toFixed(2)}%`,
      '',
      '# EMPLOYEE DETAILS',
      '# Format: ID_Number;Last_Name;First_Name;Gross_Salary;Taxable_Net;Tax_Deductions;Taxable_Base;PAYE_Calculated;PAYE_Withheld;Average_Rate',
      ...statementData.map(entry => 
        `${entry.employee.idNumber || 'N/A'};${entry.employee.lastName};${entry.employee.firstName};${entry.grossSalary.toFixed(2)};${entry.taxableNet.toFixed(2)};${entry.taxDeductions.toFixed(2)};${entry.taxableBase.toFixed(2)};${entry.payeCalculated.toFixed(2)};${entry.payeWithheld.toFixed(2)};${entry.averageRate.toFixed(2)}`
      )
    ].join('\n');

    const blob = new Blob([taxContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `paye_statement_${reportType === 'monthly' ? selectedMonth : selectedYear}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    const excelData = statementData.map(entry => ({
      'ID Number': entry.employee.idNumber || 'N/A',
      'Employee ID': entry.employee.employeeId,
      'Last Name': entry.employee.lastName,
      'First Name': entry.employee.firstName,
      'Position': entry.employee.position,
      'Marital Status': entry.employee.maritalStatus,
      'Gross Salary': entry.grossSalary,
      'Taxable Net': entry.taxableNet,
      'Tax Deductions': entry.taxDeductions,
      'Taxable Base': entry.taxableBase,
      'PAYE Calculated': entry.payeCalculated,
      'PAYE Withheld': entry.payeWithheld,
      'Average Rate (%)': entry.averageRate
    }));

    const csvContent = [
      Object.keys(excelData[0]).join(','),
      ...excelData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `paye_statement_details_${reportType === 'monthly' ? selectedMonth : selectedYear}.csv`);
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

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(2)}%`;
  };

  const getMonthLabel = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'long'
    }).format(date);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
      <div className="p-6">
        <div className="mb-6">
          <button
                    onClick={() => router.back()}
                    className="flex items-center justify-center space-x-1 scale-95 hover:bg-[#3890bf] transition-colors duration-300 
                    mb-4 bg-rose-400 px-4 py-1 rounded-md"
                  >
                    <ArrowLeft className="w-5 h-5 text-white" />
                    <span className='tracking-tighter text-white'>Back</span>
                </button>
          
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-zinc-700 rounded-xl p-1">
            <Receipt className="w-6 h-6 text-blue-50" />
            </div>
            <h1 className="text-2xl font-bold tracking-tighter text-zinc-800">PAYE Tax Statement</h1>
          </div>
          
          <p className="text-zinc-400 text-sm w-[20vw]">
            Monthly and annual details of Pay As You Earn (PAYE) tax withheld, generated according to the Kenyan tax scale.
          </p>
        </div>

        {!showResults ? (
          <>
            {/* Configuration */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-medium text-zinc-900 mb-4">Tax Statement Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Report Type
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as 'monthly' | 'annual')}
                    className="payroll-input"
                  >
                    <option value="monthly">Monthly Report</option>
                    <option value="annual">Annual Report</option>
                  </select>
                </div>

                {reportType === 'monthly' ? (
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Month
                    </label>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="payroll-input"
                    />
                    <p className="text-sm text-zinc-500 mt-1">
                      Statement for {getMonthLabel(selectedMonth)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Year
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="payroll-input"
                    >
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <p className="text-sm text-zinc-500 mt-1">
                      Statement for the year {selectedYear}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Employees Included
                  </label>
                  <div className="text-lg font-medium text-zinc-900">
                    {employees.length} active employee(s)
                  </div>
                  <p className="text-sm text-zinc-500 mt-1">
                    All active employees will be included
                  </p>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-medium text-zinc-900 mb-4">Company Tax Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="payroll-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    KRA PIN
                  </label>
                  <input
                    type="text"
                    value={companyInfo.taxNumber}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, taxNumber: e.target.value }))}
                    className="payroll-input"
                    placeholder="P051123456A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={companyInfo.address}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, address: e.target.value }))}
                    className="payroll-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={companyInfo.city}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, city: e.target.value }))}
                    className="payroll-input"
                  />
                </div>
              </div>
            </div>

            {/* PAYE Tax Scale */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-medium text-zinc-900 mb-4">Kenyan PAYE Tax Scale</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Income Band (KES/month)
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Deduction
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-zinc-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">0 - 24,000</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-zinc-900">10%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-zinc-900">0</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">24,001 - 32,333</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-zinc-900">25%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-zinc-900">2,400</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">32,334 - 500,000</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-zinc-900">30%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-zinc-900">3,733.25</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">500,001 - 800,000</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-zinc-900">32.5%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-zinc-900">143,733.25</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">Above 800,000</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-zinc-900">35%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-zinc-900">241,233.25</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-800">
                    Tax Deductions: 2,400 KES personal relief per month + housing levy relief (up to 108,000 KES annually) + insurance relief (up to 60,000 KES annually)
                  </span>
                </div>
              </div>
            </div>

            {/* Employee Preview */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-zinc-200">
                <h3 className="text-lg font-medium text-zinc-900">
                  Employees Included in Tax Statement
                </h3>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {employees.map((employee) => (
                  <div key={employee.id} className="px-6 py-3 border-b border-zinc-100 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-purple-600">
                              {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-zinc-900">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-sm text-zinc-500">
                            {employee.employeeId} • {employee.maritalStatus} • 0 deduction(s)
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-zinc-900">
                          {formatCurrency(employee.baseSalary)}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {employee.idNumber ? (
                            <span className="text-green-600">ID: {employee.idNumber}</span>
                          ) : (
                            <span className="text-rose-600">ID Number missing</span>
                          )}
                        </div>
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
                  <h3 className="text-lg font-medium text-zinc-900">Generate PAYE Tax Statement</h3>
                  <p className="text-sm text-zinc-500 mt-1">
                    Calculate PAYE and generate tax statement for {reportType === 'monthly' ? getMonthLabel(selectedMonth) : `the year ${selectedYear}`}
                  </p>
                </div>
                <button
                  onClick={handleGenerateStatement}
                  disabled={generating}
                  className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Receipt className="w-5 h-5" />
                  <span>{generating ? 'Generating...' : 'Generate Tax Statement'}</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Results */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-zinc-900">
                  PAYE Tax Statement - {reportType === 'monthly' ? getMonthLabel(selectedMonth) : `Year ${selectedYear}`}
                </h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowResults(false)}
                    className="text-sm text-zinc-600 hover:text-zinc-900"
                  >
                    New Statement
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export Excel</span>
                  </button>
                  <button
                    onClick={handleExportTaxFile}
                    className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tax File</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Summary */}
            {summary && (
              <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <h4 className="text-lg font-medium text-zinc-900 mb-4">Tax Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{summary.totalEmployees}</div>
                    <div className="text-sm text-zinc-600">Employees</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{formatCurrency(summary.totalGrossSalary)}</div>
                    <div className="text-sm text-zinc-600">Total Gross Salaries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">{formatCurrency(summary.totalTaxableBase)}</div>
                    <div className="text-sm text-zinc-600">Total Taxable Base</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{formatCurrency(summary.totalPayeWithheld)}</div>
                    <div className="text-sm text-zinc-600">Total PAYE Withheld</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-zinc-200">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{formatCurrency(summary.totalTaxableNet)}</div>
                    <div className="text-sm text-zinc-600">Total Taxable Net</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-rose-600">{formatCurrency(summary.totalTaxDeductions)}</div>
                    <div className="text-sm text-zinc-600">Total Deductions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{formatPercentage(summary.averageRateGlobal)}</div>
                    <div className="text-sm text-zinc-600">Global Average Rate</div>
                  </div>
                </div>
              </div>
            )}

            {/* Statement Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h4 className="text-lg font-medium text-zinc-900 mb-4">Tax Statement Information</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-zinc-600">Company:</span>
                  <div className="font-medium">{companyInfo.name}</div>
                </div>
                <div>
                  <span className="text-zinc-600">KRA PIN:</span>
                  <div className="font-medium">{companyInfo.taxNumber}</div>
                </div>
                <div>
                  <span className="text-zinc-600">Period:</span>
                  <div className="font-medium">
                    {reportType === 'monthly' ? getMonthLabel(selectedMonth) : `Year ${selectedYear}`}
                  </div>
                </div>
                <div>
                  <span className="text-zinc-600">Generation Date:</span>
                  <div className="font-medium">{new Date().toLocaleDateString('en-KE')}</div>
                </div>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Gross Salary
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Taxable Net
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Taxable Base
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        PAYE Withheld
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Average Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-zinc-200">
                    {statementData.map((entry) => (
                      <tr key={entry.employee.id} className="hover:bg-zinc-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <span className="text-xs font-medium text-purple-600">
                                  {entry.employee.firstName.charAt(0)}{entry.employee.lastName.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-zinc-900">
                                {entry.employee.firstName} {entry.employee.lastName}
                              </div>
                              <div className="text-sm text-zinc-500">
                                {entry.employee.employeeId} • {entry.employee.maritalStatus} • 0 deduction(s)
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                          {formatCurrency(entry.grossSalary)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-600">
                          {formatCurrency(entry.taxableNet)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-orange-600">
                          {formatCurrency(entry.taxableBase)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-purple-600">
                          {formatCurrency(entry.payeWithheld)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-zinc-600">
                          {formatPercentage(entry.averageRate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-zinc-50">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-zinc-900">
                        TOTALS ({summary?.totalEmployees || 0} employees)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600">
                        {formatCurrency(summary?.totalGrossSalary || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-blue-600">
                        {formatCurrency(summary?.totalTaxableNet || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-orange-600">
                        {formatCurrency(summary?.totalTaxableBase || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-purple-600">
                        {formatCurrency(summary?.totalPayeWithheld || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-zinc-600">
                        {formatPercentage(summary?.averageRateGlobal || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
  );
};

export default TaxStatementPage;