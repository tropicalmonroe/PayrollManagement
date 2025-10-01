"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Calculator, Edit, Play } from 'lucide-react';

const PayrollCalculationPage = () => {
const router = useRouter();

const sections = [
    {
    title: 'Monthly Variable Elements',
    description: 'Monthly entry of variables: overtime, absences, exceptional bonuses, leave, delays, advances.',
    icon: <Edit className="w-8 h-8" />,
    href: '/pages/payroll-calculation/monthly-variables',
    color: 'bg-orange-500'
    },
    {
    title: 'Monthly Calculation',
    description: 'Automatic payroll calculation with application of scales, social contributions and taxes according to each employee\'s situation.',
    icon: <Play className="w-8 h-8" />,
    href: '/pages/payroll-calculation/monthly-calculation',
    color: 'bg-green-500'
    }
];

return (
    <div className="p-6 bg-white mt-[2vh] rounded-md">
        <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 bg-zinc-700 rounded-xl p-1">
            <Calculator className="w-6 h-6 text-blue-50" />
        </div>
            <h1 className="text-2xl tracking-tighter font-bold text-zinc-800">Payroll Calculation</h1>
        </div>
        <p className="text-zinc-400 text-sm w-[20vw]">
            Management of variable elements and launch of monthly payroll calculation with automatic application of scales.
        </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, index) => (
            <div
            key={index}
            onClick={() => router.push(section.href)}
            className="bg-white rounded-lg shadow-md cursor-pointer border border-zinc-200 overflow-hidden hover:scale-105 transition ease-in-out duration-300"
            >
            <div className={`${section.color} p-4`}>
                <div className="text-white">
                {section.icon}
                </div>
            </div>
            <div className="p-6">
                <h3 className="text-xl font-semibold text-zinc-800 my-3 tracking-tighter">
                {section.title}
                </h3>
                <p className="text-zinc-600 text-sm w-[25vw] leading-relaxed tracking-tight">
                {section.description}
                </p>
            </div>
            </div>
        ))}
        </div>

        {/* Information section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
            <Calculator className="w-6 h-6 text-blue-600 mr-3 mt-1" />
            <div>
            <h3 className="text-lg font-medium text-blue-900 mb-2 tracking-tighter">
                Payroll Calculation Process
            </h3>
            <div className="text-blue-800 space-y-2">
                <p className="text-sm tracking-tight">
                <strong>1. Variable Elements:</strong> First enter all monthly variable elements (overtime, absences, bonuses, etc.)
                </p>
                <p className="text-sm tracking-tight">
                <strong>2. Automatic Calculation:</strong> Then launch the monthly calculation which will automatically apply all scales and contributions
                </p>
                <p className="text-sm tracking-tight">
                <strong>3. Results:</strong> Payslips will be generated and available in the "Employee Documents" section
                </p>
            </div>
            </div>
        </div>
        </div>
    </div>
);
};

export default PayrollCalculationPage;