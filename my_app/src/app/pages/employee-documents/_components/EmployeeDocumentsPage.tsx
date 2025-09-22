"use client";
import React from 'react';
import { FileText, ArrowLeft, FileCheck, Award, Calculator } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IoDocumentTextSharp } from "react-icons/io5";
import { MdSecurity } from 'react-icons/md';

const EmployeeDocumentsPage = () => {
  const router = useRouter();

  const documentSections = [
    {
      id: 'payslip',
      title: 'Payslip', 
      description: 'Generation of individual payslip in PDF, intended for delivery to the employee.',
      icon: FileText,
      color: 'blue',
      href: '/pages/employee-documents/payslip',
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
      href: '/pages/employee-documents/salary-certificate',
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
      href: '/pages/employee-documents/final-settlement',
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
        return 'text-zinc-600';
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
        return 'bg-zinc-50 hover:bg-zinc-100';
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
        return 'border-zinc-200 hover:border-zinc-300';
    }
  };

  return (
      <div className="p-6 bg-white mt-[2vh] rounded-md">
        <div className="mb-8">
          <button
                    onClick={() => router.back()}
                    className="flex items-center justify-center space-x-1 scale-95 hover:bg-[#3890bf] transition-colors duration-300 
                    mb-4 bg-rose-400 px-4 py-1 rounded-md"
                  >
                    <ArrowLeft className="w-5 h-5 text-white" />
                    <span className='tracking-tighter text-white'>Back</span>
                </button>
          
          <div className="flex items-center space-x-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 bg-zinc-700 rounded-xl p-1">
            <FileCheck className="w-6 h-6 text-blue-50" />
          </div>
            <h1 className="text-2xl font-bold tracking-tighter text-zinc-800">Employee Documents</h1>
          </div>
          
          <p className="text-zinc-400 text-sm w-[20vw] max-w-3xl">
            Generation and management of all official documents for employees: payslips, certificates, and final settlements.
          </p>
        </div>

        {/* Main sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {documentSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <Link key={section.id} href={section.href}>
                <div className={`${getBgColor(section.color)} ${getBorderColor(section.color)} 
                border-2 rounded-lg p-6 transition-all cursor-pointer h-full scale-100 hover:scale-105 ease-in-out duration-300`}>
                  <div className="flex items-center mb-4">
                    <IconComponent className={`w-6 h-6 ${getIconColor(section.color)} mr-3`} />
                    <h3 className="text-xl font-semibold text-zinc-800 tracking-tight">{section.title}</h3>
                  </div>
                  
                  <p className="text-zinc-600 mb-4 text-sm leading-relaxed">
                    {section.description}
                  </p>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-zinc-800">Features:</h4> 
                    <ul className="text-xs text-zinc-600 space-y-1">
                      {section.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full mr-2"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-zinc-200">
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
          <h3 className="text-lg tracking-tight font-semibold capitalize text-zinc-900 mb-4">
            Information on Employee Documents 
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className='flex items-center mb-6'>
                <div className='p-1 w-8 h-8 bg-zinc-200 rounded-full flex items-center justify-center mr-2'>
                <IoDocumentTextSharp className="w-5 h-5" />
                </div>
              <h4 className="font-medium text-zinc-800">
                Generation Process
                </h4> 
              </div>
              <ul className="text-sm text-zinc-600 space-y-1">
                <li>• Selection of employee and period</li> 
                <li>• Automatic calculation of amounts</li>
                <li>• PDF document generation</li>
                <li>• Automatic archiving in the vault</li> 
              </ul>
            </div>
            
            <div>
              <div className='flex items-center mb-6'>
                <div className='p-1 w-8 h-8 bg-zinc-200 rounded-full flex items-center justify-center mr-2'>
                <MdSecurity className="w-5 h-5" />
                </div>
              <h4 className="font-medium text-zinc-800">
                Security And Compliance
                </h4> 
              </div>
              <ul className="text-sm text-zinc-600 space-y-1">
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
                <div className='p-1 w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center mr-2'>
                <FileCheck className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-3">
                <h4 className="text-lg font-semibold text-blue-700">Important Note</h4> 
                <p className="text-sm text-blue-600 tracking-tight mt-1">
                  All generated documents are automatically archived in the "Vault" section 
                  for future consultation and compliance with legal retention obligations. 
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default EmployeeDocumentsPage;