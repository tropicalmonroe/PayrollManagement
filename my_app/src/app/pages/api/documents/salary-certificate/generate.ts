import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import { DocumentType, DocumentStatus } from '@prisma/client';
import { generateSalaryCertificatePDF, SalaryCertificateData } from '../../../../../lib/pdfGenerators/salaryCertificatePDF';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { employeeId, type, startDate, endDate, reason } = req.body;

      if (!employeeId || !type || !startDate || !endDate) {
        return res.status(400).json({ 
          error: 'employeeId, type, startDate and endDate parameters are required' 
        });
      }

      // Check if employee exists
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId }
      });

      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      // Calculate period for the certificate
      const periodStart = new Date(startDate);
      const periodEnd = new Date(endDate);
      const period = `${periodStart.toLocaleDateString('en-US')} - ${periodEnd.toLocaleDateString('en-US')}`;

      // Get payroll calculations for the requested period
      const payrollCalculations = await prisma.payrollCalculation.findMany({
        where: {
          employeeId,
          createdAt: {
            gte: periodStart,
            lte: periodEnd
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Calculate averages and totals
      let totalGrossSalary = 0;
      let totalNetSalary = 0;
      let numberOfMonths = payrollCalculations.length;

      payrollCalculations.forEach(calc => {
        totalGrossSalary += calc.grossSalary;
        totalNetSalary += calc.netSalary;
      });

      const averageGrossSalary = numberOfMonths > 0 ? totalGrossSalary / numberOfMonths : employee.baseSalary;
      const averageNetSalary = numberOfMonths > 0 ? totalNetSalary / numberOfMonths : employee.netSalary;

      // Prepare data for PDF
      const certificateData: SalaryCertificateData = {
        employee: {
          employeeId: employee.employeeId,
          lastName: employee.lastName,
          firstName: employee.firstName,
          position: employee.position,
          hireDate: employee.hireDate,
          seniority: employee.seniority,
          maritalStatus: employee.maritalStatus,
          idNumber: employee.idNumber || '',
          nssfNumber: employee.nssfNumber || '',
          baseSalary: employee.baseSalary,
          transportAllowance: employee.transportAllowance,
          representationAllowance: employee.representationAllowance,
          housingAllowance: employee.housingAllowance
        },
        certificate: {
          certificateType: type,
          startDate: periodStart,
          endDate: periodEnd,
          reason: reason || '',
          averageGrossSalary,
          averageNetSalary,
          calculatedMonths: numberOfMonths
        }
      };

      // Generate PDF
      const pdfBuffer = await generateSalaryCertificatePDF(certificateData);

      // Create salary certificate document
      await prisma.document.create({
        data: {
          type: DocumentType.SALARY_CERTIFICATE,
          title: `Salary Certificate - ${employee.firstName} ${employee.lastName}`,
          description: `${type} certificate for period ${period}`,
          employeeId,
          period,
          generatedBy: 'system', // Replace with logged-in user ID
          fileSize: pdfBuffer.length,
          status: DocumentStatus.GENERATED,
          metadata: {
            certificateType: type,
            startDate,
            endDate,
            reason: reason || '',
            averageGrossSalary,
            averageNetSalary,
            calculatedMonths: numberOfMonths,
            hireDate: employee.hireDate,
            position: employee.position,
            seniority: employee.seniority
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
              seniority: true,
              baseSalary: true,
              transportAllowance: true,
              representationAllowance: true,
              housingAllowance: true,
              maritalStatus: true,
              idNumber: true,
              nssfNumber: true
            }
          }
        }
      });

      // Return PDF directly
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="salary-certificate-${employee.employeeId}-${type}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.status(200).send(pdfBuffer);
    } catch (error) {
      console.error('Error generating salary certificate:', error);
      res.status(500).json({ error: 'Error generating salary certificate' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}