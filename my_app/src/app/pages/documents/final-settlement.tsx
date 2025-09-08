import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { 
  Receipt, 
  Download, 
  Search, 
  Calendar,
  User,
  Eye,
  Printer,
  Mail,
  Plus,
  RefreshCw,
  AlertCircle,
  DollarSign
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

export default function FinalSettlementPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [dateFin, setDateFin] = useState<string>('');
  const [motifDepart, setMotifDepart] = useState<string>('');
  const [congesNonPris, setCongesNonPris] = useState<string>('');
  const [indemniteDepart, setIndemniteDepart] = useState<string>('');
  const [autresIndemnites, setAutresIndemnites] = useState<string>('');
  const [retenues, setRetenues] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const motifsDepart = [
    { value: 'demission', label: 'Démission' },
    { value: 'licenciement', label: 'Licenciement' },
    { value: 'fin_contrat', label: 'Fin de contrat' },
    { value: 'retraite', label: 'Retraite' },
    { value: 'mutation', label: 'Mutation' },
    { value: 'autre', label: 'Autre' }
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
      params.append('type', 'SOLDE_COMPTE');
      
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

  const generateFinalSettlement = async () => {
    if (!selectedEmployee || !dateFin || !motifDepart) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (new Date(dateFin) > new Date()) {
      setError('La date de fin ne peut pas être dans le futur');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/documents/final-settlement/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          dateFin,
          motifDepart,
          congesNonPris: congesNonPris || '0',
          indemniteDepart: indemniteDepart || '0',
          autresIndemnites: autresIndemnites || '0',
          retenues: retenues || '0'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Recharger la liste des documents
        fetchDocuments();
        // Réinitialiser le formulaire
        setSelectedEmployee('');
        setDateFin('');
        setMotifDepart('');
        setCongesNonPris('');
        setIndemniteDepart('');
        setAutresIndemnites('');
        setRetenues('');
      } else {
        setError(data.error || 'Erreur lors de la génération du solde de tout compte');
      }
    } catch (error) {
      setError('Erreur lors de la génération du solde de tout compte');
      console.error('Error generating final settlement:', error);
    } finally {
      setGenerating(false);
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
            <h1 className="text-2xl font-bold text-gray-900">Solde de tout compte</h1>
            <p className="text-gray-600">Saisie des éléments de rupture et génération du document officiel</p>
          </div>
        </div>

        {/* Génération de solde */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            <Plus className="inline-block w-5 h-5 mr-2" />
            Générer un nouveau solde de tout compte
          </h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                Date de fin de contrat *
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
                Motif de départ *
              </label>
              <select
                value={motifDepart}
                onChange={(e) => setMotifDepart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un motif</option>
                {motifsDepart.map((motif) => (
                  <option key={motif.value} value={motif.value}>
                    {motif.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Éléments financiers */}
          <div className="border-t pt-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Éléments financiers
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Congés non pris (DH)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={congesNonPris}
                  onChange={(e) => setCongesNonPris(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Indemnité de départ (DH)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={indemniteDepart}
                  onChange={(e) => setIndemniteDepart(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Autres indemnités (DH)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={autresIndemnites}
                  onChange={(e) => setAutresIndemnites(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Retenues diverses (DH)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={retenues}
                  onChange={(e) => setRetenues(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={generateFinalSettlement}
              disabled={generating}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {generating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {generating ? 'Génération...' : 'Générer le solde'}
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
            <button
              onClick={fetchDocuments}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </button>
          </div>
        </div>

        {/* Liste des soldes */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Soldes générés ({filteredDocuments.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">Chargement...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="p-6 text-center">
              <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Aucun solde de tout compte trouvé</p>
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
                      Motif de départ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Solde net
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
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-orange-600" />
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
                        {document.metadata?.motifDepart ? 
                          motifsDepart.find(m => m.value === document.metadata.motifDepart)?.label || 
                          document.metadata.motifDepart : 
                          'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {document.metadata?.soldeNet ? 
                          `${document.metadata.soldeNet.toLocaleString()} DH` : 
                          'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(document.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(document.dateGeneration).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            <Printer className="w-4 h-4" />
                          </button>
                          <button className="text-purple-600 hover:text-purple-900">
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
