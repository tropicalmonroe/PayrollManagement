"use client";

import React, { useState, useEffect } from 'react';
import { 
Calendar, 
CheckCircle, 
Clock, 
AlertTriangle, 
DollarSign,
Eye,
CreditCard,
TrendingUp,
} from 'lucide-react';

interface Installment {
id: string;
installmentNumber: number;
dueDate: Date;
totalMonthlyPayment: number;
principal: number;
interest: number;
interestTax: number;
insurance: number;
remainingPrincipal: number;
remainingBalance: number;
status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
paymentDate?: Date;
amountPaid?: number;
notes?: string;
}

interface ScheduleStats {
totalInstallments: number;
paidInstallments: number;
overdueInstallments: number;
nextPayment?: Installment;
totalAmountPaid: number;
totalAmountRemaining: number;
}

interface LoanScheduledPaymentProps {
loanId: string;
isOpen: boolean;
onClose: () => void;
}

const CreditScheduledPayment: React.FC<LoanScheduledPaymentProps> = ({
loanId,
isOpen,
onClose,
}) => {
const [schedule, setSchedule] = useState<Installment[]>([]);
const [stats, setStats] = useState<ScheduleStats | null>(null);
const [loading, setLoading] = useState(true);
const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [paymentData, setPaymentData] = useState({
    amountPaid: '',
    paymentDate: '',
    notes: '',
});

useEffect(() => {
    if (isOpen && loanId) {
    fetchSchedule();
    }
}, [isOpen, loanId]);

const fetchSchedule = async () => {
    try {
    setLoading(true);
    const response = await fetch(`/api/credits/${loanId}/echeancier`);
    if (response.ok) {
        const data = await response.json();
        setSchedule(data.schedule);
        setStats(data.stats);
    }
    } catch (error) {
    console.error('Error loading repayment schedule:', error);
    } finally {
    setLoading(false);
    }
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    }).format(amount);
};

const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-KE');
};

const getStatusBadge = (status: string, dueDate: Date) => {
    const now = new Date();
    const dueDateObj = new Date(dueDate);
    
    let badgeStatus = status;
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

const handlePayInstallment = async () => {
    if (!selectedInstallment || !paymentData.amountPaid) return;

    try {
    const response = await fetch(`/api/credits/echeances/${selectedInstallment.id}/payer`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
    });

    if (response.ok) {
        await fetchSchedule(); // Refresh data
        setShowPaymentModal(false);
        setSelectedInstallment(null);
        setPaymentData({ amountPaid: '', paymentDate: '', notes: '' });
        alert('Payment recorded successfully');
    } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
    }
    } catch (error) {
    console.error('Error recording payment:', error);
    alert('Error recording payment');
    }
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
            Loan Repayment Schedule
            </h2>
        </div>
        <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
        >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
        </div>

        {loading ? (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0063b4]"></div>
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
                        <p className="text-sm text-purple-600 font-medium">Total Amount Paid</p>
                        <p className="text-lg font-bold text-purple-800">
                        {formatCurrency(stats.totalAmountPaid)}
                        </p>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            )}

            {/* Repayment Schedule Table */}
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
                        Monthly Payment
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Principal
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Remaining Balance
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Actions
                    </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-zinc-200">
                    {schedule.map((installment) => (
                        
                    <tr key={installment.id} className="hover:bg-zinc-50">
                        <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                        {installment.installmentNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-900">
                        {formatDate(installment.dueDate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-900 text-right">
                        {formatCurrency(installment.totalMonthlyPayment)}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-900 text-right">
                        {formatCurrency(installment.principal)}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-900 text-right">
                        {formatCurrency(installment.remainingBalance)}
                        </td>
                        <td className="px-4 py-3 text-center">
                        {getStatusBadge(installment.status, installment.dueDate)}
                        </td>
                        <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-2">
                            {installment.status === 'PENDING' && (
                            <button
                                onClick={() => {
                                setSelectedInstallment(installment);
                                setPaymentData({
                                    amountPaid: installment.totalMonthlyPayment.toString(),
                                    paymentDate: new Date().toISOString().split('T')[0],
                                    notes: '',
                                });
                                setShowPaymentModal(true);
                                }}
                                className="text-green-600 hover:text-green-900 p-1 rounded"
                                title="Mark as Paid"
                            >
                                <DollarSign className="w-4 h-4" />
                            </button>
                            )}
                            <button
                            onClick={() => {
                                setSelectedInstallment(installment);
                            }}
                            className="text-[#0063b4] hover:text-[#0052a3] p-1 rounded"
                            title="View Details"
                            >
                            <Eye className="w-4 h-4" />
                            </button>
                        </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            </div>
        </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedInstallment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
                <h3 className="text-lg font-medium text-zinc-900 mb-4">
                Record Payment - Installment #{selectedInstallment.installmentNumber}
                </h3>
                
                <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Amount Paid (KES)
                    </label>
                    <input
                    type="number"
                    step="0.01"
                    value={paymentData.amountPaid}
                    onChange={(e) => setPaymentData((prev) => ({ ...prev, amountPaid: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Payment Date
                    </label>
                    <input
                    type="date"
                    value={paymentData.paymentDate}
                    onChange={(e) => setPaymentData((prev) => ({ ...prev, paymentDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Notes (optional)
                    </label>
                    <textarea
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent"
                    placeholder="Notes about the payment..."
                    />
                </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                <button
                    onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedInstallment(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
                >
                    Cancel
                </button>
                <button
                    onClick={handlePayInstallment}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#0063b4] border border-transparent rounded-md hover:bg-[#0052a3]"
                >
                    Record Payment
                </button>
                </div>
            </div>
            </div>
        </div>
        )}
    </div>
    </div>
);
};

export default CreditScheduledPayment;