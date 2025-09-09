import { useState } from 'react'
import { Employee, EmployeeStatus, SituationFamiliale } from '@prisma/client'
import { calculerPaie, type EmployeePayrollData } from '../lib/payrollCalculations'

interface EmployeeListProps {
employees: Employee[]
onEdit: (employee: Employee) => void
onDelete: (employeeId: string) => void
onView: (employee: Employee) => void
}

export default function EmployeeList({ employees, onEdit, onDelete, onView }: EmployeeListProps) {
const [searchTerm, setSearchTerm] = useState('')
const [statusFilter, setStatusFilter] = useState<EmployeeStatus | 'ALL'>('ALL')
const [sortBy, setSortBy] = useState<'nom' | 'dateEmbauche' | 'salaireBase'>('nom')
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

// Filtrer et trier les employés
const filteredAndSortedEmployees = employees
    .filter(employee => {
    const matchesSearch = 
        employee.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.fonction.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'ALL' || employee.status === statusFilter
    
    return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
    let aValue: any
    let bValue: any
    
    switch (sortBy) {
        case 'nom':
        aValue = `${a.nom} ${a.prenom}`
        bValue = `${b.nom} ${b.prenom}`
        break
        case 'dateEmbauche':
        aValue = new Date(a.dateEmbauche)
        bValue = new Date(b.dateEmbauche)
        break
        case 'salaireBase':
        aValue = a.salaireBase
        bValue = b.salaireBase
        break
        default:
        return 0
    }
    
    if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
    } else {
        return aValue < bValue ? 1 : -1
    }
    })

const getStatusBadge = (status: EmployeeStatus) => {
    switch (status) {
    case 'ACTIF':
        return <span className="status-active">Actif</span>
    case 'SUSPENDU':
        return <span className="status-pending">Suspendu</span>
    case 'DEMISSIONNAIRE':
    case 'LICENCIE':
    case 'RETRAITE':
        return <span className="status-inactive">{status.charAt(0) + status.slice(1).toLowerCase()}</span>
    default:
        return <span className="status-pending">{status}</span>
    }
}

const getSituationFamiliale = (situation: SituationFamiliale) => {
    switch (situation) {
    case 'CELIBATAIRE':
        return 'Célibataire'
    case 'MARIE':
        return 'Marié(e)'
    case 'DIVORCE':
        return 'Divorcé(e)'
    case 'VEUF':
        return 'Veuf/Veuve'
    default:
        return situation
    }
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2
    }).format(amount)
}

const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
    }).format(new Date(date))
}

const calculateAge = (birthDate: Date | null) => {
    if (!birthDate) return 'N/A'
    const today = new Date()
    const birth = new Date(birthDate)
    const age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1
    }
    return age
}

const calculateSeniority = (hireDate: Date) => {
    const today = new Date()
    const hire = new Date(hireDate)
    const years = today.getFullYear() - hire.getFullYear()
    const months = today.getMonth() - hire.getMonth()
    
    let totalMonths = years * 12 + months
    if (today.getDate() < hire.getDate()) {
    totalMonths--
    }
    
    const seniorityYears = Math.floor(totalMonths / 12)
    const seniorityMonths = totalMonths % 12
    
    return seniorityYears + (seniorityMonths / 12)
}

const calculateNetSalary = (employee: Employee) => {
    try {
    const employeeData: EmployeePayrollData = {
        nom: employee.nom,
        prenom: employee.prenom,
        matricule: employee.matricule,
        cin: employee.cin || '',
        cnss: employee.cnss || '',
        situationFamiliale: employee.situationFamiliale,
        dateNaissance: employee.dateNaissance || new Date(),
        dateEmbauche: employee.dateEmbauche,
        anciennete: calculateSeniority(employee.dateEmbauche),
        nbrDeductions: employee.nbrDeductions,
        nbreJourMois: employee.nbreJourMois,
        salaireBase: employee.salaireBase,
        indemniteLogement: employee.indemniteLogement,
        indemnitePanier: employee.indemnitePanier,
        primeTransport: employee.primeTransport,
        indemniteRepresentation: employee.indemniteRepresentation,
        assurances: {
        assuranceMaladieComplementaire: false,
        assuranceMaladieEtranger: false,
        assuranceInvaliditeRenforcee: false,
        },
        creditImmobilier: employee.interetsCredit || employee.remboursementCredit ? {
        montantMensuel: employee.remboursementCredit || 0,
        interets: employee.interetsCredit || 0,
        } : undefined,
        creditConsommation: employee.creditConso ? {
        montantMensuel: employee.creditConso,
        } : undefined,
        avanceSalaire: employee.remboursementAvance ? {
        montantMensuel: employee.remboursementAvance,
        } : undefined,
        compteBancaire: employee.compteBancaire || '',
        agence: employee.agence || '',
    }

    const payrollResult = calculerPaie(employeeData)
    return payrollResult.salaireNetAPayer
    } catch (error) {
    console.error('Error calculating net salary for employee:', employee.matricule, error)
    return employee.salaireBase // Fallback to base salary if calculation fails
    }
}

const handleSort = (field: 'nom' | 'dateEmbauche' | 'salaireBase') => {
    if (sortBy === field) {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
    setSortBy(field)
    setSortOrder('asc')
    }
}

const getSortIcon = (field: 'nom' | 'dateEmbauche' | 'salaireBase') => {
    if (sortBy !== field) return '↕️'
    return sortOrder === 'asc' ? '↑' : '↓'
}

return (
    <div className="space-y-6">
    {/* Filtres et recherche */}
    <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            Rechercher
            </label>
            <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nom, prénom, matricule, fonction..."
            className="payroll-input"
            />
        </div>
        
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            Statut
            </label>
            <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EmployeeStatus | 'ALL')}
            className="payroll-input"
            >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIF">Actif</option>
            <option value="SUSPENDU">Suspendu</option>
            <option value="DEMISSIONNAIRE">Démissionnaire</option>
            <option value="LICENCIE">Licencié</option>
            <option value="RETRAITE">Retraité</option>
            </select>
        </div>

        <div className="flex items-end">
            <div className="text-sm text-gray-600">
            {filteredAndSortedEmployees.length} employé(s) trouvé(s)
            </div>
        </div>
        </div>
    </div>

    {/* Liste des employés */}
    {filteredAndSortedEmployees.length === 0 ? (
        <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
            <div className="text-center py-12">
            <span className="text-6xl">👥</span>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
                {searchTerm || statusFilter !== 'ALL' ? 'Aucun employé trouvé' : 'Aucun employé'}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'ALL' 
                ? 'Essayez de modifier vos critères de recherche'
                : 'Commencez par ajouter votre premier employé'
                }
            </p>
            </div>
        </div>
        </div>
    ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Version desktop - tableau */}
        <div className="hidden lg:block">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('nom')}
                >
                    Employé {getSortIcon('nom')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fonction
                </th>
                <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('dateEmbauche')}
                >
                    Date d'embauche {getSortIcon('dateEmbauche')}
                </th>
                <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('salaireBase')}
                >
                    Salaire net {getSortIcon('salaireBase')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                </th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                            {employee.prenom.charAt(0)}{employee.nom.charAt(0)}
                            </span>
                        </div>
                        </div>
                        <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                            {employee.prenom} {employee.nom}
                        </div>
                        <div className="text-sm text-gray-500">
                            {employee.matricule}
                        </div>
                        </div>
                    </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.fonction}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(employee.dateEmbauche)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(calculateNetSalary(employee))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(employee.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                        <button
                        onClick={() => onView(employee)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Voir les détails"
                        >
                        👁️
                        </button>
                        <button
                        onClick={() => onEdit(employee)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Modifier"
                        >
                        ✏️
                        </button>
                        <button
                        onClick={() => onDelete(employee.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Supprimer"
                        >
                        🗑️
                        </button>
                    </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>

        {/* Version mobile - cartes */}
        <div className="lg:hidden">
            <div className="divide-y divide-gray-200">
            {filteredAndSortedEmployees.map((employee) => (
                <div key={employee.id} className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                            {employee.prenom.charAt(0)}{employee.nom.charAt(0)}
                        </span>
                        </div>
                    </div>
                    <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                        {employee.prenom} {employee.nom}
                        </div>
                        <div className="text-sm text-gray-500">
                        {employee.matricule} • {employee.fonction}
                        </div>
                    </div>
                    </div>
                    <div className="flex space-x-2">
                    <button
                        onClick={() => onView(employee)}
                        className="text-blue-600 hover:text-blue-900"
                    >
                        👁️
                    </button>
                    <button
                        onClick={() => onEdit(employee)}
                        className="text-indigo-600 hover:text-indigo-900"
                    >
                        ✏️
                    </button>
                    <button
                        onClick={() => onDelete(employee.id)}
                        className="text-red-600 hover:text-red-900"
                    >
                        🗑️
                    </button>
                    </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                    <span className="text-gray-500">Embauché le:</span>
                    <div className="font-medium">{formatDate(employee.dateEmbauche)}</div>
                    </div>
                    <div>
                    <span className="text-gray-500">Salaire net:</span>
                    <div className="font-medium">{formatCurrency(calculateNetSalary(employee))}</div>
                    </div>
                </div>
                <div className="mt-2 flex justify-between items-center">
                    <div>{getStatusBadge(employee.status)}</div>
                </div>
                </div>
            ))}
            </div>
        </div>
        </div>
    )}
    </div>
)
}
