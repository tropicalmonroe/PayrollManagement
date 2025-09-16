import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getAdvances(req, res);
      case 'POST':
        return await createAdvance(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getAdvances(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { employeeId } = req.query;

    const whereClause: any = {};
    if (employeeId && typeof employeeId === 'string') {
      whereClause.employeeId = employeeId;
    }

    const advances = await prisma.advance.findMany({
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

    return res.status(200).json(advances);
  } catch (error) {
    console.error('Error fetching advances:', error);
    return res.status(500).json({ error: 'Error loading advances' });
  }
}

async function createAdvance(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      employeeId,
      amount,
      advanceDate,
      reason,
      numberOfInstallments,
      installmentAmount,
      remainingBalance,
      notes
    } = req.body;

    // Validation
    if (!employeeId || !amount || !advanceDate || !reason || !numberOfInstallments) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    if (numberOfInstallments <= 0 || numberOfInstallments > 24) {
      return res.status(400).json({ error: 'Number of installments must be between 1 and 24' });
    }

    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if employee has active advances
    const activeAdvances = await prisma.advance.findMany({
      where: {
        employeeId: employeeId,
        status: 'IN_PROGRESS'
      }
    });

    if (activeAdvances.length > 0) {
      return res.status(400).json({ 
        error: 'This employee already has an advance in progress. Please settle the existing advance first.' 
      });
    }

    // Create advance
    const advance = await prisma.advance.create({
      data: {
        employeeId,
        amount: parseFloat(amount),
        advanceDate: new Date(advanceDate),
        reason: reason.trim(),
        numberOfInstallments: parseInt(numberOfInstallments),
        installmentAmount: parseFloat(installmentAmount),
        remainingBalance: parseFloat(remainingBalance),
        status: 'IN_PROGRESS',
        createdBy: 'admin', // TODO: Get from session
        notes: notes?.trim() || null
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

    return res.status(201).json(advance);
  } catch (error) {
    console.error('Error creating advance:', error);
    return res.status(500).json({ error: 'Error creating advance' });
  }
}