import React from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../../components/Layout';
import { Calculator, Edit, Play } from 'lucide-react';

const PayrollCalculationPage = () => {
  const router = useRouter();

  const sections = [
    {
      title: 'Éléments variables mensuels',
      description: 'Saisie mensuelle des variables : heures sup., absences, primes exceptionnelles, congés, retards, avances.',
      icon: <Edit className="w-8 h-8" />,
      href: '/payroll-calculation/monthly-variables',
      color: 'bg-orange-500'
    },
    {
      title: 'Calcul mensuel',
      description: 'Lancement automatique du calcul de paie avec application des barèmes, cotisations sociales et fiscales selon la situation de chaque salarié.',
      icon: <Play className="w-8 h-8" />,
      href: '/payroll-calculation/monthly-calculation',
      color: 'bg-green-500'
    }
  ];

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Calculator className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Calcul de la paie</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Gestion des éléments variables et lancement du calcul mensuel de la paie avec application automatique des barèmes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section, index) => (
            <div
              key={index}
              onClick={() => router.push(section.href)}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer border border-gray-200 overflow-hidden"
            >
              <div className={`${section.color} p-4`}>
                <div className="text-white">
                  {section.icon}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {section.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {section.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Section d'information */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <Calculator className="w-6 h-6 text-blue-600 mr-3 mt-1" />
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                Processus de calcul de paie
              </h3>
              <div className="text-blue-800 space-y-2">
                <p className="text-sm">
                  <strong>1. Éléments variables :</strong> Saisissez d'abord tous les éléments variables du mois (heures supplémentaires, absences, primes, etc.)
                </p>
                <p className="text-sm">
                  <strong>2. Calcul automatique :</strong> Lancez ensuite le calcul mensuel qui appliquera automatiquement tous les barèmes et cotisations
                </p>
                <p className="text-sm">
                  <strong>3. Résultats :</strong> Les bulletins de paie seront générés et disponibles dans la section "Documents salariés"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PayrollCalculationPage;
