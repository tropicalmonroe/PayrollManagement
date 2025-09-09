import { useState, useEffect } from 'react';
import { Layout } from '../../../components/Layout';
import { Download, FileText, Calendar } from 'lucide-react';

interface Employee {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  fonction: string;
  salaireBase: number;
  cin: string;
}

export default function IgrTaxStatement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [periode, setPeriode] = useState({
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear().toString()
  });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStatement = async () => {
    if (selectedEmployees.length === 0) {
      alert('Veuillez sélectionner au moins un employé');
      return;
    }

    try {
      setGenerating(true);
      
      const response = await fetch('/api/documents/igr-tax-statement/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeIds: selectedEmployees,
          periode
        }),
      });

      if (response.ok) {
        // Download the PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `declaration-igr-${periode.mois}-${periode.annee}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error('Error generating IGR statement:', error);
      alert('Erreur lors de la génération de la déclaration IGR');
    } finally {
      setGenerating(false);
    }
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const selectAllEmployees = () => {
    setSelectedEmployees(employees.map(emp => emp.id));
  };

  const clearSelection = () => {
    setSelectedEmployees([]);
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Déclaration IGR</h1>
          <p className="text-gray-600">
            Générer les déclarations d'impôt sur le revenu pour les employés
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Configuration */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="mb-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Configuration de la période
              </h3>
              <p className="text-sm text-gray-600">
                Sélectionnez la période pour la déclaration IGR
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="mois" className="block text-sm font-medium text-gray-700">
                    Mois
                  </label>
                  <select
                    id="mois"
                    value={periode.mois.toString()}
                    onChange={(e) => setPeriode(prev => ({ ...prev, mois: parseInt(e.target.value) }))}
                    className="payroll-input"
                  >
                    {monthNames.map((month, index) => (
                      <option key={index + 1} value={(index + 1).toString()}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="annee" className="block text-sm font-medium text-gray-700">
                    Année
                  </label>
                  <input
                    id="annee"
                    type="number"
                    value={periode.annee}
                    onChange={(e) => setPeriode(prev => ({ ...prev, annee: e.target.value }))}
                    min="2020"
                    max="2030"
                    className="payroll-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="mb-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Génération du document
              </h3>
              <p className="text-sm text-gray-600">
                Générer la déclaration IGR pour les employés sélectionnés
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <p className="text-sm text-gray-600">
                  {selectedEmployees.length} employé(s) sélectionné(s)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllEmployees}
                    disabled={loading}
                    className="payroll-button-secondary text-sm px-3 py-1"
                  >
                    Tout sélectionner
                  </button>
                  <button
                    onClick={clearSelection}
                    disabled={loading}
                    className="payroll-button-secondary text-sm px-3 py-1"
                  >
                    Tout désélectionner
                  </button>
                </div>
              </div>

              <button
                onClick={handleGenerateStatement}
                disabled={generating || selectedEmployees.length === 0}
                className="payroll-button w-full flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <div className="spinner" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Générer la déclaration IGR
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Employee Selection */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="mb-4">
            <h3 className="text-lg font-medium">Sélection des employés</h3>
            <p className="text-sm text-gray-600">
              Sélectionnez les employés à inclure dans la déclaration IGR
            </p>
          </div>
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="spinner mr-2" />
                Chargement des employés...
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {employees.map((employee) => (
                  <div
                    key={employee.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedEmployees.includes(employee.id)
                        ? 'bg-blue-50 border-blue-300'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleEmployeeSelection(employee.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={() => toggleEmployeeSelection(employee.id)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {employee.prenom} {employee.nom}
                          </p>
                          <p className="text-sm text-gray-600">
                            {employee.matricule} • {employee.fonction}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {employee.salaireBase.toLocaleString('fr-FR')} MAD
                          </p>
                          <p className="text-sm text-gray-600">
                            CIN: {employee.cin || 'Non renseigné'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
