import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// GET /api/employees/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Employee ID required' }, { status: 400 })
  }

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
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 })
  }
}

// PUT /api/employees/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Employee ID required' }, { status: 400 })
  }

  try {
    const body = await request.json()
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
    } = body

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    })

    if (!existingEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Check employee ID uniqueness if changed
    if (employeeId && employeeId !== existingEmployee.employeeId) {
      const duplicateEmployeeId = await prisma.employee.findUnique({
        where: { employeeId }
      })

      if (duplicateEmployeeId) {
        return NextResponse.json({ 
          error: 'An employee with this ID already exists' 
        }, { status: 400 })
      }
    }

    // Check ID number uniqueness if changed
    if (idNumber && idNumber !== existingEmployee.idNumber) {
      const duplicateIdNumber = await prisma.employee.findUnique({
        where: { idNumber }
      })

      if (duplicateIdNumber) {
        return NextResponse.json({ 
          error: 'An employee with this ID number already exists' 
        }, { status: 400 })
      }
    }

    // Check NSSF number uniqueness if changed
    if (nssfNumber && nssfNumber !== existingEmployee.nssfNumber) {
      const duplicateNssfNumber = await prisma.employee.findUnique({
        where: { nssfNumber }
      })

      if (duplicateNssfNumber) {
        return NextResponse.json({ 
          error: 'An employee with this NSSF number already exists' 
        }, { status: 400 })
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

    return NextResponse.json(updatedEmployee)
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
  }
}

// DELETE /api/employees/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Employee ID required' }, { status: 400 })
  }

  try {
    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    })

    if (!existingEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Delete employee (related records will be cascade deleted)
    await prisma.employee.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Employee deleted successfully' })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 })
  }
}