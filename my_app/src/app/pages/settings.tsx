import Head from 'next/head'
import { Layout } from '../../components/Layout'

export default function SettingsPage() {
  return (
    <>
      <Head>
        <title>Settings - AD Capital</title>
        <meta name="description" content="Configure the settings of your company and payroll" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <p className="mt-1 text-sm text-gray-600">
              Configure your company and payroll settings here.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Settings */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Company Informaton
                </h3>
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Company Name
                    </label>
                    <input
                      type="text"
                      className="payroll-input mt-1"
                      placeholder="Company Name"
                      defaultValue="AD Capital"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <textarea
                      className="payroll-input mt-1"
                      rows={3}
                      placeholder="Your company address"
                    />
                  </div>
                  <button className="payroll-button">
                    Save
                  </button>
                </div>
              </div>
            </div>

            {/* Payroll Settings */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Payroll Settings
                </h3>
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      NSSF Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="payroll-input mt-1"
                      defaultValue="6"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      NSSF Ceiling (KES)
                    </label>
                    <input
                      type="number"
                      className="payroll-input mt-1"
                      defaultValue="18000"
                    />
                  </div>
                  <button className="payroll-button">
                    Save
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
