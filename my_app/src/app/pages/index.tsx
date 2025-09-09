import { useState } from 'react'
import Head from 'next/head'

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <>
      <Head>
        <title>Gestion de Paie - AD Capital</title>
        <meta name="description" content="Application de gestion de paie" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Gestion de Paie
                  </h1>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Application dédiée à la gestion de paie
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {[
                { id: 'dashboard', label: 'Tableau de bord', icon: '📊' },
                { id: 'employees', label: 'Employés', icon: '👥' },
                { id: 'payroll', label: 'Calcul de paie', icon: '💰' },
                { id: 'documents', label: 'Documents', icon: '📄' },
                { id: 'reports', label: 'Rapports', icon: '📈' },
                { id: 'settings', label: 'Paramètres', icon: '⚙️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {activeTab === 'dashboard' && <DashboardContent />}
            {activeTab === 'employees' && <EmployeesContent />}
            {activeTab === 'payroll' && <PayrollContent />}
            {activeTab === 'documents' && <DocumentsContent />}
            {activeTab === 'reports' && <ReportsContent />}
            {activeTab === 'settings' && <SettingsContent />}
          </div>
        </main>
      </div>
    </>
  )
}

function DashboardContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tableau de bord</h2>
        <p className="mt-1 text-sm text-gray-600">
          Vue d'ensemble de la gestion de paie
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Employés actifs', value: '0', icon: '👥', color: 'blue' },
          { title: 'Paies du mois', value: '0', icon: '💰', color: 'green' },
          { title: 'Documents générés', value: '0', icon: '📄', color: 'purple' },
          { title: 'Montant total', value: '0 MAD', icon: '💵', color: 'yellow' }
        ].map((stat, index) => (
          <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.title}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Actions rapides
          </h3>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Ajouter un employé', description: 'Créer une nouvelle fiche employé', icon: '➕' },
              { title: 'Calculer la paie', description: 'Lancer le calcul de paie mensuel', icon: '🧮' },
              { title: 'Générer les bulletins', description: 'Créer les bulletins de paie', icon: '📋' }
            ].map((action, index) => (
              <div key={index} className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300">
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-600 ring-4 ring-white">
                    <span className="text-xl">{action.icon}</span>
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium">
                    <button className="focus:outline-none">
                      <span className="absolute inset-0" aria-hidden="true" />
                      {action.title}
                    </button>
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {action.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmployeesContent() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des employés</h2>
          <p className="mt-1 text-sm text-gray-600">
            Gérez les informations des employés
          </p>
        </div>
        <button className="payroll-button">
          Ajouter un employé
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center py-12">
            <span className="text-6xl">👥</span>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun employé</h3>
            <p className="mt-2 text-sm text-gray-500">
              Commencez par ajouter votre premier employé
            </p>
            <div className="mt-6">
              <button className="payroll-button">
                Ajouter un employé
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PayrollContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Calcul de paie</h2>
        <p className="mt-1 text-sm text-gray-600">
          Calculez et gérez les paies des employés
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center py-12">
            <span className="text-6xl">💰</span>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Calcul de paie</h3>
            <p className="mt-2 text-sm text-gray-500">
              Fonctionnalité de calcul de paie disponible prochainement
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function DocumentsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
        <p className="mt-1 text-sm text-gray-600">
          Gérez les documents de paie
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center py-12">
            <span className="text-6xl">📄</span>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun document</h3>
            <p className="mt-2 text-sm text-gray-500">
              Les documents générés apparaîtront ici
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReportsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Rapports</h2>
        <p className="mt-1 text-sm text-gray-600">
          Consultez les rapports de paie
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center py-12">
            <span className="text-6xl">📈</span>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun rapport</h3>
            <p className="mt-2 text-sm text-gray-500">
              Les rapports seront disponibles après le calcul des paies
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Paramètres</h2>
        <p className="mt-1 text-sm text-gray-600">
          Configurez les paramètres de l'application
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Settings */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Informations de l'entreprise
            </h3>
            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nom de l'entreprise
                </label>
                <input
                  type="text"
                  className="payroll-input mt-1"
                  placeholder="Nom de votre entreprise"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Adresse
                </label>
                <textarea
                  className="payroll-input mt-1"
                  rows={3}
                  placeholder="Adresse de l'entreprise"
                />
              </div>
              <button className="payroll-button">
                Sauvegarder
              </button>
            </div>
          </div>
        </div>

        {/* Payroll Settings */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Paramètres de paie
            </h3>
            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Taux CNSS (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="payroll-input mt-1"
                  defaultValue="4.48"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Plafond CNSS (MAD)
                </label>
                <input
                  type="number"
                  className="payroll-input mt-1"
                  defaultValue="6000"
                />
              </div>
              <button className="payroll-button">
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
