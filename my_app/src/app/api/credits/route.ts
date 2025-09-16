import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { generateAmortizationTable } from '../../../lib/creditCalculations';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { employeeId } = req.query;
      
      // Build query with or without employee filter
      const whereClause = employeeId ? { employeeId: employeeId as string } : {};
      
      const credits = await prisma.credit.findMany({
        where: whereClause,
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
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Calculate automatic repayments based on elapsed time
      const creditsWithProgress = credits.map(credit => {
        const now = new Date();
        const startDate = new Date(credit.startDate);
        
        // Calculate months elapsed since credit start
        let monthsElapsed = 0;
        if (startDate <= now) {
          const diffTime = now.getTime() - startDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          monthsElapsed = Math.floor(diffDays / 30.44); // Average days per month
          
          // Limit to total number of credit installments
          const totalInstallments = credit.durationYears * 12;
          monthsElapsed = Math.max(0, Math.min(monthsElapsed, totalInstallments));
        }
        
        // Calculate amount that should be automatically repaid
        const amountRepaidAuto = monthsElapsed * credit.monthlyPayment;
        
        // Use automatic repaid amount if database amount is 0 or less
        const finalAmountRepaid = credit.amountRepaid > 0 ? 
          credit.amountRepaid : 
          Math.min(amountRepaidAuto, credit.loanAmount);
        
        // Calculate progress based on final repaid amount
        const progressPercentage = Math.min(100, (finalAmountRepaid / credit.loanAmount) * 100);
        
        // Calculate remaining balance
        const calculatedRemainingBalance = Math.max(0, credit.loanAmount - finalAmountRepaid);
        
        // Determine status
        let newStatus = credit.status;
        if (finalAmountRepaid >= credit.loanAmount) {
          newStatus = 'PAID_OFF';
        } else if (now > new Date(credit.endDate) && finalAmountRepaid < credit.loanAmount) {
          newStatus = 'SUSPENDED';
        } else {
          newStatus = 'ACTIVE';
        }

        return {
          ...credit,
          amountRepaid: finalAmountRepaid,
          remainingBalance: calculatedRemainingBalance,
          status: newStatus,
          calculatedProgress: {
            installmentsElapsed: monthsElapsed,
            amountRepaidAuto: Math.round(amountRepaidAuto * 100) / 100,
            progressPercentage: Math.round(progressPercentage * 100) / 100,
            isOverdue: false, // No delay if we assume all payments made
            monthsOverdue: 0
          }
        };
      });

      res.status(200).json(creditsWithProgress);
    } catch (error) {
      console.error('Error fetching credits:', error);
      res.status(500).json({ error: 'Error fetching credits' });
    }
  } else if (req.method === 'POST') {
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
        createdBy
      } = req.body;

      // Data validation
      if (!employeeId || !type || !loanAmount || !interestRate || !startDate || !bank) {
        return res.status(400).json({ error: 'All required fields must be filled' });
      }

      // Validation and data conversion
      const amount = parseFloat(loanAmount);
      const rate = parseFloat(interestRate);
      const duration = parseInt(durationYears) || 1;
      
      if (amount <= 0 || rate < 0 || duration <= 0 || duration > 50) {
        return res.status(400).json({ error: 'Invalid numeric values' });
      }

      // Calculate monthly payment (amortization formula)
      const monthlyRate = rate / 100 / 12;
      const numberOfInstallments = duration * 12;
      let monthlyPayment;
      
      if (monthlyRate > 0) {
        monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfInstallments)) / 
                    (Math.pow(1 + monthlyRate, numberOfInstallments) - 1);
      } else {
        // If rate = 0, monthly payment = amount / number of months
        monthlyPayment = amount / numberOfInstallments;
      }

      // Calculate end date
      const startDateObj = new Date(startDate);
      if (isNaN(startDateObj.getTime())) {
        return res.status(400).json({ error: 'Invalid start date' });
      }
      
      const endDate = new Date(startDateObj);
      endDate.setFullYear(endDate.getFullYear() + duration);
      
      if (isNaN(endDate.getTime())) {
        return res.status(400).json({ error: 'Error calculating end date' });
      }

      // Generate complete payment schedule
      const insuranceRateValue = 0.809; // Default 0.809%
      const amortizationSchedule = generateAmortizationTable(
        amount,
        rate,
        numberOfInstallments,
        startDateObj,
        insuranceRateValue
      );

      // Create credit - only include fields that exist in the schema
      const newCredit = await prisma.credit.create({
        data: {
          employeeId,
          type,
          loanAmount: parseFloat(loanAmount),
          interestRate: parseFloat(interestRate),
          durationYears: parseInt(durationYears) || 1,
          monthlyPayment: Math.round(monthlyPayment * 100) / 100,
          startDate: new Date(startDate),
          endDate,
          remainingBalance: parseFloat(loanAmount),
          amountRepaid: 0,
          status: 'ACTIVE',
          bank,
          accountNumber: accountNumber || null,
          notes: notes || null,
          createdBy: createdBy || 'system'
        }
      });

      // Return credit with employee information
      const credit = await prisma.credit.findUnique({
        where: { id: newCredit.id },
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

      res.status(201).json(credit);
    } catch (error) {
      console.error('Error creating credit:', error);
      res.status(500).json({ error: 'Error creating credit' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}