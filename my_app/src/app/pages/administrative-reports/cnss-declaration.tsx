import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { Building, ArrowLeft, Download, Calendar, Users, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/router';
import { Employee } from '@prisma/client';
import { calculerPaie, type EmployeePayrollData } from '../../lib/payrollCalculations';

interface CNSSDeclarationEntry {
  employee: Employee;
  salaireBrut: number;
  plafondCNSS: number;
  assietteCNSS: number;
  cotisationSalariale: number;
  cotisationPatronale: number;
  allocationsFamiliales: number;
  taxeFormation: number;
  totalCotisations: number;
}

const CNSSDeclarationPage = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [declarationData, setDeclarationData] = useState<CNSSDeclarationEntry[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [companyInfo, setCompanyInfo] = useState({
    name: 'VOTRE ENTREPRISE',
    cnssNumber: '1234567',
    address: 'Adresse de l\'entreprise',
    city: 'Casablanca'
  });

  // Barèmes CNSS 2024
  const CNSS_RATES = {
    plafond: 6000, // Plafond mensuel CNSS
    prestationsSalariale: 0.0067, // 0.67%
    prestationsPatronale: 0.0833, // 8.33%
    allocationsFamiliales: 0.0675, // 6.75% (patronale uniquement)
    taxeFormation: 0.016 // 1.6% (patronale uniquement)
  };

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

  const handleGenerateDeclaration = async () => {
    setGenerating(true);
    setDeclarationData([]);
    setShowResults(true);

    const declarationEntries: CNSSDeclarationEntry[] = [];
    let totalSalaireBrut = 0;
    let totalAssietteCNSS = 0;
    let totalCotisationsSalariales = 0;
    let totalCotisationsPatronales = 0;
    let totalAllocationsFamiliales = 0;
    let totalTaxeFormation = 0;
    let totalCotisations = 0;

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

        // Calculs spécifiques CNSS
        const salaireBrut = payrollResult.salaireBrut;
        const assietteCNSS = Math.min(salaireBrut, CNSS_RATES.plafond);
        
        const cotisationSalariale = assietteCNSS * CNSS_RATES.prestationsSalariale;
        const cotisationPatronale = assietteCNSS * CNSS_RATES.prestationsPatronale;
        const allocationsFamiliales = salaireBrut * CNSS_RATES.allocationsFamiliales;
        const taxeFormation = salaireBrut * CNSS_RATES.taxeFormation;
        
        const totalCotisationsEmployee = cotisationSalariale + cotisationPatronale + allocationsFamiliales + taxeFormation;

        const entry: CNSSDeclarationEntry = {
          employee,
          salaireBrut,
          plafondCNSS: CNSS_RATES.plafond,
          assietteCNSS,
          cotisationSalariale,
          cotisationPatronale,
          allocationsFamiliales,
          taxeFormation,
          totalCotisations: totalCotisationsEmployee
        };

        declarationEntries.push(entry);

        // Accumulation des totaux
        totalSalaireBrut += salaireBrut;
        totalAssietteCNSS += assietteCNSS;
        totalCotisationsSalariales += cotisationSalariale;
        totalCotisationsPatronales += cotisationPatronale;
        totalAllocationsFamiliales += allocationsFamiliales;
        totalTaxeFormation += taxeFormation;
        totalCotisations += totalCotisationsEmployee;

      } catch (error) {
        console.error(`Erreur lors du calcul pour ${employee.prenom} ${employee.nom}:`, error);
      }
    }

    setDeclarationData(declarationEntries);
    setSummary({
      totalEmployees: declarationEntries.length,
      totalSalaireBrut,
      totalAssietteCNSS,
      totalCotisationsSalariales,
      totalCotisationsPatronales,
      totalAllocationsFamiliales,
      totalTaxeFormation,
      totalCotisations
    });

    setGenerating(false);
  };

  const handleExportCNSSFile = () => {
    // Format de fichier CNSS simplifié
    const cnssContent = [
      '# DÉCLARATION CNSS',
      `# Entreprise: ${companyInfo.name}`,
      `# Numéro CNSS: ${companyInfo.cnssNumber}`,
      `# Période: ${getMonthLabel(selectedMonth)}`,
      `# Date de génération: ${new Date().toLocaleDateString('fr-FR')}`,
      '',
      '# RÉCAPITULATIF',
      `# Nombre de salariés: ${summary?.totalEmployees || 0}`,
      `# Total salaires bruts: ${(summary?.totalSalaireBrut || 0).toFixed(2)} MAD`,
      `# Total assiette CNSS: ${(summary?.totalAssietteCNSS || 0).toFixed(2)} MAD`,
      `# Total cotisations salariales: ${(summary?.totalCotisationsSalariales || 0).toFixed(2)} MAD`,
      `# Total cotisations patronales: ${(summary?.totalCotisationsPatronales || 0).toFixed(2)} MAD`,
      `# Total allocations familiales: ${(summary?.totalAllocationsFamiliales || 0).toFixed(2)} MAD`,
      `# Total taxe formation: ${(summary?.totalTaxeFormation || 0).toFixed(2)} MAD`,
      `# TOTAL À PAYER: ${(summary?.totalCotisations || 0).toFixed(2)} MAD`,
      '',
      '# DÉTAIL PAR SALARIÉ',
      '# Format: CNSS;Nom;Prénom;Salaire_Brut;Assiette_CNSS;Cotis_Salariale;Cotis_Patronale;Alloc_Familiales;Taxe_Formation;Total',
      ...declarationData.map(entry => 
        `${entry.employee.cnss || 'N/A'};${entry.employee.nom};${entry.employee.prenom};${entry.salaireBrut.toFixed(2)};${entry.assietteCNSS.toFixed(2)};${entry.cotisationSalariale.toFixed(2)};${entry.cotisationPatronale.toFixed(2)};${entry.allocationsFamiliales.toFixed(2)};${entry.taxeFormation.toFixed(2)};${entry.totalCotisations.toFixed(2)}`
      )
    ].join('\n');

    const blob = new Blob([cnssContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `declaration_cnss_${selectedMonth}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    const excelData = declarationData.map(entry => ({
      'Numéro CNSS': entry.employee.cnss || 'N/A',
      'Matricule': entry.employee.matricule,
      'Nom': entry.employee.nom,
      'Prénom': entry.employee.prenom,
      'Fonction': entry.employee.fonction,
      'Salaire Brut': entry.salaireBrut,
      'Plafond CNSS': entry.plafondCNSS,
      'Assiette CNSS': entry.assietteCNSS,
      'Cotisation Salariale (0.67%)': entry.cotisationSalariale,
      'Cotisation Patronale (8.33%)': entry.cotisationPatronale,
      'Allocations Familiales (6.75%)': entry.allocationsFamiliales,
      'Taxe Formation (1.6%)': entry.taxeFormation,
      'Total Cotisations': entry.totalCotisations
    }));

    const csvContent = [
      Object.keys(excelData[0]).join(','),
      ...excelData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `declaration_cnss_details_${selectedMonth}.csv`);
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
            <Building className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-900">Déclaration CNSS</h1>
          </div>
          
          <p className="text-gray-600 text-lg">
            Production du fichier ou formulaire mensuel à transmettre à la CNSS selon les cotisations dues.
          </p>
        </div>

        {!showResults ? (
          <>
            {/* Configuration */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration de la déclaration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Période de déclaration
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="payroll-input"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Déclaration pour {getMonthLabel(selectedMonth)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Employés concernés
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {employees.length} employé(s) actif(s)
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Tous les employés actifs seront inclus dans la déclaration
                  </p>
                </div>
              </div>
            </div>

            {/* Informations entreprise */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informations de l'entreprise</h3>
              
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
                    Numéro d'affiliation CNSS
                  </label>
                  <input
                    type="text"
                    value={companyInfo.cnssNumber}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, cnssNumber: e.target.value }))}
                    className="payroll-input"
                    placeholder="1234567"
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

            {/* Barèmes CNSS */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Barèmes CNSS en vigueur</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">{formatCurrency(CNSS_RATES.plafond)}</div>
                  <div className="text-sm text-gray-600">Plafond mensuel</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{(CNSS_RATES.prestationsSalariale * 100).toFixed(2)}%</div>
                  <div className="text-sm text-gray-600">Cotisation salariale</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">{(CNSS_RATES.prestationsPatronale * 100).toFixed(2)}%</div>
                  <div className="text-sm text-gray-600">Cotisation patronale</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">{(CNSS_RATES.allocationsFamiliales * 100).toFixed(2)}%</div>
                  <div className="text-sm text-gray-600">Allocations familiales</div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-sm text-yellow-800">
                    Taxe de formation professionnelle : {(CNSS_RATES.taxeFormation * 100).toFixed(1)}% sur la totalité du salaire brut
                  </span>
                </div>
              </div>
            </div>

            {/* Aperçu des employés */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Employés à déclarer
                </h3>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {employees.map((employee) => (
                  <div key={employee.id} className="px-6 py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
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
                          <div className="text-sm text-gray-500">
                            {employee.matricule} • {employee.fonction}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(employee.salaireBase)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {employee.cnss ? (
                            <span className="text-green-600">CNSS: {employee.cnss}</span>
                          ) : (
                            <span className="text-red-600">CNSS manquant</span>
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
                  <h3 className="text-lg font-medium text-gray-900">Générer la déclaration CNSS</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Calcul des cotisations et génération de la déclaration pour {getMonthLabel(selectedMonth)}
                  </p>
                </div>
                <button
                  onClick={handleGenerateDeclaration}
                  disabled={generating}
                  className="flex items-center space-x-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Building className="w-5 h-5" />
                  <span>{generating ? 'Génération...' : 'Générer la déclaration'}</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Résultats */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Déclaration CNSS - {getMonthLabel(selectedMonth)}</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowResults(false)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Nouvelle déclaration
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export Excel</span>
                  </button>
                  <button
                    onClick={handleExportCNSSFile}
                    className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Fichier CNSS</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Résumé */}
            {summary && (
              <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Résumé de la déclaration</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{summary.totalEmployees}</div>
                    <div className="text-sm text-gray-600">Employés déclarés</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{formatCurrency(summary.totalSalaireBrut)}</div>
                    <div className="text-sm text-gray-600">Total salaires bruts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">{formatCurrency(summary.totalAssietteCNSS)}</div>
                    <div className="text-sm text-gray-600">Total assiette CNSS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{formatCurrency(summary.totalCotisations)}</div>
                    <div className="text-sm text-gray-600">Total cotisations</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{formatCurrency(summary.totalCotisationsSalariales)}</div>
                    <div className="text-sm text-gray-600">Cotisations salariales</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{formatCurrency(summary.totalCotisationsPatronales)}</div>
                    <div className="text-sm text-gray-600">Cotisations patronales</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{formatCurrency(summary.totalAllocationsFamiliales)}</div>
                    <div className="text-sm text-gray-600">Allocations familiales</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-600">{formatCurrency(summary.totalTaxeFormation)}</div>
                    <div className="text-sm text-gray-600">Taxe formation</div>
                  </div>
                </div>
              </div>
            )}

            {/* Informations de la déclaration */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Informations de la déclaration</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Entreprise :</span>
                  <div className="font-medium">{companyInfo.name}</div>
                </div>
                <div>
                  <span className="text-gray-600">Numéro CNSS :</span>
                  <div className="font-medium">{companyInfo.cnssNumber}</div>
                </div>
                <div>
                  <span className="text-gray-600">Période :</span>
                  <div className="font-medium">{getMonthLabel(selectedMonth)}</div>
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
                        Assiette CNSS
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cotisations salariales
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cotisations patronales
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total cotisations
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {declarationData.map((entry) => (
                      <tr key={entry.employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                                <span className="text-xs font-medium text-orange-600">
                                  {entry.employee.prenom.charAt(0)}{entry.employee.nom.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {entry.employee.prenom} {entry.employee.nom}
                              </div>
                              <div className="text-sm text-gray-500">
                                {entry.employee.matricule} • {entry.employee.cnss || 'CNSS manquant'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                          {formatCurrency(entry.salaireBrut)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-600">
                          {formatCurrency(entry.assietteCNSS)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600">
                          {formatCurrency(entry.cotisationSalariale)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-orange-600">
                          {formatCurrency(entry.cotisationPatronale + entry.allocationsFamiliales + entry.taxeFormation)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-purple-600">
                          {formatCurrency(entry.totalCotisations)}
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
                        {formatCurrency(summary?.totalAssietteCNSS || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-red-600">
                        {formatCurrency(summary?.totalCotisationsSalariales || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-orange-600">
                        {formatCurrency((summary?.totalCotisationsPatronales || 0) + (summary?.totalAllocationsFamiliales || 0) + (summary?.totalTaxeFormation || 0))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-purple-600">
                        {formatCurrency(summary?.totalCotisations || 0)}
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

export default CNSSDeclarationPage;
