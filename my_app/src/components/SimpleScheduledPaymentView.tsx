"use client"

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
Banknote
} from 'lucide-react';

interface SimpleEcheance {
numeroEcheance: number;
dateEcheance: Date;
mensualiteTTC: number;
amortissement: number;
interetsHT: number;
tvaInterets: number;
assurance: number;
capitalRestant: number;
statut: 'EN_ATTENTE' | 'PAYEE' | 'EN_RETARD' | 'ANNULEE';
}

interface EcheancierStats {
totalEcheances: number;
echeancesPayees: number;
echeancesEnRetard: number;
montantTotalPaye: number;
montantTotalRestant: number;
prochainePaiement?: SimpleEcheance;
progressionPourcentage: number;
}

interface SimpleEcheancierViewProps {
creditId: string;
employeeId: string;
isOpen: boolean;
onClose: () => void;
onGenerateEcheancier?: () => void;
}

const SimpleEcheancierView: React.FC<SimpleEcheancierViewProps> = ({
creditId,
employeeId,
isOpen,
onClose,
onGenerateEcheancier
}) => {
const [echeancier, setEcheancier] = useState<SimpleEcheance[]>([]);
const [stats, setStats] = useState<EcheancierStats | null>(null);
const [loading, setLoading] = useState(true);
const [generating, setGenerating] = useState(false);
const [payrollCalculating, setPayrollCalculating] = useState(false);

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
        setEcheancier(data.echeancier || []);
        setStats(data.stats);
    } else if (response.status === 404) {
        // Échéancier n'existe pas encore
        setEcheancier([]);
        setStats(null);
    }
    } catch (error) {
    console.error('Erreur lors du chargement de l\'échéancier:', error);
    } finally {
    setLoading(false);
    }
};

const handleGenerateEcheancier = async () => {
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
        alert(`Échéancier généré avec succès! ${data.totalEcheances} échéances créées.`);
        await fetchEcheancier(); // Recharger les données
        if (onGenerateEcheancier) {
        onGenerateEcheancier();
        }
    } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
    }
    } catch (error) {
    console.error('Erreur lors de la génération:', error);
    alert('Erreur lors de la génération de l\'échéancier');
    } finally {
    setGenerating(false);
    }
};

const handleCalculatePayroll = async () => {
    try {
    setPayrollCalculating(true);
    const currentDate = new Date();
    const mois = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const annee = currentDate.getFullYear().toString();

    const response = await fetch('/api/payroll/calculate-with-credits', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
        employeeId, 
        mois, 
        annee 
        }),
    });

    if (response.ok) {
        const data = await response.json();
        alert(`Paie calculée avec succès! Salaire net: ${formatCurrency(data.resume.salaireNetAPayer)}`);
    } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
    }
    } catch (error) {
    console.error('Erreur lors du calcul de paie:', error);
    alert('Erreur lors du calcul de paie');
    } finally {
    setPayrollCalculating(false);
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

if (!isOpen) return null;

return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center">
            <Calendar className="w-6 h-6 text-[#0063b4] mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
            Échéancier Simple du Crédit
            </h2>
        </div>
        <div className="flex items-center space-x-3">
            {echeancier.length === 0 && (
            <button
                onClick={handleGenerateEcheancier}
                disabled={generating}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
            >
                {generating ? (
                <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Génération...
                </div>
                ) : (
                <div className="flex items-center">
                    <Calculator className="w-4 h-4 mr-2" />
                    Générer l'Échéancier
                </div>
                )}
            </button>
            )}
            {echeancier.length > 0 && (
            <button
                onClick={handleCalculatePayroll}
                disabled={payrollCalculating}
                className="px-4 py-2 text-sm font-medium text-white bg-[#0063b4] border border-transparent rounded-md hover:bg-[#0052a3] disabled:opacity-50"
            >
                {payrollCalculating ? (
                <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Calcul...
                </div>
                ) : (
                <div className="flex items-center">
                    <Banknote className="w-4 h-4 mr-2" />
                    Calculer Paie
                </div>
                )}
            </button>
            )}
            <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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
        ) : echeancier.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FileText className="w-12 h-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun échéancier trouvé</h3>
            <p className="text-sm text-center mb-4">
            Cliquez sur "Générer l'Échéancier" pour créer automatiquement<br />
            l'échéancier de ce crédit avec intégration dans la paie.
            </p>
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
                        <p className="text-sm text-purple-600 font-medium">Progression</p>
                        <p className="text-lg font-bold text-purple-800">{stats.progressionPourcentage}%</p>
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
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {echeancier.map((echeance) => (
                    <tr key={echeance.numeroEcheance} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {echeance.numeroEcheance}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDate(echeance.dateEcheance)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
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

export default SimpleEcheancierView;
