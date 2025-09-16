import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Layout } from '../../layout';
import { Calculator, Users, TrendingUp, Home, Play, FileText, DollarSign } from 'lucide-react';

export default function SimulationIndex() {
  return (
    <>
      <Head>
        <title>Simulation - AD Capital Payroll Management</title>
        <meta name="description" content="Payroll and tax impact simulation module" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <SimulationContent />
      </Layout>
    </>
  );
}

function SimulationContent() {
  const simulationModules = [
    {
      id: 'salary-simulation',
      title: 'Salary Simulation',
      description: 'Simulate payroll calculations for different salary amounts',
      icon: Calculator,
      href: '/simulation/salary-simulation',
      color: 'blue',
      features: ['Gross/Net calculation', 'Social contributions', 'Income Tax', 'Net pay']
    },
    {
      id: 'family-tax-impact',
      title: 'Family/Tax Impact',
      description: 'Analyze the impact of family dependents on taxation',
      icon: Users,
      href: '/simulation/family-tax-impact',
      color: 'green',
      features: ['Family situation', 'Number of children', 'Tax reductions', 'Comparisons']
    },
    {
      id: 'regularization-recall',
      title: 'Regularization / Back Pay',
      description: 'Simulate salary regularizations and back pay',
      icon: TrendingUp,
      href: '/simulation/regularization-recall',
      color: 'purple',
      features: ['Salary back pay', 'Tax regularizations', 'NSSF adjustments', 'Retroactive calculations']
    },
    {
      id: 'housing-credit',
      title: 'Housing Credit',
      description: 'Calculate the impact of housing credits on payroll',
      icon: Home,
      href: '/simulation/housing-credit',
      color: 'orange',
      features: ['Tax deduction', 'Legal limits', 'Tax savings', 'Monthly simulations']
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        title: 'text-blue-900',
        button: 'bg-blue-600 hover:bg-blue-700 text-white'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'text-green-600',
        title: 'text-green-900',
        button: 'bg-green-600 hover:bg-green-700 text-white'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        icon: 'text-purple-600',
        title: 'text-purple-900',
        button: 'bg-purple-600 hover:bg-purple-700 text-white'
      },
      orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: 'text-orange-600',
        title: 'text-orange-900',
        button: 'bg-orange-600 hover:bg-orange-700 text-white'
      }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Simulation</h2>
        <p className="mt-1 text-sm text-gray-600">
          Simulation tools to analyze different payroll and tax impact scenarios
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calculator className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Simulations this month
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    24
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Identified savings
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    12,450 KES
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Employees analyzed
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    18
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Reports generated
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    7
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {simulationModules.map((module) => {
          const colorClasses = getColorClasses(module.color);
          const IconComponent = module.icon;
          
          return (
            <div
              key={module.id}
              className={`${colorClasses.bg} ${colorClasses.border} border rounded-lg p-6 hover:shadow-md transition-shadow duration-200`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 p-3 rounded-lg bg-white shadow-sm`}>
                    <IconComponent className={`h-6 w-6 ${colorClasses.icon}`} />
                  </div>
                  <div className="ml-4">
                    <h3 className={`text-lg font-semibold ${colorClasses.title}`}>
                      {module.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {module.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Features:</h4>
                <ul className="space-y-1">
                  {module.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <div className={`w-1.5 h-1.5 rounded-full ${colorClasses.icon.replace('text-', 'bg-')} mr-2`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex justify-between items-center">
                <Link href={module.href}>
                  <button className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${colorClasses.button} transition-colors duration-200`}>
                    <Play className="h-4 w-4 mr-2" />
                    Start simulation
                  </button>
                </Link>
                <span className="text-xs text-gray-500">
                  Last used: 2 days ago
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Simulations */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Simulations</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {[
            {
              type: 'Salary Simulation',
              employee: 'Ahmed Benali',
              amount: '15,000 KES',
              date: '2025-01-14',
              status: 'Completed'
            },
            {
              type: 'Family Impact',
              employee: 'Fatima Zahra',
              amount: '12,500 KES',
              date: '2025-01-13',
              status: 'Completed'
            },
            {
              type: 'Housing Credit',
              employee: 'Mohamed Alami',
              amount: '18,000 KES',
              date: '2025-01-12',
              status: 'In Progress'
            }
          ].map((simulation, index) => (
            <div key={index} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Calculator className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <h4 className="text-sm font-medium text-gray-900">
                        {simulation.type}
                      </h4>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        simulation.status === 'Completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {simulation.status}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <span>{simulation.employee}</span>
                      <span className="mx-2">•</span>
                      <span className="font-medium">{simulation.amount}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-gray-900">
                    {new Date(simulation.date).toLocaleDateString('en-KE')}
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 font-medium">
                    View details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 bg-gray-50 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all simulations
          </button>
        </div>
      </div>
    </div>
  );
}