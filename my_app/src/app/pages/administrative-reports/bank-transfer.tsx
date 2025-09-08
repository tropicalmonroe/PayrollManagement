import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { CreditCard, ArrowLeft, Download, Calendar, Users, FileSpreadsheet, Building, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/router';
import { Employee } from '@prisma/client';
import { calculerPaie, type EmployeePayrollData } from '../../lib/payrollCalculations';

interface BankTransferEntry {
  employee: Employee;
  netAPayer: number;
  compteBancaire: string;
  agence: string;
  isValid: boolean;
  errors: string[];
}

const BankTransferPage = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [transferData, setTransferData] = useState<BankTransferEntry[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [companyInfo, setCompanyInfo] = useState({
    name: 'VOTRE ENTREPRISE',
    account: '123456789012345',
    bank: 'BANQUE POPULAIRE',
    reference: ''
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

  const validateBankAccount = (account: string): boolean => {
    // Validation basique du RIB marocain (24 chiffres)
    return /^\d{24}$/.test(account.replace(/\s/g, ''));
  };

  const handleGenerateTransfer = async () => {
    setGenerating(true);
    setTransferData([]);
    setShowResults(true);

    const transferEntries: BankTransferEntry[] = [];
    let totalAmount = 0;
    let validTransfers = 0;
    let invalidTransfers = 0;

    // Générer une référence unique pour le virement
    const reference = `VIR${selectedMonth.replace('-', '')}${Date.now().toString().slice(-4)}`;
    setCompanyInfo(prev => ({ ...prev, reference }));

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

        // Validation des données bancaires
        const errors: string[] = [];
        let isValid = true;

        if (!employee.compteBancaire) {
          errors.push('Compte bancaire manquant');
          isValid = false;
        } else if (!validateBankAccount(employee.compteBancaire)) {
          errors.push('Format de compte bancaire invalide');
          isValid = false;
        }

        if (!employee.agence) {
          errors.push('Agence bancaire manquante');
          isValid = false;
        }

        if (payrollResult.salaireNetAPayer <= 0) {
          errors.push('Montant net négatif ou nul');
          isValid = false;
        }

        const entry: BankTransferEntry = {
          employee,
          netAPayer: payrollResult.salaireNetAPayer,
          compteBancaire: employee.compteBancaire || '',
          agence: employee.agence || '',
          isValid,
          errors
        };

        transferEntries.push(entry);

        if (isValid) {
          totalAmount += payrollResult.salaireNetAPayer;
          validTransfers++;
        } else {
          invalidTransfers++;
        }

      } catch (error) {
        console.error(`Erreur lors du calcul pour ${employee.prenom} ${employee.nom}:`, error);
        
        const entry: BankTransferEntry = {
          employee,
          netAPayer: 0,
          compteBancaire: employee.compteBancaire || '',
          agence: employee.agence || '',
          isValid: false,
          errors: ['Erreur de calcul de paie']
        };

        transferEntries.push(entry);
        invalidTransfers++;
      }
    }

    setTransferData(transferEntries);
    setSummary({
      totalEmployees: transferEntries.length,
      validTransfers,
      invalidTransfers,
      totalAmount
    });

    setGenerating(false);
  };

  const handleExportBankFile = () => {
    const validTransfers = transferData.filter(entry => entry.isValid);
    
    // Format SEPA simplifié pour le Maroc
    const sepaContent = [
      '# Fichier de virement SEPA',
      `# Référence: ${companyInfo.reference}`,
      `# Date: ${new Date().toISOString().split('T')[0]}`,
      `# Nombre de virements: ${validTransfers.length}`,
      `# Montant total: ${formatCurrency(summary?.totalAmount || 0)}`,
      '',
      '# Format: Nom;Prénom;Compte;Agence;Montant;Référence',
      ...validTransfers.map(entry => 
        `${entry.employee.nom};${entry.employee.prenom};${entry.compteBancaire};${entry.agence};${entry.netAPayer.toFixed(2)};SALAIRE_${selectedMonth}_${entry.employee.matricule}`
      )
    ].join('\n');

    const blob = new Blob([sepaContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `virement_${companyInfo.reference}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    const excelData = transferData.map(entry => ({
      'Matricule': entry.employee.matricule,
      'Nom': entry.employee.nom,
      'Prénom': entry.employee.prenom,
      'Fonction': entry.employee.fonction,
      'Compte Bancaire': entry.compteBancaire,
      'Agence': entry.agence,
      'Net à Payer': entry.netAPayer,
      'Statut': entry.isValid ? 'Valide' : 'Invalide',
      'Erreurs': entry.errors.join('; '),
      'Référence': `SALAIRE_${selectedMonth}_${entry.employee.matricule}`
    }));

    const csvContent = [
      Object.keys(excelData[0]).join(','),
      ...excelData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `virement_details_${selectedMonth}.csv`);
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

  const formatBankAccount = (account: string) => {
    return account.replace(/(\d{3})(\d{3})(\d{18})/, '$1 $2 $3');
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
            <CreditCard className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Virement de masse</h1>
          </div>
          
          <p className="text-gray-600 text-lg">
            Génération du fichier bancaire ou Excel pour l'exécution du virement groupé des salaires.
          </p>
        </div>

        {!showResults ? (
          <>
            {/* Configuration */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration du virement</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Période de paie
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="payroll-input"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Virement pour {getMonthLabel(selectedMonth)}
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
                    Seuls les employés avec des données bancaires valides seront inclus
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
                    Compte débiteur
                  </label>
                  <input
                    type="text"
                    value={companyInfo.account}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, account: e.target.value }))}
                    className="payroll-input"
                    placeholder="123456789012345678901234"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banque
                  </label>
                  <input
                    type="text"
                    value={companyInfo.bank}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, bank: e.target.value }))}
                    className="payroll-input"
                  />
                </div>
              </div>
            </div>

            {/* Aperçu des employés */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Aperçu des employés
                </h3>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {employees.map((employee) => (
                  <div key={employee.id} className="px-6 py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-green-600">
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
                          {employee.compteBancaire ? (
                            <span className="text-green-600">✓ RIB disponible</span>
                          ) : (
                            <span className="text-red-600">✗ RIB manquant</span>
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
                  <h3 className="text-lg font-medium text-gray-900">Générer le fichier de virement</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Calcul des salaires nets et génération du fichier bancaire pour {getMonthLabel(selectedMonth)}
                  </p>
                </div>
                <button
                  onClick={handleGenerateTransfer}
                  disabled={generating}
                  className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>{generating ? 'Génération...' : 'Générer le virement'}</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Résultats */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Virement de masse - {getMonthLabel(selectedMonth)}</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowResults(false)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Nouvelle génération
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export Excel</span>
                  </button>
                  <button
                    onClick={handleExportBankFile}
                    disabled={summary?.validTransfers === 0}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    <span>Fichier bancaire</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Résumé */}
            {summary && (
              <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Résumé du virement</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{summary.totalEmployees}</div>
                    <div className="text-sm text-gray-600">Total employés</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{summary.validTransfers}</div>
                    <div className="text-sm text-gray-600">Virements valides</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{summary.invalidTransfers}</div>
                    <div className="text-sm text-gray-600">Virements invalides</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{formatCurrency(summary.totalAmount)}</div>
                    <div className="text-sm text-gray-600">Montant total</div>
                  </div>
                </div>

                {summary.invalidTransfers > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                      <span className="text-sm text-yellow-800">
                        {summary.invalidTransfers} employé(s) ont des données bancaires invalides et ne seront pas inclus dans le fichier de virement.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Informations du virement */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Informations du virement</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Référence :</span>
                  <div className="font-medium">{companyInfo.reference}</div>
                </div>
                <div>
                  <span className="text-gray-600">Entreprise :</span>
                  <div className="font-medium">{companyInfo.name}</div>
                </div>
                <div>
                  <span className="text-gray-600">Compte débiteur :</span>
                  <div className="font-medium">{formatBankAccount(companyInfo.account)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Banque :</span>
                  <div className="font-medium">{companyInfo.bank}</div>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Données bancaires
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net à payer
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transferData.map((entry) => (
                      <tr key={entry.employee.id} className={`hover:bg-gray-50 ${!entry.isValid ? 'bg-red-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className={`h-8 w-8 rounded-full ${entry.isValid ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center`}>
                                <span className={`text-xs font-medium ${entry.isValid ? 'text-green-600' : 'text-red-600'}`}>
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {entry.compteBancaire ? formatBankAccount(entry.compteBancaire) : 'Non renseigné'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {entry.agence || 'Agence non renseignée'}
                          </div>
                          {entry.errors.length > 0 && (
                            <div className="text-xs text-red-600 mt-1">
                              {entry.errors.join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <span className={entry.isValid ? 'text-green-600' : 'text-gray-400'}>
                            {formatCurrency(entry.netAPayer)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {entry.isValid ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Valide
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Invalide
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        TOTAL À VIRER ({summary?.validTransfers || 0} virements)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600">
                        {formatCurrency(summary?.totalAmount || 0)}
                      </td>
                      <td></td>
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

export default BankTransferPage;
