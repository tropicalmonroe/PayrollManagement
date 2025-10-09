import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { DocumentType, DocumentStatus } from '@prisma/client';
import { generateSalaryCertificatePDF, SalaryCertificateData } from '../../../../../lib/pdfGenerators/salaryCertificatePDF';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Assuming the PDF is stored or can be regenerated
    // Replace this with actual logic to fetch or regenerate the PDF
    // You need to construct SalaryCertificateData from the document and related employee data
    const employee = await prisma.employee.findUnique({
      where: { id: document.employeeId || '' },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Extract metadata from the document
    const metadata: {
      certificateType: string, 
      startDate: string, 
      endDate: string, 
      reason: string, 
      averageGrossSalary: number, 
      averageNetSalary: number, 
      calculatedMonths: number
    } = document.metadata || {} as any;
    const certificateData: SalaryCertificateData = {
      employee: {
        employeeId: employee.employeeId,
        lastName: employee.lastName,
        firstName: employee.firstName,
        position: employee.position,
        hireDate: employee.hireDate,
        seniority: employee.seniority,
        maritalStatus: employee.maritalStatus || 'N/A',
        idNumber: employee.idNumber || 'N/A',
        nssfNumber: employee.nssfNumber || 'N/A',
        baseSalary: employee.baseSalary,
        transportAllowance: employee.transportAllowance,
        representationAllowance: employee.representationAllowance,
        housingAllowance: employee.housingAllowance,
      },
      certificate: {
        certificateType: metadata.certificateType || 'SALARY_CERTIFICATE',
        startDate: metadata.startDate ? new Date(metadata.startDate) : new Date(),
        endDate: metadata.endDate ? new Date(metadata.endDate) : new Date(),
        reason: metadata.reason || '',
        averageGrossSalary: metadata.averageGrossSalary || employee.baseSalary,
        averageNetSalary: metadata.averageNetSalary || employee.netSalary,
        calculatedMonths: metadata.calculatedMonths || 1,
      },
    };

    const pdfBuffer = await generateSalaryCertificatePDF(certificateData);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="salary-certificate-${document.id}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Error fetching document', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { employeeId, type, startDate, endDate, reason } = await req.json();
    console.log('Received payload:', { employeeId, type, startDate, endDate, reason });

    if (!employeeId || !type || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'employeeId, type, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    const certificateType = type === 'INCOME' || type === 'ATTENDANCE' ? type : 'SALARY_CERTIFICATE';

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const periodStart = new Date(startDate);
    const periodEnd = new Date(endDate);
    if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
      return NextResponse.json({ error: 'Invalid startDate or endDate' }, { status: 400 });
    }
    const period = `${periodStart.toLocaleDateString('en-US')} - ${periodEnd.toLocaleDateString('en-US')}`;

    const payrollCalculations = await prisma.payrollCalculation.findMany({
      where: {
        employeeId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    let totalGrossSalary = 0;
    let totalNetSalary = 0;
    const numberOfMonths = payrollCalculations.length;

    payrollCalculations.forEach((calc) => {
      totalGrossSalary += calc.grossSalary;
      totalNetSalary += calc.netSalary;
    });

    const averageGrossSalary = numberOfMonths > 0 ? totalGrossSalary / numberOfMonths : employee.baseSalary;
    const averageNetSalary = numberOfMonths > 0 ? totalNetSalary / numberOfMonths : employee.netSalary;

    if (numberOfMonths === 0) {
      console.warn(`No payroll calculations found for employee ${employeeId}. Falling back to baseSalary: ${employee.baseSalary}, netSalary: ${employee.netSalary}`);
    }

    const certificateData: SalaryCertificateData = {
      employee: {
        employeeId: employee.employeeId,
        lastName: employee.lastName,
        firstName: employee.firstName,
        position: employee.position,
        hireDate: employee.hireDate,
        seniority: employee.seniority,
        maritalStatus: employee.maritalStatus || 'N/A',
        idNumber: employee.idNumber || 'N/A',
        nssfNumber: employee.nssfNumber || 'N/A',
        baseSalary: employee.baseSalary,
        transportAllowance: employee.transportAllowance,
        representationAllowance: employee.representationAllowance,
        housingAllowance: employee.housingAllowance,
      },
      certificate: {
        certificateType,
        startDate: periodStart,
        endDate: periodEnd,
        reason: reason || '',
        averageGrossSalary,
        averageNetSalary,
        calculatedMonths: numberOfMonths,
      },
    };

    const pdfBuffer = await generateSalaryCertificatePDF(certificateData);

    await prisma.document.create({
      data: {
        type: DocumentType.SALARY_CERTIFICATE,
        title: `Salary Certificate - ${employee.firstName} ${employee.lastName}`,
        description: `${certificateType} certificate for period ${period}`,
        employeeId,
        period,
        generatedBy: 'system',
        fileSize: pdfBuffer.length,
        status: DocumentStatus.GENERATED,
        metadata: {
          certificateType,
          startDate,
          endDate,
          reason: reason || '',
          averageGrossSalary,
          averageNetSalary,
          calculatedMonths: numberOfMonths,
          hireDate: employee.hireDate,
          position: employee.position,
          seniority: employee.seniority,
        },
      },
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="salary-certificate-${employee.employeeId}-${certificateType}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Error generating salary certificate:', error);
    return NextResponse.json(
      { error: 'Error generating salary certificate', details: error.message },
      { status: 500 }
    );
  }
}

