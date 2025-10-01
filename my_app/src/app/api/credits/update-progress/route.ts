import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { creditId, amountRepaid } = await request.json();

    if (!creditId || amountRepaid === undefined) {
      return NextResponse.json(
        { error: 'Credit ID and amount repaid are required' },
        { status: 400 }
      );
    }

    const amount = parseFloat(amountRepaid);
    if (amount < 0) {
      return NextResponse.json(
        { error: 'Amount repaid cannot be negative' },
        { status: 400 }
      );
    }

    // Get the credit for validation
    const credit = await prisma.credit.findUnique({
      where: { id: creditId }
    });

    if (!credit) {
      return NextResponse.json(
        { error: 'Credit not found' },
        { status: 404 }
      );
    }

    if (amount > credit.loanAmount) {
      return NextResponse.json(
        { error: 'Amount repaid cannot exceed the credit amount' },
        { status: 400 }
      );
    }

    // Calculate the new remaining balance
    const newRemainingBalance = Math.max(0, credit.loanAmount - amount);
    
    // Determine the new status
    let newStatus = credit.status;
    if (amount >= credit.loanAmount) {
      newStatus = 'PAID_OFF';
    } else {
      const now = new Date();
      if (now > credit.endDate) {
        newStatus = 'SUSPENDED';
      } else {
        newStatus = 'ACTIVE';
      }
    }

    // Update the credit
    const updatedCredit = await prisma.credit.update({
      where: { id: creditId },
      data: {
        amountRepaid: amount,
        remainingBalance: newRemainingBalance,
        status: newStatus
      },
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

    return NextResponse.json(updatedCredit);
  } catch (error) {
    console.error('Error updating credit:', error);
    return NextResponse.json(
      { error: 'Error updating credit' },
      { status: 500 }
    );
  }
}