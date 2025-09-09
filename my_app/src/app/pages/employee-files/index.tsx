import React from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../../components/Layout';
import { Users, FileText, Eye, Plus } from 'lucide-react';

const EmployeeFilesPage = () => {
  const router = useRouter();

  const sections = [
    {
      title: 'Fiche salarié',
      description: 'Création ou modification du dossier salarié : données personnelles, contrat, salaire, primes, indemnités, échéancier crédit logement.',
      icon: <FileText className="w-8 h-8" />,
      href: '/employee-files/employee-record',
      color: 'bg-blue-500'
    },
    {
      title: 'Avances sur salaire',
      description: 'Enregistrement des avances accordées, suivi, et intégration automatique dans la paie mensuelle.',
      icon: <Plus className="w-8 h-8" />,
      href: '/employee-files/salary-advances',
      color: 'bg-green-500'
    },
    {
      title: 'Consultation fiche salarié',
      description: 'Visualisation en lecture seule de la fiche complète du salarié (sans modification).',
      icon: <Eye className="w-8 h-8" />,
      href: '/employee-files/consultation',
      color: 'bg-purple-500'
    }
  ];

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Dossier salarié</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Gestion complète des dossiers salariés : création, modification, consultation et gestion des avances.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </div>
    </Layout>
  );
};

export default EmployeeFilesPage;
