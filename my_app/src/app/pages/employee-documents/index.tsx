import React from 'react';
import { Layout } from '../../components/Layout';
import { FileText, ArrowLeft, FileCheck, Award, Calculator } from 'lucide-react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const EmployeeDocumentsPage = () => {
  const router = useRouter();

  const documentSections = [
    {
      id: 'payslip',
      title: 'Bulletin de paie',
      description: 'Génération du bulletin de paie individuel en PDF, destiné à la remise au salarié.',
      icon: FileText,
      color: 'blue',
      href: '/employee-documents/payslip',
      features: [
        'Génération PDF individuelle',
        'Détail complet des gains et retenues',
        'Calculs automatiques des cotisations',
        'Format officiel conforme'
      ]
    },
    {
      id: 'salary-certificate',
      title: 'Attestation de salaire',
      description: 'Génération d\'attestations de revenu ou de présence à la demande du salarié.',
      icon: Award,
      color: 'green',
      href: '/employee-documents/salary-certificate',
      features: [
        'Attestation de revenu',
        'Attestation de présence',
        'Données personnalisables',
        'Format PDF officiel'
      ]
    },
    {
      id: 'final-settlement',
      title: 'Solde de tout compte',
      description: 'Saisie des éléments de rupture (congés non pris, indemnités…) et génération du document officiel de solde.',
      icon: Calculator,
      color: 'orange',
      href: '/employee-documents/final-settlement',
      features: [
        'Calcul des congés non pris',
        'Indemnités de rupture',
        'Solde final automatique',
        'Document officiel PDF'
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
            <FileCheck className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Documents salariés</h1>
          </div>
          
          <p className="text-gray-600 text-lg max-w-3xl">
            Génération et gestion de tous les documents officiels destinés aux salariés : 
            bulletins de paie, attestations et soldes de tout compte.
          </p>
        </div>

        {/* Sections principales */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {documentSections.map((section) => {
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
            Informations sur les documents salariés
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📋 Processus de génération</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Sélection de l'employé et de la période</li>
                <li>• Calcul automatique des montants</li>
                <li>• Génération du document PDF</li>
                <li>• Archivage automatique dans le coffre</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🔒 Sécurité et conformité</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Documents conformes à la réglementation marocaine</li>
                <li>• Archivage sécurisé et horodaté</li>
                <li>• Traçabilité complète des générations</li>
                <li>• Format PDF non modifiable</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FileCheck className="w-5 h-5 text-blue-600 mt-0.5" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">Note importante</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Tous les documents générés sont automatiquement archivés dans la section "Coffre" 
                  pour consultation ultérieure et respect des obligations légales de conservation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeDocumentsPage;
