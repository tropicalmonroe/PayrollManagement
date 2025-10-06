import { PDFGenerator, formatCurrency, formatDate } from '../pdfGenerator';

export interface PayslipData {
  employee: {
    employeeId: string;
    lastName: string;
    firstName: string;
    position: string;
    hireDate: Date | string;
    seniority: number;
    maritalStatus: string;
    idNumber: string;
    nssfNumber: string;
  };
  payroll: {
    month: number;
    year: string;
    baseSalary: number;
    housingAllowance: number;
    mealAllowance: number;
    transportAllowance: number;
    representationAllowance: number;
    overtimePay: number;
    bonuses: number;
    otherEarnings: number;
    grossSalary: number;
    nssfEmployee: number;
    shif: number;
    housingLevyEmployee: number;
    paye: number;
    personalRelief: number;
    helb: number;
    otherDeductions: number;
    totalDeductions: number;
    netSalary: number;
    nssfEmployer: number;
    housingLevyEmployer: number;
    totalEmployerContributions: number;
  };
}

export async function generatePayslipPDF(data: PayslipData): Promise<Buffer> {
  const pdf = new PDFGenerator();
  
  // Header
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const monthName = monthNames[data.payroll.month - 1];
  const title = 'PAYSLIP';
  const subtitle = `${monthName} ${data.payroll.year}`;
  
  pdf.addHeader(title, subtitle);

  // Employee Information Section
  pdf.addSectionTitle('EMPLOYEE INFORMATION');
  
  pdf.addKeyValue('Employee ID', data.employee.employeeId,{ tracking: -0.5 });
  pdf.addSpace(5);
  pdf.addKeyValue('Full Name', `${data.employee.firstName} ${data.employee.lastName}`, { tracking: -0.5 });
  pdf.addSpace(5);
  pdf.addKeyValue('Position', data.employee.position, { tracking: -0.5 });
  pdf.addSpace(5);
  pdf.addKeyValue('Hire Date', formatDate(data.employee.hireDate), { tracking: -0.5 });
  pdf.addSpace(5);
  pdf.addKeyValue('Seniority', `${data.employee.seniority} years`, { tracking: -0.5 });
  pdf.addSpace(5);
  pdf.addKeyValue('Marital Status', data.employee.maritalStatus, { tracking: -0.5 });
  pdf.addSpace(5);
  pdf.addKeyValue('ID Number', data.employee.idNumber, { tracking: -0.5 });
  pdf.addSpace(5);
  pdf.addKeyValue('NSSF Number', data.employee.nssfNumber, { tracking: -0.5 });

  pdf.addSpace(10);

  // Earnings Section
  pdf.addSectionTitle('EARNINGS AND ALLOWANCES');
  
  const earningsHeaders = ['Description', 'Amount (KES)'];
  const earningsRows: (string | number)[][] = [
    ['Base Salary', formatCurrency(data.payroll.baseSalary)],
    ['Housing Allowance', formatCurrency(data.payroll.housingAllowance)],
    ['Meal Allowance', formatCurrency(data.payroll.mealAllowance)],
    ['Transport Allowance', formatCurrency(data.payroll.transportAllowance)],
    ['Representation Allowance', formatCurrency(data.payroll.representationAllowance)]
  ];

  if (data.payroll.overtimePay > 0) {
    earningsRows.push(['Overtime Pay', formatCurrency(data.payroll.overtimePay)]);
  }
  
  if (data.payroll.bonuses > 0) {
    earningsRows.push(['Bonuses', formatCurrency(data.payroll.bonuses)]);
  }
  
  if (data.payroll.otherEarnings > 0) {
    earningsRows.push(['Other Earnings', formatCurrency(data.payroll.otherEarnings)]);
  }

  pdf.addTable(earningsHeaders, earningsRows, {
    alternateRowColor: '#f8fafc'
  });

  pdf.addSpace(5);

  // Deductions Section
  pdf.addSectionTitle('DEDUCTIONS AND CONTRIBUTIONS');
  
  const deductionsHeaders = ['Description', 'Amount (KES)'];
  const deductionsRows: (string | number)[][] = [
    ['NSSF Employee', formatCurrency(data.payroll.nssfEmployee)],
    ['SHIF', formatCurrency(data.payroll.shif)],
    ['Housing Levy Employee', formatCurrency(data.payroll.housingLevyEmployee)],
    ['PAYE', formatCurrency(data.payroll.paye)],
    ['Personal Relief', formatCurrency(data.payroll.personalRelief)]
  ];

  if (data.payroll.helb > 0) {
    deductionsRows.push(['HELB Loan', formatCurrency(data.payroll.helb)]);
  }
  
  if (data.payroll.otherDeductions > 0) {
    deductionsRows.push(['Other Deductions', formatCurrency(data.payroll.otherDeductions)]);
  }

  pdf.addTable(deductionsHeaders, deductionsRows, {
    alternateRowColor: '#f8fafc'
  });

  pdf.addSpace(10);

  // Summary Section
  pdf.addSummaryBox('SUMMARY', [
    { label: 'Total Earnings', value: formatCurrency(data.payroll.grossSalary) },
    { label: 'Total Deductions', value: formatCurrency(data.payroll.totalDeductions) },
    { label: 'Net Salary Payable', value: formatCurrency(data.payroll.netSalary), highlight: true }
  ]);

  pdf.addSpace(10);

  // Employer Contributions Section
  pdf.addSectionTitle('EMPLOYER CONTRIBUTIONS');
  
  const contributionsHeaders = ['Description', 'Amount (KES)'];
  const contributionsRows: (string | number)[][] = [
    ['NSSF Employer', formatCurrency(data.payroll.nssfEmployer)],
    ['Housing Levy Employer', formatCurrency(data.payroll.housingLevyEmployer)]
  ];

  pdf.addTable(contributionsHeaders, contributionsRows, {
    alternateRowColor: '#f8fafc'
  });

  pdf.addSpace(5);

  pdf.addSummaryBox('TOTAL EMPLOYER CONTRIBUTIONS', [
    { label: 'Total', value: formatCurrency(data.payroll.totalEmployerContributions), highlight: true }
  ]);

  pdf.addSpace(15);

  // Legal Notice
  pdf.addParagraph(
    'This payslip is issued in accordance with Kenyan legislation in force. ' +
    'It should be kept without time limitation.',
    { fontSize: 8, align: 'center', color: '#64748b' }
  );

  return pdf.getBuffer();
}