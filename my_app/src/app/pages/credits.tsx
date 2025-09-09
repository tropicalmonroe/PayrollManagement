import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import AddCreditModal from '../../components/AddCreditModal';
import CreditScheduledPayment from '../../components/CreditScheduledPayment';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Eye,
  CreditCard,
  DollarSign,
  Calendar,
  Building,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText
} from 'lucide-react';

// Types
type CreditType = 'LOGEMENT' | 'CONSOMMATION';
type CreditStatus = 'ACTIF' | 'SOLDE' | 'SUSPENDU';

interface Employee {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  fonction: string;
}

interface Credit {
  id: string;
  employee: Employee;
  type: CreditType;
  montantCredit: number;
  tauxInteret: number;
  dureeAnnees: number;
  mensualite: number;
  dateDebut: Date;
  dateFin: Date;
  soldeRestant: number;
  montantRembourse: number;
  statut: CreditStatus;
  banque: string;
  numeroCompte?: string;
  notes?: string;
  interetsPayes: number;
  capitalRestant: number;
  createdAt: Date;
}

const CreditManagement: React.FC = () => {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<CreditStatus | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<CreditType | 'ALL'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [newMontantRembourse, setNewMontantRembourse] = useState('');
  const [showEcheancier, setShowEcheancier] = useState(false);
  const [selectedCreditForEcheancier, setSelectedCreditForEcheancier] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    fetchCredits();
    fetchEmployees();
  }, []);

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/credits');
      if (response.ok) {
        const data = await response.json();
        setCredits(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des crédits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des employés:', error);
    }
  };

  // Filter credits
  const filteredCredits = credits.filter(credit => {
    const matchesSearch = 
      credit.employee.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credit.employee.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credit.employee.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credit.banque.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || credit.statut === filterStatus;
    const matchesType = filterType === 'ALL' || credit.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  // Get status badge
  const getStatusBadge = (status: CreditStatus) => {
    const badges = {
      ACTIF: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Actif' },
      SOLDE: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle, text: 'Soldé' },
      SUSPENDU: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Suspendu' }
    };
    
    const badge = badges[status];
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  // Get type badge
  const getTypeBadge = (type: CreditType) => {
    const badges = {
      LOGEMENT: { color: 'bg-blue-100 text-blue-800', text: 'Logement' },
      CONSOMMATION: { color: 'bg-purple-100 text-purple-800', text: 'Consommation' }
    };
    
    const badge = badges[type];
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  // Calculate progress percentage - utilise la progression calculée si disponible
  const getProgressPercentage = (credit: any) => {
    if (credit.progressionCalculee) {
      return credit.progressionCalculee.progressionPourcentage;
    }
    return ((credit.montantRembourse / credit.montantCredit) * 100);
  };

  // Get progress info for display
  const getProgressInfo = (credit: any) => {
    if (credit.progressionCalculee) {
      return {
        percentage: credit.progressionCalculee.progressionPourcentage,
        isLate: credit.progressionCalculee.enRetard,
        monthsLate: credit.progressionCalculee.moisRetard,
        monthsElapsed: credit.progressionCalculee.mensualitesEcoulees,
        amountDue: credit.progressionCalculee.montantRembourseDu
      };
    }
    
    // Fallback si pas de progression calculée
    const percentage = Math.min(100, (credit.montantRembourse / credit.montantCredit) * 100);
    return {
      percentage: percentage,
      isLate: false,
      monthsLate: 0,
      monthsElapsed: 0,
      amountDue: 0
    };
  };

  // Handle delete credit
  const handleDeleteCredit = async (creditId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce crédit ?')) {
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/credits/${creditId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCredits(); // Refresh the list
        alert('Crédit supprimé avec succès');
      } else {
        alert('Erreur lors de la suppression du crédit');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du crédit');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0063b4]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Crédits</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gérez les crédits logement et consommation des employés
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0063b4] hover:bg-[#0052a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0063b4]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Crédit
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CreditCard className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Crédits
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {credits.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Crédits Actifs
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {credits.filter(c => c.statut === 'ACTIF').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Montant Total
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(credits.reduce((sum, c) => sum + c.montantCredit, 0))}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Solde Restant
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(credits.reduce((sum, c) => sum + c.soldeRestant, 0))}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm"
                    placeholder="Rechercher par nom, matricule ou banque..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex space-x-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as CreditStatus | 'ALL')}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm rounded-md"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="ACTIF">Actif</option>
                  <option value="SOLDE">Soldé</option>
                  <option value="SUSPENDU">Suspendu</option>
                </select>
                
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as CreditType | 'ALL')}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm rounded-md"
                >
                  <option value="ALL">Tous les types</option>
                  <option value="LOGEMENT">Logement</option>
                  <option value="CONSOMMATION">Consommation</option>
                </select>
              </div>
            </div>
          </div>

          {/* Credits Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employé
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mensualité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progression
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banque
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCredits.map((credit) => (
                  <tr key={credit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {credit.employee.prenom} {credit.employee.nom}
                          </div>
                          <div className="text-sm text-gray-500">
                            {credit.employee.matricule} • {credit.employee.fonction}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(credit.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(credit.montantCredit)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Restant: {formatCurrency(credit.soldeRestant)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(credit.mensualite)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const progressInfo = getProgressInfo(credit);
                        return (
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className={`h-2 rounded-full ${progressInfo.isLate ? 'bg-red-500' : 'bg-[#0063b4]'}`}
                                style={{ width: `${Math.min(progressInfo.percentage, 100)}%` }}
                              ></div>
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-sm ${progressInfo.isLate ? 'text-red-600' : 'text-gray-600'}`}>
                                {Math.round(progressInfo.percentage)}%
                              </span>
                              {progressInfo.isLate && progressInfo.monthsLate > 0 && (
                                <span className="text-xs text-red-500">
                                  {progressInfo.monthsLate} mois retard
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(credit.statut)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {credit.banque}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedCreditForEcheancier(credit.id);
                            setShowEcheancier(true);
                          }}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded"
                          title="Voir l'échéancier"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCredit(credit);
                            setShowAddModal(false); // Fermer le modal d'ajout s'il est ouvert
                            setShowEditModal(false); // Fermer le modal d'édition s'il est ouvert
                            setShowDetailsModal(true);
                          }}
                          className="text-[#0063b4] hover:text-[#0052a3] p-1 rounded"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCredit(credit);
                            setShowAddModal(false); // Fermer le modal d'ajout s'il est ouvert
                            setShowDetailsModal(false); // Fermer le modal de détails s'il est ouvert
                            setShowEditModal(true);
                          }}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCredit(credit.id)}
                          disabled={deleteLoading}
                          className="text-red-600 hover:text-red-900 p-1 rounded disabled:opacity-50"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCredits.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun crédit trouvé</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterStatus !== 'ALL' || filterType !== 'ALL'
                  ? 'Aucun crédit ne correspond aux critères de recherche.'
                  : 'Commencez par ajouter un nouveau crédit.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Credit Modal */}
      <AddCreditModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          fetchCredits();
          setShowAddModal(false);
        }}
        employees={employees}
      />

      {/* Credit Details Modal */}
      {showDetailsModal && selectedCredit && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Détails du Crédit
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Employé</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedCredit.employee.prenom} {selectedCredit.employee.nom}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedCredit.employee.matricule} • {selectedCredit.employee.fonction}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type de Crédit</label>
                    <div className="mt-1">
                      {getTypeBadge(selectedCredit.type)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Montant du Crédit</label>
                    <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedCredit.montantCredit)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Taux d'Intérêt</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedCredit.tauxInteret}%</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Durée</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedCredit.dureeAnnees} années</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mensualité</label>
                    <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedCredit.mensualite)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date de Début</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedCredit.dateDebut)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date de Fin</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedCredit.dateFin)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Montant Remboursé</label>
                    <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedCredit.montantRembourse)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Solde Restant</label>
                    <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedCredit.soldeRestant)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Statut</label>
                    <div className="mt-1">
                      {getStatusBadge(selectedCredit.statut)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Banque</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedCredit.banque}</p>
                  </div>
                </div>
                
                {selectedCredit.numeroCompte && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Numéro de Compte</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedCredit.numeroCompte}</p>
                  </div>
                )}
                
                {selectedCredit.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedCredit.notes}</p>
                  </div>
                )}
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Progression du Remboursement</label>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-3 mr-3">
                      <div 
                        className="bg-[#0063b4] h-3 rounded-full" 
                        style={{ width: `${Math.min(getProgressPercentage(selectedCredit), 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 min-w-[3rem]">
                      {Math.round(getProgressPercentage(selectedCredit))}%
                    </span>
                  </div>
                </div>

                {/* Section de mise à jour du montant remboursé */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Mettre à jour le montant remboursé</h4>
                  <div className="flex items-end space-x-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Nouveau montant remboursé (MAD)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={selectedCredit.montantCredit}
                        value={newMontantRembourse}
                        onChange={(e) => setNewMontantRembourse(e.target.value)}
                        placeholder={selectedCredit.montantRembourse.toString()}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4]"
                      />
                    </div>
                    <button
                      onClick={async () => {
                        if (!newMontantRembourse || parseFloat(newMontantRembourse) < 0) {
                          alert('Veuillez entrer un montant valide');
                          return;
                        }

                        setUpdateLoading(true);
                        try {
                          const response = await fetch('/api/credits/update-progress', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              creditId: selectedCredit.id,
                              montantRembourse: parseFloat(newMontantRembourse)
                            }),
                          });

                          if (response.ok) {
                            await fetchCredits(); // Refresh the list
                            setNewMontantRembourse('');
                            alert('Montant remboursé mis à jour avec succès');
                            setShowDetailsModal(false);
                          } else {
                            const error = await response.json();
                            alert(`Erreur: ${error.error}`);
                          }
                        } catch (error) {
                          console.error('Erreur lors de la mise à jour:', error);
                          alert('Erreur lors de la mise à jour du montant');
                        } finally {
                          setUpdateLoading(false);
                        }
                      }}
                      disabled={updateLoading || !newMontantRembourse}
                      className="px-4 py-2 bg-[#0063b4] text-white text-sm rounded-md hover:bg-[#0052a3] focus:outline-none focus:ring-2 focus:ring-[#0063b4] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updateLoading ? 'Mise à jour...' : 'Mettre à jour'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Montant actuel: {formatCurrency(selectedCredit.montantRembourse)} / {formatCurrency(selectedCredit.montantCredit)}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Credit Modal */}
      {showEditModal && selectedCredit && (
        <AddCreditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCredit(null);
          }}
          onSuccess={() => {
            fetchCredits();
            setShowEditModal(false);
            setSelectedCredit(null);
          }}
          employees={employees}
          editCredit={selectedCredit}
        />
      )}

      {/* Credit Echeancier Modal */}
      {selectedCreditForEcheancier && (
        <CreditScheduledPayment
          creditId={selectedCreditForEcheancier}
          isOpen={showEcheancier}
          onClose={() => {
            setShowEcheancier(false);
            setSelectedCreditForEcheancier(null);
          }}
        />
      )}
    </Layout>
  );
};

export default CreditManagement;
