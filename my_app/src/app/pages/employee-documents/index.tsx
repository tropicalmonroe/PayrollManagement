import React from 'react';
import { Layout } from '../../../components/Layout';
import { FileText, ArrowLeft, FileCheck, Award, Calculator } from 'lucide-react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const EmployeeDocumentsPage = () => {
  const router = useRouter();

  const documentSections = [
    {
      id: 'payslip',
      title: 'Payslip', 
      description: 'Generation of individual payslip in PDF, intended for delivery to the employee.',
      icon: FileText,
      color: 'blue',
      href: '/employee-documents/payslip',
      features: [
        'Individual PDF generation', 
        'Complete details of earnings and deductions',
        'Automatic calculation of contributions', 
        'Official compliant format'
      ]
    },
    {
      id: 'salary-certificate',
      title: 'Salary Certificate', 
      description: 'Generation of income or attendance certificates upon employee request.',
      icon: Award,
      color: 'green',
      href: '/employee-documents/salary-certificate',
      features: [
        'Income certificate', 
        'Attendance certificate',
        'Customizable data',
        'Official PDF format' 
      ]
    },
    {
      id: 'final-settlement',
      title: 'Final Settlement', 
      description: 'Entry of termination elements (unused leave, indemnities, etc.) and generation of the official settlement document.', 
      icon: Calculator,
      color: 'orange',
      href: '/employee-documents/final-settlement',
      features: [
        'Calculation of unused leave',
        'Termination indemnities', 
        'Automatic final settlement', 
        'Official PDF document' 
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
            <span>Back</span>
          </button>
          
          <div className="flex items-center space-x-3 mb-4">
            <FileCheck className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Employee Documents</h1>
          </div>
          
          <p className="text-gray-600 text-lg max-w-3xl">
            Generation and management of all official documents for employees: payslips, certificates, and final settlements.
          </p>
        </div>

        {/* Main sections */}
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
            Information on Employee Documents 
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📋 Generation Process</h4> 
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Selection of employee and period</li> 
                <li>• Automatic calculation of amounts</li>
                <li>• PDF document generation</li>
                <li>• Automatic archiving in the vault</li> 
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🔒 Security and Compliance</h4> 
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Documents compliant with Kenyan regulations</li>
                <li>• Secure and timestamped archiving</li>
                <li>• Complete traceability of generations</li>
                <li>• Non-editable PDF format</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FileCheck className="w-5 h-5 text-blue-600 mt-0.5" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">Important Note</h4> 
                <p className="text-sm text-blue-700 mt-1">
                  All generated documents are automatically archived in the "Vault" section 
                  for future consultation and compliance with legal retention obligations. 
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