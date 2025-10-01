import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get a specific advance by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Invalid advance ID' }, { status: 400 });
  }

  try {
    const advance = await prisma.advance.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            lastName: true,
            firstName: true,
            position: true
          }
        }
      }
    });

    if (!advance) {
      return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
    }

    return NextResponse.json(advance);
  } catch (error) {
    console.error('Error fetching advance:', error);
    return NextResponse.json({ error: 'Error loading advance' }, { status: 500 });
  }
}

// PUT - Update an advance
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Invalid advance ID' }, { status: 400 });
  }

  try {
    const {
      amount,
      advanceDate,
      reason,
      numberOfInstallments,
      installmentAmount,
      remainingBalance,
      status,
      notes
    } = await request.json();

    // Check if advance exists
    const existingAdvance = await prisma.advance.findUnique({
      where: { id }
    });

    if (!existingAdvance) {
      return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
    }

    // Validation
    if (amount !== undefined && amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }

    if (numberOfInstallments !== undefined && (numberOfInstallments <= 0 || numberOfInstallments > 24)) {
      return NextResponse.json({ error: 'Number of installments must be between 1 and 24' }, { status: 400 });
    }

    if (remainingBalance !== undefined && remainingBalance < 0) {
      return NextResponse.json({ error: 'Remaining balance cannot be negative' }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {};
    
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (advanceDate !== undefined) updateData.advanceDate = new Date(advanceDate);
    if (reason !== undefined) updateData.reason = reason.trim();
    if (numberOfInstallments !== undefined) updateData.numberOfInstallments = parseInt(numberOfInstallments);
    if (installmentAmount !== undefined) updateData.installmentAmount = parseFloat(installmentAmount);
    if (remainingBalance !== undefined) {
      updateData.remainingBalance = parseFloat(remainingBalance);
      // Auto-update status based on remaining balance
      if (parseFloat(remainingBalance) === 0) {
        updateData.status = 'REPAID';
        updateData.fullRepaymentDate = new Date();
      } else if (updateData.status !== 'CANCELLED') {
        updateData.status = 'IN_PROGRESS';
      }
    }
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;

    // Update advance
    const advance = await prisma.advance.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            lastName: true,
            firstName: true,
            position: true
          }
        }
      }
    });

    return NextResponse.json(advance);
  } catch (error) {
    console.error('Error updating advance:', error);
    return NextResponse.json({ error: 'Error updating advance' }, { status: 500 });
  }
}

// DELETE - Delete an advance
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Invalid advance ID' }, { status: 400 });
  }

  try {
    // Check if advance exists
    const existingAdvance = await prisma.advance.findUnique({
      where: { id }
    });

    if (!existingAdvance) {
      return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
    }

    // Delete advance
    await prisma.advance.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Advance successfully deleted' });
  } catch (error) {
    console.error('Error deleting advance:', error);
    return NextResponse.json({ error: 'Error deleting advance' }, { status: 500 });
  }
}