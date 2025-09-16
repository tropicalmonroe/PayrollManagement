import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const { advanceId, remainingBalance } = req.body;

    // Validation
    if (!advanceId) {
      return res.status(400).json({ error: 'Advance ID required' });
    }

    if (remainingBalance === undefined || remainingBalance < 0) {
      return res.status(400).json({ error: 'Remaining balance must be a positive number or zero' });
    }

    // Check if advance exists
    const existingAdvance = await prisma.advance.findUnique({
      where: { id: advanceId },
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

    if (!existingAdvance) {
      return res.status(404).json({ error: 'Advance not found' });
    }

    // Validate that the new remaining balance doesn't exceed the original amount
    if (parseFloat(remainingBalance) > existingAdvance.amount) {
      return res.status(400).json({ 
        error: 'Remaining balance cannot be greater than the initial advance amount' 
      });
    }

    // Prepare update data
    const updateData: any = {
      remainingBalance: parseFloat(remainingBalance)
    };

    // Auto-update status based on remaining balance
    if (parseFloat(remainingBalance) === 0) {
      updateData.status = 'REPAID';
      updateData.fullRepaymentDate = new Date();
    } else if (existingAdvance.status !== 'CANCELLED') {
      updateData.status = 'IN_PROGRESS';
      updateData.fullRepaymentDate = null;
    }

    // Update advance
    const updatedAdvance = await prisma.advance.update({
      where: { id: advanceId },
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

    // Calculate progress information
    const amountRepaid = updatedAdvance.amount - updatedAdvance.remainingBalance;
    const progressPercentage = (amountRepaid / updatedAdvance.amount) * 100;

    // Calculate expected progress based on time elapsed
    const startDate = new Date(updatedAdvance.advanceDate);
    const now = new Date();
    const monthsElapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const expectedProgress = Math.min(100, (monthsElapsed / updatedAdvance.numberOfInstallments) * 100);
    const isLate = progressPercentage < expectedProgress && updatedAdvance.status === 'IN_PROGRESS';

    const response = {
      ...updatedAdvance,
      calculatedProgress: {
        progressPercentage: Math.round(progressPercentage * 100) / 100,
        amountRepaid: amountRepaid,
        isLate: isLate,
        monthsElapsed: monthsElapsed,
        expectedProgress: Math.round(expectedProgress * 100) / 100
      }
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error updating advance progress:', error);
    return res.status(500).json({ error: 'Error updating progress' });
  }
}