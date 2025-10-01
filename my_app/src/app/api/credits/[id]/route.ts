import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// GET /api/credits/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const credit = await prisma.credit.findUnique({
      where: { id },
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

    if (!credit) {
      return NextResponse.json({ error: "Credit not found" }, { status: 404 });
    }

    return NextResponse.json(credit);
  } catch (error) {
    console.error("Error fetching credit:", error);
    return NextResponse.json({ error: "Error fetching credit" }, { status: 500 });
  }
}

// PUT /api/credits/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const body = await req.json();
    const {
      employeeId,
      type,
      loanAmount,
      interestRate,
      durationYears,
      startDate,
      bank,
      accountNumber,
      notes,
      status,
      amountRepaid,
      remainingBalance,
    } = body;

    // recalc monthly payment
    let monthlyPayment;
    if (loanAmount && interestRate !== undefined && durationYears) {
      const amount = parseFloat(loanAmount);
      const rate = parseFloat(interestRate);
      const duration = parseInt(durationYears);

      if (amount > 0 && rate >= 0 && duration > 0) {
        const monthlyRate = rate / 100 / 12;
        const numberOfInstallments = duration * 12;

        if (monthlyRate > 0) {
          monthlyPayment =
            (amount *
              (monthlyRate * Math.pow(1 + monthlyRate, numberOfInstallments))) /
            (Math.pow(1 + monthlyRate, numberOfInstallments) - 1);
        } else {
          monthlyPayment = amount / numberOfInstallments;
        }
        monthlyPayment = Math.round(monthlyPayment * 100) / 100;
      }
    }

    // calc endDate
    let endDate;
    if (startDate && durationYears) {
      const startDateObj = new Date(startDate);
      const duration = parseInt(durationYears);
      if (
        startDateObj instanceof Date &&
        !isNaN(startDateObj.getTime()) &&
        duration > 0 &&
        duration <= 50
      ) {
        endDate = new Date(startDateObj);
        endDate.setFullYear(endDate.getFullYear() + duration);
        if (isNaN(endDate.getTime())) {
          endDate = undefined;
        }
      }
    }

    const updateData: any = {};
    if (employeeId !== undefined) updateData.employeeId = employeeId;
    if (type !== undefined) updateData.type = type;
    if (loanAmount !== undefined) updateData.loanAmount = parseFloat(loanAmount);
    if (interestRate !== undefined) updateData.interestRate = parseFloat(interestRate);
    if (durationYears !== undefined) updateData.durationYears = parseInt(durationYears);
    if (monthlyPayment !== undefined) updateData.monthlyPayment = monthlyPayment;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate;
    if (bank !== undefined) updateData.bank = bank;
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;
    if (amountRepaid !== undefined) updateData.amountRepaid = parseFloat(amountRepaid);
    if (remainingBalance !== undefined)
      updateData.remainingBalance = parseFloat(remainingBalance);

    const credit = await prisma.credit.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(credit);
  } catch (error) {
    console.error("Error updating credit:", error);
    return NextResponse.json({ error: "Error updating credit" }, { status: 500 });
  }
}

// DELETE /api/credits/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  const { id } = params;
  try {
    await prisma.credit.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Credit deleted successfully" });
  } catch (error) {
    console.error("Error deleting credit:", error);
    return NextResponse.json({ error: "Error deleting credit" }, { status: 500 });
  }
}
