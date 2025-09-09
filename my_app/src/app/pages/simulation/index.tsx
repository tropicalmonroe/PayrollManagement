import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Layout } from '../../../components/Layout';
import { Calculator, Users, TrendingUp, Home, Play, FileText, DollarSign } from 'lucide-react';

export default function SimulationIndex() {
  return (
    <>
      <Head>
        <title>Simulation - Gestion de Paie AD Capital</title>
        <meta name="description" content="Module de simulation de paie et d'impact fiscal" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <SimulationContent />
      </Layout>
    </>
  );
}

function SimulationContent() {
  const simulationModules = [
    {
      id: 'salary-simulation',
      title: 'Simulation salaire',
      description: 'Simulez les calculs de paie pour différents montants de salaire',
      icon: Calculator,
      href: '/simulation/salary-simulation',
      color: 'blue',
      features: ['Calcul brut/net', 'Cotisations sociales', 'IGR', 'Net à payer']
    },
    {
      id: 'family-tax-impact',
      title: 'Impact familial/fiscal',
      description: 'Analysez l\'impact des charges familiales sur la fiscalité',
      icon: Users,
      href: '/simulation/family-tax-impact',
      color: 'green',
      features: ['Situation familiale', 'Nombre d\'enfants', 'Réductions fiscales', 'Comparaisons']
    },
    {
      id: 'regularization-recall',
      title: 'Régularisation / rappel',
      description: 'Simulez les régularisations et rappels de salaire',
      icon: TrendingUp,
      href: '/simulation/regularization-recall',
      color: 'purple',
      features: ['Rappels de salaire', 'Régularisations IGR', 'Ajustements CNSS', 'Calculs rétroactifs']
    },
    {
      id: 'housing-credit',
      title: 'Crédit logement',
      description: 'Calculez l\'impact des crédits logement sur la paie',
      icon: Home,
      href: '/simulation/housing-credit',
      color: 'orange',
      features: ['Déduction fiscale', 'Plafonds légaux', 'Économies d\'impôt', 'Simulations mensuelles']
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        title: 'text-blue-900',
        button: 'bg-blue-600 hover:bg-blue-700 text-white'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'text-green-600',
        title: 'text-green-900',
        button: 'bg-green-600 hover:bg-green-700 text-white'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        icon: 'text-purple-600',
        title: 'text-purple-900',
        button: 'bg-purple-600 hover:bg-purple-700 text-white'
      },
      orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: 'text-orange-600',
        title: 'text-orange-900',
        button: 'bg-orange-600 hover:bg-orange-700 text-white'
      }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Simulation</h2>
        <p className="mt-1 text-sm text-gray-600">
          Outils de simulation pour analyser différents scénarios de paie et d'impact fiscal
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calculator className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Simulations ce mois
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    24
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Économies identifiées
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    12 450 MAD
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Employés analysés
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    18
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Rapports générés
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    7
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {simulationModules.map((module) => {
          const colorClasses = getColorClasses(module.color);
          const IconComponent = module.icon;
          
          return (
            <div
              key={module.id}
              className={`${colorClasses.bg} ${colorClasses.border} border rounded-lg p-6 hover:shadow-md transition-shadow duration-200`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 p-3 rounded-lg bg-white shadow-sm`}>
                    <IconComponent className={`h-6 w-6 ${colorClasses.icon}`} />
                  </div>
                  <div className="ml-4">
                    <h3 className={`text-lg font-semibold ${colorClasses.title}`}>
                      {module.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {module.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Fonctionnalités :</h4>
                <ul className="space-y-1">
                  {module.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <div className={`w-1.5 h-1.5 rounded-full ${colorClasses.icon.replace('text-', 'bg-')} mr-2`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex justify-between items-center">
                <Link href={module.href}>
                  <button className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${colorClasses.button} transition-colors duration-200`}>
                    <Play className="h-4 w-4 mr-2" />
                    Lancer simulation
                  </button>
                </Link>
                <span className="text-xs text-gray-500">
                  Dernière utilisation: il y a 2 jours
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Simulations */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Simulations récentes</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {[
            {
              type: 'Simulation salaire',
              employee: 'Ahmed Benali',
              amount: '15 000 MAD',
              date: '2025-01-14',
              status: 'Terminée'
            },
            {
              type: 'Impact familial',
              employee: 'Fatima Zahra',
              amount: '12 500 MAD',
              date: '2025-01-13',
              status: 'Terminée'
            },
            {
              type: 'Crédit logement',
              employee: 'Mohamed Alami',
              amount: '18 000 MAD',
              date: '2025-01-12',
              status: 'En cours'
            }
          ].map((simulation, index) => (
            <div key={index} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Calculator className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <h4 className="text-sm font-medium text-gray-900">
                        {simulation.type}
                      </h4>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        simulation.status === 'Terminée' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {simulation.status}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <span>{simulation.employee}</span>
                      <span className="mx-2">•</span>
                      <span className="font-medium">{simulation.amount}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-gray-900">
                    {new Date(simulation.date).toLocaleDateString('fr-FR')}
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 font-medium">
                    Voir détails
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 bg-gray-50 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Voir toutes les simulations
          </button>
        </div>
      </div>
    </div>
  );
}
