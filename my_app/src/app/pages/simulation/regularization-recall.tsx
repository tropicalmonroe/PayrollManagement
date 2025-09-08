import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Layout } from '../../components/Layout';
import { TrendingUp, ArrowLeft, Download, RefreshCw, Info, Calendar, AlertCircle } from 'lucide-react';

export default function RegularizationRecall() {
  return (
    <>
      <Head>
        <title>Régularisation / Rappel - Gestion de Paie AD Capital</title>
        <meta name="description" content="Simulez les régularisations et rappels de salaire" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <RegularizationRecallContent />
      </Layout>
    </>
  );
}

function RegularizationRecallContent() {
  const [typeOperation, setTypeOperation] = useState<string>('rappel');
  const [salaireBrutActuel, setSalaireBrutActuel] = useState<number>(15000);
  const [salaireBrutNouveau, setSalaireBrutNouveau] = useState<number>(18000);
  const [dateDebut, setDateDebut] = useState<string>('2025-01-01');
  const [dateFin, setDateFin] = useState<string>('2025-01-31');
  const [situationFamiliale, setSituationFamiliale] = useState<string>('celibataire');
  const [nombreEnfants, setNombreEnfants] = useState<number>(0);
  const [fraisProfessionnels, setFraisProfessionnels] = useState<number>(0);
  const [autresDeductions, setAutresDeductions] = useState<number>(0);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    calculateRegularization();
  }, [typeOperation, salaireBrutActuel, salaireBrutNouveau, dateDebut, dateFin, situationFamiliale, nombreEnfants, fraisProfessionnels, autresDeductions]);

  const calculateSalary = (salaireBrut: number) => {
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
      salaireNetImposable: Math.max(0, salaireNetImposable),
      igr: igrMensuel,
      salaireNet
    };
  };

  const calculateRegularization = () => {
    setLoading(true);
    
    setTimeout(() => {
      const startDate = new Date(dateDebut);
      const endDate = new Date(dateFin);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const nombreMois = Math.max(1, Math.ceil(diffDays / 30));
      
      const ancienCalcul = calculateSalary(salaireBrutActuel);
      const nouveauCalcul = calculateSalary(salaireBrutNouveau);
      
      const differenceParMois = {
        salaireBrut: nouveauCalcul.salaireBrut - ancienCalcul.salaireBrut,
        cotisations: nouveauCalcul.totalCotisations - ancienCalcul.totalCotisations,
        igr: nouveauCalcul.igr - ancienCalcul.igr,
        salaireNet: nouveauCalcul.salaireNet - ancienCalcul.salaireNet
      };
      
      const rappelTotal = {
        salaireBrut: differenceParMois.salaireBrut * nombreMois,
        cotisations: differenceParMois.cotisations * nombreMois,
        igr: differenceParMois.igr * nombreMois,
        salaireNet: differenceParMois.salaireNet * nombreMois
      };
      
      // Calcul des régularisations CNSS et IGR
      const regularisationCNSS = rappelTotal.cotisations;
      const regularisationIGR = rappelTotal.igr;
      
      setResults({
        nombreMois,
        ancienCalcul,
        nouveauCalcul,
        differenceParMois,
        rappelTotal,
        regularisationCNSS,
        regularisationIGR,
        netAPayer: rappelTotal.salaireNet,
        totalCharges: regularisationCNSS + regularisationIGR,
        impactEmployeur: rappelTotal.salaireBrut + (rappelTotal.cotisations * 1.5) // Estimation charges patronales
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

  const formatDifference = (amount: number) => {
    const formatted = formatCurrency(Math.abs(amount));
    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  const resetForm = () => {
    setTypeOperation('rappel');
    setSalaireBrutActuel(15000);
    setSalaireBrutNouveau(18000);
    setDateDebut('2025-01-01');
    setDateFin('2025-01-31');
    setSituationFamiliale('celibataire');
    setNombreEnfants(0);
    setFraisProfessionnels(0);
    setAutresDeductions(0);
  };

  const getOperationLabel = () => {
    return typeOperation === 'rappel' ? 'Rappel de salaire' : 'Régularisation';
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
            <h2 className="text-2xl font-bold text-gray-900">Régularisation / Rappel</h2>
            <p className="mt-1 text-sm text-gray-600">
              Calculez les rappels de salaire et régularisations fiscales
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
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
              <Download className="h-4 w-4 mr-2" />
              Exporter calcul
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Paramètres de l'opération */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Paramètres de l'opération</h3>
          </div>
          <div className="p-6 space-y-6">
            {/* Type d'opération */}
            <div>
              <label htmlFor="typeOperation" className="block text-sm font-medium text-gray-700 mb-2">
                Type d'opération
              </label>
              <select
                id="typeOperation"
                value={typeOperation}
                onChange={(e) => setTypeOperation(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="rappel">Rappel de salaire</option>
                <option value="regularisation">Régularisation fiscale</option>
                <option value="ajustement">Ajustement rétroactif</option>
              </select>
            </div>

            {/* Période */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dateDebut" className="block text-sm font-medium text-gray-700 mb-2">
                  Date de début
                </label>
                <input
                  type="date"
                  id="dateDebut"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label htmlFor="dateFin" className="block text-sm font-medium text-gray-700 mb-2">
                  Date de fin
                </label>
                <input
                  type="date"
                  id="dateFin"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Salaires */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="salaireBrutActuel" className="block text-sm font-medium text-gray-700 mb-2">
                  Ancien salaire brut (MAD)
                </label>
                <input
                  type="number"
                  id="salaireBrutActuel"
                  value={salaireBrutActuel}
                  onChange={(e) => setSalaireBrutActuel(Number(e.target.value))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  min="0"
                  step="100"
                />
              </div>
              <div>
                <label htmlFor="salaireBrutNouveau" className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau salaire brut (MAD)
                </label>
                <input
                  type="number"
                  id="salaireBrutNouveau"
                  value={salaireBrutNouveau}
                  onChange={(e) => setSalaireBrutNouveau(Number(e.target.value))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  min="0"
                  step="100"
                />
              </div>
            </div>

            {/* Situation familiale */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="situationFamiliale" className="block text-sm font-medium text-gray-700 mb-2">
                  Situation familiale
                </label>
                <select
                  id="situationFamiliale"
                  value={situationFamiliale}
                  onChange={(e) => setSituationFamiliale(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
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
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  min="0"
                  max="10"
                />
              </div>
            </div>

            {/* Déductions */}
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
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
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
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  min="0"
                  step="50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Résultats du calcul */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Résultats du calcul</h3>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <p className="mt-2 text-sm text-gray-500">Calcul en cours...</p>
              </div>
            ) : results ? (
              <div className="space-y-6">
                {/* Résumé de la période */}
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center mb-2">
                    <Calendar className="h-5 w-5 text-purple-600 mr-2" />
                    <h4 className="text-sm font-medium text-purple-800">Période concernée</h4>
                  </div>
                  <div className="text-sm text-purple-700">
                    <p>Du {new Date(dateDebut).toLocaleDateString('fr-FR')} au {new Date(dateFin).toLocaleDateString('fr-FR')}</p>
                    <p className="font-medium">Nombre de mois : {results.nombreMois}</p>
                  </div>
                </div>

                {/* Différence mensuelle */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Différence mensuelle</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-600">Salaire brut</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDifference(results.differenceParMois.salaireBrut)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-600">Cotisations</span>
                      <span className="text-sm text-red-600">
                        {formatDifference(results.differenceParMois.cotisations)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-600">IGR</span>
                      <span className="text-sm text-red-600">
                        {formatDifference(results.differenceParMois.igr)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-gray-200">
                      <span className="text-sm font-medium text-gray-700">Net mensuel</span>
                      <span className="text-sm font-semibold text-green-600">
                        {formatDifference(results.differenceParMois.salaireNet)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rappel total */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Rappel total sur la période</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-600">Rappel brut</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(results.rappelTotal.salaireBrut)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-600">Régularisation CNSS</span>
                      <span className="text-sm text-red-600">
                        -{formatCurrency(results.regularisationCNSS)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-600">Régularisation IGR</span>
                      <span className="text-sm text-red-600">
                        -{formatCurrency(results.regularisationIGR)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 bg-green-50 px-4 rounded-lg border border-green-200">
                      <span className="text-lg font-semibold text-green-800">Net à payer</span>
                      <span className="text-xl font-bold text-green-800">
                        {formatCurrency(results.netAPayer)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Impact employeur */}
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
                    <h4 className="text-sm font-medium text-orange-800">Impact employeur</h4>
                  </div>
                  <div className="text-sm text-orange-700">
                    <div className="flex justify-between">
                      <span>Coût total estimé :</span>
                      <span className="font-medium">{formatCurrency(results.impactEmployeur)}</span>
                    </div>
                    <p className="text-xs mt-1">Incluant charges patronales estimées</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500">
                  Configurez les paramètres pour voir les résultats
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Détail des calculs */}
      {results && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Détail des calculs</h3>
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
                      Ancien calcul
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nouveau calcul
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Différence mensuelle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rappel total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Salaire brut
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(results.ancienCalcul.salaireBrut)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(results.nouveauCalcul.salaireBrut)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatDifference(results.differenceParMois.salaireBrut)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(results.rappelTotal.salaireBrut)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Cotisations sociales
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(results.ancienCalcul.totalCotisations)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(results.nouveauCalcul.totalCotisations)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {formatDifference(results.differenceParMois.cotisations)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {formatCurrency(results.rappelTotal.cotisations)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      IGR
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(results.ancienCalcul.igr)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(results.nouveauCalcul.igr)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {formatDifference(results.differenceParMois.igr)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {formatCurrency(results.rappelTotal.igr)}
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      Salaire net
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(results.ancienCalcul.salaireNet)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(results.nouveauCalcul.salaireNet)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      {formatDifference(results.differenceParMois.salaireNet)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      {formatCurrency(results.rappelTotal.salaireNet)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Informations importantes */}
      {results && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Informations importantes</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Obligations légales :</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Les rappels de salaire sont soumis aux cotisations sociales</li>
                      <li>• L'IGR doit être régularisé sur la période concernée</li>
                      <li>• Les charges patronales s'appliquent également</li>
                      <li>• Délai de prescription : 4 ans pour les rappels</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Points d'attention :</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Vérifier les plafonds CNSS pour chaque mois</li>
                      <li>• Contrôler les barèmes IGR applicables</li>
                      <li>• Documenter les raisons du rappel</li>
                      <li>• Prévoir l'impact sur la trésorerie</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
