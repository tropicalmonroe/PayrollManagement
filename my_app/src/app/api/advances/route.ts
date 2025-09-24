import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    const whereClause: any = {};
    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    const advances = await prisma.advance.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            lastName: true,
            firstName: true,
            position: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(advances);
  } catch (error) {
    console.error('Error fetching advances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advances' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      employeeId,
      amount,
      advanceDate,
      reason,
      numberOfInstallments,
      installmentAmount,
      remainingBalance,
      notes,
    } = data;

    // Required field validation
    if (!employeeId || !amount || !advanceDate || !reason || !numberOfInstallments) {
      return NextResponse.json(
        { error: 'Employee ID, amount, advance date, reason, and number of installments are required' },
        { status: 400 }
      );
    }

    // Type validation
    const parsedAmount = parseFloat(amount);
    const parsedInstallmentAmount = parseFloat(installmentAmount);
    const parsedRemainingBalance = parseFloat(remainingBalance);
    const parsedNumberOfInstallments = parseInt(numberOfInstallments, 10);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a valid number greater than 0' },
        { status: 400 }
      );
    }

    if (isNaN(parsedNumberOfInstallments) || parsedNumberOfInstallments <= 0 || parsedNumberOfInstallments > 24) {
      return NextResponse.json(
        { error: 'Number of installments must be a valid integer between 1 and 24' },
        { status: 400 }
      );
    }

    if (isNaN(parsedInstallmentAmount)) {
      return NextResponse.json(
        { error: 'Installment amount must be a valid number' },
        { status: 400 }
      );
    }

    if (isNaN(parsedRemainingBalance)) {
      return NextResponse.json(
        { error: 'Remaining balance must be a valid number' },
        { status: 400 }
      );
    }

    // Validate date
    const parsedAdvanceDate = new Date(advanceDate);
    if (isNaN(parsedAdvanceDate.getTime())) {
      return NextResponse.json(
        { error: 'Advance date must be a valid date' },
        { status: 400 }
      );
    }

    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Check for active advances
    const activeAdvances = await prisma.advance.findMany({
      where: {
        employeeId,
        status: 'IN_PROGRESS',
      },
    });

    if (activeAdvances.length > 0) {
      return NextResponse.json(
        { error: 'This employee already has an advance in progress. Please settle the existing advance first.' },
        { status: 400 }
      );
    }

    // Create advance
    const advance = await prisma.advance.create({
      data: {
        employeeId,
        amount: parsedAmount,
        advanceDate: parsedAdvanceDate,
        reason: reason.trim(),
        numberOfInstallments: parsedNumberOfInstallments,
        installmentAmount: parsedInstallmentAmount,
        remainingBalance: parsedRemainingBalance,
        status: 'IN_PROGRESS',
        createdBy: 'admin', // TODO: Replace with actual user from session/auth
        notes: notes?.trim() || null,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            lastName: true,
            firstName: true,
            position: true,
          },
        },
      },
    });

    return NextResponse.json(advance, { status: 201 });
  } catch (error: any) {
    console.error('Error creating advance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create advance' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*', // Adjust as needed
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}