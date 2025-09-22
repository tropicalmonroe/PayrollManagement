"use client";
import React, { useState, useEffect } from 'react';
import { Calculator, ArrowLeft, Download, User, Calendar, Search, Plus, Minus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Employee } from '@prisma/client';

interface SettlementElement {
  id: string;
  type: 'GAIN' | 'DEDUCTION';
  description: string;
  amount: number;
}

const FinalSettlementPage = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [departureDate, setDepartureDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [departureReason, setDepartureReason] = useState('');
  const [unusedVacationDays, setUnusedVacationDays] = useState(0);
  const [noticePeriod, setNoticePeriod] = useState(0);
  const [severanceAmount, setSeveranceAmount] = useState(0);
  const [customElements, setCustomElements] = useState<SettlementElement[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [settlementData, setSettlementData] = useState<any>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCustomElement = () => {
    const newElement: SettlementElement = {
      id: Date.now().toString(),
      type: 'GAIN',
      description: '',
      amount: 0
    };
    setCustomElements([...customElements, newElement]);
  };

  const updateCustomElement = (id: string, field: keyof SettlementElement, value: any) => {
    setCustomElements(prev => 
      prev.map(element => 
        element.id === id ? { ...element, [field]: value } : element
      )
    );
  };

  const removeCustomElement = (id: string) => {
    setCustomElements(prev => prev.filter(element => element.id !== id));
  };

  const calculateVacationPay = (employee: Employee) => {
    // Approximate calculation: daily salary * unused vacation days
    const dailySalary = employee.baseSalary / 26; // 26 working days per month
    return dailySalary * unusedVacationDays;
  };

  const calculateNoticePay = (employee: Employee) => {
    // Notice period calculation: daily salary * notice days
    const dailySalary = employee.baseSalary / 26;
    return dailySalary * noticePeriod;
  };

  const handleGenerateSettlement = async () => {
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

      const vacationPay = calculateVacationPay(employee);
      const noticePay = calculateNoticePay(employee);

      // Calculate totals
      const totalGains = vacationPay + noticePay + severanceAmount + 
        customElements.filter(e => e.type === 'GAIN').reduce((sum, e) => sum + e.amount, 0);
      
      const totalDeductions = customElements.filter(e => e.type === 'DEDUCTION').reduce((sum, e) => sum + e.amount, 0);
      
      const netToPay = totalGains - totalDeductions;

      setSettlementData({
        employee,
        departureDate,
        departureReason,
        unusedVacationDays,
        noticePeriod,
        severanceAmount,
        vacationPay,
        noticePay,
        customElements,
        totalGains,
        totalDeductions,
        netToPay,
        generatedDate: new Date()
      });
      setShowPreview(true);

    } catch (error) {
      console.error('Error during generation:', error);
      alert('Error generating final settlement');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!settlementData) return;

    try {
      const response = await fetch('/api/documents/final-settlement/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: settlementData.employee.id,
          settlementData
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `final_settlement_${settlementData.employee.employeeId}.pdf`;
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

  const calculateSeniority = (hireDate: Date, departureDate: string) => {
    const hire = new Date(hireDate);
    const departure = new Date(departureDate);
    const years = departure.getFullYear() - hire.getFullYear();
    const months = departure.getMonth() - hire.getMonth();
    
    let totalMonths = years * 12 + months;
    if (departure.getDate() < hire.getDate()) {
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

  const filteredEmployees = employees.filter(employee =>
    employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedEmployeeData = employees.find(emp => emp.id === selectedEmployee);

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
            <Calculator className="w-6 h-6 text-blue-50" />
          </div>
            <h1 className="text-2xl font-bold tracking-tighter text-zinc-800">Final Settlement</h1>
          </div>
          
          <p className="text-zinc-400 text-sm w-[20vw]">
            Entry of termination elements (unused leave, allowances...) and generation of official settlement document.
          </p>
        </div>

        {!showPreview ? (
          <>
            {/* Employee selection */}
            <div className="bg-[#1f435b] p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-medium text-zinc-50 mb-4">Employee Selection</h3>
              
              <div className="mb-4">
                <div className="flex items-center mb-2">
                <Search className="w-4 h-4 inline mr-1 text-white" />
                <label className="block text-sm font-medium text-white">
                  Search Employee
                </label>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Name, first name, employee ID..."
                  className="payroll-input placeholder:text-zinc-700 placeholder:text-sm placeholder:font-medium placeholder:tracking-tight"
                />
              </div>

              <div className="max-h-48 overflow-y-auto border border-white rounded-lg">
                {filteredEmployees.length === 0 ? (
                  <div className="p-6 text-center text-white">
                    No employees found
                  </div>
                ) : (
                  filteredEmployees.map((employee) => (
                    <div key={employee.id} className="px-4 py-3 border-b border-zinc-100 last:border-b-0">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id={`employee-${employee.id}`}
                          name="selectedEmployee"
                          value={employee.id}
                          checked={selectedEmployee === employee.id}
                          onChange={(e) => setSelectedEmployee(e.target.value)}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-zinc-300"
                        />
                        <label htmlFor={`employee-${employee.id}`} className="ml-3 flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-zinc-900">
                                {employee.firstName} {employee.lastName}
                              </div>
                              <div className="text-sm text-zinc-500">
                                {employee.employeeId} • {employee.position} • {employee.status}
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

            {/* Departure configuration */}
            {selectedEmployee && (
              <>
                <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                  <h3 className="text-lg font-medium text-zinc-900 mb-4">Departure Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Departure Date
                      </label>
                      <input
                        type="date"
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        className="payroll-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">
                        Departure Reason
                      </label>
                      <select
                        value={departureReason}
                        onChange={(e) => setDepartureReason(e.target.value)}
                        className="payroll-input"
                      >
                        <option value="">Select a reason</option>
                        <option value="RESIGNATION">Resignation</option>
                        <option value="DISMISSAL">Dismissal</option>
                        <option value="CONTRACT_END">Contract End</option>
                        <option value="RETIREMENT">Retirement</option>
                        <option value="TRANSFER">Transfer</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>

                  {selectedEmployeeData && (
                    <div className="mt-4 p-4 bg-zinc-50 rounded-lg">
                      <h4 className="font-medium text-zinc-900 mb-2">Employee Information</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-zinc-600">Hire Date:</span>
                          <span className="ml-2 font-medium">{formatDate(selectedEmployeeData.hireDate)}</span>
                        </div>
                        <div>
                          <span className="text-zinc-600">Seniority:</span>
                          <span className="ml-2 font-medium">{calculateSeniority(selectedEmployeeData.hireDate, departureDate)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Calculation elements */}
                <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                  <h3 className="text-lg font-medium text-zinc-900 mb-4">Calculation Elements</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">
                        Unused Vacation (days)
                      </label>
                      <input
                        type="number"
                        value={unusedVacationDays}
                        onChange={(e) => setUnusedVacationDays(Number(e.target.value))}
                        min="0"
                        className="payroll-input"
                      />
                      {selectedEmployeeData && (
                        <p className="text-sm text-zinc-500 mt-1">
                          Value: {formatCurrency(calculateVacationPay(selectedEmployeeData))}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">
                        Notice Period (days)
                      </label>
                      <input
                        type="number"
                        value={noticePeriod}
                        onChange={(e) => setNoticePeriod(Number(e.target.value))}
                        min="0"
                        className="payroll-input"
                      />
                      {selectedEmployeeData && (
                        <p className="text-sm text-zinc-500 mt-1">
                          Value: {formatCurrency(calculateNoticePay(selectedEmployeeData))}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">
                        Severance Pay
                      </label>
                      <input
                        type="number"
                        value={severanceAmount}
                        onChange={(e) => setSeveranceAmount(Number(e.target.value))}
                        min="0"
                        step="0.01"
                        className="payroll-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Custom elements */}
                <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-zinc-900">Custom Elements</h3>
                    <button
                      onClick={addCustomElement}
                      className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Element</span>
                    </button>
                  </div>

                  {customElements.length === 0 ? (
                    <p className="text-zinc-500 text-center py-4">
                      No custom elements added
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {customElements.map((element) => (
                        <div key={element.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <select
                            value={element.type}
                            onChange={(e) => updateCustomElement(element.id, 'type', e.target.value)}
                            className="w-32 payroll-input"
                          >
                            <option value="GAIN">Gain</option>
                            <option value="DEDUCTION">Deduction</option>
                          </select>
                          
                          <input
                            type="text"
                            value={element.description}
                            onChange={(e) => updateCustomElement(element.id, 'description', e.target.value)}
                            placeholder="Description"
                            className="flex-1 payroll-input"
                          />
                          
                          <input
                            type="number"
                            value={element.amount}
                            onChange={(e) => updateCustomElement(element.id, 'amount', Number(e.target.value))}
                            placeholder="Amount"
                            step="0.01"
                            className="w-32 payroll-input"
                          />
                          
                          <button
                            onClick={() => removeCustomElement(element.id)}
                            className="text-rose-600 hover:text-rose-800"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Generation button */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-zinc-900">Generate Final Settlement</h3>
                      <p className="text-sm text-zinc-500 mt-1">
                        Official end-of-contract document for {selectedEmployeeData?.firstName} {selectedEmployeeData?.lastName}
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateSettlement}
                      disabled={!departureReason || generating}
                      className="flex items-center space-x-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Calculator className="w-5 h-5" />
                      <span>{generating ? 'Generating...' : 'Generate Settlement'}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {/* Settlement preview */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-zinc-900">Final Settlement Preview</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-sm text-zinc-600 hover:text-zinc-900"
                  >
                    Back to entry
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Settlement document */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="p-8">
                {/* Header */}
                <div className="text-center border-b-2 border-zinc-200 pb-6 mb-8">
                  <h2 className="text-2xl font-bold text-zinc-900 mb-2">FINAL SETTLEMENT</h2>
                  <p className="text-zinc-600">
                    Prepared on {formatDate(settlementData.generatedDate)}
                  </p>
                </div>

                {/* Employee and departure information */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="font-medium text-zinc-900 mb-3">Employee Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Full Name:</span>
                        <span className="font-medium">{settlementData.employee.firstName} {settlementData.employee.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Employee ID:</span>
                        <span className="font-medium">{settlementData.employee.employeeId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Position:</span>
                        <span className="font-medium">{settlementData.employee.position}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Hire Date:</span>
                        <span className="font-medium">{formatDate(settlementData.employee.hireDate)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-zinc-900 mb-3">Departure Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Departure Date:</span>
                        <span className="font-medium">{formatDate(settlementData.departureDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Reason:</span>
                        <span className="font-medium">{settlementData.departureReason}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Seniority:</span>
                        <span className="font-medium">{calculateSeniority(settlementData.employee.hireDate, settlementData.departureDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gains detail */}
                <div className="mb-8">
                  <h3 className="font-medium text-zinc-900 mb-4 bg-green-50 p-3 rounded">GAINS</h3>
                  <div className="space-y-2 text-sm">
                    {settlementData.vacationPay > 0 && (
                      <div className="flex justify-between">
                        <span>Unused Vacation ({settlementData.unusedVacationDays} days)</span>
                        <span className="font-medium">{formatCurrency(settlementData.vacationPay)}</span>
                      </div>
                    )}
                    {settlementData.noticePay > 0 && (
                      <div className="flex justify-between">
                        <span>Notice Period Allowance ({settlementData.noticePeriod} days)</span>
                        <span className="font-medium">{formatCurrency(settlementData.noticePay)}</span>
                      </div>
                    )}
                    {settlementData.severanceAmount > 0 && (
                      <div className="flex justify-between">
                        <span>Severance Pay</span>
                        <span className="font-medium">{formatCurrency(settlementData.severanceAmount)}</span>
                      </div>
                    )}
                    {settlementData.customElements.filter((e: SettlementElement) => e.type === 'GAIN').map((element: SettlementElement) => (
                      <div key={element.id} className="flex justify-between">
                        <span>{element.description}</span>
                        <span className="font-medium">{formatCurrency(element.amount)}</span>
                      </div>
                    ))}
                    <div className="border-t border-zinc-200 pt-2 flex justify-between font-medium text-lg">
                      <span>TOTAL GAINS</span>
                      <span className="text-green-600">{formatCurrency(settlementData.totalGains)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions detail */}
                {settlementData.totalDeductions > 0 && (
                  <div className="mb-8">
                    <h3 className="font-medium text-zinc-900 mb-4 bg-rose-50 p-3 rounded">DEDUCTIONS</h3>
                    <div className="space-y-2 text-sm">
                      {settlementData.customElements.filter((e: SettlementElement) => e.type === 'DEDUCTION').map((element: SettlementElement) => (
                        <div key={element.id} className="flex justify-between">
                          <span>{element.description}</span>
                          <span className="font-medium">{formatCurrency(element.amount)}</span>
                        </div>
                      ))}
                      <div className="border-t border-zinc-200 pt-2 flex justify-between font-medium text-lg">
                        <span>TOTAL DEDUCTIONS</span>
                        <span className="text-rose-600">{formatCurrency(settlementData.totalDeductions)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Net amount payable */}
                <div className="bg-zinc-50 p-6 rounded-lg mb-8">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-zinc-900">NET AMOUNT PAYABLE</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(settlementData.netToPay)}
                    </span>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="text-center">
                    <div className="border-t border-zinc-300 pt-4 mt-8">
                      <div className="text-sm font-medium text-zinc-900">Employer Signature</div>
                      <div className="text-xs text-zinc-600 mt-1">Company Stamp</div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="border-t border-zinc-300 pt-4 mt-8">
                      <div className="text-sm font-medium text-zinc-900">Employee Signature</div>
                      <div className="text-xs text-zinc-600 mt-1">For acceptance and receipt</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
  );
};

export default FinalSettlementPage;