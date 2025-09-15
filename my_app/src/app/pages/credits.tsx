import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import AddCreditModal from '../../components/AddCreditModal';
import CreditScheduledPayment from '../../components/CreditScheduledPayment';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Eye,
  CreditCard,
  DollarSign,
  Calendar,
  Building,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText
} from 'lucide-react';
import { Advance } from '@prisma/client';

// Types
type LoanType = 'HOUSING' | 'CONSUMER';
type LoanStatus = 'ACTIVE' | 'PAID_OFF' | 'SUSPENDED';

interface Employee {
  id: string;
  employeeId: string; // 'matricule' translated to 'employeeId'
  lastName: string;    // 'nom' translated to 'lastName'
  firstName: string;   // 'prenom' translated to 'firstName'
  position: string;    // 'fonction' translated to 'position'
}

interface Loan { // 'Credit' translated to 'Loan'
  id: string;
  employee: Employee;
  type: LoanType;
  loanAmount: number;
  interestRate: number;
  durationYears: number;
  monthlyPayment: number;
  startDate: Date;
  endDate: Date;
  remainingBalance: number;
  amountRepaid: number;
  status: LoanStatus;
  bank: string;
  accountNumber?: string;
  notes?: string;
  interestPaid: number;
  remainingPrincipal: number;
  createdAt: Date;
}

const CreditManagement: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<LoanStatus | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<LoanType | 'ALL'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [newAmountRepaid, setNewAmountRepaid] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedLoanForSchedule, setSelectedLoanForSchedule] = useState<string | null>(null);

  const fetchLoans = async () => {
    try {
      const response = await fetch('/api/loans');
      if (response.ok) {
        const data = await response.json();
        setLoans(data);
      }
    } catch (error) {
      console.error('Error loading loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const fetchAdvances = async () => {
    try {
      const response = await fetch('/api/advances');
      if (response.ok) {
        const data = await response.json();
        setAdvances(data);
      } else {
        throw new Error('Error loading advances');
      }
    } catch (error) {
      console.error('Error loading advances:', error);
    }
  };

    // Fetch data
  useEffect(() => {
    fetchLoans();
    fetchEmployees();
    fetchAdvances();
  }, []);

  // Filter loans
  const filteredLoans = loans.filter(loan => {
    const matchesSearch = 
      loan.employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.bank.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || loan.status === filterStatus;
    const matchesType = filterType === 'ALL' || loan.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-KE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Get status badge
  const getStatusBadge = (status: LoanStatus) => {
    const badges = {
      ACTIVE: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Active' },
      PAID_OFF: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle, text: 'Paid Off' },
      SUSPENDED: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Suspended' }
    };
    
    const badge = badges[status];
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  // Get type badge
  const getTypeBadge = (type: LoanType) => {
    const badges = {
      HOUSING: { color: 'bg-blue-100 text-blue-800', text: 'Housing' },
      CONSUMER: { color: 'bg-purple-100 text-purple-800', text: 'Consumer' }
    };
    
    const badge = badges[type];
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  // Calculate progress percentage - uses calculated progress if available
  const getProgressPercentage = (loan: any) => {
    if (loan.calculatedProgress) {
      return loan.calculatedProgress.progressPercentage;
    }
    return ((loan.amountRepaid / loan.loanAmount) * 100);
  };

  // Get progress info for display
  const getProgressInfo = (loan: any) => {
    if (loan.calculatedProgress) {
      return {
        percentage: loan.calculatedProgress.progressPercentage,
        isLate: loan.calculatedProgress.isLate,
        monthsLate: loan.calculatedProgress.monthsLate,
        monthsElapsed: loan.calculatedProgress.monthsElapsed,
        amountDue: loan.calculatedProgress.amountDue
      };
    }
    
    // Fallback if no calculated progress
    const percentage = Math.min(100, (loan.amountRepaid / loan.loanAmount) * 100);
    return {
      percentage: percentage,
      isLate: false,
      monthsLate: 0,
      monthsElapsed: 0,
      amountDue: 0
    };
  };

  // Handle delete loan
  const handleDeleteLoan = async (loanId: string) => {
    if (!confirm('Are you sure you want to delete this loan?')) {
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/loans/${loanId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchLoans(); // Refresh the list
        alert('Loan deleted successfully');
      } else {
        alert('Error deleting loan');
      }
    } catch (error) {
      console.error('Error during deletion:', error);
      alert('Error deleting loan');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0063b4]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Loan Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage employee housing and consumer loans
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0063b4] hover:bg-[#0052a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0063b4]"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Loan
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CreditCard className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Loans
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {loans.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Loans
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {loans.filter(c => c.status === 'ACTIVE').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Amount
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(loans.reduce((sum, c) => sum + c.loanAmount, 0))}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Remaining Balance
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(loans.reduce((sum, c) => sum + c.remainingBalance, 0))}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm"
                    placeholder="Search by name, employee ID or bank..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex space-x-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as LoanStatus | 'ALL')}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm rounded-md"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PAID_OFF">Paid Off</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
                
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as LoanType | 'ALL')}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm rounded-md"
                >
                  <option value="ALL">All Types</option>
                  <option value="HOUSING">Housing</option>
                  <option value="CONSUMER">Consumer</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loans Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bank
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {loan.employee.firstName} {loan.employee.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {loan.employee.employeeId} • {loan.employee.position}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(loan.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(loan.loanAmount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Remaining: {formatCurrency(loan.remainingBalance)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(loan.monthlyPayment)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const progressInfo = getProgressInfo(loan);
                        return (
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className={`h-2 rounded-full ${progressInfo.isLate ? 'bg-red-500' : 'bg-[#0063b4]'}`}
                                style={{ width: `${Math.min(progressInfo.percentage, 100)}%` }}
                              ></div>
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-sm ${progressInfo.isLate ? 'text-red-600' : 'text-gray-600'}`}>
                                {Math.round(progressInfo.percentage)}%
                              </span>
                              {progressInfo.isLate && progressInfo.monthsLate > 0 && (
                                <span className="text-xs text-red-500">
                                  {progressInfo.monthsLate} months late
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(loan.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {loan.bank}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedLoanForSchedule(loan.id);
                            setShowSchedule(true);
                          }}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded"
                          title="View payment schedule"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLoan(loan);
                            setShowAddModal(false); // Close add modal if open
                            setShowEditModal(false); // Close edit modal if open
                            setShowDetailsModal(true);
                          }}
                          className="text-[#0063b4] hover:text-[#0052a3] p-1 rounded"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLoan(loan);
                            setShowAddModal(false); // Close add modal if open
                            setShowDetailsModal(false); // Close details modal if open
                            setShowEditModal(true);
                          }}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLoan(loan.id)}
                          disabled={deleteLoading}
                          className="text-red-600 hover:text-red-900 p-1 rounded disabled:opacity-50"
                          title="Delete"
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

          {filteredLoans.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No loans found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterStatus !== 'ALL' || filterType !== 'ALL'
                  ? 'No loans match the search criteria.'
                  : 'Start by adding a new loan.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Loan Modal */}
      <AddCreditModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          fetchLoans();
          setShowAddModal(false);
        }}
        employees={employees}
        advances={advances}
      />

      {/* Loan Details Modal */}
      {showDetailsModal && selectedLoan && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Loan Details
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Employee</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedLoan.employee.firstName} {selectedLoan.employee.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedLoan.employee.employeeId} • {selectedLoan.employee.position}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Loan Type</label>
                    <div className="mt-1">
                      {getTypeBadge(selectedLoan.type)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Loan Amount</label>
                    <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedLoan.loanAmount)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Interest Rate</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLoan.interestRate}%</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLoan.durationYears} years</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Monthly Payment</label>
                    <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedLoan.monthlyPayment)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedLoan.startDate)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedLoan.endDate)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount Repaid</label>
                    <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedLoan.amountRepaid)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Remaining Balance</label>
                    <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedLoan.remainingBalance)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">
                      {getStatusBadge(selectedLoan.status)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bank</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLoan.bank}</p>
                  </div>
                </div>
                
                {selectedLoan.accountNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Number</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLoan.accountNumber}</p>
                  </div>
                )}
                
                {selectedLoan.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLoan.notes}</p>
                  </div>
                )}
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Repayment Progress</label>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-3 mr-3">
                      <div 
                        className="bg-[#0063b4] h-3 rounded-full" 
                        style={{ width: `${Math.min(getProgressPercentage(selectedLoan), 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 min-w-[3rem]">
                      {Math.round(getProgressPercentage(selectedLoan))}%
                    </span>
                  </div>
                </div>

                {/* Repayment amount update section */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Update Repayment Amount</h4>
                  <div className="flex items-end space-x-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        New amount repaid (KES)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={selectedLoan.loanAmount}
                        value={newAmountRepaid}
                        onChange={(e) => setNewAmountRepaid(e.target.value)}
                        placeholder={selectedLoan.amountRepaid.toString()}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4]"
                      />
                    </div>
                    <button
                      onClick={async () => {
                        if (!newAmountRepaid || parseFloat(newAmountRepaid) < 0) {
                          alert('Please enter a valid amount');
                          return;
                        }

                        setUpdateLoading(true);
                        try {
                          const response = await fetch('/api/loans/update-progress', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              loanId: selectedLoan.id,
                              amountRepaid: parseFloat(newAmountRepaid)
                            }),
                          });

                          if (response.ok) {
                            await fetchLoans(); // Refresh the list
                            setNewAmountRepaid('');
                            alert('Repayment amount updated successfully');
                            setShowDetailsModal(false);
                          } else {
                            const error = await response.json();
                            alert(`Error: ${error.error}`);
                          }
                        } catch (error) {
                          console.error('Error during update:', error);
                          alert('Error updating repayment amount');
                        } finally {
                          setUpdateLoading(false);
                        }
                      }}
                      disabled={updateLoading || !newAmountRepaid}
                      className="px-4 py-2 bg-[#0063b4] text-white text-sm rounded-md hover:bg-[#0052a3] focus:outline-none focus:ring-2 focus:ring-[#0063b4] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updateLoading ? 'Updating...' : 'Update'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Current amount: {formatCurrency(selectedLoan.amountRepaid)} / {formatCurrency(selectedLoan.loanAmount)}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Loan Modal */}
      {showEditModal && selectedLoan && (
        <AddCreditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedLoan(null);
          }}
          onSuccess={() => {
            fetchLoans();
            setShowEditModal(false);
            setSelectedLoan(null);
          }}
          employees={employees}
          advances={advances}
          editLoan={selectedLoan}
        />
      )}

      {/* Loan Schedule Modal */}
      {selectedLoanForSchedule && (
        <CreditScheduledPayment
          loanId={selectedLoanForSchedule}
          isOpen={showSchedule}
          onClose={() => {
            setShowSchedule(false);
            setSelectedLoanForSchedule(null);
          }}
        />
      )}
    </Layout>
  );
};

export default CreditManagement;
