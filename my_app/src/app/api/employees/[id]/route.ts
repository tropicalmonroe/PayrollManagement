import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Employee ID required' })
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getEmployee(id, res)
      case 'PUT':
        return await updateEmployee(id, req, res)
      case 'DELETE':
        return await deleteEmployee(id, res)
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getEmployee(id: string, res: NextApiResponse) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        payrollCalculations: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        advances: {
          where: { status: 'IN_PROGRESS' }
        },
        credits: {
          where: { status: 'ACTIVE' }
        }
      }
    })

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' })
    }

    return res.status(200).json(employee)
  } catch (error) {
    console.error('Error fetching employee:', error)
    return res.status(500).json({ error: 'Failed to fetch employee' })
  }
}

async function updateEmployee(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      employeeId,
      lastName,
      firstName,
      position,
      idNumber,
      nssfNumber,
      maritalStatus,
      dateOfBirth,
      hireDate,
      numberOfDeductions,
      numberOfDaysPerMonth,
      baseSalary,
      housingAllowance,
      mealAllowance,
      transportAllowance,
      representationAllowance,
      bankAccount,
      bankBranch,
      phone,
      email,
      address,
      status
    } = req.body

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    })

    if (!existingEmployee) {
      return res.status(404).json({ error: 'Employee not found' })
    }

    // Check employee ID uniqueness if changed
    if (employeeId && employeeId !== existingEmployee.employeeId) {
      const duplicateEmployeeId = await prisma.employee.findUnique({
        where: { employeeId }
      })

      if (duplicateEmployeeId) {
        return res.status(400).json({ 
          error: 'An employee with this ID already exists' 
        })
      }
    }

    // Check ID number uniqueness if changed
    if (idNumber && idNumber !== existingEmployee.idNumber) {
      const duplicateIdNumber = await prisma.employee.findUnique({
        where: { idNumber }
      })

      if (duplicateIdNumber) {
        return res.status(400).json({ 
          error: 'An employee with this ID number already exists' 
        })
      }
    }

    // Check NSSF number uniqueness if changed
    if (nssfNumber && nssfNumber !== existingEmployee.nssfNumber) {
      const duplicateNssfNumber = await prisma.employee.findUnique({
        where: { nssfNumber }
      })

      if (duplicateNssfNumber) {
        return res.status(400).json({ 
          error: 'An employee with this NSSF number already exists' 
        })
      }
    }

    // Recalculate seniority if hire date changed
    let seniority = existingEmployee.seniority

    if (hireDate && hireDate !== existingEmployee.hireDate.toISOString()) {
      const hireDateObj = new Date(hireDate)
      const today = new Date()
      seniority = Math.floor((today.getTime() - hireDateObj.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    }

    // Calculate final values for all required fields
    const finalHousingAllowance = housingAllowance !== undefined && housingAllowance !== null && housingAllowance !== '' 
      ? parseFloat(housingAllowance) || 0 
      : existingEmployee.housingAllowance
    const finalMealAllowance = mealAllowance !== undefined && mealAllowance !== null && mealAllowance !== '' 
      ? parseFloat(mealAllowance) || 0 
      : existingEmployee.mealAllowance
    const finalTransportAllowance = transportAllowance !== undefined && transportAllowance !== null && transportAllowance !== '' 
      ? parseFloat(transportAllowance) || 0 
      : existingEmployee.transportAllowance
    const finalRepresentationAllowance = representationAllowance !== undefined && representationAllowance !== null && representationAllowance !== '' 
      ? parseFloat(representationAllowance) || 0 
      : existingEmployee.representationAllowance

    // Calculate new gross salary
    const newBaseSalary = baseSalary !== undefined ? parseFloat(baseSalary) : existingEmployee.baseSalary
    const grossSalary = newBaseSalary + 
                      finalHousingAllowance + 
                      finalMealAllowance + 
                      finalTransportAllowance + 
                      finalRepresentationAllowance

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        ...(employeeId && { employeeId }),
        ...(lastName && { lastName: lastName }),
        ...(firstName && { firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase() }),
        ...(position && { position }),
        ...(idNumber !== undefined && { idNumber }),
        ...(nssfNumber !== undefined && { nssfNumber }),
        ...(maritalStatus && { maritalStatus }),
        ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }),
        ...(hireDate && { hireDate: new Date(hireDate) }),
        ...(numberOfDeductions !== undefined && { numberOfDeductions: parseInt(numberOfDeductions) }),
        ...(numberOfDaysPerMonth !== undefined && { numberOfDaysPerMonth: parseInt(numberOfDaysPerMonth) }),
        ...(baseSalary !== undefined && { baseSalary: newBaseSalary }),
        seniority,
        housingAllowance: finalHousingAllowance,
        mealAllowance: finalMealAllowance,
        transportAllowance: finalTransportAllowance,
        representationAllowance: finalRepresentationAllowance,
        grossSalary,
        taxableGrossSalary: grossSalary,
        ...(bankAccount !== undefined && { bankAccount }),
        ...(bankBranch !== undefined && { bankBranch }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(status && { status })
      }
    })

    return res.status(200).json(updatedEmployee)
  } catch (error) {
    console.error('Error updating employee:', error)
    return res.status(500).json({ error: 'Failed to update employee' })
  }
}

async function deleteEmployee(id: string, res: NextApiResponse) {
  try {
    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    })

    if (!existingEmployee) {
      return res.status(404).json({ error: 'Employee not found' })
    }

    // Delete employee (related records will be cascade deleted)
    await prisma.employee.delete({
      where: { id }
    })

    return res.status(200).json({ message: 'Employee deleted successfully' })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return res.status(500).json({ error: 'Failed to delete employee' })
  }
}