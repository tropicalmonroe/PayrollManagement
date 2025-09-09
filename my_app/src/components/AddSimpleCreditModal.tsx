"use client";

import React, { useState } from 'react';
import { X, Plus, Calendar, DollarSign } from 'lucide-react';

interface AddSimpleCreditModalProps {
isOpen: boolean;
onClose: () => void;
employeeId: string;
onCreditAdded: () => void;
}

const AddSimpleCreditModal: React.FC<AddSimpleCreditModalProps> = ({
isOpen,
onClose,
employeeId,
onCreditAdded
}) => {
const [formData, setFormData] = useState({
    type: 'LOGEMENT' as 'LOGEMENT' | 'CONSOMMATION',
    montantMensuel: '',
    nombreEcheances: '',
    dateDebut: '',
    banque: '',
    description: ''
});
const [loading, setLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.montantMensuel || !formData.nombreEcheances || !formData.dateDebut || !formData.banque) {
    alert('Veuillez remplir tous les champs obligatoires');
    return;
    }

    try {
    setLoading(true);
    
    // Calculer le montant total
    const montantTotal = parseFloat(formData.montantMensuel) * parseInt(formData.nombreEcheances);
    
    // Créer le crédit
    const creditResponse = await fetch('/api/credits', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        employeeId,
        type: formData.type,
        montantCredit: montantTotal,
        tauxInteret: 0, // Pas de calcul d'intérêts
        dureeAnnees: Math.ceil(parseInt(formData.nombreEcheances) / 12),
        mensualite: parseFloat(formData.montantMensuel),
        dateDebut: formData.dateDebut,
        dateFin: new Date(new Date(formData.dateDebut).setMonth(
            new Date(formData.dateDebut).getMonth() + parseInt(formData.nombreEcheances)
        )),
        soldeRestant: montantTotal,
        montantRembourse: 0,
        statut: 'ACTIF',
        banque: formData.banque,
        numeroCompte: '',
        dateCreation: new Date(),
        createdBy: 'admin',
        notes: formData.description,
        interetsPayes: 0,
        capitalRestant: montantTotal,
        tauxAssurance: 0
        }),
    });

    if (!creditResponse.ok) {
        const error = await creditResponse.json();
        throw new Error(error.error || 'Erreur lors de la création du crédit');
    }

    const credit = await creditResponse.json();

    // Générer l'échéancier simple
    const echeancierResponse = await fetch('/api/credits/generate-simple-echeancier', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        creditId: credit.id,
        montantMensuel: parseFloat(formData.montantMensuel),
        nombreEcheances: parseInt(formData.nombreEcheances),
        dateDebut: formData.dateDebut
        }),
    });

    if (echeancierResponse.ok) {
        alert('Crédit et échéancier créés avec succès!');
        onCreditAdded();
        onClose();
        setFormData({
        type: 'LOGEMENT',
        montantMensuel: '',
        nombreEcheances: '',
        dateDebut: '',
        banque: '',
        description: ''
        });
    } else {
        alert('Crédit créé mais erreur lors de la génération de l\'échéancier');
    }

    } catch (error) {
    console.error('Erreur:', error);
    alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
    setLoading(false);
    }
};

if (!isOpen) return null;

return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center">
            <Plus className="w-6 h-6 text-[#0063b4] mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
            Nouveau Crédit Simple
            </h2>
        </div>
        <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
        >
            <X className="w-6 h-6" />
        </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Type de crédit */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de crédit *
            </label>
            <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'LOGEMENT' | 'CONSOMMATION' }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent"
            required
            >
            <option value="LOGEMENT">Crédit Logement</option>
            <option value="CONSOMMATION">Crédit Consommation</option>
            </select>
        </div>

        {/* Montant mensuel */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            Montant mensuel (MAD) *
            </label>
            <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
                type="number"
                step="0.01"
                value={formData.montantMensuel}
                onChange={(e) => setFormData(prev => ({ ...prev, montantMensuel: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent"
                placeholder="Ex: 5000"
                required
            />
            </div>
        </div>

        {/* Nombre d'échéances */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre d'échéances *
            </label>
            <input
            type="number"
            min="1"
            value={formData.nombreEcheances}
            onChange={(e) => setFormData(prev => ({ ...prev, nombreEcheances: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent"
            placeholder="Ex: 24"
            required
            />
        </div>

        {/* Date de début */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            Date de début *
            </label>
            <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
                type="date"
                value={formData.dateDebut}
                onChange={(e) => setFormData(prev => ({ ...prev, dateDebut: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent"
                required
            />
            </div>
        </div>

        {/* Banque */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            Banque *
            </label>
            <input
            type="text"
            value={formData.banque}
            onChange={(e) => setFormData(prev => ({ ...prev, banque: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent"
            placeholder="Ex: Attijariwafa Bank"
            required
            />
        </div>

        {/* Description */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (optionnel)
            </label>
            <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent"
            placeholder="Notes sur le crédit..."
            />
        </div>

        {/* Résumé */}
        {formData.montantMensuel && formData.nombreEcheances && (
            <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Résumé:</h4>
            <p className="text-sm text-blue-700">
                Montant total: {(parseFloat(formData.montantMensuel || '0') * parseInt(formData.nombreEcheances || '0')).toLocaleString('fr-MA')} MAD
            </p>
            <p className="text-sm text-blue-700">
                Durée: {Math.ceil(parseInt(formData.nombreEcheances || '0') / 12)} an(s)
            </p>
            </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
            <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
            Annuler
            </button>
            <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0063b4] border border-transparent rounded-md hover:bg-[#0052a3] disabled:opacity-50"
            >
            {loading ? (
                <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Création...
                </div>
            ) : (
                'Créer le Crédit'
            )}
            </button>
        </div>
        </form>
    </div>
    </div>
);
};

export default AddSimpleCreditModal;
