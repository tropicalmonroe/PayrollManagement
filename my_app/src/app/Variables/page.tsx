import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Layout } from '../../components/Layout';
import AddVariableElementModal from '../../components/AddVariableElementModal';
import { Employee, VariableElement } from '@prisma/client';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  DollarSign, 
  User, 
  Edit, 
  Trash2,
  FileText,
  AlertCircle
} from 'lucide-react';

interface VariableElementWithEmployee extends VariableElement {
  employee: {
    id: string;
    employeeId: string;
    lastName: string;
    firstName: string;
    position: string;
  };
}

export default function VariablesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [variableElements, setVariableElements] = useState<VariableElementWithEmployee[]>([]);
  const [filteredElements, setFilteredElements] = useState<VariableElementWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingElement, setEditingElement] = useState<VariableElementWithEmployee | null>(null);
  
  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Initialize with current month and year
  useEffect(() => {
    const now = new Date();
    setSelectedMonth((now.getMonth() + 1).toString().padStart(2, '0'));
    setSelectedYear(now.getFullYear().toString());
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchVariableElements();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [variableElements, selectedMonth, selectedYear, selectedEmployee, selectedType, searchTerm]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.filter((emp: Employee) => emp.status === 'ACTIVE'));
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const fetchVariableElements = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/variable-elements');
      if (response.ok) {
        const data = await response.json();
        setVariableElements(data);
      } else {
        throw new Error('Error loading variable elements');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Unable to load variable elements');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...variableElements];

    if (selectedMonth && selectedYear) {
      filtered = filtered.filter(element => 
        element.month === selectedMonth && element.year === selectedYear
      );
    }

    if (selectedEmployee) {
      filtered = filtered.filter(element => element.employeeId === selectedEmployee);
    }

    if (selectedType) {
      filtered = filtered.filter(element => element.type === selectedType);
    }

    if (searchTerm) {
      filtered = filtered.filter(element =>
        element.employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        element.employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        element.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        element.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredElements(filtered);
  };

  const handleAddElement = () => {
    setEditingElement(null);
    setShowAddModal(true);
  };

  const handleEditElement = (element: VariableElementWithEmployee) => {
    setEditingElement(element);
    setShowAddModal(true);
  };

  const handleDeleteElement = async (elementId: string) => {
    if (!confirm('Are you sure you want to delete this variable element?')) {
      return;
    }

    try {
      const response = await fetch(`/api/variable-elements/${elementId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchVariableElements();
      } else {
        throw new Error('Error deleting element');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting variable element');
    }
  };

  const handleModalSuccess = () => {
    setShowAddModal(false);
    setEditingElement(null);
    fetchVariableElements();
  };

  const getTypeLabel = (type: string) => {
    const types = {
      'OVERTIME': 'Overtime',
      'ABSENCE': 'Absence',
      'BONUS': 'Bonus',
      'LEAVE': 'Leave',
      'LATENESS': 'Lateness',
      'ADVANCE': 'Advance',
      'OTHER': 'Other'
    };
    return types[type as keyof typeof types] || type;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'OVERTIME': return <Clock className="w-4 h-4 text-green-600" />;
      case 'ABSENCE': return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case 'BONUS': return <DollarSign className="w-4 h-4 text-blue-600" />;
      case 'LEAVE': return <Calendar className="w-4 h-4 text-purple-600" />;
      case 'LATENESS': return <Clock className="w-4 h-4 text-orange-600" />;
      case 'ADVANCE': return <DollarSign className="w-4 h-4 text-indigo-600" />;
      default: return <FileText className="w-4 h-4 text-zinc-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  };

  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const years = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - 5 + i;
    return year.toString();
  });

  const elementTypes = [
    { value: 'OVERTIME', label: 'Overtime' },
    { value: 'ABSENCE', label: 'Absence' },
    { value: 'BONUS', label: 'Bonus' },
    { value: 'LEAVE', label: 'Leave' },
    { value: 'LATENESS', label: 'Lateness' },
    { value: 'ADVANCE', label: 'Advance' },
    { value: 'OTHER', label: 'Other' }
  ];

  return (
    <>
      <Head>
        <title>Monthly Variable Elements - AD Capital</title>
        <meta name="description" content="Payroll variable elements management" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900">Monthly Variable Elements</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Management of payroll variables: overtime, absences, bonuses, leaves, lateness, advances
              </p>
            </div>
            <button
              onClick={handleAddElement}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0063b4] hover:bg-[#0052a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0063b4]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Element
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6">
            <h3 className="text-lg font-medium text-zinc-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm"
                >
                  <option value="">All months</option>
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm"
                >
                  <option value="">All years</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Employee
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm"
                >
                  <option value="">All employees</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm"
                >
                  <option value="">All types</option>
                  {elementTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm"
                    placeholder="Search by employee or description..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Variable elements list */}
          <div className="bg-white rounded-lg shadow-sm border border-zinc-200">
            <div className="px-6 py-4 border-b border-zinc-200">
              <h3 className="text-lg font-medium text-zinc-900">
                Variable Elements ({filteredElements.length})
              </h3>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-zinc-500">Loading variable elements...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-rose-600">{error}</p>
                <button
                  onClick={fetchVariableElements}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-zinc-300 rounded-md shadow-sm text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50"
                >
                  Try Again
                </button>
              </div>
            ) : filteredElements.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-zinc-400" />
                <h3 className="mt-4 text-lg font-medium text-zinc-900">No variable elements</h3>
                <p className="mt-2 text-sm text-zinc-500">
                  {selectedMonth && selectedYear 
                    ? `No variable elements for ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
                    : 'Start by adding payroll variable elements'
                  }
                </p>
                <button
                  onClick={handleAddElement}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0063b4] hover:bg-[#0052a3]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Element
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Amount/Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-zinc-200">
                    {filteredElements.map((element) => (
                      <tr key={element.id} className="hover:bg-zinc-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-600">
                                  {element.employee.firstName.charAt(0)}{element.employee.lastName.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-zinc-900">
                                {element.employee.firstName} {element.employee.lastName}
                              </div>
                              <div className="text-sm text-zinc-500">
                                {element.employee.employeeId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getTypeIcon(element.type)}
                            <span className="ml-2 text-sm text-zinc-900">
                              {getTypeLabel(element.type)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-zinc-900">{element.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                          {months.find(m => m.value === element.month)?.label} {element.year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-zinc-900">
                            {element.hours ? `${element.hours}h` : formatCurrency(element.amount)}
                            {element.rate && (
                              <div className="text-xs text-zinc-500">
                                Rate: {formatCurrency(element.rate)}/h
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                          {formatDate(element.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEditElement(element)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteElement(element.id)}
                              className="text-rose-600 hover:text-rose-900"
                            >
                              <Trash2 className="w-4 h-4" />
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

        {/* Add/edit modal */}
        {showAddModal && (
          <AddVariableElementModal
            isOpen={showAddModal}
            onClose={() => {
              setShowAddModal(false);
              setEditingElement(null);
            }}
            onSuccess={handleModalSuccess}
            employees={employees}
            editElement={editingElement}
            defaultMonth={selectedMonth}
            defaultYear={selectedYear}
          />
        )}
      </Layout>
    </>
  );
}
