// app/api/documents/paye-tax-statement/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { DocumentType, DocumentStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
try {
    const body = await request.json();
    const { employeeIds, period } = body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
    return NextResponse.json(
        { error: 'employeeIds array is required and must contain at least one employee' },
        { status: 400 }
    );
    }

    if (!period || !period.month || !period.year) {
    return NextResponse.json(
        { error: 'period with month and year is required' },
        { status: 400 }
    );
    }

    const month = period.month.toString();
    const year = period.year.toString();

    console.log('Generating PAYE tax statement for:', {
    employeeCount: employeeIds.length,
    month,
    year
    });

    // Fetch employees with their payroll calculations
    const employeesWithPayroll = await prisma.employee.findMany({
    where: {
        id: {
        in: employeeIds
        }
    },
    include: {
        payrollCalculations: {
        where: {
            month: month,
            year: year
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 1
        }
    }
    });

    if (employeesWithPayroll.length === 0) {
    return NextResponse.json(
        { error: 'No employees found with the specified IDs' },
        { status: 404 }
    );
    }

    // Check if we have payroll data
    const employeesWithData = employeesWithPayroll.filter(emp => emp.payrollCalculations.length > 0);
    
    if (employeesWithData.length === 0) {
    return NextResponse.json(
        { error: 'No payroll data found for the selected employees and period' },
        { status: 404 }
    );
    }

    console.log(`Found ${employeesWithData.length} employees with payroll data`);

    // Prepare data for PDF generation
    const taxStatementData = {
    period: {
        month: parseInt(month),
        year: year,
        displayName: `${getMonthName(parseInt(month))} ${year}`
    },
    employees: employeesWithData.map(employee => {
        const payroll = employee.payrollCalculations[0];
        
        return {
        employeeId: employee.employeeId,
        lastName: employee.lastName,
        firstName: employee.firstName,
        idNumber: employee.idNumber || 'N/A',
        nssfNumber: employee.nssfNumber || 'N/A',
        position: employee.position,
        baseSalary: payroll.baseSalary,
        grossSalary: payroll.grossSalary,
        taxableIncome: payroll.taxableIncome,
        paye: payroll.paye,
        personalRelief: payroll.personalRelief,
        netTaxPayable: Math.max(0, payroll.paye - payroll.personalRelief),
        nssfEmployee: payroll.nssfEmployee,
        housingLevyEmployee: payroll.housingLevyEmployee,
        otherDeductions: payroll.otherDeductions
        };
    }),
    summary: {
        totalEmployees: employeesWithData.length,
        totalGrossSalary: employeesWithData.reduce((sum, emp) => sum + emp.payrollCalculations[0].grossSalary, 0),
        totalTaxableIncome: employeesWithData.reduce((sum, emp) => sum + emp.payrollCalculations[0].taxableIncome, 0),
        totalPAYE: employeesWithData.reduce((sum, emp) => sum + emp.payrollCalculations[0].paye, 0),
        totalPersonalRelief: employeesWithData.reduce((sum, emp) => sum + emp.payrollCalculations[0].personalRelief, 0),
        totalNetTaxPayable: employeesWithData.reduce((sum, emp) => {
        const paye = emp.payrollCalculations[0].paye;
        const relief = emp.payrollCalculations[0].personalRelief;
        return sum + Math.max(0, paye - relief);
        }, 0)
    }
    };

    console.log('Tax statement data prepared:', taxStatementData.summary);

    // Try to import and generate PDF
    let pdfBuffer;
    try {
    const { generatePAYETaxStatementPDF } = await import('../../../../../lib/pdfGenerators/payeTaxStatementPDF');
    pdfBuffer = await generatePAYETaxStatementPDF(taxStatementData);
    console.log('PDF buffer generated, length:', pdfBuffer.length);
    } catch (pdfError) {
    console.error('Error generating PDF:', pdfError);
    return NextResponse.json(
        { error: 'Error generating PDF', details: (pdfError as Error).message },
        { status: 500 }
    );
    }

    if (!pdfBuffer || pdfBuffer.length === 0) {
    console.error('Empty PDF buffer generated');
    return NextResponse.json(
        { error: 'Empty PDF generated' },
        { status: 500 }
    );
    }

    // Create document record
    const document = await prisma.document.create({
    data: {
        type: DocumentType.TAX_STATEMENT,
        title: `PAYE Tax Statement - ${getMonthName(parseInt(month))} ${year}`,
        description: `PAYE tax statement for ${taxStatementData.employees.length} employees`,
        period: `${month} ${year}`,
        generatedBy: 'system',
        fileSize: pdfBuffer.length,
        status: DocumentStatus.GENERATED,
        metadata: {
        employeeCount: taxStatementData.employees.length,
        period: `${month} ${year}`,
        summary: taxStatementData.summary
        }
    }
    });

    console.log('✅ PAYE tax statement document created:', document.id);

    // Return PDF directly
    return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="paye-tax-statement-${month}-${year}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
    },
    });

} catch (error) {
    console.error('Error generating PAYE tax statement:', error);
    return NextResponse.json(
    { error: 'Error generating PAYE tax statement', details: (error as Error).message },
    { status: 500 }
    );
}
}

function getMonthName(month: number): string {
const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
return monthNames[month - 1] || 'Unknown';
}