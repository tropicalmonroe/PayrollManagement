import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { DocumentType, DocumentStatus } from '@prisma/client';
import { generatePayslipPDF, PayslipData } from '../../../../../lib/pdfGenerators/payslipPDF';
import { calculatePayroll, type EmployeePayrollData } from '../../../../../lib/payrollCalculations';

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

    // Check if employee exists with relations
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        variableElements: true,
        advances: true
      }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Calculate seniority in years
    const getSeniorityInYears = (hireDate: Date) => {
      const today = new Date();
      const hire = new Date(hireDate);
      const years = today.getFullYear() - hire.getFullYear();
      const months = today.getMonth() - hire.getMonth();
      
      let totalMonths = years * 12 + months;
      if (today.getDate() < hire.getDate()) {
        totalMonths--;
      }
      
      return totalMonths / 12;
    };

    // Calculate bonuses and overtime from variableElements
    const bonuses = employee.variableElements
      ?.filter((v) => v.type === 'BONUS')
      .reduce((sum: number, v) => sum + v.amount, 0) || 0;

    const overtimePay = employee.variableElements
      ?.filter((v) => v.type === 'OVERTIME')
      .reduce((sum: number, v) => sum + v.amount, 0) || 0;

    // Calculate salary advance from advances
    const salaryAdvance = employee.advances?.length
      ? { monthlyAmount: employee.advances.reduce((sum: number, a) => sum + a.installmentAmount, 0) }
      : undefined;

    // Prepare employee data for calculation
    const employeeData: EmployeePayrollData = {
      lastName: employee.lastName,
      firstName: employee.firstName,
      employeeId: employee.employeeId,
      idNumber: employee.idNumber || '',
      nssfNumber: employee.nssfNumber || '',
      maritalStatus: employee.maritalStatus,
      dateOfBirth: employee.dateOfBirth || new Date(),
      hireDate: employee.hireDate,
      seniority: getSeniorityInYears(employee.hireDate),
      numberOfDeductions: employee.numberOfDeductions,
      numberOfDaysPerMonth: employee.numberOfDaysPerMonth || 26,
      baseSalary: employee.baseSalary,
      housingAllowance: employee.housingAllowance,
      mealAllowance: employee.mealAllowance,
      transportAllowance: employee.transportAllowance,
      representationAllowance: employee.representationAllowance,
      insurances: {
        comprehensiveHealthInsurance: false,
        foreignHealthCover: false,
        enhancedDisabilityCover: false,
      },
      mortgageCredit: employee.loanRepayment ? {
        monthlyAmount: employee.loanRepayment || 0,
        interest: 0,
      } : undefined,
      consumerCredit: employee.helbLoan ? {
        monthlyAmount: employee.helbLoan,
      } : undefined,
      salaryAdvance,
      bankAccount: employee.bankAccount || '',
      bankBranch: employee.bankBranch || '',
      useNssfEmployee: employee.subjectToNssf,
      useShifEmployee: employee.subjectToShif,
      usePensionEmployee: false,
      useInsuranceDiversifiedEmployee: false,
      bonuses,
      overtimePay,
      loanRepayment: employee.loanRepayment,
      deductibleInterest: 0,
      otherDeductions: 0,
      helbLoan: employee.helbLoan,
      subjectToNssf: employee.subjectToNssf,
      subjectToShif: employee.subjectToShif,
      subjectToHousingLevy: employee.subjectToHousingLevy
    };

    // ✅ PERFORM PAYROLL CALCULATION
    const payrollResult = calculatePayroll(employeeData);

    // ✅ CRITICAL: SAVE TO PAYROLLCALCULATION MODEL
    const payrollCalculation = await prisma.payrollCalculation.upsert({
      where: {
        employeeId_month_year: {
          employeeId,
          month,
          year
        }
      },
      create: {
        employeeId,
        month,
        year,
        // Earnings
        baseSalary: payrollResult.earnings.baseSalary,
        housingAllowance: payrollResult.earnings.housingAllowance,
        mealAllowance: payrollResult.earnings.mealAllowance,
        transportAllowance: payrollResult.earnings.transportAllowance,
        representationAllowance: payrollResult.earnings.representationAllowance,
        overtimePay: payrollResult.earnings.overtimePay || 0,
        bonuses: payrollResult.earnings.bonuses,
        otherEarnings: payrollResult.earnings.otherEarnings || 0,
        seniorityBonus: payrollResult.earnings.seniorityBonus,
        grossSalary: payrollResult.grossSalary,
        taxableGrossSalary: payrollResult.taxableGrossSalary,
        // Employee statutory deductions
        nssfEmployee: payrollResult.employeeContributions.nssfEmployee,
        shif: payrollResult.employeeContributions.shifEmployee,
        housingLevyEmployee: payrollResult.employeeContributions.housingLevy,
        paye: payrollResult.taxCalculation.incomeTax,
        personalRelief: payrollResult.taxCalculation.personalRelief,
        helb: payrollResult.otherDeductions.consumerCredit,
        otherDeductions: payrollResult.otherDeductions.totalOtherDeductions,
        totalDeductions: payrollResult.totalDeductions,
        // Employer contributions
        nssfEmployer: payrollResult.employerContributions.nssfEmployer,
        housingLevyEmployer: payrollResult.employerContributions.housingLevy,
        totalEmployerContributions: payrollResult.employerContributions.totalEmployerContributions,
        // Final
        taxableIncome: payrollResult.taxCalculation.taxableNet,
        netSalary: payrollResult.netSalaryPayable
      },
      update: {
        // Update all fields if record exists
        baseSalary: payrollResult.earnings.baseSalary,
        housingAllowance: payrollResult.earnings.housingAllowance,
        mealAllowance: payrollResult.earnings.mealAllowance,
        transportAllowance: payrollResult.earnings.transportAllowance,
        representationAllowance: payrollResult.earnings.representationAllowance,
        overtimePay: payrollResult.earnings.overtimePay || 0,
        bonuses: payrollResult.earnings.bonuses,
        otherEarnings: payrollResult.earnings.otherEarnings || 0,
        seniorityBonus: payrollResult.earnings.seniorityBonus,
        grossSalary: payrollResult.grossSalary,
        taxableGrossSalary: payrollResult.taxableGrossSalary,
        nssfEmployee: payrollResult.employeeContributions.nssfEmployee,
        shif: payrollResult.employeeContributions.shifEmployee,
        housingLevyEmployee: payrollResult.employeeContributions.housingLevy,
        paye: payrollResult.taxCalculation.incomeTax,
        personalRelief: payrollResult.taxCalculation.personalRelief,
        helb: payrollResult.otherDeductions.consumerCredit,
        otherDeductions: payrollResult.otherDeductions.totalOtherDeductions,
        totalDeductions: payrollResult.totalDeductions,
        nssfEmployer: payrollResult.employerContributions.nssfEmployer,
        housingLevyEmployer: payrollResult.employerContributions.housingLevy,
        totalEmployerContributions: payrollResult.employerContributions.totalEmployerContributions,
        taxableIncome: payrollResult.taxCalculation.taxableNet,
        netSalary: payrollResult.netSalaryPayable
      }
    });

    console.log('✅ Payroll calculation saved:', payrollCalculation.id);

    // Check if a payslip document already exists for this period
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
          document: existingDocument,
          payrollCalculation // Return the saved calculation
        },
        { status: 409 }
      );
    }

    // Prepare data for PDF - USE CALCULATED RESULTS
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
        month: parseInt(month),
        year: year.toString(),
        baseSalary: payrollCalculation.baseSalary, // Use from saved calculation
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
        generatedBy: 'system',
        fileSize: pdfBuffer.length,
        status: DocumentStatus.GENERATED,
        metadata: {
          payrollCalculationId: payrollCalculation.id, // Link to payroll calculation
          grossSalary: payrollCalculation.grossSalary,
          netSalary: payrollCalculation.netSalary,
          totalDeductions: payrollCalculation.totalDeductions,
          detailedBreakdown: {
            nssf: payrollCalculation.nssfEmployee,
            shif: payrollCalculation.shif,
            housingLevy: payrollCalculation.housingLevyEmployee,
            paye: payrollCalculation.paye
          }
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

    console.log('✅ Payslip document created:', document.id);

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

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}