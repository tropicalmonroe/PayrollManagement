import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  if (req.method === 'GET') {
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
              position: true
            }
          }
        }
      });

      if (!credit) {
        return res.status(404).json({ error: 'Credit not found' });
      }

      res.status(200).json(credit);
    } catch (error) {
      console.error('Error fetching credit:', error);
      res.status(500).json({ error: 'Error fetching credit' });
    }
  } else if (req.method === 'PUT') {
    try {
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
        remainingBalance
      } = req.body;

      // Recalculate monthly payment if basic parameters have changed
      let monthlyPayment;
      if (loanAmount && interestRate !== undefined && durationYears) {
        const amount = parseFloat(loanAmount);
        const rate = parseFloat(interestRate);
        const duration = parseInt(durationYears);
        
        if (amount > 0 && rate >= 0 && duration > 0) {
          const monthlyRate = rate / 100 / 12;
          const numberOfInstallments = duration * 12;
          
          if (monthlyRate > 0) {
            monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfInstallments)) / 
                        (Math.pow(1 + monthlyRate, numberOfInstallments) - 1);
          } else {
            // If rate = 0, monthly payment = amount / number of months
            monthlyPayment = amount / numberOfInstallments;
          }
          monthlyPayment = Math.round(monthlyPayment * 100) / 100;
        }
      }

      // Calculate end date if necessary
      let endDate;
      if (startDate && durationYears) {
        const startDateObj = new Date(startDate);
        const duration = parseInt(durationYears);
        
        // Validate date and duration
        if (startDateObj instanceof Date && !isNaN(startDateObj.getTime()) && duration > 0 && duration <= 50) {
          endDate = new Date(startDateObj);
          endDate.setFullYear(endDate.getFullYear() + duration);
          
          // Verify calculated date is valid
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
      if (remainingBalance !== undefined) updateData.remainingBalance = parseFloat(remainingBalance);

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
              position: true
            }
          }
        }
      });

      res.status(200).json(credit);
    } catch (error) {
      console.error('Error updating credit:', error);
      res.status(500).json({ error: 'Error updating credit' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.credit.delete({
        where: { id }
      });

      res.status(200).json({ message: 'Credit deleted successfully' });
    } catch (error) {
      console.error('Error deleting credit:', error);
      res.status(500).json({ error: 'Error deleting credit' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}