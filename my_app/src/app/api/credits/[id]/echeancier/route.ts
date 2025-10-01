// app/api/credits/[id]/echeancier/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { generateCreditPaymentSchedule } from '../../../../../lib/creditScheduleGenerator';

export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    console.log("Fetching payment schedule for credit ID:", id);

    // First, check if the credit exists
    const credit = await prisma.credit.findUnique({
      where: { id },
      include: {
        paymentSchedule: {
          orderBy: { installmentNumber: "asc" },
        },
      },
    });
    

    console.log("Credit found:", credit?.id);
    console.log("Payment schedule found:", credit?.paymentSchedule?.length, "installments");

    if (!credit) {
      return NextResponse.json(
        { error: "Credit not found" }, 
        { status: 404 }
      );
    }

    let paymentSchedule = credit.paymentSchedule;

    // If no payment schedule exists, generate it automatically
    if (!paymentSchedule.length) {
      console.log("No payment schedule found. Generating one...");
      
      try {
        paymentSchedule = await generateCreditPaymentSchedule(id);
        console.log("Generated payment schedule with", paymentSchedule.length, "installments");
      } catch (generateError) {
        console.error("Error generating payment schedule:", generateError);
        return NextResponse.json(
          { 
            error: "No payment schedule found and could not generate one automatically",
            creditExists: true,
            creditStatus: credit.status
          }, 
          { status: 404 }
        );
      }
    }

    // Calculate stats
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const stats = {
      totalInstallments: paymentSchedule.length,
      paidInstallments: paymentSchedule.filter((e) => e.status === "PAID").length,
      overdueInstallments: paymentSchedule.filter(
        (e) => e.status === "PENDING" && new Date(e.dueDate) < now
      ).length,
      nextPayment: paymentSchedule.find((e) => e.status === "PENDING") || null,
      totalAmountPaid: paymentSchedule
        .filter((e) => e.status === "PAID")
        .reduce((sum, e) => sum + (e.amountPaid || e.totalMonthlyPayment), 0),
      totalAmountRemaining: paymentSchedule
        .filter((e) => e.status === "PENDING")
        .reduce((sum, e) => sum + e.totalMonthlyPayment, 0),
    };

    return NextResponse.json({ 
      paymentSchedule, 
      stats,
      creditInfo: {
        id: credit.id,
        type: credit.type,
        loanAmount: credit.loanAmount,
        status: credit.status,
        scheduleGenerated: !credit.paymentSchedule.length // Flag if we just generated it
      }
    });
  } catch (error) {
    console.error("Error fetching payment schedule:", error);
    return NextResponse.json(
      { error: "Error fetching payment schedule" }, 
      { status: 500 }
    );
  }
}

// app/api/credits/[id]/echeancier/route.ts - ADD this
export async function DELETE(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    // Delete all installments for this credit
    await prisma.creditInstallment.deleteMany({
      where: { creditId: id }
    });

    return NextResponse.json({
      success: true,
      message: "Payment schedule deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting payment schedule:", error);
    return NextResponse.json(
      { error: "Error deleting payment schedule" },
      { status: 500 }
    );
  }
}