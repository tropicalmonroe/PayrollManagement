"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Calendar,
  User,
  Eye,
  Printer,
  Mail,
  Plus,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface Employee {
  id: string;
  employeeId: string;
  lastName: string;
  firstName: string;
  position: string;
}

interface Document {
  id: string;
  type: string;
  title: string;
  description: string;
  employee: Employee;
  period: string;
  generationDate: string;
  status: 'GENERATED' | 'SENT' | 'ARCHIVED';
  downloadCount: number;
  metadata: any;
}

export default function PayslipPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Load employees
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Load documents
  useEffect(() => {
    fetchDocuments();
  }, [selectedEmployee, selectedMonth, selectedYear]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('type', 'PAYSLIP');
      
      if (selectedEmployee) {
        params.append('employeeId', selectedEmployee);
      }
      
      if (selectedMonth && selectedYear) {
        params.append('period', `${selectedMonth} ${selectedYear}`);
      }

      const response = await fetch(`/api/documents?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePayslip = async () => {
    if (!selectedEmployee || !selectedMonth || !selectedYear) {
      setError('Please select an employee, month, and year');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/documents/payslip/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          month: selectedMonth,
          year: selectedYear.toString()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Reload document list
        fetchDocuments();
        // Reset selections
        setSelectedEmployee('');
        setSelectedMonth('');
      } else {
        setError(data.error || 'Error generating payslip');
      }
    } catch (error) {
      setError('Error generating payslip');
      console.error('Error generating payslip:', error);
    } finally {
      setGenerating(false);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      GENERATED: { color: 'bg-blue-100 text-blue-800', text: 'Generated' },
      SENT: { color: 'bg-green-100 text-green-800', text: 'Sent' },
      ARCHIVED: { color: 'bg-zinc-100 text-zinc-800', text: 'Archived' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.GENERATED;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
      <div className="space-y-6 bg-white shadow rounded-lg mt-[2vh] p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-zinc-800 tracking-tighter">Payslips</h1>
            <p className="text-zinc-500 tracking-tight">Generation and management of individual payslips</p>
          </div>
        </div>

        {/* Payslip generation */}
        <div className="bg-[#1f435b] rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-zinc-50 mb-4">
            <Plus className="inline-block w-5 h-5 mr-2" />
            Generate New Payslip
          </h2>
          
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-red-200 rounded-md flex items-center">
              <AlertCircle className="w-5 h-5 text-rose-500 mr-2" />
              <span className="text-rose-700">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-white tracking-tight mb-2">
                Employee
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select an employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName} ({employee.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white tracking-tight mb-2">
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select a month</option>
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white tracking-tight mb-2">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {[2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={generatePayslip}
                disabled={generating}
                className="flex items-center justify-center space-x-2 text-white bg-fuchsia-500 cursor-pointer
                        hover:bg-blue-200 hover:text-zinc-900 transition duration-300 rounded-xl px-6 py-3 w-full"
              >
                {generating ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {generating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>

        {/* Filters and search */}
        <div className="bg-[#6ea0c2] rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, first name or employee ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-zinc-300 rounded-md 
                  focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white
                  placeholder:tracking-tight placeholder:text-zinc-400 placeholder:text-sm"
                />
              </div>
            </div>
            <button
              onClick={fetchDocuments}
              className="flex items-center justify-center space-x-2 text-white bg-sky-800 cursor-pointer
                        hover:bg-blue-200 hover:text-zinc-900 transition duration-300 rounded-xl px-6 py-3"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Payslip list */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-zinc-200">
            <h2 className="text-lg font-semibold text-zinc-900">
              Generated Payslips ({filteredDocuments.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-zinc-400" />
              <p className="text-zinc-500">Loading...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="p-6 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-zinc-400" />
              <p className="text-zinc-500">No payslips found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Net Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Generation Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-zinc-200">
                  {filteredDocuments.map((document) => (
                    <tr key={document.id} className="hover:bg-zinc-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-zinc-900">
                              {document.employee.firstName} {document.employee.lastName}
                            </div>
                            <div className="text-sm text-zinc-500">
                              {document.employee.employeeId} • {document.employee.position}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                        {document.period}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                        {document.metadata?.netSalary ? 
                          `${document.metadata.netSalary.toLocaleString()} KES` : 
                          'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(document.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                        {new Date(document.generationDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <div className="flex items-center justify-center w-10 h-10 cursor-pointer
                          bg-blue-200 hover:bg-blue-900 rounded-xl p-1 text-blue-500 hover:text-blue-50 
                          transition duration-300">
                          <button 
                            onClick={() => window.open(`/api/documents/payslip/${document.id}/view`, '_blank')}
                            className=""
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                            </div>
                            <div className="flex items-center justify-center w-10 h-10 cursor-pointer
                          bg-green-200 hover:bg-green-900 rounded-xl p-1 text-green-500 hover:text-green-50 
                          transition duration-300">
                          <button 
                            onClick={() => window.open(`/api/documents/payslip/${document.id}/view`, '_blank')}
                            className=""
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                            </div>
                            <div className="flex items-center justify-center w-10 h-10 cursor-pointer
                          bg-zinc-200 hover:bg-zinc-900 rounded-xl p-1 text-zinc-500 hover:text-zinc-50 
                          transition duration-300">
                          <button 
                            onClick={() => {
                              const printWindow = window.open(`/api/documents/payslip/${document.id}/view`, '_blank');
                              printWindow?.addEventListener('load', () => printWindow.print());
                            }}
                            className=""
                            title="Print"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                            </div>
                          <div className="flex items-center justify-center w-10 h-10 cursor-pointer
                          bg-purple-200 hover:bg-purple-900 rounded-xl p-1 text-purple-500 hover:text-purple-50 
                          transition duration-300">
                          <button className="" title="Send by email">
                            <Mail className="w-4 h-4" />
                          </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
  );
}