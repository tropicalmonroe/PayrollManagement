import React, { useState, useEffect } from 'react';
import { Layout } from '../../../components/Layout';
import { Eye, ArrowLeft, Search, Filter } from 'lucide-react';
import { useRouter } from 'next/router';
import { Employee, EmployeeStatus, SituationFamiliale } from '@prisma/client';
import EmployeeDetails from '../../../components/EmployeeDetails';


const EmployeeConsultationPage = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'nom' | 'dateEmbauche' | 'salaireBase'>('nom');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterAndSortEmployees();
  }, [employees, searchTerm, statusFilter, sortBy, sortOrder]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des employés:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortEmployees = () => {
    let filtered = employees.filter(employee => {
      const matchesSearch = 
        employee.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.fonction.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || employee.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortBy) {
        case 'nom':
          aValue = `${a.nom} ${a.prenom}`;
          bValue = `${b.nom} ${b.prenom}`;
          break;
        case 'dateEmbauche':
          aValue = new Date(a.dateEmbauche);
          bValue = new Date(b.dateEmbauche);
          break;
        case 'salaireBase':
          aValue = a.salaireBase;
          bValue = b.salaireBase;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredEmployees(filtered);
  };

  const handleView = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedEmployee(null);
  };

  const handleSort = (field: 'nom' | 'dateEmbauche' | 'salaireBase') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: 'nom' | 'dateEmbauche' | 'salaireBase') => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  const getStatusBadge = (status: EmployeeStatus) => {
    switch (status) {
      case 'ACTIF':
        return <span className="status-active">Actif</span>;
      case 'SUSPENDU':
        return <span className="status-pending">Suspendu</span>;
      case 'DEMISSIONNAIRE':
      case 'LICENCIE':
      case 'RETRAITE':
        return <span className="status-inactive">{status.charAt(0) + status.slice(1).toLowerCase()}</span>;
      default:
        return <span className="status-pending">{status}</span>;
    }
  };

  const getSituationFamiliale = (situation: SituationFamiliale) => {
    switch (situation) {
      case 'CELIBATAIRE':
        return 'Célibataire';
      case 'MARIE':
        return 'Marié(e)';
      case 'DIVORCE':
        return 'Divorcé(e)';
      case 'VEUF':
        return 'Veuf/Veuve';
      default:
        return situation;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Chargement...</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
          
          <div className="flex items-center space-x-3 mb-4">
            <Eye className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Consultation fiche salarié</h1>
          </div>
          
          <p className="text-gray-600 text-lg">
            Visualisation en lecture seule de la fiche complète du salarié (sans modification).
          </p>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Search className="w-4 h-4 inline mr-1" />
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
                <Filter className="w-4 h-4 inline mr-1" />
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
                {filteredEmployees.length} employé(s) trouvé(s)
              </div>
            </div>
          </div>
        </div>

        {/* Liste des employés */}
        {filteredEmployees.length === 0 ? (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center py-12">
                <Eye className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {searchTerm || statusFilter !== 'ALL' ? 'Aucun employé trouvé' : 'Aucun employé'}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'ALL' 
                    ? 'Essayez de modifier vos critères de recherche'
                    : 'Aucun employé disponible pour consultation'
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Situation familiale
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
                      Salaire de base {getSortIcon('salaireBase')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => (
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
                        {getSituationFamiliale(employee.situationFamiliale)}
                        {employee.nbrDeductions > 0 && (
                          <div className="text-xs text-gray-500">
                            {employee.nbrDeductions} déduction(s)
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(employee.dateEmbauche)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(employee.salaireBase)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(employee.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleView(employee)}
                          className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                          title="Consulter la fiche complète"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Consulter</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Version mobile - cartes */}
            <div className="lg:hidden">
              <div className="divide-y divide-gray-200">
                {filteredEmployees.map((employee) => (
                  <div key={employee.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
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
                      <button
                        onClick={() => handleView(employee)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Consulter"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Embauché le:</span>
                        <div className="font-medium">{formatDate(employee.dateEmbauche)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Salaire de base:</span>
                        <div className="font-medium">{formatCurrency(employee.salaireBase)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Situation:</span>
                        <div className="font-medium">{getSituationFamiliale(employee.situationFamiliale)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Statut:</span>
                        <div>{getStatusBadge(employee.status)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal pour les détails de l'employé (lecture seule) */}
        {showDetails && selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-7xl max-h-[95vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Consultation de la fiche salarié</h2>
                <button
                  onClick={handleCloseDetails}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <EmployeeDetails 
                employee={selectedEmployee} 
                onClose={handleCloseDetails}
                onEdit={() => {
                  // Pas d'édition en mode consultation
                  alert('Mode consultation uniquement. Utilisez la section "Fiche salarié" pour modifier.');
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EmployeeConsultationPage;
