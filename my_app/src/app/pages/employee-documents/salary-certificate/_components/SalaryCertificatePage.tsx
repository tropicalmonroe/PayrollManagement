"use client";

import React, { useState, useEffect } from 'react';
import { Award, ArrowLeft, Download, User, Calendar, Search, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Employee } from '@prisma/client';

type CertificateType = 'INCOME' | 'ATTENDANCE';

interface CertificateData {
  employee: Employee;
  type: CertificateType;
  customText: string;
  generatedDate: Date;
}

const SalaryCertificatePage = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [certificateType, setCertificateType] = useState<CertificateType>('INCOME');
  const [searchTerm, setSearchTerm] = useState('');
  const [customText, setCustomText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (!response.ok) {
        throw new Error(`Failed to fetch employees: ${response.statusText}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Expected an array of employees');
      }
      const validEmployees = data.filter((emp: Employee) => emp.status === 'ACTIVE' && emp.id && emp.employeeId);
      console.log('Fetched employees:', validEmployees);
      setEmployees(validEmployees);
    } catch (error: any) {
      console.error('Error loading employees:', error);
      alert(`Failed to load employees: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificate = async () => {
    if (!selectedEmployee) {
      alert('Please select an employee');
      return;
    }

    setGenerating(true);

    try {
      console.log('Selected Employee ID:', selectedEmployee);
      console.log('Employees:', employees);
      const employee = employees.find(emp => emp.id === selectedEmployee);
      if (!employee) {
        throw new Error('Employee not found in employees list');
      }

      const requiredFields: (keyof Employee)[] = ['id', 'employeeId', 'firstName', 'lastName', 'position', 'hireDate', 'baseSalary'];
      const missingFields = requiredFields.filter(field => employee[field] === undefined || employee[field] === null);
      if (missingFields.length > 0) {
        throw new Error(`Missing required employee fields: ${missingFields.join(', ')}`);
      }

      if (employee.netSalary === 0 && certificateType === 'INCOME') {
        console.warn('Employee netSalary is 0, payroll data may be missing');
      }

      setCertificateData({
        employee,
        type: certificateType,
        customText,
        generatedDate: new Date(),
      });
      setShowPreview(true);
    } catch (error: any) {
      console.error('Error during generation:', error);
      alert(`Error generating certificate: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

const handleDownloadPDF = async () => {
  if (!certificateData) {
    alert('No certificate data available');
    return;
  }

  try {
    const dateEnd = new Date();
    const dateStart = new Date();
    dateStart.setFullYear(dateEnd.getFullYear() - 1);

    const payload = {
      employeeId: certificateData.employee.id,
      type: certificateType,
      startDate: dateStart.toISOString(),
      endDate: dateEnd.toISOString(),
      reason: `Certificate of ${certificateType.toLowerCase()}`,
    };
    console.log('Sending payload to API:', payload);

    const response = await fetch('/api/documents/salary-certificate/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      throw new Error(`Error downloading PDF: ${errorData.error || 'Unknown error'}${errorData.details ? ` - ${errorData.details}` : ''}`);
    }

    const contentType = response.headers.get('Content-Type');
    if (contentType !== 'application/pdf') {
      throw new Error(`Invalid response Content-Type: ${contentType}`);
    }

    const blob = await response.blob();
    console.log('Received Blob:', { size: blob.size, type: blob.type });

    if (blob.size === 0) {
      throw new Error('Received empty PDF response');
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `certificate_${certificateType.toLowerCase()}_${certificateData.employee.employeeId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error: any) {
    console.error('Error during download:', error);
    alert(`Error downloading PDF: ${error.message}`);
  }
};

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
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
      return `${seniorityMonths} month${seniorityMonths !== 1 ? 's' : ''}`;
    } else if (seniorityMonths === 0) {
      return `${seniorityYears} year${seniorityYears !== 1 ? 's' : ''}`;
    } else {
      return `${seniorityYears} year${seniorityYears !== 1 ? 's' : ''} and ${seniorityMonths} month${seniorityMonths !== 1 ? 's' : ''}`;
    }
  };

  const getDefaultText = (type: CertificateType, employee: Employee | null) => {
    if (!employee) return '';

    if (type === 'INCOME') {
      return `I, the undersigned, certify that ${employee.firstName} ${employee.lastName}, holder of ID Number ${employee.idNumber || 'N/A'}, is employed as a ${employee.position} in our organization since ${formatDate(employee.hireDate)}.\n\nTheir monthly gross salary amounts to ${formatCurrency(employee.baseSalary)}.\n\nThis certificate is issued to the employee for official use as required.`;
    } else {
      return `I, the undersigned, certify that ${employee.firstName} ${employee.lastName}, holder of ID Number ${employee.idNumber || 'N/A'}, is employed as a ${employee.position} in our organization since ${formatDate(employee.hireDate)}.\n\nThe employee is present and diligent in performing their duties.\n\nThis certificate is issued to the employee for official use as required.`;
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
            <Award className="w-6 h-6 text-blue-50" />
          </div>
            <h1 className="text-2xl font-bold tracking-tighter text-zinc-800">Salary Certificate</h1> 
          </div>
          
          <p className="text-zinc-400 text-sm w-[20vw]">
            Generation of income or attendance certificates upon employee request.
          </p>
        </div>

        {!showPreview ? (
          <>
            {/* Certificate configuration */}
            <div className="bg-[#1f435b] p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-medium text-zinc-50 mb-4">Certificate Configuration</h3> 
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className='flex items-center mb-2'>
                  <FileText className="w-4 h-4 inline mr-1 text-white" />
                  <label className="block text-sm font-medium text-white">
                    Certificate Type 
                  </label>
                  </div>
                  <select
                    value={certificateType}
                    onChange={(e) => setCertificateType(e.target.value as CertificateType)}
                    className="payroll-input"
                  >
                    <option value="INCOME">Income Certificate</option>
                    <option value="ATTENDANCE">Attendance Certificate</option>
                  </select>
                  <p className="text-sm text-white mt-1">
                    {certificateType === 'INCOME' 
                      ? 'Certifies the employee’s salary and income' 
                      : 'Certifies the employee’s presence and diligence'}
                  </p>
                </div>

                <div>
                  <div className='flex items-center mb-2'>
                    <Search className="w-4 h-4 inline mr-1 text-white" />
                  <label className="block text-sm font-medium text-white">
                    Search Employee 
                  </label>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Name, surname, employee ID..."
                    className="payroll-input placeholder:text-zinc-700 placeholder:text-sm placeholder:font-medium placeholder:tracking-tight"
                  />
                </div>
              </div>
            </div>

            {/* Employee selection */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-zinc-200">
                <h3 className="text-lg font-medium text-zinc-800 capitalize tracking-tight">
                  Select Employee &nbsp;<strong>({filteredEmployees.length} employee(s))</strong>
                </h3>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {filteredEmployees.length === 0 ? (
                  <div className="p-6 text-center text-zinc-400 tracking-tight">
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
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-zinc-300"
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
                  ))
                )}
              </div>
            </div>

            {/* Certificate text customization */}
            {selectedEmployee && (
              <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <h3 className="text-lg font-medium text-zinc-900 mb-4">Certificate Content</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Certificate Text {/* Translated Texte de l'attestation */}
                    </label>
                    <textarea
                      value={customText || getDefaultText(certificateType, selectedEmployeeData || null)}
                      onChange={(e) => setCustomText(e.target.value)}
                      rows={8}
                      className="payroll-input"
                      placeholder="Custom certificate text..."
                    />
                    <p className="text-sm text-zinc-500 mt-1">
                      You can modify the default text as needed
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setCustomText(getDefaultText(certificateType, selectedEmployeeData || null))}
                    className="text-sm text-green-600 hover:text-green-800"
                  >
                    Restore default text 
                  </button>
                </div>
              </div>
            )}

            {/* Generate button */}
            <div className="bg-[#1f435b] p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-zinc-50">Generate Certificate</h3> 
                  <p className="text-sm text-white mt-1">
                    {selectedEmployee ? 
                      `Certificate of ${certificateType.toLowerCase()} for ${selectedEmployeeData?.firstName} ${selectedEmployeeData?.lastName}` :
                      'Select an employee to continue'}
                  </p>
                </div>
                <button
                  onClick={handleGenerateCertificate}
                  disabled={!selectedEmployee || generating}
                  className="flex items-center space-x-2 bg-blue-200 text-white px-6 py-3 rounded-lg hover:bg-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Award className="w-5 h-5" />
                  <span>{generating ? 'Generating...' : 'Generate Certificate'}</span> 
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Certificate preview */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-zinc-900">Certificate Preview</h3> 
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-sm text-zinc-600 hover:text-zinc-900"
                  >
                    Back to Selection
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Certificate */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="p-8">
                {/* Header */}
                <div className="text-center border-b-2 border-zinc-200 pb-6 mb-8">
                  <h2 className="text-2xl font-bold text-zinc-900 mb-2">
                    CERTIFICATE OF {certificateData?.type === 'INCOME' ? 'INCOME' : 'ATTENDANCE'} 
                  </h2>
                  <p className="text-zinc-600">
                    Issued on {certificateData ? formatDate(certificateData.generatedDate) : ''}
                  </p>
                </div>

                {/* Employee information */}
                <div className="mb-8">
                  <h3 className="font-medium text-zinc-900 mb-4">Employee Information</h3> 
                  <div className="bg-zinc-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-zinc-600">Full Name:</span> 
                        <div className="font-medium">
                          {certificateData ? `${certificateData.employee.firstName} ${certificateData.employee.lastName}` : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-zinc-600">Employee ID:</span> 
                        <div className="font-medium">{certificateData ? certificateData.employee.employeeId : 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-zinc-600">ID Number:</span> 
                        <div className="font-medium">{certificateData ? certificateData.employee.idNumber : 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-zinc-600">Position:</span> 
                        <div className="font-medium">{certificateData ? certificateData.employee.position : 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-zinc-600">Hire Date:</span> 
                        <div className="font-medium">{formatDate(certificateData ? certificateData.employee.hireDate : '')}</div>
                      </div>
                      <div>
                        <span className="text-zinc-600">Seniority:</span> 
                        <div className="font-medium">{calculateSeniority(certificateData ? certificateData.employee.hireDate : new Date())}</div>
                      </div>
                      {certificateData && certificateData.type === 'INCOME' && (
                        <>
                          <div>
                            <span className="text-zinc-600">Base Salary:</span> 
                            <div className="font-medium">{formatCurrency(certificateData.employee.baseSalary)}</div>
                          </div>
                          <div>
                            <span className="text-zinc-600">Marital Status:</span> 
                            <div className="font-medium">{certificateData.employee.maritalStatus}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Certificate content */}
                <div className="mb-8">
                  <h3 className="font-medium text-zinc-900 mb-4">Certificate</h3> 
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <div className="text-zinc-800 leading-relaxed whitespace-pre-line">
                      {certificateData
                        ? (certificateData.customText || getDefaultText(certificateData.type, certificateData.employee))
                        : ''}
                    </div>
                  </div>
                </div>

                {/* Signature */}
                <div className="text-right">
                  <div className="inline-block">
                    <div className="text-sm text-zinc-600 mb-2">
                      Issued in Nairobi, on {certificateData ? formatDate(certificateData.generatedDate) : ''}
                    </div> 
                    <div className="border-t border-zinc-300 pt-4 mt-8">
                      <div className="text-sm font-medium text-zinc-900">Employer’s Signature and Stamp</div>
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

export default SalaryCertificatePage;