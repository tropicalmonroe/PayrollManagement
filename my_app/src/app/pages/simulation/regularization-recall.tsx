import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../layout';
import { TrendingUp, ArrowLeft, Download, RefreshCw, Info, Calendar, AlertCircle } from 'lucide-react';

//This is when an employer takes back (recalls) money already paid to an employee because of an overpayment or error in payroll.
//👉 Example: If payroll mistakenly paid you KSh 10,000 extra, HR may “recall” it in the next month’s salary.

export default function RegularizationRecall() {
  return (
    <>
      <Head>
        <title>Regularization / Recall - AD Capital Payroll</title>
        <meta name="description" content="Simulate salary regularizations and recalls" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <RegularizationRecallContent />
      </Layout>
    </>
  );
}

function RegularizationRecallContent() {
  const [operationType, setOperationType] = useState<string>('recall');
  const [currentGrossSalary, setCurrentGrossSalary] = useState<number>(20000); // Adjusted to KES
  const [newGrossSalary, setNewGrossSalary] = useState<number>(24000); // Adjusted to KES
  const [startDate, setStartDate] = useState<string>('2025-01-01');
  const [endDate, setEndDate] = useState<string>('2025-01-31');
  const [familyStatus, setFamilyStatus] = useState<string>('single');
  const [numberOfDependants, setNumberOfDependants] = useState<number>(0);
  const [professionalExpenses, setProfessionalExpenses] = useState<number>(0);
  const [otherDeductions, setOtherDeductions] = useState<number>(0);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    calculateRegularization();
  }, [operationType, currentGrossSalary, newGrossSalary, startDate, endDate, 
    familyStatus, numberOfDependants, professionalExpenses, otherDeductions]);

  const calculateSalary = (grossSalary: number) => {
    const taxableSalary = grossSalary - professionalExpenses;
    const nssfContribution = Math.min(grossSalary * 0.06, 2160); // NSSF: 6%, capped at 2,160 KES
    const shifContribution = 1500; // Approximated SHIF for 20,000–24,000 KES salary
    const insuranceRelief = Math.min(shifContribution * 0.15, 5000); // 15% of SHIF, capped at 5,000 KES
    
    let netTaxableSalary = taxableSalary - nssfContribution - shifContribution;
    
    // Kenyan personal relief
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
      netSalary
    };
  };

  const calculateRegularization = () => {
    setLoading(true);
    
    setTimeout(() => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const numberOfMonths = Math.max(1, Math.ceil(diffDays / 30));
      
      const currentCalculation = calculateSalary(currentGrossSalary);
      const newCalculation = calculateSalary(newGrossSalary);
      
      const monthlyDifference = {
        grossSalary: newCalculation.grossSalary - currentCalculation.grossSalary,
        contributions: newCalculation.totalContributions - currentCalculation.totalContributions,
        paye: newCalculation.paye - currentCalculation.paye,
        netSalary: newCalculation.netSalary - currentCalculation.netSalary
      };
      
      const totalRecall = {
        grossSalary: monthlyDifference.grossSalary * numberOfMonths,
        contributions: monthlyDifference.contributions * numberOfMonths,
        paye: monthlyDifference.paye * numberOfMonths,
        netSalary: monthlyDifference.netSalary * numberOfMonths
      };
      
      // Calculate adjustments
      const nssfAdjustment = totalRecall.contributions;
      const payeAdjustment = totalRecall.paye;
      
      setResults({
        numberOfMonths,
        currentCalculation,
        newCalculation,
        monthlyDifference,
        totalRecall,
        nssfAdjustment,
        payeAdjustment,
        netPayable: totalRecall.netSalary,
        totalDeductions: nssfAdjustment + payeAdjustment,
        employerCost: totalRecall.grossSalary + (totalRecall.contributions * 1.5) // Including employer NSSF contributions
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

  const formatDifference = (amount: number) => {
    const formatted = formatCurrency(Math.abs(amount));
    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  const resetForm = () => {
    setOperationType('recall');
    setCurrentGrossSalary(20000);
    setNewGrossSalary(24000);
    setStartDate('2025-01-01');
    setEndDate('2025-01-31');
    setFamilyStatus('single');
    setNumberOfDependants(0);
    setProfessionalExpenses(0);
    setOtherDeductions(0);
  };

  const getOperationLabel = () => {
    switch (operationType) {
      case 'recall': return 'Salary Recall';
      case 'regularization': return 'Tax Regularization';
      case 'retroactive adjustment': return 'Retroactive Adjustment';
      default: return 'Operation';
    }
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
            <h2 className="text-2xl font-bold text-gray-900">Regularization / Recall</h2>
            <p className="mt-1 text-sm text-gray-600">
              Calculate salary recalls and tax regularizations
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
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
              <Download className="h-4 w-4 mr-2" />
              Export Calculation
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operation Parameters */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Operation Parameters</h3>
          </div>
          <div className="p-6 space-y-6">
            {/* Operation Type */}
            <div>
              <label htmlFor="operationType" className="block text-sm font-medium text-gray-700 mb-2">
                Operation Type
              </label>
              <select
                id="operationType"
                value={operationType}
                onChange={(e) => setOperationType(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="recall">Salary Recall</option>
                <option value="regularization">Tax Regularization</option>
                <option value="retroactive adjustment">Retroactive Adjustment</option>
              </select>
            </div>

            {/* Period */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Salaries */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="currentGrossSalary" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Gross Salary (KES)
                </label>
                <input
                  type="number"
                  id="currentGrossSalary"
                  value={currentGrossSalary}
                  onChange={(e) => setCurrentGrossSalary(Number(e.target.value))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  min="0"
                  step="100"
                />
              </div>
              <div>
                <label htmlFor="newGrossSalary" className="block text-sm font-medium text-gray-700 mb-2">
                  New Gross Salary (KES)
                </label>
                <input
                  type="number"
                  id="newGrossSalary"
                  value={newGrossSalary}
                  onChange={(e) => setNewGrossSalary(Number(e.target.value))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  min="0"
                  step="100"
                />
              </div>
            </div>

            {/* Family Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="familyStatus" className="block text-sm font-medium text-gray-700 mb-2">
                  Family Status
                </label>
                <select
                  id="familyStatus"
                  value={familyStatus}
                  onChange={(e) => setFamilyStatus(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>
              <div>
                <label htmlFor="numberOfDependants" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Dependants
                </label>
                <input
                  type="number"
                  id="numberOfDependants"
                  value={numberOfDependants}
                  onChange={(e) => setNumberOfDependants(Number(e.target.value))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  min="0"
                  max="10"
                />
              </div>
            </div>

            {/* Deductions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="professionalExpenses" className="block text-sm font-medium text-gray-700 mb-2">
                  Professional Expenses (KES)
                </label>
                <input
                  type="number"
                  id="professionalExpenses"
                  value={professionalExpenses}
                  onChange={(e) => setProfessionalExpenses(Number(e.target.value))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  min="0"
                  step="50"
                />
              </div>
              <div>
                <label htmlFor="otherDeductions" className="block text-sm font-medium text-gray-700 mb-2">
                  Other Deductions (KES)
                </label>
                <input
                  type="number"
                  id="otherDeductions"
                  value={otherDeductions}
                  onChange={(e) => setOtherDeductions(Number(e.target.value))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  min="0"
                  step="50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Calculation Results */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Calculation Results</h3>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <p className="mt-2 text-sm text-gray-500">Calculating...</p>
              </div>
            ) : results ? (
              <div className="space-y-6">
                {/* Period Covered */}
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center mb-2">
                    <Calendar className="h-5 w-5 text-purple-600 mr-2" />
                    <h4 className="text-sm font-medium text-purple-800">Period Covered</h4>
                  </div>
                  <div className="text-sm text-purple-700">
                    <p>From {new Date(startDate).toLocaleDateString('en-KE')} to {new Date(endDate).toLocaleDateString('en-KE')}</p>
                    <p className="font-medium">Number of Months: {results.numberOfMonths}</p>
                  </div>
                </div>

                {/* Monthly Difference */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Monthly Difference</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-600">Gross Salary</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDifference(results.monthlyDifference.grossSalary)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-600">Contributions</span>
                      <span className="text-sm text-red-600">
                        {formatDifference(results.monthlyDifference.contributions)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-600">PAYE</span>
                      <span className="text-sm text-red-600">
                        {formatDifference(results.monthlyDifference.paye)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-gray-200">
                      <span className="text-sm font-medium text-gray-700">Monthly Net</span>
                      <span className="text-sm font-semibold text-green-600">
                        {formatDifference(results.monthlyDifference.netSalary)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total Recall */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Total Recall for the Period</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-600">Gross Recall</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(results.totalRecall.grossSalary)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-600">NSSF Adjustment</span>
                      <span className="text-sm text-red-600">
                        -{formatCurrency(results.nssfAdjustment)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-600">PAYE Adjustment</span>
                      <span className="text-sm text-red-600">
                        -{formatCurrency(results.payeAdjustment)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 bg-green-50 px-4 rounded-lg border border-green-200">
                      <span className="text-lg font-semibold text-green-800">Net Payable</span>
                      <span className="text-xl font-bold text-green-800">
                        {formatCurrency(results.netPayable)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Employer Cost */}
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
                    <h4 className="text-sm font-medium text-orange-800">Employer Cost</h4>
                  </div>
                  <div className="text-sm text-orange-700">
                    <div className="flex justify-between">
                      <span>Estimated Total Cost:</span>
                      <span className="font-medium">{formatCurrency(results.employerCost)}</span>
                    </div>
                    <p className="text-xs mt-1">Including estimated employer contributions</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500">
                  Configure the parameters to view results
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calculation Details */}
      {results && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Calculation Details</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Calculation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      New Calculation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monthly Difference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Recall
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Gross Salary
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(results.currentCalculation.grossSalary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(results.newCalculation.grossSalary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatDifference(results.monthlyDifference.grossSalary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(results.totalRecall.grossSalary)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Social Contributions
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(results.currentCalculation.totalContributions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(results.newCalculation.totalContributions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {formatDifference(results.monthlyDifference.contributions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {formatCurrency(results.totalRecall.contributions)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      PAYE
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(results.currentCalculation.paye)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(results.newCalculation.paye)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {formatDifference(results.monthlyDifference.paye)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {formatCurrency(results.totalRecall.paye)}
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      Net Salary
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(results.currentCalculation.netSalary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(results.newCalculation.netSalary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      {formatDifference(results.monthlyDifference.netSalary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      {formatCurrency(results.totalRecall.netSalary)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Important Information */}
      {results && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Important Information</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Legal Obligations:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Salary recalls are subject to social contributions</li>
                      <li>• PAYE must be regularized for the period</li>
                      <li>• Employer contributions also apply</li>
                      <li>• Statute of limitations: 4 years for recalls</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Points of Attention:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Verify NSSF caps for each month</li>
                      <li>• Check applicable PAYE rates</li>
                      <li>• Document the reasons for the recall</li>
                      <li>• Plan for the cash flow impact</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}