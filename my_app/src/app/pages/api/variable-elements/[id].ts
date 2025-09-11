import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid variable element ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getVariableElement(req, res, id);
      case 'PUT':
        return await updateVariableElement(req, res, id);
      case 'DELETE':
        return await deleteVariableElement(req, res, id);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getVariableElement(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const variableElement = await prisma.variableElement.findUnique({
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

    if (!variableElement) {
      return res.status(404).json({ error: 'Variable element not found' });
    }

    return res.status(200).json(variableElement);
  } catch (error) {
    console.error('Error fetching variable element:', error);
    return res.status(500).json({ error: 'Error loading variable element' });
  }
}

async function updateVariableElement(req: NextApiRequest, res: NextApiResponse, id: string) {
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

    // Check if element exists
    const existingElement = await prisma.variableElement.findUnique({
      where: { id }
    });

    if (!existingElement) {
      return res.status(404).json({ error: 'Variable element not found' });
    }

    // Validation
    if (employeeId) {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId }
      });

      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
    }

    // Validation based on type
    if (type === 'OVERTIME' && (!hours || !rate)) {
      return res.status(400).json({ error: 'Hours and rate are required for overtime' });
    }

    if (type && type !== 'OVERTIME' && !amount) {
      return res.status(400).json({ error: 'Amount is required for this type of element' });
    }

    // Prepare update data
    const updateData: any = {};
    
    if (employeeId !== undefined) updateData.employeeId = employeeId;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description.trim();
    if (date !== undefined) updateData.date = new Date(date);
    if (month !== undefined) updateData.month = month;
    if (year !== undefined) updateData.year = year;

    // Calculate amount for overtime
    if (type === 'OVERTIME' && hours && rate) {
      updateData.amount = parseFloat(hours) * parseFloat(rate);
      updateData.hours = parseFloat(hours);
      updateData.rate = parseFloat(rate);
    } else {
      if (amount !== undefined) updateData.amount = parseFloat(amount);
      if (hours !== undefined) updateData.hours = hours ? parseFloat(hours) : null;
      if (rate !== undefined) updateData.rate = rate ? parseFloat(rate) : null;
    }

    // Update variable element
    const variableElement = await prisma.variableElement.update({
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

    return res.status(200).json(variableElement);
  } catch (error) {
    console.error('Error updating variable element:', error);
    return res.status(500).json({ error: 'Error updating variable element' });
  }
}

async function deleteVariableElement(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // Check if element exists
    const existingElement = await prisma.variableElement.findUnique({
      where: { id }
    });

    if (!existingElement) {
      return res.status(404).json({ error: 'Variable element not found' });
    }

    // Delete variable element
    await prisma.variableElement.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'Variable element deleted successfully' });
  } catch (error) {
    console.error('Error deleting variable element:', error);
    return res.status(500).json({ error: 'Error deleting variable element' });
  }
}