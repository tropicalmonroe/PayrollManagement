import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { generateSimplePaymentSchedule, type SimpleCredit } from '../../../../lib/simplePaymentSchedule';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { creditId, monthlyPayment, numberOfInstallments, startDate } = req.body;

      if (!creditId || !monthlyPayment || !numberOfInstallments || !startDate) {
        return res.status(400).json({ 
          error: 'Missing parameters: creditId, monthlyPayment, numberOfInstallments, startDate required' 
        });
      }

      // Check if the credit exists
      const credit = await prisma.credit.findUnique({
        where: { id: creditId }
      });

      if (!credit) {
        return res.status(404).json({ error: 'Credit not found' });
      }

      // Check if a payment schedule already exists
      const existingSchedule = await prisma.creditInstallment.findFirst({
        where: { creditId }
      });

      if (existingSchedule) {
        return res.status(400).json({ 
          error: 'A payment schedule already exists for this credit' 
        });
      }

      // Create simple credit for generation
      const simpleCredit: SimpleCredit = {
        totalAmount: monthlyPayment * numberOfInstallments,
        monthlyAmount: monthlyPayment,
        numberOfInstallments: numberOfInstallments,
        startDate: new Date(startDate)
      };

      // Generate simple payment schedule
      const paymentSchedule = generateSimplePaymentSchedule(simpleCredit);

      // Save payment schedule to database
      const installmentsData = paymentSchedule.map(installment => {
      const remainingPrincipal = simpleCredit.totalAmount - (installment.installmentNumber * installment.amountToPay);

      return {
        creditId,
        installmentNumber: installment.installmentNumber,
        dueDate: installment.dueDate,
        totalMonthlyPayment: installment.amountToPay,
        principal: installment.amountToPay, // For compatibility
        interest: 0, // No interest in simple mode
        interestTax: 0,
        insurance: 0,
        remainingPrincipal,
        remainingBalance: remainingPrincipal + (installment.interest ?? 0) + (installment.insurance ?? 0) - (installment.amountPaid ?? 0),
        status: installment.status,
        notes: installment.notes || null
      };
    });


      // Create all installments in a single transaction
      await prisma.creditInstallment.createMany({
        data: installmentsData
      });

      res.status(200).json({
        message: 'Simple payment schedule generated successfully',
        totalInstallments: paymentSchedule.length,
        monthlyPayment: monthlyPayment,
        totalAmount: simpleCredit.totalAmount,
        paymentSchedule: paymentSchedule
      });

    } catch (error) {
      console.error('Error generating simple payment schedule:', error);
      res.status(500).json({ 
        error: 'Error generating simple payment schedule' 
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}