import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { DocumentType, DocumentStatus } from '@prisma/client';
import { generatePayslipPDF, PayslipData } from '../../../../../lib/pdfGenerators/payslipPDF';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, month, year } = body;

    if (!employeeId || !month || !year) {
      return NextResponse.json(
        { error: 'employeeId, month and year parameters are required' },
        { status: 400 }
      );
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Check if payroll calculation exists for this period
    let payrollCalculation = await prisma.payrollCalculation.findFirst({
      where: {
        employeeId,
        month,
        year: year.toString()
      }
    });

    // If no calculation found, create a basic calculation
    if (!payrollCalculation) {
      // Calculate basic payroll components according to Kenyan regulations
      const grossSalary = employee.baseSalary + employee.housingAllowance + employee.mealAllowance + employee.transportAllowance + employee.representationAllowance;
      
      // Kenyan statutory deductions (simplified calculation)
      const nssfEmployee = Math.min(grossSalary * 0.06, 4320); // 6% up to max of 4320
      const shif = grossSalary * 0.0275; // 2.75% of gross
      const housingLevyEmployee = grossSalary * 0.015; // 1.5% of gross
      
      // Simplified PAYE calculation (this would need proper tax brackets)
      const taxableIncome = grossSalary - nssfEmployee - shif - housingLevyEmployee;
      const paye = Math.max(0, taxableIncome * 0.25 - 2400); // Simplified tax calculation
      
      const totalDeductions = nssfEmployee + shif + housingLevyEmployee + paye;
      const netSalary = grossSalary - totalDeductions;

      // Employer contributions
      const nssfEmployer = Math.min(grossSalary * 0.06, 4320); // 6% up to max of 4320
      const housingLevyEmployer = grossSalary * 0.015; // 1.5% of gross
      const totalEmployerContributions = nssfEmployer + housingLevyEmployer;

      payrollCalculation = await prisma.payrollCalculation.create({
        data: {
          employeeId,
          month,
          year: year.toString(),
          baseSalary: employee.baseSalary,
          housingAllowance: employee.housingAllowance,
          mealAllowance: employee.mealAllowance,
          transportAllowance: employee.transportAllowance,
          representationAllowance: employee.representationAllowance,
          overtimePay: 0,
          bonuses: 0,
          otherEarnings: 0,
          grossSalary,
          taxableGrossSalary: grossSalary,
          nssfEmployee,
          shif,
          housingLevyEmployee,
          paye,
          personalRelief: 2400,
          helb: 0,
          otherDeductions: 0,
          totalDeductions,
          nssfEmployer,
          housingLevyEmployer,
          totalEmployerContributions,
          taxableIncome,
          netSalary
        }
      });
    }

    // Check if a payslip already exists for this period
    const existingDocument = await prisma.document.findFirst({
      where: {
        type: DocumentType.PAYSLIP,
        employeeId,
        period: `${month} ${year}`
      }
    });

    if (existingDocument) {
      return NextResponse.json(
        { 
          error: 'A payslip already exists for this period',
          document: existingDocument
        },
        { status: 409 }
      );
    }

    // Prepare data for PDF
    const payslipData: PayslipData = {
      employee: {
        employeeId: employee.employeeId,
        lastName: employee.lastName,
        firstName: employee.firstName,
        position: employee.position,
        hireDate: employee.hireDate,
        seniority: employee.seniority,
        maritalStatus: employee.maritalStatus,
        idNumber: employee.idNumber || '',
        nssfNumber: employee.nssfNumber || ''
      },
      payroll: {
        month,
        year: year.toString(),
        baseSalary: payrollCalculation.baseSalary,
        housingAllowance: payrollCalculation.housingAllowance,
        mealAllowance: payrollCalculation.mealAllowance,
        transportAllowance: payrollCalculation.transportAllowance,
        representationAllowance: payrollCalculation.representationAllowance,
        overtimePay: payrollCalculation.overtimePay,
        bonuses: payrollCalculation.bonuses,
        otherEarnings: payrollCalculation.otherEarnings,
        grossSalary: payrollCalculation.grossSalary,
        nssfEmployee: payrollCalculation.nssfEmployee,
        shif: payrollCalculation.shif,
        housingLevyEmployee: payrollCalculation.housingLevyEmployee,
        paye: payrollCalculation.paye,
        personalRelief: payrollCalculation.personalRelief,
        helb: payrollCalculation.helb,
        otherDeductions: payrollCalculation.otherDeductions,
        totalDeductions: payrollCalculation.totalDeductions,
        netSalary: payrollCalculation.netSalary,
        nssfEmployer: payrollCalculation.nssfEmployer,
        housingLevyEmployer: payrollCalculation.housingLevyEmployer,
        totalEmployerContributions: payrollCalculation.totalEmployerContributions
      }
    };

    // Generate PDF
    const pdfBuffer = await generatePayslipPDF(payslipData);

    // Create payslip document
    const document = await prisma.document.create({
      data: {
        type: DocumentType.PAYSLIP,
        title: `Payslip - ${employee.firstName} ${employee.lastName} - ${month} ${year}`,
        description: `Payslip for period ${month} ${year}`,
        employeeId,
        period: `${month} ${year}`,
        generatedBy: 'system', // Replace with logged-in user ID
        fileSize: pdfBuffer.length,
        status: DocumentStatus.GENERATED,
        metadata: {
          payrollCalculationId: payrollCalculation.id,
          grossSalary: payrollCalculation.grossSalary,
          netSalary: payrollCalculation.netSalary,
          totalDeductions: payrollCalculation.totalDeductions
        }
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

    // Return PDF directly
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="payslip-${employee.employeeId}-${month}-${year}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating payslip:', error);
    return NextResponse.json(
      { error: 'Error generating payslip' },
      { status: 500 }
    );
  }
}

// Optional: Add other HTTP methods if needed
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}