import React, { useState, useEffect } from 'react';
import { Layout } from '../../../components/Layout';
import { CreditCard, ArrowLeft, Download, Calendar, Users, FileSpreadsheet, Building, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/router';
import { Employee } from '@prisma/client/';
import { calculatePayroll, OptionalInsurances, type EmployeePayrollData } from '../../../lib/payrollCalculations';

interface BankTransferEntry {
  employee: Employee;
  netPayable: number;
  bankAccount: string;
  bankBranch: string;
  isValid: boolean;
  errors: string[];
}

const BankTransferPage = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [transferData, setTransferData] = useState<BankTransferEntry[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [companyInfo, setCompanyInfo] = useState({
    name: 'YOUR COMPANY',
    account: '123456789012345',
    bank: 'EQUITY BANK',
    reference: ''
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

  const validateBankAccount = (account: string): boolean => {
    const clean = account.replace(/\s/g, '');
    return /^\d{6,16}$/.test(clean); 
  };

  const handleGenerateTransfer = async () => {
    setGenerating(true);
    setTransferData([]);
    setShowResults(true);

    const transferEntries: BankTransferEntry[] = [];
    let totalAmount = 0;
    let validTransfers = 0;
    let invalidTransfers = 0;

    // Generate a unique reference for the transfer
    const reference = `TRF${selectedMonth.replace('-', '')}${Date.now().toString().slice(-4)}`;
    setCompanyInfo(prev => ({ ...prev, reference }));

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
        representationAllowance: employee.representationAllowance ?? 0, // <-- FIXED
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
        
        // Bank
        bankAccount: employee.bankAccount || '',
        bankBranch: employee.bankBranch || '',
        };


        // Calculate payroll
        const payrollResult = calculatePayroll(employeeData);

        // Validate bank data
        const errors: string[] = [];
        let isValid = true;

        if (!employee.bankAccount) {
          errors.push('Bank account missing');
          isValid = false;
        } else if (!validateBankAccount(employee.bankAccount)) {
          errors.push('Invalid bank account format');
          isValid = false;
        }

        if (!employee.bankBranch) {
          errors.push('Bank branch missing');
          isValid = false;
        }

        if (payrollResult.netSalaryPayable <= 0) {
          errors.push('Net amount negative or zero');
          isValid = false;
        }

        const entry: BankTransferEntry = {
          employee,
          netPayable: payrollResult.netSalaryPayable,
          bankAccount: employee.bankAccount || '',
          bankBranch: employee.bankBranch || '',
          isValid,
          errors
        };

        transferEntries.push(entry);

        if (isValid) {
          totalAmount += payrollResult.netSalaryPayable;
          validTransfers++;
        } else {
          invalidTransfers++;
        }

      } catch (error) {
        console.error(`Error calculating for ${employee.firstName} ${employee.lastName}:`, error);
        
        const entry: BankTransferEntry = {
          employee,
          netPayable: 0,
          bankAccount: employee.bankAccount || '',
          bankBranch: employee.bankBranch || '',
          isValid: false,
          errors: ['Payroll calculation error']
        };

        transferEntries.push(entry);
        invalidTransfers++;
      }
    }

    setTransferData(transferEntries);
    setSummary({
      totalEmployees: transferEntries.length,
      validTransfers,
      invalidTransfers,
      totalAmount
    });

    setGenerating(false);
  };

  const handleExportBankFile = () => {
    const validTransfers = transferData.filter(entry => entry.isValid);
    
    // Simplified bank transfer format for Kenya
    const bankContent = [
      '# Bank Transfer File',
      `# Reference: ${companyInfo.reference}`,
      `# Date: ${new Date().toISOString().split('T')[0]}`,
      `# Number of transfers: ${validTransfers.length}`,
      `# Total amount: ${formatCurrency(summary?.totalAmount || 0)}`,
      '',
      '# Format: LastName;FirstName;Account;Branch;Amount;Reference',
      ...validTransfers.map(entry => 
        `${entry.employee.lastName};${entry.employee.firstName};${entry.bankAccount};${entry.bankBranch};${entry.netPayable.toFixed(2)};SALARY_${selectedMonth}_${entry.employee.employeeId}`
      )
    ].join('\n');

    const blob = new Blob([bankContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transfer_${companyInfo.reference}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    const excelData = transferData.map(entry => ({
      'Employee ID': entry.employee.employeeId,
      'Last Name': entry.employee.lastName,
      'First Name': entry.employee.firstName,
      'Position': entry.employee.position,
      'Bank Account': entry.bankAccount,
      'Bank Branch': entry.bankBranch,
      'Net Payable': entry.netPayable,
      'Status': entry.isValid ? 'Valid' : 'Invalid',
      'Errors': entry.errors.join('; '),
      'Reference': `SALARY_${selectedMonth}_${entry.employee.employeeId}`
    }));

    const csvContent = [
      Object.keys(excelData[0]).join(','),
      ...excelData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transfer_details_${selectedMonth}.csv`);
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

  const formatBankAccount = (account: string) => {
    return account.replace(/(\d{3})(\d{3})(\d{18})/, '$1 $2 $3');
  };

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
            <CreditCard className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Bulk Bank Transfer</h1>
          </div>
          
          <p className="text-gray-600 text-lg">
            Generate bank or Excel file for executing bulk salary transfers.
          </p>
        </div>

        {!showResults ? (
          <>
            {/* Configuration */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Transfer Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Payroll Period
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="payroll-input"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Transfer for {getMonthLabel(selectedMonth)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Employees Included
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {employees.length} active employee(s)
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Only employees with valid bank data will be included
                  </p>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Debit Account
                  </label>
                  <input
                    type="text"
                    value={companyInfo.account}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, account: e.target.value }))}
                    className="payroll-input"
                    placeholder="123456789012345678901234"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank
                  </label>
                  <input
                    type="text"
                    value={companyInfo.bank}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, bank: e.target.value }))}
                    className="payroll-input"
                  />
                </div>
              </div>
            </div>

            {/* Employees Preview */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Employees Preview
                </h3>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {employees.map((employee) => (
                  <div key={employee.id} className="px-6 py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-green-600">
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
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(employee.baseSalary)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {employee.bankAccount ? (
                            <span className="text-green-600">✓ Bank details available</span>
                          ) : (
                            <span className="text-red-600">✗ Bank details missing</span>
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
                  <h3 className="text-lg font-medium text-gray-900">Generate Transfer File</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Calculate net salaries and generate bank file for {getMonthLabel(selectedMonth)}
                  </p>
                </div>
                <button
                  onClick={handleGenerateTransfer}
                  disabled={generating}
                  className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>{generating ? 'Generating...' : 'Generate Transfer'}</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Results */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Bulk Transfer - {getMonthLabel(selectedMonth)}</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowResults(false)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    New Generation
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export Excel</span>
                  </button>
                  <button
                    onClick={handleExportBankFile}
                    disabled={summary?.validTransfers === 0}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    <span>Bank File</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Summary */}
            {summary && (
              <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Transfer Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{summary.totalEmployees}</div>
                    <div className="text-sm text-gray-600">Total Employees</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{summary.validTransfers}</div>
                    <div className="text-sm text-gray-600">Valid Transfers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{summary.invalidTransfers}</div>
                    <div className="text-sm text-gray-600">Invalid Transfers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{formatCurrency(summary.totalAmount)}</div>
                    <div className="text-sm text-gray-600">Total Amount</div>
                  </div>
                </div>

                {summary.invalidTransfers > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                      <span className="text-sm text-yellow-800">
                        {summary.invalidTransfers} employee(s) have invalid bank data and will not be included in the transfer file.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Transfer Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Transfer Information</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Reference :</span>
                  <div className="font-medium">{companyInfo.reference}</div>
                </div>
                <div>
                  <span className="text-gray-600">Company :</span>
                  <div className="font-medium">{companyInfo.name}</div>
                </div>
                <div>
                  <span className="text-gray-600">Debit Account :</span>
                  <div className="font-medium">{formatBankAccount(companyInfo.account)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Bank :</span>
                  <div className="font-medium">{companyInfo.bank}</div>
                </div>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bank Details
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net Payable
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transferData.map((entry) => (
                      <tr key={entry.employee.id} className={`hover:bg-gray-50 ${!entry.isValid ? 'bg-red-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className={`h-8 w-8 rounded-full ${entry.isValid ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center`}>
                                <span className={`text-xs font-medium ${entry.isValid ? 'text-green-600' : 'text-red-600'}`}>
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {entry.bankAccount ? formatBankAccount(entry.bankAccount) : 'Not provided'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {entry.bankBranch || 'Branch not provided'}
                          </div>
                          {entry.errors.length > 0 && (
                            <div className="text-xs text-red-600 mt-1">
                              {entry.errors.join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <span className={entry.isValid ? 'text-green-600' : 'text-gray-400'}>
                            {formatCurrency(entry.netPayable)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {entry.isValid ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Invalid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        TOTAL TO TRANSFER ({summary?.validTransfers || 0} transfers)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600">
                        {formatCurrency(summary?.totalAmount || 0)}
                      </td>
                      <td></td>
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

export default BankTransferPage;