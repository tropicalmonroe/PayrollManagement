// app/api/documents/final-settlement/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { DocumentType, DocumentStatus } from '@prisma/client';
import { generateFinalSettlementPDF, FinalSettlementData } from '../../../../../lib/pdfGenerators/finalSettlementPDF';

export async function POST(req: NextRequest) {
  try {
    const { 
      employeeId, 
      endDate, 
      departureReason, 
      unusedLeave, 
      severancePay, 
      otherAllowances,
      deductions 
    } = await req.json();

    console.log('Received final settlement request:', { 
      employeeId, 
      endDate, 
      departureReason 
    });

    if (!employeeId || !endDate || !departureReason) {
      return NextResponse.json(
        { error: 'employeeId, endDate and departureReason parameters are required' },
        { status: 400 }
      );
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Validate end date
    const endDateObj = new Date(endDate);
    if (isNaN(endDateObj.getTime())) {
      return NextResponse.json({ error: 'Invalid end date' }, { status: 400 });
    }

    if (endDateObj > new Date()) {
      return NextResponse.json({ error: 'End date cannot be in the future' }, { status: 400 });
    }

    // Get last payroll calculation
    const lastPayrollCalculation = await prisma.payrollCalculation.findFirst({
      where: { employeeId },
      orderBy: { createdAt: 'desc' }
    });

    // Get unpaid advances
    const unpaidAdvances = await prisma.advance.findMany({
      where: {
        employeeId,
        status: 'IN_PROGRESS'
      }
    });

    // Get active credits
    const activeCredits = await prisma.credit.findMany({
      where: {
        employeeId,
        status: 'ACTIVE'
      }
    });

    // Calculate amounts
    const baseSalary = employee.baseSalary;
    const unusedLeaveAmount = parseFloat(unusedLeave) || 0;
    const severancePayAmount = parseFloat(severancePay) || 0;
    const otherAllowancesAmount = parseFloat(otherAllowances) || 0;
    const deductionsAmount = parseFloat(deductions) || 0;

    // Calculate total advances to deduct
    const totalAdvances = unpaidAdvances.reduce((sum, advance) => sum + advance.remainingBalance, 0);

    // Calculate total credits to deduct
    const totalCredits = activeCredits.reduce((sum, credit) => sum + credit.remainingBalance, 0);

    // Balance calculations
    const totalEarnings = baseSalary + unusedLeaveAmount + severancePayAmount + otherAllowancesAmount;
    const totalDeductions = deductionsAmount + totalAdvances + totalCredits;
    const netBalance = totalEarnings - totalDeductions;

    const period = endDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Prepare data for PDF
    const settlementData: FinalSettlementData = {
      employee: {
        employeeId: employee.employeeId,
        lastName: employee.lastName,
        firstName: employee.firstName,
        position: employee.position,
        hireDate: employee.hireDate,
        seniority: employee.seniority,
        idNumber: employee.idNumber || 'N/A',
      },
      settlement: {
        endDate: endDateObj,
        departureReason,
        baseSalary,
        unusedLeave: unusedLeaveAmount,
        severancePay: severancePayAmount,
        otherAllowances: otherAllowancesAmount,
        deductions: deductionsAmount,
        totalAdvances,
        totalCredits,
        totalEarnings,
        totalDeductions,
        netBalance
      },
      unpaidAdvances: unpaidAdvances.map(advance => ({
        id: advance.id,
        amount: advance.amount,
        advanceDate: advance.advanceDate,
        remainingBalance: advance.remainingBalance
      })),
      activeCredits: activeCredits.map(credit => ({
        id: credit.id,
        amount: credit.loanAmount,
        startDate: credit.startDate,
        remainingBalance: credit.remainingBalance
      }))
    };

    // Generate PDF
    const pdfBuffer = await generateFinalSettlementPDF(settlementData);

    // Create final settlement document
    await prisma.document.create({
      data: {
        type: DocumentType.ACCOUNT_STATEMENT,
        title: `Final Settlement - ${employee.firstName} ${employee.lastName}`,
        description: `Final settlement following ${departureReason}`,
        employeeId,
        period,
        generatedBy: 'system',
        fileSize: pdfBuffer.length,
        status: DocumentStatus.GENERATED,
        metadata: {
          endDate,
          departureReason,
          baseSalary,
          unusedLeave: unusedLeaveAmount,
          severancePay: severancePayAmount,
          otherAllowances: otherAllowancesAmount,
          deductions: deductionsAmount,
          totalAdvances,
          totalCredits,
          totalEarnings,
          totalDeductions,
          netBalance,
          hireDate: employee.hireDate,
          seniority: employee.seniority,
          position: employee.position
        }
      }
    });

    // Return PDF directly
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="final-settlement-${employee.employeeId}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error('Error generating final settlement:', error);
    return NextResponse.json(
      { error: 'Error generating final settlement', details: error.message },
      { status: 500 }
    );
  }
}

// Optional: Add GET method if needed for testing
export async function GET(req: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to generate final settlement.' },
    { status: 405 }
  );
}