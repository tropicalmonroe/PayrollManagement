import React, { useState, useEffect } from 'react';
import { Layout } from '../../../components/Layout';
import { 
  Receipt, 
  Download, 
  Search, 
  Calendar,
  User,
  Eye,
  Printer,
  Mail,
  Plus,
  RefreshCw,
  AlertCircle,
  DollarSign
} from 'lucide-react';

interface Employee {
  id: string;
  employeeId: string;
  lastName: string;
  firstName: string;
  position: string;
  hireDate: string;
  seniority: number;
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

export default function FinalSettlementPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [departureReason, setDepartureReason] = useState<string>('');
  const [unusedLeave, setUnusedLeave] = useState<string>('');
  const [severancePay, setSeverancePay] = useState<string>('');
  const [otherAllowances, setOtherAllowances] = useState<string>('');
  const [deductions, setDeductions] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const departureReasons = [
    { value: 'resignation', label: 'Resignation' },
    { value: 'dismissal', label: 'Dismissal' },
    { value: 'contract_end', label: 'Contract End' },
    { value: 'retirement', label: 'Retirement' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'other', label: 'Other' }
  ];

  // Load employees
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Load documents
  useEffect(() => {
    fetchDocuments();
  }, [selectedEmployee]);

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
      params.append('type', 'ACCOUNT_STATEMENT');
      
      if (selectedEmployee) {
        params.append('employeeId', selectedEmployee);
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

  const generateFinalSettlement = async () => {
    if (!selectedEmployee || !endDate || !departureReason) {
      setError('Please fill in all required fields');
      return;
    }

    if (new Date(endDate) > new Date()) {
      setError('End date cannot be in the future');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/documents/final-settlement/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          endDate,
          departureReason,
          unusedLeave: unusedLeave || '0',
          severancePay: severancePay || '0',
          otherAllowances: otherAllowances || '0',
          deductions: deductions || '0'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Reload document list
        fetchDocuments();
        // Reset form
        setSelectedEmployee('');
        setEndDate('');
        setDepartureReason('');
        setUnusedLeave('');
        setSeverancePay('');
        setOtherAllowances('');
        setDeductions('');
      } else {
        setError(data.error || 'Error generating final settlement');
      }
    } catch (error) {
      setError('Error generating final settlement');
      console.error('Error generating final settlement:', error);
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
      ARCHIVED: { color: 'bg-gray-100 text-gray-800', text: 'Archived' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.GENERATED;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Final Settlement</h1>
            <p className="text-gray-600">Entry of termination elements and generation of official document</p>
          </div>
        </div>

        {/* Settlement generation */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            <Plus className="inline-block w-5 h-5 mr-2" />
            Generate New Final Settlement
          </h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee *
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract End Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Departure Reason *
              </label>
              <select
                value={departureReason}
                onChange={(e) => setDepartureReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a reason</option>
                {departureReasons.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Financial elements */}
          <div className="border-t pt-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Financial Elements
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unused Leave Days (KES)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={unusedLeave}
                  onChange={(e) => setUnusedLeave(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severance Pay (KES)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={severancePay}
                  onChange={(e) => setSeverancePay(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Other Allowances (KES)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={otherAllowances}
                  onChange={(e) => setOtherAllowances(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Various Deductions (KES)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={generateFinalSettlement}
              disabled={generating}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {generating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {generating ? 'Generating...' : 'Generate Settlement'}
            </button>
          </div>
        </div>

        {/* Filters and search */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, first name or employee ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={fetchDocuments}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Settlements list */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Generated Settlements ({filteredDocuments.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="p-6 text-center">
              <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No final settlements found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Departure Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Generation Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDocuments.map((document) => (
                    <tr key={document.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-orange-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {document.employee.firstName} {document.employee.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {document.employee.employeeId} • {document.employee.position}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {document.metadata?.departureReason ? 
                          departureReasons.find(m => m.value === document.metadata.departureReason)?.label || 
                          document.metadata.departureReason : 
                          'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {document.metadata?.netBalance ? 
                          `${document.metadata.netBalance.toLocaleString()} KES` : 
                          'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(document.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(document.generationDate).toLocaleDateString('en-US')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            <Printer className="w-4 h-4" />
                          </button>
                          <button className="text-purple-600 hover:text-purple-900">
                            <Mail className="w-4 h-4" />
                          </button>
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
    </Layout>
  );
}