import React, { useState, useEffect } from 'react';
import { Layout } from '../../../components/Layout';
import { Calculator, ArrowLeft, Download, User, Calendar, Search, Plus, Minus } from 'lucide-react';
import { useRouter } from 'next/router';
import { Employee } from '@prisma/client';

interface SettlementElement {
  id: string;
  type: 'GAIN' | 'RETENUE';
  description: string;
  amount: number;
}

const FinalSettlementPage = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [departureDate, setDepartureDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [departureReason, setDepartureReason] = useState('');
  const [unusedVacationDays, setUnusedVacationDays] = useState(0);
  const [noticePeriod, setNoticePeriod] = useState(0);
  const [severanceAmount, setSeveranceAmount] = useState(0);
  const [customElements, setCustomElements] = useState<SettlementElement[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [settlementData, setSettlementData] = useState<any>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des employés:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCustomElement = () => {
    const newElement: SettlementElement = {
      id: Date.now().toString(),
      type: 'GAIN',
      description: '',
      amount: 0
    };
    setCustomElements([...customElements, newElement]);
  };

  const updateCustomElement = (id: string, field: keyof SettlementElement, value: any) => {
    setCustomElements(prev => 
      prev.map(element => 
        element.id === id ? { ...element, [field]: value } : element
      )
    );
  };

  const removeCustomElement = (id: string) => {
    setCustomElements(prev => prev.filter(element => element.id !== id));
  };

  const calculateVacationPay = (employee: Employee) => {
    // Calcul approximatif : salaire journalier * jours de congés non pris
    const dailySalary = employee.salaireBase / 26; // 26 jours ouvrables par mois
    return dailySalary * unusedVacationDays;
  };

  const calculateNoticePay = (employee: Employee) => {
    // Calcul du préavis : salaire journalier * jours de préavis
    const dailySalary = employee.salaireBase / 26;
    return dailySalary * noticePeriod;
  };

  const handleGenerateSettlement = async () => {
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

      const vacationPay = calculateVacationPay(employee);
      const noticePay = calculateNoticePay(employee);

      // Calcul des totaux
      const totalGains = vacationPay + noticePay + severanceAmount + 
        customElements.filter(e => e.type === 'GAIN').reduce((sum, e) => sum + e.amount, 0);
      
      const totalRetenues = customElements.filter(e => e.type === 'RETENUE').reduce((sum, e) => sum + e.amount, 0);
      
      const netToPay = totalGains - totalRetenues;

      setSettlementData({
        employee,
        departureDate,
        departureReason,
        unusedVacationDays,
        noticePeriod,
        severanceAmount,
        vacationPay,
        noticePay,
        customElements,
        totalGains,
        totalRetenues,
        netToPay,
        generatedDate: new Date()
      });
      setShowPreview(true);

    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      alert('Erreur lors de la génération du solde de tout compte');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!settlementData) return;

    try {
      const response = await fetch('/api/documents/final-settlement/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: settlementData.employee.id,
          settlementData
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `solde_tout_compte_${settlementData.employee.matricule}.pdf`;
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

  const calculateSeniority = (hireDate: Date, departureDate: string) => {
    const hire = new Date(hireDate);
    const departure = new Date(departureDate);
    const years = departure.getFullYear() - hire.getFullYear();
    const months = departure.getMonth() - hire.getMonth();
    
    let totalMonths = years * 12 + months;
    if (departure.getDate() < hire.getDate()) {
      totalMonths--;
    }
    
    const seniorityYears = Math.floor(totalMonths / 12);
    const seniorityMonths = totalMonths % 12;
    
    if (seniorityYears === 0) {
      return `${seniorityMonths} mois`;
    } else if (seniorityMonths === 0) {
      return `${seniorityYears} an${seniorityYears > 1 ? 's' : ''}`;
    } else {
      return `${seniorityYears} an${seniorityYears > 1 ? 's' : ''} et ${seniorityMonths} mois`;
    }
  };

  const filteredEmployees = employees.filter(employee =>
    employee.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.matricule.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedEmployeeData = employees.find(emp => emp.id === selectedEmployee);

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
            <Calculator className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-900">Solde de tout compte</h1>
          </div>
          
          <p className="text-gray-600 text-lg">
            Saisie des éléments de rupture (congés non pris, indemnités…) et génération du document officiel de solde.
          </p>
        </div>

        {!showPreview ? (
          <>
            {/* Sélection de l'employé */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Sélection de l'employé</h3>
              
              <div className="mb-4">
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

              <div className="max-h-48 overflow-y-auto border rounded-lg">
                {filteredEmployees.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    Aucun employé trouvé
                  </div>
                ) : (
                  filteredEmployees.map((employee) => (
                    <div key={employee.id} className="px-4 py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id={`employee-${employee.id}`}
                          name="selectedEmployee"
                          value={employee.id}
                          checked={selectedEmployee === employee.id}
                          onChange={(e) => setSelectedEmployee(e.target.value)}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                        />
                        <label htmlFor={`employee-${employee.id}`} className="ml-3 flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {employee.prenom} {employee.nom}
                              </div>
                              <div className="text-sm text-gray-500">
                                {employee.matricule} • {employee.fonction} • {employee.status}
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

            {/* Configuration du départ */}
            {selectedEmployee && (
              <>
                <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informations de départ</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Date de départ
                      </label>
                      <input
                        type="date"
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        className="payroll-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Motif de départ
                      </label>
                      <select
                        value={departureReason}
                        onChange={(e) => setDepartureReason(e.target.value)}
                        className="payroll-input"
                      >
                        <option value="">Sélectionner un motif</option>
                        <option value="DEMISSION">Démission</option>
                        <option value="LICENCIEMENT">Licenciement</option>
                        <option value="FIN_CONTRAT">Fin de contrat</option>
                        <option value="RETRAITE">Retraite</option>
                        <option value="MUTATION">Mutation</option>
                        <option value="AUTRE">Autre</option>
                      </select>
                    </div>
                  </div>

                  {selectedEmployeeData && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Informations employé</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Date d'embauche :</span>
                          <span className="ml-2 font-medium">{formatDate(selectedEmployeeData.dateEmbauche)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Ancienneté :</span>
                          <span className="ml-2 font-medium">{calculateSeniority(selectedEmployeeData.dateEmbauche, departureDate)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Éléments de calcul */}
                <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Éléments de calcul</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Congés non pris (jours)
                      </label>
                      <input
                        type="number"
                        value={unusedVacationDays}
                        onChange={(e) => setUnusedVacationDays(Number(e.target.value))}
                        min="0"
                        className="payroll-input"
                      />
                      {selectedEmployeeData && (
                        <p className="text-sm text-gray-500 mt-1">
                          Valeur : {formatCurrency(calculateVacationPay(selectedEmployeeData))}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Préavis (jours)
                      </label>
                      <input
                        type="number"
                        value={noticePeriod}
                        onChange={(e) => setNoticePeriod(Number(e.target.value))}
                        min="0"
                        className="payroll-input"
                      />
                      {selectedEmployeeData && (
                        <p className="text-sm text-gray-500 mt-1">
                          Valeur : {formatCurrency(calculateNoticePay(selectedEmployeeData))}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Indemnité de licenciement
                      </label>
                      <input
                        type="number"
                        value={severanceAmount}
                        onChange={(e) => setSeveranceAmount(Number(e.target.value))}
                        min="0"
                        step="0.01"
                        className="payroll-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Éléments personnalisés */}
                <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Éléments personnalisés</h3>
                    <button
                      onClick={addCustomElement}
                      className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter un élément</span>
                    </button>
                  </div>

                  {customElements.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Aucun élément personnalisé ajouté
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {customElements.map((element) => (
                        <div key={element.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <select
                            value={element.type}
                            onChange={(e) => updateCustomElement(element.id, 'type', e.target.value)}
                            className="w-32 payroll-input"
                          >
                            <option value="GAIN">Gain</option>
                            <option value="RETENUE">Retenue</option>
                          </select>
                          
                          <input
                            type="text"
                            value={element.description}
                            onChange={(e) => updateCustomElement(element.id, 'description', e.target.value)}
                            placeholder="Description"
                            className="flex-1 payroll-input"
                          />
                          
                          <input
                            type="number"
                            value={element.amount}
                            onChange={(e) => updateCustomElement(element.id, 'amount', Number(e.target.value))}
                            placeholder="Montant"
                            step="0.01"
                            className="w-32 payroll-input"
                          />
                          
                          <button
                            onClick={() => removeCustomElement(element.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bouton de génération */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Générer le solde de tout compte</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Document officiel de fin de contrat pour {selectedEmployeeData?.prenom} {selectedEmployeeData?.nom}
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateSettlement}
                      disabled={!departureReason || generating}
                      className="flex items-center space-x-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Calculator className="w-5 h-5" />
                      <span>{generating ? 'Génération...' : 'Générer le solde'}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {/* Prévisualisation du solde */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Prévisualisation du solde de tout compte</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Retour à la saisie
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Télécharger PDF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Document de solde */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="p-8">
                {/* En-tête */}
                <div className="text-center border-b-2 border-gray-200 pb-6 mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">SOLDE DE TOUT COMPTE</h2>
                  <p className="text-gray-600">
                    Établi le {formatDate(settlementData.generatedDate)}
                  </p>
                </div>

                {/* Informations employé et départ */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Informations du salarié</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nom et prénom :</span>
                        <span className="font-medium">{settlementData.employee.prenom} {settlementData.employee.nom}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Matricule :</span>
                        <span className="font-medium">{settlementData.employee.matricule}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fonction :</span>
                        <span className="font-medium">{settlementData.employee.fonction}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date d'embauche :</span>
                        <span className="font-medium">{formatDate(settlementData.employee.dateEmbauche)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Informations de départ</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date de départ :</span>
                        <span className="font-medium">{formatDate(settlementData.departureDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Motif :</span>
                        <span className="font-medium">{settlementData.departureReason}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ancienneté :</span>
                        <span className="font-medium">{calculateSeniority(settlementData.employee.dateEmbauche, settlementData.departureDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Détail des gains */}
                <div className="mb-8">
                  <h3 className="font-medium text-gray-900 mb-4 bg-green-50 p-3 rounded">GAINS</h3>
                  <div className="space-y-2 text-sm">
                    {settlementData.vacationPay > 0 && (
                      <div className="flex justify-between">
                        <span>Congés non pris ({settlementData.unusedVacationDays} jours)</span>
                        <span className="font-medium">{formatCurrency(settlementData.vacationPay)}</span>
                      </div>
                    )}
                    {settlementData.noticePay > 0 && (
                      <div className="flex justify-between">
                        <span>Indemnité de préavis ({settlementData.noticePeriod} jours)</span>
                        <span className="font-medium">{formatCurrency(settlementData.noticePay)}</span>
                      </div>
                    )}
                    {settlementData.severanceAmount > 0 && (
                      <div className="flex justify-between">
                        <span>Indemnité de licenciement</span>
                        <span className="font-medium">{formatCurrency(settlementData.severanceAmount)}</span>
                      </div>
                    )}
                    {settlementData.customElements.filter((e: SettlementElement) => e.type === 'GAIN').map((element: SettlementElement) => (
                      <div key={element.id} className="flex justify-between">
                        <span>{element.description}</span>
                        <span className="font-medium">{formatCurrency(element.amount)}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 pt-2 flex justify-between font-medium text-lg">
                      <span>TOTAL GAINS</span>
                      <span className="text-green-600">{formatCurrency(settlementData.totalGains)}</span>
                    </div>
                  </div>
                </div>

                {/* Détail des retenues */}
                {settlementData.totalRetenues > 0 && (
                  <div className="mb-8">
                    <h3 className="font-medium text-gray-900 mb-4 bg-red-50 p-3 rounded">RETENUES</h3>
                    <div className="space-y-2 text-sm">
                      {settlementData.customElements.filter((e: SettlementElement) => e.type === 'RETENUE').map((element: SettlementElement) => (
                        <div key={element.id} className="flex justify-between">
                          <span>{element.description}</span>
                          <span className="font-medium">{formatCurrency(element.amount)}</span>
                        </div>
                      ))}
                      <div className="border-t border-gray-200 pt-2 flex justify-between font-medium text-lg">
                        <span>TOTAL RETENUES</span>
                        <span className="text-red-600">{formatCurrency(settlementData.totalRetenues)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Net à payer */}
                <div className="bg-gray-50 p-6 rounded-lg mb-8">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">NET À PAYER</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(settlementData.netToPay)}
                    </span>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="text-center">
                    <div className="border-t border-gray-300 pt-4 mt-8">
                      <div className="text-sm font-medium text-gray-900">Signature de l'employeur</div>
                      <div className="text-xs text-gray-600 mt-1">Cachet de l'entreprise</div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="border-t border-gray-300 pt-4 mt-8">
                      <div className="text-sm font-medium text-gray-900">Signature du salarié</div>
                      <div className="text-xs text-gray-600 mt-1">Pour accord et quitus</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default FinalSettlementPage;
