import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getVariableElements(req, res);
      case 'POST':
        return await createVariableElement(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getVariableElements(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { employeeId, month, year, type } = req.query;

    const whereClause: any = {};
    
    if (employeeId && typeof employeeId === 'string') {
      whereClause.employeeId = employeeId;
    }
    
    if (month && typeof month === 'string') {
      whereClause.month = month;
    }
    
    if (year && typeof year === 'string') {
      whereClause.year = year;
    }
    
    if (type && typeof type === 'string') {
      whereClause.type = type;
    }

    const variableElements = await prisma.variableElement.findMany({
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
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { date: 'desc' }
      ]
    });

    return res.status(200).json(variableElements);
  } catch (error) {
    console.error('Error fetching variable elements:', error);
    return res.status(500).json({ error: 'Error loading variable elements' });
  }
}

async function createVariableElement(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      employeeId,
      type,
      description,
      amount,
      hours,
      rate,
      date,
      month,
      year
    } = req.body;

    // Validation
    if (!employeeId || !type || !description || !date || !month || !year) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Validation based on type
    if (type === 'OVERTIME' && (!hours || !rate)) {
      return res.status(400).json({ error: 'Hours and rate are required for overtime' });
    }

    if (type !== 'OVERTIME' && !amount) {
      return res.status(400).json({ error: 'Amount is required for this type of element' });
    }

    // Calculate amount for overtime
    let finalAmount = amount || 0;
    if (type === 'OVERTIME' && hours && rate) {
      finalAmount = parseFloat(hours) * parseFloat(rate);
    }

    // Create variable element
    const variableElement = await prisma.variableElement.create({
      data: {
        employeeId,
        type,
        description: description.trim(),
        amount: parseFloat(finalAmount.toString()),
        hours: hours ? parseFloat(hours) : null,
        rate: rate ? parseFloat(rate) : null,
        date: new Date(date),
        month,
        year
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

    return res.status(201).json(variableElement);
  } catch (error) {
    console.error('Error creating variable element:', error);
    return res.status(500).json({ error: 'Error creating variable element' });
  }
}