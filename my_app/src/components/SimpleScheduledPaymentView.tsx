import React, { useState, useEffect } from 'react';
import {
Calendar,
CheckCircle,
Clock,
AlertTriangle,
DollarSign,
Calculator,
TrendingUp,
FileText,
CreditCard,
Banknote,
} from 'lucide-react';

interface SimpleInstallment {
installmentNumber: number;
dueDate: Date;
totalMonthlyPayment: number;
principal: number;
interestBeforeTax: number;
interestTax: number;
insurance: number;
remainingBalance: number;
status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
}

interface ScheduleStats {
totalInstallments: number;
paidInstallments: number;
overdueInstallments: number;
totalAmountPaid: number;
totalAmountRemaining: number;
nextPayment?: SimpleInstallment;
progressPercentage: number;
}

interface SimpleLoanScheduleViewProps {
creditId: string;
employeeId: string;
isOpen: boolean;
onClose: () => void;
onGenerateSchedule?: () => void;
}

const SimpleLoanScheduleView: React.FC<SimpleLoanScheduleViewProps> = ({
creditId,
employeeId,
isOpen,
onClose,
onGenerateSchedule,
}) => {
const [installments, setInstallments] = useState<SimpleInstallment[]>([]);
const [stats, setStats] = useState<ScheduleStats | null>(null);
const [loading, setLoading] = useState(true);
const [generating, setGenerating] = useState(false);
const [payrollCalculating, setPayrollCalculating] = useState(false);

useEffect(() => {
    if (isOpen && creditId) {
    fetchSchedule();
    }
}, [isOpen, creditId]);

const fetchSchedule = async () => {
    try {
    setLoading(true);
    const response = await fetch(`/api/credits/${creditId}/echeancier`);
    if (response.ok) {
        const data = await response.json();
        setInstallments(data.echeancier || []); // API field name unchanged
        setStats(data.stats);
    } else if (response.status === 404) {
        // Schedule does not exist yet
        setInstallments([]);
        setStats(null);
    }
    } catch (error) {
    console.error('Error loading loan schedule:', error);
    } finally {
    setLoading(false);
    }
};

const handleGenerateSchedule = async () => {
    try {
    setGenerating(true);
    const response = await fetch('/api/credits/generate-echeancier', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({ creditId }),
    });

    if (response.ok) {
        const data = await response.json();
        alert(`Loan schedule generated successfully! ${data.totalEcheances} installments created.`);
        await fetchSchedule(); // Reload data
        if (onGenerateSchedule) {
        onGenerateSchedule();
        }
    } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
    }
    } catch (error) {
    console.error('Error generating schedule:', error);
    alert('Error generating loan schedule');
    } finally {
    setGenerating(false);
    }
};

const handleCalculatePayroll = async () => {
    try {
    setPayrollCalculating(true);
    const currentDate = new Date();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const year = currentDate.getFullYear().toString();

    const response = await fetch('/api/payroll/calculate-with-credits', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        employeeId,
        month,
        year,
        }),
    });

    if (response.ok) {
        const data = await response.json();
        alert(`Payroll calculated successfully! Net salary: ${formatCurrency(data.resume.netSalaryPayable)}`);
    } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
    }
    } catch (error) {
    console.error('Error calculating payroll:', error);
    alert('Error calculating payroll');
    } finally {
    setPayrollCalculating(false);
    }
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    }).format(amount);
};

const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    }).format(new Date(date));
};

const getStatusBadge = (status: string, dueDate: Date) => {
    const now = new Date();
    const dueDateObj = new Date(dueDate);

    let color = '';
    let icon = Clock;
    let text = '';

    if (status === 'PAID') {
    color = 'bg-green-100 text-green-800';
    icon = CheckCircle;
    text = 'Paid';
    } else if (status === 'PENDING' && dueDateObj < now) {
    color = 'bg-red-100 text-red-800';
    icon = AlertTriangle;
    text = 'Overdue';
    } else if (status === 'PENDING') {
    color = 'bg-yellow-100 text-yellow-800';
    icon = Clock;
    text = 'Pending';
    } else if (status === 'CANCELLED') {
    color = 'bg-zinc-100 text-zinc-800';
    icon = Clock;
    text = 'Cancelled';
    }

    const Icon = icon;

    return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {text}
    </span>
    );
};

if (!isOpen) return null;

return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200">
        <div className="flex items-center">
            <Calendar className="w-6 h-6 text-[#0063b4] mr-3" />
            <h2 className="text-xl font-semibold text-zinc-900">
            Simple Loan Repayment Schedule
            </h2>
        </div>
        <div className="flex items-center space-x-3">
            {installments.length === 0 && (
            <button
                onClick={handleGenerateSchedule}
                disabled={generating}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
            >
                {generating ? (
                <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                </div>
                ) : (
                <div className="flex items-center">
                    <Calculator className="w-4 h-4 mr-2" />
                    Generate Schedule
                </div>
                )}
            </button>
            )}
            {installments.length > 0 && (
            <button
                onClick={handleCalculatePayroll}
                disabled={payrollCalculating}
                className="px-4 py-2 text-sm font-medium text-white bg-[#0063b4] border border-transparent rounded-md hover:bg-[#0052a3] disabled:opacity-50"
            >
                {payrollCalculating ? (
                <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Calculating...
                </div>
                ) : (
                <div className="flex items-center">
                    <Banknote className="w-4 h-4 mr-2" />
                    Calculate Payroll
                </div>
                )}
            </button>
            )}
            <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
            >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            </button>
        </div>
        </div>

        {loading ? (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0063b4]"></div>
        </div>
        ) : installments.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <FileText className="w-12 h-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Schedule Found</h3>
            <p className="text-sm text-center mb-4">
            Click "Generate Schedule" to automatically create<br />
            the repayment schedule for this loan with payroll integration.
            </p>
        </div>
        ) : (
        <div className="flex flex-col h-full">
            {/* Stats Cards */}
            {stats && (
            <div className="p-6 border-b border-zinc-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                    <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
                    <div>
                        <p className="text-sm text-blue-600 font-medium">Total Installments</p>
                        <p className="text-lg font-bold text-blue-800">{stats.totalInstallments}</p>
                    </div>
                    </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <div>
                        <p className="text-sm text-green-600 font-medium">Paid</p>
                        <p className="text-lg font-bold text-green-800">{stats.paidInstallments}</p>
                    </div>
                    </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                    <div>
                        <p className="text-sm text-red-600 font-medium">Overdue</p>
                        <p className="text-lg font-bold text-red-800">{stats.overdueInstallments}</p>
                    </div>
                    </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center">
                    <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
                    <div>
                        <p className="text-sm text-purple-600 font-medium">Progress</p>
                        <p className="text-lg font-bold text-purple-800">{stats.progressPercentage}%</p>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            )}

            {/* Installments Table */}
            <div className="flex-1 overflow-auto p-6">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50 sticky top-0">
                    <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        No.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Due Date
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Total Monthly Payment
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Principal
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Interest (Excl. Tax)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Tax
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Insurance
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Remaining Balance
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Status
                    </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-zinc-200">
                    {installments.map((installment) => (
                    <tr key={installment.installmentNumber} className="hover:bg-zinc-50">
                        <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                        {installment.installmentNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-900">
                        {formatDate(installment.dueDate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-900 text-right font-medium">
                        {formatCurrency(installment.totalMonthlyPayment)}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-900 text-right">
                        {formatCurrency(installment.principal)}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-900 text-right">
                        {formatCurrency(installment.interestBeforeTax)}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-900 text-right">
                        {formatCurrency(installment.interestTax)}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-900 text-right">
                        {formatCurrency(installment.insurance)}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-900 text-right">
                        {formatCurrency(installment.remainingBalance)}
                        </td>
                        <td className="px-4 py-3 text-center">
                        {getStatusBadge(installment.status, installment.dueDate)}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            </div>
        </div>
        )}
    </div>
    </div>
);
};

export default SimpleLoanScheduleView;