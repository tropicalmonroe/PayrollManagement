"use client";
import React, { useState, useEffect } from 'react';
import { X, CreditCard, Building, Calendar, DollarSign } from 'lucide-react';

interface Employee {
id: string;
matricule: string;
nom: string;
prenom: string;
fonction: string;
compteBancaire?: string;
agence?: string;
}

interface Credit {
id: string;
employee: Employee;
type: 'LOGEMENT' | 'CONSOMMATION';
montantCredit: number;
mensualite: number;
dateDebut: Date;
dateFin: Date;
soldeRestant: number;
montantRembourse: number;
statut: 'ACTIF' | 'SOLDE' | 'SUSPENDU';
banque: string;
notes?: string;
createdAt: Date;
}

interface AddCreditModalProps {
isOpen: boolean;
onClose: () => void;
onSuccess: () => void;
employees: Employee[];
editCredit?: Credit;
}

const AddCreditModal: React.FC<AddCreditModalProps> = ({
isOpen,
onClose,
onSuccess,
employees,
editCredit
}) => {
const [formData, setFormData] = useState({
    employeeId: '',
    type: 'LOGEMENT' as 'LOGEMENT' | 'CONSOMMATION',
    montantMensuel: '',
    dateDebut: '',
    banque: '',
    notes: ''
});

const [loading, setLoading] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});

// Reset form when modal opens/closes or populate with edit data
useEffect(() => {
    if (!isOpen) {
    setFormData({
        employeeId: '',
        type: 'LOGEMENT',
        montantMensuel: '',
        dateDebut: '',
        banque: '',
        notes: ''
    });
    setErrors({});
    } else if (editCredit) {
    // Pré-remplir le formulaire avec les données du crédit à modifier
    setFormData({
        employeeId: editCredit.employee.id,
        type: editCredit.type,
        montantMensuel: editCredit.mensualite.toString(),
        dateDebut: new Date(editCredit.dateDebut).toISOString().split('T')[0],
        banque: editCredit.banque,
        notes: editCredit.notes || ''
    });
    }
}, [isOpen, editCredit]);

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Si un employé est sélectionné, pré-remplir les informations bancaires
    if (name === 'employeeId' && value) {
    const selectedEmployee = employees.find(emp => emp.id === value);
    if (selectedEmployee) {
        // Extraire le nom de la banque du compte bancaire ou de l'agence
        let banqueName = '';
        if (selectedEmployee.agence) {
        banqueName = selectedEmployee.agence;
        } else if (selectedEmployee.compteBancaire) {
        // Déduire la banque selon les codes IBAN marocains (positions 5-7)
        const compte = selectedEmployee.compteBancaire.replace(/\s/g, ''); // Supprimer les espaces
        
        // Extraire le code banque (positions 5-7 de l'IBAN ou début du RIB)
        let codeBank = '';
        if (compte.startsWith('MA64') || compte.startsWith('MA')) {
            // Format IBAN complet
            codeBank = compte.substring(4, 7);
        } else {
            // Format RIB (prendre les 3 premiers chiffres)
            codeBank = compte.substring(0, 3);
        }
        
        // Mapping des codes bancaires marocains
        switch (codeBank) {
            case '225':
            case '254':
            case '257':
            banqueName = 'Crédit Agricole du Maroc';
            break;
            case '230':
            banqueName = 'Crédit Immobilier et Hôtelier (CIH)';
            break;
            case '143':
            case '360': // Code RIB Attijariwafa Bank
            banqueName = 'Attijariwafa Bank';
            break;
            case '101':
            case '102':
            case '103':
            case '104':
            case '105':
            case '106':
            case '107':
            case '108':
            case '109':
            case '110':
            banqueName = 'Banque Populaire';
            break;
            case '136':
            banqueName = 'BMCI (BNP Paribas)';
            break;
            case '609':
            banqueName = 'Bank of Africa (BMCE)';
            break;
            case '160':
            banqueName = 'Arab Bank PLC';
            break;
            case '122':
            banqueName = 'Société Générale Maroc';
            break;
            case '196':
            banqueName = 'CFG Bank';
            break;
            default:
            // Vérifier si c'est Al Barid Bank (code 101 ou variations)
            if (codeBank === '101' && compte.includes('barid')) {
                banqueName = 'Al Barid Bank';
            } else {
                banqueName = 'Banque non identifiée';
            }
        }
        }
        
        setFormData(prev => ({
        ...prev,
        [name]: value,
        banque: banqueName
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

    if (!formData.employeeId) newErrors.employeeId = 'Veuillez sélectionner un employé';
    if (!formData.montantMensuel) newErrors.montantMensuel = 'Le montant mensuel est requis';
    if (!formData.dateDebut) newErrors.dateDebut = 'La date de début est requise';
    if (!formData.banque) newErrors.banque = 'La banque est requise';

    // Validation des valeurs numériques
    if (formData.montantMensuel && parseFloat(formData.montantMensuel) <= 0) {
    newErrors.montantMensuel = 'Le montant doit être supérieur à 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
    const url = editCredit ? `/api/credits/${editCredit.id}` : '/api/credits';
    const method = editCredit ? 'PUT' : 'POST';
    
    // Calculer des valeurs par défaut pour la compatibilité
    const montantMensuel = parseFloat(formData.montantMensuel);
    const montantCredit = montantMensuel * 12; // Estimation sur 1 an par défaut
    const dateDebut = new Date(formData.dateDebut);
    const dateFin = new Date(dateDebut);
    dateFin.setFullYear(dateFin.getFullYear() + 1); // 1 an par défaut
    
    const response = await fetch(url, {
        method,
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        employeeId: formData.employeeId,
        type: formData.type,
        montantCredit: montantCredit,
        tauxInteret: 0, // Pas de calcul d'intérêts
        dureeAnnees: 1, // 1 an par défaut
        mensualite: montantMensuel,
        dateDebut: formData.dateDebut,
        dateFin: dateFin,
        soldeRestant: montantCredit,
        montantRembourse: 0,
        statut: 'ACTIF',
        banque: formData.banque,
        numeroCompte: '',
        dateCreation: new Date(),
        createdBy: 'admin',
        notes: formData.notes,
        interetsPayes: 0,
        capitalRestant: montantCredit,
        tauxAssurance: 0
        }),
    });

    if (response.ok) {
        onSuccess();
        onClose();
    } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || `Erreur lors de ${editCredit ? 'la modification' : 'la création'} du crédit` });
    }
    } catch (error) {
    setErrors({ submit: 'Erreur de connexion' });
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
            <CreditCard className="w-6 h-6 text-[#0063b4] mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
            {editCredit ? 'Modifier le Crédit' : 'Nouveau Crédit Simple'}
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
        {/* Employee Selection */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            Employé *
            </label>
            <select
            name="employeeId"
            value={formData.employeeId}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent ${
                errors.employeeId ? 'border-red-500' : 'border-gray-300'
            }`}
            >
            <option value="">Sélectionner un employé</option>
            {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                {employee.matricule} - {employee.prenom} {employee.nom}
                </option>
            ))}
            </select>
            {errors.employeeId && <p className="mt-1 text-sm text-red-600">{errors.employeeId}</p>}
        </div>

        {/* Credit Type */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de crédit *
            </label>
            <select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent"
            >
            <option value="LOGEMENT">Crédit Logement</option>
            <option value="CONSOMMATION">Crédit Consommation</option>
            </select>
        </div>

        {/* Montant mensuel */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            Montant mensuel à retenir (MAD) *
            </label>
            <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
                type="number"
                name="montantMensuel"
                value={formData.montantMensuel}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent ${
                errors.montantMensuel ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: 5000.00"
            />
            </div>
            {errors.montantMensuel && <p className="mt-1 text-sm text-red-600">{errors.montantMensuel}</p>}
            <p className="mt-1 text-xs text-gray-500">
            Montant qui sera retenu chaque mois sur le salaire
            </p>
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
                name="dateDebut"
                value={formData.dateDebut}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent ${
                errors.dateDebut ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            </div>
            {errors.dateDebut && <p className="mt-1 text-sm text-red-600">{errors.dateDebut}</p>}
        </div>

        {/* Banque */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            Banque *
            </label>
            <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
                type="text"
                name="banque"
                value={formData.banque}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent ${
                errors.banque ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Attijariwafa Bank"
            />
            </div>
            {errors.banque && <p className="mt-1 text-sm text-red-600">{errors.banque}</p>}
        </div>

        {/* Notes */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optionnel)
            </label>
            <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0063b4] focus:border-transparent"
            placeholder="Informations supplémentaires sur le crédit..."
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
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
            Annuler
            </button>
            <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0063b4] border border-transparent rounded-md hover:bg-[#0052a3] disabled:opacity-50"
            >
            {loading 
                ? (editCredit ? 'Modification...' : 'Création...') 
                : (editCredit ? 'Modifier le crédit' : 'Créer le crédit')
            }
            </button>
        </div>
        </form>
    </div>
    </div>
);
};

export default AddCreditModal;
