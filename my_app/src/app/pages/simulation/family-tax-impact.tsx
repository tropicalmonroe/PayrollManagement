import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../layout';
import { Users, ArrowLeft, Download, RefreshCw, Info, TrendingUp, TrendingDown } from 'lucide-react';

export default function FamilyTaxImpact() {
  return (
    <>
      <Head>
        <title>Family and Tax Impact - AD Capital Payroll</title>
        <meta name="description" content="Analyze the impact of family status on taxation" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <FamilyTaxImpactContent />
      </Layout>
    </>
  );
}

function FamilyTaxImpactContent() {
  const [grossSalary, setGrossSalary] = useState<number>(20000); // Adjusted default to KES
  const [currentStatus, setCurrentStatus] = useState<string>('single');
  const [currentDependants, setCurrentDependants] = useState<number>(0);
  const [newStatus, setNewStatus] = useState<string>('married');
  const [newDependants, setNewDependants] = useState<number>(1);
  const [professionalExpenses, setProfessionalExpenses] = useState<number>(0);
  const [otherDeductions, setOtherDeductions] = useState<number>(0);
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    calculateComparison();
  }, [grossSalary, currentStatus, currentDependants, newStatus, newDependants, professionalExpenses, otherDeductions]);

  const calculateSalary = (status: string, dependants: number) => {
    const taxableSalary = grossSalary - professionalExpenses;
    const nssfContribution = Math.min(grossSalary * 0.06, 2160); // NSSF: 6%, capped at 2,160 KES
    const shifContribution = 1700; // Approximated SHIF for typical salary range
    const insuranceRelief = Math.min(shifContribution * 0.15, 5000); // 15% of NHIF, capped at 5,000 KES
    
    let netTaxableSalary = taxableSalary - nssfContribution - shifContribution;
    
    // Deductions: Kenyan personal relief (2,400 KES/month for all taxpayers)
    const personalRelief = 2400;
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
    // Monthly PAYE
    const monthlyPaye = paye / 12;
    const netSalary = grossSalary - nssfContribution - shifContribution - monthlyPaye + insuranceRelief;
    
    return {
      grossSalary,
      nssfContribution,
      shifContribution,
      totalContributions: nssfContribution + shifContribution,
      taxableSalary,
      personalRelief,
      insuranceRelief,
      totalDeductions: personalRelief + otherDeductions,
      netTaxableSalary: Math.max(0, netTaxableSalary),
      paye: monthlyPaye,
      netSalary,
      taxRate: taxableSalary > 0 ? (monthlyPaye / taxableSalary) * 100 : 0
    };
  };

  const calculateComparison = () => {
    setLoading(true);
    
    setTimeout(() => {
      const currentStatusCalc = calculateSalary(currentStatus, currentDependants);
      const newStatusCalc = calculateSalary(newStatus, newDependants);
      
      const difference = {
        grossSalary: newStatusCalc.grossSalary - currentStatusCalc.grossSalary,
        contributions: newStatusCalc.totalContributions - currentStatusCalc.totalContributions,
        deductions: newStatusCalc.totalDeductions - currentStatusCalc.totalDeductions,
        paye: newStatusCalc.paye - currentStatusCalc.paye,
        netSalary: newStatusCalc.netSalary - currentStatusCalc.netSalary,
        annualSavings: (currentStatusCalc.paye - newStatusCalc.paye) * 12
      };
      
      setComparison({
        current: currentStatusCalc,
        new: newStatusCalc,
        difference
      });
      
      setLoading(false);
    }, 300);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const formatDifference = (amount: number) => {
    const formatted = formatCurrency(Math.abs(amount));
    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  const resetForm = () => {
    setGrossSalary(20000);
    setCurrentStatus('single');
    setCurrentDependants(0);
    setNewStatus('married');
    setNewDependants(1);
    setProfessionalExpenses(0);
    setOtherDeductions(0);
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'single': 'Single',
      'married': 'Married',
      'divorced': 'Divorced',
      'widowed': 'Widowed'
    };
    return labels[status as keyof typeof labels] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/simulation">
            <button className="inline-flex items-center px-3 py-2 border border-zinc-300 shadow-sm text-sm leading-4 font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">Family and Tax Impact</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Compare the tax impact of different family situations
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={resetForm}
            className="inline-flex items-center px-4 py-2 border border-zinc-300 shadow-sm text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </button>
          {comparison && (
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Parameters */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-zinc-200">
            <h3 className="text-lg font-medium text-zinc-900">Basic Parameters</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label htmlFor="grossSalary" className="block text-sm font-medium text-zinc-700 mb-2">
                Monthly Gross Salary (KES)
              </label>
              <input
                type="number"
                id="grossSalary"
                value={grossSalary}
                onChange={(e) => setGrossSalary(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                min="0"
                step="100"
              />
            </div>

            <div>
              <label htmlFor="professionalExpenses" className="block text-sm font-medium text-zinc-700 mb-2">
                Professional Expenses (KES)
              </label>
              <input
                type="number"
                id="professionalExpenses"
                value={professionalExpenses}
                onChange={(e) => setProfessionalExpenses(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                min="0"
                step="50"
              />
            </div>

            <div>
              <label htmlFor="otherDeductions" className="block text-sm font-medium text-zinc-700 mb-2">
                Other Deductions (KES)
              </label>
              <input
                type="number"
                id="otherDeductions"
                value={otherDeductions}
                onChange={(e) => setOtherDeductions(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                min="0"
                step="50"
              />
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-zinc-200 bg-red-50">
            <h3 className="text-lg font-medium text-red-900">Current Status</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label htmlFor="currentStatus" className="block text-sm font-medium text-zinc-700 mb-2">
                Family Status
              </label>
              <select
                id="currentStatus"
                value={currentStatus}
                onChange={(e) => setCurrentStatus(e.target.value)}
                className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              >
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>

            <div>
              <label htmlFor="currentDependants" className="block text-sm font-medium text-zinc-700 mb-2">
                Number of Dependants
              </label>
              <input
                type="number"
                id="currentDependants"
                value={currentDependants}
                onChange={(e) => setCurrentDependants(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                min="0"
                max="10"
              />
            </div>

            {comparison && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="text-sm font-medium text-red-800 mb-2">Current Summary</h4>
                <div className="space-y-1 text-xs text-red-700">
                  <div className="flex justify-between">
                    <span>Monthly PAYE:</span>
                    <span className="font-medium">{formatCurrency(comparison.current.paye)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Salary:</span>
                    <span className="font-medium">{formatCurrency(comparison.current.netSalary)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* New Status */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-zinc-200 bg-green-50">
            <h3 className="text-lg font-medium text-green-900">New Status</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label htmlFor="newStatus" className="block text-sm font-medium text-zinc-700 mb-2">
                Family Status
              </label>
              <select
                id="newStatus"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>

            <div>
              <label htmlFor="newDependants" className="block text-sm font-medium text-zinc-700 mb-2">
                Number of Dependants
              </label>
              <input
                type="number"
                id="newDependants"
                value={newDependants}
                onChange={(e) => setNewDependants(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                min="0"
                max="10"
              />
            </div>

            {comparison && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="text-sm font-medium text-green-800 mb-2">New Summary</h4>
                <div className="space-y-1 text-xs text-green-700">
                  <div className="flex justify-between">
                    <span>Monthly PAYE:</span>
                    <span className="font-medium">{formatCurrency(comparison.new.paye)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Salary:</span>
                    <span className="font-medium">{formatCurrency(comparison.new.netSalary)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Results */}
      {loading ? (
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-sm text-zinc-500">Calculating impact...</p>
          </div>
        </div>
      ) : comparison ? (
        <div className="space-y-6">
          {/* Main Impact */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-zinc-200">
              <h3 className="text-lg font-medium text-zinc-900">Impact of New Status</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-center mb-2">
                    {comparison.difference.paye < 0 ? (
                      <TrendingDown className="h-8 w-8 text-green-600" />
                    ) : (
                      <TrendingUp className="h-8 w-8 text-red-600" />
                    )}
                  </div>
                  <div className="text-2xl font-bold text-zinc-900">
                    {formatDifference(comparison.difference.paye)}
                  </div>
                  <div className="text-sm text-zinc-600">Monthly PAYE</div>
                </div>

                <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-center mb-2">
                    {comparison.difference.netSalary > 0 ? (
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-red-600" />
                    )}
                  </div>
                  <div className="text-2xl font-bold text-zinc-900">
                    {formatDifference(comparison.difference.netSalary)}
                  </div>
                  <div className="text-sm text-zinc-600">Monthly Net Salary</div>
                </div>

                <div className="text-center p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-center mb-2">
                    {comparison.difference.annualSavings > 0 ? (
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-red-600" />
                    )}
                  </div>
                  <div className="text-2xl font-bold text-zinc-900">
                    {formatCurrency(comparison.difference.annualSavings)}
                  </div>
                  <div className="text-sm text-zinc-600">Annual Savings</div>
                </div>
              </div>
            </div>
          </div>

          {/* Deduction Details */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-zinc-200">
              <h3 className="text-lg font-medium text-zinc-900">Tax Deduction Details</h3>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Deduction Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Current Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        New Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Difference
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-zinc-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                        Personal Relief
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                        {formatCurrency(comparison.current.personalRelief)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                        {formatCurrency(comparison.new.personalRelief)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={comparison.new.personalRelief > comparison.current.personalRelief ? 'text-green-600' : 'text-zinc-500'}>
                          {formatDifference(comparison.new.personalRelief - comparison.current.personalRelief)}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                        Insurance Relief
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                        {formatCurrency(comparison.current.insuranceRelief)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                        {formatCurrency(comparison.new.insuranceRelief)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={comparison.new.insuranceRelief > comparison.current.insuranceRelief ? 'text-green-600' : 'text-zinc-500'}>
                          {formatDifference(comparison.new.insuranceRelief - comparison.current.insuranceRelief)}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                        Other Deductions
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                        {formatCurrency(comparison.current.totalDeductions - comparison.current.personalRelief)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                        {formatCurrency(comparison.new.totalDeductions - comparison.new.personalRelief)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={(comparison.new.totalDeductions - comparison.new.personalRelief) > (comparison.current.totalDeductions - comparison.current.personalRelief) ? 'text-green-600' : 'text-red-600'}>
                          {formatDifference((comparison.new.totalDeductions - comparison.new.personalRelief) - (comparison.current.totalDeductions - comparison.current.personalRelief))}
                        </span>
                      </td>
                    </tr>
                    <tr className="bg-zinc-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                        Total Deductions
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                        {formatCurrency(comparison.current.totalDeductions)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                        {formatCurrency(comparison.new.totalDeductions)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                        <span className={comparison.new.totalDeductions > comparison.current.totalDeductions ? 'text-green-600' : 'text-red-600'}>
                          {formatDifference(comparison.new.totalDeductions - comparison.current.totalDeductions)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-zinc-200">
              <h3 className="text-lg font-medium text-zinc-900">Recommendations</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {comparison.difference.annualSavings > 0 ? (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="text-sm text-green-800">
                        <p className="font-medium mb-1">Favorable Situation:</p>
                        <p>The new family status would save you <strong>{formatCurrency(comparison.difference.annualSavings)}</strong> annually in taxes.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">Neutral or Negative Impact:</p>
                        <p>The new status does not provide significant tax benefits compared to your current status.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Key Points:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Personal Relief: 2,400 KES/month for all taxpayers</li>
                        <li>• Insurance Relief: Up to 5,000 KES/month (15% of SHIF contributions)</li>
                        <li>• NSSF: 6% of gross salary, capped at 2,160 KES/month</li>
                        <li>• Deductions reduce the taxable PAYE base</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}