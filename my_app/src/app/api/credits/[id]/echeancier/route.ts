import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      // Get the complete credit payment schedule
      const paymentSchedule = await prisma.creditInstallment.findMany({
        where: {
          creditId: id as string
        },
        orderBy: {
          installmentNumber: 'asc'
        }
      });

      if (!paymentSchedule.length) {
        return res.status(404).json({ error: 'Payment schedule not found' });
      }

      // Calculate payment schedule statistics
      const now = new Date();
      const stats = {
        totalInstallments: paymentSchedule.length,
        paidInstallments: paymentSchedule.filter(e => e.status === 'PAID').length,
        overdueInstallments: paymentSchedule.filter(e => 
          e.status === 'PENDING' && new Date(e.dueDate) < now
        ).length,
        nextPayment: paymentSchedule.find(e => e.status === 'PENDING'),
        totalAmountPaid: paymentSchedule
          .filter(e => e.status === 'PAID')
          .reduce((sum, e) => sum + (e.amountPaid || e.totalMonthlyPayment), 0),
        totalAmountRemaining: paymentSchedule
          .filter(e => e.status === 'PENDING')
          .reduce((sum, e) => sum + e.totalMonthlyPayment, 0)
      };

      res.status(200).json({
        paymentSchedule,
        stats
      });
    } catch (error) {
      console.error('Error fetching payment schedule:', error);
      res.status(500).json({ error: 'Error fetching payment schedule' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}