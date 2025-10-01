import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {

  const { id } = await params;
  try {
    const { amountPaid, paymentDate, notes } = await request.json();

    // Data validation
    if (!amountPaid || amountPaid <= 0) {
      return NextResponse.json(
        { error: 'Amount paid must be greater than 0' },
        { status: 400 }
      );
    }

    // Get the installment
    const installment = await prisma.creditInstallment.findUnique({
      where: { id },
      include: {
        credit: true
      }
    });

    if (!installment) {
      return NextResponse.json(
        { error: 'Installment not found' },
        { status: 404 }
      );
    }

    if (installment.status === 'PAID') {
      return NextResponse.json(
        { error: 'This installment has already been paid' },
        { status: 400 }
      );
    }

    // Update the installment
    const updatedInstallment = await prisma.$transaction(async (prisma) => {
      // Mark the installment as paid
      const updatedInstallment = await prisma.creditInstallment.update({
        where: { id },
        data: {
          status: 'PAID',
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          amountPaid: parseFloat(amountPaid),
          notes: notes || null
        }
      });

      // Update the credit
      const previousAmountRepaid = installment.credit.amountRepaid;
      const newAmountRepaid = previousAmountRepaid + parseFloat(amountPaid);
      const newRemainingBalance = Math.max(0, installment.credit.loanAmount - newAmountRepaid);

      // Determine the new credit status
      let newStatus = installment.credit.status;
      if (newRemainingBalance <= 0) {
        newStatus = 'PAID_OFF';
      }

      await prisma.credit.update({
        where: { id: installment.creditId },
        data: {
          amountRepaid: newAmountRepaid,
          remainingBalance: newRemainingBalance,
          status: newStatus,
        }
      });

      return updatedInstallment;
    });

    return NextResponse.json(updatedInstallment);
  } catch (error) {
    console.error('Error processing installment payment:', error);
    return NextResponse.json(
      { error: 'Error processing installment payment' },
      { status: 500 }
    );
  }
}