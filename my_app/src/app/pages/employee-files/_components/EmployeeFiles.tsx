"use client";
import React from 'react';
import { Users, FileText, Eye, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

const EmployeeFilesPage = () => {
    const router = useRouter();

const sections = [
    {
    title: 'Employee Record',
    description: 'Create or modify employee profile: personal details, contract, salary, allowances, deductions, housing loan schedule.',
    icon: <FileText className="w-8 h-8" />,
    href: '/pages/employee-files/employee-record',
    color: 'bg-blue-500'
    },
    {
    title: 'Salary Advances',
    description: 'Record granted advances, track them, and automatically integrate into monthly payroll.',
    icon: <Plus className="w-8 h-8" />,
    href: '/pages/employee-files/salary-advances',
    color: 'bg-green-500'
    },
    {
    title: 'Employee Profile Review',
    description: 'Read-only view of the employee’s complete profile (no modifications).',
    icon: <Eye className="w-8 h-8" />,
    href: '/pages/employee-files/consultation',
    color: 'bg-purple-500'
    }
];

return (
    <div className="p-6 bg-white mt-[2vh] rounded-md h-[84vh]">
        <div className="mb-8">
        <div className="flex items-center space-x-3 my-8">
        <div className="flex items-center justify-center w-10 h-10 bg-zinc-700 rounded-xl p-1">
            <Users className="w-6 h-6 text-blue-50" />
        </div>
            <h1 className="text-2xl font-bold tracking-tighter text-zinc-800">Employee Profile</h1>
        </div>
        <p className="text-zinc-400 text-sm w-[20vw] mt-7">
            Comprehensive management of employee profiles: creation, modification, review, and salary advance management. 
        </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-20">
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
                <p className="text-zinc-600 text-sm leading-relaxed w-[15vw] tracking-tight">
                {section.description}
                </p>
            </div>
            </div>
        ))}
        </div>
    </div>
);
};

export default EmployeeFilesPage;