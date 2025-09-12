import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { creditId, amountRepaid } = req.body;

      if (!creditId || amountRepaid === undefined) {
        return res.status(400).json({ error: 'Credit ID and amount repaid are required' });
      }

      const amount = parseFloat(amountRepaid);
      if (amount < 0) {
        return res.status(400).json({ error: 'Amount repaid cannot be negative' });
      }

      // Get the credit for validation
      const credit = await prisma.credit.findUnique({
        where: { id: creditId }
      });

      if (!credit) {
        return res.status(404).json({ error: 'Credit not found' });
      }

      if (amount > credit.loanAmount) {
        return res.status(400).json({ error: 'Amount repaid cannot exceed the credit amount' });
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
          // Note: capitalRestant field doesn't exist in your schema, so it's removed
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

      res.status(200).json(updatedCredit);
    } catch (error) {
      console.error('Error updating credit:', error);
      res.status(500).json({ error: 'Error updating credit' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}