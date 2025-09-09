import React, { useState, useEffect } from 'react';
import { Layout } from '../../../components/Layout';
import { FileText, ArrowLeft, Download, User, Calendar, Search, Filter } from 'lucide-react';
import { useRouter } from 'next/router';
import { Employee } from '@prisma/client';
import { calculerPaie, type EmployeePayrollData } from '../../../lib/payrollCalculations';

const PayslipPage = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [payrollData, setPayrollData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

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

  const handleGeneratePayslip = async () => {
    if (!selectedEmployee) {
      alert('Veuillez sélectionner un employé');
      return;
    }

    setGenerating(true);
    
    try {
      const employee = employees.find(emp => emp.id === selectedEmployee);
      if (!employee) {
        throw new Error('Employé non trouvé');
      }

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
      
      setPayrollData({
        employee,
        payroll: payrollResult,
        period: selectedMonth
      });
      setShowPreview(true);

    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      alert('Erreur lors de la génération du bulletin de paie');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!payrollData) return;

    try {
      const [year, month] = payrollData.period.split('-');
      const response = await fetch('/api/documents/payslip/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: payrollData.employee.id,
          mois: month,
          annee: parseInt(year)
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `bulletin_paie_${payrollData.employee.matricule}_${payrollData.period}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Erreur lors du téléchargement du PDF');
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement du PDF');
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

  const getMonthLabel = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long'
    }).format(date);
  };

  const filteredEmployees = employees.filter(employee =>
    employee.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.matricule.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Bulletin de paie</h1>
          </div>
          
          <p className="text-gray-600 text-lg">
            Génération du bulletin de paie individuel en PDF, destiné à la remise au salarié.
          </p>
        </div>

        {!showPreview ? (
          <>
            {/* Configuration de génération */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration du bulletin</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    Bulletin pour {getMonthLabel(selectedMonth)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Search className="w-4 h-4 inline mr-1" />
                    Rechercher un employé
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nom, prénom, matricule..."
                    className="payroll-input"
                  />
                </div>
              </div>
            </div>

            {/* Sélection de l'employé */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Sélectionner l'employé ({filteredEmployees.length} employé(s))
                </h3>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {filteredEmployees.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    Aucun employé trouvé
                  </div>
                ) : (
                  filteredEmployees.map((employee) => (
                    <div key={employee.id} className="px-6 py-4 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id={`employee-${employee.id}`}
                          name="selectedEmployee"
                          value={employee.id}
                          checked={selectedEmployee === employee.id}
                          onChange={(e) => setSelectedEmployee(e.target.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor={`employee-${employee.id}`} className="ml-3 flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-600">
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
                  ))
                )}
              </div>
            </div>

            {/* Bouton de génération */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Générer le bulletin</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedEmployee ? 
                      `Bulletin de paie pour ${getMonthLabel(selectedMonth)}` :
                      'Sélectionnez un employé pour continuer'
                    }
                  </p>
                </div>
                <button
                  onClick={handleGeneratePayslip}
                  disabled={!selectedEmployee || generating}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-5 h-5" />
                  <span>{generating ? 'Génération...' : 'Générer le bulletin'}</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Prévisualisation du bulletin */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Prévisualisation du bulletin</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Retour à la sélection
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Télécharger PDF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bulletin de paie */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="p-8">
                {/* En-tête */}
                <div className="border-b-2 border-gray-200 pb-6 mb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">BULLETIN DE PAIE</h2>
                      <p className="text-gray-600 mt-1">Période : {getMonthLabel(payrollData.period)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Matricule</div>
                      <div className="font-medium">{payrollData.employee.matricule}</div>
                    </div>
                  </div>
                </div>

                {/* Informations employé */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Informations salarié</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nom et prénom :</span>
                        <span className="font-medium">{payrollData.employee.prenom} {payrollData.employee.nom}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fonction :</span>
                        <span className="font-medium">{payrollData.employee.fonction}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">CNSS :</span>
                        <span className="font-medium">{payrollData.employee.cnss || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date d'embauche :</span>
                        <span className="font-medium">{formatDate(payrollData.employee.dateEmbauche)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Période de travail</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Jours travaillés :</span>
                        <span className="font-medium">{payrollData.employee.nbreJourMois} jours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Situation familiale :</span>
                        <span className="font-medium">{payrollData.employee.situationFamiliale}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nombre de déductions :</span>
                        <span className="font-medium">{payrollData.employee.nbrDeductions}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Détail des gains */}
                <div className="mb-8">
                  <h3 className="font-medium text-gray-900 mb-4 bg-green-50 p-3 rounded">GAINS</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Salaire de base</span>
                      <span className="font-medium">{formatCurrency(payrollData.employee.salaireBase)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prime d'ancienneté</span>
                      <span className="font-medium">{formatCurrency(payrollData.payroll.gains.primeAnciennete)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Indemnité de logement</span>
                      <span className="font-medium">{formatCurrency(payrollData.employee.indemniteLogement)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Indemnité de panier</span>
                      <span className="font-medium">{formatCurrency(payrollData.employee.indemnitePanier)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prime de transport</span>
                      <span className="font-medium">{formatCurrency(payrollData.employee.primeTransport)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Indemnité de représentation</span>
                      <span className="font-medium">{formatCurrency(payrollData.employee.indemniteRepresentation)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between font-medium text-lg">
                      <span>TOTAL GAINS</span>
                      <span className="text-green-600">{formatCurrency(payrollData.payroll.salaireBrut)}</span>
                    </div>
                  </div>
                </div>

                {/* Détail des retenues */}
                <div className="mb-8">
                  <h3 className="font-medium text-gray-900 mb-4 bg-red-50 p-3 rounded">RETENUES</h3>
                  <div className="space-y-2 text-sm">
                    <div className="font-medium text-gray-800 mb-2">Cotisations salariales :</div>
                    <div className="ml-4 space-y-1">
                      <div className="flex justify-between">
                        <span>CNSS Prestations</span>
                        <span className="font-medium">{formatCurrency(payrollData.payroll.cotisationsSalariales.cnssPrestation)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>AMO Salariale</span>
                        <span className="font-medium">{formatCurrency(payrollData.payroll.cotisationsSalariales.amoSalariale)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Retraite Salariale</span>
                        <span className="font-medium">{formatCurrency(payrollData.payroll.cotisationsSalariales.retraiteSalariale)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Assurance Divers Salariale</span>
                        <span className="font-medium">{formatCurrency(payrollData.payroll.cotisationsSalariales.assuranceDiversSalariale)}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between mt-3">
                      <span>Impôt sur le revenu</span>
                      <span className="font-medium">{formatCurrency(payrollData.payroll.calculIGR.impotSurRevenu)}</span>
                    </div>
                    
                    {payrollData.payroll.autresRetenues.totalAutresRetenues > 0 && (
                      <>
                        <div className="font-medium text-gray-800 mb-2 mt-3">Autres retenues :</div>
                        <div className="ml-4 space-y-1">
                          {payrollData.employee.remboursementCredit > 0 && (
                            <div className="flex justify-between">
                              <span>Remboursement crédit immobilier</span>
                              <span className="font-medium">{formatCurrency(payrollData.employee.remboursementCredit)}</span>
                            </div>
                          )}
                          {payrollData.employee.creditConso > 0 && (
                            <div className="flex justify-between">
                              <span>Crédit consommation</span>
                              <span className="font-medium">{formatCurrency(payrollData.employee.creditConso)}</span>
                            </div>
                          )}
                          {payrollData.employee.remboursementAvance > 0 && (
                            <div className="flex justify-between">
                              <span>Remboursement avance</span>
                              <span className="font-medium">{formatCurrency(payrollData.employee.remboursementAvance)}</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    
                    <div className="border-t border-gray-200 pt-2 flex justify-between font-medium text-lg">
                      <span>TOTAL RETENUES</span>
                      <span className="text-red-600">{formatCurrency(payrollData.payroll.totalRetenues)}</span>
                    </div>
                  </div>
                </div>

                {/* Net à payer */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">NET À PAYER</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(payrollData.payroll.salaireNetAPayer)}
                    </span>
                  </div>
                </div>

                {/* Informations bancaires */}
                {payrollData.employee.compteBancaire && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-2">Informations bancaires</h3>
                    <div className="text-sm text-gray-600">
                      <div>Compte : {payrollData.employee.compteBancaire}</div>
                      {payrollData.employee.agence && <div>Agence : {payrollData.employee.agence}</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default PayslipPage;
