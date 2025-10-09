import { PDFGenerator, formatCurrency, formatDate } from '../pdfGenerator';

export interface FinalSettlementData {
  employee: {
    employeeId: string;
    idNumber: string;
    lastName: string;
    firstName: string;
    position: string;
    hireDate: Date | string;
    seniority: number;
  };
  settlement: {
    endDate: Date | string;
    departureReason: string;
    baseSalary: number;
    unusedLeave: number;
    severancePay: number;
    otherAllowances: number;
    deductions: number;
    totalAdvances: number;
    totalCredits: number;
    totalEarnings: number;
    totalDeductions: number;
    netBalance: number;
  };
  unpaidAdvances?: Array<{
    id: string;
    amount: number;
    advanceDate: Date | string;
    remainingBalance: number;
  }>;
  activeCredits?: Array<{
    id: string;
    amount: number;
    startDate: Date | string;
    remainingBalance: number;
  }>;
}

export async function generateFinalSettlementPDF(data: FinalSettlementData): Promise<Buffer> {
  const pdf = new PDFGenerator();
  
  // Header
  const title = 'FINAL SETTLEMENT';
  const subtitle = `End of contract - ${formatDate(data.settlement.endDate)}`;
  
  pdf.addHeader(title, subtitle);

  pdf.addSpace(15);

  // Employee Information Section
  pdf.addSectionTitle('EMPLOYEE INFORMATION');
  
  pdf.addKeyValue('Full Name', `${data.employee.firstName} ${data.employee.lastName}`);
  pdf.addKeyValue('Employee ID', data.employee.employeeId);
  pdf.addKeyValue('ID Number', data.employee.idNumber);
  pdf.addKeyValue('Position', data.employee.position);
  pdf.addKeyValue('Hire Date', formatDate(data.employee.hireDate));
  pdf.addKeyValue('Contract End Date', formatDate(data.settlement.endDate));
  pdf.addKeyValue('Seniority', `${data.employee.seniority} years`);
  pdf.addKeyValue('Departure Reason', data.settlement.departureReason);

  pdf.addSpace(15);

  // Earnings Section
  pdf.addSectionTitle('AMOUNTS PAYABLE');
  
  const earningsHeaders = ['Description', 'Amount (KES)'];
  const earningsRows: (string | number)[][] = [
    ['Base Salary (prorated)', formatCurrency(data.settlement.baseSalary)]
  ];

  if (data.settlement.unusedLeave > 0) {
    earningsRows.push(['Unused Leave Days', formatCurrency(data.settlement.unusedLeave)]);
  }
  
  if (data.settlement.severancePay > 0) {
    earningsRows.push(['Severance Pay', formatCurrency(data.settlement.severancePay)]);
  }
  
  if (data.settlement.otherAllowances > 0) {
    earningsRows.push(['Other Allowances', formatCurrency(data.settlement.otherAllowances)]);
  }

  pdf.addTable(earningsHeaders, earningsRows, {
    alternateRowColor: '#f8fafc'
  });

  pdf.addSpace(10);

  // Deductions Section
  pdf.addSectionTitle('AMOUNTS DEDUCTIBLE');
  
  const deductionsHeaders = ['Description', 'Amount (KES)'];
  const deductionsRows: (string | number)[][] = [];

  if (data.settlement.deductions > 0) {
    deductionsRows.push(['Various Deductions', formatCurrency(data.settlement.deductions)]);
  }
  
  if (data.settlement.totalAdvances > 0) {
    deductionsRows.push(['Total Unpaid Advances', formatCurrency(data.settlement.totalAdvances)]);
  }
  
  if (data.settlement.totalCredits > 0) {
    deductionsRows.push(['Total Active Credits', formatCurrency(data.settlement.totalCredits)]);
  }

  if (deductionsRows.length > 0) {
    pdf.addTable(deductionsHeaders, deductionsRows, {
      alternateRowColor: '#f8fafc'
    });
  } else {
    pdf.addParagraph('No deductions to be made', { fontSize: 10, color: '#64748b' });
  }

  pdf.addSpace(15);

  // Detailed breakdown of advances if any
  if (data.unpaidAdvances && data.unpaidAdvances.length > 0) {
    pdf.addSectionTitle('DETAIL OF UNPAID ADVANCES');
    
    const advancesHeaders = ['Advance Date', 'Initial Amount', 'Remaining Balance'];
    const advancesRows: (string | number)[][] = data.unpaidAdvances.map(advance => [
      formatDate(advance.advanceDate),
      formatCurrency(advance.amount),
      formatCurrency(advance.remainingBalance)
    ]);

    pdf.addTable(advancesHeaders, advancesRows, {
      alternateRowColor: '#f8fafc'
    });

    pdf.addSpace(10);
  }

  // Detailed breakdown of credits if any
  if (data.activeCredits && data.activeCredits.length > 0) {
    pdf.addSectionTitle('DETAIL OF ACTIVE CREDITS');
    
    const creditsHeaders = ['Start Date', 'Initial Amount', 'Remaining Balance'];
    const creditsRows: (string | number)[][] = data.activeCredits.map(credit => [
      formatDate(credit.startDate),
      formatCurrency(credit.amount),
      formatCurrency(credit.remainingBalance)
    ]);

    pdf.addTable(creditsHeaders, creditsRows, {
      alternateRowColor: '#f8fafc'
    });

    pdf.addSpace(10);
  }

  // Summary Section
  pdf.addSummaryBox('SETTLEMENT SUMMARY', [
    { label: 'Total Amounts Payable', value: formatCurrency(data.settlement.totalEarnings) },
    { label: 'Total Amounts Deductible', value: formatCurrency(data.settlement.totalDeductions) },
    { 
      label: data.settlement.netBalance >= 0 ? 'Net Balance Payable' : 'Net Balance Owed by Employee', 
      value: formatCurrency(Math.abs(data.settlement.netBalance)), 
      highlight: true 
    }
  ]);

  pdf.addSpace(20);

  // Legal text
  pdf.addParagraph(
    'This final settlement constitutes a definitive settlement between the parties. ' +
    'The employee acknowledges having received all amounts due under their employment contract.',
    { fontSize: 11 }
  );

  pdf.addSpace(15);

  // Signature section
  const currentDate = new Date();
  pdf.addParagraph(
    `Prepared in Nairobi, on ${formatDate(currentDate)}`,
    { fontSize: 11 }
  );

  pdf.addSpace(20);

  // Two column layout for signatures
  pdf.addParagraph(
    'EMPLOYER                                                    EMPLOYEE',
    { fontSize: 11 }
  );

  pdf.addSpace(30);

  pdf.addParagraph(
    '________________________                    ________________________',
    { fontSize: 11 }
  );

  pdf.addParagraph(
    'Signature and stamp                                        Signature preceded by',
    { fontSize: 9, color: '#64748b' }
  );

  pdf.addParagraph(
    '                                                                    "Read and approved"',
    { fontSize: 9, color: '#64748b' }
  );

  pdf.addSpace(20);

  // Legal notice
  pdf.addParagraph(
    'This document is prepared in two original copies, one for each party. ' +
    'It constitutes evidence between the parties and definitively closes the accounts.',
    { fontSize: 8, align: 'center', color: '#64748b' }
  );

  return pdf.getBuffer();
}