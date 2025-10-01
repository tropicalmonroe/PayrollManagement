// utils/creditScheduleGenerator.ts
import { generateAmortizationTable } from './creditCalculations';
import { prisma } from './prisma';

export async function generateCreditPaymentSchedule(creditId: string) {
const credit = await prisma.credit.findUnique({
    where: { id: creditId }
});

if (!credit) {
    throw new Error("Credit not found");
}

const {
    loanAmount,
    interestRate,
    durationYears,
    startDate,
    monthlyPayment
} = credit;

// Generate the amortization table
const amortizationTable = generateAmortizationTable(
    loanAmount,
    interestRate,
    durationYears * 12, // Convert years to months
    new Date(startDate)
);

// Create installments in the database
const installments = await Promise.all(
    amortizationTable.map(installment => 
    prisma.creditInstallment.create({
        data: {
        creditId,
        installmentNumber: installment.installmentNumber,
        dueDate: installment.dueDate,
        totalMonthlyPayment: installment.totalMonthlyPayment,
        principal: installment.principalRepayment,
        interest: installment.interestBeforeTax,
        interestTax: installment.interestTax,
        insurance: installment.insurance,
        remainingPrincipal: installment.remainingPrincipal,
        remainingBalance: installment.remainingPrincipal, // Same as remaining principal
        status: 'PENDING'
        }
    })
    )
);

return installments;
}