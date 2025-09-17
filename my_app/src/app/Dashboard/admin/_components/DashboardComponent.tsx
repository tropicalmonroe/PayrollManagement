    // app/dashboard/admin/_components/dashboardComponent.tsx
    "use client";

    import { useState, useEffect } from 'react';
    import Head from 'next/head';
    import { Advance, Employee } from '@prisma/client';
    import { Layout } from '../../../../components/Layout';
    import EmployeeForm from '../../../../components/EmployeeForm';
    import EmployeeList from '../../../../components/EmployeeList';
    import EmployeeDetails from '../../../../components/EmployeeDetails';
    import PayrollSlip from '../../../../components/PayrollSlip';

    export default function DashboardComponent() {
    const [view, setView] = useState("dashboard");

    const renderContent = () => {
        switch (view) {
        case "dashboard":
            return <DashboardContent />;
        case "employees":
            return <EmployeesContent />;
        case "payroll":
            return <PayrollContent />;
        case "documents":
            return <DocumentsContent />;
        case "reports":
            return <ReportsContent />;
        case "settings":
            return <SettingsContent />;
        default:
            return <DashboardContent />;
        }
    };

    return (
        <div className="p-6">
        {/* Navigation */}
        <nav className="flex gap-2 mb-6 flex-wrap">
            <button
            onClick={() => setView("dashboard")}
            className={`payroll-button-secondary ${
                view === "dashboard" ? "bg-blue-600 text-white" : ""
            }`}
            >
            Dashboard
            </button>
            <button
            onClick={() => setView("employees")}
            className={`payroll-button-secondary ${
                view === "employees" ? "bg-blue-600 text-white" : ""
            }`}
            >
            Employees
            </button>
            <button
            onClick={() => setView("payroll")}
            className={`payroll-button-secondary ${
                view === "payroll" ? "bg-blue-600 text-white" : ""
            }`}
            >
            Payroll
            </button>
            <button
            onClick={() => setView("documents")}
            className={`payroll-button-secondary ${
                view === "documents" ? "bg-blue-600 text-white" : ""
            }`}
            >
            Documents
            </button>
            <button
            onClick={() => setView("reports")}
            className={`payroll-button-secondary ${
                view === "reports" ? "bg-blue-600 text-white" : ""
            }`}
            >
            Reports
            </button>
            <button
            onClick={() => setView("settings")}
            className={`payroll-button-secondary ${
                view === "settings" ? "bg-blue-600 text-white" : ""
            }`}
            >
            Settings
            </button>
        </nav>

        {/* Selected Content */}
        <div className="p-4 border rounded-lg bg-white shadow">
            {renderContent()}
        </div>
        </div>
    );
    }

    function DashboardContent() {
    const [stats, setStats] = useState<{
        totalEmployees: number;
        currentMonthPayrolls: number;
        documentsThisMonth: number;
        totalPayrollAmount: number;
        currentPeriod: string;
        recentEmployees: Employee[];
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
        setLoading(true);
        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) {
            throw new Error('Error loading statistics');
        }
        const data = await response.json();
        setStats(data);
        } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setError('Error loading statistics');
        } finally {
        setLoading(false);
        }
    };

    if (loading) {
        return (
        <div className="space-y-6">
            <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="mt-1 text-sm text-gray-600">
                Overview of payroll management
            </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
                <div className="p-5">
                    <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-200 rounded"></div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-6 bg-gray-200 rounded"></div>
                    </div>
                    </div>
                </div>
                </div>
            ))}
            </div>
        </div>
        );
    }

    if (error) {
        return (
        <div className="space-y-6">
            <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="mt-1 text-sm text-gray-600">
                Overview of payroll management
            </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
                <div className="flex-shrink-0">
                <span className="text-red-400">⚠️</span>
                </div>
                <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                <button
                    onClick={fetchDashboardStats}
                    className="text-red-400 hover:text-red-600"
                >
                    Retry
                </button>
                </div>
            </div>
            </div>
        </div>
        );
    }

    const statsCards = [
        { 
        title: 'Active Employees', 
        value: stats?.totalEmployees?.toString() || '0', 
        icon: '👥', 
        color: 'blue' 
        },
        { 
        title: 'Current Month Payrolls', 
        value: stats?.currentMonthPayrolls?.toString() || '0', 
        icon: '💰', 
        color: 'green' 
        },
        { 
        title: 'Documents Generated', 
        value: stats?.documentsThisMonth?.toString() || '0', 
        icon: '📄', 
        color: 'purple' 
        },
        { 
        title: 'Total Amount', 
        value: new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
        }).format(stats?.totalPayrollAmount || 0), 
        icon: '💵', 
        color: 'yellow' 
        },
    ];

    return (
        <div className="space-y-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="mt-1 text-sm text-gray-600">
            Overview of payroll management - {stats?.currentPeriod}
            </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsCards.map((stat, index) => (
            <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                    <span className="text-2xl">{stat.icon}</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                    <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.title}
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                        </dd>
                    </dl>
                    </div>
                </div>
                </div>
            </div>
            ))}
        </div>

        {/* Recent Activity */}
        {stats?.recentEmployees && stats.recentEmployees.length > 0 && (
            <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recently Added Employees
                </h3>
                <div className="space-y-3">
                {stats.recentEmployees.map((employee: Employee) => (
                    <div key={employee.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">
                            {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                            </span>
                        </div>
                        </div>
                        <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                            {employee.firstName} {employee.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{employee.position}</p>
                        </div>
                    </div>
                    <div className="text-xs text-gray-400">
                        {new Date(employee.createdAt).toLocaleDateString('en-KE')}
                    </div>
                    </div>
                ))}
                </div>
            </div>
            </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
                Quick Actions
            </h3>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[
                { 
                    title: 'Add Employee', 
                    description: 'Create a new employee record', 
                    icon: '➕',
                    href: '/employees',
                },
                { 
                    title: 'Calculate Payroll', 
                    description: 'Run monthly payroll calculation', 
                    icon: '🧮',
                    href: '/payroll',
                },
                { 
                    title: 'View Reports', 
                    description: 'Access payroll reports', 
                    icon: '📋',
                    href: '/reports',
                },
                ].map((action, index) => (
                <div key={index} className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300">
                    <div>
                    <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-600 ring-4 ring-white">
                        <span className="text-xl">{action.icon}</span>
                    </span>
                    </div>
                    <div className="mt-4">
                    <h3 className="text-lg font-medium">
                        <a href={action.href} className="focus:outline-none">
                        <span className="absolute inset-0" aria-hidden="true" />
                        {action.title}
                        </a>
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                        {action.description}
                    </p>
                    </div>
                </div>
                ))}
            </div>
            </div>
        </div>
        </div>
    );
    }

    function EmployeesContent() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [advances, setAdvances] = useState<Advance[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load employees
    const fetchEmployees = async () => {
        try {
        setLoading(true);
        const response = await fetch('/api/employees');
        if (!response.ok) {
            throw new Error('Error loading employees');
        }
        const data = await response.json();
        setEmployees(data);
        } catch (error) {
        console.error('Error fetching employees:', error);
        setError('Error loading employees');
        } finally {
        setLoading(false);
        }
    };

    // Load advances
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

    useEffect(() => {
        fetchEmployees();
        fetchAdvances();
    }, []);

    // Add an employee
    const handleAddEmployee = async (employeeData: any) => {
        try {
        const response = await fetch('/api/employees', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(employeeData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error adding employee');
        }

        const newEmployee = await response.json();
        setEmployees((prev) => [newEmployee, ...prev]);
        setShowForm(false);
        setError(null);
        } catch (error: any) {
        console.error('Error adding employee:', error);
        setError(error.message);
        throw error;
        }
    };

    // Edit an employee
    const handleEditEmployee = async (employeeData: any) => {
        if (!selectedEmployee) return;

        try {
        const response = await fetch(`/api/employees/${selectedEmployee.id}`, {
            method: 'PUT',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(employeeData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error updating employee');
        }

        const updatedEmployee = await response.json();
        setEmployees((prev) =>
            prev.map((emp) => (emp.id === selectedEmployee.id ? updatedEmployee : emp))
        );
        setShowForm(false);
        setShowDetails(false);
        setSelectedEmployee(null);
        setIsEditing(false);
        setError(null);
        } catch (error: any) {
        console.error('Error updating employee:', error);
        setError(error.message);
        throw error;
        }
    };

    // Delete an employee
    const handleDeleteEmployee = async (employeeId: string) => {
        if (!confirm('Are you sure you want to delete this employee? This action is irreversible.')) {
        return;
        }

        try {
        const response = await fetch(`/api/employees/${employeeId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error deleting employee');
        }

        setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
        setError(null);
        } catch (error: any) {
        console.error('Error deleting employee:', error);
        setError(error.message);
        }
    };

    // View employee details
    const handleViewEmployee = (employee: Employee) => {
        setSelectedEmployee(employee);
        setShowDetails(true);
    };

    // Edit employee
    const handleEditClick = (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsEditing(true);
        setShowForm(true);
    };

    // Open add form
    const handleAddClick = () => {
        setSelectedEmployee(null);
        setIsEditing(false);
        setShowForm(true);
    };

    // Close modals
    const handleCloseForm = () => {
        setShowForm(false);
        setSelectedEmployee(null);
        setIsEditing(false);
        setError(null);
    };

    const handleCloseDetails = () => {
        setShowDetails(false);
        setSelectedEmployee(null);
    };

    // Switch from details to edit
    const handleEditFromDetails = () => {
        setShowDetails(false);
        setIsEditing(true);
        setShowForm(true);
    };

    if (loading) {
        return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
                <p className="mt-1 text-sm text-gray-600">
                Manage employee information
                </p>
            </div>
            </div>
            <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
                <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-500">Loading employees...</p>
                </div>
            </div>
            </div>
        </div>
        );
    }

    return (
        <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
            <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
            <p className="mt-1 text-sm text-gray-600">
                Manage employee information ({employees.length} employee{employees.length > 1 ? 's' : ''})
            </p>
            </div>
            <button 
            onClick={handleAddClick}
            className="payroll-button"
            >
            Add Employee
            </button>
        </div>

        {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
                <div className="flex-shrink-0">
                <span className="text-red-400">⚠️</span>
                </div>
                <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                <button
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-600"
                >
                    ✕
                </button>
                </div>
            </div>
            </div>
        )}

        <EmployeeList
            employees={employees}
            advances={advances}
            onEdit={handleEditClick}
            onDelete={handleDeleteEmployee}
            onView={handleViewEmployee}
        />

        {showForm && (
            <EmployeeForm
            onSubmit={isEditing ? handleEditEmployee : handleAddEmployee}
            onCancel={handleCloseForm}
            initialData={selectedEmployee}
            isEditing={isEditing}
            />
        )}

        {showDetails && selectedEmployee && (
            <EmployeeDetails
            employee={selectedEmployee}
            onClose={handleCloseDetails}
            onEdit={handleEditFromDetails}
            />
        )}
        </div>
    );
    }

    function PayrollContent() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
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

    // Load employees
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
        setError('Failed to load employees');
        } finally {
        setLoading(false);
        }
    };

    const handleGeneratePayroll = (employee: Employee) => {
        setSelectedEmployee(employee);
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">
                Payslip - {selectedEmployee.firstName} {selectedEmployee.lastName}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
                </p>
            </div>
            <button
                onClick={handleClosePayroll}
                className="payroll-button-secondary"
            >
                ← Back to List
            </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <PayrollSlip 
                employee={selectedEmployee} 
                month={selectedMonth} 
                year={selectedYear} 
            />
            </div>
        </div>
        );
    }

    return (
        <div className="space-y-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-900">Payroll Calculation</h2>
            <p className="mt-1 text-sm text-gray-600">
            Generate payslips for your employees
            </p>
        </div>

        {/* Period Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payroll Period</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-2">
                Month
                </label>
                <select
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="payroll-input"
                >
                {months.map((month) => (
                    <option key={month.value} value={month.value}>
                    {month.label}
                    </option>
                ))}
                </select>
            </div>
            <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                Year
                </label>
                <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="payroll-input"
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
                Active Employees ({employees.length})
            </h3>
            </div>

            {loading ? (
            <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-500">Loading employees...</p>
            </div>
            ) : error ? (
            <div className="p-8 text-center">
                <p className="text-red-600">{error}</p>
                <button
                onClick={fetchEmployees}
                className="mt-4 payroll-button-secondary"
                >
                Retry
                </button>
            </div>
            ) : employees.length === 0 ? (
            <div className="p-8 text-center">
                <span className="text-6xl">👥</span>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No Active Employees</h3>
                <p className="mt-2 text-sm text-gray-500">
                Add employees to start calculating payroll
                </p>
            </div>
            ) : (
            <div className="divide-y divide-gray-200">
                {employees.map((employee) => (
                <div key={employee.id} className="p-6 hover:bg-gray-50">
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
                        <div className="flex items-center">
                            <h4 className="text-sm font-medium text-gray-900">
                            {employee.firstName} {employee.lastName}
                            </h4>
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {employee.status}
                            </span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                            <span>{employee.employeeId}</span>
                            <span className="mx-2">•</span>
                            <span>{employee.position}</span>
                            <span className="mx-2">•</span>
                            <span className="font-medium">
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
                        <div className="text-gray-900 font-medium">
                            {new Intl.NumberFormat('en-KE', {
                            style: 'currency',
                            currency: 'KES',
                            }).format(employee.grossSalary)}
                        </div>
                        <div className="text-gray-500">Gross Salary</div>
                        </div>
                        <button
                        onClick={() => handleGeneratePayroll(employee)}
                        className="payroll-button"
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
        </div>
    );
    }

    function DocumentsContent() {
    return (
        <div className="space-y-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
            <p className="mt-1 text-sm text-gray-600">
            Manage payroll documents
            </p>
        </div>

        <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
            <div className="text-center py-12">
                <span className="text-6xl">📄</span>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No Documents</h3>
                <p className="mt-2 text-sm text-gray-500">
                Generated documents will appear here
                </p>
            </div>
            </div>
        </div>
        </div>
    );
    }

    function ReportsContent() {
    return (
        <div className="space-y-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
            <p className="mt-1 text-sm text-gray-600">
            View payroll reports
            </p>
        </div>

        <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
            <div className="text-center py-12">
                <span className="text-6xl">📈</span>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No Reports</h3>
                <p className="mt-2 text-sm text-gray-500">
                Reports will be available after payroll calculations
                </p>
            </div>
            </div>
        </div>
        </div>
    );
    }

    function SettingsContent() {
    return (
        <div className="space-y-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <p className="mt-1 text-sm text-gray-600">
            Configure application settings
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Settings */}
            <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                Company Information
                </h3>
                <div className="mt-5 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                    Company Name
                    </label>
                    <input
                    type="text"
                    className="payroll-input mt-1"
                    placeholder="Your company name"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                    Address
                    </label>
                    <textarea
                    className="payroll-input mt-1"
                    rows={3}
                    placeholder="Company address"
                    />
                </div>
                <button className="payroll-button">
                    Save
                </button>
                </div>
            </div>
            </div>

            {/* Payroll Settings */}
            <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                Payroll Settings
                </h3>
                <div className="mt-5 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                    NSSF Rate (%)
                    </label>
                    <input
                    type="number"
                    step="0.01"
                    className="payroll-input mt-1"
                    defaultValue="6"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                    NSSF Max Contribution (KES)
                    </label>
                    <input
                    type="number"
                    className="payroll-input mt-1"
                    defaultValue="4320"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                    SHIF Rate (%)
                    </label>
                    <input
                    type="number"
                    step="0.01"
                    className="payroll-input mt-1"
                    defaultValue="2.75"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                    Housing Levy Rate (%)
                    </label>
                    <input
                    type="number"
                    step="0.01"
                    className="payroll-input mt-1"
                    defaultValue="1.5"
                    />
                </div>
                <button className="payroll-button">
                    Save
                </button>
                </div>
            </div>
            </div>
        </div>
        </div>
    );
    }

