"use client";

import React, { useState, useEffect } from 'react';
import { Users, ArrowLeft, Plus, Edit, Eye, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import EmployeeList from '../../../../../components/EmployeeList';
import EmployeeForm from '../../../../../components/EmployeeForm';
import EmployeeDetails from '../../../../../components/EmployeeDetails';
import { Advance, Employee } from '@prisma/client';
import { IoPersonAddSharp } from 'react-icons/io5';

const EmployeeRecordPage = () => {
const router = useRouter();
const [employees, setEmployees] = useState<Employee[]>([]);
const [advances, setAdvances] = useState<Advance[]>([]);
const [loading, setLoading] = useState(true);
const [showForm, setShowForm] = useState(false);
const [showDetails, setShowDetails] = useState(false);
const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
const [isEditing, setIsEditing] = useState(false);

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

// Load employees
useEffect(() => {
    fetchEmployees();
    fetchAdvances();
}, []);

const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditing(true);
    setShowForm(true);
};

const handleView = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDetails(true);
};

const handleDelete = async (employeeId: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
    try {
        const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'DELETE',
        });
        
        if (response.ok) {
        setEmployees(employees.filter(emp => emp.id !== employeeId));
        } else {
        alert('Error during deletion');
        }
    } catch (error) {
        console.error('Error during deletion:', error);
        alert('Error during deletion');
    }
    }
};

const handleFormSubmit = async (employeeData: any) => {
    try {
        const url = isEditing ? `/api/employees/${selectedEmployee?.id}` : '/api/employees';
        const method = isEditing ? 'PUT' : 'POST';
        
        console.log('Sending data:', employeeData); // Add this line
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(employeeData),
        });

        if (response.ok) {
            // ... success code
        } else {
            const errorData = await response.json(); // Add this line
            console.error('API Error:', errorData); // Add this line
            alert(`Error during save: ${errorData.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error during save:', error);
        alert('Error during save');
    }
};

const handleAddNew = () => {
    setSelectedEmployee(null);
    setIsEditing(false);
    setShowForm(true);
};

const handleCloseForm = () => {
    setShowForm(false);
    setSelectedEmployee(null);
    setIsEditing(false);
};

const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedEmployee(null);
};

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
        
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-zinc-700 rounded-xl p-1">
            <Users className="w-6 h-6 text-blue-50" />
            </div>
            <h1 className="text-2xl font-bold tracking-tighter text-zinc-800">Employee Record</h1>
            </div>
            <button
                onClick={handleAddNew}
                className="payroll-button flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-[#142b3d]"
                >
                <IoPersonAddSharp className='mr-2 w-[18px] h-[18px]'/>Add Employee
            </button>
        </div>
        
        <p className="text-zinc-400 text-sm w-[20vw]">
            Create or modify employee file: personal data, contract, salary, bonuses, allowances, housing loan schedule.
        </p>
        </div>

        {/* Employee list */}
        <EmployeeList
        employees={employees}
        advances={advances}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        />

        {/* Modal for employee form */}
        {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                {isEditing ? 'Edit Employee' : 'New Employee'}
                </h2>
                <button
                onClick={handleCloseForm}
                className="text-zinc-500 hover:text-zinc-700"
                >
                ✕
                </button>
            </div>
            <EmployeeForm
                initialData={selectedEmployee}
                isEditing={isEditing}
                onSubmit={handleFormSubmit}
                onCancel={handleCloseForm}
            />
            </div>
        </div>
        )}

        {/* Modal for employee details */}
        {showDetails && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Employee Details</h2>
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
                handleCloseDetails();
                handleEdit(selectedEmployee);
                }}
            />
            </div>
        </div>
        )}
    </div>
);
};

export default EmployeeRecordPage;