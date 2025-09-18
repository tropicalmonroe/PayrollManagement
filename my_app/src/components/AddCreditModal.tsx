import React, { useState, useEffect } from 'react';
import { X, CreditCard, Building, Calendar, DollarSign } from 'lucide-react';
import { Advance } from '@prisma/client';

interface Employee {
id: string;
employeeId: string;
lastName: string;
firstName: string;
position: string;   
bankAccount?: string;
bankBranch?: string;  
}

interface Loan { 
id: string;
employee: Employee;
type: 'HOUSING' | 'CONSUMER';
loanAmount: number;
monthlyPayment: number; 
startDate: Date;
endDate: Date; 
remainingBalance: number; 
amountRepaid: number; 
status: 'ACTIVE' | 'PAID_OFF' | 'SUSPENDED'; 
bank: string;
notes?: string;
createdAt: Date;
}

interface AddLoanModalProps { // 'AddCreditModalProps' translated
isOpen: boolean;
onClose: () => void;
onSuccess: () => void;
employees: Employee[];
advances: Advance[];
editLoan?: Loan;
}

const AddCreditModal: React.FC<AddLoanModalProps> = ({ // Component name translated
isOpen,
onClose,
onSuccess,
employees,
editLoan                  // 'editCredit' translated
}) => {
const [formData, setFormData] = useState({
    employeeId: '',
    type: 'HOUSING' as 'HOUSING' | 'CONSUMER', // Default type translated
    monthlyAmount: '',      // 'montantMensuel' translated
    startDate: '',          // 'dateDebut' translated
    bank: '',               // 'banque' translated
    notes: ''
});

const [loading, setLoading] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});

// Reset form when modal opens/closes or populate with edit data
useEffect(() => {
    if (!isOpen) {
    setFormData({
        employeeId: '',
        type: 'HOUSING',
        monthlyAmount: '',
        startDate: '',
        bank: '',
        notes: ''
    });
    setErrors({});
    } else if (editLoan) {
    // Pre-fill the form with the loan data to be edited
    setFormData({
        employeeId: editLoan.employee.id,
        type: editLoan.type,
        monthlyAmount: editLoan.monthlyPayment.toString(),
        startDate: new Date(editLoan.startDate).toISOString().split('T')[0],
        bank: editLoan.bank,
        notes: editLoan.notes || ''
    });
    }
}, [isOpen, editLoan]);

// Comprehensive Kenyan bank identification function
function identifyBank(account: string): string {
    if (!account || typeof account !== 'string' || account.length < 2) {
        return 'Invalid account number';
    }

    const prefix = account.substring(0, 2).padStart(2, '0'); // Ensure 2 digits
    let bankName = 'Bank not identified';

    // Comprehensive mapping of bank codes to names (all major banks in Kenya, 2025)
    const bankMap: { [key: string]: string } = {
        '01': 'Kenya Commercial Bank (KCB)',
        '02': 'National Bank of Kenya (NBK)',
        '03': 'Absa Bank Kenya',
        '04': 'Standard Chartered Bank Kenya',
        '05': 'Co-operative Bank of Kenya',
        '06': 'Family Bank',
        '07': 'Gulf African Bank',
        '08': 'NCBA Bank Kenya (Commercial Bank of Africa)',
        '11': 'I&M Bank',
        '12': 'Diamond Trust Bank (DTB) Kenya',
        '13': 'Consolidated Bank of Kenya',
        '14': 'Development Bank of Kenya',
        '15': 'NCBA Bank Kenya (NIC Bank)',
        '16': 'Middle East Bank Kenya',
        '17': 'Dubai Islamic Bank Kenya',
        '18': 'First Community Bank',
        '19': 'Bank of Africa Kenya',
        '20': 'Ecobank Kenya',
        '21': 'Credit Bank',
        '22': 'United Bank for Africa (UBA) Kenya',
        '23': 'Guaranty Trust Bank (GTBank) Kenya',
        '24': 'Paramount Universal Bank',
        '25': 'Prime Bank',
        '26': 'Access Bank Kenya',
        '27': 'Kingdom Bank',
        '28': 'HF Group (Housing Finance)',
        '29': 'Stanbic Bank Kenya',
        '30': 'Trans-National Bank',
        '31': 'Victoria Commercial Bank',
        '32': 'Charterhouse Bank',
        '33': 'Imperial Bank (Legacy/Defunct)',
        '34': 'Kingdom Bank (Jamii Bora)',
        '35': 'African Banking Corporation',
        '52': 'Habib Bank AG Zurich',
        '53': 'Fidelity Commercial Bank',
        '55': 'Bank of Baroda (Kenya)',
        '56': 'Bank of India (Kenya)',
        '57': 'Consolidated Finance Bank',
        '62': 'Giro Commercial Bank',
        '63': 'Equity Bank Kenya',
        '64': 'Faulu Microfinance Bank',
        '65': 'Kenya Women Microfinance Bank',
        '66': 'SME Bank of Kenya',
        '67': 'Maisha Microfinance Bank',
        '68': 'United Bank for Africa (UBA) Kenya',
        '69': 'Dubai Islamic Bank (DIB) Kenya',
        '70': 'Commercial International Bank (CIB) Kenya',
        '71': 'M-Oriental Bank Kenya',
        '72': 'Premier Bank Kenya'
    };

    bankName = bankMap[prefix] || `Other Kenyan Bank (Prefix: ${prefix} - Verify with CBK)`;
    return bankName;
}

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // If an employee is selected, pre-fill bank information
    if (name === 'employeeId' && value) {
        const selectedEmployee = employees.find(emp => emp.id === value);
        if (selectedEmployee) {
            // Extract bank name from bank account or branch
            let bankName = '';
            if (selectedEmployee.bankBranch) {
                bankName = selectedEmployee.bankBranch;
            } else if (selectedEmployee.bankAccount) {
                // For Kenyan context, infer bank from account number patterns
                const account = selectedEmployee.bankAccount.replace(/\s/g, ''); // Remove spaces
                bankName = identifyBank(account); // Use comprehensive bank identification
            }

            setFormData(prev => ({
                ...prev,
                [name]: value,
                bank: bankName
            }));
        }
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
    }
};
const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.employeeId) newErrors.employeeId = 'Please select an employee';
    if (!formData.monthlyAmount) newErrors.monthlyAmount = 'Monthly amount is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.bank) newErrors.bank = 'Bank is required';

    // Validate numeric values
    if (formData.monthlyAmount && parseFloat(formData.monthlyAmount) <= 0) {
    newErrors.monthlyAmount = 'Amount must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
    const url = editLoan ? `/api/credits/${editLoan.id}` : '/api/credits'; // Adjusted endpoint
    const method = editLoan ? 'PUT' : 'POST';
    
    // Calculate default values for compatibility
    const monthlyAmount = parseFloat(formData.monthlyAmount);
    const loanAmount = monthlyAmount * 12; // Default 1 year estimation
    const startDate = new Date(formData.startDate);
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1); // 1 year default
    
    const response = await fetch(url, {
        method,
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        employeeId: formData.employeeId,
        type: formData.type,
        loanAmount: loanAmount,
        interestRate: 0, // No interest calculation
        durationYears: 1, // 1 year default
        monthlyPayment: monthlyAmount,
        startDate: formData.startDate,
        endDate: endDate,
        remainingBalance: loanAmount,
        amountRepaid: 0,
        status: 'ACTIVE',
        bank: formData.bank,
        accountNumber: '',
        creationDate: new Date(),
        createdBy: 'admin',
        notes: formData.notes,
        interestPaid: 0,
        remainingPrincipal: loanAmount,
        insuranceRate: 0
        }),
    });

    if (response.ok) {
        onSuccess();
        onClose();
    } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || `Error during ${editLoan ? 'loan modification' : 'loan creation'}` });
    }
    } catch (error) {
    setErrors({ submit: 'Connection error' });
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
            <CreditCard className="w-6 h-6 text-[#0063b4] mr-3" />
            <h2 className="text-xl font-semibold text-zinc-900">
            {editLoan ? 'Edit Loan' : 'New Simple Loan'}
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
        {/* Employee Selection */}
        <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
            Employee *
            </label>
            <select
            name="employeeId"
            value={formData.employeeId}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent ${
                errors.employeeId ? 'border-red-500' : 'border-zinc-300'
            }`}
            >
            <option value="">Select an employee</option>
            {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                {employee.employeeId} - {employee.firstName} {employee.lastName}
                </option>
            ))}
            </select>
            {errors.employeeId && <p className="mt-1 text-sm text-red-600">{errors.employeeId}</p>}
        </div>

        {/* Loan Type */}
        <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
            Loan type *
            </label>
            <select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent"
            >
            <option value="HOUSING">Housing Loan</option>
            <option value="CONSUMER">Consumer Loan</option>
            </select>
        </div>

        {/* Monthly amount */}
        <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
            Monthly deduction amount (KES) *
            </label>
            <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <input
                type="number"
                name="monthlyAmount"
                value={formData.monthlyAmount}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent ${
                errors.monthlyAmount ? 'border-red-500' : 'border-zinc-300'
                }`}
                placeholder="Ex: 5000.00"
            />
            </div>
            {errors.monthlyAmount && <p className="mt-1 text-sm text-red-600">{errors.monthlyAmount}</p>}
            <p className="mt-1 text-xs text-zinc-500">
            Amount that will be deducted each month from salary
            </p>
        </div>

        {/* Start date */}
        <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
            Start date *
            </label>
            <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent ${
                errors.startDate ? 'border-red-500' : 'border-zinc-300'
                }`}
            />
            </div>
            {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
        </div>

        {/* Bank */}
        <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
            Bank *
            </label>
            <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <input
                type="text"
                name="bank"
                value={formData.bank}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent ${
                errors.bank ? 'border-red-500' : 'border-zinc-300'
                }`}
                placeholder="Ex: Equity Bank"
            />
            </div>
            {errors.bank && <p className="mt-1 text-sm text-red-600">{errors.bank}</p>}
        </div>

        {/* Notes */}
        <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
            Notes (optional)
            </label>
            <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent"
            placeholder="Additional information about the loan..."
            />
        </div>

        {/* Error Message */}
        {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
        )}

        {/* Actions */}
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
            {loading 
                ? (editLoan ? 'Updating...' : 'Creating...') 
                : (editLoan ? 'Update loan' : 'Create loan')
            }
            </button>
        </div>
        </form>
    </div>
    </div>
);
};

export default AddCreditModal;