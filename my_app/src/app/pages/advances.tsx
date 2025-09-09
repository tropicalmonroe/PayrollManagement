import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import AddAdvanceModal from '../../components/AddAdvanceModal';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Eye,
  DollarSign,
  Calendar,
  Building,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

// Types
type AdvanceStatus = 'EN_COURS' | 'REMBOURSE' | 'ANNULE';

interface Employee {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  fonction: string;
}

interface Advance {
  id: string;
  employee: Employee;
  montant: number;
  dateAvance: Date;
  motif: string;
  nombreMensualites: number;
  montantMensualite: number;
  soldeRestant: number;
  statut: AdvanceStatus;
  dateCreation: Date;
  createdBy: string;
  dateRemboursementComplete?: Date;
  notes?: string;
  createdAt: Date;
}

const AdvanceManagement: React.FC = () => {
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<AdvanceStatus | 'ALL'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<Advance | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [newSoldeRestant, setNewSoldeRestant] = useState('');

  // Fetch data
  useEffect(() => {
    fetchAdvances();
    fetchEmployees();
  }, []);

  const fetchAdvances = async () => {
    try {
      const response = await fetch('/api/advances');
      if (response.ok) {
        const data = await response.json();
        setAdvances(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des avances:', error);
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

  // Filter advances
  const filteredAdvances = advances.filter(advance => {
    const matchesSearch = 
      advance.employee.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      advance.employee.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      advance.employee.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      advance.motif.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || advance.statut === filterStatus;
    
    return matchesSearch && matchesStatus;
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
  const getStatusBadge = (status: AdvanceStatus) => {
    const badges = {
      EN_COURS: { color: 'bg-blue-100 text-blue-800', icon: Clock, text: 'En cours' },
      REMBOURSE: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Remboursé' },
      ANNULE: { color: 'bg-red-100 text-red-800', icon: AlertCircle, text: 'Annulé' }
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

  // Calculate progress percentage
  const getProgressPercentage = (advance: Advance) => {
    const montantRembourse = advance.montant - advance.soldeRestant;
    return ((montantRembourse / advance.montant) * 100);
  };

  // Get progress info for display
  const getProgressInfo = (advance: Advance) => {
    const montantRembourse = advance.montant - advance.soldeRestant;
    const percentage = Math.min(100, (montantRembourse / advance.montant) * 100);
    
    // Calculate expected progress based on time elapsed
    const dateDebut = new Date(advance.dateAvance);
    const now = new Date();
    const monthsElapsed = Math.floor((now.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const expectedProgress = Math.min(100, (monthsElapsed / advance.nombreMensualites) * 100);
    const isLate = percentage < expectedProgress && advance.statut === 'EN_COURS';
    
    return {
      percentage: percentage,
      isLate: isLate,
      monthsElapsed: monthsElapsed,
      expectedProgress: expectedProgress
    };
  };

  // Handle delete advance
  const handleDeleteAdvance = async (advanceId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette avance ?')) {
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/advances/${advanceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchAdvances(); // Refresh the list
        alert('Avance supprimée avec succès');
      } else {
        alert('Erreur lors de la suppression de l\'avance');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de l\'avance');
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
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Avances sur Salaire</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gérez les avances sur salaire des employés
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0063b4] hover:bg-[#0052a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0063b4]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Avance
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Avances
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {advances.length}
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
                  <Clock className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      En Cours
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {advances.filter(a => a.statut === 'EN_COURS').length}
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
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Montant Total
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(advances.reduce((sum, a) => sum + a.montant, 0))}
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
                      {formatCurrency(advances.reduce((sum, a) => sum + a.soldeRestant, 0))}
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
                    placeholder="Rechercher par nom, matricule ou motif..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex space-x-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as AdvanceStatus | 'ALL')}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm rounded-md"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="REMBOURSE">Remboursé</option>
                  <option value="ANNULE">Annulé</option>
                </select>
              </div>
            </div>
          </div>

          {/* Advances Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employé
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
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motif
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAdvances.map((advance) => (
                  <tr key={advance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {advance.employee.prenom} {advance.employee.nom}
                          </div>
                          <div className="text-sm text-gray-500">
                            {advance.employee.matricule} • {advance.employee.fonction}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(advance.montant)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Restant: {formatCurrency(advance.soldeRestant)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(advance.montantMensualite)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const progressInfo = getProgressInfo(advance);
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
                              {progressInfo.isLate && (
                                <span className="text-xs text-red-500">
                                  En retard
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(advance.statut)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(advance.dateAvance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="max-w-32 truncate" title={advance.motif}>
                        {advance.motif}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedAdvance(advance);
                            setShowAddModal(false);
                            setShowEditModal(false);
                            setShowDetailsModal(true);
                          }}
                          className="text-[#0063b4] hover:text-[#0052a3] p-1 rounded"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAdvance(advance);
                            setShowAddModal(false);
                            setShowDetailsModal(false);
                            setShowEditModal(true);
                          }}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAdvance(advance.id)}
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

          {filteredAdvances.length === 0 && (
            <div className="text-center py-12">
              <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune avance trouvée</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterStatus !== 'ALL'
                  ? 'Aucune avance ne correspond aux critères de recherche.'
                  : 'Commencez par ajouter une nouvelle avance.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Advance Modal */}
      <AddAdvanceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          fetchAdvances();
          setShowAddModal(false);
        }}
        employees={employees}
      />

      {/* Advance Details Modal */}
      {showDetailsModal && selectedAdvance && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Détails de l'Avance
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
                      {selectedAdvance.employee.prenom} {selectedAdvance.employee.nom}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedAdvance.employee.matricule} • {selectedAdvance.employee.fonction}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Montant de l'Avance</label>
                    <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedAdvance.montant)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date de l'Avance</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedAdvance.dateAvance)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre de Mensualités</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAdvance.nombreMensualites} mois</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mensualité</label>
                    <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedAdvance.montantMensualite)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Solde Restant</label>
                    <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedAdvance.soldeRestant)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Statut</label>
                    <div className="mt-1">
                      {getStatusBadge(selectedAdvance.statut)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Motif</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAdvance.motif}</p>
                  </div>
                </div>
                
                {selectedAdvance.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAdvance.notes}</p>
                  </div>
                )}
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Progression du Remboursement</label>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-3 mr-3">
                      <div 
                        className="bg-[#0063b4] h-3 rounded-full" 
                        style={{ width: `${Math.min(getProgressPercentage(selectedAdvance), 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 min-w-[3rem]">
                      {Math.round(getProgressPercentage(selectedAdvance))}%
                    </span>
                  </div>
                </div>

                {/* Section de mise à jour du solde restant */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Mettre à jour le solde restant</h4>
                  <div className="flex items-end space-x-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Nouveau solde restant (MAD)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={selectedAdvance.montant}
                        value={newSoldeRestant}
                        onChange={(e) => setNewSoldeRestant(e.target.value)}
                        placeholder={selectedAdvance.soldeRestant.toString()}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4]"
                      />
                    </div>
                    <button
                      onClick={async () => {
                        if (!newSoldeRestant || parseFloat(newSoldeRestant) < 0) {
                          alert('Veuillez entrer un montant valide');
                          return;
                        }

                        setUpdateLoading(true);
                        try {
                          const response = await fetch('/api/advances/update-progress', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              advanceId: selectedAdvance.id,
                              soldeRestant: parseFloat(newSoldeRestant)
                            }),
                          });

                          if (response.ok) {
                            await fetchAdvances(); // Refresh the list
                            setNewSoldeRestant('');
                            alert('Solde restant mis à jour avec succès');
                            setShowDetailsModal(false);
                          } else {
                            const error = await response.json();
                            alert(`Erreur: ${error.error}`);
                          }
                        } catch (error) {
                          console.error('Erreur lors de la mise à jour:', error);
                          alert('Erreur lors de la mise à jour du solde');
                        } finally {
                          setUpdateLoading(false);
                        }
                      }}
                      disabled={updateLoading || !newSoldeRestant}
                      className="px-4 py-2 bg-[#0063b4] text-white text-sm rounded-md hover:bg-[#0052a3] focus:outline-none focus:ring-2 focus:ring-[#0063b4] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updateLoading ? 'Mise à jour...' : 'Mettre à jour'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Solde actuel: {formatCurrency(selectedAdvance.soldeRestant)} / {formatCurrency(selectedAdvance.montant)}
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

      {/* Edit Advance Modal */}
      {showEditModal && selectedAdvance && (
        <AddAdvanceModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAdvance(null);
          }}
          onSuccess={() => {
            fetchAdvances();
            setShowEditModal(false);
            setSelectedAdvance(null);
          }}
          employees={employees}
          editAdvance={selectedAdvance}
        />
      )}
    </Layout>
  );
};

export default AdvanceManagement;
