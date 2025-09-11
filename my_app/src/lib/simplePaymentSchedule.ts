// Simple payment schedule for credits with manual amount entry

export interface SimpleInstallment {
  installmentNumber: number;
  dueDate: Date;
  amountToPay: number; // Simple amount to pay
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  notes?: string;
}

export interface SimpleCredit {
  totalAmount: number; // Total credit amount
  monthlyAmount: number; // Fixed monthly amount to pay
  numberOfInstallments: number; // Total number of installments
  startDate: Date;
  description?: string; // Credit description
}

/**
 * Generates a simple payment schedule with manual amounts
 */
export function generateSimplePaymentSchedule(credit: SimpleCredit): SimpleInstallment[] {
  const {
    monthlyAmount,
    numberOfInstallments,
    startDate
  } = credit;

  const paymentSchedule: SimpleInstallment[] = [];

  for (let i = 1; i <= numberOfInstallments; i++) {
    // Due date
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    paymentSchedule.push({
      installmentNumber: i,
      dueDate,
      amountToPay: monthlyAmount,
      status: 'PENDING'
    });
  }

  return paymentSchedule;
}

/**
 * Creates a payment schedule with custom amounts for each installment
 */
export function createCustomPaymentSchedule(
  startDate: Date,
  customAmounts: number[]
): SimpleInstallment[] {
  const paymentSchedule: SimpleInstallment[] = [];

  customAmounts.forEach((amount, index) => {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + index + 1);

    paymentSchedule.push({
      installmentNumber: index + 1,
      dueDate,
      amountToPay: amount,
      status: 'PENDING'
    });
  });

  return paymentSchedule;
}

/**
 * Calculates the monthly payment of a credit (for payroll integration)
 */
export function calculateCreditMonthlyPayment(credit: SimpleCredit): number {
  return credit.monthlyAmount;
}

/**
 * Gets the current installment of a credit
 */
export function getCurrentInstallment(
  paymentSchedule: SimpleInstallment[], 
  referenceDate: Date = new Date()
): SimpleInstallment | null {
  // Find the first unpaid installment whose date has passed or is near
  const currentInstallment = paymentSchedule.find(e => 
    e.status === 'PENDING' && e.dueDate <= referenceDate
  );
  
  // If no overdue installment, take the next one
  if (!currentInstallment) {
    return paymentSchedule.find(e => e.status === 'PENDING') || null;
  }
  
  return currentInstallment;
}

/**
 * Updates the status of an installment
 */
export function markInstallmentAsPaid(
  paymentSchedule: SimpleInstallment[],
  installmentNumber: number,
  paymentDate: Date,
  amountPaid?: number
): SimpleInstallment[] {
  return paymentSchedule.map(e => {
    if (e.installmentNumber === installmentNumber) {
      return {
        ...e,
        status: 'PAID' as const
      };
    }
    return e;
  });
}

/**
 * Calculates payment schedule statistics
 */
export function calculateScheduleStatistics(paymentSchedule: SimpleInstallment[]) {
  const now = new Date();
  
  const totalInstallments = paymentSchedule.length;
  const paidInstallments = paymentSchedule.filter(e => e.status === 'PAID').length;
  const overdueInstallments = paymentSchedule.filter(e => 
    e.status === 'PENDING' && e.dueDate < now
  ).length;
  
  const totalAmountPaid = paymentSchedule
    .filter(e => e.status === 'PAID')
    .reduce((sum, e) => sum + e.amountToPay, 0);
    
  const totalAmountRemaining = paymentSchedule
    .filter(e => e.status === 'PENDING')
    .reduce((sum, e) => sum + e.amountToPay, 0);
    
  const nextPayment = paymentSchedule.find(e => e.status === 'PENDING');
  
  return {
    totalInstallments,
    paidInstallments,
    overdueInstallments,
    totalAmountPaid: Math.round(totalAmountPaid * 100) / 100,
    totalAmountRemaining: Math.round(totalAmountRemaining * 100) / 100,
    nextPayment,
    progressPercentage: totalInstallments > 0 ? 
      Math.round((paidInstallments / totalInstallments) * 100 * 100) / 100 : 0
  };
}

/**
 * Checks if a credit is overdue
 */
export function checkCreditOverdue(paymentSchedule: SimpleInstallment[]): {
  isOverdue: boolean;
  numberOfOverdueInstallments: number;
  overdueAmount: number;
} {
  const now = new Date();
  const overdueInstallments = paymentSchedule.filter(e => 
    e.status === 'PENDING' && e.dueDate < now
  );
  
  return {
    isOverdue: overdueInstallments.length > 0,
    numberOfOverdueInstallments: overdueInstallments.length,
    overdueAmount: Math.round(
      overdueInstallments.reduce((sum, e) => sum + e.amountToPay, 0) * 100
    ) / 100
  };
}