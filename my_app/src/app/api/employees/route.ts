import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      employeeId,
      lastName,
      firstName,
      position,
      idNumber,
      kraPin,
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
      useNssfEmployee, // From EmployeeForm
      useShifEmployee, // From EmployeeForm
      useHousingLevy,  // From EmployeeForm
    } = data;

    // Required field validation
    if (!employeeId || !lastName || !firstName || !position || !hireDate || !baseSalary) {
      return NextResponse.json(
        { error: 'Employee ID, last name, first name, position, hire date, and base salary are required' },
        { status: 400 }
      );
    }

    // Type validation
    if (isNaN(parseFloat(baseSalary))) {
      return NextResponse.json(
        { error: 'Base salary must be a valid number' },
        { status: 400 }
      );
    }

    // Validate optional numeric fields
    const parsedHousingAllowance = housingAllowance ? parseFloat(housingAllowance) : 0;
    const parsedMealAllowance = mealAllowance ? parseFloat(mealAllowance) : 0;
    const parsedTransportAllowance = transportAllowance ? parseFloat(transportAllowance) : 0;
    const parsedRepresentationAllowance = representationAllowance ? parseFloat(representationAllowance) : 0;
    const parsedNumberOfDeductions = numberOfDeductions ? parseInt(numberOfDeductions, 10) : 0;
    const parsedNumberOfDaysPerMonth = numberOfDaysPerMonth ? parseInt(numberOfDaysPerMonth, 10) : 26;

    if (
      [parsedHousingAllowance, parsedMealAllowance, parsedTransportAllowance, parsedRepresentationAllowance].some(
        (val) => isNaN(val)
      )
    ) {
      return NextResponse.json(
        { error: 'Allowances must be valid numbers' },
        { status: 400 }
      );
    }

    if (isNaN(parsedNumberOfDeductions) || isNaN(parsedNumberOfDaysPerMonth)) {
      return NextResponse.json(
        { error: 'Number of deductions and days per month must be valid integers' },
        { status: 400 }
      );
    }

    // Validate dates
    const parsedHireDate = new Date(hireDate);
    if (isNaN(parsedHireDate.getTime())) {
      return NextResponse.json(
        { error: 'Hire date must be a valid date' },
        { status: 400 }
      );
    }

    const parsedDateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (dateOfBirth && isNaN(parsedDateOfBirth!.getTime())) {
      return NextResponse.json(
        { error: 'Date of birth must be a valid date' },
        { status: 400 }
      );
    }

    // Check unique constraints
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        OR: [
          { employeeId },
          idNumber ? { idNumber } : {},
          kraPin ? { kraPin } : {},
          nssfNumber ? { nssfNumber } : {},
        ].filter((condition) => Object.keys(condition).length > 0),
      },
    });

    if (existingEmployee) {
      const field = existingEmployee.employeeId === employeeId ? 'employee ID' :
                    existingEmployee.idNumber === idNumber ? 'ID number' :
                    existingEmployee.kraPin === kraPin ? 'KRA PIN' :
                    'NSSF number';
      return NextResponse.json(
        { error: `An employee with this ${field} already exists` },
        { status: 400 }
      );
    }

    // Calculate seniority
    const today = new Date();
    const seniority = Math.floor((today.getTime() - parsedHireDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));

    // Calculate gross salary
    const grossSalary =
      parseFloat(baseSalary) +
      parsedHousingAllowance +
      parsedMealAllowance +
      parsedTransportAllowance +
      parsedRepresentationAllowance;

    const employee = await prisma.employee.create({
      data: {
        employeeId,
        lastName: lastName.toUpperCase(),
        firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase(),
        position,
        idNumber,
        kraPin,
        nssfNumber,
        maritalStatus: maritalStatus || 'SINGLE',
        dateOfBirth: parsedDateOfBirth,
        hireDate: parsedHireDate,
        seniority,
        numberOfDeductions: parsedNumberOfDeductions,
        numberOfDaysPerMonth: parsedNumberOfDaysPerMonth,
        baseSalary: parseFloat(baseSalary),
        housingAllowance: parsedHousingAllowance,
        mealAllowance: parsedMealAllowance,
        transportAllowance: parsedTransportAllowance,
        representationAllowance: parsedRepresentationAllowance,
        grossSalary,
        taxableGrossSalary: grossSalary,
        netSalary: 0,
        bankAccount,
        bankBranch,
        phone,
        email,
        address,
        subjectToNssf: useNssfEmployee !== undefined ? useNssfEmployee : true,
        subjectToShif: useShifEmployee !== undefined ? useShifEmployee : true,
        subjectToHousingLevy: useHousingLevy !== undefined ? useHousingLevy : true,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create employee' },
      { status: 500 }
    );
  }
}
