import React, { useState, useEffect } from 'react';
import { Layout } from '../../../components/Layout';
import { TrendingUp, ArrowLeft, Plus } from 'lucide-react';
import { useRouter } from 'next/router';
import { Advance, Employee } from '@prisma/client';
import AddAdvanceModal from '../../../components/AddAdvanceModal';

type AdvanceWithEmployee = Advance & {
  employee: Employee;
};

const SalaryAdvancesPage = () => {
  const router = useRouter();
  const [advances, setAdvances] = useState<AdvanceWithEmployee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

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
        setEmployees(data.filter((emp: Employee) => emp.status === 'ACTIF'));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des employés:', error);
    }
  };

  const handleAddAdvance = async (advanceData: any) => {
    try {
      const response = await fetch('/api/advances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(advanceData),
      });

      if (response.ok) {
        const newAdvance = await response.json();
        setAdvances([newAdvance, ...advances]);
        setShowAddModal(false);
      } else {
        alert('Erreur lors de la création de l\'avance');
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'avance:', error);
      alert('Erreur lors de la création de l\'avance');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'EN_COURS':
        return <span className="status-pending">En cours</span>;
      case 'REMBOURSE':
        return <span className="status-active">Remboursé</span>;
      case 'ANNULE':
        return <span className="status-inactive">Annulé</span>;
      default:
        return <span className="status-pending">{statut}</span>;
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
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <h1 className="text-3xl font-bold text-gray-900">Avances sur salaire</h1>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle avance</span>
            </button>
          </div>
          
          <p className="text-gray-600 text-lg">
            Enregistrement des avances accordées, suivi, et intégration automatique dans la paie mensuelle.
          </p>
        </div>

        {/* Liste des avances */}
        {advances.length === 0 ? (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center py-12">
                <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Aucune avance enregistrée
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Commencez par enregistrer la première avance sur salaire
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle avance
                  </button>
                </div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employé
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date d'avance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mensualité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Solde restant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Motif
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {advances.map((advance) => (
                    <tr key={advance.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-green-600">
                                {advance.employee.prenom.charAt(0)}{advance.employee.nom.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {advance.employee.prenom} {advance.employee.nom}
                            </div>
                            <div className="text-sm text-gray-500">
                              {advance.employee.matricule}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(advance.montant)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(advance.dateAvance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(advance.montantMensualite)}
                        <div className="text-xs text-gray-500">
                          {advance.nombreMensualites} mensualités
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(advance.soldeRestant)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(advance.statut)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {advance.motif}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Version mobile - cartes */}
            <div className="lg:hidden">
              <div className="divide-y divide-gray-200">
                {advances.map((advance) => (
                  <div key={advance.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-green-600">
                              {advance.employee.prenom.charAt(0)}{advance.employee.nom.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {advance.employee.prenom} {advance.employee.nom}
                          </div>
                          <div className="text-sm text-gray-500">
                            {advance.employee.matricule}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(advance.statut)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Montant:</span>
                        <div className="font-medium">{formatCurrency(advance.montant)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Solde restant:</span>
                        <div className="font-medium">{formatCurrency(advance.soldeRestant)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Mensualité:</span>
                        <div className="font-medium">{formatCurrency(advance.montantMensualite)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <div className="font-medium">{formatDate(advance.dateAvance)}</div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-gray-500 text-sm">Motif:</span>
                      <div className="text-sm">{advance.motif}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal pour ajouter une avance */}
        {showAddModal && (
          <AddAdvanceModal
            isOpen={showAddModal}
            employees={employees}
            onSuccess={() => {
              fetchAdvances(); // Recharger la liste
              setShowAddModal(false);
            }}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </div>
    </Layout>
  );
};

export default SalaryAdvancesPage;
