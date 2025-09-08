import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { 
  Award, 
  Download, 
  Search, 
  Calendar,
  User,
  Eye,
  Printer,
  Mail,
  Plus,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface Employee {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  fonction: string;
  dateEmbauche: string;
  anciennete: number;
}

interface Document {
  id: string;
  type: string;
  title: string;
  description: string;
  employee: Employee;
  periode: string;
  dateGeneration: string;
  status: 'GENERATED' | 'SENT' | 'ARCHIVED';
  downloadCount: number;
  metadata: any;
}

export default function SalaryCertificatePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [certificateType, setCertificateType] = useState<string>('');
  const [dateDebut, setDateDebut] = useState<string>('');
  const [dateFin, setDateFin] = useState<string>('');
  const [motif, setMotif] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const certificateTypes = [
    { value: 'revenu', label: 'Attestation de revenu' },
    { value: 'presence', label: 'Attestation de présence' },
    { value: 'travail', label: 'Attestation de travail' },
    { value: 'salaire', label: 'Attestation de salaire' }
  ];

  // Charger les employés
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Charger les documents
  useEffect(() => {
    fetchDocuments();
  }, [selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('type', 'ATTESTATION_SALAIRE');
      
      if (selectedEmployee) {
        params.append('employeeId', selectedEmployee);
      }

      const response = await fetch(`/api/documents?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCertificate = async () => {
    if (!selectedEmployee || !certificateType || !dateDebut || !dateFin) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (new Date(dateDebut) > new Date(dateFin)) {
      setError('La date de début doit être antérieure à la date de fin');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/documents/salary-certificate/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          type: certificateType,
          dateDebut,
          dateFin,
          motif
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Recharger la liste des documents
        fetchDocuments();
        // Réinitialiser le formulaire
        setSelectedEmployee('');
        setCertificateType('');
        setDateDebut('');
        setDateFin('');
        setMotif('');
      } else {
        setError(data.error || 'Erreur lors de la génération de l\'attestation');
      }
    } catch (error) {
      setError('Erreur lors de la génération de l\'attestation');
      console.error('Error generating certificate:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/salary-certificate/generate?id=${documentId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `attestation-salaire-${documentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.employee.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.employee.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.employee.matricule.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      GENERATED: { color: 'bg-blue-100 text-blue-800', text: 'Généré' },
      SENT: { color: 'bg-green-100 text-green-800', text: 'Envoyé' },
      ARCHIVED: { color: 'bg-gray-100 text-gray-800', text: 'Archivé' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.GENERATED;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attestations de salaire</h1>
            <p className="text-gray-600">Génération d'attestations de revenu ou de présence</p>
          </div>
        </div>

        {/* Génération d'attestation */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            <Plus className="inline-block w-5 h-5 mr-2" />
            Générer une nouvelle attestation
          </h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employé *
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un employé</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.prenom} {employee.nom} ({employee.matricule})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type d'attestation *
              </label>
              <select
                value={certificateType}
                onChange={(e) => setCertificateType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un type</option>
                {certificateTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de début *
              </label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de fin *
              </label>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motif (optionnel)
              </label>
              <textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                rows={3}
                placeholder="Précisez le motif de la demande d'attestation..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={generateCertificate}
              disabled={generating}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {generating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {generating ? 'Génération...' : 'Générer l\'attestation'}
            </button>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, prénom ou matricule..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Liste des attestations */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Attestations générées ({filteredDocuments.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">Chargement...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="p-6 text-center">
              <Award className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Aucune attestation trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employé
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Période
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date génération
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDocuments.map((document) => (
                    <tr key={document.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-green-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {document.employee.prenom} {document.employee.nom}
                            </div>
                            <div className="text-sm text-gray-500">
                              {document.employee.matricule} • {document.employee.fonction}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {document.metadata?.typeAttestation ? 
                          certificateTypes.find(t => t.value === document.metadata.typeAttestation)?.label || 
                          document.metadata.typeAttestation : 
                          'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {document.periode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(document.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(document.dateGeneration).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => window.open(`/documents/salary-certificate/${document.id}`, '_blank')}
                            className="text-green-600 hover:text-green-800"
                            title="Visualiser"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(document.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Télécharger"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => window.print()}
                            className="text-gray-600 hover:text-gray-800"
                            title="Imprimer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            className="text-purple-600 hover:text-purple-800"
                            title="Envoyer par email"
                          >
                            <Mail className="w-4 h-4" />
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
    </Layout>
  );
}
