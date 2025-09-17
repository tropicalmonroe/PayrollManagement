"use client"

import { useState } from 'react'
import Head from 'next/head'
import { Layout } from '@/components/Layout'

export default function Home() {
const [activeTab, setActiveTab] = useState('dashboard')

return (
    <>
    <Head>
        <title>Payroll Management - AD Capital</title>
        <meta name="description" content="Payroll management application" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
    </Head>

    <Layout>
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
                <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">
                    Payroll Management
                </h1>
                </div>
            </div>
            <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                Dedicated payroll management application
                </span>
            </div>
            </div>
        </div>
        </header>

        {/* Navigation */}
        <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
            {[
                { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                { id: 'employees', label: 'Employees', icon: '👥' },
                { id: 'payroll', label: 'Payroll Calculation', icon: '💰' },
                { id: 'documents', label: 'Documents', icon: '📄' },
                { id: 'reports', label: 'Reports', icon: '📈' },
                { id: 'settings', label: 'Settings', icon: '⚙️' }
            ].map((tab) => (
                <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                </button>
            ))}
            </div>
        </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
            {activeTab === 'dashboard' && <DashboardContent />}
            {activeTab === 'employees' && <EmployeesContent />}
            {activeTab === 'payroll' && <PayrollContent />}
            {activeTab === 'documents' && <DocumentsContent />}
            {activeTab === 'reports' && <ReportsContent />}
            {activeTab === 'settings' && <SettingsContent />}
        </div>
        </main>
    </div>
    </Layout>
    </>
)
}

function DashboardContent() {
return (
    <div className="space-y-6">
    <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-600">
        Overview of payroll management
        </p>
    </div>

    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
        { title: 'Active Employees', value: '0', icon: '👥', color: 'blue' },
        { title: 'This Month Payrolls', value: '0', icon: '💰', color: 'green' },
        { title: 'Generated Documents', value: '0', icon: '📄', color: 'purple' },
        { title: 'Total Amount', value: '0 KES', icon: '💵', color: 'yellow' }
        ].map((stat, index) => (
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

    {/* Quick Actions */}
    <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
            Quick Actions
        </h3>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
            { title: 'Add Employee', description: 'Create a new employee record', icon: '➕' },
            { title: 'Calculate Payroll', description: 'Run monthly payroll calculation', icon: '🧮' },
            { title: 'Generate Payslips', description: 'Create payroll slips', icon: '📋' }
            ].map((action, index) => (
            <div key={index} className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300">
                <div>
                <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-600 ring-4 ring-white">
                    <span className="text-xl">{action.icon}</span>
                </span>
                </div>
                <div className="mt-4">
                <h3 className="text-lg font-medium">
                    <button className="focus:outline-none">
                    <span className="absolute inset-0" aria-hidden="true" />
                    {action.title}
                    </button>
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
)
}

function EmployeesContent() {
return (
    <div className="space-y-6">
    <div className="flex justify-between items-center">
        <div>
        <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
        <p className="mt-1 text-sm text-gray-600">
            Manage employee information
        </p>
        </div>
        <button className="payroll-button">
        Add Employee
        </button>
    </div>

    <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
        <div className="text-center py-12">
            <span className="text-6xl">👥</span>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Employees</h3>
            <p className="mt-2 text-sm text-gray-500">
            Start by adding your first employee
            </p>
            <div className="mt-6">
            <button className="payroll-button">
                Add Employee
            </button>
            </div>
        </div>
        </div>
    </div>
    </div>
)
}

function PayrollContent() {
return (
    <div className="space-y-6">
    <div>
        <h2 className="text-2xl font-bold text-gray-900">Payroll Calculation</h2>
        <p className="mt-1 text-sm text-gray-600">
        Calculate and manage employee payroll
        </p>
    </div>

    <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
        <div className="text-center py-12">
            <span className="text-6xl">💰</span>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Payroll Calculation</h3>
            <p className="mt-2 text-sm text-gray-500">
            Payroll calculation feature coming soon
            </p>
        </div>
        </div>
    </div>
    </div>
)
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
)
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
)
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
                defaultValue="6.00"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">
                NSSF Ceiling (KES)
                </label>
                <input
                type="number"
                className="payroll-input mt-1"
                defaultValue="4320"
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
)
}
