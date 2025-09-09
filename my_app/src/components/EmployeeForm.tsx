import { useState } from 'react'
import { SituationFamiliale, EmployeeStatus } from '@prisma/client'
import { CreditCard, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface EmployeeFormProps {
onSubmit: (employeeData: any) => void
onCancel: () => void
initialData?: any
isEditing?: boolean
}

export default function EmployeeForm({ onSubmit, onCancel, initialData, isEditing = false }: EmployeeFormProps) {
const [formData, setFormData] = useState({
    matricule: initialData?.matricule || '',
    nom: initialData?.nom || '',
    prenom: initialData?.prenom || '',
    fonction: initialData?.fonction || '',
    cin: initialData?.cin || '',
    cnss: initialData?.cnss || '',
    situationFamiliale: initialData?.situationFamiliale || 'CELIBATAIRE',
    dateNaissance: initialData?.dateNaissance ? new Date(initialData.dateNaissance).toISOString().split('T')[0] : '',
    dateEmbauche: initialData?.dateEmbauche ? new Date(initialData.dateEmbauche).toISOString().split('T')[0] : '',
    nbrDeductions: initialData?.nbrDeductions || 0,
    nbreJourMois: initialData?.nbreJourMois || 26,
    salaireBase: initialData?.salaireBase || '',
    indemniteLogement: initialData?.indemniteLogement || '',
    indemnitePanier: initialData?.indemnitePanier || '',
    primeTransport: initialData?.primeTransport || '',
    indemniteRepresentation: initialData?.indemniteRepresentation || '',
    compteBancaire: initialData?.compteBancaire || '',
    agence: initialData?.agence || '',
    telephone: initialData?.telephone || '',
    email: initialData?.email || '',
    adresse: initialData?.adresse || '',
    status: initialData?.status || 'ACTIF',
    // CNSS Prestations - Part Salariale (optionnelles)
    useCnssPrestation: initialData?.useCnssPrestation !== undefined ? initialData.useCnssPrestation : true,
    useAmoSalariale: initialData?.useAmoSalariale !== undefined ? initialData.useAmoSalariale : true,
    useRetraiteSalariale: initialData?.useRetraiteSalariale !== undefined ? initialData.useRetraiteSalariale : true,
    useAssuranceDiversSalariale: initialData?.useAssuranceDiversSalariale !== undefined ? initialData.useAssuranceDiversSalariale : true
})

const [errors, setErrors] = useState<Record<string, string>>({})
const [isSubmitting, setIsSubmitting] = useState(false)

const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
    ...prev,
    [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
    setErrors(prev => ({
        ...prev,
        [name]: ''
    }))
    }
}

const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Champs obligatoires
    if (!formData.matricule.trim()) {
    newErrors.matricule = 'Le matricule est obligatoire'
    }
    if (!formData.nom.trim()) {
    newErrors.nom = 'Le nom est obligatoire'
    }
    if (!formData.prenom.trim()) {
    newErrors.prenom = 'Le prénom est obligatoire'
    }
    if (!formData.fonction.trim()) {
    newErrors.fonction = 'La fonction est obligatoire'
    }
    if (!formData.dateEmbauche) {
    newErrors.dateEmbauche = 'La date d\'embauche est obligatoire'
    }
    if (!formData.salaireBase || parseFloat(formData.salaireBase) <= 0) {
    newErrors.salaireBase = 'Le salaire de base doit être supérieur à 0'
    }

    // Validation email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    newErrors.email = 'Format d\'email invalide'
    }

    // Validation téléphone
    if (formData.telephone && !/^[0-9+\-\s()]+$/.test(formData.telephone)) {
    newErrors.telephone = 'Format de téléphone invalide'
    }

    // Validation CIN (format marocain)
    if (formData.cin && !/^[A-Z]{1,2}[0-9]{1,6}$/.test(formData.cin.toUpperCase())) {
    newErrors.cin = 'Format CIN invalide (ex: AB123456)'
    }

    // Validation date de naissance
    if (formData.dateNaissance) {
    const birthDate = new Date(formData.dateNaissance)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    
    if (age < 16 || age > 70) {
        newErrors.dateNaissance = 'L\'âge doit être entre 16 et 70 ans'
    }
    }

    // Validation date d'embauche
    if (formData.dateEmbauche) {
    const hireDate = new Date(formData.dateEmbauche)
    const today = new Date()
    
    if (hireDate > today) {
        newErrors.dateEmbauche = 'La date d\'embauche ne peut pas être dans le futur'
    }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
}

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
    return
    }

    setIsSubmitting(true)
    try {
    await onSubmit(formData)
    } catch (error) {
    console.error('Error submitting form:', error)
    } finally {
    setIsSubmitting(false)
    }
}

return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Modifier l\'employé' : 'Ajouter un nouvel employé'}
        </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Informations personnelles */}
            <div className="lg:col-span-3">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations personnelles</h3>
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Matricule <span className="text-red-500">*</span>
            </label>
            <input
                type="text"
                name="matricule"
                value={formData.matricule}
                onChange={handleChange}
                className={`payroll-input ${errors.matricule ? 'input-error' : ''}`}
                placeholder="Ex: EMP001"
            />
            {errors.matricule && <p className="form-error">{errors.matricule}</p>}
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom <span className="text-red-500">*</span>
            </label>
            <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className={`payroll-input ${errors.nom ? 'input-error' : ''}`}
                placeholder="Nom de famille"
            />
            {errors.nom && <p className="form-error">{errors.nom}</p>}
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom <span className="text-red-500">*</span>
            </label>
            <input
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                className={`payroll-input ${errors.prenom ? 'input-error' : ''}`}
                placeholder="Prénom"
            />
            {errors.prenom && <p className="form-error">{errors.prenom}</p>}
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                CIN
            </label>
            <input
                type="text"
                name="cin"
                value={formData.cin}
                onChange={handleChange}
                className={`payroll-input ${errors.cin ? 'input-error' : ''}`}
                placeholder="Ex: AB123456"
            />
            {errors.cin && <p className="form-error">{errors.cin}</p>}
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro CNSS
            </label>
            <input
                type="text"
                name="cnss"
                value={formData.cnss}
                onChange={handleChange}
                className="payroll-input"
                placeholder="Numéro CNSS"
            />
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Situation familiale
            </label>
            <select
                name="situationFamiliale"
                value={formData.situationFamiliale}
                onChange={handleChange}
                className="payroll-input"
            >
                <option value="CELIBATAIRE">Célibataire</option>
                <option value="MARIE">Marié(e)</option>
                <option value="DIVORCE">Divorcé(e)</option>
                <option value="VEUF">Veuf/Veuve</option>
            </select>
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de naissance
            </label>
            <input
                type="date"
                name="dateNaissance"
                value={formData.dateNaissance}
                onChange={handleChange}
                className={`payroll-input ${errors.dateNaissance ? 'input-error' : ''}`}
            />
            {errors.dateNaissance && <p className="form-error">{errors.dateNaissance}</p>}
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone
            </label>
            <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                className={`payroll-input ${errors.telephone ? 'input-error' : ''}`}
                placeholder="Ex: +212 6 12 34 56 78"
            />
            {errors.telephone && <p className="form-error">{errors.telephone}</p>}
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
            </label>
            <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`payroll-input ${errors.email ? 'input-error' : ''}`}
                placeholder="email@exemple.com"
            />
            {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse
            </label>
            <textarea
                name="adresse"
                value={formData.adresse}
                onChange={handleChange}
                rows={3}
                className="payroll-input"
                placeholder="Adresse complète"
            />
            </div>

            {/* Informations professionnelles */}
            <div className="lg:col-span-3 mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations professionnelles</h3>
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Fonction <span className="text-red-500">*</span>
            </label>
            <input
                type="text"
                name="fonction"
                value={formData.fonction}
                onChange={handleChange}
                className={`payroll-input ${errors.fonction ? 'input-error' : ''}`}
                placeholder="Ex: Développeur, Comptable..."
            />
            {errors.fonction && <p className="form-error">{errors.fonction}</p>}
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Date d'embauche <span className="text-red-500">*</span>
            </label>
            <input
                type="date"
                name="dateEmbauche"
                value={formData.dateEmbauche}
                onChange={handleChange}
                className={`payroll-input ${errors.dateEmbauche ? 'input-error' : ''}`}
            />
            {errors.dateEmbauche && <p className="form-error">{errors.dateEmbauche}</p>}
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
            </label>
            <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="payroll-input"
            >
                <option value="ACTIF">Actif</option>
                <option value="SUSPENDU">Suspendu</option>
                <option value="DEMISSIONNAIRE">Démissionnaire</option>
                <option value="LICENCIE">Licencié</option>
                <option value="RETRAITE">Retraité</option>
            </select>
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de déductions
            </label>
            <input
                type="number"
                name="nbrDeductions"
                value={formData.nbrDeductions}
                onChange={handleChange}
                min="0"
                className="payroll-input"
            />
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de jours par mois
            </label>
            <input
                type="number"
                name="nbreJourMois"
                value={formData.nbreJourMois}
                onChange={handleChange}
                min="1"
                max="31"
                className="payroll-input"
            />
            </div>

            {/* Informations salariales */}
            <div className="lg:col-span-3 mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations salariales</h3>
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Salaire de base (MAD) <span className="text-red-500">*</span>
            </label>
            <input
                type="number"
                name="salaireBase"
                value={formData.salaireBase}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`payroll-input ${errors.salaireBase ? 'input-error' : ''}`}
                placeholder="0.00"
            />
            {errors.salaireBase && <p className="form-error">{errors.salaireBase}</p>}
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Indemnité de logement (MAD)
            </label>
            <input
                type="number"
                name="indemniteLogement"
                value={formData.indemniteLogement}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="payroll-input"
                placeholder="0.00"
            />
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Indemnité de panier (MAD)
            </label>
            <input
                type="number"
                name="indemnitePanier"
                value={formData.indemnitePanier}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="payroll-input"
                placeholder="0.00"
            />
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Prime de transport (MAD)
            </label>
            <input
                type="number"
                name="primeTransport"
                value={formData.primeTransport}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="payroll-input"
                placeholder="0.00"
            />
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Indemnité de représentation (MAD)
            </label>
            <input
                type="number"
                name="indemniteRepresentation"
                value={formData.indemniteRepresentation}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="payroll-input"
                placeholder="0.00"
            />
            </div>

            {/* CNSS Prestations - Part Salariale (optionnelles) */}
            <div className="lg:col-span-3 mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">CNSS Prestations - Part Salariale (optionnelles)</h3>
            <p className="text-sm text-gray-600 mb-4">
                Cochez les prestations à appliquer avec les montants par défaut. 
                Si non cochées, les calculs automatiques basés sur le salaire seront utilisés.
            </p>
            </div>

            <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                <input
                    type="checkbox"
                    name="useCnssPrestation"
                    checked={formData.useCnssPrestation}
                    onChange={(e) => setFormData(prev => ({ ...prev, useCnssPrestation: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700">
                    CNSS Prestations
                    </label>
                    <p className="text-xs text-gray-500">268,80 MAD</p>
                </div>
                </div>

                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                <input
                    type="checkbox"
                    name="useAmoSalariale"
                    checked={formData.useAmoSalariale}
                    onChange={(e) => setFormData(prev => ({ ...prev, useAmoSalariale: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700">
                    AMO - Part Salariale
                    </label>
                    <p className="text-xs text-gray-500">180,16 MAD</p>
                </div>
                </div>

                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                <input
                    type="checkbox"
                    name="useRetraiteSalariale"
                    checked={formData.useRetraiteSalariale}
                    onChange={(e) => setFormData(prev => ({ ...prev, useRetraiteSalariale: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700">
                    Retraite - Part Salariale
                    </label>
                    <p className="text-xs text-gray-500">478,29 MAD</p>
                </div>
                </div>

                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                <input
                    type="checkbox"
                    name="useAssuranceDiversSalariale"
                    checked={formData.useAssuranceDiversSalariale}
                    onChange={(e) => setFormData(prev => ({ ...prev, useAssuranceDiversSalariale: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700">
                    Assurance Divers - Part Salariale
                    </label>
                    <p className="text-xs text-gray-500">100,14 MAD</p>
                </div>
                </div>
            </div>
            </div>

            {/* Informations bancaires */}
            <div className="lg:col-span-3 mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations bancaires</h3>
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Compte bancaire
            </label>
            <input
                type="text"
                name="compteBancaire"
                value={formData.compteBancaire}
                onChange={handleChange}
                className="payroll-input"
                placeholder="Numéro de compte"
            />
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Agence
            </label>
            <input
                type="text"
                name="agence"
                value={formData.agence}
                onChange={handleChange}
                className="payroll-input"
                placeholder="Nom de l'agence bancaire"
            />
            </div>

            {/* Notice pour la gestion des crédits */}
            <div className="lg:col-span-3 mt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                <CreditCard className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">
                    Gestion des crédits et retenues
                    </h4>
                    <p className="text-sm text-blue-700 mb-3">
                    Pour assigner un crédit en cours ou qui va commencer à cet employé, 
                    utilisez la section dédiée à la gestion des crédits. Les retenues 
                    apparaîtront automatiquement dans les bulletins de paie jusqu'au 
                    paiement complet.
                    </p>
                    <Link 
                    href="/credits" 
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    >
                    Gérer les crédits
                    <ExternalLink className="w-4 h-4 ml-1" />
                    </Link>
                </div>
                </div>
            </div>
            </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
            type="button"
            onClick={onCancel}
            className="payroll-button-secondary"
            disabled={isSubmitting}
            >
            Annuler
            </button>
            <button
            type="submit"
            className="payroll-button"
            disabled={isSubmitting}
            >
            {isSubmitting ? (
                <>
                <span className="spinner mr-2"></span>
                {isEditing ? 'Modification...' : 'Ajout...'}
                </>
            ) : (
                isEditing ? 'Modifier' : 'Ajouter'
            )}
            </button>
        </div>
        </form>
    </div>
    </div>
)
}
