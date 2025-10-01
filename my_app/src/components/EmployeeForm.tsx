"use client";

import { useState } from 'react';
// import { EmployeeStatus, MaritalStatus } from '@prisma/client';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CreditCard, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface EmployeeFormProps {
onSubmit: (employeeData: any) => void;
onCancel: () => void;
initialData?: any;
isEditing?: boolean;
}

export default function EmployeeForm({ onSubmit, onCancel, initialData, isEditing = false }: EmployeeFormProps) {
const [formData, setFormData] = useState({
    employeeId: initialData?.employeeId || '',
    lastName: initialData?.lastName || '',
    firstName: initialData?.firstName || '',
    position: initialData?.position || '',
    idNumber: initialData?.idNumber || '',
    kraPin: initialData?.kraPin || '', // Added
    nssfNumber: initialData?.nssfNumber || '',
    maritalStatus: initialData?.maritalStatus || 'SINGLE',
    dateOfBirth: initialData?.dateOfBirth ? new Date(initialData.dateOfBirth).toISOString().split('T')[0] : '',
    hireDate: initialData?.hireDate ? new Date(initialData.hireDate).toISOString().split('T')[0] : '',
    numberOfDeductions: initialData?.numberOfDeductions || 0,
    numberOfDaysPerMonth: initialData?.numberOfDaysPerMonth || 30,
    baseSalary: initialData?.baseSalary || '',
    housingAllowance: initialData?.housingAllowance || '',
    mealAllowance: initialData?.mealAllowance || '',
    transportAllowance: initialData?.transportAllowance || '',
    representationAllowance: initialData?.representationAllowance || '',
    bankAccount: initialData?.bankAccount || '',
    bankBranch: initialData?.bankBranch || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    status: initialData?.status || 'ACTIVE',
    helbLoan: initialData?.helbLoan || '', // Added
    insurances: initialData?.insurances ? JSON.stringify(initialData.insurances) : '', // Added
    useNssfEmployee: initialData?.useNssfEmployee !== undefined ? initialData.useNssfEmployee : true,
    useShifEmployee: initialData?.useShifEmployee !== undefined ? initialData.useShifEmployee : true,
    useHousingLevy: initialData?.useHousingLevy !== undefined ? initialData.useHousingLevy : true,
});

const [errors, setErrors] = useState<Record<string, string>>({});
const [isSubmitting, setIsSubmitting] = useState(false);

// Calculate gross salary for display
const grossSalary = (
    (parseFloat(formData.baseSalary) || 0) +
    (parseFloat(formData.housingAllowance) || 0) +
    (parseFloat(formData.mealAllowance) || 0) +
    (parseFloat(formData.transportAllowance) || 0) +
    (parseFloat(formData.representationAllowance) || 0)
).toFixed(2);

const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
    ...prev,
    [name]: value,
    }));

    if (errors[name]) {
    setErrors((prev) => ({
        ...prev,
        [name]: '',
    }));
    }
};

const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.employeeId.trim()) newErrors.employeeId = 'Employee ID is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.position.trim()) newErrors.position = 'Position is required';
    if (!formData.hireDate) newErrors.hireDate = 'Hire date is required';
    if (!formData.baseSalary || parseFloat(formData.baseSalary) <= 0) {
    newErrors.baseSalary = 'Base salary must be greater than 0';
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    newErrors.email = 'Invalid email format';
    }

    // phone validation
    if (formData.phone && !/^[0-9+\-\s()]{10,15}$/.test(formData.phone)) {
    newErrors.phone = 'Invalid phone number format (e.g., +254 7XX XXX XXX)';
    }

    // ID number validation (Kenyan ID: 8-9 digits)
    if (formData.idNumber && !/^[0-9]{8,9}$/.test(formData.idNumber)) {
    newErrors.idNumber = 'Invalid ID number format (8-9 digits)';
    }

    // KRA PIN validation (simplified: alphanumeric, 10-11 characters)
    if (formData.kraPin && !/^[A-Za-z0-9]{10,11}$/.test(formData.kraPin)) {
    newErrors.kraPin = 'Invalid KRA PIN format (10-11 alphanumeric characters)';
    }

    // Date of birth validation
    if (formData.dateOfBirth) {
    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 16 || age > 70) {
        newErrors.dateOfBirth = 'Age must be between 16 and 70 years';
    }
    }

    // Hire date validation
    if (formData.hireDate) {
    const hireDate = new Date(formData.hireDate);
    const today = new Date();
    if (hireDate > today) {
        newErrors.hireDate = 'Hire date cannot be in the future';
    }
    }

    // HELB loan validation
    if (formData.helbLoan && (isNaN(parseFloat(formData.helbLoan)) || parseFloat(formData.helbLoan) < 0)) {
    newErrors.helbLoan = 'HELB loan must be a valid number';
    }

    // Insurances JSON validation
    if (formData.insurances) {
    try {
        JSON.parse(formData.insurances);
    } catch {
        newErrors.insurances = 'Insurances must be valid JSON';
    }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
    toast.error('Please fix the errors in the form.');
    return;
    }

    setIsSubmitting(true);
    try {
    const submitData = {
        ...formData,
        helbLoan: formData.helbLoan ? parseFloat(formData.helbLoan) : 0,
        insurances: formData.insurances ? JSON.parse(formData.insurances) : null,
    };
    await onSubmit(submitData);
    toast.success(isEditing ? 'Employee updated successfully!' : 'Form submitted successfully!');
    onCancel();
    } catch (error) {
    console.error('Error submitting form:', error);
    setErrors({ form: 'Failed to submit form' });
    toast.error('Failed to submit form');
    } finally {
    setIsSubmitting(false);
    }
};

return (
    <div className="fixed inset-0 bg-[#1f435b]/90 bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-zinc-200">
        <h2 className="text-xl font-semibold text-zinc-800 tracking-tight">
            {isEditing ? 'Edit Employee' : 'Add New Employee'}
        </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Personal Information */}
            <div className="lg:col-span-3">
            <h3 className="text-lg font-medium text-zinc-800 tracking-tight mb-4">Personal Information</h3>
            </div>

            <div>
            <label className="block text-sm font-medium text-zinc-700 tracking-tight mb-1">
                Employee ID <span className="text-rose-500">*</span>
            </label>
            <input
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                className={`payroll-input placeholder:text-zinc-700/50 placeholder:text-sm placeholder:font-medium 
                    placeholder:tracking-tight ${errors.employeeId ? 'input-error' : ''}`}
                placeholder="Ex: EMP001"
            />
            {errors.employeeId && <p className="form-error">{errors.employeeId}</p>}
            </div>

            <div>
            <label className="block text-sm font-medium text-zinc-700 tracking-tight mb-1">
                First Name <span className="text-rose-500">*</span>
            </label>
            <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`payroll-input placeholder:text-zinc-700/50 placeholder:text-sm placeholder:font-medium 
                    placeholder:tracking-tight ${errors.firstName ? 'input-error' : ''}`}
                placeholder="First Name"
            />
            {errors.firstName && <p className="form-error">{errors.firstName}</p>}
            </div>

            <div>
            <label className="block text-sm font-medium text-zinc-700 tracking-tight mb-1">
                Last Name <span className="text-rose-500">*</span>
            </label>
            <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`payroll-input placeholder:text-zinc-700/50 placeholder:text-sm placeholder:font-medium 
                    placeholder:tracking-tight ${errors.lastName ? 'input-error' : ''}`}
                placeholder="Last Name"
            />
            {errors.lastName && <p className="form-error">{errors.lastName}</p>}
            </div>

            <div>
            <label className="block text-sm font-medium text-zinc-700 tracking-tight mb-1">
                ID Number
            </label>
            <input
                type="text"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleChange}
                className={`payroll-input placeholder:text-zinc-700/50 placeholder:text-sm placeholder:font-medium 
                    placeholder:tracking-tight ${errors.idNumber ? 'input-error' : ''}`}
                placeholder="Ex: 123456789"
            />
            {errors.idNumber && <p className="form-error">{errors.idNumber}</p>}
            </div>

            <div>
            <label className="block text-sm font-medium text-zinc-700 tracking-tight mb-1">
                KRA PIN
            </label>
            <input
                type="text"
                name="kraPin"
                value={formData.kraPin}
                onChange={handleChange}
                className={`payroll-input placeholder:text-zinc-700/50 placeholder:text-sm placeholder:font-medium 
                    placeholder:tracking-tight ${errors.kraPin ? 'input-error' : ''}`}
                placeholder="Ex: A123456789Z"
            />
            {errors.kraPin && <p className="form-error">{errors.kraPin}</p>}
            </div>

            <div>
            <label className="block text-sm font-medium text-zinc-700 tracking-tight mb-1">
                NSSF Number
            </label>
            <input
                type="text"
                name="nssfNumber"
                value={formData.nssfNumber}
                onChange={handleChange}
                className="payroll-input placeholder:text-zinc-700/50 placeholder:text-sm placeholder:font-medium 
                    placeholder:tracking-tight"
                placeholder="Ex: 1234567890"
            />
            </div>

            <div>
            <label className="block text-sm font-medium text-zinc-700 tracking-tight mb-1">
                Marital Status
            </label>
            <select
                name="maritalStatus"
                value={formData.maritalStatus}
                onChange={handleChange}
                className="payroll-input placeholder:text-zinc-700/50 placeholder:text-sm placeholder:font-medium 
                    placeholder:tracking-tight"
            >
                <option value="SINGLE">Single</option>
                <option value="MARRIED">Married</option>
                <option value="DIVORCED">Divorced</option>
                <option value="WIDOWED">Widowed</option>
            </select>
            </div>

            <div>
            <label className="block text-sm font-medium text-zinc-700 tracking-tight mb-1">
                Date of Birth
            </label>
            <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={`payroll-input ${errors.dateOfBirth ? 'input-error' : ''}`}
            />
            {errors.dateOfBirth && <p className="form-error">{errors.dateOfBirth}</p>}
            </div>

            <div>
            <label className="block text-sm font-medium text-zinc-700 tracking-tight mb-1">
                Phone Number
            </label>
            <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`payroll-input placeholder:text-zinc-700/50 placeholder:text-sm placeholder:font-medium 
                    placeholder:tracking-tight ${errors.phone ? 'input-error' : ''}`}
                placeholder="Ex: +254 7XX XXX XXX"
            />
            {errors.phone && <p className="form-error">{errors.phone}</p>}
            </div>

            <div>
            <label className="block text-sm font-medium text-zinc-700 tracking-tight mb-1">
                Email
            </label>
            <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`payroll-input placeholder:text-zinc-700/50 placeholder:text-sm placeholder:font-medium 
                    placeholder:tracking-tight ${errors.email ? 'input-error' : ''}`}
                placeholder="email@example.com"
            />
            {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-zinc-700 tracking-tight mb-1">
                Address
            </label>
            <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="payroll-input placeholder:text-zinc-700/50 placeholder:text-sm placeholder:font-medium 
                    placeholder:tracking-tight"
                placeholder="Full Address"
            />
            </div>

            {/* Professional Information */}
            <div className="lg:col-span-3 mt-6">
            <h3 className="text-lg font-medium text-zinc-800 tracking-tight mb-4">Professional Information</h3>
            </div>

            <div>
            <label className="block text-sm font-medium text-zinc-700 tracking-tight mb-1">
                Position <span className="text-rose-500">*</span>
            </label>
            <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className={`payroll-input placeholder:text-zinc-700/50 placeholder:text-sm placeholder:font-medium 
                    placeholder:tracking-tight ${errors.position ? 'input-error' : ''}`}
                placeholder="Ex: Developer, Accountant..."
            />
            {errors.position && <p className="form-error">{errors.position}</p>}
            </div>

            <div>
            <label className="block text-sm font-medium text-zinc-700 tracking-tight mb-1">
                Hire Date <span className="text-rose-500">*</span>
            </label>
            <input
                type="date"
                name="hireDate"
                value={formData.hireDate}
                onChange={handleChange}
                className={`payroll-input  ${errors.hireDate ? 'input-error' : ''}`}
            />
            {errors.hireDate && <p className="form-error">{errors.hireDate}</p>}
            </div>

            <div>
            <label className="block text-sm font-medium text-zinc-700 tracking-tight mb-1">
                Status
            </label>
            <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="payroll-input"
            >
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="RESIGNED">Resigned</option>
                <option value="TERMINATED">Terminated</option>
                <option value="RETIRED">Retired</option>
            </select>
            </div>

            <div>
            <label className="block text-sm font-medium text-zinc-700 tracking-tight mb-1">
                Number of Deductions
            </label>
            <input
                type="number"
                name="numberOfDeductions"
                value={formData.numberOfDeductions}
                onChange={handleChange}
                min="0"
                className="payroll-input"
            />
            </div>

            <div>
            <label className="block text-sm font-medium text-zinc-700 tracking-tight mb-1">
                Working Days per Month
            </label>
            <input
                type="number"
                name="numberOfDaysPerMonth"
                value={formData.numberOfDaysPerMonth}
                onChange={handleChange}
                min="1"
                max="31"
                className="payroll-input"
            />
            </div>

            {/* Salary Information */}
            <div className="lg:col-span-3 mt-6">
            <h3 className="text-lg font-medium text-zinc-800 tracking-tight mb-4">Salary Information</h3>
            </div>

            <div>
            <label className="block text-sm font-medium text-zinc-700 tracking-tight mb-1">
                Base Salary (KES) <span className="text-rose-500">*</span>
            </label>
            <input
                type="number"
                name="baseSalary"
                value={formData.baseSalary}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`payroll-input placeholder:text-zinc-700/50 placeholder:text-sm placeholder:font-medium 
                    placeholder:tracking-tight ${errors.baseSalary ? 'input-error' : ''}`}
                placeholder="0.00"
            />
            {errors.baseSalary && <p className="form-error">{errors.baseSalary}</p>}
            </div>

            <div>
            <label className="block text-sm font-medium text-zinc-700 tracking-tight mb-1">
                Housing Allowance (KES)
            </label>
            <input
                type="number"
                name="housingAllowance"
                value={formData.housingAllowance}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="payroll-input placeholder:text-zinc-700/50 placeholder:text-sm placeholder:font-medium 
                    placeholder:tracking-tight"
                placeholder="0.00"
            />
            </div>

            <div>
            <label className="block text-sm font-medium text-zinc-700 tracking-tight mb-1">
                Meal Allowance (KES)
            </label>
            <input
                type="number"
                name="mealAllowance"
                value={formData.mealAllowance}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="payroll-input placeholder:text-zinc-700/50 placeholder:text-sm placeholder:font-medium 
                    placeholder:tracking-tight"
                placeholder="0.00"
            />
            </div>

            <div>
            <label className="block text-sm font-medium text-zinc-700 tracking-tight mb-1">
                Transport Allowance (KES)
            </label>
            <input
                type="number"
                name="transportAllowance"
                value={formData.transportAllowance}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="payroll-input placeholder:text-zinc-700/50 placeholder:text-sm placeholder:font-medium 
                    placeholder:tracking-tight"
                placeholder="0.00"
            />
            </div>

            <div>
            <label className="block text-sm font-medium text-zinc-700 tracking-tight mb-1">
                Representation Allowance (KES)
            </label>
            <input
                type="number"
                name="representationAllowance"
                value={formData.representationAllowance}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="payroll-input placeholder:text-zinc-700/50 placeholder:text-sm placeholder:font-medium 
                    placeholder:tracking-tight"
                placeholder="0.00"
            />
            </div>

            <div>
            <label className="block text-sm font-medium text-zinc-700 tracking-tight mb-1">
                Gross Salary (KES)
            </label>
            <input
                type="text"
                value={grossSalary}
                className="payroll-input bg-gray-100"
                readOnly
            />
            <p className="text-xs text-zinc-500 mt-1">Calculated as sum of base salary and allowances</p>
            </div>

            <div>
            <label className="block text-sm font-medium text-zinc-700 tracking-tight mb-1">
                HELB Loan (KES)
            </label>
            <input
                type="number"
                name="helbLoan"
                value={formData.helbLoan}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`payroll-input placeholder:text-zinc-700/50 placeholder:text-sm placeholder:font-medium 
                    placeholder:tracking-tight ${errors.helbLoan ? 'input-error' : ''}`}
                placeholder="0.00"
            />
            {errors.helbLoan && <p className="form-error">{errors.helbLoan}</p>}
            </div>

            <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-zinc-700 tracking-tight mb-1">
                Insurances (JSON)
            </label>
            <textarea
                name="insurances"
                value={formData.insurances}
                onChange={handleChange}
                rows={3}
                className={`payroll-input placeholder:text-zinc-700/50 placeholder:text-sm placeholder:font-medium 
                    placeholder:tracking-tight ${errors.insurances ? 'input-error' : ''}`}
                placeholder='Ex: {"provider": "NHIF", "policyNumber": "12345"}'
            />
            {errors.insurances && <p className="form-error">{errors.insurances}</p>}
            <p className="text-xs text-zinc-500 mt-1">Enter insurance details as JSON (optional)</p>
            </div>

            {/* Kenyan Contributions */}
            <div className="lg:col-span-3 mt-6">
            <h3 className="text-lg font-medium text-zinc-800 tracking-tight mb-4">Kenyan Contributions (optional)</h3>
            <p className="text-sm text-zinc-600 w-[20vw] mb-4">
                Check the contributions to apply with standard rates. If unchecked, automatic calculations based on salary will be used.
            </p>
            </div>

            <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 border border-zinc-200 rounded-lg">
                <input
                    type="checkbox"
                    name="useNssfEmployee"
                    checked={formData.useNssfEmployee}
                    onChange={(e) => setFormData((prev) => ({ ...prev, useNssfEmployee: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-zinc-300 rounded"
                />
                <div className="flex-1">
                    <label className="text-sm font-medium text-zinc-700 tracking-tight">NSSF Contribution</label>
                    <p className="text-xs text-zinc-400 tracking-tight">6% of pensionable salary (capped)</p>
                </div>
                </div>

                <div className="flex items-center space-x-3 p-3 border border-zinc-200 rounded-lg">
                <input
                    type="checkbox"
                    name="useShifEmployee"
                    checked={formData.useShifEmployee}
                    onChange={(e) => setFormData((prev) => ({ ...prev, useShifEmployee: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-zinc-300 rounded"
                />
                <div className="flex-1">
                    <label className="text-sm font-medium text-zinc-700 tracking-tight">SHIF Contribution</label>
                    <p className="text-xs text-zinc-400 tracking-tight">2.75% of gross salary</p>
                </div>
                </div>

                <div className="flex items-center space-x-3 p-3 border border-zinc-200 rounded-lg">
                <input
                    type="checkbox"
                    name="useHousingLevy"
                    checked={formData.useHousingLevy}
                    onChange={(e) => setFormData((prev) => ({ ...prev, useHousingLevy: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-zinc-300 rounded"
                />
                <div className="flex-1">
                    <label className="text-sm font-medium text-zinc-700 tracking-tight">Housing Levy</label>
                    <p className="text-xs text-zinc-400 tracking-tight">1.5% of gross salary</p>
                </div>
                </div>
            </div>
            </div>

            {/* Banking Information */}
            <div className="lg:col-span-3 mt-6">
            <h3 className="text-lg font-medium text-zinc-800 tracking-tight mb-4">Banking Information</h3>
            </div>

            <div>
            <label className="block text-sm font-medium text-zinc-700 tracking-tight mb-1">
                Bank Account
            </label>
            <input
                type="text"
                name="bankAccount"
                value={formData.bankAccount}
                onChange={handleChange}
                className="payroll-input placeholder:text-zinc-700/50 placeholder:text-sm placeholder:font-medium 
                    placeholder:tracking-tight"
                placeholder="Bank Account Number"
            />
            </div>

            <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
                Bank Branch
            </label>
            <input
                type="text"
                name="bankBranch"
                value={formData.bankBranch}
                onChange={handleChange}
                className="payroll-input placeholder:text-zinc-700/50 placeholder:text-sm placeholder:font-medium 
                    placeholder:tracking-tight"
                placeholder="Bank Branch Name"
            />
            </div>

            {/* Credit Management Notice */}
            <div className="lg:col-span-3 mt-6">
            <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                <div className='w-8 h-8 p-1 rounded-full bg-white flex items-center justify-center mr-3'>
                <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">
                    Loan and Deduction Management
                    </h4>
                    <p className="text-sm text-blue-700 mb-3 w-[24vw]">
                    To assign an ongoing or upcoming loan to this employee, use the dedicated loan management section. Deductions will automatically appear in payslips until fully paid.
                    </p>
                    <Link
                    href="/credits"
                    >
                    <button className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium 
            rounded-md text-white bg-purple-600 hover:bg-purple-200 hover:text-zinc-700 transition-colors 
            duration-300 hover:cursor-pointer'>
                    Manage Loans
                    <ExternalLink className="w-4 h-4 ml-1" />
                    </button>
                    </Link>
                </div>
                </div>
            </div>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-zinc-200">
            <button
            type="button"
            onClick={onCancel}
            className="payroll-button-secondary"
            disabled={isSubmitting}
            >
            Cancel
            </button>
            <button
            type="submit"
            className="payroll-button"
            disabled={isSubmitting}
            >
            {isSubmitting ? (
                <>
                <span className="spinner mr-2"></span>
                {isEditing ? 'Updating...' : 'Adding...'}
                </>
            ) : (
                isEditing ? 'Update' : 'Add'
            )}
            </button>
        </div>
        </form>
    </div>
    </div>
);
}
