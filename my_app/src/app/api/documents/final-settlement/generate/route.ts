import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import { DocumentType, DocumentStatus } from '@prisma/client';
import { generateFinalSettlementPDF, FinalSettlementData } from '../../../../../lib/pdfGenerators/finalSettlementPDF';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { 
        employeeId, 
        endDate, 
        departureReason, 
        unusedLeave, 
        severancePay, 
        otherAllowances,
        deductions 
      } = req.body;

      if (!employeeId || !endDate || !departureReason) {
        return res.status(400).json({ 
          error: 'employeeId, endDate and departureReason parameters are required' 
        });
      }

      // Check if employee exists
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId }
      });

      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      // Get last payroll calculation
      const lastPayrollCalculation = await prisma.payrollCalculation.findFirst({
        where: { employeeId },
        orderBy: { createdAt: 'desc' }
      });

      // Get unpaid advances
      const unpaidAdvances = await prisma.advance.findMany({
        where: {
          employeeId,
          status: 'IN_PROGRESS'
        }
      });

      // Get active credits
      const activeCredits = await prisma.credit.findMany({
        where: {
          employeeId,
          status: 'ACTIVE'
        }
      });

      // Calculate amounts
      const baseSalary = employee.baseSalary;
      const unusedLeaveAmount = parseFloat(unusedLeave) || 0;
      const severancePayAmount = parseFloat(severancePay) || 0;
      const otherAllowancesAmount = parseFloat(otherAllowances) || 0;
      const deductionsAmount = parseFloat(deductions) || 0;

      // Calculate total advances to deduct
      const totalAdvances = unpaidAdvances.reduce((sum, advance) => sum + advance.remainingBalance, 0);

      // Calculate total credits to deduct
      const totalCredits = activeCredits.reduce((sum, credit) => sum + credit.remainingBalance, 0);

      // Balance calculations
      const totalEarnings = baseSalary + unusedLeaveAmount + severancePayAmount + otherAllowancesAmount;
      const totalDeductions = deductionsAmount + totalAdvances + totalCredits;
      const netBalance = totalEarnings - totalDeductions;

      const period = new Date(endDate).toLocaleDateString('en-US');

      // Prepare data for PDF
      const settlementData: FinalSettlementData = {
        employee: {
          employeeId: employee.employeeId,
          lastName: employee.lastName,
          firstName: employee.firstName,
          position: employee.position,
          hireDate: employee.hireDate,
          seniority: employee.seniority
        },
        settlement: {
          endDate: new Date(endDate),
          departureReason,
          baseSalary,
          unusedLeave: unusedLeaveAmount,
          severancePay: severancePayAmount,
          otherAllowances: otherAllowancesAmount,
          deductions: deductionsAmount,
          totalAdvances,
          totalCredits,
          totalEarnings,
          totalDeductions,
          netBalance
        },
        unpaidAdvances: unpaidAdvances.map(advance => ({
          id: advance.id,
          amount: advance.amount,
          advanceDate: advance.advanceDate,
          remainingBalance: advance.remainingBalance
        })),
        activeCredits: activeCredits.map(credit => ({
          id: credit.id,
          amount: credit.loanAmount,
          startDate: credit.startDate,
          remainingBalance: credit.remainingBalance
        }))
      };

      // Generate PDF
      const pdfBuffer = await generateFinalSettlementPDF(settlementData);

      // Create final settlement document
      const document = await prisma.document.create({
        data: {
          type: DocumentType.ACCOUNT_STATEMENT,
          title: `Final Settlement - ${employee.firstName} ${employee.lastName}`,
          description: `Final settlement following ${departureReason}`,
          employeeId,
          period,
          generatedBy: 'system', // Replace with logged-in user ID
          fileSize: pdfBuffer.length,
          status: DocumentStatus.GENERATED,
          metadata: {
            endDate,
            departureReason,
            baseSalary,
            unusedLeave: unusedLeaveAmount,
            severancePay: severancePayAmount,
            otherAllowances: otherAllowancesAmount,
            deductions: deductionsAmount,
            totalAdvances,
            totalCredits,
            totalEarnings,
            totalDeductions,
            netBalance,
            hireDate: employee.hireDate,
            seniority: employee.seniority,
            position: employee.position
          }
        },
        include: {
          employee: {
            select: {
              id: true,
              employeeId: true,
              lastName: true,
              firstName: true,
              position: true,
              hireDate: true,
              seniority: true
            }
          }
        }
      });

      // Return PDF directly
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="final-settlement-${employee.employeeId}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.status(200).send(pdfBuffer);
    } catch (error) {
      console.error('Error generating final settlement:', error);
      res.status(500).json({ error: 'Error generating final settlement' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}