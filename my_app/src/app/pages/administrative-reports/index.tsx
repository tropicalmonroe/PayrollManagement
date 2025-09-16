import React from 'react';
import { Layout } from '../../Layout';
import { FileSpreadsheet, ArrowLeft, BookOpen, CreditCard, Building, Receipt } from 'lucide-react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const AdministrativeReportsPage = () => {
  const router = useRouter();

  const reportSections = [
    {
      id: 'payroll-journal',
      title: 'Payroll Journal',
      description: 'Consolidation of all payroll entries for the month by employee for accounting and HR purposes.',
      icon: BookOpen,
      color: 'blue',
      href: '/administrative-reports/payroll-journal',
      features: [
        'Monthly consolidation by employee',
        'Detailed accounting export',
        'Summary of social contributions',
        'Excel and PDF formats'
      ]
    },
    {
      id: 'bank-transfer',
      title: 'Bulk Bank Transfer',
      description: 'Generation of bank or Excel file for executing bulk salary transfers.',
      icon: CreditCard,
      color: 'green',
      href: '/administrative-reports/bank-transfer',
      features: [
        'Bank transfer file format',
        'Detailed Excel export',
        'Account validation',
        'Transfer summary'
      ]
    },
    {
      id: 'nssf-declaration',
      title: 'NSSF Declaration',
      description: 'Production of the monthly file or form to be submitted to NSSF for contributions due.',
      icon: Building,
      color: 'orange',
      href: '/administrative-reports/nssf-declaration',
      features: [
        'Monthly NSSF declaration',
        'Automatic contribution calculation',
        'Official NSSF format',
        'Data validation'
      ]
    },
    {
      id: 'tax-statement',
      title: 'Income Tax Statement',
      description: 'Monthly and annual detail of income tax withheld, generated according to Kenyan tax rates.',
      icon: Receipt,
      color: 'purple',
      href: '/administrative-reports/tax-statement',
      features: [
        'Monthly and annual income tax statement',
        'Kenyan tax rates',
        'Detail by employee',
        'Export for tax administration'
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
            <span>Back</span>
          </button>
          
          <div className="flex items-center space-x-3 mb-4">
            <FileSpreadsheet className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Administrative Reports</h1>
          </div>
          
          <p className="text-gray-600 text-lg max-w-3xl">
            Generation of administrative and accounting documents: payroll journals, bank transfers, 
            NSSF declarations and income tax statements for official organizations.
          </p>
        </div>

        {/* Main sections */}
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
                    <h4 className="text-sm font-medium text-gray-900">Features:</h4>
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
                      Access →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Additional information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Information about Administrative Reports
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📊 Generation Process</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Selection of period and criteria</li>
                <li>• Automatic data calculation</li>
                <li>• Validation and consistency control</li>
                <li>• Export in required format</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🏛️ Regulatory Compliance</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Official NSSF and tax administration formats</li>
                <li>• Updated regulatory rates and thresholds</li>
                <li>• Automatic consistency checks</li>
                <li>• Complete generation traceability</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">💼 Accounting Usage</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Detailed journals for accounting</li>
                <li>• Summaries of social contributions</li>
                <li>• Breakdown by cost center</li>
                <li>• Compatible with accounting software</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🏦 Banking Management</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Bank transfer files</li>
                <li>• Account number validation</li>
                <li>• Control summaries</li>
                <li>• Transfer history</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">Important Note</h4>
                <p className="text-sm text-blue-700 mt-1">
                  All generated documents are automatically archived in the "Vault" section 
                  for future reference and compliance with legal retention obligations. 
                  Formats comply with official standards of Kenyan organizations.
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