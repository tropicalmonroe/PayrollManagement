import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Layout } from '../../../components/Layout';
import { Users, ArrowLeft, Download, RefreshCw, Info, TrendingUp, TrendingDown } from 'lucide-react';

export default function FamilyTaxImpact() {
  return (
    <>
      <Head>
        <title>Impact Familial/Fiscal - Gestion de Paie AD Capital</title>
        <meta name="description" content="Analysez l'impact des charges familiales sur la fiscalité" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <FamilyTaxImpactContent />
      </Layout>
    </>
  );
}

function FamilyTaxImpactContent() {
  const [salaireBrut, setSalaireBrut] = useState<number>(15000);
  const [situationActuelle, setSituationActuelle] = useState<string>('celibataire');
  const [enfantsActuels, setEnfantsActuels] = useState<number>(0);
  const [situationNouvelle, setSituationNouvelle] = useState<string>('marie');
  const [enfantsNouveaux, setEnfantsNouveaux] = useState<number>(1);
  const [fraisProfessionnels, setFraisProfessionnels] = useState<number>(0);
  const [autresDeductions, setAutresDeductions] = useState<number>(0);
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    calculateComparison();
  }, [salaireBrut, situationActuelle, enfantsActuels, situationNouvelle, enfantsNouveaux, fraisProfessionnels, autresDeductions]);

  const calculateSalary = (situation: string, enfants: number) => {
    const salaireImposable = salaireBrut - fraisProfessionnels;
    const cotisationCNSS = Math.min(salaireBrut * 0.0448, 6000 * 0.0448);
    const cotisationAMO = Math.min(salaireBrut * 0.0226, 6000 * 0.0226);
    
    let salaireNetImposable = salaireImposable - cotisationCNSS - cotisationAMO;
    
    // Déductions familiales
    const deductionEpouse = situation === 'marie' ? 360 : 0;
    const deductionEnfants = enfants * 300;
    
    salaireNetImposable -= deductionEpouse + deductionEnfants + autresDeductions;
    
    // Calcul IGR
    const salaireAnnuel = Math.max(0, salaireNetImposable * 12);
    let igr = 0;
    
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
    
    return {
      salaireBrut,
      cotisationCNSS,
      cotisationAMO,
      totalCotisations: cotisationCNSS + cotisationAMO,
      salaireImposable,
      deductionEpouse,
      deductionEnfants,
      totalDeductions: deductionEpouse + deductionEnfants + autresDeductions,
      salaireNetImposable: Math.max(0, salaireNetImposable),
      igr: igrMensuel,
      salaireNet,
      tauxImposition: salaireImposable > 0 ? (igrMensuel / salaireImposable) * 100 : 0
    };
  };

  const calculateComparison = () => {
    setLoading(true);
    
    setTimeout(() => {
      const situationActuelleCalc = calculateSalary(situationActuelle, enfantsActuels);
      const situationNouvelleCalc = calculateSalary(situationNouvelle, enfantsNouveaux);
      
      const difference = {
        salaireBrut: situationNouvelleCalc.salaireBrut - situationActuelleCalc.salaireBrut,
        cotisations: situationNouvelleCalc.totalCotisations - situationActuelleCalc.totalCotisations,
        deductions: situationNouvelleCalc.totalDeductions - situationActuelleCalc.totalDeductions,
        igr: situationNouvelleCalc.igr - situationActuelleCalc.igr,
        salaireNet: situationNouvelleCalc.salaireNet - situationActuelleCalc.salaireNet,
        economieAnnuelle: (situationActuelleCalc.igr - situationNouvelleCalc.igr) * 12
      };
      
      setComparison({
        actuelle: situationActuelleCalc,
        nouvelle: situationNouvelleCalc,
        difference
      });
      
      setLoading(false);
    }, 300);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount);
  };

  const formatDifference = (amount: number) => {
    const formatted = formatCurrency(Math.abs(amount));
    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  const resetForm = () => {
    setSalaireBrut(15000);
    setSituationActuelle('celibataire');
    setEnfantsActuels(0);
    setSituationNouvelle('marie');
    setEnfantsNouveaux(1);
    setFraisProfessionnels(0);
    setAutresDeductions(0);
  };

  const getSituationLabel = (situation: string) => {
    const labels = {
      'celibataire': 'Célibataire',
      'marie': 'Marié(e)',
      'divorce': 'Divorcé(e)',
      'veuf': 'Veuf/Veuve'
    };
    return labels[situation as keyof typeof labels] || situation;
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
            <h2 className="text-2xl font-bold text-gray-900">Impact familial/fiscal</h2>
            <p className="mt-1 text-sm text-gray-600">
              Comparez l'impact fiscal de différentes situations familiales
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
          {comparison && (
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
              <Download className="h-4 w-4 mr-2" />
              Exporter rapport
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Paramètres de base */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Paramètres de base</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label htmlFor="salaireBrut" className="block text-sm font-medium text-gray-700 mb-2">
                Salaire brut mensuel (MAD)
              </label>
              <input
                type="number"
                id="salaireBrut"
                value={salaireBrut}
                onChange={(e) => setSalaireBrut(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                min="0"
                step="100"
              />
            </div>

            <div>
              <label htmlFor="fraisProfessionnels" className="block text-sm font-medium text-gray-700 mb-2">
                Frais professionnels (MAD)
              </label>
              <input
                type="number"
                id="fraisProfessionnels"
                value={fraisProfessionnels}
                onChange={(e) => setFraisProfessionnels(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                min="0"
                step="50"
              />
            </div>

            <div>
              <label htmlFor="autresDeductions" className="block text-sm font-medium text-gray-700 mb-2">
                Autres déductions (MAD)
              </label>
              <input
                type="number"
                id="autresDeductions"
                value={autresDeductions}
                onChange={(e) => setAutresDeductions(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                min="0"
                step="50"
              />
            </div>
          </div>
        </div>

        {/* Situation actuelle */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
            <h3 className="text-lg font-medium text-red-900">Situation actuelle</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label htmlFor="situationActuelle" className="block text-sm font-medium text-gray-700 mb-2">
                Situation familiale
              </label>
              <select
                id="situationActuelle"
                value={situationActuelle}
                onChange={(e) => setSituationActuelle(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              >
                <option value="celibataire">Célibataire</option>
                <option value="marie">Marié(e)</option>
                <option value="divorce">Divorcé(e)</option>
                <option value="veuf">Veuf/Veuve</option>
              </select>
            </div>

            <div>
              <label htmlFor="enfantsActuels" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre d'enfants à charge
              </label>
              <input
                type="number"
                id="enfantsActuels"
                value={enfantsActuels}
                onChange={(e) => setEnfantsActuels(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                min="0"
                max="10"
              />
            </div>

            {comparison && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="text-sm font-medium text-red-800 mb-2">Résumé actuel</h4>
                <div className="space-y-1 text-xs text-red-700">
                  <div className="flex justify-between">
                    <span>IGR mensuel:</span>
                    <span className="font-medium">{formatCurrency(comparison.actuelle.igr)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Salaire net:</span>
                    <span className="font-medium">{formatCurrency(comparison.actuelle.salaireNet)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nouvelle situation */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
            <h3 className="text-lg font-medium text-green-900">Nouvelle situation</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label htmlFor="situationNouvelle" className="block text-sm font-medium text-gray-700 mb-2">
                Situation familiale
              </label>
              <select
                id="situationNouvelle"
                value={situationNouvelle}
                onChange={(e) => setSituationNouvelle(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="celibataire">Célibataire</option>
                <option value="marie">Marié(e)</option>
                <option value="divorce">Divorcé(e)</option>
                <option value="veuf">Veuf/Veuve</option>
              </select>
            </div>

            <div>
              <label htmlFor="enfantsNouveaux" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre d'enfants à charge
              </label>
              <input
                type="number"
                id="enfantsNouveaux"
                value={enfantsNouveaux}
                onChange={(e) => setEnfantsNouveaux(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                min="0"
                max="10"
              />
            </div>

            {comparison && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="text-sm font-medium text-green-800 mb-2">Résumé nouveau</h4>
                <div className="space-y-1 text-xs text-green-700">
                  <div className="flex justify-between">
                    <span>IGR mensuel:</span>
                    <span className="font-medium">{formatCurrency(comparison.nouvelle.igr)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Salaire net:</span>
                    <span className="font-medium">{formatCurrency(comparison.nouvelle.salaireNet)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Résultats de comparaison */}
      {loading ? (
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-sm text-gray-500">Calcul de l'impact en cours...</p>
          </div>
        </div>
      ) : comparison ? (
        <div className="space-y-6">
          {/* Impact principal */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Impact de la nouvelle situation</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-center mb-2">
                    {comparison.difference.igr < 0 ? (
                      <TrendingDown className="h-8 w-8 text-green-600" />
                    ) : (
                      <TrendingUp className="h-8 w-8 text-red-600" />
                    )}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatDifference(comparison.difference.igr)}
                  </div>
                  <div className="text-sm text-gray-600">IGR mensuel</div>
                </div>

                <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-center mb-2">
                    {comparison.difference.salaireNet > 0 ? (
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-red-600" />
                    )}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatDifference(comparison.difference.salaireNet)}
                  </div>
                  <div className="text-sm text-gray-600">Salaire net mensuel</div>
                </div>

                <div className="text-center p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-center mb-2">
                    {comparison.difference.economieAnnuelle > 0 ? (
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-red-600" />
                    )}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(comparison.difference.economieAnnuelle)}
                  </div>
                  <div className="text-sm text-gray-600">Économie annuelle</div>
                </div>
              </div>
            </div>
          </div>

          {/* Détail des déductions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Détail des déductions fiscales</h3>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type de déduction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Situation actuelle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nouvelle situation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Différence
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Déduction épouse
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(comparison.actuelle.deductionEpouse)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(comparison.nouvelle.deductionEpouse)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={comparison.nouvelle.deductionEpouse > comparison.actuelle.deductionEpouse ? 'text-green-600' : 'text-gray-500'}>
                          {formatDifference(comparison.nouvelle.deductionEpouse - comparison.actuelle.deductionEpouse)}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Déduction enfants
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(comparison.actuelle.deductionEnfants)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(comparison.nouvelle.deductionEnfants)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={comparison.nouvelle.deductionEnfants > comparison.actuelle.deductionEnfants ? 'text-green-600' : 'text-red-600'}>
                          {formatDifference(comparison.nouvelle.deductionEnfants - comparison.actuelle.deductionEnfants)}
                        </span>
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Total déductions
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(comparison.actuelle.totalDeductions)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(comparison.nouvelle.totalDeductions)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                        <span className={comparison.nouvelle.totalDeductions > comparison.actuelle.totalDeductions ? 'text-green-600' : 'text-red-600'}>
                          {formatDifference(comparison.nouvelle.totalDeductions - comparison.actuelle.totalDeductions)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recommandations */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recommandations</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {comparison.difference.economieAnnuelle > 0 ? (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="text-sm text-green-800">
                        <p className="font-medium mb-1">Situation favorable :</p>
                        <p>La nouvelle situation familiale vous permettrait d'économiser <strong>{formatCurrency(comparison.difference.economieAnnuelle)}</strong> par an en impôts.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">Impact neutre ou négatif :</p>
                        <p>La nouvelle situation n'apporte pas d'avantage fiscal significatif par rapport à votre situation actuelle.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Points à retenir :</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Déduction épouse : 360 MAD/mois si marié(e)</li>
                        <li>• Déduction par enfant : 300 MAD/mois</li>
                        <li>• Maximum 6 enfants pris en compte</li>
                        <li>• Les déductions réduisent la base imposable IGR</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
