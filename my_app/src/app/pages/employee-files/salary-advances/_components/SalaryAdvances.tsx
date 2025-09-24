"use client";
import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowLeft, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Advance, Employee } from '@prisma/client';
import AddAdvanceModal from '../../../../../components/AddAdvanceModal';

type AdvanceWithEmployee = Advance & {
  employee: Employee;
};

const SalaryAdvancesPage = () => {
  const router = useRouter();
  const [advances, setAdvances] = useState<AdvanceWithEmployee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchAdvances();
    fetchEmployees();
  }, []);

  const fetchAdvances = async () => {
    try {
      const response = await fetch('/api/advances');
      if (response.ok) {
        const data = await response.json();
        setAdvances(data);
      }
    } catch (error) {
      console.error('Error loading advances:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleAddAdvance = async (advanceData: any) => {
    try {
      const response = await fetch('/api/advances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(advanceData),
      });

      if (response.ok) {
        const newAdvance = await response.json();
        setAdvances([newAdvance, ...advances]);
        setShowAddModal(false);
      } else {
        alert('Error creating advance');
      }
    } catch (error) {
      console.error('Error creating advance:', error);
      alert('Error creating advance');
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
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <span className="status-pending">In Progress</span>;
      case 'REPAID':
        return <span className="status-active">Repaid</span>;
      case 'CANCELLED':
        return <span className="status-inactive">Cancelled</span>;
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
          
          <div className="flex items-center justify-between my-8">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-zinc-700 rounded-xl p-1">
              <TrendingUp className="w-6 h-6 text-blue-50" />
              </div>
              <h1 className="text-2xl font-bold tracking-tighter text-zinc-800">Salary Advances</h1>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 text-sm cursor-pointer bg-emerald-600 text-white px-4 
              py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Advance</span>
            </button>
          </div>
          
          <p className="text-zinc-400 text-sm w-[20vw]">
            Recording of granted advances, tracking, and automatic integration into monthly payroll.
          </p>
        </div>

        {/* Advances list */}
        {advances.length === 0 ? (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center py-12">
                <TrendingUp className="mx-auto h-12 w-12 text-rose-400" />
                <h3 className="mt-4 text-lg font-medium tracking-tight capitalize text-zinc-900">
                  No advances recorded
                </h3>
                <p className="mt-2 text-sm text-zinc-400 font-light">
                  Start by recording the first salary advance
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Advance
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
                <thead className="bg-[#6ea0c2]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider 
                    text-white cursor-pointer hover:bg-zinc-800 transition-all duration-300 ease-in-out">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider 
                    text-white cursor-pointer hover:bg-zinc-800 transition-all duration-300 ease-in-out">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider 
                    text-white cursor-pointer hover:bg-zinc-800 transition-all duration-300 ease-in-out">
                      Advance Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider 
                    text-white cursor-pointer hover:bg-zinc-800 transition-all duration-300 ease-in-out">
                      Installment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider 
                    text-white cursor-pointer hover:bg-zinc-800 transition-all duration-300 ease-in-out">
                      Remaining Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider 
                    text-white cursor-pointer hover:bg-zinc-800 transition-all duration-300 ease-in-out">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider 
                    text-white cursor-pointer hover:bg-zinc-800 transition-all duration-300 ease-in-out">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-[#142b3d] divide-y divide-zinc-200">
                  {advances.map((advance) => (
                    <tr key={advance.id} className="hover:bg-[#1b435b] transition duration-300">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-green-600 tracking-tight">
                                {advance.employee.firstName.charAt(0)}{advance.employee.lastName.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium tracking-tight text-white">
                              {advance.employee.firstName} {advance.employee.lastName}
                            </div>
                            <div className="text-sm tracking-tight text-white scale-90 -ml-[4px]">
                              {advance.employee.employeeId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm tracking-tight text-emerald-400">
                        {formatCurrency(advance.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm tracking-tight text-white">
                        {formatDate(advance.advanceDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm tracking-tight text-white">
                        {formatCurrency(advance.installmentAmount)}
                        <div className="text-xs text-white">
                          {advance.numberOfInstallments} installments
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm tracking-tight text-rose-400">
                        {formatCurrency(advance.remainingBalance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(advance.status)}
                      </td>
                      <td className="px-6 py-4 text-sm tracking-tight text-white max-w-xs truncate">
                        {advance.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile version - cards */}
            <div className="lg:hidden">
              <div className="divide-y divide-zinc-200">
                {advances.map((advance) => (
                  <div key={advance.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-green-600">
                              {advance.employee.firstName.charAt(0)}{advance.employee.lastName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-zinc-900">
                            {advance.employee.firstName} {advance.employee.lastName}
                          </div>
                          <div className="text-sm text-zinc-500">
                            {advance.employee.employeeId}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(advance.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-zinc-500">Amount:</span>
                        <div className="font-medium">{formatCurrency(advance.amount)}</div>
                      </div>
                      <div>
                        <span className="text-zinc-500">Remaining Balance:</span>
                        <div className="font-medium">{formatCurrency(advance.remainingBalance)}</div>
                      </div>
                      <div>
                        <span className="text-zinc-500">Installment:</span>
                        <div className="font-medium">{formatCurrency(advance.installmentAmount)}</div>
                      </div>
                      <div>
                        <span className="text-zinc-500">Date:</span>
                        <div className="font-medium">{formatDate(advance.advanceDate)}</div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-zinc-500 text-sm">Reason:</span>
                      <div className="text-sm">{advance.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal to add advance */}
        {showAddModal && (
          <AddAdvanceModal
            isOpen={showAddModal}
            employees={employees}
            onSuccess={() => {
              fetchAdvances(); // Reload list
              setShowAddModal(false);
            }}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </div>
  );
};

export default SalaryAdvancesPage;