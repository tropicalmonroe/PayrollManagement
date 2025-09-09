import React from 'react';
import { Layout } from '../../../components/Layout';
import { FileSpreadsheet, ArrowLeft, BookOpen, CreditCard, Building, Receipt } from 'lucide-react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const AdministrativeReportsPage = () => {
  const router = useRouter();

  const reportSections = [
    {
      id: 'payroll-journal',
      title: 'Journal de paie',
      description: 'Regroupement de toutes les lignes de paie du mois par salarié pour usage comptable et RH.',
      icon: BookOpen,
      color: 'blue',
      href: '/administrative-reports/payroll-journal',
      features: [
        'Consolidation mensuelle par employé',
        'Export comptable détaillé',
        'Récapitulatif des charges sociales',
        'Format Excel et PDF'
      ]
    },
    {
      id: 'bank-transfer',
      title: 'Virement de masse',
      description: 'Génération du fichier bancaire ou Excel pour l\'exécution du virement groupé des salaires.',
      icon: CreditCard,
      color: 'green',
      href: '/administrative-reports/bank-transfer',
      features: [
        'Fichier bancaire SEPA/Swift',
        'Export Excel détaillé',
        'Validation des comptes',
        'Récapitulatif des virements'
      ]
    },
    {
      id: 'cnss-declaration',
      title: 'Déclaration CNSS',
      description: 'Production du fichier ou formulaire mensuel à transmettre à la CNSS selon les cotisations dues.',
      icon: Building,
      color: 'orange',
      href: '/administrative-reports/cnss-declaration',
      features: [
        'Déclaration mensuelle CNSS',
        'Calcul automatique des cotisations',
        'Format officiel CNSS',
        'Validation des données'
      ]
    },
    {
      id: 'tax-statement',
      title: 'État fiscal IGR',
      description: 'Détail mensuel et annuel de l\'impôt sur le revenu (IGR) retenu à la source, généré selon le barème fiscal marocain.',
      icon: Receipt,
      color: 'purple',
      href: '/administrative-reports/tax-statement',
      features: [
        'État mensuel et annuel IGR',
        'Barème fiscal marocain',
        'Détail par employé',
        'Export pour administration fiscale'
      ]
    }
  ];

  const getIconColor = (color: string) => {
    switch (color) {
      case 'blue':
        return 'text-blue-600';
      case 'green':
        return 'text-green-600';
      case 'orange':
        return 'text-orange-600';
      case 'purple':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const getBgColor = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 hover:bg-blue-100';
      case 'green':
        return 'bg-green-50 hover:bg-green-100';
      case 'orange':
        return 'bg-orange-50 hover:bg-orange-100';
      case 'purple':
        return 'bg-purple-50 hover:bg-purple-100';
      default:
        return 'bg-gray-50 hover:bg-gray-100';
    }
  };

  const getBorderColor = (color: string) => {
    switch (color) {
      case 'blue':
        return 'border-blue-200 hover:border-blue-300';
      case 'green':
        return 'border-green-200 hover:border-green-300';
      case 'orange':
        return 'border-orange-200 hover:border-orange-300';
      case 'purple':
        return 'border-purple-200 hover:border-purple-300';
      default:
        return 'border-gray-200 hover:border-gray-300';
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
          
          <div className="flex items-center space-x-3 mb-4">
            <FileSpreadsheet className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Éditions administratives</h1>
          </div>
          
          <p className="text-gray-600 text-lg max-w-3xl">
            Génération des documents administratifs et comptables : journaux de paie, virements bancaires, 
            déclarations CNSS et états fiscaux IGR pour les organismes officiels.
          </p>
        </div>

        {/* Sections principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {reportSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <Link key={section.id} href={section.href}>
                <div className={`${getBgColor(section.color)} ${getBorderColor(section.color)} border-2 rounded-lg p-6 transition-all duration-200 cursor-pointer h-full`}>
                  <div className="flex items-center mb-4">
                    <IconComponent className={`w-8 h-8 ${getIconColor(section.color)} mr-3`} />
                    <h3 className="text-xl font-semibold text-gray-900">{section.title}</h3>
                  </div>
                  
                  <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                    {section.description}
                  </p>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Fonctionnalités :</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {section.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className={`text-sm font-medium ${getIconColor(section.color)}`}>
                      Accéder →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Informations complémentaires */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Informations sur les éditions administratives
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📊 Processus de génération</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Sélection de la période et des critères</li>
                <li>• Calcul automatique des données</li>
                <li>• Validation et contrôle de cohérence</li>
                <li>• Export dans le format requis</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🏛️ Conformité réglementaire</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Formats officiels CNSS et administration fiscale</li>
                <li>• Barèmes et taux réglementaires à jour</li>
                <li>• Contrôles de cohérence automatiques</li>
                <li>• Traçabilité complète des générations</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">💼 Usage comptable</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Journaux détaillés pour la comptabilité</li>
                <li>• Récapitulatifs des charges sociales</li>
                <li>• Ventilation par centre de coût</li>
                <li>• Exports compatibles logiciels comptables</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🏦 Gestion bancaire</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Fichiers de virement SEPA/Swift</li>
                <li>• Validation des RIB et comptes</li>
                <li>• Récapitulatifs de contrôle</li>
                <li>• Historique des virements</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">Note importante</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Tous les documents générés sont automatiquement archivés dans la section "Coffre" 
                  pour consultation ultérieure et respect des obligations légales de conservation. 
                  Les formats respectent les standards officiels des organismes marocains.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdministrativeReportsPage;
