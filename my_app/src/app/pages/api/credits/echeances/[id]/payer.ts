import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'POST') {
    try {
      const { amountPaid, paymentDate, notes } = req.body;

      // Data validation
      if (!amountPaid || amountPaid <= 0) {
        return res.status(400).json({ error: 'Amount paid must be greater than 0' });
      }

      // Get the installment
      const installment = await prisma.creditInstallment.findUnique({
        where: { id: id as string },
        include: {
          credit: true
        }
      });

      if (!installment) {
        return res.status(404).json({ error: 'Installment not found' });
      }

      if (installment.status === 'PAID') {
        return res.status(400).json({ error: 'This installment has already been paid' });
      }

      // Update the installment
      const updatedInstallment = await prisma.$transaction(async (prisma) => {
        // Mark the installment as paid
        const updatedInstallment = await prisma.creditInstallment.update({
          where: { id: id as string },
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
            // Note: interestPaid field doesn't exist in your schema, so this line is removed
            // interestPaid: installment.credit.interestPaid + installment.interest
          }
        });

        return updatedInstallment;
      });

      res.status(200).json(updatedInstallment);
    } catch (error) {
      console.error('Error processing installment payment:', error);
      res.status(500).json({ error: 'Error processing installment payment' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}