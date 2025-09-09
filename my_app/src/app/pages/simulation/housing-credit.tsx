import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Layout } from '../../../components/Layout';
import { Home, ArrowLeft, Download, RefreshCw, Info, Calculator, TrendingUp } from 'lucide-react';

export default function HousingCredit() {
  return (
    <>
      <Head>
        <title>Crédit Logement - Gestion de Paie AD Capital</title>
        <meta name="description" content="Calculez l'impact des crédits logement sur la paie" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <HousingCreditContent />
      </Layout>
    </>
  );
}

function HousingCreditContent() {
  const [salaireBrut, setSalaireBrut] = useState<number>(20000);
  const [situationFamiliale, setSituationFamiliale] = useState<string>('marie');
  const [nombreEnfants, setNombreEnfants] = useState<number>(2);
  const [fraisProfessionnels, setFraisProfessionnels] = useState<number>(0);
  const [autresDeductions, setAutresDeductions] = useState<number>(0);
  const [montantCredit, setMontantCredit] = useState<number>(500000);
  const [dureeCredit, setDureeCredit] = useState<number>(20);
  const [tauxInteret, setTauxInteret] = useState<number>(4.5);
  const [mensualiteCredit, setMensualiteCredit] = useState<number>(3164);
  const [typeLogement, setTypeLogement] = useState<string>('principal');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    calculateHousingCredit();
  }, [salaireBrut, situationFamiliale, nombreEnfants, fraisProfessionnels, autresDeductions, montantCredit, dureeCredit, tauxInteret, mensualiteCredit, typeLogement]);

  const calculateMensualite = () => {
    const tauxMensuel = tauxInteret / 100 / 12;
    const nombreMensualites = dureeCredit * 12;
    const mensualite = (montantCredit * tauxMensuel) / (1 - Math.pow(1 + tauxMensuel, -nombreMensualites));
    setMensualiteCredit(Math.round(mensualite));
  };

  const calculateSalary = (deductionCreditLogement: number) => {
    const salaireImposable = salaireBrut - fraisProfessionnels;
    const cotisationCNSS = Math.min(salaireBrut * 0.0448, 6000 * 0.0448);
    const cotisationAMO = Math.min(salaireBrut * 0.0226, 6000 * 0.0226);
    
    let salaireNetImposable = salaireImposable - cotisationCNSS - cotisationAMO;
    
    // Déductions familiales
    if (situationFamiliale === 'marie') {
      salaireNetImposable -= 360;
    }
    salaireNetImposable -= nombreEnfants * 300;
    salaireNetImposable -= autresDeductions;
    salaireNetImposable -= deductionCreditLogement;
    
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
      deductionCreditLogement,
      salaireNetImposable: Math.max(0, salaireNetImposable),
      igr: igrMensuel,
      salaireNet,
      tauxImposition: salaireImposable > 0 ? (igrMensuel / salaireImposable) * 100 : 0
    };
  };

  const calculateHousingCredit = () => {
    setLoading(true);
    
    setTimeout(() => {
      // Calcul de la déduction crédit logement
      let deductionMensuelle = 0;
      
      if (typeLogement === 'principal') {
        // Pour résidence principale : déduction des intérêts dans la limite de 10% du revenu imposable
        const interetsMensuels = (montantCredit * (tauxInteret / 100)) / 12;
        const plafondDeduction = (salaireBrut - fraisProfessionnels) * 0.10;
        deductionMensuelle = Math.min(interetsMensuels, plafondDeduction);
      } else if (typeLogement === 'social') {
        // Pour logement social : déduction plus avantageuse
        const interetsMensuels = (montantCredit * (tauxInteret / 100)) / 12;
        const plafondDeduction = (salaireBrut - fraisProfessionnels) * 0.15;
        deductionMensuelle = Math.min(interetsMensuels, plafondDeduction);
      }
      
      const sansCredit = calculateSalary(0);
      const avecCredit = calculateSalary(deductionMensuelle);
      
      const economie = {
        igrMensuel: sansCredit.igr - avecCredit.igr,
        igrAnnuel: (sansCredit.igr - avecCredit.igr) * 12,
        salaireNetMensuel: avecCredit.salaireNet - sansCredit.salaireNet,
        salaireNetAnnuel: (avecCredit.salaireNet - sansCredit.salaireNet) * 12
      };
      
      // Calcul du coût réel du crédit
      const coutTotalCredit = mensualiteCredit * dureeCredit * 12;
      const interetsTotal = coutTotalCredit - montantCredit;
      const economieIGRTotale = economie.igrAnnuel * dureeCredit;
      const coutReel = interetsTotal - economieIGRTotale;
      
      // Calcul du taux effectif
      const tauxEffectif = ((coutReel / montantCredit) / dureeCredit) * 100;
      
      setResults({
        sansCredit,
        avecCredit,
        deductionMensuelle,
        economie,
        mensualiteCredit,
        coutTotalCredit,
        interetsTotal,
        economieIGRTotale,
        coutReel,
        tauxEffectif,
        capaciteRemboursement: (avecCredit.salaireNet / mensualiteCredit) * 100,
        restePourVivre: avecCredit.salaireNet - mensualiteCredit
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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const resetForm = () => {
    setSalaireBrut(20000);
    setSituationFamiliale('marie');
    setNombreEnfants(2);
    setFraisProfessionnels(0);
    setAutresDeductions(0);
    setMontantCredit(500000);
    setDureeCredit(20);
    setTauxInteret(4.5);
    setMensualiteCredit(3164);
    setTypeLogement('principal');
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
            <h2 className="text-2xl font-bold text-gray-900">Simulation crédit logement</h2>
            <p className="mt-1 text-sm text-gray-600">
              Calculez l'impact fiscal et l'économie d'impôt liée au crédit logement
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
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700">
              <Download className="h-4 w-4 mr-2" />
              Exporter simulation
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Paramètres du salarié */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Informations salarié</h3>
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                min="0"
                step="100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="situationFamiliale" className="block text-sm font-medium text-gray-700 mb-2">
                  Situation familiale
                </label>
                <select
                  id="situationFamiliale"
                  value={situationFamiliale}
                  onChange={(e) => setSituationFamiliale(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="celibataire">Célibataire</option>
                  <option value="marie">Marié(e)</option>
                  <option value="divorce">Divorcé(e)</option>
                  <option value="veuf">Veuf/Veuve</option>
                </select>
              </div>
              <div>
                <label htmlFor="nombreEnfants" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre d'enfants
                </label>
                <input
                  type="number"
                  id="nombreEnfants"
                  value={nombreEnfants}
                  onChange={(e) => setNombreEnfants(Number(e.target.value))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  min="0"
                  max="10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="fraisProfessionnels" className="block text-sm font-medium text-gray-700 mb-2">
                  Frais professionnels (MAD)
                </label>
                <input
                  type="number"
                  id="fraisProfessionnels"
                  value={fraisProfessionnels}
                  onChange={(e) => setFraisProfessionnels(Number(e.target.value))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
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
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  min="0"
                  step="50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Paramètres du crédit */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Paramètres du crédit</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label htmlFor="typeLogement" className="block text-sm font-medium text-gray-700 mb-2">
                Type de logement
              </label>
              <select
                id="typeLogement"
                value={typeLogement}
                onChange={(e) => setTypeLogement(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="principal">Résidence principale</option>
                <option value="social">Logement social</option>
                <option value="secondaire">Résidence secondaire</option>
              </select>
            </div>

            <div>
              <label htmlFor="montantCredit" className="block text-sm font-medium text-gray-700 mb-2">
                Montant du crédit (MAD)
              </label>
              <input
                type="number"
                id="montantCredit"
                value={montantCredit}
                onChange={(e) => setMontantCredit(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                min="0"
                step="10000"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dureeCredit" className="block text-sm font-medium text-gray-700 mb-2">
                  Durée (années)
                </label>
                <input
                  type="number"
                  id="dureeCredit"
                  value={dureeCredit}
                  onChange={(e) => setDureeCredit(Number(e.target.value))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  min="1"
                  max="30"
                />
              </div>
              <div>
                <label htmlFor="tauxInteret" className="block text-sm font-medium text-gray-700 mb-2">
                  Taux d'intérêt (%)
                </label>
                <input
                  type="number"
                  id="tauxInteret"
                  value={tauxInteret}
                  onChange={(e) => setTauxInteret(Number(e.target.value))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  min="0"
                  max="15"
                  step="0.1"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="mensualiteCredit" className="block text-sm font-medium text-gray-700">
                  Mensualité (MAD)
                </label>
                <button
                  onClick={calculateMensualite}
                  className="text-xs text-orange-600 hover:text-orange-800 font-medium"
                >
                  Calculer
                </button>
              </div>
              <input
                type="number"
                id="mensualiteCredit"
                value={mensualiteCredit}
                onChange={(e) => setMensualiteCredit(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                min="0"
                step="10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Résultats */}
      {loading ? (
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <p className="mt-2 text-sm text-gray-500">Calcul de l'impact en cours...</p>
          </div>
        </div>
      ) : results ? (
        <div className="space-y-6">
          {/* Impact principal */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Impact du crédit logement</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(results.economie.igrMensuel)}
                  </div>
                  <div className="text-sm text-gray-600">Économie IGR/mois</div>
                </div>

                <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-center mb-2">
                    <Calculator className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(results.economie.igrAnnuel)}
                  </div>
                  <div className="text-sm text-gray-600">Économie IGR/an</div>
                </div>

                <div className="text-center p-6 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-center mb-2">
                    <Home className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatPercentage(results.tauxEffectif)}
                  </div>
                  <div className="text-sm text-gray-600">Taux effectif</div>
                </div>

                <div className="text-center p-6 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(results.restePourVivre)}
                  </div>
                  <div className="text-sm text-gray-600">Reste pour vivre</div>
                </div>
              </div>
            </div>
          </div>

          {/* Comparaison avec/sans crédit */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Comparaison avec/sans crédit</h3>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Élément
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sans crédit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avec crédit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Différence
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Salaire brut
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(results.sansCredit.salaireBrut)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(results.avecCredit.salaireBrut)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        -
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Déduction crédit logement
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        -{formatCurrency(results.deductionMensuelle)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        +{formatCurrency(results.deductionMensuelle)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        IGR mensuel
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(results.sansCredit.igr)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(results.avecCredit.igr)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        -{formatCurrency(results.economie.igrMensuel)}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        Salaire net
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(results.sansCredit.salaireNet)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(results.avecCredit.salaireNet)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                        +{formatCurrency(results.economie.salaireNetMensuel)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Analyse financière */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Analyse financière du crédit</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700">Coûts du crédit</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Capital emprunté</span>
                      <span className="text-sm font-medium">{formatCurrency(montantCredit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Coût total du crédit</span>
                      <span className="text-sm font-medium">{formatCurrency(results.coutTotalCredit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Intérêts totaux</span>
                      <span className="text-sm text-red-600">{formatCurrency(results.interetsTotal)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-medium text-gray-700">Coût réel (après économie IGR)</span>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(results.coutReel)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700">Économies fiscales</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Économie IGR annuelle</span>
                      <span className="text-sm font-medium text-green-600">{formatCurrency(results.economie.igrAnnuel)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Économie IGR totale</span>
                      <span className="text-sm font-medium text-green-600">{formatCurrency(results.economieIGRTotale)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Capacité de remboursement</span>
                      <span className="text-sm font-medium">{formatPercentage(results.capaciteRemboursement)}</span>
                    </div>
                  </div>
                </div>
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
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Avantages fiscaux :</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Déduction des intérêts d'emprunt pour résidence principale</li>
                        <li>• Plafond de déduction : 10% du revenu imposable</li>
                        <li>• Économie d'impôt significative sur la durée du crédit</li>
                        <li>• Réduction du taux effectif du crédit</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {results.capaciteRemboursement > 33 && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">Attention :</p>
                        <p>Le taux d'endettement dépasse 33%. Il est recommandé de revoir les paramètres du crédit.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-green-800">
                      <p className="font-medium mb-1">Optimisation :</p>
                      <p>Avec ce crédit logement, vous économisez <strong>{formatCurrency(results.economie.igrAnnuel)}</strong> par an en impôts, soit un taux effectif de <strong>{formatPercentage(results.tauxEffectif)}</strong>.</p>
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
