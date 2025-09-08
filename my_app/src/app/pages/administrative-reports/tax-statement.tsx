import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { Receipt, ArrowLeft, Download, Calendar, Users, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/router';
import { Employee } from '@prisma/client';
import { calculerPaie, type EmployeePayrollData } from '../../lib/payrollCalculations';

interface TaxStatementEntry {
  employee: Employee;
  salaireBrut: number;
  salaireNetImposable: number;
  deductionsFiscales: number;
  baseImposable: number;
  igrCalcule: number;
  igrRetenu: number;
  tauxMoyen: number;
}

const TaxStatementPage = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString());
  const [statementData, setStatementData] = useState<TaxStatementEntry[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [reportType, setReportType] = useState<'monthly' | 'annual'>('monthly');
  const [companyInfo, setCompanyInfo] = useState({
    name: 'VOTRE ENTREPRISE',
    taxNumber: 'IF123456',
    address: 'Adresse de l\'entreprise',
    city: 'Casablanca'
  });

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

  const handleGenerateStatement = async () => {
    setGenerating(true);
    setStatementData([]);
    setShowResults(true);

    const statementEntries: TaxStatementEntry[] = [];
    let totalSalaireBrut = 0;
    let totalSalaireNetImposable = 0;
    let totalDeductionsFiscales = 0;
    let totalBaseImposable = 0;
    let totalIgrCalcule = 0;
    let totalIgrRetenu = 0;

    for (const employee of employees) {
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

        // Calculs spécifiques IGR
        const salaireBrut = payrollResult.salaireBrut;
        const salaireNetImposable = payrollResult.calculIGR.netImposable;
        const deductionsFiscales = payrollResult.calculIGR.fraisProfessionnels;
        const baseImposable = payrollResult.calculIGR.netNetImposable;
        const igrCalcule = payrollResult.calculIGR.impotSurRevenu;
        const igrRetenu = payrollResult.calculIGR.impotSurRevenu; // Même valeur pour l'IGR retenu
        
        const tauxMoyen = baseImposable > 0 ? (igrCalcule / baseImposable) * 100 : 0;

        const entry: TaxStatementEntry = {
          employee,
          salaireBrut,
          salaireNetImposable,
          deductionsFiscales,
          baseImposable,
          igrCalcule,
          igrRetenu,
          tauxMoyen
        };

        statementEntries.push(entry);

        // Accumulation des totaux
        totalSalaireBrut += salaireBrut;
        totalSalaireNetImposable += salaireNetImposable;
        totalDeductionsFiscales += deductionsFiscales;
        totalBaseImposable += baseImposable;
        totalIgrCalcule += igrCalcule;
        totalIgrRetenu += igrRetenu;

      } catch (error) {
        console.error(`Erreur lors du calcul pour ${employee.prenom} ${employee.nom}:`, error);
      }
    }

    setStatementData(statementEntries);
    setSummary({
      totalEmployees: statementEntries.length,
      totalSalaireBrut,
      totalSalaireNetImposable,
      totalDeductionsFiscales,
      totalBaseImposable,
      totalIgrCalcule,
      totalIgrRetenu,
      tauxMoyenGlobal: totalBaseImposable > 0 ? (totalIgrCalcule / totalBaseImposable) * 100 : 0
    });

    setGenerating(false);
  };

  const handleExportTaxFile = () => {
    const period = reportType === 'monthly' ? getMonthLabel(selectedMonth) : `Année ${selectedYear}`;
    
    // Format de fichier fiscal simplifié
    const taxContent = [
      '# ÉTAT FISCAL IGR',
      `# Entreprise: ${companyInfo.name}`,
      `# Numéro fiscal: ${companyInfo.taxNumber}`,
      `# Période: ${period}`,
      `# Type de rapport: ${reportType === 'monthly' ? 'Mensuel' : 'Annuel'}`,
      `# Date de génération: ${new Date().toLocaleDateString('fr-FR')}`,
      '',
      '# RÉCAPITULATIF FISCAL',
      `# Nombre de salariés: ${summary?.totalEmployees || 0}`,
      `# Total salaires bruts: ${(summary?.totalSalaireBrut || 0).toFixed(2)} MAD`,
      `# Total salaires nets imposables: ${(summary?.totalSalaireNetImposable || 0).toFixed(2)} MAD`,
      `# Total déductions fiscales: ${(summary?.totalDeductionsFiscales || 0).toFixed(2)} MAD`,
      `# Total base imposable: ${(summary?.totalBaseImposable || 0).toFixed(2)} MAD`,
      `# Total IGR calculé: ${(summary?.totalIgrCalcule || 0).toFixed(2)} MAD`,
      `# Total IGR retenu: ${(summary?.totalIgrRetenu || 0).toFixed(2)} MAD`,
      `# Taux moyen global: ${(summary?.tauxMoyenGlobal || 0).toFixed(2)}%`,
      '',
      '# DÉTAIL PAR SALARIÉ',
      '# Format: CIN;Nom;Prénom;Salaire_Brut;Salaire_Net_Imposable;Déductions_Fiscales;Base_Imposable;IGR_Calculé;IGR_Retenu;Taux_Moyen',
      ...statementData.map(entry => 
        `${entry.employee.cin || 'N/A'};${entry.employee.nom};${entry.employee.prenom};${entry.salaireBrut.toFixed(2)};${entry.salaireNetImposable.toFixed(2)};${entry.deductionsFiscales.toFixed(2)};${entry.baseImposable.toFixed(2)};${entry.igrCalcule.toFixed(2)};${entry.igrRetenu.toFixed(2)};${entry.tauxMoyen.toFixed(2)}`
      )
    ].join('\n');

    const blob = new Blob([taxContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `etat_fiscal_igr_${reportType === 'monthly' ? selectedMonth : selectedYear}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    const excelData = statementData.map(entry => ({
      'CIN': entry.employee.cin || 'N/A',
      'Matricule': entry.employee.matricule,
      'Nom': entry.employee.nom,
      'Prénom': entry.employee.prenom,
      'Fonction': entry.employee.fonction,
      'Situation Familiale': entry.employee.situationFamiliale,
      'Nombre de Déductions': entry.employee.nbrDeductions,
      'Salaire Brut': entry.salaireBrut,
      'Salaire Net Imposable': entry.salaireNetImposable,
      'Déductions Fiscales': entry.deductionsFiscales,
      'Base Imposable': entry.baseImposable,
      'IGR Calculé': entry.igrCalcule,
      'IGR Retenu': entry.igrRetenu,
      'Taux Moyen (%)': entry.tauxMoyen
    }));

    const csvContent = [
      Object.keys(excelData[0]).join(','),
      ...excelData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `etat_fiscal_igr_details_${reportType === 'monthly' ? selectedMonth : selectedYear}.csv`);
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

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(2)}%`;
  };

  const getMonthLabel = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long'
    }).format(date);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

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
            <Receipt className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">État fiscal IGR</h1>
          </div>
          
          <p className="text-gray-600 text-lg">
            Détail mensuel et annuel de l'impôt sur le revenu (IGR) retenu à la source, généré selon le barème fiscal marocain.
          </p>
        </div>

        {!showResults ? (
          <>
            {/* Configuration */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration de l'état fiscal</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de rapport
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as 'monthly' | 'annual')}
                    className="payroll-input"
                  >
                    <option value="monthly">Rapport mensuel</option>
                    <option value="annual">Rapport annuel</option>
                  </select>
                </div>

                {reportType === 'monthly' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Mois
                    </label>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="payroll-input"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      État pour {getMonthLabel(selectedMonth)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Année
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="payroll-input"
                    >
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-500 mt-1">
                      État pour l'année {selectedYear}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Employés concernés
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {employees.length} employé(s) actif(s)
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Tous les employés actifs seront inclus
                  </p>
                </div>
              </div>
            </div>

            {/* Informations entreprise */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informations fiscales de l'entreprise</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'entreprise
                  </label>
                  <input
                    type="text"
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="payroll-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Identifiant fiscal
                  </label>
                  <input
                    type="text"
                    value={companyInfo.taxNumber}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, taxNumber: e.target.value }))}
                    className="payroll-input"
                    placeholder="IF123456"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={companyInfo.address}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, address: e.target.value }))}
                    className="payroll-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={companyInfo.city}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, city: e.target.value }))}
                    className="payroll-input"
                  />
                </div>
              </div>
            </div>

            {/* Informations sur l'IGR */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Barème IGR marocain</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tranche de revenu (MAD/mois)
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Taux
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Somme à déduire
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">0 - 2 500</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">0%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">0</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2 501 - 4 166</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">10%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">250</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">4 167 - 5 000</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">20%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">666,70</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">5 001 - 6 666</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">30%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">1 166,70</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">6 667 - 15 000</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">34%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">1 433,33</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Plus de 15 000</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">38%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">2 033,33</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-800">
                    Déductions fiscales : 360 MAD par personne à charge + frais professionnels (17% ou 2 500 MAD max) + intérêts crédit logement
                  </span>
                </div>
              </div>
            </div>

            {/* Aperçu des employés */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Employés concernés par l'état fiscal
                </h3>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {employees.map((employee) => (
                  <div key={employee.id} className="px-6 py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-purple-600">
                              {employee.prenom.charAt(0)}{employee.nom.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.prenom} {employee.nom}
                          </div>
                          <div className="text-sm text-gray-500">
                            {employee.matricule} • {employee.situationFamiliale} • {employee.nbrDeductions} déduction(s)
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(employee.salaireBase)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {employee.cin ? (
                            <span className="text-green-600">CIN: {employee.cin}</span>
                          ) : (
                            <span className="text-red-600">CIN manquant</span>
                          )}
                        </div>
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
                  <h3 className="text-lg font-medium text-gray-900">Générer l'état fiscal IGR</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Calcul de l'IGR et génération de l'état fiscal pour {reportType === 'monthly' ? getMonthLabel(selectedMonth) : `l'année ${selectedYear}`}
                  </p>
                </div>
                <button
                  onClick={handleGenerateStatement}
                  disabled={generating}
                  className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Receipt className="w-5 h-5" />
                  <span>{generating ? 'Génération...' : 'Générer l\'état fiscal'}</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Résultats */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  État fiscal IGR - {reportType === 'monthly' ? getMonthLabel(selectedMonth) : `Année ${selectedYear}`}
                </h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowResults(false)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Nouvel état
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export Excel</span>
                  </button>
                  <button
                    onClick={handleExportTaxFile}
                    className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Fichier fiscal</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Résumé */}
            {summary && (
              <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Résumé fiscal</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{summary.totalEmployees}</div>
                    <div className="text-sm text-gray-600">Employés</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{formatCurrency(summary.totalSalaireBrut)}</div>
                    <div className="text-sm text-gray-600">Total salaires bruts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">{formatCurrency(summary.totalBaseImposable)}</div>
                    <div className="text-sm text-gray-600">Total base imposable</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{formatCurrency(summary.totalIgrRetenu)}</div>
                    <div className="text-sm text-gray-600">Total IGR retenu</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{formatCurrency(summary.totalSalaireNetImposable)}</div>
                    <div className="text-sm text-gray-600">Total net imposable</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{formatCurrency(summary.totalDeductionsFiscales)}</div>
                    <div className="text-sm text-gray-600">Total déductions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{formatPercentage(summary.tauxMoyenGlobal)}</div>
                    <div className="text-sm text-gray-600">Taux moyen global</div>
                  </div>
                </div>
              </div>
            )}

            {/* Informations de l'état */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Informations de l'état fiscal</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Entreprise :</span>
                  <div className="font-medium">{companyInfo.name}</div>
                </div>
                <div>
                  <span className="text-gray-600">Identifiant fiscal :</span>
                  <div className="font-medium">{companyInfo.taxNumber}</div>
                </div>
                <div>
                  <span className="text-gray-600">Période :</span>
                  <div className="font-medium">
                    {reportType === 'monthly' ? getMonthLabel(selectedMonth) : `Année ${selectedYear}`}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Date de génération :</span>
                  <div className="font-medium">{new Date().toLocaleDateString('fr-FR')}</div>
                </div>
              </div>
            </div>

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
                        Salaire brut
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net imposable
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Base imposable
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IGR retenu
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Taux moyen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {statementData.map((entry) => (
                      <tr key={entry.employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <span className="text-xs font-medium text-purple-600">
                                  {entry.employee.prenom.charAt(0)}{entry.employee.nom.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {entry.employee.prenom} {entry.employee.nom}
                              </div>
                              <div className="text-sm text-gray-500">
                                {entry.employee.matricule} • {entry.employee.situationFamiliale} • {entry.employee.nbrDeductions} déduction(s)
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                          {formatCurrency(entry.salaireBrut)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-600">
                          {formatCurrency(entry.salaireNetImposable)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-orange-600">
                          {formatCurrency(entry.baseImposable)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-purple-600">
                          {formatCurrency(entry.igrRetenu)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-600">
                          {formatPercentage(entry.tauxMoyen)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        TOTAUX ({summary?.totalEmployees || 0} employés)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600">
                        {formatCurrency(summary?.totalSalaireBrut || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-blue-600">
                        {formatCurrency(summary?.totalSalaireNetImposable || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-orange-600">
                        {formatCurrency(summary?.totalBaseImposable || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-purple-600">
                        {formatCurrency(summary?.totalIgrRetenu || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-600">
                        {formatPercentage(summary?.tauxMoyenGlobal || 0)}
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

export default TaxStatementPage;
