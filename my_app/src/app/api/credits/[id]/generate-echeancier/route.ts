// app/api/credits/[id]/generate-echeancier/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { generateAmortizationTable } from "../../../../../lib/creditCalculations";

export async function POST(
request: NextRequest, 
{ params }: { params: { id: string } }
) {
try {
    const { id } = await params;

    // Check if credit exists
    const credit = await prisma.credit.findUnique({
    where: { id },
    include: { 
        paymentSchedule: {
        orderBy: { installmentNumber: "asc" },
        }
    }
    });

    if (!credit) {
    return NextResponse.json({ 
        error: "Credit not found" 
    }, { status: 404 });
    }

    // Check if schedule already exists
    if (credit.paymentSchedule.length > 0) {
    return NextResponse.json(
        { 
        error: "Payment schedule already exists",
        existingInstallments: credit.paymentSchedule.length,
        message: "To regenerate, please delete the existing schedule first."
        },
        { status: 400 }
    );
    }

    // Generate the amortization table
    const amortizationTable = generateAmortizationTable(
    credit.loanAmount,
    credit.interestRate,
    credit.durationYears * 12,
    new Date(credit.startDate)
    );

    // Create installments in the database
    const installments = await Promise.all(
    amortizationTable.map(installment => 
        prisma.creditInstallment.create({
        data: {
            creditId: id,
            installmentNumber: installment.installmentNumber,
            dueDate: installment.dueDate,
            totalMonthlyPayment: installment.totalMonthlyPayment,
            principal: installment.principalRepayment,
            interest: installment.interestBeforeTax,
            interestTax: installment.interestTax,
            insurance: installment.insurance,
            remainingPrincipal: installment.remainingPrincipal,
            remainingBalance: installment.remainingPrincipal,
            status: 'PENDING'
        }
        })
    )
    );

    return NextResponse.json({
    success: true,
    message: "Payment schedule generated successfully",
    installments: installments.length,
    creditId: id,
    firstInstallment: installments[0],
    lastInstallment: installments[installments.length - 1]
    });

} catch (error) {
    console.error("Error generating payment schedule:", error);
    return NextResponse.json(
    { 
        error: "Error generating payment schedule",
        details: error instanceof Error ? error.message : "Unknown error"
    },
    { status: 500 }
    );
}
}