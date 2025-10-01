import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { advanceId, remainingBalance } = await request.json();

    // Validation
    if (!advanceId) {
      return NextResponse.json(
        { error: 'Advance ID required' },
        { status: 400 }
      );
    }

    if (remainingBalance === undefined || remainingBalance < 0) {
      return NextResponse.json(
        { error: 'Remaining balance must be a positive number or zero' },
        { status: 400 }
      );
    }

    // Check if advance exists
    const existingAdvance = await prisma.advance.findUnique({
      where: { id: advanceId },
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

    if (!existingAdvance) {
      return NextResponse.json(
        { error: 'Advance not found' },
        { status: 404 }
      );
    }

    // Validate that the new remaining balance doesn't exceed the original amount
    if (parseFloat(remainingBalance) > existingAdvance.amount) {
      return NextResponse.json(
        { 
          error: 'Remaining balance cannot be greater than the initial advance amount' 
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      remainingBalance: parseFloat(remainingBalance)
    };

    // Auto-update status based on remaining balance
    if (parseFloat(remainingBalance) === 0) {
      updateData.status = 'REPAID';
      updateData.fullRepaymentDate = new Date();
    } else if (existingAdvance.status !== 'CANCELLED') {
      updateData.status = 'IN_PROGRESS';
      updateData.fullRepaymentDate = null;
    }

    // Update advance
    const updatedAdvance = await prisma.advance.update({
      where: { id: advanceId },
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

    // Calculate progress information
    const amountRepaid = updatedAdvance.amount - updatedAdvance.remainingBalance;
    const progressPercentage = (amountRepaid / updatedAdvance.amount) * 100;

    // Calculate expected progress based on time elapsed
    const startDate = new Date(updatedAdvance.advanceDate);
    const now = new Date();
    const monthsElapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const expectedProgress = Math.min(100, (monthsElapsed / updatedAdvance.numberOfInstallments) * 100);
    const isLate = progressPercentage < expectedProgress && updatedAdvance.status === 'IN_PROGRESS';

    const response = {
      ...updatedAdvance,
      calculatedProgress: {
        progressPercentage: Math.round(progressPercentage * 100) / 100,
        amountRepaid: amountRepaid,
        isLate: isLate,
        monthsElapsed: monthsElapsed,
        expectedProgress: Math.round(expectedProgress * 100) / 100
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating advance progress:', error);
    return NextResponse.json(
      { error: 'Error updating progress' },
      { status: 500 }
    );
  }
}