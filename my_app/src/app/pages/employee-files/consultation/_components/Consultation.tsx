"use client";
import React, { useState, useEffect } from 'react';
import { Eye, ArrowLeft, Search, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Employee, EmployeeStatus, MaritalStatus } from '@prisma/client';
import EmployeeDetails from '../../../../../components/EmployeeDetails';

const EmployeeConsultationPage = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'hireDate' | 'baseSalary'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterAndSortEmployees();
  }, [employees, searchTerm, statusFilter, sortBy, sortOrder]);

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

  const filterAndSortEmployees = () => {
    let filtered = employees.filter(employee => {
      const matchesSearch = 
        employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || employee.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = `${a.lastName} ${a.firstName}`;
          bValue = `${b.lastName} ${b.firstName}`;
          break;
        case 'hireDate':
          aValue = new Date(a.hireDate);
          bValue = new Date(b.hireDate);
          break;
        case 'baseSalary':
          aValue = a.baseSalary;
          bValue = b.baseSalary;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredEmployees(filtered);
  };

  const handleView = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedEmployee(null);
  };

  const handleSort = (field: 'name' | 'hireDate' | 'baseSalary') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: 'name' | 'hireDate' | 'baseSalary') => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  const getStatusBadge = (status: EmployeeStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="status-active">Active</span>;
      case 'SUSPENDED':
        return <span className="status-pending">Suspended</span>;
      case 'RESIGNED':
      case 'TERMINATED':
      case 'RETIRED':
        return <span className="status-inactive">{status.charAt(0) + status.slice(1).toLowerCase()}</span>;
      default:
        return <span className="status-pending">{status}</span>;
    }
  };

  if (loading) {
    return (
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-zinc-600">Loading...</div>
          </div>
        </div>
    );
  }

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
          
          <div className="flex items-center space-x-3 my-4">
            <div className="flex items-center justify-center w-10 h-10 bg-zinc-700 rounded-xl p-1">
            <Eye className="w-6 h-6 text-blue-50" />
            </div>
            <h1 className="text-2xl font-bold tracking-tighter text-zinc-800">Employee Profile Review</h1>
          </div>
          
          <p className="text-zinc-400 text-sm w-[17vw]">
            Read-only view of the employee’s complete profile (no modifications). 
          </p>
        </div>

        {/* Filters and search */}
        <div className="bg-[#1f435b] p-4 rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className='flex items-center justify-start'>
              <label className="block text-sm font-medium text-zinc-50 mb-1">
                <Search className="w-4 h-4 inline text-zinc-50 mr-2" />
                Search
              </label>
                </div> 
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name, surname, employee ID, position..."
                className="payroll-input placeholder:text-zinc-700 placeholder:text-sm placeholder:font-medium placeholder:tracking-tight"
              />
            </div>
            
            <div>
              <div className='flex items-center justify-start'>
              <label className="block text-sm font-medium text-zinc-50 mb-1">
                <Filter className="w-4 h-4 inline text-zinc-50 mr-2" />
                Status {/* Translated Statut */}
              </label>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as EmployeeStatus | 'ALL')}
                className="payroll-input"
              >
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option> 
                <option value="SUSPENDED">Suspended</option>
                <option value="RESIGNED">Resigned</option>
                <option value="TERMINATED">Terminated</option> 
                <option value="RETIRED">Retired</option>
              </select>
            </div>

            <div className="flex items-center">
            <div className="text-sm text-zinc-50 mt-6 tracking-tight">
            <span className='tracking-normal font-semibold'>{filteredEmployees.length}</span> employee(s) found
            </div>
        </div>
          </div>
        </div>

        {/* Employee list */}
        {filteredEmployees.length === 0 ? (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center py-12">
                <Eye className="mx-auto h-12 w-12 text-rose-400" />
                <h3 className="mt-4 text-lg font-medium text-zinc-900">
                  {searchTerm || statusFilter !== 'ALL' ? 'No employees found' : 'No employees'}
                </h3>
                <p className="mt-2 text-sm text-zinc-500">
                  {searchTerm || statusFilter !== 'ALL' 
                    ? 'Try adjusting your search criteria' 
                    : 'No employees available for review'}
                </p>
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
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:bg-zinc-100"
                      onClick={() => handleSort('name')}
                    >
                      Employee {getSortIcon('name')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Position 
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Marital Status 
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:bg-zinc-100"
                      onClick={() => handleSort('hireDate')}
                    >
                      Hire Date {getSortIcon('hireDate')} 
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:bg-zinc-100"
                      onClick={() => handleSort('baseSalary')}
                    >
                      Base Salary {getSortIcon('baseSalary')} 
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Status {/* Translated Statut */}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Action {/* Translated Action */}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-zinc-200">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-zinc-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-zinc-900">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-sm text-zinc-500">
                              {employee.employeeId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                        {employee.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                        {employee.maritalStatus}
                        {employee.numberOfDeductions > 0 && (
                          <div className="text-xs text-zinc-500">
                            {employee.numberOfDeductions} dependent(s) 
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                        {formatDate(employee.hireDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                        {formatCurrency(employee.baseSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(employee.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleView(employee)}
                          className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                          title="View full profile"
                        >
                          <Eye className="w-4 h-4 " />
                          <span>View</span>
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
                {filteredEmployees.map((employee) => (
                  <div key={employee.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
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
                      <button
                        onClick={() => handleView(employee)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-zinc-500">Hired on:</span> 
                        <div className="font-medium">{formatDate(employee.hireDate)}</div>
                      </div>
                      <div>
                        <span className="text-zinc-500">Base Salary:</span> 
                        <div className="font-medium">{formatCurrency(employee.baseSalary)}</div>
                      </div>
                      <div>
                        <span className="text-zinc-500">Marital Status:</span> 
                        <div className="font-medium">{employee.maritalStatus}</div>
                      </div>
                      <div>
                        <span className="text-zinc-500">Status:</span> 
                        <div>{getStatusBadge(employee.status)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal for employee details (read-only) */}
        {showDetails && selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-7xl max-h-[95vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Employee Profile Review</h2> {/* Translated Consultation de la fiche salarié */}
                <button
                  onClick={handleCloseDetails}
                  className="text-zinc-500 hover:text-zinc-700"
                >
                  ✕
                </button>
              </div>
              <EmployeeDetails 
                employee={selectedEmployee} 
                onClose={handleCloseDetails}
                onEdit={() => {
                  // No editing in consultation mode
                  alert('Read-only mode. Use the “Employee Profile” section to edit.'); {/* Translated Mode consultation uniquement. Utilisez la section "Fiche salarié" pour modifier. */}
                }}
              />
            </div>
          </div>
        )}
      </div>
  );
};

export default EmployeeConsultationPage;