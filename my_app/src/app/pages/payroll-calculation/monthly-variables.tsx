import React, { useState, useEffect } from 'react';
import Layout from '../../layout';
import { Edit, ArrowLeft, Plus, Save, Calendar, User } from 'lucide-react';
import { useRouter } from 'next/router';
import { Employee, VariableElement } from '@prisma/client';
import AddVariableElementModal from '../../../components/AddVariableElementModal';

type VariableElementWithEmployee = VariableElement & {
  employee: Employee;
};

const MonthlyVariablesPage = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [variableElements, setVariableElements] = useState<VariableElementWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedEmployee, setSelectedEmployee] = useState<string>('ALL');

  useEffect(() => {
    fetchEmployees();
    fetchVariableElements();
  }, [selectedMonth]);

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
      const response = await fetch(`/api/variable-elements?month=${selectedMonth}`);
      if (response.ok) {
        const data = await response.json();
        setVariableElements(data);
      }
    } catch (error) {
      console.error('Error loading variable elements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVariable = async (variableData: any) => {
    try {
      const response = await fetch('/api/variable-elements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...variableData,
          month: selectedMonth,
        }),
      });

      if (response.ok) {
        const newVariable = await response.json();
        setVariableElements([newVariable, ...variableElements]);
        setShowAddModal(false);
      } else {
        alert('Error creating variable element');
      }
    } catch (error) {
      console.error('Error creating variable element:', error);
      alert('Error creating variable element');
    }
  };

  const handleDeleteVariable = async (id: string) => {
    if (confirm('Are you sure you want to delete this variable element?')) {
      try {
        const response = await fetch(`/api/variable-elements/${id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setVariableElements(variableElements.filter(v => v.id !== id));
        } else {
          alert('Error during deletion');
        }
      } catch (error) {
        console.error('Error during deletion:', error);
        alert('Error during deletion');
      }
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'OVERTIME':
        return 'Overtime';
      case 'ABSENCE':
        return 'Absence';
      case 'BONUS':
        return 'Bonus';
      case 'LEAVE':
        return 'Leave';
      case 'LATE':
        return 'Late';
      case 'ADVANCE':
        return 'Advance';
      case 'OTHER':
        return 'Other';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'OVERTIME':
        return 'bg-blue-100 text-blue-800';
      case 'ABSENCE':
        return 'bg-rose-100 text-rose-800';
      case 'BONUS':
        return 'bg-green-100 text-green-800';
      case 'LEAVE':
        return 'bg-yellow-100 text-yellow-800';
      case 'LATE':
        return 'bg-orange-100 text-orange-800';
      case 'ADVANCE':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-zinc-100 text-zinc-800';
    }
  };

  const filteredVariables = variableElements.filter(variable => 
    selectedEmployee === 'ALL' || variable.employeeId === selectedEmployee
  );

  const getMonthLabel = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long'
    }).format(date);
  };

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
            <span>Back</span> 
          </button>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Edit className="w-8 h-8 text-orange-600" />
              <h1 className="text-3xl font-bold text-zinc-900">Monthly Variable Elements</h1> 
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Element</span> {/* Translated Nouvel élément */}
            </button>
          </div>
          
          <p className="text-zinc-600 text-lg">
            Monthly entry of variable elements: overtime, absences, bonuses, leaves, lates, advances.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Month 
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="payroll-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                <User className="w-4 h-4 inline mr-1" />
                Employee {/* Translated Employé */}
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="payroll-input"
              >
                <option value="ALL">All Employees</option> 
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName} - {employee.employeeId}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <div className="text-sm text-zinc-600">
                {filteredVariables.length} element(s) for {getMonthLabel(selectedMonth)} 
              </div>
            </div>
          </div>
        </div>

        {/* Variable Elements List */}
        {filteredVariables.length === 0 ? (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center py-12">
                <Edit className="mx-auto h-12 w-12 text-zinc-400" />
                <h3 className="mt-4 text-lg font-medium text-zinc-900">
                  No variable elements for {getMonthLabel(selectedMonth)} 
                </h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Start by adding the month’s variable elements (overtime, absences, bonuses, etc.) 
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Element
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Desktop version - table */}
            <div className="hidden lg:block">
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
                      Quantity/Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Amount
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
                  {filteredVariables.map((variable) => (
                    <tr key={variable.id} className="hover:bg-zinc-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-orange-600">
                                {variable.employee.firstName.charAt(0)}{variable.employee.lastName.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-zinc-900">
                              {variable.employee.firstName} {variable.employee.lastName}
                            </div>
                            <div className="text-sm text-zinc-500">
                              {variable.employee.employeeId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(variable.type)}`}>
                          {getTypeLabel(variable.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-900 max-w-xs">
                        {variable.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                        {variable.hours || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                        {variable.amount ? formatCurrency(variable.amount) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                        {formatDate(variable.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteVariable(variable.id)}
                          className="text-rose-600 hover:text-rose-900"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile version - cards */}
            <div className="lg:hidden">
              <div className="divide-y divide-zinc-200">
                {filteredVariables.map((variable) => (
                  <div key={variable.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-orange-600">
                              {variable.employee.firstName.charAt(0)}{variable.employee.lastName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-zinc-900">
                            {variable.employee.firstName} {variable.employee.lastName}
                          </div>
                          <div className="text-sm text-zinc-500">
                            {variable.employee.employeeId}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteVariable(variable.id)}
                        className="text-rose-600 hover:text-rose-900"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(variable.type)}`}>
                        {getTypeLabel(variable.type)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-zinc-500">Description:</span> 
                        <div className="font-medium">{variable.description}</div>
                      </div>
                      <div>
                        <span className="text-zinc-500">Date:</span> 
                        <div className="font-medium">{formatDate(variable.date)}</div>
                      </div>
                      {variable.hours && (
                        <div>
                          <span className="text-zinc-500">Hours:</span> 
                          <div className="font-medium">{variable.hours}</div>
                        </div>
                      )}
                      {variable.amount && (
                        <div>
                          <span className="text-zinc-500">Amount:</span> 
                          <div className="font-medium">{formatCurrency(variable.amount)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Summary by Employee */}
        {filteredVariables.length > 0 && selectedEmployee === 'ALL' && (
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-zinc-900 mb-4">
              Summary by Employee for {getMonthLabel(selectedMonth)} 
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees
                .filter(emp => variableElements.some(v => v.employeeId === emp.id))
                .map((employee) => {
                  const employeeVariables = variableElements.filter(v => v.employeeId === employee.id);
                  const totalAmount = employeeVariables.reduce((sum, v) => sum + (v.amount || 0), 0);
                  
                  return (
                    <div key={employee.id} className="bg-zinc-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
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
                          <div className="text-xs text-zinc-500">
                            {employee.employeeId}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-600">Elements:</span>
                          <span className="font-medium">{employeeVariables.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-600">Total Amount:</span> 
                          <span className="font-medium">{formatCurrency(totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Modal for adding variable element */}
        {showAddModal && (
          <AddVariableElementModal
            isOpen={showAddModal}
            employees={employees}
            onSuccess={() => {
              fetchVariableElements();
              setShowAddModal(false);
            }}
            onClose={() => setShowAddModal(false)}
            defaultMonth={selectedMonth.split('-')[1]}
            defaultYear={selectedMonth.split('-')[0]}
          />
        )}
      </div>
    </Layout>
  );
};

export default MonthlyVariablesPage;