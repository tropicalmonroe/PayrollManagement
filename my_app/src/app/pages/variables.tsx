import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Layout } from '../../components/Layout';
import AddVariableElementModal from '../../components/AddVariableElementModal';
import { Employee, VariableElement } from '@prisma/client';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  DollarSign, 
  User, 
  Edit, 
  Trash2,
  FileText,
  AlertCircle
} from 'lucide-react';

interface VariableElementWithEmployee extends VariableElement {
  employee: {
    id: string;
    matricule: string;
    nom: string;
    prenom: string;
    fonction: string;
  };
}

export default function VariablesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [variableElements, setVariableElements] = useState<VariableElementWithEmployee[]>([]);
  const [filteredElements, setFilteredElements] = useState<VariableElementWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingElement, setEditingElement] = useState<VariableElementWithEmployee | null>(null);
  
  // Filtres
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Initialiser avec le mois et l'année actuels
  useEffect(() => {
    const now = new Date();
    setSelectedMonth((now.getMonth() + 1).toString().padStart(2, '0'));
    setSelectedYear(now.getFullYear().toString());
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchVariableElements();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [variableElements, selectedMonth, selectedYear, selectedEmployee, selectedType, searchTerm]);

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
      setLoading(true);
      const response = await fetch('/api/variable-elements');
      if (response.ok) {
        const data = await response.json();
        setVariableElements(data);
      } else {
        throw new Error('Erreur lors du chargement des éléments variables');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Impossible de charger les éléments variables');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...variableElements];

    if (selectedMonth && selectedYear) {
      filtered = filtered.filter(element => 
        element.mois === selectedMonth && element.annee === selectedYear
      );
    }

    if (selectedEmployee) {
      filtered = filtered.filter(element => element.employeeId === selectedEmployee);
    }

    if (selectedType) {
      filtered = filtered.filter(element => element.type === selectedType);
    }

    if (searchTerm) {
      filtered = filtered.filter(element =>
        element.employee.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        element.employee.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        element.employee.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
        element.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredElements(filtered);
  };

  const handleAddElement = () => {
    setEditingElement(null);
    setShowAddModal(true);
  };

  const handleEditElement = (element: VariableElementWithEmployee) => {
    setEditingElement(element);
    setShowAddModal(true);
  };

  const handleDeleteElement = async (elementId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément variable ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/variable-elements/${elementId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchVariableElements();
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression de l\'élément variable');
    }
  };

  const handleModalSuccess = () => {
    setShowAddModal(false);
    setEditingElement(null);
    fetchVariableElements();
  };

  const getTypeLabel = (type: string) => {
    const types = {
      'HEURES_SUP': 'Heures supplémentaires',
      'ABSENCE': 'Absence',
      'PRIME_EXCEPTIONNELLE': 'Prime exceptionnelle',
      'CONGE': 'Congé',
      'RETARD': 'Retard',
      'AVANCE': 'Avance',
      'AUTRE': 'Autre'
    };
    return types[type as keyof typeof types] || type;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'HEURES_SUP': return <Clock className="w-4 h-4 text-green-600" />;
      case 'ABSENCE': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'PRIME_EXCEPTIONNELLE': return <DollarSign className="w-4 h-4 text-blue-600" />;
      case 'CONGE': return <Calendar className="w-4 h-4 text-purple-600" />;
      case 'RETARD': return <Clock className="w-4 h-4 text-orange-600" />;
      case 'AVANCE': return <DollarSign className="w-4 h-4 text-indigo-600" />;
      default: return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  };

  const months = [
    { value: '01', label: 'Janvier' },
    { value: '02', label: 'Février' },
    { value: '03', label: 'Mars' },
    { value: '04', label: 'Avril' },
    { value: '05', label: 'Mai' },
    { value: '06', label: 'Juin' },
    { value: '07', label: 'Juillet' },
    { value: '08', label: 'Août' },
    { value: '09', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' }
  ];

  const years = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - 5 + i;
    return year.toString();
  });

  const elementTypes = [
    { value: 'HEURES_SUP', label: 'Heures supplémentaires' },
    { value: 'ABSENCE', label: 'Absence' },
    { value: 'PRIME_EXCEPTIONNELLE', label: 'Prime exceptionnelle' },
    { value: 'CONGE', label: 'Congé' },
    { value: 'RETARD', label: 'Retard' },
    { value: 'AVANCE', label: 'Avance' },
    { value: 'AUTRE', label: 'Autre' }
  ];

  return (
    <>
      <Head>
        <title>Éléments variables mensuels - AD Capital</title>
        <meta name="description" content="Gestion des éléments variables de paie" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Éléments variables mensuels</h2>
              <p className="mt-1 text-sm text-gray-600">
                Gestion des variables de paie : heures sup., absences, primes, congés, retards, avances
              </p>
            </div>
            <button
              onClick={handleAddElement}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0063b4] hover:bg-[#0052a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0063b4]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un élément
            </button>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filtres</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mois
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm"
                >
                  <option value="">Tous les mois</option>
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Année
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm"
                >
                  <option value="">Toutes les années</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employé
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm"
                >
                  <option value="">Tous les employés</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.prenom} {employee.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm"
                >
                  <option value="">Tous les types</option>
                  {elementTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recherche
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0063b4] focus:border-[#0063b4] sm:text-sm"
                    placeholder="Rechercher par employé ou description..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Liste des éléments variables */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Éléments variables ({filteredElements.length})
              </h3>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-500">Chargement des éléments variables...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={fetchVariableElements}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Réessayer
                </button>
              </div>
            ) : filteredElements.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun élément variable</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {selectedMonth && selectedYear 
                    ? `Aucun élément variable pour ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
                    : 'Commencez par ajouter des éléments variables de paie'
                  }
                </p>
                <button
                  onClick={handleAddElement}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0063b4] hover:bg-[#0052a3]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un élément
                </button>
              </div>
            ) : (
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
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Période
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant/Heures
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
                    {filteredElements.map((element) => (
                      <tr key={element.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-600">
                                  {element.employee.prenom.charAt(0)}{element.employee.nom.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {element.employee.prenom} {element.employee.nom}
                              </div>
                              <div className="text-sm text-gray-500">
                                {element.employee.matricule}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getTypeIcon(element.type)}
                            <span className="ml-2 text-sm text-gray-900">
                              {getTypeLabel(element.type)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{element.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {months.find(m => m.value === element.mois)?.label} {element.annee}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {element.heures ? `${element.heures}h` : formatCurrency(element.montant)}
                            {element.taux && (
                              <div className="text-xs text-gray-500">
                                Taux: {formatCurrency(element.taux)}/h
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(element.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEditElement(element)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteElement(element.id)}
                              className="text-red-600 hover:text-red-900"
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
            )}
          </div>
        </div>

        {/* Modal d'ajout/modification */}
        {showAddModal && (
          <AddVariableElementModal
            isOpen={showAddModal}
            onClose={() => {
              setShowAddModal(false);
              setEditingElement(null);
            }}
            onSuccess={handleModalSuccess}
            employees={employees}
            editElement={editingElement}
            defaultMonth={selectedMonth}
            defaultYear={selectedYear}
          />
        )}
      </Layout>
    </>
  );
}
