import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      // Get all active credits for the employee
      const credits = await prisma.credit.findMany({
        where: {
          employeeId: id as string,
          status: 'ACTIVE'
        }
      });

      // Calculate monthly deductions
      const deductions = {
        housingCredit: {
          monthlyAmount: 0,
          interest: 0
        },
        consumerCredit: {
          monthlyAmount: 0
        },
        totalDeductions: 0
      };

      credits.forEach(credit => {
        if (credit.type === 'HOUSING') {
          deductions.housingCredit.monthlyAmount += credit.monthlyPayment;
          // Calculate approximate interest based on rate and remaining principal
          const monthlyRate = credit.interestRate / 100 / 12;
          const approximateInterest = credit.remainingBalance * monthlyRate;
          deductions.housingCredit.interest += approximateInterest;
        } else if (credit.type === 'CONSUMER') {
          deductions.consumerCredit.monthlyAmount += credit.monthlyPayment;
        }
      });

      deductions.totalDeductions = deductions.housingCredit.monthlyAmount + 
                                  deductions.consumerCredit.monthlyAmount;

      res.status(200).json({
        credits,
        deductions
      });
    } catch (error) {
      console.error('Error fetching employee credits:', error);
      res.status(500).json({ error: 'Error fetching credits' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}