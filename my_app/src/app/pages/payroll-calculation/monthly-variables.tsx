import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { Edit, ArrowLeft, Plus, Save, Calendar, User } from 'lucide-react';
import { useRouter } from 'next/router';
import { Employee, VariableElement } from '@prisma/client';
import AddVariableElementModal from '../../components/AddVariableElementModal';

type VariableElementWithEmployee = VariableElement & {
  employee: Employee;
};

const MonthlyVariablesPage = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [variableElements, setVariableElements] = useState<VariableElementWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedEmployee, setSelectedEmployee] = useState<string>('ALL');

  useEffect(() => {
    fetchEmployees();
    fetchVariableElements();
  }, [selectedMonth]);

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

  const fetchVariableElements = async () => {
    try {
      const response = await fetch(`/api/variable-elements?month=${selectedMonth}`);
      if (response.ok) {
        const data = await response.json();
        setVariableElements(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des éléments variables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVariable = async (variableData: any) => {
    try {
      const response = await fetch('/api/variable-elements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...variableData,
          mois: selectedMonth,
        }),
      });

      if (response.ok) {
        const newVariable = await response.json();
        setVariableElements([newVariable, ...variableElements]);
        setShowAddModal(false);
      } else {
        alert('Erreur lors de la création de l\'élément variable');
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'élément variable:', error);
      alert('Erreur lors de la création de l\'élément variable');
    }
  };

  const handleDeleteVariable = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet élément variable ?')) {
      try {
        const response = await fetch(`/api/variable-elements/${id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setVariableElements(variableElements.filter(v => v.id !== id));
        } else {
          alert('Erreur lors de la suppression');
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression');
      }
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'HEURES_SUP':
        return 'Heures supplémentaires';
      case 'ABSENCE':
        return 'Absence';
      case 'PRIME':
        return 'Prime exceptionnelle';
      case 'CONGE':
        return 'Congé';
      case 'RETARD':
        return 'Retard';
      case 'AVANCE':
        return 'Avance';
      case 'AUTRE':
        return 'Autre';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'HEURES_SUP':
        return 'bg-blue-100 text-blue-800';
      case 'ABSENCE':
        return 'bg-red-100 text-red-800';
      case 'PRIME':
        return 'bg-green-100 text-green-800';
      case 'CONGE':
        return 'bg-yellow-100 text-yellow-800';
      case 'RETARD':
        return 'bg-orange-100 text-orange-800';
      case 'AVANCE':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredVariables = variableElements.filter(variable => 
    selectedEmployee === 'ALL' || variable.employeeId === selectedEmployee
  );

  const getMonthLabel = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long'
    }).format(date);
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
              <Edit className="w-8 h-8 text-orange-600" />
              <h1 className="text-3xl font-bold text-gray-900">Éléments variables mensuels</h1>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvel élément</span>
            </button>
          </div>
          
          <p className="text-gray-600 text-lg">
            Saisie mensuelle des variables : heures sup., absences, primes exceptionnelles, congés, retards, avances.
          </p>
        </div>

        {/* Filtres */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Mois
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="payroll-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="w-4 h-4 inline mr-1" />
                Employé
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="payroll-input"
              >
                <option value="ALL">Tous les employés</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.prenom} {employee.nom} - {employee.matricule}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                {filteredVariables.length} élément(s) pour {getMonthLabel(selectedMonth)}
              </div>
            </div>
          </div>
        </div>

        {/* Liste des éléments variables */}
        {filteredVariables.length === 0 ? (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center py-12">
                <Edit className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Aucun élément variable pour {getMonthLabel(selectedMonth)}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Commencez par ajouter les éléments variables du mois (heures sup., absences, primes, etc.)
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvel élément
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
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantité/Heures
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVariables.map((variable) => (
                    <tr key={variable.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-orange-600">
                                {variable.employee.prenom.charAt(0)}{variable.employee.nom.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {variable.employee.prenom} {variable.employee.nom}
                            </div>
                            <div className="text-sm text-gray-500">
                              {variable.employee.matricule}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(variable.type)}`}>
                          {getTypeLabel(variable.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        {variable.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {variable.heures || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {variable.montant ? formatCurrency(variable.montant) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(variable.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteVariable(variable.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
                        >
                          🗑️
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
                {filteredVariables.map((variable) => (
                  <div key={variable.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-orange-600">
                              {variable.employee.prenom.charAt(0)}{variable.employee.nom.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {variable.employee.prenom} {variable.employee.nom}
                          </div>
                          <div className="text-sm text-gray-500">
                            {variable.employee.matricule}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteVariable(variable.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(variable.type)}`}>
                        {getTypeLabel(variable.type)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Description:</span>
                        <div className="font-medium">{variable.description}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <div className="font-medium">{formatDate(variable.date)}</div>
                      </div>
                      {variable.heures && (
                        <div>
                          <span className="text-gray-500">Heures:</span>
                          <div className="font-medium">{variable.heures}</div>
                        </div>
                      )}
                      {variable.montant && (
                        <div>
                          <span className="text-gray-500">Montant:</span>
                          <div className="font-medium">{formatCurrency(variable.montant)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Résumé par employé */}
        {filteredVariables.length > 0 && selectedEmployee === 'ALL' && (
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Résumé par employé pour {getMonthLabel(selectedMonth)}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees
                .filter(emp => variableElements.some(v => v.employeeId === emp.id))
                .map((employee) => {
                  const employeeVariables = variableElements.filter(v => v.employeeId === employee.id);
                  const totalMontant = employeeVariables.reduce((sum, v) => sum + (v.montant || 0), 0);
                  
                  return (
                    <div key={employee.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-orange-600">
                              {employee.prenom.charAt(0)}{employee.nom.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.prenom} {employee.nom}
                          </div>
                          <div className="text-xs text-gray-500">
                            {employee.matricule}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Éléments:</span>
                          <span className="font-medium">{employeeVariables.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total montant:</span>
                          <span className="font-medium">{formatCurrency(totalMontant)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Modal pour ajouter un élément variable */}
        {showAddModal && (
          <AddVariableElementModal
            isOpen={showAddModal}
            employees={employees}
            onSuccess={() => {
              fetchVariableElements();
              setShowAddModal(false);
            }}
            onClose={() => setShowAddModal(false)}
            defaultMonth={selectedMonth.split('-')[1]}
            defaultYear={selectedMonth.split('-')[0]}
          />
        )}
      </div>
    </Layout>
  );
};

export default MonthlyVariablesPage;
