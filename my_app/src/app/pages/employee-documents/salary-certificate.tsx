import React, { useState, useEffect } from 'react';
import { Layout } from '../../../components/Layout';
import { Award, ArrowLeft, Download, User, Calendar, Search, FileText } from 'lucide-react';
import { useRouter } from 'next/router';
import { Employee } from '@prisma/client';

type CertificateType = 'REVENU' | 'PRESENCE';

const SalaryCertificatePage = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [certificateType, setCertificateType] = useState<CertificateType>('REVENU');
  const [searchTerm, setSearchTerm] = useState('');
  const [customText, setCustomText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [certificateData, setCertificateData] = useState<any>(null);

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

  const handleGenerateCertificate = async () => {
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

      setCertificateData({
        employee,
        type: certificateType,
        customText,
        generatedDate: new Date()
      });
      setShowPreview(true);

    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      alert('Erreur lors de la génération de l\'attestation');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!certificateData) return;

    try {
      // Calculate date range for the certificate (last 12 months)
      const dateFin = new Date();
      const dateDebut = new Date();
      dateDebut.setFullYear(dateFin.getFullYear() - 1);

      const response = await fetch('/api/documents/salary-certificate/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: certificateData.employee.id,
          type: certificateData.type,
          dateDebut: dateDebut.toISOString(),
          dateFin: dateFin.toISOString(),
          motif: `Attestation de ${certificateData.type.toLowerCase()}`
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `attestation_${certificateData.type.toLowerCase()}_${certificateData.employee.matricule}.pdf`;
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

  const calculateSeniority = (hireDate: Date) => {
    const today = new Date();
    const hire = new Date(hireDate);
    const years = today.getFullYear() - hire.getFullYear();
    const months = today.getMonth() - hire.getMonth();
    
    let totalMonths = years * 12 + months;
    if (today.getDate() < hire.getDate()) {
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

  const getDefaultText = (type: CertificateType, employee: Employee | null) => {
    if (!employee) return '';
    
    if (type === 'REVENU') {
      return `Je soussigné(e), certifie que Monsieur/Madame ${employee.prenom} ${employee.nom}, titulaire de la CIN n° ${employee.cin || 'N/A'}, exerce les fonctions de ${employee.fonction} au sein de notre établissement depuis le ${formatDate(employee.dateEmbauche)}.\n\nSon salaire mensuel brut s'élève à ${formatCurrency(employee.salaireBase)}.\n\nCette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.`;
    } else {
      return `Je soussigné(e), certifie que Monsieur/Madame ${employee.prenom} ${employee.nom}, titulaire de la CIN n° ${employee.cin || 'N/A'}, est employé(e) au sein de notre établissement en qualité de ${employee.fonction} depuis le ${formatDate(employee.dateEmbauche)}.\n\nL'intéressé(e) est présent(e) et assidu(e) dans l'exercice de ses fonctions.\n\nCette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.`;
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
            <Award className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Attestation de salaire</h1>
          </div>
          
          <p className="text-gray-600 text-lg">
            Génération d'attestations de revenu ou de présence à la demande du salarié.
          </p>
        </div>

        {!showPreview ? (
          <>
            {/* Configuration de l'attestation */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration de l'attestation</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Type d'attestation
                  </label>
                  <select
                    value={certificateType}
                    onChange={(e) => setCertificateType(e.target.value as CertificateType)}
                    className="payroll-input"
                  >
                    <option value="REVENU">Attestation de revenu</option>
                    <option value="PRESENCE">Attestation de présence</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    {certificateType === 'REVENU' 
                      ? 'Certifie le salaire et les revenus de l\'employé'
                      : 'Certifie la présence et l\'assiduité de l\'employé'
                    }
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
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
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
                  ))
                )}
              </div>
            </div>

            {/* Personnalisation du texte */}
            {selectedEmployee && (
              <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contenu de l'attestation</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Texte de l'attestation
                    </label>
                    <textarea
                      value={customText || getDefaultText(certificateType, selectedEmployeeData || null)}
                      onChange={(e) => setCustomText(e.target.value)}
                      rows={8}
                      className="payroll-input"
                      placeholder="Texte personnalisé de l'attestation..."
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Vous pouvez modifier le texte par défaut selon vos besoins
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setCustomText(getDefaultText(certificateType, selectedEmployeeData || null))}
                    className="text-sm text-green-600 hover:text-green-800"
                  >
                    Restaurer le texte par défaut
                  </button>
                </div>
              </div>
            )}

            {/* Bouton de génération */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Générer l'attestation</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedEmployee ? 
                      `Attestation de ${certificateType.toLowerCase()} pour ${selectedEmployeeData?.prenom} ${selectedEmployeeData?.nom}` :
                      'Sélectionnez un employé pour continuer'
                    }
                  </p>
                </div>
                <button
                  onClick={handleGenerateCertificate}
                  disabled={!selectedEmployee || generating}
                  className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Award className="w-5 h-5" />
                  <span>{generating ? 'Génération...' : 'Générer l\'attestation'}</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Prévisualisation de l'attestation */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Prévisualisation de l'attestation</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Retour à la sélection
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Télécharger PDF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Attestation */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="p-8">
                {/* En-tête */}
                <div className="text-center border-b-2 border-gray-200 pb-6 mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    ATTESTATION {certificateData.type === 'REVENU' ? 'DE REVENU' : 'DE PRÉSENCE'}
                  </h2>
                  <p className="text-gray-600">
                    Délivrée le {formatDate(certificateData.generatedDate)}
                  </p>
                </div>

                {/* Informations employé */}
                <div className="mb-8">
                  <h3 className="font-medium text-gray-900 mb-4">Informations du salarié</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Nom et prénom :</span>
                        <div className="font-medium">{certificateData.employee.prenom} {certificateData.employee.nom}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Matricule :</span>
                        <div className="font-medium">{certificateData.employee.matricule}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">CIN :</span>
                        <div className="font-medium">{certificateData.employee.cin || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Fonction :</span>
                        <div className="font-medium">{certificateData.employee.fonction}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Date d'embauche :</span>
                        <div className="font-medium">{formatDate(certificateData.employee.dateEmbauche)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Ancienneté :</span>
                        <div className="font-medium">{calculateSeniority(certificateData.employee.dateEmbauche)}</div>
                      </div>
                      {certificateData.type === 'REVENU' && (
                        <>
                          <div>
                            <span className="text-gray-600">Salaire de base :</span>
                            <div className="font-medium">{formatCurrency(certificateData.employee.salaireBase)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Situation familiale :</span>
                            <div className="font-medium">{certificateData.employee.situationFamiliale}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contenu de l'attestation */}
                <div className="mb-8">
                  <h3 className="font-medium text-gray-900 mb-4">Attestation</h3>
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <div className="text-gray-800 leading-relaxed whitespace-pre-line">
                      {certificateData.customText || getDefaultText(certificateData.type, certificateData.employee)}
                    </div>
                  </div>
                </div>

                {/* Signature */}
                <div className="text-right">
                  <div className="inline-block">
                    <div className="text-sm text-gray-600 mb-2">Fait à Casablanca, le {formatDate(certificateData.generatedDate)}</div>
                    <div className="border-t border-gray-300 pt-4 mt-8">
                      <div className="text-sm font-medium text-gray-900">Signature et cachet de l'employeur</div>
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

export default SalaryCertificatePage;
