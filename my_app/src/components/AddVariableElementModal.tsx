import React, { useState, useEffect } from 'react';
import { Employee, VariableElement } from '@prisma/client';
import { X, Calendar, Clock, DollarSign, FileText, AlertCircle } from 'lucide-react';

interface VariableElementWithEmployee extends VariableElement {
employee: {
    id: string;
    employeeId: string;
    lastName: string;
    firstName: string;
    position: string;
};
}

interface AddVariableElementModalProps {
isOpen: boolean;
onClose: () => void;
onSuccess: () => void;
employees: Employee[];
editElement?: VariableElementWithEmployee | null;
defaultMonth?: string;
defaultYear?: string;
}

export default function AddVariableElementModal({
isOpen,
onClose,
onSuccess,
employees,
editElement,
defaultMonth = '',
defaultYear = ''
}: AddVariableElementModalProps) {
const [formData, setFormData] = useState({
    employeeId: '',
    type: '',
    description: '',
    amount: '',
    hours: '',
    rate: '',
    date: '',
    month: defaultMonth,
    year: defaultYear
});
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// Initialize form with data for editing or reset for new element
useEffect(() => {
    if (editElement) {
    setFormData({
        employeeId: editElement.employeeId,
        type: editElement.type,
        description: editElement.description,
        amount: editElement.amount.toString(),
        hours: editElement.hours?.toString() || '',
        rate: editElement.rate?.toString() || '',
        date: new Date(editElement.date).toISOString().split('T')[0],
        month: editElement.month,
        year: editElement.year
    });
    } else {
    // Reset for new element
    const today = new Date();
    setFormData({
        employeeId: '',
        type: '',
        description: '',
        amount: '',
        hours: '',
        rate: '',
        date: today.toISOString().split('T')[0],
        month: defaultMonth || (today.getMonth() + 1).toString().padStart(2, '0'),
        year: defaultYear || today.getFullYear().toString()
    });
    }
    setError(null);
}, [editElement, defaultMonth, defaultYear, isOpen]);

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
    ...prev,
    [name]: value
    }));

    // Automatically calculate amount for overtime
    if (formData.type === 'OVERTIME') {
    if (name === 'hours' || name === 'rate') {
        const hours = name === 'hours' ? parseFloat(value) || 0 : parseFloat(formData.hours) || 0;
        const rate = name === 'rate' ? parseFloat(value) || 0 : parseFloat(formData.rate) || 0;
        const calculatedAmount = hours * rate;
        
        setFormData(prev => ({
        ...prev,
        [name]: value,
        amount: calculatedAmount.toString()
        }));
    }
    }
};

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
    // Validation
    if (!formData.employeeId || !formData.type || !formData.description || !formData.date || !formData.month || !formData.year) {
        throw new Error('All required fields must be filled');
    }

    if (formData.type === 'OVERTIME') {
        if (!formData.hours || !formData.rate) {
        throw new Error('Hours and rate are required for overtime');
        }
    } else {
        if (!formData.amount) {
        throw new Error('Amount is required for this element type');
        }
    }

    const url = editElement 
        ? `/api/variable-elements/${editElement.id}`
        : '/api/variable-elements';
    
    const method = editElement ? 'PUT' : 'POST';

    const response = await fetch(url, {
        method,
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        employeeId: formData.employeeId,
        type: formData.type,
        description: formData.description.trim(),
        amount: formData.amount ? parseFloat(formData.amount) : 0,
        hours: formData.hours ? parseFloat(formData.hours) : null,
        rate: formData.rate ? parseFloat(formData.rate) : null,
        date: formData.date,
        month: formData.month,
        year: formData.year
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error during saving');
    }

    onSuccess();
    } catch (error) {
    console.error('Error:', error);
    setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
    setLoading(false);
    }
};

const elementTypes = [
    { value: 'OVERTIME', label: 'Overtime', icon: <Clock className="w-4 h-4" /> },
    { value: 'ABSENCE', label: 'Absence', icon: <AlertCircle className="w-4 h-4" /> },
    { value: 'BONUS', label: 'Bonus', icon: <DollarSign className="w-4 h-4" /> },
    { value: 'LEAVE', label: 'Leave', icon: <Calendar className="w-4 h-4" /> },
    { value: 'LATE', label: 'Late', icon: <Clock className="w-4 h-4" /> },
    { value: 'ADVANCE', label: 'Advance', icon: <DollarSign className="w-4 h-4" /> },
    { value: 'OTHER', label: 'Other', icon: <FileText className="w-4 h-4" /> }
];

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
    { value: '12', label: 'December' }
];

const years = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - 5 + i;
    return year.toString();
});

if (!isOpen) return null;

return (
    <div className="fixed inset-0 bg-zinc-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-zinc-900">
            {editElement ? 'Edit Variable Element' : 'Add Variable Element'} {/* Translated Ajouter/Modifier l'élément variable */}
        </h3>
        <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600"
        >
        <div className="flex items-center justify-center w-8 h-8 bg-rose-400 hover:bg-rose-700 
        cursor-pointer rounded-xl p-1 transition ease-in-out duration-300">
        <X className="w-6 h-6 text-red-50" />
        </div>
        </button>
        </div>

        

        {error && (
        <div className="mb-4 p-4 bg-rose-50 border border-red-200 rounded-md">
            <p className="text-sm text-rose-600">{error}</p>
        </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
        {/* Employee */}
        <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
            Employee * {/* Translated Employé * */}
            </label>
            <select
            name="employeeId"
            value={formData.employeeId}
            onChange={handleInputChange}
            required
            className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm"
            >
            <option value="">Select an employee</option> {/* Translated Sélectionner un employé */}
            {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                {employee.firstName} {employee.lastName} - {employee.employeeId}
                </option>
            ))}
            </select>
        </div>

        {/* Element Type */}
        <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
            Element Type * {/* Translated Type d'élément * */}
            </label>
            <select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            required
            className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm"
            >
            <option value="">Select a type</option> {/* Translated Sélectionner un type */}
            {elementTypes.map((type) => (
                <option key={type.value} value={type.value}>
                {type.label}
                </option>
            ))}
            </select>
        </div>

        {/* Description */}
        <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
            Description * {/* Translated Description * */}
            </label>
            <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            rows={3}
            className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm"
            placeholder="Detailed description of the variable element" 
            />
        </div>

        {/* Period */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
                Month * {/* Translated Mois * */}
            </label>
            <select
                name="month"
                value={formData.month}
                onChange={handleInputChange}
                required
                className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm"
            >
                {months.map((month) => (
                <option key={month.value} value={month.value}>
                    {month.label}
                </option>
                ))}
            </select>
            </div>

            <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
                Year * {/* Translated Année * */}
            </label>
            <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                required
                className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm"
            >
                {years.map((year) => (
                <option key={year} value={year}>
                    {year}
                </option>
                ))}
            </select>
            </div>
        </div>

        {/* Date */}
        <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
            Date * {/* Translated Date * */}
            </label>
            <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            required
            className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm"
            />
        </div>

        {/* Overtime-specific fields */}
        {formData.type === 'OVERTIME' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                Number of Hours * {/* Translated Nombre d'heures * */}
                </label>
                <input
                type="number"
                name="hours"
                value={formData.hours}
                onChange={handleInputChange}
                step="0.5"
                min="0"
                required
                className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm"
                placeholder="Ex: 8"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                Hourly Rate (KES) * {/* Translated Taux horaire (MAD) * */}
                </label>
                <input
                type="number"
                name="rate"
                value={formData.rate}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                required
                className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm"
                placeholder="Ex: 50.00"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                Total Amount (KES) {/* Translated Montant total (MAD) */}
                </label>
                <input
                type="number"
                name="amount"
                value={formData.amount}
                readOnly
                className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm bg-zinc-50 sm:text-sm"
                placeholder="Calculated automatically"
                />
            </div>
            </div>
        ) : (
            /* Amount for other types */
            <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
                Amount (KES) * {/* Translated Montant (MAD) * */}
            </label>
            <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                required
                className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm"
                placeholder="Ex: 1000.00"
            />
            </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4">
            <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-zinc-300 rounded-md shadow-sm text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0063b4]"
            >
            Cancel {/* Translated Annuler */}
            </button>
            <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0063b4] hover:bg-[#0052a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0063b4] disabled:opacity-50 disabled:cursor-not-allowed"
            >
            {loading ? 'Saving...' : (editElement ? 'Edit' : 'Add')} {/* Translated Enregistrement... / Modifier / Ajouter */}
            </button>
        </div>
        </form>
    </div>
    </div>
);
}