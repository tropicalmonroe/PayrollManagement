import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, User, FileText, Clock } from 'lucide-react';
import { BiMoneyWithdraw } from "react-icons/bi";

interface Employee {
id: string;
employeeId: string;
lastName: string;
firstName: string;
position: string;
}

interface Advance {
id: string;
employee: Employee;
amount: number;
advanceDate: Date;
reason: string;
numberOfInstallments: number;
installmentAmount: number;
remainingBalance: number;
status: 'IN_PROGRESS' | 'REPAID' | 'CANCELLED';
creationDate: Date;
createdBy: string;
fullRepaymentDate?: Date;
notes?: string;
createdAt: Date;
}

interface AddAdvanceModalProps {
isOpen: boolean;
onClose: () => void;
onSuccess: () => void;
employees: Employee[];
editAdvance?: Advance | null;
}

const AddAdvanceModal: React.FC<AddAdvanceModalProps> = ({
isOpen,
onClose,
onSuccess,
employees,
editAdvance = null
}) => {
const [formData, setFormData] = useState({
    employeeId: '',
    amount: '',
    advanceDate: '',
    reason: '',
    numberOfInstallments: '',
    notes: ''
});
const [loading, setLoading] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});

// Initialize form data when editing
useEffect(() => {
    if (editAdvance) {
    setFormData({
        employeeId: editAdvance.employee.id,
        amount: editAdvance.amount.toString(),
        advanceDate: new Date(editAdvance.advanceDate).toISOString().split('T')[0],
        reason: editAdvance.reason,
        numberOfInstallments: editAdvance.numberOfInstallments.toString(),
        notes: editAdvance.notes || ''
    });
    } else {
    // Reset form for new advance
    setFormData({
        employeeId: '',
        amount: '',
        advanceDate: new Date().toISOString().split('T')[0],
        reason: '',
        numberOfInstallments: '',
        notes: ''
    });
    }
    setErrors({});
}, [editAdvance, isOpen]);

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
    ...prev,
    [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
    setErrors(prev => ({
        ...prev,
        [name]: ''
    }));
    }
};

const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.employeeId) {
    newErrors.employeeId = 'Please select an employee';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
    newErrors.amount = 'Please enter a valid amount';
    }

    if (!formData.advanceDate) {
    newErrors.advanceDate = 'Please select a date';
    }

    if (!formData.reason.trim()) {
    newErrors.reason = 'Please enter a reason';
    }

    if (!formData.numberOfInstallments || parseInt(formData.numberOfInstallments) <= 0) {
    newErrors.numberOfInstallments = 'Please enter a valid number of installments';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
    return;
    }

    setLoading(true);
    
    try {
    const amount = parseFloat(formData.amount);
    const numberOfInstallments = parseInt(formData.numberOfInstallments);
    const installmentAmount = amount / numberOfInstallments;

    const advanceData = {
        employeeId: formData.employeeId,
        amount: amount,
        advanceDate: new Date(formData.advanceDate),
        reason: formData.reason.trim(),
        numberOfInstallments: numberOfInstallments,
        installmentAmount: installmentAmount,
        remainingBalance: amount, // Initially, the full amount is remaining
        notes: formData.notes.trim() || undefined
    };

    const url = editAdvance ? `/api/advances/${editAdvance.id}` : '/api/advances';
    const method = editAdvance ? 'PUT' : 'POST';

    const response = await fetch(url, {
        method: method,
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify(advanceData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error saving advance');
    }

    onSuccess();
    onClose();
    } catch (error: any) {
    console.error('Error saving advance:', error);
    setErrors({ submit: error.message });
    } finally {
    setLoading(false);
    }
};

const calculateInstallment = () => {
    const amount = parseFloat(formData.amount);
    const numberOfInstallments = parseInt(formData.numberOfInstallments);
    
    if (amount > 0 && numberOfInstallments > 0) {
    return (amount / numberOfInstallments).toFixed(2);
    }
    return '0.00';
};

const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return 'KSh 0.00';
    return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES'
    }).format(num);
};

if (!isOpen) return null;

return (
    <div className="fixed inset-0 bg-zinc-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-zinc-800 tracking-tight flex items-center">
            <BiMoneyWithdraw className="w-5 h-5 mr-2 text-[#0063b4]" />
            {editAdvance ? 'Edit Salary Advance' : 'New Salary Advance'}
            </h3>
            <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
            >
            <div className="flex items-center justify-center w-8 h-8 bg-rose-400 hover:bg-rose-700 
            cursor-pointer rounded-xl p-1 transition ease-in-out duration-300">
            <X className="w-6 h-6 text-red-50" />
            </div>
            </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee Selection */}
            <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Employee *
            </label>
            <select
                name="employeeId"
                value={formData.employeeId}
                onChange={handleInputChange}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm ${
                errors.employeeId ? 'border-red-300' : 'border-zinc-300'
                }`}
                disabled={!!editAdvance} // Disable when editing
            >
                <option value="">Select an employee</option>
                {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName} - {employee.employeeId} ({employee.position})
                </option>
                ))}
            </select>
            {errors.employeeId && (
                <p className="mt-1 text-sm text-rose-600">{errors.employeeId}</p>
            )}
            </div>

            {/* Amount and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Advance Amount (KES) *
                </label>
                <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className={`block placeholder:text-zinc-700 placeholder:text-sm placeholder:font-medium placeholder:tracking-tight w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm ${
                    errors.amount ? 'border-red-300' : 'border-zinc-300'
                }`}
                placeholder="0.00"
                />
                {errors.amount && (
                <p className="mt-1 text-sm text-rose-600">{errors.amount}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Advance Date *
                </label>
                <input
                type="date"
                name="advanceDate"
                value={formData.advanceDate}
                onChange={handleInputChange}
                className={`block placeholder:text-zinc-700 placeholder:text-sm placeholder:font-medium placeholder:tracking-tight w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm ${
                    errors.advanceDate ? 'border-red-300' : 'border-zinc-300'
                }`}
                />
                {errors.advanceDate && (
                <p className="mt-1 text-sm text-rose-600">{errors.advanceDate}</p>
                )}
            </div>
            </div>

            {/* Reason */}
            <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Advance Reason *
            </label>
            <input
                type="text"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                className={`block placeholder:text-zinc-700/50 placeholder:text-sm placeholder:font-medium placeholder:tracking-tight w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm ${
                errors.reason ? 'border-red-300' : 'border-zinc-300'
                }`}
                placeholder="Ex: Family emergency, medical expenses, etc."
            />
            {errors.reason && (
                <p className="mt-1 text-sm text-rose-600">{errors.reason}</p>
            )}
            </div>

            {/* Repayment Terms */}
            <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Number of Installments *
            </label>
            <input
                type="number"
                name="numberOfInstallments"
                value={formData.numberOfInstallments}
                onChange={handleInputChange}
                min="1"
                max="24"
                className={`block placeholder:text-zinc-700/50 placeholder:text-sm placeholder:font-medium placeholder:tracking-tight w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm ${
                errors.numberOfInstallments ? 'border-red-300' : 'border-zinc-300'
                }`}
                placeholder="Ex: 6"
            />
            {errors.numberOfInstallments && (
                <p className="mt-1 text-sm text-rose-600">{errors.numberOfInstallments}</p>
            )}
            <p className="mt-1 text-xs text-zinc-500">
                Maximum 24 installments
            </p>
            </div>

            {/* Calculated Monthly Payment */}
            {formData.amount && formData.numberOfInstallments && (
            <div className="bg-blue-100 border border-blue-200 rounded-md p-4">
                <div className="flex items-center">
                <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <BiMoneyWithdraw className="h-5 w-5 text-blue-400" />
                    </div>
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                    Calculated Installment
                    </h3>
                    <div className="mt-1 text-sm text-blue-700">
                    <span className="font-semibold text-lg">
                        {formatCurrency(calculateInstallment())}
                    </span>
                    <span className="ml-2 text-xs">
                        over {formData.numberOfInstallments} months
                    </span>
                    </div>
                </div>
                </div>
            </div>
            )}

            {/* Notes */}
            <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
                Notes (optional)
            </label>
            <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="block placeholder:text-zinc-700/50 placeholder:text-sm placeholder:font-medium placeholder:tracking-tight w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm"
                placeholder="Additional information..."
            />
            </div>

            {/* Submit Error */}
            {errors.submit && (
            <div className="bg-rose-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                <div className="flex-shrink-0">
                    <X className="h-5 w-5 text-rose-400" />
                </div>
                <div className="ml-3">
                    <p className="text-sm text-rose-800">{errors.submit}</p>
                </div>
                </div>
            </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-zinc-200">
            <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-zinc-300 rounded-md shadow-sm text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0063b4]"
            >
                Cancel
            </button>
            <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0063b4] hover:bg-[#0052a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0063b4] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                </div>
                ) : (
                editAdvance ? 'Edit Advance' : 'Create Advance'
                )}
            </button>
            </div>
        </form>
        </div>
    </div>
    </div>
);
};

export default AddAdvanceModal;