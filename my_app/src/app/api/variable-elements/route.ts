import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const type = searchParams.get('type');

    const whereClause: any = {};
    if (employeeId) {
      whereClause.employeeId = employeeId;
    }
    if (month) {
      whereClause.month = month;
    }
    if (year) {
      whereClause.year = year;
    }
    if (type) {
      whereClause.type = type;
    }

    const variableElements = await prisma.variableElement.findMany({
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
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { date: 'desc' },
      ],
    });

    return NextResponse.json(variableElements);
  } catch (error) {
    console.error('Error fetching variable elements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch variable elements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      employeeId,
      type,
      description,
      amount,
      hours,
      rate,
      date,
      month,
      year,
    } = data;

    // Required field validation
    if (!employeeId || !type || !description || !date || !month || !year) {
      return NextResponse.json(
        { error: 'Employee ID, type, description, date, month, and year are required' },
        { status: 400 }
      );
    }

    // Validate employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Validate based on type
    if (type === 'OVERTIME') {
      if (!hours || !rate) {
        return NextResponse.json(
          { error: 'Hours and rate are required for overtime' },
          { status: 400 }
        );
      }
      const parsedHours = parseFloat(hours);
      const parsedRate = parseFloat(rate);
      if (isNaN(parsedHours) || isNaN(parsedRate)) {
        return NextResponse.json(
          { error: 'Hours and rate must be valid numbers' },
          { status: 400 }
        );
      }
    } else if (!amount) {
      return NextResponse.json(
        { error: 'Amount is required for non-overtime elements' },
        { status: 400 }
      );
    }

    // Validate date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: 'Date must be a valid date' },
        { status: 400 }
      );
    }

    // Validate numeric fields
    const parsedAmount = amount ? parseFloat(amount) : null;
    const parsedHours = hours ? parseFloat(hours) : null;
    const parsedRate = rate ? parseFloat(rate) : null;

    if (type !== 'OVERTIME' && (isNaN(parsedAmount!) || parsedAmount! <= 0)) {
      return NextResponse.json(
        { error: 'Amount must be a valid number greater than 0 for non-overtime elements' },
        { status: 400 }
      );
    }

    if (type === 'OVERTIME' && (isNaN(parsedHours!) || isNaN(parsedRate!))) {
      return NextResponse.json(
        { error: 'Hours and rate must be valid numbers for overtime' },
        { status: 400 }
      );
    }

    // Calculate amount for overtime
    const finalAmount = type === 'OVERTIME' && parsedHours && parsedRate ? parsedHours * parsedRate : parsedAmount!;

    // Create variable element
    const variableElement = await prisma.variableElement.create({
      data: {
        employeeId,
        type,
        description: description.trim(),
        amount: finalAmount,
        hours: parsedHours,
        rate: parsedRate,
        date: parsedDate,
        month,
        year,
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

    return NextResponse.json(variableElement, { status: 201 });
  } catch (error: any) {
    console.error('Error creating variable element:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create variable element' },
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