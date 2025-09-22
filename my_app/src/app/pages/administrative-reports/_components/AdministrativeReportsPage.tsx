"use client";
import React from 'react';
import { FileSpreadsheet, ArrowLeft, BookOpen, CreditCard, Building, Receipt } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IoBriefcaseSharp, IoStatsChartSharp } from 'react-icons/io5';
import { BsBank2 } from "react-icons/bs";
import { PiBank } from "react-icons/pi";


const AdministrativeReportsPage = () => {
const router = useRouter();

const reportSections = [
    {
    id: 'payroll-journal',
    title: 'Payroll Journal',
    description: 'Consolidation of all payroll entries for the month by employee for accounting and HR purposes.',
    icon: BookOpen,
    color: 'blue',
    href: '/pages/administrative-reports/payroll-journal',
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
    href: '/pages/administrative-reports/bank-transfer',
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
    href: '/pages/administrative-reports/nssf-declaration',
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
    href: '/pages/administrative-reports/tax-statement',
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
    case 'purple':
        return 'bg-purple-50 hover:bg-purple-100';
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
    case 'purple':
        return 'border-purple-200 hover:border-purple-300';
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
            <FileSpreadsheet className="w-6 h-6 text-blue-50" />
        </div>
            <h1 className="text-2xl font-bold tracking-tighter text-zinc-800">Administrative Reports</h1>
        </div>
        
        <p className="text-zinc-400 text-sm w-[20vw] max-w-3xl">
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
                <div className={`${getBgColor(section.color)} ${getBorderColor(section.color)} border-2 rounded-lg p-6 hover:scale-105 transition ease-in-out duration-300 cursor-pointer h-full`}>
                <div className="flex items-center mb-4">
                    <IconComponent className={`w-6 h-6 ${getIconColor(section.color)} mr-3`} />
                    <h3 className="text-xl font-semibold text-zinc-800 tracking-tighter">{section.title}</h3>
                </div>
                
                <p className="text-zinc-600 mb-4 text-sm leading-relaxed w-[20vw] tracking-tight">
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
            Information about Administrative Reports
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
            <div className='flex items-center mb-6'>
            <div className='p-1 w-8 h-8 bg-zinc-200 rounded-full flex items-center justify-center mr-2'>
            <IoStatsChartSharp className="w-5 h-5" />
            </div>
            <h4 className="font-medium text-zinc-800">
            Generation Process
            </h4> 
            </div>
            <ul className="text-sm text-zinc-600 space-y-1">
                <li>• Selection of period and criteria</li>
                <li>• Automatic data calculation</li>
                <li>• Validation and consistency control</li>
                <li>• Export in required format</li>
            </ul>
            </div>
            
            <div>
            <div className='flex items-center mb-6'>
            <div className='p-1 w-8 h-8 bg-zinc-200 rounded-full flex items-center justify-center mr-2'>
            <BsBank2 className="w-5 h-5" />
            </div>
            <h4 className="font-medium text-zinc-800">
            Regulatory Compliance
            </h4> 
            </div>
            <ul className="text-sm text-zinc-600 space-y-1">
                <li>• Official NSSF and tax administration formats</li>
                <li>• Updated regulatory rates and thresholds</li>
                <li>• Automatic consistency checks</li>
                <li>• Complete generation traceability</li>
            </ul>
            </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
            <div className='flex items-center mb-6'>
            <div className='p-1 w-8 h-8 bg-zinc-200 rounded-full flex items-center justify-center mr-2'>
            <IoBriefcaseSharp className="w-5 h-5" />
            </div>
            <h4 className="font-medium text-zinc-800">
            Accounting Usage
            </h4> 
            </div>
            <ul className="text-sm text-zinc-600 space-y-1">
                <li>• Detailed journals for accounting</li>
                <li>• Summaries of social contributions</li>
                <li>• Breakdown by cost center</li>
                <li>• Compatible with accounting software</li>
            </ul>
            </div>
            
            <div>
            <div className='flex items-center mb-6'>
            <div className='p-1 w-8 h-8 bg-zinc-200 rounded-full flex items-center justify-center mr-2'>
            <PiBank className="w-5 h-5" />
            </div>
            <h4 className="font-medium text-zinc-800">
            Banking Management
            </h4> 
            </div>
            <ul className="text-sm text-zinc-600 space-y-1">
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
            <div className='p-1 w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center mr-2'>
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            </div>
            </div>
            <div className="ml-3">
                <h4 className="text-lg font-semibold text-blue-700">Important Note</h4>
                <p className="text-sm text-blue-600 tracking-tight mt-1 w-[30vw]">
                All generated documents are automatically archived in the "Vault" section 
                for future reference and compliance with legal retention obligations. 
                Formats comply with official standards of Kenyan organizations.
                </p>
            </div>
            </div>
        </div>
        </div>
    </div>
);
};

export default AdministrativeReportsPage;