import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Layout } from '../../../components/Layout';
import { Calculator, ArrowLeft, Download, Save, RefreshCw, Info } from 'lucide-react';

export default function SalarySimulation() {
  return (
    <>
      <Head>
        <title>Salary Simulation - AD Capital Payroll</title>
        <meta name="description" content="Simulate payroll calculations for different salary amounts" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <SalarySimulationContent />
      </Layout>
    </>
  );
}

function SalarySimulationContent() {
  const [grossSalary, setGrossSalary] = useState<number>(20000); // Adjusted to KES
  const [familyStatus, setFamilyStatus] = useState<string>('single');
  const [numberOfDependants, setNumberOfDependants] = useState<number>(0);
  const [professionalExpenses, setProfessionalExpenses] = useState<number>(0);
  const [otherDeductions, setOtherDeductions] = useState<number>(0);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Automatic calculation when parameters change
  useEffect(() => {
    calculateSalary();
  }, [grossSalary, familyStatus, numberOfDependants, professionalExpenses, otherDeductions]);

  const calculateSalary = () => {
    setLoading(true);
    
    // Simulate payroll calculations
    setTimeout(() => {
      const taxableSalary = grossSalary - Math.min(professionalExpenses, grossSalary * 0.2, 15000); // Cap at 20% or 15,000 KES
      const nssfContribution = Math.min(grossSalary * 0.06, 2160); // NSSF: 6%, capped at 2,160 KES
      const shifContribution = 1500; // Approximated NHIF for 20,000 KES salary
      const insuranceRelief = Math.min(shifContribution * 0.15, 5000); // 15% of SHIF, capped at 5,000 KES
      
      let netTaxableSalary = taxableSalary - nssfContribution - shifContribution;
      
      // Kenyan personal relief
      const personalRelief = 2400; // Universal personal relief
      netTaxableSalary -= personalRelief + otherDeductions;
      
      // Calculate PAYE (2025 Kenyan tax brackets)
      const annualTaxableSalary = Math.max(0, netTaxableSalary * 12);
      let paye = 0;
      
      if (annualTaxableSalary > 288000) {
        if (annualTaxableSalary <= 388000) {
          paye = (annualTaxableSalary - 288000) * 0.25;
        } else {
          paye = 100000 * 0.25 + (annualTaxableSalary - 388000) * 0.30;
        }
      }
      
      const monthlyPaye = paye / 12;
      const netSalary = grossSalary - nssfContribution - shifContribution - monthlyPaye + insuranceRelief;
      
      setResults({
        grossSalary,
        nssfContribution,
        shifContribution,
        totalContributions: nssfContribution + shifContribution,
        taxableSalary,
        netTaxableSalary: Math.max(0, netTaxableSalary),
        personalRelief,
        insuranceRelief,
        totalDeductions: personalRelief + otherDeductions,
        paye: monthlyPaye,
        netSalary,
        taxRate: taxableSalary > 0 ? (monthlyPaye / taxableSalary) * 100 : 0,
        taxSavings: personalRelief + insuranceRelief + otherDeductions
      });
      
      setLoading(false);
    }, 500);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const resetForm = () => {
    setGrossSalary(20000);
    setFamilyStatus('single');
    setNumberOfDependants(0);
    setProfessionalExpenses(0);
    setOtherDeductions(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/simulation">
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Salary Simulation</h2>
            <p className="mt-1 text-sm text-gray-600">
              Calculate net salary from gross salary with contributions and PAYE
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={resetForm}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </button>
          {results && (
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simulation Parameters */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Simulation Parameters</h3>
          </div>
          <div className="p-6 space-y-6">
            {/* Gross Salary */}
            <div>
              <label htmlFor="grossSalary" className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Gross Salary (KES)
              </label>
              <input
                type="number"
                id="grossSalary"
                value={grossSalary}
                onChange={(e) => setGrossSalary(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="100"
              />
            </div>

            {/* Family Status */}
            <div>
              <label htmlFor="familyStatus" className="block text-sm font-medium text-gray-700 mb-2">
                Family Status
              </label>
              <select
                id="familyStatus"
                value={familyStatus}
                onChange={(e) => setFamilyStatus(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>

            {/* Number of Dependants */}
            <div>
              <label htmlFor="numberOfDependants" className="block text-sm font-medium text-gray-700 mb-2">
                Number of Dependants
              </label>
              <input
                type="number"
                id="numberOfDependants"
                value={numberOfDependants}
                onChange={(e) => setNumberOfDependants(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                min="0"
                max="10"
              />
            </div>

            {/* Professional Expenses */}
            <div>
              <label htmlFor="professionalExpenses" className="block text-sm font-medium text-gray-700 mb-2">
                Professional Expenses (KES)
              </label>
              <input
                type="number"
                id="professionalExpenses"
                value={professionalExpenses}
                onChange={(e) => setProfessionalExpenses(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="50"
              />
              <p className="mt-1 text-xs text-gray-500">
                Maximum 20% of gross salary or 15,000 KES
              </p>
            </div>

            {/* Other Deductions */}
            <div>
              <label htmlFor="otherDeductions" className="block text-sm font-medium text-gray-700 mb-2">
                Other Deductions (KES)
              </label>
              <input
                type="number"
                id="otherDeductions"
                value={otherDeductions}
                onChange={(e) => setOtherDeductions(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="50"
              />
              <p className="mt-1 text-xs text-gray-500">
                Housing credit, pension contributions, etc.
              </p>
            </div>
          </div>
        </div>

        {/* Simulation Results */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Simulation Results</h3>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-500">Calculating...</p>
              </div>
            ) : results ? (
              <div className="space-y-4">
                {/* Gross Salary */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Gross Salary</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(results.grossSalary)}</span>
                </div>

                {/* Contributions */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600 ml-4">- NSSF (6%)</span>
                    <span className="text-sm text-red-600">-{formatCurrency(results.nssfContribution)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600 ml-4">- NHIF</span>
                    <span className="text-sm text-red-600">-{formatCurrency(results.nhifContribution)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Total Contributions</span>
                    <span className="text-sm font-semibold text-red-600">-{formatCurrency(results.totalContributions)}</span>
                  </div>
                </div>

                {/* Taxable Salary */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Taxable Salary</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(results.taxableSalary)}</span>
                </div>

                {/* Tax Deductions */}
                {results.taxSavings > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">- Tax Deductions</span>
                    <span className="text-sm text-green-600">-{formatCurrency(results.taxSavings)}</span>
                  </div>
                )}

                {/* PAYE */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">
                    PAYE ({results.taxRate.toFixed(1)}%)
                  </span>
                  <span className="text-sm font-semibold text-red-600">-{formatCurrency(results.paye)}</span>
                </div>

                {/* Net Salary */}
                <div className="flex justify-between items-center py-3 bg-green-50 px-4 rounded-lg border border-green-200">
                  <span className="text-lg font-semibold text-green-800">Net Salary</span>
                  <span className="text-xl font-bold text-green-800">{formatCurrency(results.netSalary)}</span>
                </div>

                {/* Important Information */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Important Information:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Calculation based on 2025 tax rates</li>
                        <li>• NSSF cap: 2,160 KES</li>
                        <li>• Personal relief: 2,400 KES/month</li>
                        <li>• Insurance relief: Up to 5,000 KES/month</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500">
                  Adjust the parameters to view results
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison with Other Salaries */}
      {results && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Comparison with Other Salaries</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gross Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contributions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PAYE
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[0.8, 0.9, 1.0, 1.1, 1.2].map((multiplier, index) => {
                    const testSalary = Math.round(grossSalary * multiplier);
                    const testProfessionalExpenses = Math.min(professionalExpenses, testSalary * 0.2, 15000);
                    const testNssf = Math.min(testSalary * 0.06, 2160);
                    const testNhif = 1500; // Approximated NHIF
                    const testInsuranceRelief = Math.min(testNhif * 0.15, 5000);
                    const testTaxable = testSalary - testProfessionalExpenses - testNssf - testNhif;
                    const testNetTaxable = testTaxable - 2400 - otherDeductions; // Personal relief
                    const testAnnual = Math.max(0, testNetTaxable * 12);
                    
                    let testPaye = 0;
                    if (testAnnual > 288000) {
                      if (testAnnual <= 388000) {
                        testPaye = (testAnnual - 288000) * 0.25;
                      } else {
                        testPaye = 100000 * 0.25 + (testAnnual - 388000) * 0.30;
                      }
                    }
                    const testMonthlyPaye = testPaye / 12;
                    const testNet = testSalary - testNssf - testNhif - testMonthlyPaye + testInsuranceRelief;
                    const netRate = (testNet / testSalary) * 100;
                    
                    return (
                      <tr key={index} className={multiplier === 1.0 ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(testSalary)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(testNssf + testNhif)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(testMonthlyPaye)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(testNet)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {netRate.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}