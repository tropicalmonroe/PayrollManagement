import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';

export async function GET(
req: NextRequest,
{ params }: { params: { id: string } }
) {
try {
    const documentId = await params.id;

    const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
        employee: true,
    },
    });

    if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Regenerate PDF for printing
    const { generateFinalSettlementPDF } = await import('../../../../../../lib/pdfGenerators/finalSettlementPDF');
    
    const settlementData = {
    employee: document.employee
    ? {
        employeeId: document.employee.employeeId,
        lastName: document.employee.lastName,
        firstName: document.employee.firstName,
        position: document.employee.position,
        hireDate: document.employee.hireDate,
        seniority: document.employee.seniority,
        idNumber: document.employee.idNumber || 'N/A',
    }: {
        employeeId: 'N/A',
        lastName: 'N/A',
        firstName: 'N/A',
        position: 'N/A',
        hireDate: 'N/A',
        seniority: 0,
        idNumber: 'N/A',
    }, 
    settlement: {
        endDate: typeof document.metadata === 'object' && document.metadata !== null && 'endDate' in document.metadata ? (document.metadata as any).endDate : new Date(),
        departureReason: typeof document.metadata === 'object' && document.metadata !== null && 'departureReason' in document.metadata ? (document.metadata as any).departureReason : 'Unknown',
        baseSalary: typeof document.metadata === 'object' && document.metadata !== null && 'baseSalary' in document.metadata ? (document.metadata as any).baseSalary : 0,
        unusedLeave: typeof document.metadata === 'object' && document.metadata !== null && 'unusedLeave' in document.metadata ? (document.metadata as any).unusedLeave : 0,
        severancePay: typeof document.metadata === 'object' && document.metadata !== null && 'severancePay' in document.metadata ? (document.metadata as any).severancePay : 0,
        otherAllowances: typeof document.metadata === 'object' && document.metadata !== null && 'otherAllowances' in document.metadata ? (document.metadata as any).otherAllowances : 0,
        deductions: typeof document.metadata === 'object' && document.metadata !== null && 'deductions' in document.metadata ? (document.metadata as any).deductions : 0,
        totalAdvances: typeof document.metadata === 'object' && document.metadata !== null && 'totalAdvances' in document.metadata ? (document.metadata as any).totalAdvances : 0,
        totalCredits: typeof document.metadata === 'object' && document.metadata !== null && 'totalCredits' in document.metadata ? (document.metadata as any).totalCredits : 0,
        totalEarnings: typeof document.metadata === 'object' && document.metadata !== null && 'totalEarnings' in document.metadata ? (document.metadata as any).totalEarnings : 0,
        totalDeductions: typeof document.metadata === 'object' && document.metadata !== null && 'totalDeductions' in document.metadata ? (document.metadata as any).totalDeductions : 0,
        netBalance: typeof document.metadata === 'object' && document.metadata !== null && 'netBalance' in document.metadata ? (document.metadata as any).netBalance : 0,
    }
    };

    const pdfBuffer = await generateFinalSettlementPDF(settlementData);

    return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="final-settlement-${document.employee?.id}.pdf"`,
    },
    });

} catch (error: any) {
    console.error('Error printing final settlement:', error);
    return NextResponse.json(
    { error: 'Error printing final settlement', details: error.message },
    { status: 500 }
    );
}
}