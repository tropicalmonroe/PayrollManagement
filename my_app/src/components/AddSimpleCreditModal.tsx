import React, { useState } from 'react';
import { X, Plus, Calendar, DollarSign } from 'lucide-react';

interface AddSimpleLoanModalProps {
isOpen: boolean;
onClose: () => void;
employeeId: string;
onLoanAdded: () => void;
}

const AddSimpleCreditModal: React.FC<AddSimpleLoanModalProps> = ({
isOpen,
onClose,
employeeId,
onLoanAdded,
}) => {
const [formData, setFormData] = useState({
    type: 'HOUSING' as 'HOUSING' | 'CONSUMER',
    monthlyAmount: '',
    numberOfInstallments: '',
    startDate: '',
    bank: '',
    description: '',
});
const [loading, setLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.monthlyAmount || !formData.numberOfInstallments || !formData.startDate || !formData.bank) {
    alert('Please fill in all required fields');
    return;
    }

    try {
    setLoading(true);

    // Calculate total amount
    const totalAmount = parseFloat(formData.monthlyAmount) * parseInt(formData.numberOfInstallments);

    // Create the loan
    const loanResponse = await fetch('/api/credits', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        employeeId,
        type: formData.type,
        totalAmount,
        interestRate: 0, // No interest calculations
        durationYears: Math.ceil(parseInt(formData.numberOfInstallments) / 12),
        monthlyAmount: parseFloat(formData.monthlyAmount),
        startDate: formData.startDate,
        endDate: new Date(new Date(formData.startDate).setMonth(
            new Date(formData.startDate).getMonth() + parseInt(formData.numberOfInstallments)
        )),
        remainingBalance: totalAmount,
        amountPaid: 0,
        status: 'ACTIVE',
        bank: formData.bank,
        accountNumber: '',
        dateCreated: new Date(),
        createdBy: 'admin',
        notes: formData.description,
        paidInterest: 0,
        remainingCapital: totalAmount,
        insuranceRate: 0,
        }),
    });

    if (!loanResponse.ok) {
        const error = await loanResponse.json();
        throw new Error(error.error || 'Error creating loan');
    }

    const loan = await loanResponse.json();

    // Generate simple repayment schedule
    const scheduleResponse = await fetch('/api/credits/generate-simple-echeancier', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        loanId: loan.id,
        monthlyAmount: parseFloat(formData.monthlyAmount),
        numberOfInstallments: parseInt(formData.numberOfInstallments),
        startDate: formData.startDate,
        }),
    });

    if (scheduleResponse.ok) {
        alert('Loan and repayment schedule created successfully!');
        onLoanAdded();
        onClose();
        setFormData({
        type: 'HOUSING',
        monthlyAmount: '',
        numberOfInstallments: '',
        startDate: '',
        bank: '',
        description: '',
        });
    } else {
        alert('Loan created but error generating repayment schedule');
    }
    } catch (error) {
    console.error('Error:', error);
    alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
    setLoading(false);
    }
};

if (!isOpen) return null;

return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200">
        <div className="flex items-center">
            <Plus className="w-6 h-6 text-[#0063b4] mr-3" />
            <h2 className="text-xl font-semibold text-zinc-900">
            New Simple Loan
            </h2>
        </div>
        <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
        >
            <X className="w-6 h-6" />
        </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Loan Type */}
        <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
            Loan Type *
            </label>
            <select
            value={formData.type}
            onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as 'HOUSING' | 'CONSUMER' }))}
            className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent"
            required
            >
            <option value="MORTGAGE">Mortgage Loan</option>
            <option value="CONSUMER">Consumer Loan</option>
            </select>
        </div>

        {/* Monthly Amount */}
        <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
            Monthly Amount (KES) *
            </label>
            <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <input
                type="number"
                step="0.01"
                value={formData.monthlyAmount}
                onChange={(e) => setFormData((prev) => ({ ...prev, monthlyAmount: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent"
                placeholder="Ex: 5000"
                required
            />
            </div>
        </div>

        {/* Number of Installments */}
        <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
            Number of Installments *
            </label>
            <input
            type="number"
            min="1"
            value={formData.numberOfInstallments}
            onChange={(e) => setFormData((prev) => ({ ...prev, numberOfInstallments: e.target.value }))}
            className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent"
            placeholder="Ex: 24"
            required
            />
        </div>

        {/* Start Date */}
        <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
            Start Date *
            </label>
            <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent"
                required
            />
            </div>
        </div>

        {/* Bank */}
        <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
            Bank *
            </label>
            <input
            type="text"
            value={formData.bank}
            onChange={(e) => setFormData((prev) => ({ ...prev, bank: e.target.value }))}
            className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent"
            placeholder="Ex: KCB Bank"
            required
            />
        </div>

        {/* Description */}
        <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
            Description (optional)
            </label>
            <textarea
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent"
            placeholder="Notes about the loan..."
            />
        </div>

        {/* Summary */}
        {formData.monthlyAmount && formData.numberOfInstallments && (
            <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Summary:</h4>
            <p className="text-sm text-blue-700">
                Total Amount: {(parseFloat(formData.monthlyAmount || '0') * parseInt(formData.numberOfInstallments || '0')).toLocaleString('en-KE')} KES
            </p>
            <p className="text-sm text-blue-700">
                Duration: {Math.ceil(parseInt(formData.numberOfInstallments || '0') / 12)} year(s)
            </p>
            </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
            <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
            >
            Cancel
            </button>
            <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0063b4] border border-transparent rounded-md hover:bg-[#0052a3] disabled:opacity-50"
            >
            {loading ? (
                <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
                </div>
            ) : (
                'Create Loan'
            )}
            </button>
        </div>
        </form>
    </div>
    </div>
);
};

export default AddSimpleCreditModal;