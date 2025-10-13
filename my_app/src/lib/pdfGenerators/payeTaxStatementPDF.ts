import { PDFGenerator, formatCurrency, formatDate } from '../pdfGenerator';

export interface PAYETaxEmployeeData {
employeeId: string;
lastName: string;
firstName: string;
idNumber: string;
nssfNumber: string;
position: string;
baseSalary: number;
grossSalary: number;
taxableIncome: number;
paye: number;
personalRelief: number;
netTaxPayable: number;
nssfEmployee: number;
housingLevyEmployee: number;
otherDeductions: number;
}

export interface PAYETaxStatementData {
period: {
    month: number;
    year: string;
    displayName: string;
};
employees: PAYETaxEmployeeData[];
summary: {
    totalEmployees: number;
    totalGrossSalary: number;
    totalTaxableIncome: number;
    totalPAYE: number;
    totalPersonalRelief: number;
    totalNetTaxPayable: number;
};
}

export async function generatePAYETaxStatementPDF(data: PAYETaxStatementData): Promise<Buffer> {
const pdf = new PDFGenerator();

// Header
pdf.addHeader(
    'PAYE TAX STATEMENT', 
    `Period: ${data.period.displayName}`
);

pdf.addSpace(10);

// Summary Section
pdf.addSectionTitle('SUMMARY');

const summaryHeaders = ['Description', 'Amount (KES)'];
const summaryRows = [
    ['Total Employees', data.summary.totalEmployees.toString()],
    ['Total Gross Salary', formatCurrency(data.summary.totalGrossSalary)],
    ['Total Taxable Income', formatCurrency(data.summary.totalTaxableIncome)],
    ['Total PAYE Tax', formatCurrency(data.summary.totalPAYE)],
    ['Total Personal Relief', formatCurrency(data.summary.totalPersonalRelief)],
    ['Total Net Tax Payable', formatCurrency(data.summary.totalNetTaxPayable)]
];

pdf.addTable(summaryHeaders, summaryRows, {
    alternateRowColor: '#f8fafc'
});

pdf.addSpace(15);

// Detailed Employee Breakdown
pdf.addSectionTitle('EMPLOYEE TAX DETAILS');

const employeeHeaders = [
    'Employee ID',
    'Name',
    'ID Number',
    'Position',
    'Gross Salary',
    'Taxable Income',
    'PAYE Tax',
    'Personal Relief',
    'Net Tax Payable'
];

const employeeRows = data.employees.map(employee => [
    employee.employeeId,
    `${employee.firstName} ${employee.lastName}`,
    employee.idNumber,
    employee.position,
    formatCurrency(employee.grossSalary),
    formatCurrency(employee.taxableIncome),
    formatCurrency(employee.paye),
    formatCurrency(employee.personalRelief),
    formatCurrency(employee.netTaxPayable)
]);

pdf.addTable(employeeHeaders, employeeRows, {
    alternateRowColor: '#f8fafc',
    fontSize: 7
});

pdf.addSpace(20);

// Legal and Compliance Information
pdf.addSectionTitle('COMPLIANCE INFORMATION');

pdf.addParagraph(
    'This PAYE Tax Statement is generated in accordance with the Kenya Revenue Authority (KRA) regulations ' +
    'and the Income Tax Act, Cap 470 of the Laws of Kenya.',
    { fontSize: 10 }
);

pdf.addSpace(5);

pdf.addParagraph(
    'The statement includes all statutory deductions as required by law, including:' +
    '\n• Pay As You Earn (PAYE) Income Tax' +
    '\n• Personal Relief allowances' +
    '\n• Other statutory and voluntary deductions',
    { fontSize: 10 }
);

pdf.addSpace(15);

// Declaration
pdf.addParagraph(
    'DECLARATION',
    { fontSize: 11, fontWeight: 'bold', align: 'center' } as any
);

pdf.addSpace(5);

pdf.addParagraph(
    'I hereby declare that the information contained in this statement is true and correct ' +
    'to the best of my knowledge and belief, and has been prepared in accordance with the ' +
    'provisions of the Income Tax Act.',
    { fontSize: 10, align: 'center' }
);

pdf.addSpace(20);

// Signature section
const currentDate = new Date();
pdf.addParagraph(
    `Generated in Nairobi, on ${formatDate(currentDate)}`,
    { fontSize: 10, align: 'center' }
);

pdf.addSpace(25);

pdf.addParagraph(
    '________________________',
    { fontSize: 10, align: 'center' }
);

pdf.addParagraph(
    'Authorized Signatory',
    { fontSize: 9, align: 'center', color: '#64748b' }
);

pdf.addParagraph(
    'Finance Department',
    { fontSize: 9, align: 'center', color: '#64748b' }
);

pdf.addParagraph(
    'NewLight Academy',
    { fontSize: 9, align: 'center', color: '#64748b' }
);

pdf.addSpace(20);

// Footer note
pdf.addParagraph(
    'This document is computer-generated and does not require a physical signature.',
    { fontSize: 8, align: 'center', color: '#94a3b8' }
);

return pdf.getBuffer();
}