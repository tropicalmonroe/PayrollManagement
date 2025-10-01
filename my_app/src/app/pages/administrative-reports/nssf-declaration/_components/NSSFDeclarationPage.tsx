
"use client";
import React, { useState, useEffect } from 'react';
import { Building, ArrowLeft, Download, Calendar, Users, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Employee } from '@prisma/client';
import { calculatePayroll, OptionalInsurances, type EmployeePayrollData } from '../../../../../lib/payrollCalculations';

interface NSSFDeclarationEntry {
  employee: Employee;
  grossSalary: number;
  nssfCeiling: number;
  nssfBase: number;
  employeeContribution: number;
  employerContribution: number;
  housingLevy: number;
  trainingLevy: number;
  totalContributions: number;
}

const NSSFDeclarationPage = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [declarationData, setDeclarationData] = useState<NSSFDeclarationEntry[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [companyInfo, setCompanyInfo] = useState({
    name: 'NewLight Academy - Mombasa',
    nssfNumber: '1234567',
    address: '110 Mombasa Road',
    city: 'Nairobi'
  });

// Correct NSSF Rates for Declaration
const NSSF_RATES = {
  tierICeiling: 8000,    // Tier I ceiling
  tierIICeiling: 72000,  // Tier II ceiling
  ceiling: 72000,        // Overall ceiling
  employeeRate: 0.06,    // 6% employee
  employerRate: 0.06,    // 6% employer
  housingLevy: 0.015,    // 1.5% housing levy
  trainingLevy: 0.01     // 1.0% training levy
};
  

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

  const handleGenerateDeclaration = async () => {
    setGenerating(true);
    setDeclarationData([]);
    setShowResults(true);

    const declarationEntries: NSSFDeclarationEntry[] = [];
    let totalGrossSalary = 0;
    let totalNSSFBase = 0;
    let totalEmployeeContributions = 0;
    let totalEmployerContributions = 0;
    let totalHousingLevy = 0;
    let totalTrainingLevy = 0;
    let totalContributions = 0;

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

        // Use ACTUAL NSSF values from payroll calculation, not recalculating
        const grossSalary = payrollResult.grossSalary;
        
        // Get the actual NSSF base from payroll calculation
        // For NSSF declaration, we need the actual NSSF base used in calculations
        const nssfBase = Math.min(grossSalary, NSSF_RATES.ceiling);
        
        // Use ACTUAL contributions from payroll result, not recalculating
        const employeeContribution = payrollResult.employeeContributions.nssfEmployee;
        const employerContribution = payrollResult.employerContributions.nssfEmployer;
        
        // Housing levy and training levy from payroll result
        const housingLevy = payrollResult.employerContributions.housingLevy;
        const trainingLevy = payrollResult.employerContributions.trainingLevy;
        
        const totalContributionsEmployee = employeeContribution + employerContribution + housingLevy + trainingLevy;

        const entry: NSSFDeclarationEntry = {
          employee,
          grossSalary,
          nssfCeiling: NSSF_RATES.ceiling,
          nssfBase,
          employeeContribution,
          employerContribution,
          housingLevy,
          trainingLevy,
          totalContributions: totalContributionsEmployee
        };

        declarationEntries.push(entry);

        // Accumulate totals
        totalGrossSalary += grossSalary;
        totalNSSFBase += nssfBase;
        totalEmployeeContributions += employeeContribution;
        totalEmployerContributions += employerContribution;
        totalHousingLevy += housingLevy;
        totalTrainingLevy += trainingLevy;
        totalContributions += totalContributionsEmployee;

      } catch (error) {
        console.error(`Error calculating for ${employee.firstName} ${employee.lastName}:`, error);
      }
    }

    setDeclarationData(declarationEntries);
    setSummary({
      totalEmployees: declarationEntries.length,
      totalGrossSalary,
      totalNSSFBase,
      totalEmployeeContributions,
      totalEmployerContributions,
      totalHousingLevy,
      totalTrainingLevy,
      totalContributions
    });

    setGenerating(false);
  };

  const handleExportNSSFFile = () => {
    // Simplified NSSF file format
    const nssfContent = [
      '# NSSF DECLARATION',
      `# Company: ${companyInfo.name}`,
      `# NSSF Number: ${companyInfo.nssfNumber}`,
      `# Period: ${getMonthLabel(selectedMonth)}`,
      `# Generation date: ${new Date().toLocaleDateString('en-US')}`,
      '',
      '# SUMMARY',
      `# Number of employees: ${summary?.totalEmployees || 0}`,
      `# Total gross salaries: ${(summary?.totalGrossSalary || 0).toFixed(2)} KES`,
      `# Total NSSF base: ${(summary?.totalNSSFBase || 0).toFixed(2)} KES`,
      `# Total employee contributions: ${(summary?.totalEmployeeContributions || 0).toFixed(2)} KES`,
      `# Total employer contributions: ${(summary?.totalEmployerContributions || 0).toFixed(2)} KES`,
      `# Total housing levy: ${(summary?.totalHousingLevy || 0).toFixed(2)} KES`,
      `# Total training levy: ${(summary?.totalTrainingLevy || 0).toFixed(2)} KES`,
      `# TOTAL TO PAY: ${(summary?.totalContributions || 0).toFixed(2)} KES`,
      '',
      '# EMPLOYEE DETAILS',
      '# Format: NSSF_Number;Last_Name;First_Name;Gross_Salary;NSSF_Base;Employee_Contribution;Employer_Contribution;Housing_Levy;Training_Levy;Total',
      ...declarationData.map(entry => 
        `${entry.employee.nssfNumber || 'N/A'};${entry.employee.lastName};${entry.employee.firstName};${entry.grossSalary.toFixed(2)};${entry.nssfBase.toFixed(2)};${entry.employeeContribution.toFixed(2)};${entry.employerContribution.toFixed(2)};${entry.housingLevy.toFixed(2)};${entry.trainingLevy.toFixed(2)};${entry.totalContributions.toFixed(2)}`
      )
    ].join('\n');

    const blob = new Blob([nssfContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `nssf_declaration_${selectedMonth}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    const excelData = declarationData.map(entry => ({
      'NSSF Number': entry.employee.nssfNumber || 'N/A',
      'Employee ID': entry.employee.employeeId,
      'Last Name': entry.employee.lastName,
      'First Name': entry.employee.firstName,
      'Position': entry.employee.position,
      'Gross Salary': entry.grossSalary,
      'NSSF Ceiling': entry.nssfCeiling,
      'NSSF Base': entry.nssfBase,
      'Employee Contribution (6%)': entry.employeeContribution,
      'Employer Contribution (6%)': entry.employerContribution,
      'Housing Levy (1.5%)': entry.housingLevy,
      'Training Levy (1.0%)': entry.trainingLevy,
      'Total Contributions': entry.totalContributions
    }));

    const csvContent = [
      Object.keys(excelData[0]).join(','),
      ...excelData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `nssf_declaration_details_${selectedMonth}.csv`);
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
            <Building className="w-6 h-6 text-blue-50" />
          </div>
            <h1 className="text-2xl font-bold tracking-tighter text-zinc-800">NSSF Declaration</h1>
          </div>
          
          <p className="text-zinc-400 text-sm w-[20vw]">
            Production of the monthly file or form to be submitted to NSSF for contributions due.
          </p>
        </div>

        {!showResults ? (
          <>
            {/* Configuration */}
            <div className="bg-[#1f435b] p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-medium text-zinc-50 mb-4">Declaration Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center mb-2">
                  <Calendar className="w-4 h-4 inline mr-1 text-white" />
                  <label className="block text-sm font-medium text-white">
                    Declaration Period
                  </label>
                  </div>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="payroll-input"
                  />
                  <p className="text-sm text-white mt-1">
                    Declaration for {getMonthLabel(selectedMonth)}
                  </p>
                </div>

                <div>
                  <div className="flex items-center mb-2">
                  <Users className="w-4 h-4 inline mr-1 text-white" />
                  <label className="block text-sm font-medium text-white">
                    Employees Included
                  </label>
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {employees.length} active employee(s)
                  </div>
                  <p className="text-sm text-white tracking-tight mt-1">
                    All active employees will be included in the declaration
                  </p>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="bg-[#1f435b] p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-medium text-zinc-50 mb-4">Company Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
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
                  <label className="block text-sm font-medium text-white mb-2">
                    NSSF Registration Number
                  </label>
                  <input
                    type="text"
                    value={companyInfo.nssfNumber}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, nssfNumber: e.target.value }))}
                    className="payroll-input"
                    placeholder="1234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
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
                  <label className="block text-sm font-medium text-white mb-2">
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

            {/* NSSF Rates */}
            <div className="bg-[#1f435b] p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-medium text-white mb-4">Current NSSF Rates</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">{formatCurrency(NSSF_RATES.ceiling)}</div>
                  <div className="text-sm text-zinc-600">Monthly ceiling</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{(NSSF_RATES.employeeRate * 100).toFixed(1)}%</div>
                  <div className="text-sm text-zinc-600">Employee contribution</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">{(NSSF_RATES.employerRate * 100).toFixed(1)}%</div>
                  <div className="text-sm text-zinc-600">Employer contribution</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">{(NSSF_RATES.housingLevy * 100).toFixed(1)}%</div>
                  <div className="text-sm text-zinc-600">Housing levy</div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-sm text-yellow-800">
                    Training levy: {(NSSF_RATES.trainingLevy * 100).toFixed(1)}% on total gross salary
                  </span>
                </div>
              </div>
            </div>

            {/* Employees Preview */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-zinc-200">
                <h3 className="text-lg font-medium text-zinc-800 tracking-tight capitalize">
                  Employees to Declare
                </h3>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {employees.map((employee) => (
                  <div key={employee.id} className="px-6 py-3 border-b border-zinc-100 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-orange-600">
                              {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-zinc-900">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-sm text-zinc-500">
                            {employee.employeeId} • {employee.position}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-zinc-900">
                          {formatCurrency(employee.baseSalary)}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {employee.nssfNumber ? (
                            <span className="text-green-600">NSSF: {employee.nssfNumber}</span>
                          ) : (
                            <span className="text-rose-600">NSSF missing</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <div className="bg-[#1f435b] p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-zinc-50">Generate NSSF Declaration</h3>
                  <p className="text-sm text-white mt-1">
                    Calculate contributions and generate declaration for {getMonthLabel(selectedMonth)}
                  </p>
                </div>
                <button
                  onClick={handleGenerateDeclaration}
                  disabled={generating}
                  className="flex items-center space-x-2 bg-blue-200 text-white px-6 py-3 rounded-lg hover:bg-blue-400 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Building className="w-5 h-5" />
                  <span>{generating ? 'Generating...' : 'Generate Declaration'}</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Results */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-zinc-900">NSSF Declaration - {getMonthLabel(selectedMonth)}</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowResults(false)}
                    className="text-sm text-zinc-600 hover:text-zinc-900"
                  >
                    New Declaration
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export Excel</span>
                  </button>
                  <button
                    onClick={handleExportNSSFFile}
                    className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>NSSF File</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Summary */}
            {summary && (
              <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <h4 className="text-lg font-medium text-zinc-900 mb-4">Declaration Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{summary.totalEmployees}</div>
                    <div className="text-sm text-zinc-600">Employees declared</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{formatCurrency(summary.totalGrossSalary)}</div>
                    <div className="text-sm text-zinc-600">Total gross salaries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">{formatCurrency(summary.totalNSSFBase)}</div>
                    <div className="text-sm text-zinc-600">Total NSSF base</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{formatCurrency(summary.totalContributions)}</div>
                    <div className="text-sm text-zinc-600">Total contributions</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-200">
                  <div className="text-center">
                    <div className="text-lg font-bold text-rose-600">{formatCurrency(summary.totalEmployeeContributions)}</div>
                    <div className="text-sm text-zinc-600">Employee contributions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{formatCurrency(summary.totalEmployerContributions)}</div>
                    <div className="text-sm text-zinc-600">Employer contributions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{formatCurrency(summary.totalHousingLevy)}</div>
                    <div className="text-sm text-zinc-600">Housing levy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-600">{formatCurrency(summary.totalTrainingLevy)}</div>
                    <div className="text-sm text-zinc-600">Training levy</div>
                  </div>
                </div>
              </div>
            )}

            {/* Declaration Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h4 className="text-lg font-medium text-zinc-900 mb-4">Declaration Information</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-zinc-600">Company :</span>
                  <div className="font-medium">{companyInfo.name}</div>
                </div>
                <div>
                  <span className="text-zinc-600">NSSF Number :</span>
                  <div className="font-medium">{companyInfo.nssfNumber}</div>
                </div>
                <div>
                  <span className="text-zinc-600">Period :</span>
                  <div className="font-medium">{getMonthLabel(selectedMonth)}</div>
                </div>
                <div>
                  <span className="text-zinc-600">Generation date :</span>
                  <div className="font-medium">{new Date().toLocaleDateString('en-US')}</div>
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
                        Gross salary
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        NSSF base
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Employee contributions
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Employer contributions
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Total contributions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-zinc-200">
                    {declarationData.map((entry) => (
                      <tr key={entry.employee.id} className="hover:bg-zinc-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                                <span className="text-xs font-medium text-orange-600">
                                  {entry.employee.firstName.charAt(0)}{entry.employee.lastName.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-zinc-900">
                                {entry.employee.firstName} {entry.employee.lastName}
                              </div>
                              <div className="text-sm text-zinc-500">
                                {entry.employee.employeeId} • {entry.employee.nssfNumber || 'NSSF missing'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                          {formatCurrency(entry.grossSalary)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-600">
                          {formatCurrency(entry.nssfBase)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-rose-600">
                          {formatCurrency(entry.employeeContribution)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-orange-600">
                          {formatCurrency(entry.employerContribution + entry.housingLevy + entry.trainingLevy)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-purple-600">
                          {formatCurrency(entry.totalContributions)}
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
                        {formatCurrency(summary?.totalNSSFBase || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-rose-600">
                        {formatCurrency(summary?.totalEmployeeContributions || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-orange-600">
                        {formatCurrency((summary?.totalEmployerContributions || 0) + (summary?.totalHousingLevy || 0) + (summary?.totalTrainingLevy || 0))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-purple-600">
                        {formatCurrency(summary?.totalContributions || 0)}
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

export default NSSFDeclarationPage;