import React, { useState, useEffect } from 'react';
import Layout from '../../layout';
import { Award, ArrowLeft, Download, User, Calendar, Search, FileText } from 'lucide-react';
import { useRouter } from 'next/router';
import { Employee } from '@prisma/client';

type CertificateType = 'INCOME' | 'ATTENDANCE';

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
  const [certificateData, setCertificateData] = useState<any>(null);

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

  const handleGenerateCertificate = async () => {
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

      setCertificateData({
        employee,
        type: certificateType,
        customText,
        generatedDate: new Date()
      });
      setShowPreview(true);

    } catch (error) {
      console.error('Error during generation:', error);
      alert('Error generating certificate');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!certificateData) return;

    try {
      // Calculate date range for the certificate (last 12 months)
      const dateEnd = new Date();
      const dateStart = new Date();
      dateStart.setFullYear(dateEnd.getFullYear() - 1);

      const response = await fetch('/api/documents/salary-certificate/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: certificateData.employee.id,
          type: certificateType,
          dateStart: dateStart.toISOString(),
          dateEnd: dateEnd.toISOString(),
          reason: `Certificate of ${certificateData.type.toLowerCase()}`
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `certificate_${certificateData.type.toLowerCase()}_${certificateData.employee.employeeId}.pdf`;
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
            <Award className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-zinc-900">Salary Certificate</h1> 
          </div>
          
          <p className="text-zinc-600 text-lg">
            Generation of income or attendance certificates upon employee request.
          </p>
        </div>

        {!showPreview ? (
          <>
            {/* Certificate configuration */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-medium text-zinc-900 mb-4">Certificate Configuration</h3> 
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Certificate Type 
                  </label>
                  <select
                    value={certificateType}
                    onChange={(e) => setCertificateType(e.target.value as CertificateType)}
                    className="payroll-input"
                  >
                    <option value="INCOME">Income Certificate</option>
                    <option value="ATTENDANCE">Attendance Certificate</option>
                  </select>
                  <p className="text-sm text-zinc-500 mt-1">
                    {certificateType === 'INCOME' 
                      ? 'Certifies the employee’s salary and income' 
                      : 'Certifies the employee’s presence and diligence'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    <Search className="w-4 h-4 inline mr-1" />
                    Search Employee 
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
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-zinc-900">Generate Certificate</h3> 
                  <p className="text-sm text-zinc-500 mt-1">
                    {selectedEmployee ? 
                      `Certificate of ${certificateType.toLowerCase()} for ${selectedEmployeeData?.firstName} ${selectedEmployeeData?.lastName}` :
                      'Select an employee to continue'}
                  </p>
                </div>
                <button
                  onClick={handleGenerateCertificate}
                  disabled={!selectedEmployee || generating}
                  className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    CERTIFICATE OF {certificateData.type === 'INCOME' ? 'INCOME' : 'ATTENDANCE'} 
                  </h2>
                  <p className="text-zinc-600">
                    Issued on {formatDate(certificateData.generatedDate)}
                  </p>
                </div>

                {/* Employee information */}
                <div className="mb-8">
                  <h3 className="font-medium text-zinc-900 mb-4">Employee Information</h3> 
                  <div className="bg-zinc-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-zinc-600">Full Name:</span> 
                        <div className="font-medium">{certificateData.employee.firstName} {certificateData.employee.lastName}</div>
                      </div>
                      <div>
                        <span className="text-zinc-600">Employee ID:</span> 
                        <div className="font-medium">{certificateData.employee.employeeId}</div>
                      </div>
                      <div>
                        <span className="text-zinc-600">ID Number:</span> 
                        <div className="font-medium">{certificateData.employee.idNumber || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-zinc-600">Position:</span> 
                        <div className="font-medium">{certificateData.employee.position}</div>
                      </div>
                      <div>
                        <span className="text-zinc-600">Hire Date:</span> 
                        <div className="font-medium">{formatDate(certificateData.employee.hireDate)}</div>
                      </div>
                      <div>
                        <span className="text-zinc-600">Seniority:</span> 
                        <div className="font-medium">{calculateSeniority(certificateData.employee.hireDate)}</div>
                      </div>
                      {certificateData.type === 'INCOME' && (
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
                      {certificateData.customText || getDefaultText(certificateData.type, certificateData.employee)}
                    </div>
                  </div>
                </div>

                {/* Signature */}
                <div className="text-right">
                  <div className="inline-block">
                    <div className="text-sm text-zinc-600 mb-2">Issued in Nairobi, on {formatDate(certificateData.generatedDate)}</div> 
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
    </Layout>
  );
};

export default SalaryCertificatePage;