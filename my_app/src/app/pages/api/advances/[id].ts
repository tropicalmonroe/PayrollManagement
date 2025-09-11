import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid advance ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getAdvance(req, res, id);
      case 'PUT':
        return await updateAdvance(req, res, id);
      case 'DELETE':
        return await deleteAdvance(req, res, id);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getAdvance(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const advance = await prisma.advance.findUnique({
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

    if (!advance) {
      return res.status(404).json({ error: 'Advance not found' });
    }

    return res.status(200).json(advance);
  } catch (error) {
    console.error('Error fetching advance:', error);
    return res.status(500).json({ error: 'Error loading advance' });
  }
}

async function updateAdvance(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const {
      amount,
      advanceDate,
      reason,
      numberOfInstallments,
      installmentAmount,
      remainingBalance,
      status,
      notes
    } = req.body;

    // Check if advance exists
    const existingAdvance = await prisma.advance.findUnique({
      where: { id }
    });

    if (!existingAdvance) {
      return res.status(404).json({ error: 'Advance not found' });
    }

    // Validation
    if (amount !== undefined && amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    if (numberOfInstallments !== undefined && (numberOfInstallments <= 0 || numberOfInstallments > 24)) {
      return res.status(400).json({ error: 'Number of installments must be between 1 and 24' });
    }

    if (remainingBalance !== undefined && remainingBalance < 0) {
      return res.status(400).json({ error: 'Remaining balance cannot be negative' });
    }

    // Prepare update data
    const updateData: any = {};
    
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (advanceDate !== undefined) updateData.advanceDate = new Date(advanceDate);
    if (reason !== undefined) updateData.reason = reason.trim();
    if (numberOfInstallments !== undefined) updateData.numberOfInstallments = parseInt(numberOfInstallments);
    if (installmentAmount !== undefined) updateData.installmentAmount = parseFloat(installmentAmount);
    if (remainingBalance !== undefined) {
      updateData.remainingBalance = parseFloat(remainingBalance);
      // Auto-update status based on remaining balance
      if (parseFloat(remainingBalance) === 0) {
        updateData.status = 'REPAID';
        updateData.fullRepaymentDate = new Date();
      } else if (updateData.status !== 'CANCELLED') {
        updateData.status = 'IN_PROGRESS';
      }
    }
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;

    // Update advance
    const advance = await prisma.advance.update({
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

    return res.status(200).json(advance);
  } catch (error) {
    console.error('Error updating advance:', error);
    return res.status(500).json({ error: 'Error updating advance' });
  }
}

async function deleteAdvance(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // Check if advance exists
    const existingAdvance = await prisma.advance.findUnique({
      where: { id }
    });

    if (!existingAdvance) {
      return res.status(404).json({ error: 'Advance not found' });
    }

    // Delete advance
    await prisma.advance.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'Advance successfully deleted' });
  } catch (error) {
    console.error('Error deleting advance:', error);
    return res.status(500).json({ error: 'Error deleting advance' });
  }
}