import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Layout } from '../../layout';
import { Home, ArrowLeft, Download, RefreshCw, Info, Calculator, TrendingUp } from 'lucide-react';

export default function HousingCredit() {
  return (
    <>
      <Head>
        <title>Housing Loan - AD Capital Payroll</title>
        <meta name="description" content="Calculate the impact of housing loans on payroll" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <HousingCreditContent />
      </Layout>
    </>
  );
}

// Got it 👍 — let’s make it very simple with your gross salary = KSh 50,000.
// 1. Gross salary = 50,000
// 2. PAYE (income tax) is calculated on that salary.
//3. If you pay, say, KSh 10,000 insurance premium in a month:
//Insurance relief = 15% × 10,000 = KSh 1,500
//But the max allowed is 5,000, so you’re within limit.
//4. That 1,500 is subtracted from your PAYE tax, not from your salary directly.
//👉 Meaning: your tax reduces, so your net (take-home) pay increases by 1,500.


function HousingCreditContent() {
  const [grossSalary, setGrossSalary] = useState<number>(30000); // Adjusted to KES
  const [familyStatus, setFamilyStatus] = useState<string>('married');
  const [numberOfDependants, setNumberOfDependants] = useState<number>(2);
  const [professionalExpenses, setProfessionalExpenses] = useState<number>(0);
  const [otherDeductions, setOtherDeductions] = useState<number>(0);
  const [loanAmount, setLoanAmount] = useState<number>(5000000); // Adjusted to KES
  const [loanTerm, setLoanTerm] = useState<number>(20); // in years
  const [interestRate, setInterestRate] = useState<number>(4.5);
  const [monthlyRepayment, setMonthlyRepayment] = useState<number>(31640); // Adjusted to KES
  const [housingType, setHousingType] = useState<string>('primary');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    calculateHousingCredit();
  }, 
  [grossSalary, familyStatus, numberOfDependants, professionalExpenses, 
    otherDeductions, loanAmount, loanTerm, interestRate, monthlyRepayment, housingType]);

  const calculateMonthlyRepayment = () => {
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    const repayment = (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -numberOfPayments));
    setMonthlyRepayment(Math.round(repayment));
  };

  const calculateSalary = (mortgageInterestRelief: number) => {
    const taxableSalary = grossSalary - professionalExpenses;
    const nssfContribution = Math.min(grossSalary * 0.06, 2160); // NSSF: 6%, capped at 2,160 KES
    const shifContribution = 1700; // Approximated SHIF for 30,000 KES salary
    const insuranceRelief = Math.min(shifContribution * 0.15, 5000); // 15% of SHIF, capped at 5,000 KES
    
    let netTaxableSalary = taxableSalary - nssfContribution - shifContribution;
    
    // Deductions: Kenyan personal relief (2,400 KES/month)
    const personalRelief = 2400;
    netTaxableSalary -= personalRelief + otherDeductions + mortgageInterestRelief;
    
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
      mortgageInterestRelief,
      totalDeductions: personalRelief + otherDeductions + mortgageInterestRelief,
      netTaxableSalary: Math.max(0, netTaxableSalary),
      paye: monthlyPaye,
      netSalary,
      taxRate: taxableSalary > 0 ? (monthlyPaye / taxableSalary) * 100 : 0
    };
  };

  const calculateHousingCredit = () => {
    setLoading(true);
    
    setTimeout(() => {
      // Calculate mortgage interest relief
      let monthlyRelief = 0;
      
      if (housingType === 'primary') {
        // For primary residence: mortgage interest relief up to 9,000 KES/month
        const monthlyInterest = (loanAmount * (interestRate / 100)) / 12;
        monthlyRelief = Math.min(monthlyInterest, 9000);
      }
      // No relief for affordable or secondary housing in Kenya
      
      const withoutLoan = calculateSalary(0);
      const withLoan = calculateSalary(monthlyRelief);
      
      const savings = {
        monthlyPaye: withoutLoan.paye - withLoan.paye,
        annualPaye: (withoutLoan.paye - withLoan.paye) * 12,
        monthlyNetSalary: withLoan.netSalary - withoutLoan.netSalary,
        annualNetSalary: (withLoan.netSalary - withoutLoan.netSalary) * 12
      };
      
      // Calculate actual loan cost
      const totalLoanCost = monthlyRepayment * loanTerm * 12;
      const totalInterest = totalLoanCost - loanAmount;
      const totalPayeSavings = savings.annualPaye * loanTerm;
      const actualCost = totalInterest - totalPayeSavings;
      
      // Calculate effective rate
      const effectiveRate = ((actualCost / loanAmount) / loanTerm) * 100;
      
      setResults({
        withoutLoan,
        withLoan,
        monthlyRelief,
        savings,
        monthlyRepayment,
        totalLoanCost,
        totalInterest,
        totalPayeSavings,
        actualCost,
        effectiveRate,
        repaymentCapacity: (withLoan.netSalary / monthlyRepayment) * 100,
        disposableIncome: withLoan.netSalary - monthlyRepayment
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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const resetForm = () => {
    setGrossSalary(30000);
    setFamilyStatus('married');
    setNumberOfDependants(2);
    setProfessionalExpenses(0);
    setOtherDeductions(0);
    setLoanAmount(5000000);
    setLoanTerm(20);
    setInterestRate(4.5);
    setMonthlyRepayment(31640);
    setHousingType('primary');
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
            <h2 className="text-2xl font-bold text-gray-900">Housing Loan Simulation</h2>
            <p className="mt-1 text-sm text-gray-600">
              Calculate the tax impact and savings from a housing loan
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
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700">
              <Download className="h-4 w-4 mr-2" />
              Export Simulation
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Employee Information</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label htmlFor="grossSalary" className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Gross Salary (KES)
              </label>
              <input
                type="number"
                id="grossSalary"
                value={grossSalary}
                onChange={(e) => setGrossSalary(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                min="0"
                step="100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="familyStatus" className="block text-sm font-medium text-gray-700 mb-2">
                  Family Status
                </label>
                <select
                  id="familyStatus"
                  value={familyStatus}
                  onChange={(e) => setFamilyStatus(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
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
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  min="0"
                  max="10"
                />
              </div>
            </div>

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
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
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
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  min="0"
                  step="50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Loan Parameters */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Loan Parameters</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label htmlFor="housingType" className="block text-sm font-medium text-gray-700 mb-2">
                Housing Type
              </label>
              <select
                id="housingType"
                value={housingType}
                onChange={(e) => setHousingType(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="primary">Primary Residence</option>
                <option value="affordable">Affordable Housing</option>
                <option value="secondary">Secondary Residence</option>
              </select>
            </div>

            <div>
              <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700 mb-2">
                Loan Amount (KES)
              </label>
              <input
                type="number"
                id="loanAmount"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                min="0"
                step="10000"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="loanTerm" className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Term (Years)
                </label>
                <input
                  type="number"
                  id="loanTerm"
                  value={loanTerm}
                  onChange={(e) => setLoanTerm(Number(e.target.value))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  min="1"
                  max="30"
                />
              </div>
              <div>
                <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-2">
                  Interest Rate (%)
                </label>
                <input
                  type="number"
                  id="interestRate"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  min="0"
                  max="15"
                  step="0.1"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="monthlyRepayment" className="block text-sm font-medium text-gray-700">
                  Monthly Repayment (KES)
                </label>
                <button
                  onClick={calculateMonthlyRepayment}
                  className="text-xs text-orange-600 hover:text-orange-800 font-medium"
                >
                  Calculate
                </button>
              </div>
              <input
                type="number"
                id="monthlyRepayment"
                value={monthlyRepayment}
                onChange={(e) => setMonthlyRepayment(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                min="0"
                step="10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <p className="mt-2 text-sm text-gray-500">Calculating impact...</p>
          </div>
        </div>
      ) : results ? (
        <div className="space-y-6">
          {/* Housing Loan Impact */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Housing Loan Impact</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(results.savings.monthlyPaye)}
                  </div>
                  <div className="text-sm text-gray-600">Monthly PAYE Savings</div>
                </div>

                <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-center mb-2">
                    <Calculator className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(results.savings.annualPaye)}
                  </div>
                  <div className="text-sm text-gray-600">Annual PAYE Savings</div>
                </div>

                <div className="text-center p-6 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-center mb-2">
                    <Home className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatPercentage(results.effectiveRate)}
                  </div>
                  <div className="text-sm text-gray-600">Effective Rate</div>
                </div>

                <div className="text-center p-6 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(results.disposableIncome)}
                  </div>
                  <div className="text-sm text-gray-600">Disposable Income</div>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison With/Without Loan */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Comparison With/Without Loan</h3>
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
                        Without Loan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        With Loan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Difference
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Gross Salary
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(results.withoutLoan.grossSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(results.withLoan.grossSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        -
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Mortgage Interest Relief
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        -{formatCurrency(results.monthlyRelief)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        +{formatCurrency(results.monthlyRelief)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Monthly PAYE
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(results.withoutLoan.paye)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(results.withLoan.paye)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        -{formatCurrency(results.savings.monthlyPaye)}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        Net Salary
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(results.withoutLoan.netSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(results.withLoan.netSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                        +{formatCurrency(results.savings.monthlyNetSalary)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Loan Financial Analysis */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Loan Financial Analysis</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700">Loan Costs</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Loan Amount</span>
                      <span className="text-sm font-medium">{formatCurrency(loanAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Loan Cost</span>
                      <span className="text-sm font-medium">{formatCurrency(results.totalLoanCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Interest</span>
                      <span className="text-sm text-red-600">{formatCurrency(results.totalInterest)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-medium text-gray-700">Actual Cost (After PAYE Savings)</span>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(results.actualCost)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700">Tax Savings</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Annual PAYE Savings</span>
                      <span className="text-sm font-medium text-green-600">{formatCurrency(results.savings.annualPaye)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total PAYE Savings</span>
                      <span className="text-sm font-medium text-green-600">{formatCurrency(results.totalPayeSavings)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Repayment Capacity</span>
                      <span className="text-sm font-medium">{formatPercentage(results.repaymentCapacity)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recommendations</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Tax Benefits:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Mortgage interest relief for primary residence</li>
                        <li>• Relief cap: 9,000 KES/month for primary residence</li>
                        <li>• Significant tax savings over the loan term</li>
                        <li>• Reduction in effective loan rate</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {results.repaymentCapacity < 33 && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">Warning:</p>
                        <p>The debt-to-income ratio exceeds 33%. Consider revising the loan parameters.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-green-800">
                      <p className="font-medium mb-1">Optimization:</p>
                      <p>With this housing loan, you save <strong>{formatCurrency(results.savings.annualPaye)}</strong> per year in taxes, with an effective rate of <strong>{formatPercentage(results.effectiveRate)}</strong>.</p>
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