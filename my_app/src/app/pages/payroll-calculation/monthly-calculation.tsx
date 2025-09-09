import React, { useState, useEffect } from 'react';
import { Layout } from '../../../components/Layout';
import { Play, ArrowLeft, Calculator, Users, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/router';
import { Employee } from '@prisma/client';
import { calculerPaie, type EmployeePayrollData } from '../../../lib/payrollCalculations';

interface PayrollCalculationResult {
  employeeId: string;
  employee: Employee;
  success: boolean;
  error?: string;
  calculation?: any;
}

const MonthlyCalculationPage = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [calculationResults, setCalculationResults] = useState<PayrollCalculationResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        const activeEmployees = data.filter((emp: Employee) => emp.status === 'ACTIF');
        setEmployees(activeEmployees);
        // Sélectionner tous les employés actifs par défaut
        setSelectedEmployees(activeEmployees.map((emp: Employee) => emp.id));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des employés:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(emp => emp.id));
    }
  };

  const getSeniorityInYears = (hireDate: Date) => {
    const today = new Date();
    const hire = new Date(hireDate);
    const years = today.getFullYear() - hire.getFullYear();
    const months = today.getMonth() - hire.getMonth();
    
    let totalMonths = years * 12 + months;
    if (today.getDate() < hire.getDate()) {
      totalMonths--;
    }
    
    return totalMonths / 12;
  };

  const handleCalculatePayroll = async () => {
    if (selectedEmployees.length === 0) {
      alert('Veuillez sélectionner au moins un employé');
      return;
    }

    setCalculating(true);
    setCalculationResults([]);
    setShowResults(true);

    const results: PayrollCalculationResult[] = [];

    for (const employeeId of selectedEmployees) {
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) continue;

      try {
        // Préparer les données de l'employé pour le calcul
        const employeeData: EmployeePayrollData = {
          nom: employee.nom,
          prenom: employee.prenom,
          matricule: employee.matricule,
          cin: employee.cin || '',
          cnss: employee.cnss || '',
          situationFamiliale: employee.situationFamiliale,
          dateNaissance: employee.dateNaissance || new Date(),
          dateEmbauche: employee.dateEmbauche,
          anciennete: getSeniorityInYears(employee.dateEmbauche),
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
        };

        // Calculer la paie directement
        const payrollResult = calculerPaie(employeeData);
        
        // Convertir le résultat au format attendu
        const calculation = {
          totalGains: payrollResult.salaireBrut,
          totalRetenues: payrollResult.totalRetenues,
          impotRevenu: payrollResult.calculIGR.impotSurRevenu,
          salaireNetAPayer: payrollResult.salaireNetAPayer,
          cotisationsSalariales: payrollResult.cotisationsSalariales.totalCotisationsSalariales,
          cotisationsPatronales: payrollResult.cotisationsPatronales.totalCotisationsPatronales,
          coutTotalEmployeur: payrollResult.coutTotalEmployeur,
        };

        results.push({
          employeeId,
          employee,
          success: true,
          calculation,
        });
      } catch (error) {
        console.error(`Erreur lors du calcul pour ${employee.prenom} ${employee.nom}:`, error);
        results.push({
          employeeId,
          employee,
          success: false,
          error: error instanceof Error ? error.message : 'Erreur lors du calcul',
        });
      }

      // Mettre à jour les résultats en temps réel
      setCalculationResults([...results]);
      
      // Petite pause pour l'effet visuel
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setCalculating(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getMonthLabel = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long'
    }).format(date);
  };

  const successfulCalculations = calculationResults.filter(r => r.success);
  const failedCalculations = calculationResults.filter(r => !r.success);

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
            <Play className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Calcul mensuel</h1>
          </div>
          
          <p className="text-gray-600 text-lg">
            Lancement automatique du calcul de paie avec application des barèmes, cotisations sociales et fiscales selon la situation de chaque salarié.
          </p>
        </div>

        {!showResults ? (
          <>
            {/* Configuration du calcul */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration du calcul</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Période de calcul
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="payroll-input"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Calcul pour {getMonthLabel(selectedMonth)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employés sélectionnés
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {selectedEmployees.length} / {employees.length} employés
                  </div>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-800 mt-1"
                  >
                    {selectedEmployees.length === employees.length ? 'Désélectionner tout' : 'Sélectionner tout'}
                  </button>
                </div>
              </div>
            </div>

            {/* Liste des employés */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Sélection des employés ({employees.length} employés actifs)
                </h3>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {employees.map((employee) => (
                  <div key={employee.id} className="px-6 py-4 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`employee-${employee.id}`}
                        checked={selectedEmployees.includes(employee.id)}
                        onChange={() => handleEmployeeSelection(employee.id)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`employee-${employee.id}`} className="ml-3 flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-green-600">
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
                          <div className="text-sm text-gray-500">
                            {formatCurrency(employee.salaireBase)}
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bouton de lancement */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Lancer le calcul</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Le calcul sera effectué pour {selectedEmployees.length} employé(s) pour la période {getMonthLabel(selectedMonth)}
                  </p>
                </div>
                <button
                  onClick={handleCalculatePayroll}
                  disabled={selectedEmployees.length === 0 || calculating}
                  className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Calculator className="w-5 h-5" />
                  <span>Calculer la paie</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Résultats du calcul */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Résultats du calcul</h3>
                <button
                  onClick={() => {
                    setShowResults(false);
                    setCalculationResults([]);
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Nouveau calcul
                </button>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-600" />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-500">Total employés</div>
                      <div className="text-2xl font-bold text-gray-900">{selectedEmployees.length}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-500">Calculs réussis</div>
                      <div className="text-2xl font-bold text-green-600">{successfulCalculations.length}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-500">Erreurs</div>
                      <div className="text-2xl font-bold text-red-600">{failedCalculations.length}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progression */}
            {calculating && (
              <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Clock className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-lg font-medium text-gray-900">Calcul en cours...</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(calculationResults.length / selectedEmployees.length) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {calculationResults.length} / {selectedEmployees.length} employés traités
                </p>
              </div>
            )}

            {/* Liste des résultats */}
            <div className="space-y-4">
              {calculationResults.map((result) => (
                <div key={result.employeeId} className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {result.employee.prenom.charAt(0)}{result.employee.nom.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-lg font-medium text-gray-900">
                          {result.employee.prenom} {result.employee.nom}
                        </div>
                        <div className="text-sm text-gray-500">
                          {result.employee.matricule} • {result.employee.fonction}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {result.success ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                  </div>

                  {result.success && result.calculation ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Salaire brut:</span>
                        <div className="font-medium">{formatCurrency(result.calculation.totalGains)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Total retenues:</span>
                        <div className="font-medium">{formatCurrency(result.calculation.totalRetenues)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">IGR:</span>
                        <div className="font-medium">{formatCurrency(result.calculation.impotRevenu)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Salaire net:</span>
                        <div className="font-medium text-green-600">{formatCurrency(result.calculation.salaireNetAPayer)}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-red-600 text-sm">
                      <strong>Erreur:</strong> {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Résumé final */}
            {!calculating && calculationResults.length > 0 && (
              <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Résumé du calcul</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Statistiques</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Employés traités:</span>
                        <span className="font-medium">{calculationResults.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Calculs réussis:</span>
                        <span className="font-medium text-green-600">{successfulCalculations.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Erreurs:</span>
                        <span className="font-medium text-red-600">{failedCalculations.length}</span>
                      </div>
                    </div>
                  </div>

                  {successfulCalculations.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Totaux</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total salaires bruts:</span>
                          <span className="font-medium">
                            {formatCurrency(successfulCalculations.reduce((sum, r) => sum + (r.calculation?.totalGains || 0), 0))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total retenues:</span>
                          <span className="font-medium">
                            {formatCurrency(successfulCalculations.reduce((sum, r) => sum + (r.calculation?.totalRetenues || 0), 0))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total salaires nets:</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(successfulCalculations.reduce((sum, r) => sum + (r.calculation?.salaireNetAPayer || 0), 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Les bulletins de paie ont été générés et sont disponibles dans la section "Documents salariés".
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default MonthlyCalculationPage;
