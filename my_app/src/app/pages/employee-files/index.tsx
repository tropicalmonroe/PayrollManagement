import React from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../Layout';
import { Users, FileText, Eye, Plus } from 'lucide-react';

const EmployeeFilesPage = () => {
  const router = useRouter();

  const sections = [
    {
      title: 'Employee Profile',
      description: 'Create or modify employee profile: personal details, contract, salary, allowances, deductions, housing loan schedule.',
      icon: <FileText className="w-8 h-8" />,
      href: '/employee-files/employee-record',
      color: 'bg-blue-500'
    },
    {
      title: 'Salary Advances',
      description: 'Record granted advances, track them, and automatically integrate into monthly payroll.',
      icon: <Plus className="w-8 h-8" />,
      href: '/employee-files/salary-advances',
      color: 'bg-green-500'
    },
    {
      title: 'Employee Profile Review',
      description: 'Read-only view of the employee’s complete profile (no modifications).',
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
            <h1 className="text-3xl font-bold text-gray-900">Employee Profile</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Comprehensive management of employee profiles: creation, modification, review, and salary advance management. 
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