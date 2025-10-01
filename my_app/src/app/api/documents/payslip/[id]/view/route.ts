import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Retrieve the document
    const document = await prisma.document.findUnique({
      where: { id: id as string },
      include: {
        employee: true
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Retrieve the associated payroll calculation
    const metadata = document.metadata as any;
    const payrollCalculation = await prisma.payrollCalculation.findUnique({
      where: { id: metadata?.payrollCalculationId },
      include: {
        employee: true
      }
    });

    if (!payrollCalculation) {
      return NextResponse.json({ error: 'Payroll calculation not found' }, { status: 404 });
    }

    // Generate the payslip HTML
    const html = generatePayslipHTML(document, payrollCalculation);

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generating payslip view:', error);
    return NextResponse.json({ error: 'Error generating payslip' }, { status: 500 });
  }
}

function generatePayslipHTML(document: any, payrollCalculation: any) {
  const employee = payrollCalculation.employee;
  const [monthName, year] = document.period.split(' ');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date))
  }

  const getMaritalStatus = () => {
    switch (employee.maritalStatus) {
      case 'SINGLE': return 'Single'
      case 'MARRIED': return 'Married'
      case 'DIVORCED': return 'Divorced'
      case 'WIDOWED': return 'Widowed'
      default: return employee.maritalStatus
    }
  }

  // Calculate Kenyan statutory rates
  const nssfRate = 6.00; // 6%
  const shifRate = 2.75; // 2.75%
  const housingLevyRate = 1.50; // 1.5%

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payslip - ${employee.firstName} ${employee.lastName}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: white;
            font-size: 12px;
        }
        .payroll-slip {
            background: white;
            padding: 32px;
            max-width: 1024px;
            margin: 0 auto;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .underline { text-decoration: underline; }
        .mb-6 { margin-bottom: 24px; }
        .mb-3 { margin-bottom: 12px; }
        .text-lg { font-size: 18px; }
        .text-base { font-size: 16px; }
        .text-xs { font-size: 12px; }
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .grid-cols-6 { grid-template-columns: repeat(6, minmax(0, 1fr)); }
        .gap-8 { gap: 32px; }
        .space-y-1 > * + * { margin-top: 4px; }
        .border-2 { border-width: 2px; }
        .border { border-width: 1px; }
        .border-b-2 { border-bottom-width: 2px; }
        .border-b { border-bottom-width: 1px; }
        .border-r { border-right-width: 1px; }
        .border-black { border-color: black; }
        .bg-zinc-100 { background-color: #f3f4f6; }
        .p-1 { padding: 4px; }
        .p-2 { padding: 8px; }
        .w-32 { width: 128px; }
        .mr-4 { margin-right: 16px; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .items-start { align-items: flex-start; }
        .flex-1 { flex: 1; }
        
        /* Improve table line visibility */
        .grid.border-2 { border: 2px solid #000 !important; }
        .border-black { border-color: #000 !important; }
        .border-r { border-right: 1px solid #000 !important; }
        .border-b { border-bottom: 1px solid #000 !important; }
        .border-b-2 { border-bottom: 2px solid #000 !important; }
        
        @media print {
            body { padding: 16px; }
            .payroll-slip { padding: 16px; }
            .border-black { border-color: #000 !important; }
            .border-r { border-right: 1px solid #000 !important; }
            .border-b { border-bottom: 1px solid #000 !important; }
            .border-b-2 { border-bottom: 2px solid #000 !important; }
        }
    </style>
</head>
<body>
    <div class="payroll-slip">
        <!-- Header with logo -->
        <div class="mb-6">
            <div class="mb-4">
                <img src="/image001.png" alt="Company Logo" style="max-width: 150px; height: auto;" />
            </div>
            <div class="text-center">
                <h1 class="text-lg font-bold underline">
                    Payslip for ${monthName.toUpperCase()} ${year}
                </h1>
            </div>
        </div>

        <!-- Employee information -->
        <div class="mb-6">
            <h2 class="text-base font-bold mb-3">${employee.firstName} ${employee.lastName}</h2>
            
            <div class="grid grid-cols-2 gap-8 text-xs">
                <div class="space-y-1">
                    <div class="flex">
                        <span class="w-32">Position</span>
                        <span class="mr-4">:</span>
                        <span>${employee.position}</span>
                    </div>
                    <div class="flex">
                        <span class="w-32">Date of Birth</span>
                        <span class="mr-4">:</span>
                        <span>${employee.dateOfBirth ? formatDate(employee.dateOfBirth) : 'Not provided'}</span>
                    </div>
                    <div class="flex">
                        <span class="w-32">Hire Date</span>
                        <span class="mr-4">:</span>
                        <span>${formatDate(employee.hireDate)}</span>
                    </div>
                </div>
                
                <div class="space-y-1">
                    <div class="flex">
                        <span class="w-32">Employee ID</span>
                        <span class="mr-4">:</span>
                        <span>${employee.employeeId}</span>
                    </div>
                    <div class="flex">
                        <span class="w-32">Marital Status</span>
                        <span class="mr-4">:</span>
                        <span>${getMaritalStatus()}</span>
                    </div>
                    <div class="flex">
                        <span class="w-32">Bank Account</span>
                        <span class="mr-4">:</span>
                        <span>${employee.bankAccount || 'Not provided'}</span>
                    </div>
                    <div class="flex">
                        <span class="w-32">ID Number</span>
                        <span class="mr-4">:</span>
                        <span>${employee.idNumber || 'Not provided'}</span>
                    </div>
                    <div class="flex">
                        <span class="w-32">NSSF Number</span>
                        <span class="mr-4">:</span>
                        <span>${employee.nssfNumber || 'Not provided'}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Payroll table -->
        <div class="border-2 border-black text-xs">
            <!-- Table header -->
            <div class="grid grid-cols-6 border-b-2 border-black bg-zinc-100 font-bold">
                <div class="border-r border-black p-1 text-center">Item</div>
                <div class="border-r border-black p-1 text-center">Days</div>
                <div class="border-r border-black p-1 text-center">Base</div>
                <div class="border-r border-black p-1 text-center">Rate</div>
                <div class="border-r border-black p-1 text-center">Earnings</div>
                <div class="p-1 text-center">Deductions</div>
            </div>

            <!-- Earnings lines -->
            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1">Base Salary</div>
                <div class="border-r border-black p-1 text-center">${employee.numberOfDaysPerMonth}</div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.baseSalary)}</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.baseSalary)}</div>
                <div class="p-1"></div>
            </div>

            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1">Housing Allowance</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.housingAllowance)}</div>
                <div class="p-1"></div>
            </div>

            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1">Transport Allowance</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.transportAllowance)}</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.transportAllowance)}</div>
                <div class="p-1"></div>
            </div>

            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1">Meal Allowance</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.mealAllowance)}</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.mealAllowance)}</div>
                <div class="p-1"></div>
            </div>

            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1">Representation Allowance</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.representationAllowance)}</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.representationAllowance)}</div>
                <div class="p-1"></div>
            </div>

            <!-- Empty line -->
            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="p-1"></div>
            </div>

            <!-- Gross salary -->
            <div class="grid grid-cols-6 border-b border-black font-bold">
                <div class="border-r border-black p-1">Gross Salary</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.grossSalary)}</div>
                <div class="p-1"></div>
            </div>

            <!-- Taxable gross salary -->
            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1">Taxable Gross Salary</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.taxableGrossSalary)}</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="p-1"></div>
            </div>

            <!-- Statutory deductions -->
            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1">NSSF Employee Contribution</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(Math.min(payrollCalculation.taxableGrossSalary, 72000))}</div>
                <div class="border-r border-black p-1 text-center">${nssfRate.toFixed(2)}%</div>
                <div class="border-r border-black p-1"></div>
                <div class="p-1 text-right">${formatCurrency(payrollCalculation.nssfEmployee)}</div>
            </div>

            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1">SHIF Contribution</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.taxableGrossSalary)}</div>
                <div class="border-r border-black p-1 text-center">${shifRate.toFixed(2)}%</div>
                <div class="border-r border-black p-1"></div>
                <div class="p-1 text-right">${formatCurrency(payrollCalculation.shif)}</div>
            </div>

            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1">Housing Levy Employee</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.taxableGrossSalary)}</div>
                <div class="border-r border-black p-1 text-center">${housingLevyRate.toFixed(2)}%</div>
                <div class="border-r border-black p-1"></div>
                <div class="p-1 text-right">${formatCurrency(payrollCalculation.housingLevyEmployee)}</div>
            </div>

            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1">PAYE (Income Tax)</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.taxableIncome)}</div>
                <div class="border-r border-black p-1 text-center">Progressive</div>
                <div class="border-r border-black p-1"></div>
                <div class="p-1 text-right">${formatCurrency(payrollCalculation.paye)}</div>
            </div>

            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1">Personal Relief</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-center">Fixed</div>
                <div class="border-r border-black p-1"></div>
                <div class="p-1 text-right">-${formatCurrency(payrollCalculation.personalRelief)}</div>
            </div>

            ${payrollCalculation.helb > 0 ? `
            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1">HELB Loan Repayment</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="p-1 text-right">${formatCurrency(payrollCalculation.helb)}</div>
            </div>
            ` : ''}

            <!-- Empty line -->
            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="p-1"></div>
            </div>

            <!-- Totals -->
            <div class="grid grid-cols-6 border-b-2 border-black font-bold">
                <div class="border-r border-black p-1">Totals</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.grossSalary)}</div>
                <div class="p-1 text-right">${formatCurrency(payrollCalculation.totalDeductions)}</div>
            </div>

            <!-- Empty line -->
            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="p-1"></div>
            </div>

            <!-- Net pay -->
            <div class="grid grid-cols-6 font-bold text-base">
                <div class="border-r border-black p-2">Net Pay</div>
                <div class="border-r border-black p-2"></div>
                <div class="border-r border-black p-2"></div>
                <div class="border-r border-black p-2"></div>
                <div class="border-r border-black p-2 text-right">${formatCurrency(payrollCalculation.netSalary)}</div>
                <div class="p-2"></div>
            </div>
        </div>
    </div>
</body>
</html>
`;
}