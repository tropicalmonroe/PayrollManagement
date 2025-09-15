import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { calculatePayroll, type EmployeePayrollData, type PayrollResult } from '../../../../lib/payrollCalculations';
import { getCurrentInstallment, calculateScheduleStatistics } from '../../../../lib/simplePaymentSchedule';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { employeeId, month, year } = req.body;

      if (!employeeId || !month || !year) {
        return res.status(400).json({ error: 'Missing parameters: employeeId, month, year required' });
      }

      // Get employee data
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
          credits: { 
            where: { status: 'ACTIVE' },
            include: {
              paymentSchedule: {
                where: { status: 'PENDING' },
                orderBy: { installmentNumber: 'asc' }
              }
            }
          },
          advances: {
            where: { status: 'IN_PROGRESS' }
          },
          variableElements: {
            where: {
              month: month,
              year: year
            }
          }
        }
      });

      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      // Calculate credit deductions for this month
      let totalHousingCredit = 0;
      let totalConsumerCredit = 0;
      let totalCreditInterest = 0;
      const creditDetails: any[] = [];

      for (const credit of employee.credits) {
        // Convert database installments to SimpleInstallment format
        const simpleInstallments = credit.paymentSchedule.map(e => ({
          installmentNumber: e.installmentNumber,
          dueDate: e.dueDate,
          amountToPay: e.totalMonthlyPayment, // Property name conversion
          status: e.status as 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED',
          notes: e.notes || undefined
        }));
        
        const currentInstallment = getCurrentInstallment(simpleInstallments);
        
        if (currentInstallment) {
          const monthlyAmount = currentInstallment.amountToPay;
          const installmentDB = credit.paymentSchedule.find(e => e.installmentNumber === currentInstallment.installmentNumber);
          const interest = installmentDB?.interest || 0;
          
          if (credit.type === 'HOUSING') {
            totalHousingCredit += monthlyAmount;
          } else if (credit.type === 'CONSUMER') {
            totalConsumerCredit += monthlyAmount;
          }
          
          totalCreditInterest += interest;
          
          creditDetails.push({
            creditId: credit.id,
            type: credit.type,
            bank: credit.bank,
            monthlyPayment: monthlyAmount,
            interest: interest,
            installmentNumber: currentInstallment.installmentNumber,
            dueDate: currentInstallment.dueDate,
            remainingPrincipal: installmentDB?.remainingPrincipal || 0
          });
        }
      }

      // Calculate ongoing advances
      let totalAdvances = 0;
      const advanceDetails: any[] = [];

      for (const advance of employee.advances) {
        totalAdvances += advance.installmentAmount;
        advanceDetails.push({
          advanceId: advance.id,
          installmentAmount: advance.installmentAmount,
          remainingBalance: advance.remainingBalance,
          reason: advance.reason
        });
      }

      // Prepare data for payroll calculation
      const payrollData: EmployeePayrollData = {
        lastName: employee.lastName,
        firstName: employee.firstName,
        employeeId: employee.employeeId,
        idNumber: employee.idNumber || '',
        nssfNumber: employee.nssfNumber || '',
        maritalStatus: employee.maritalStatus,
        dateOfBirth: employee.dateOfBirth || new Date(),
        hireDate: employee.hireDate,
        seniority: employee.seniority,
        numberOfDeductions: employee.numberOfDeductions || 0,
        numberOfDaysPerMonth: employee.numberOfDaysPerMonth,
        baseSalary: employee.baseSalary,
        housingAllowance: employee.housingAllowance,
        mealAllowance: employee.mealAllowance,
        transportAllowance: employee.transportAllowance,
        representationAllowance: employee.representationAllowance || 0,
        insurances: {
          comprehensiveHealthInsurance: false,
          foreignHealthCover: false,
          enhancedDisabilityCover: false
        },
        salaryAdvance: totalAdvances > 0 ? {
          monthlyAmount: totalAdvances
        } : undefined,
        variableElements: employee.variableElements.map(ve => ({
          ...ve,
          hours: ve.hours ?? undefined,
          rate: ve.rate ?? undefined,
          type: ['OVERTIME', 'ABSENCE', 'EXCEPTIONAL_BONUS', 'LEAVE', 'LATENESS', 'ADVANCE', 'OTHER'].includes(ve.type) ? ve.type : 'OTHER'

        })),
        bonuses: 0, // or calculate from ve.type === 'EXCEPTIONAL_BONUS'
        overtimePay: 0, // or calculate from ve.type === 'OVERTIME'
        loanRepayment: totalHousingCredit + totalConsumerCredit, // combine loans
        helbLoan: employee.helbLoan || 0,
        otherDeductions: 0,
        bankAccount: employee.bankAccount || '',
        bankBranch: employee.bankBranch || '',
        subjectToNssf: employee.subjectToNssf,
        subjectToShif: employee.subjectToShif,
        subjectToHousingLevy: employee.subjectToHousingLevy
      };

      // Calculate payroll with integrated credits
      const payrollResult = calculatePayroll(payrollData);

      // Save payroll calculation
      const payrollCalculation = await prisma.payrollCalculation.upsert({
        where: {
          employeeId_month_year: {
            employeeId,
            month,
            year
          }
        },
        update: {
          baseSalary: payrollResult.earnings.baseSalary,
          housingAllowance: payrollResult.earnings.housingAllowance,
          mealAllowance: payrollResult.earnings.mealAllowance,
          transportAllowance: payrollResult.earnings.transportAllowance,
          overtimePay: payrollResult.earnings.overtimePay ?? 0,
          bonuses: payrollResult.earnings.exceptionalBonuses ?? 0, // map correctly
          otherEarnings: payrollResult.earnings.otherEarnings ?? 0,
          grossSalary: payrollResult.grossSalary,
          taxableGrossSalary: payrollResult.taxableGrossSalary,
          nssfEmployee: payrollResult.employeeContributions.nssfEmployee,
          shif: payrollResult.employeeContributions.shifEmployee,
          paye: payrollResult.taxCalculation.incomeTax,
          otherDeductions: payrollResult.otherDeductions.totalOtherDeductions,
          totalDeductions: payrollResult.totalDeductions,
          nssfEmployer: payrollResult.employerContributions.nssfEmployer,
          housingLevyEmployer: payrollResult.employerContributions.housingLevy,
          totalEmployerContributions: payrollResult.employerContributions.totalEmployerContributions,
          netSalary: payrollResult.netSalaryPayable,
        },
        create: {
        employeeId,
        month,
        year,
        baseSalary: payrollResult.earnings.baseSalary,
        housingAllowance: payrollResult.earnings.housingAllowance,
        mealAllowance: payrollResult.earnings.mealAllowance,
        transportAllowance: payrollResult.earnings.transportAllowance,
        representationAllowance: payrollResult.earnings.representationAllowance ?? 0,
        overtimePay: payrollResult.earnings.overtimePay ?? 0,
        bonuses: payrollResult.earnings.bonuses ?? 0,
        otherEarnings: payrollResult.earnings.otherEarnings ?? 0,
        grossSalary: payrollResult.grossSalary,
        taxableGrossSalary: payrollResult.taxableGrossSalary,
        seniorityBonus: payrollResult.earnings.seniorityBonus ?? 0,
        // ✅ missing ones
        housingLevyEmployee: payrollResult.employeeContributions.housingLevy ?? 0,
        taxableIncome: payrollResult.taxCalculation.netTaxable ?? 0,
        nssfEmployee: payrollResult.employeeContributions.nssfEmployee,
        shif: payrollResult.employeeContributions.shifEmployee,
        paye: payrollResult.taxCalculation.incomeTax,
        // personalRelief -  ✅ required (default 2400, so optional in TS if you don’t supply)
        personalRelief: payrollResult.taxCalculation.personalRelief ?? 2400,
        helb: payrollResult.taxCalculation.helb ?? 0,
        otherDeductions: payrollResult.otherDeductions.totalOtherDeductions,
        totalDeductions: payrollResult.totalDeductions,
        nssfEmployer: payrollResult.employerContributions.nssfEmployer,
        housingLevyEmployer: payrollResult.employerContributions.housingLevy ?? 0,
        totalEmployerContributions: payrollResult.employerContributions.totalEmployerContributions,
        netSalary: payrollResult.netSalaryPayable,
}

      });

      res.status(200).json({
        message: 'Payroll calculation completed successfully',
        payrollCalculation,
        payrollResult,
        creditDetails,
        advanceDetails,
        summary: {
          totalHousingCredit,
          totalConsumerCredit,
          totalCreditInterest,
          totalAdvances,
          netSalary: payrollResult.netSalaryPayable,
          totalDeductions: payrollResult.totalDeductions
        }
      });

    } catch (error) {
      console.error('Error during payroll calculation with credits:', error);
      res.status(500).json({ error: 'Error during payroll calculation with credits' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}