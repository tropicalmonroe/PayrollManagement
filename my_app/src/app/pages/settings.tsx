import Head from 'next/head'
import { Layout } from '../../components/Layout'

export default function SettingsPage() {
  return (
    <>
      <Head>
        <title>Paramètres - AD Capital</title>
        <meta name="description" content="Configurez les paramètres de l'application" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
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
                      defaultValue="AD Capital"
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
      </Layout>
    </>
  )
}
