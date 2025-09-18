"use client";

import { useState } from 'react';
import { Employee, EmployeeStatus, MaritalStatus, Advance } from '@prisma/client';
import { calculatePayroll, type EmployeePayrollData, type PayrollResult } from '../lib/payrollCalculations';

interface EmployeeListProps {
employees: Employee[];
advances: Advance[];
onEdit: (employee: Employee) => void;
onDelete: (employeeId: string) => void;
onView: (employee: Employee) => void;
}

export default function EmployeeList({ employees, advances, onEdit, onDelete, onView }: EmployeeListProps) {
const [searchTerm, setSearchTerm] = useState('');
const [statusFilter, setStatusFilter] = useState<EmployeeStatus | 'ALL'>('ALL');
const [sortBy, setSortBy] = useState<'name' | 'hireDate' | 'baseSalary'>('name');
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

// Filter and sort employees
const filteredAndSortedEmployees = employees
    .filter((employee) => {
    const matchesSearch =
        employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || employee.status === statusFilter;

    return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
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

const getMaritalStatus = (status: MaritalStatus) => {
    switch (status) {
    case 'SINGLE':
        return 'Single';
    case 'MARRIED':
        return 'Married';
    case 'DIVORCED':
        return 'Divorced';
    case 'WIDOWED':
        return 'Widowed';
    default:
        return status;
    }
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
    }).format(amount);
};

const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    }).format(new Date(date));
};

const calculateAge = (birthDate: Date | null) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
    }
    return age.toString();
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

    return seniorityYears + seniorityMonths / 12;
};

// Calculate monthly advance deduction (sum of installmentAmount for active advances)



const calculateNetSalary = (employee: Employee) => {
    try {

        // Calculate total salary advance from active advances
        const salaryAdvance = advances
            ?.filter(advance => advance.status === 'IN_PROGRESS')
            .reduce((sum, advance) => sum + advance.installmentAmount, 0) || 0;

    const employeeData: EmployeePayrollData = {
        lastName: employee.lastName,
        firstName: employee.firstName,
        employeeId: employee.employeeId,
        idNumber: employee.idNumber || '',
        nssfNumber: employee.nssfNumber || '',
        maritalStatus: employee.maritalStatus as 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED',
        dateOfBirth: employee.dateOfBirth || new Date(),
        hireDate: employee.hireDate,
        seniority: calculateSeniority(employee.hireDate),
        numberOfDeductions: employee.numberOfDeductions || 0,
        numberOfDaysPerMonth: employee.numberOfDaysPerMonth || 30,
        baseSalary: employee.baseSalary,
        housingAllowance: employee.housingAllowance || 0,
        mealAllowance: employee.mealAllowance || 0,
        transportAllowance: employee.transportAllowance || 0,
        representationAllowance: employee.representationAllowance || 0,
        insurances: {
        comprehensiveHealthInsurance: false,
        foreignHealthCover: false,
        enhancedDisabilityCover: false,
        },
        mortgageCredit: employee.loanRepayment ? {
        monthlyAmount: employee.loanRepayment,
        interest: 0,
        } : undefined,
        consumerCredit: employee.helbLoan ? {
        monthlyAmount: employee.helbLoan,
        } : undefined,
        salaryAdvance:{
        monthlyAmount: salaryAdvance,
        },
        variableElements: [],
        bankAccount: employee.bankAccount || '',
        bankBranch: employee.bankBranch || '',
        useNssfEmployee: employee.subjectToNssf ?? true,
        useShifEmployee: employee.subjectToShif ?? true,
        usePensionEmployee: false,
        useInsuranceDiversifiedEmployee: false,
        bonuses: 0,
        overtimePay: 0,
        loanRepayment: employee.loanRepayment || 0,
        otherDeductions: 0,
        helbLoan: employee.helbLoan || 0,
        subjectToNssf: employee.subjectToNssf ?? true,
        subjectToShif: employee.subjectToShif ?? true,
        subjectToHousingLevy: employee.subjectToHousingLevy ?? true,
    };

    const payrollResult: PayrollResult = calculatePayroll(employeeData);
    return payrollResult.netSalaryPayable;
    } catch (error) {
    console.error('Error calculating net salary for employee:', employee.employeeId, error);
    return employee.baseSalary; // Fallback to base salary if calculation fails
    }
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

return (
    <div className="space-y-6">
    {/* Filters and Search */}
    <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
            Search
            </label>
            <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Name, ID, position..."
            className="payroll-input"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
            Status
            </label>
            <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EmployeeStatus | 'ALL')}
            className="payroll-input"
            >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="RESIGNED">Resigned</option>
            <option value="TERMINATED">Terminated</option>
            <option value="RETIRED">Retired</option>
            </select>
        </div>

        <div className="flex items-end">
            <div className="text-sm text-zinc-600">
            {filteredAndSortedEmployees.length} employee(s) found
            </div>
        </div>
        </div>
    </div>

    {/* Employee List */}
    {filteredAndSortedEmployees.length === 0 ? (
        <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
            <div className="text-center py-12">
            <span className="text-6xl">👥</span>
            <h3 className="mt-4 text-lg font-medium text-zinc-900">
                {searchTerm || statusFilter !== 'ALL' ? 'No employees found' : 'No employees'}
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
                {searchTerm || statusFilter !== 'ALL'
                ? 'Try adjusting your search criteria'
                : 'Start by adding your first employee'}
            </p>
            </div>
        </div>
        </div>
    ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Desktop Version - Table */}
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
                    Net Salary {getSortIcon('baseSalary')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Actions
                </th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-zinc-200">
                {filteredAndSortedEmployees.map((employee) => (
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
                    {formatDate(employee.hireDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                    {formatCurrency(calculateNetSalary(employee))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(employee.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                        <button
                        onClick={() => onView(employee)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                        >
                        👁️
                        </button>
                        <button
                        onClick={() => onEdit(employee)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit"
                        >
                        ✏️
                        </button>
                        <button
                        onClick={() => onDelete(employee.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                        >
                        🗑️
                        </button>
                    </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>

        {/* Mobile Version - Cards */}
        <div className="lg:hidden">
            <div className="divide-y divide-zinc-200">
            {filteredAndSortedEmployees.map((employee) => (
                <div key={employee.id} className="p-4">
                <div className="flex items-center justify-between">
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
                    <div className="flex space-x-2">
                    <button
                        onClick={() => onView(employee)}
                        className="text-blue-600 hover:text-blue-900"
                    >
                        👁️
                    </button>
                    <button
                        onClick={() => onEdit(employee)}
                        className="text-indigo-600 hover:text-indigo-900"
                    >
                        ✏️
                    </button>
                    <button
                        onClick={() => onDelete(employee.id)}
                        className="text-red-600 hover:text-red-900"
                    >
                        🗑️
                    </button>
                    </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                    <span className="text-zinc-500">Hired On:</span>
                    <div className="font-medium">{formatDate(employee.hireDate)}</div>
                    </div>
                    <div>
                    <span className="text-zinc-500">Net Salary:</span>
                    <div className="font-medium">{formatCurrency(calculateNetSalary(employee))}</div>
                    </div>
                </div>
                <div className="mt-2 flex justify-between items-center">
                    <div>{getStatusBadge(employee.status)}</div>
                </div>
                </div>
            ))}
            </div>
        </div>
        </div>
    )}
    </div>
);
}
