import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Layout } from '../../../components/Layout';
import { Calculator, ArrowLeft, Download, Save, RefreshCw, Info } from 'lucide-react';

export default function SalarySimulation() {
  return (
    <>
      <Head>
        <title>Simulation Salaire - Gestion de Paie AD Capital</title>
        <meta name="description" content="Simulez les calculs de paie pour différents montants de salaire" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <SalarySimulationContent />
      </Layout>
    </>
  );
}

function SalarySimulationContent() {
  const [salaireBrut, setSalaireBrut] = useState<number>(15000);
  const [situationFamiliale, setSituationFamiliale] = useState<string>('celibataire');
  const [nombreEnfants, setNombreEnfants] = useState<number>(0);
  const [fraisProfessionnels, setFraisProfessionnels] = useState<number>(0);
  const [autresDeductions, setAutresDeductions] = useState<number>(0);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Calcul automatique quand les paramètres changent
  useEffect(() => {
    calculateSalary();
  }, [salaireBrut, situationFamiliale, nombreEnfants, fraisProfessionnels, autresDeductions]);

  const calculateSalary = () => {
    setLoading(true);
    
    // Simulation des calculs de paie
    setTimeout(() => {
      const salaireImposable = salaireBrut - fraisProfessionnels;
      const cotisationCNSS = Math.min(salaireBrut * 0.0448, 6000 * 0.0448);
      const cotisationAMO = Math.min(salaireBrut * 0.0226, 6000 * 0.0226);
      
      // Calcul IGR simplifié
      let igr = 0;
      let salaireNetImposable = salaireImposable - cotisationCNSS - cotisationAMO;
      
      // Déductions familiales
      if (situationFamiliale === 'marie') {
        salaireNetImposable -= 360; // Déduction épouse
      }
      salaireNetImposable -= nombreEnfants * 300; // Déduction enfants
      salaireNetImposable -= autresDeductions;
      
      // Barème IGR annuel (simplifié)
      const salaireAnnuel = salaireNetImposable * 12;
      if (salaireAnnuel > 30000) {
        if (salaireAnnuel <= 50000) {
          igr = (salaireAnnuel - 30000) * 0.10;
        } else if (salaireAnnuel <= 60000) {
          igr = 20000 * 0.10 + (salaireAnnuel - 50000) * 0.20;
        } else if (salaireAnnuel <= 80000) {
          igr = 20000 * 0.10 + 10000 * 0.20 + (salaireAnnuel - 60000) * 0.30;
        } else if (salaireAnnuel <= 180000) {
          igr = 20000 * 0.10 + 10000 * 0.20 + 20000 * 0.30 + (salaireAnnuel - 80000) * 0.34;
        } else {
          igr = 20000 * 0.10 + 10000 * 0.20 + 20000 * 0.30 + 100000 * 0.34 + (salaireAnnuel - 180000) * 0.38;
        }
      }
      
      const igrMensuel = igr / 12;
      const salaireNet = salaireBrut - cotisationCNSS - cotisationAMO - igrMensuel;
      
      setResults({
        salaireBrut,
        cotisationCNSS,
        cotisationAMO,
        totalCotisations: cotisationCNSS + cotisationAMO,
        salaireImposable,
        salaireNetImposable,
        igr: igrMensuel,
        salaireNet,
        tauxImposition: salaireImposable > 0 ? (igrMensuel / salaireImposable) * 100 : 0,
        economiesFiscales: (situationFamiliale === 'marie' ? 360 : 0) + (nombreEnfants * 300) + autresDeductions
      });
      
      setLoading(false);
    }, 500);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount);
  };

  const resetForm = () => {
    setSalaireBrut(15000);
    setSituationFamiliale('celibataire');
    setNombreEnfants(0);
    setFraisProfessionnels(0);
    setAutresDeductions(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/simulation">
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Simulation de salaire</h2>
            <p className="mt-1 text-sm text-gray-600">
              Calculez le salaire net à partir du salaire brut avec les cotisations et l'IGR
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={resetForm}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réinitialiser
          </button>
          {results && (
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              Exporter PDF
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaire de saisie */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Paramètres de simulation</h3>
          </div>
          <div className="p-6 space-y-6">
            {/* Salaire brut */}
            <div>
              <label htmlFor="salaireBrut" className="block text-sm font-medium text-gray-700 mb-2">
                Salaire brut mensuel (MAD)
              </label>
              <input
                type="number"
                id="salaireBrut"
                value={salaireBrut}
                onChange={(e) => setSalaireBrut(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="100"
              />
            </div>

            {/* Situation familiale */}
            <div>
              <label htmlFor="situationFamiliale" className="block text-sm font-medium text-gray-700 mb-2">
                Situation familiale
              </label>
              <select
                id="situationFamiliale"
                value={situationFamiliale}
                onChange={(e) => setSituationFamiliale(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="celibataire">Célibataire</option>
                <option value="marie">Marié(e)</option>
                <option value="divorce">Divorcé(e)</option>
                <option value="veuf">Veuf/Veuve</option>
              </select>
            </div>

            {/* Nombre d'enfants */}
            <div>
              <label htmlFor="nombreEnfants" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre d'enfants à charge
              </label>
              <input
                type="number"
                id="nombreEnfants"
                value={nombreEnfants}
                onChange={(e) => setNombreEnfants(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                min="0"
                max="10"
              />
            </div>

            {/* Frais professionnels */}
            <div>
              <label htmlFor="fraisProfessionnels" className="block text-sm font-medium text-gray-700 mb-2">
                Frais professionnels (MAD)
              </label>
              <input
                type="number"
                id="fraisProfessionnels"
                value={fraisProfessionnels}
                onChange={(e) => setFraisProfessionnels(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="50"
              />
              <p className="mt-1 text-xs text-gray-500">
                Maximum 20% du salaire brut ou 2 500 MAD
              </p>
            </div>

            {/* Autres déductions */}
            <div>
              <label htmlFor="autresDeductions" className="block text-sm font-medium text-gray-700 mb-2">
                Autres déductions (MAD)
              </label>
              <input
                type="number"
                id="autresDeductions"
                value={autresDeductions}
                onChange={(e) => setAutresDeductions(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="50"
              />
              <p className="mt-1 text-xs text-gray-500">
                Crédit logement, RCAR, etc.
              </p>
            </div>
          </div>
        </div>

        {/* Résultats */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Résultats de la simulation</h3>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-500">Calcul en cours...</p>
              </div>
            ) : results ? (
              <div className="space-y-4">
                {/* Salaire brut */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Salaire brut</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(results.salaireBrut)}</span>
                </div>

                {/* Cotisations */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600 ml-4">- CNSS (4.48%)</span>
                    <span className="text-sm text-red-600">-{formatCurrency(results.cotisationCNSS)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600 ml-4">- AMO (2.26%)</span>
                    <span className="text-sm text-red-600">-{formatCurrency(results.cotisationAMO)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Total cotisations</span>
                    <span className="text-sm font-semibold text-red-600">-{formatCurrency(results.totalCotisations)}</span>
                  </div>
                </div>

                {/* Salaire imposable */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Salaire imposable</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(results.salaireImposable)}</span>
                </div>

                {/* Déductions fiscales */}
                {results.economiesFiscales > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">- Déductions fiscales</span>
                    <span className="text-sm text-green-600">-{formatCurrency(results.economiesFiscales)}</span>
                  </div>
                )}

                {/* IGR */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">
                    IGR ({results.tauxImposition.toFixed(1)}%)
                  </span>
                  <span className="text-sm font-semibold text-red-600">-{formatCurrency(results.igr)}</span>
                </div>

                {/* Salaire net */}
                <div className="flex justify-between items-center py-3 bg-green-50 px-4 rounded-lg border border-green-200">
                  <span className="text-lg font-semibold text-green-800">Salaire net</span>
                  <span className="text-xl font-bold text-green-800">{formatCurrency(results.salaireNet)}</span>
                </div>

                {/* Informations supplémentaires */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Informations importantes :</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Calcul basé sur les barèmes 2025</li>
                        <li>• Plafond CNSS : 6 000 MAD</li>
                        <li>• Déduction épouse : 360 MAD/mois</li>
                        <li>• Déduction par enfant : 300 MAD/mois</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500">
                  Modifiez les paramètres pour voir les résultats
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparaison avec différents salaires */}
      {results && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Comparaison avec d'autres salaires</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Salaire brut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cotisations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IGR
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Salaire net
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taux net
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[0.8, 0.9, 1.0, 1.1, 1.2].map((multiplier, index) => {
                    const testSalaire = Math.round(salaireBrut * multiplier);
                    const testCotisations = Math.min(testSalaire * 0.0674, 6000 * 0.0674);
                    const testImposable = testSalaire - fraisProfessionnels - testCotisations;
                    const testNetImposable = testImposable - (situationFamiliale === 'marie' ? 360 : 0) - (nombreEnfants * 300) - autresDeductions;
                    const testAnnuel = testNetImposable * 12;
                    
                    let testIGR = 0;
                    if (testAnnuel > 30000) {
                      if (testAnnuel <= 50000) {
                        testIGR = (testAnnuel - 30000) * 0.10;
                      } else if (testAnnuel <= 60000) {
                        testIGR = 20000 * 0.10 + (testAnnuel - 50000) * 0.20;
                      } else if (testAnnuel <= 80000) {
                        testIGR = 20000 * 0.10 + 10000 * 0.20 + (testAnnuel - 60000) * 0.30;
                      } else if (testAnnuel <= 180000) {
                        testIGR = 20000 * 0.10 + 10000 * 0.20 + 20000 * 0.30 + (testAnnuel - 80000) * 0.34;
                      } else {
                        testIGR = 20000 * 0.10 + 10000 * 0.20 + 20000 * 0.30 + 100000 * 0.34 + (testAnnuel - 180000) * 0.38;
                      }
                    }
                    const testIGRMensuel = testIGR / 12;
                    const testNet = testSalaire - testCotisations - testIGRMensuel;
                    const tauxNet = (testNet / testSalaire) * 100;
                    
                    return (
                      <tr key={index} className={multiplier === 1.0 ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(testSalaire)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(testCotisations)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(testIGRMensuel)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(testNet)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tauxNet.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
