import { PDFGenerator, formatCurrency, formatDate } from '../pdfGenerator';

export interface SalaryCertificateData {
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
    baseSalary: number;
    transportAllowance: number;
    representationAllowance: number;
    housingAllowance: number;
  };
  certificate: {
    certificateType: string;
    startDate: Date | string;
    endDate: Date | string;
    reason?: string;
    averageGrossSalary: number;
    averageNetSalary: number;
    calculatedMonths: number;
  };
}

export async function generateSalaryCertificatePDF(data: SalaryCertificateData): Promise<Buffer> {
  try {
    // Validate input data
    const requiredEmployeeFields: (keyof SalaryCertificateData['employee'])[] = [
      'employeeId', 'lastName', 'firstName', 'position', 'hireDate', 'seniority', 'baseSalary',
      'transportAllowance', 'representationAllowance', 'housingAllowance'
    ];
    const requiredCertificateFields: (keyof SalaryCertificateData['certificate'])[] = [
      'certificateType', 'startDate', 'endDate', 'averageGrossSalary', 'averageNetSalary', 'calculatedMonths'
    ];

    const missingEmployeeFields = requiredEmployeeFields.filter(field => data.employee[field] === undefined || data.employee[field] === null);
    const missingCertificateFields = requiredCertificateFields.filter(field => data.certificate[field] === undefined || data.certificate[field] === null);

    if (missingEmployeeFields.length > 0 || missingCertificateFields.length > 0) {
      throw new Error(`Missing required fields: Employee(${missingEmployeeFields.join(', ')}), Certificate(${missingCertificateFields.join(', ')})`);
    }

    const pdf = new PDFGenerator();
    
    const title = 'SALARY CERTIFICATE';
    const subtitle = data.certificate.certificateType === 'INCOME' ? 'Income Certificate' : 'Attendance Certificate';
    
    pdf.addHeader(title, subtitle);
    pdf.addSpace(20);

    pdf.addParagraph(
      'I, the undersigned, legal representative of NewLight Academy, hereby certify that:',
      { fontSize: 12 }
    );
    pdf.addSpace(15);

    pdf.addSectionTitle('EMPLOYEE INFORMATION');
    pdf.addKeyValue('Full Name', `${data.employee.firstName} ${data.employee.lastName}`);
    pdf.addKeyValue('Employee ID', data.employee.employeeId);
    pdf.addKeyValue('Position', data.employee.position);
    pdf.addKeyValue('Hire Date', formatDate(data.employee.hireDate));
    pdf.addKeyValue('Seniority', `${data.employee.seniority} years`);
    pdf.addKeyValue('Marital Status', data.employee.maritalStatus || 'N/A');
    pdf.addKeyValue('ID Number', data.employee.idNumber || 'N/A');
    pdf.addKeyValue('NSSF Number', data.employee.nssfNumber || 'N/A');
    pdf.addSpace(15);

    pdf.addSectionTitle('PERIOD CONCERNED');
    pdf.addKeyValue('Start Date', formatDate(data.certificate.startDate));
    pdf.addKeyValue('End Date', formatDate(data.certificate.endDate));
    pdf.addKeyValue('Number of months calculated', data.certificate.calculatedMonths.toString());
    if (data.certificate.reason) {
      pdf.addKeyValue('Reason', data.certificate.reason);
    }
    pdf.addSpace(15);

    if (data.certificate.certificateType === 'INCOME') {
      pdf.addSectionTitle('SALARY INFORMATION');
      pdf.addParagraph('Current salary composition:', { fontSize: 11 });
      pdf.addSpace(5);

      const salaryHeaders = ['Component', 'Amount (KES)'];
      const salaryRows: (string | number)[][] = [
        ['Base Salary', formatCurrency(data.employee.baseSalary)],
        ['Transport Allowance', formatCurrency(data.employee.transportAllowance)],
        ['Representation Allowance', formatCurrency(data.employee.representationAllowance)],
        ['Housing Allowance', formatCurrency(data.employee.housingAllowance)]
      ];

      pdf.addTable(salaryHeaders, salaryRows, {
        alternateRowColor: '#f8fafc'
      });
      pdf.addSpace(10);

      pdf.addSummaryBox('AVERAGE SALARY OVER THE PERIOD', [
        { label: 'Average gross salary', value: formatCurrency(data.certificate.averageGrossSalary) },
        { label: 'Average net salary', value: formatCurrency(data.certificate.averageNetSalary), highlight: true }
      ]);
    } else {
      pdf.addSectionTitle('ATTENDANCE INFORMATION');
      pdf.addParagraph(
        `${data.employee.firstName} ${data.employee.lastName} has been diligently performing their duties during the specified period.`,
        { fontSize: 11 }
      );
    }

    pdf.addSpace(20);
    pdf.addParagraph(
      'This certificate is issued to the concerned party to serve and be valid as needed.',
      { fontSize: 11 }
    );
    pdf.addSpace(15);

    const currentDate = new Date();
    pdf.addParagraph(
      `Done at Nairobi, on ${formatDate(currentDate)}`,
      { fontSize: 11, align: 'right' }
    );
    pdf.addSpace(30);
    pdf.addParagraph(
      'Legal Representative',
      { fontSize: 11, align: 'right' }
    );
    pdf.addSpace(20);
    pdf.addParagraph(
      '________________________',
      { fontSize: 11, align: 'right' }
    );
    pdf.addParagraph(
      'Signature and stamp',
      { fontSize: 9, align: 'right', color: '#64748b' }
    );
    pdf.addSpace(20);
    pdf.addParagraph(
      'This certificate is issued in accordance with Kenyan legislation in force. ' +
      'It cannot be used for purposes other than those for which it was requested.',
      { fontSize: 8, align: 'center', color: '#64748b' }
    );

    const pdfBuffer = await pdf.getBuffer();
    return pdfBuffer;
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}