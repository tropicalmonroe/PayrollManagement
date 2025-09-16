import Head from 'next/head'
import { Layout } from '../../components/Layout';

export default function ReportsPage() {
  return (
    <>
      <Head>
        <title>Reports and Documents - AD Capital</title>
        <meta name="description" content="View payroll reports and documents" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Reports and Documents</h2>
            <p className="mt-1 text-sm text-gray-600">
              View payroll reports and manage documents
            </p>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center py-12">
                <span className="text-6xl">📈</span>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No reports available</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Reports will be available after payroll calculations
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}