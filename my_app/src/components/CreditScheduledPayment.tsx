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
FileText
} from 'lucide-react';

interface Echeance {
id: string;
numeroEcheance: number;
dateEcheance: Date;
mensualiteTTC: number;
amortissement: number;
interetsHT: number;
tvaInterets: number;
assurance: number;
capitalRestant: number;
statut: 'EN_ATTENTE' | 'PAYEE' | 'EN_RETARD' | 'ANNULEE';
datePaiement?: Date;
montantPaye?: number;
notes?: string;
}

interface EcheancierStats {
totalEcheances: number;
echeancesPayees: number;
echeancesEnRetard: number;
prochainePaiement?: Echeance;
montantTotalPaye: number;
montantTotalRestant: number;
}

interface CreditEcheancierProps {
creditId: string;
isOpen: boolean;
onClose: () => void;
}

const CreditScheduledPayment: React.FC<CreditEcheancierProps> = ({
creditId,
isOpen,
onClose
}) => {
const [echeancier, setEcheancier] = useState<Echeance[]>([]);
const [stats, setStats] = useState<EcheancierStats | null>(null);
const [loading, setLoading] = useState(true);
const [selectedEcheance, setSelectedEcheance] = useState<Echeance | null>(null);
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [paymentData, setPaymentData] = useState({
    montantPaye: '',
    datePaiement: '',
    notes: ''
});

useEffect(() => {
    if (isOpen && creditId) {
    fetchEcheancier();
    }
}, [isOpen, creditId]);

const fetchEcheancier = async () => {
    try {
    setLoading(true);
    const response = await fetch(`/api/credits/${creditId}/echeancier`);
    if (response.ok) {
        const data = await response.json();
        setEcheancier(data.echeancier);
        setStats(data.stats);
    }
    } catch (error) {
    console.error('Erreur lors du chargement de l\'échéancier:', error);
    } finally {
    setLoading(false);
    }
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD'
    }).format(amount);
};

const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('fr-FR');
};

const getStatusBadge = (statut: string, dateEcheance: Date) => {
    const now = new Date();
    const echeanceDate = new Date(dateEcheance);
    
    let status = statut;
    let color = '';
    let icon = Clock;
    let text = '';

    if (statut === 'PAYEE') {
    color = 'bg-green-100 text-green-800';
    icon = CheckCircle;
    text = 'Payée';
    } else if (statut === 'EN_ATTENTE' && echeanceDate < now) {
    color = 'bg-red-100 text-red-800';
    icon = AlertTriangle;
    text = 'En retard';
    } else if (statut === 'EN_ATTENTE') {
    color = 'bg-yellow-100 text-yellow-800';
    icon = Clock;
    text = 'En attente';
    } else if (statut === 'ANNULEE') {
    color = 'bg-gray-100 text-gray-800';
    icon = Clock;
    text = 'Annulée';
    }

    const Icon = icon;
    
    return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {text}
    </span>
    );
};

const handlePayEcheance = async () => {
    if (!selectedEcheance || !paymentData.montantPaye) return;

    try {
    const response = await fetch(`/api/credits/echeances/${selectedEcheance.id}/payer`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
    });

    if (response.ok) {
        await fetchEcheancier(); // Refresh data
        setShowPaymentModal(false);
        setSelectedEcheance(null);
        setPaymentData({ montantPaye: '', datePaiement: '', notes: '' });
        alert('Paiement enregistré avec succès');
    } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
    }
    } catch (error) {
    console.error('Erreur lors du paiement:', error);
    alert('Erreur lors de l\'enregistrement du paiement');
    }
};

if (!isOpen) return null;

return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center">
            <Calendar className="w-6 h-6 text-[#0063b4] mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
            Échéancier du Crédit
            </h2>
        </div>
        <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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
            <div className="p-6 border-b border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                    <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
                    <div>
                        <p className="text-sm text-blue-600 font-medium">Total Échéances</p>
                        <p className="text-lg font-bold text-blue-800">{stats.totalEcheances}</p>
                    </div>
                    </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <div>
                        <p className="text-sm text-green-600 font-medium">Payées</p>
                        <p className="text-lg font-bold text-green-800">{stats.echeancesPayees}</p>
                    </div>
                    </div>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                    <div>
                        <p className="text-sm text-red-600 font-medium">En Retard</p>
                        <p className="text-lg font-bold text-red-800">{stats.echeancesEnRetard}</p>
                    </div>
                    </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center">
                    <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
                    <div>
                        <p className="text-sm text-purple-600 font-medium">Montant Payé</p>
                        <p className="text-lg font-bold text-purple-800">
                        {formatCurrency(stats.montantTotalPaye)}
                        </p>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            )}

            {/* Échéancier Table */}
            <div className="flex-1 overflow-auto p-6">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                    <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        N°
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Échéance
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mensualité TTC
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Capital
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Intérêts HT
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        TVA
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assurance
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Capital Restant
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                    </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {echeancier.map((echeance) => (
                    <tr key={echeance.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {echeance.numeroEcheance}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDate(echeance.dateEcheance)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(echeance.mensualiteTTC)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(echeance.amortissement)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(echeance.interetsHT)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(echeance.tvaInterets)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(echeance.assurance)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(echeance.capitalRestant)}
                        </td>
                        <td className="px-4 py-3 text-center">
                        {getStatusBadge(echeance.statut, echeance.dateEcheance)}
                        </td>
                        <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-2">
                            {echeance.statut === 'EN_ATTENTE' && (
                            <button
                                onClick={() => {
                                setSelectedEcheance(echeance);
                                setPaymentData({
                                    montantPaye: echeance.mensualiteTTC.toString(),
                                    datePaiement: new Date().toISOString().split('T')[0],
                                    notes: ''
                                });
                                setShowPaymentModal(true);
                                }}
                                className="text-green-600 hover:text-green-900 p-1 rounded"
                                title="Marquer comme payée"
                            >
                                <DollarSign className="w-4 h-4" />
                            </button>
                            )}
                            <button
                            onClick={() => {
                                setSelectedEcheance(echeance);
                            }}
                            className="text-[#0063b4] hover:text-[#0052a3] p-1 rounded"
                            title="Voir les détails"
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
        {showPaymentModal && selectedEcheance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                Enregistrer le Paiement - Échéance #{selectedEcheance.numeroEcheance}
                </h3>
                
                <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant payé (MAD)
                    </label>
                    <input
                    type="number"
                    step="0.01"
                    value={paymentData.montantPaye}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, montantPaye: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de paiement
                    </label>
                    <input
                    type="date"
                    value={paymentData.datePaiement}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, datePaiement: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optionnel)
                    </label>
                    <textarea
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent"
                    placeholder="Notes sur le paiement..."
                    />
                </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                <button
                    onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedEcheance(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    Annuler
                </button>
                <button
                    onClick={handlePayEcheance}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#0063b4] border border-transparent rounded-md hover:bg-[#0052a3]"
                >
                    Enregistrer le Paiement
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
