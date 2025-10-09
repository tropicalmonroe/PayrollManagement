"use client";

import { useState, useEffect } from 'react';
import { Employee, Credit, Advance, VariableElement } from '@prisma/client';
import DetailedPayrollView from '../../../components/DetailedPayrollView';
import { Card } from '@/components/ui/card';
import { MdOutlinePeopleAlt } from 'react-icons/md';
import { IoArrowBack } from 'react-icons/io5';

interface EmployeeWithData extends Employee {
credits?: Credit[];
advances?: Advance[];
variableElements?: VariableElement[];
}

export default function PayrollPage() {
const [employees, setEmployees] = useState<Employee[]>([]);
const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithData | null>(null);
const [selectedMonth, setSelectedMonth] = useState<string>('');
const [selectedYear, setSelectedYear] = useState<string>('');
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// Initialize with current month and year
useEffect(() => {
    const now = new Date();
    setSelectedMonth((now.getMonth() + 1).toString().padStart(2, '0'));
    setSelectedYear(now.getFullYear().toString());
}, []);

// Fetch the list of employees
useEffect(() => {
    fetchEmployees();
}, []);

const fetchEmployees = async () => {
    try {
    setLoading(true);
    const response = await fetch('/api/employees');
    if (!response.ok) {
        throw new Error('Error loading employees');
    }
    const data = await response.json();
    setEmployees(data.filter((emp: Employee) => emp.status === 'ACTIVE'));
    } catch (error) {
    console.error('Error:', error);
    setError('Unable to load employees');
    } finally {
    setLoading(false);
    }
};

const handleGeneratePayroll = async (employee: Employee) => {
    try {
    // Fetch employee data with credits, advances, and variable elements
    const [employeeResponse, creditsResponse, advancesResponse, variableElementsResponse] = await Promise.all([
        fetch(`/api/employees/${employee.id}`),
        fetch(`/api/credits?employeeId=${employee.id}`),
        fetch(`/api/advances?employeeId=${employee.id}`),
        fetch(`/api/variable-elements?employeeId=${employee.id}&month=${selectedMonth}&year=${selectedYear}`),
    ]);

    let employeeData = employee;
    let credits: Credit[] = [];
    let advances: Advance[] = [];
    let variableElements: VariableElement[] = [];

    if (employeeResponse.ok) {
        employeeData = await employeeResponse.json();
    }

    if (creditsResponse.ok) {
        credits = await creditsResponse.json();
    }

    if (advancesResponse.ok) {
        advances = await advancesResponse.json();
    }

    if (variableElementsResponse.ok) {
        variableElements = await variableElementsResponse.json();
    }

    setSelectedEmployee({
        ...employeeData,
        credits,
        advances,
        variableElements,
    });
    } catch (error) {
    console.error('Error loading data:', error);
    setSelectedEmployee(employee);
    }
};

const handleClosePayroll = () => {
    setSelectedEmployee(null);
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
    { value: '12', label: 'December' },
];

const years = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - 5 + i;
    return year.toString();
});

if (selectedEmployee) {
    return (
    <Card className="p-4 rounded-lg bg-[#f3f8fc] border-0 shadow-md mt-[2vh]">
        <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
            <h2 className="text-2xl font-bold text-zinc-900">
                Payslip - {selectedEmployee.firstName} {selectedEmployee.lastName}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
                {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
            </p>
            </div>
            <button
            onClick={handleClosePayroll}
            className="payroll-button-secondary rounded-md bg-zinc-600 px-4 py-2 text-sm 
            font-medium text-white hover:bg-zinc-700 flex items-center gap-2 cursor-pointer"
            >
            <IoArrowBack/>
            Back to List
            </button>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6">
            <DetailedPayrollView
            employee={selectedEmployee}
            month={selectedMonth}
            year={selectedYear}
            />
        </div>
        </div>
    </Card>
    );
}

return (
    <Card className="p-4 rounded-lg bg-[#f3f8fc] border-0 shadow-md mt-[2vh]">
    <div className="space-y-6">
        <div>
        <h2 className="text-2xl font-bold tracking-tighter text-zinc-900">Payroll Calculation</h2>
        <p className="mt-0 text-sm tracking-tighter text-zinc-700 capitalize">
            Generate payslips for your employees
        </p>
        </div>

        {/* Pay Period Selection */}
        <div className="bg-[#142b3d] rounded-lg shadow-sm border border-zinc-200 p-6">
        <h3 className="text-lg font-medium text-zinc-50 mb-4 tracking-tight">Payroll Period</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
            <label htmlFor="month" className="block text-sm font-medium text-white mb-2">
                Month
            </label>
            <select
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="payroll-input w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {months.map((month) => (
                <option key={month.value} value={month.value}>
                    {month.label}
                </option>
                ))}
            </select>
            </div>
            <div>
            <label htmlFor="year" className="block text-sm font-medium text-white mb-2">
                Year
            </label>
            <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="payroll-input w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {years.map((year) => (
                <option key={year} value={year}>
                    {year}
                </option>
                ))}
            </select>
            </div>
        </div>
        </div>

        {/* Employee List */}
        <div className="bg-[#6ea0c2] rounded-lg shadow-sm border border-zinc-200">
        <div className="px-6 py-4 border-b border-zinc-200">
            <h3 className="text-lg font-medium text-zinc-900">
            Active Employees&nbsp;-&nbsp;<span className='tracking-normal font-semibold'>({employees.length})</span>
            </h3>
        </div>

        {loading ? (
            <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-zinc-500">Loading employees...</p>
            </div>
        ) : error ? (
            <div className="p-8 text-center">
            <p className="text-rose-400">{error}</p>
            <button
                onClick={fetchEmployees}
                className="payroll-button-secondary mt-4 rounded-md bg-zinc-600 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
                Retry
            </button>
            </div>
        ) : employees.length === 0 ? (
            <div className="p-8 text-center">
            <div className='flex items-center justify-center'>
            <span className="text-6xl text-rose-400 text-center">
            <MdOutlinePeopleAlt/>
            </span>
            </div>
            <h3 className="mt-4 text-lg font-medium tracking-tight capitalize text-zinc-900">No Active Employees</h3>
            <p className="mt-2 text-sm text-zinc-400 font-light">
                Add employees to start calculating payroll
            </p>
            </div>
        ) : (
            <div className="divide-y divide-zinc-200 bg-[#142b3d]">
            {employees.map((employee) => (
                <div key={employee.id} className="p-6 hover:bg-[#1b435b] transition duration-300">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 tracking-tight">
                            {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                        </span>
                        </div>
                    </div>
                    <div className="ml-4">
                        <div className="flex items-center">
                        <h4 className="text-sm tracking-tight text-white capitalize">
                            {employee.firstName} {employee.lastName}
                        </h4>
                        </div>
                        <div className='my-1'>
                        <span className="ml-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs tracking-tighter font-medium bg-emerald-100 text-emerald-800">
                            {employee.status}
                        </span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-white">
                        <span className='tracking-tighter'>{employee.employeeId}</span>
                        <span className="mx-2">•</span>
                        <span className='tracking-tighter'>{employee.position}</span>
                        <span className="mx-2">•</span>
                        <span className="font-medium tracking-tighter">
                            {new Intl.NumberFormat('en-KE', {
                            style: 'currency',
                            currency: 'KES',
                            }).format(employee.baseSalary)} / month
                        </span>
                        </div>
                    </div>
                    </div>

                    <div className="flex items-center space-x-3">
                    <div className="text-right text-sm">
                        <div className="text-emerald-400 font-medium">
                        {new Intl.NumberFormat('en-KE', {
                            style: 'currency',
                            currency: 'KES',
                        }).format(employee.grossSalary || employee.baseSalary)}
                        </div>
                        <div className="text-white">Gross Salary</div>
                    </div>
                    <button
                        onClick={() => handleGeneratePayroll(employee)}
                        className="payroll-button rounded-md ml-2 bg-blue-600 px-4 py-2 text-sm font-medium 
                        text-white hover:bg-blue-700 cursor-pointer"
                    >
                        Generate Payslip
                    </button>
                    </div>
                </div>
                </div>
            ))}
            </div>
        )}
        </div>

        {/* Batch Actions */}
        {employees.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6">
            <h3 className="text-lg font-medium text-zinc-900 mb-4">Batch Actions</h3>
            <div className="flex space-x-4">
            <button
                onClick={() => {
                alert('Feature coming soon: Generate all payslips in PDF');
                }}
                className="payroll-button rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
                Generate All Payslips (PDF)
            </button>
            <button
                onClick={() => {
                alert('Feature coming soon: Export payroll ledger in Excel');
                }}
                className="payroll-button-secondary rounded-md bg-zinc-600 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
                Export Payroll Ledger (Excel)
            </button>
            </div>
        </div>
        )}
    </div>
    </Card>
);
}
