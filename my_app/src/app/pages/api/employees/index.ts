import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        return await getEmployees(req, res)
      case 'POST':
        return await createEmployee(req, res)
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getEmployees(req: NextApiRequest, res: NextApiResponse) {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return res.status(200).json(employees)
  } catch (error) {
    console.error('Error fetching employees:', error)
    return res.status(500).json({ error: 'Failed to fetch employees' })
  }
}

async function createEmployee(req: NextApiRequest, res: NextApiResponse) {
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
      // Insurance options (optional)
      subjectToNssf,
      subjectToShif,
      subjectToHousingLevy
    } = req.body

    // Required field validation
    if (!employeeId || !lastName || !firstName || !position || !hireDate || !baseSalary) {
      return res.status(400).json({ 
        error: 'Employee ID, last name, first name, position, hire date and base salary are required fields' 
      })
    }

    // Check employee ID uniqueness
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeId }
    })

    if (existingEmployee) {
      return res.status(400).json({ 
        error: 'An employee with this ID already exists' 
      })
    }

    // Check ID number uniqueness if provided
    if (idNumber) {
      const existingIdNumber = await prisma.employee.findUnique({
        where: { idNumber }
      })

      if (existingIdNumber) {
        return res.status(400).json({ 
          error: 'An employee with this ID number already exists' 
        })
      }
    }

    // Check NSSF number uniqueness if provided
    if (nssfNumber) {
      const existingNssfNumber = await prisma.employee.findUnique({
        where: { nssfNumber }
      })

      if (existingNssfNumber) {
        return res.status(400).json({ 
          error: 'An employee with this NSSF number already exists' 
        })
      }
    }

    // Calculate seniority in years
    const hireDateObj = new Date(hireDate)
    const today = new Date()
    const seniority = Math.floor((today.getTime() - hireDateObj.getTime()) / (1000 * 60 * 60 * 24 * 365.25))

    // Calculate gross salary
    const grossSalary = baseSalary + (housingAllowance || 0) + (mealAllowance || 0) + 
                        (transportAllowance || 0) + (representationAllowance || 0)

    const employee = await prisma.employee.create({
      data: {
        employeeId,
        lastName: lastName.toUpperCase(),
        firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase(),
        position,
        idNumber,
        nssfNumber,
        maritalStatus: maritalStatus || 'SINGLE',
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        hireDate: new Date(hireDate),
        seniority,
        numberOfDeductions: numberOfDeductions || 0,
        numberOfDaysPerMonth: numberOfDaysPerMonth || 26,
        baseSalary: parseFloat(baseSalary),
        housingAllowance: parseFloat(housingAllowance || 0),
        mealAllowance: parseFloat(mealAllowance || 0),
        transportAllowance: parseFloat(transportAllowance || 0),
        representationAllowance: parseFloat(representationAllowance || 0),
        grossSalary,
        taxableGrossSalary: grossSalary,
        netSalary: 0, // Will be calculated during payroll processing
        bankAccount,
        bankBranch,
        phone,
        email,
        address,
        // Insurance options
        subjectToNssf: subjectToNssf !== undefined ? subjectToNssf : true,
        subjectToShif: subjectToShif !== undefined ? subjectToShif : true,
        subjectToHousingLevy: subjectToHousingLevy !== undefined ? subjectToHousingLevy : true
      }
    })

    return res.status(201).json(employee)
  } catch (error) {
    console.error('Error creating employee:', error)
    return res.status(500).json({ error: 'Failed to create employee' })
  }
}