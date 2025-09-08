import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { BookOpen, ArrowLeft, Download, Calendar, Users, FileSpreadsheet, Filter } from 'lucide-react';
import { useRouter } from 'next/router';
import { Employee } from '@prisma/client';
import { calculerPaie, type EmployeePayrollData } from '../../lib/payrollCalculations';

interface PayrollJournalEntry {
  employee: Employee;
  payrollData: any;
  gains: {
    salaireBase: number;
    primeAnciennete: number;
    indemniteLogement: number;
    indemnitePanier: number;
    primeTransport: number;
    indemniteRepresentation: number;
    total: number;
  };
  retenues: {
    cnssPrestation: number;
    amoSalariale: number;
    retraiteSalariale: number;
    assuranceDiversSalariale: number;
    igr: number;
    autresRetenues: number;
    total: number;
  };
  cotisationsPatronales: {
    cnssPatronale: number;
    amoPatronale: number;
    retraitePatronale: number;
    assuranceDiversPatronale: number;
    taxeFormation: number;
    total: number;
  };
  netAPayer: number;
  coutTotal: number;
}

const PayrollJournalPage = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterDepartment, setFilterDepartment] = useState('');
  const [journalData, setJournalData] = useState<PayrollJournalEntry[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.filter((emp: Employee) => emp.status === 'ACTIF'));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des employés:', error);
    } finally {
      setLoading(false);
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

  const handleGenerateJournal = async () => {
    setGenerating(true);
    setJournalData([]);
    setShowResults(true);

    const filteredEmployees = filterDepartment 
      ? employees.filter(emp => emp.fonction.toLowerCase().includes(filterDepartment.toLowerCase()))
      : employees;

    const journalEntries: PayrollJournalEntry[] = [];
    let totalGains = 0;
    let totalRetenues = 0;
    let totalCotisationsPatronales = 0;
    let totalNetAPayer = 0;
    let totalCoutEmployeur = 0;

    for (const employee of filteredEmployees) {
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

        // Calculer la paie
        const payrollResult = calculerPaie(employeeData);

        const gains = {
          salaireBase: employee.salaireBase,
          primeAnciennete: payrollResult.gains.primeAnciennete,
          indemniteLogement: employee.indemniteLogement,
          indemnitePanier: employee.indemnitePanier,
          primeTransport: employee.primeTransport,
          indemniteRepresentation: employee.indemniteRepresentation,
          total: payrollResult.salaireBrut
        };

        const retenues = {
          cnssPrestation: payrollResult.cotisationsSalariales.cnssPrestation,
          amoSalariale: payrollResult.cotisationsSalariales.amoSalariale,
          retraiteSalariale: payrollResult.cotisationsSalariales.retraiteSalariale,
          assuranceDiversSalariale: payrollResult.cotisationsSalariales.assuranceDiversSalariale,
          igr: payrollResult.calculIGR.impotSurRevenu,
          autresRetenues: payrollResult.autresRetenues.totalAutresRetenues,
          total: payrollResult.totalRetenues
        };

        const cotisationsPatronales = {
          cnssPatronale: payrollResult.cotisationsPatronales.cnssPrestation,
          amoPatronale: payrollResult.cotisationsPatronales.amoPatronale,
          retraitePatronale: payrollResult.cotisationsPatronales.retraitePatronale,
          assuranceDiversPatronale: payrollResult.cotisationsPatronales.assuranceDiversPatronale,
          taxeFormation: payrollResult.cotisationsPatronales.taxeFormation,
          total: payrollResult.cotisationsPatronales.totalCotisationsPatronales
        };

        const entry: PayrollJournalEntry = {
          employee,
          payrollData: payrollResult,
          gains,
          retenues,
          cotisationsPatronales,
          netAPayer: payrollResult.salaireNetAPayer,
          coutTotal: payrollResult.coutTotalEmployeur
        };

        journalEntries.push(entry);

        // Accumulation des totaux
        totalGains += gains.total;
        totalRetenues += retenues.total;
        totalCotisationsPatronales += cotisationsPatronales.total;
        totalNetAPayer += entry.netAPayer;
        totalCoutEmployeur += entry.coutTotal;

      } catch (error) {
        console.error(`Erreur lors du calcul pour ${employee.prenom} ${employee.nom}:`, error);
      }
    }

    setJournalData(journalEntries);
    setSummary({
      totalEmployees: journalEntries.length,
      totalGains,
      totalRetenues,
      totalCotisationsPatronales,
      totalNetAPayer,
      totalCoutEmployeur
    });

    setGenerating(false);
  };

  const handleExportExcel = () => {
    // Créer les données pour l'export Excel
    const excelData = journalData.map(entry => ({
      'Matricule': entry.employee.matricule,
      'Nom': entry.employee.nom,
      'Prénom': entry.employee.prenom,
      'Fonction': entry.employee.fonction,
      'Salaire Base': entry.gains.salaireBase,
      'Prime Ancienneté': entry.gains.primeAnciennete,
      'Indemnité Logement': entry.gains.indemniteLogement,
      'Indemnité Panier': entry.gains.indemnitePanier,
      'Prime Transport': entry.gains.primeTransport,
      'Indemnité Représentation': entry.gains.indemniteRepresentation,
      'Total Gains': entry.gains.total,
      'CNSS Prestation': entry.retenues.cnssPrestation,
      'AMO Salariale': entry.retenues.amoSalariale,
      'Retraite Salariale': entry.retenues.retraiteSalariale,
      'Assurance Divers Salariale': entry.retenues.assuranceDiversSalariale,
      'IGR': entry.retenues.igr,
      'Autres Retenues': entry.retenues.autresRetenues,
      'Total Retenues': entry.retenues.total,
      'Net à Payer': entry.netAPayer,
      'CNSS Patronale': entry.cotisationsPatronales.cnssPatronale,
      'AMO Patronale': entry.cotisationsPatronales.amoPatronale,
      'Retraite Patronale': entry.cotisationsPatronales.retraitePatronale,
      'Assurance Divers Patronale': entry.cotisationsPatronales.assuranceDiversPatronale,
      'Taxe Formation': entry.cotisationsPatronales.taxeFormation,
      'Total Cotisations Patronales': entry.cotisationsPatronales.total,
      'Coût Total Employeur': entry.coutTotal
    }));

    // Convertir en CSV pour téléchargement
    const csvContent = [
      Object.keys(excelData[0]).join(','),
      ...excelData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `journal_paie_${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const departments = Array.from(new Set(employees.map(emp => emp.fonction)));

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
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Journal de paie</h1>
          </div>
          
          <p className="text-gray-600 text-lg">
            Regroupement de toutes les lignes de paie du mois par salarié pour usage comptable et RH.
          </p>
        </div>

        {!showResults ? (
          <>
            {/* Configuration */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration du journal</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Période
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="payroll-input"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Journal pour {getMonthLabel(selectedMonth)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Filter className="w-4 h-4 inline mr-1" />
                    Filtrer par fonction
                  </label>
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="payroll-input"
                  >
                    <option value="">Toutes les fonctions</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Employés concernés
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {filterDepartment 
                      ? employees.filter(emp => emp.fonction.toLowerCase().includes(filterDepartment.toLowerCase())).length
                      : employees.length
                    } employé(s)
                  </div>
                </div>
              </div>
            </div>

            {/* Aperçu des employés */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Employés inclus dans le journal
                </h3>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {(filterDepartment 
                  ? employees.filter(emp => emp.fonction.toLowerCase().includes(filterDepartment.toLowerCase()))
                  : employees
                ).map((employee) => (
                  <div key={employee.id} className="px-6 py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">
                              {employee.prenom.charAt(0)}{employee.nom.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
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
                  </div>
                ))}
              </div>
            </div>

            {/* Bouton de génération */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Générer le journal de paie</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Calcul et consolidation des données de paie pour {getMonthLabel(selectedMonth)}
                  </p>
                </div>
                <button
                  onClick={handleGenerateJournal}
                  disabled={generating}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>{generating ? 'Génération...' : 'Générer le journal'}</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Résultats */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Journal de paie - {getMonthLabel(selectedMonth)}</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowResults(false)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Nouvelle génération
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export Excel</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Résumé */}
            {summary && (
              <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Résumé du journal</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{summary.totalEmployees}</div>
                    <div className="text-sm text-gray-600">Employés</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{formatCurrency(summary.totalGains)}</div>
                    <div className="text-sm text-gray-600">Total Gains</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{formatCurrency(summary.totalRetenues)}</div>
                    <div className="text-sm text-gray-600">Total Retenues</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">{formatCurrency(summary.totalCotisationsPatronales)}</div>
                    <div className="text-sm text-gray-600">Charges Patronales</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{formatCurrency(summary.totalCoutEmployeur)}</div>
                    <div className="text-sm text-gray-600">Coût Total</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tableau détaillé */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employé
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gains
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Retenues
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net à payer
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Charges patronales
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Coût total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {journalData.map((entry) => (
                      <tr key={entry.employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-600">
                                  {entry.employee.prenom.charAt(0)}{entry.employee.nom.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {entry.employee.prenom} {entry.employee.nom}
                              </div>
                              <div className="text-sm text-gray-500">
                                {entry.employee.matricule} • {entry.employee.fonction}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                          {formatCurrency(entry.gains.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600">
                          {formatCurrency(entry.retenues.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-600">
                          {formatCurrency(entry.netAPayer)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-orange-600">
                          {formatCurrency(entry.cotisationsPatronales.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-purple-600">
                          {formatCurrency(entry.coutTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        TOTAUX
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600">
                        {formatCurrency(summary?.totalGains || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-red-600">
                        {formatCurrency(summary?.totalRetenues || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-blue-600">
                        {formatCurrency(summary?.totalNetAPayer || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-orange-600">
                        {formatCurrency(summary?.totalCotisationsPatronales || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-purple-600">
                        {formatCurrency(summary?.totalCoutEmployeur || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default PayrollJournalPage;
