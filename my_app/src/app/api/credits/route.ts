import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { generateAmortizationTable } from '../../../lib/creditCalculations';

// GET /api/credits
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    
    const whereClause = employeeId ? { employeeId } : {};
    
    const credits = await prisma.credit.findMany({
      where: whereClause,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const creditsWithProgress = credits.map(credit => {
      const now = new Date();
      const startDate = new Date(credit.startDate);
      
      let monthsElapsed = 0;
      if (startDate <= now) {
        const diffTime = now.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        monthsElapsed = Math.floor(diffDays / 30.44);
        const totalInstallments = credit.durationYears * 12;
        monthsElapsed = Math.max(0, Math.min(monthsElapsed, totalInstallments));
      }
      
      const amountRepaidAuto = monthsElapsed * credit.monthlyPayment;
      const finalAmountRepaid = credit.amountRepaid > 0 ? 
        credit.amountRepaid : 
        Math.min(amountRepaidAuto, credit.loanAmount);
      
      const progressPercentage = Math.min(100, (finalAmountRepaid / credit.loanAmount) * 100);
      const calculatedRemainingBalance = Math.max(0, credit.loanAmount - finalAmountRepaid);
      
      let newStatus = credit.status;
      if (finalAmountRepaid >= credit.loanAmount) {
        newStatus = 'PAID_OFF';
      } else if (now > new Date(credit.endDate) && finalAmountRepaid < credit.loanAmount) {
        newStatus = 'SUSPENDED';
      } else {
        newStatus = 'ACTIVE';
      }

      return {
        ...credit,
        amountRepaid: finalAmountRepaid,
        remainingBalance: calculatedRemainingBalance,
        status: newStatus,
        calculatedProgress: {
          installmentsElapsed: monthsElapsed,
          amountRepaidAuto: Math.round(amountRepaidAuto * 100) / 100,
          progressPercentage: Math.round(progressPercentage * 100) / 100,
          isOverdue: false,
          monthsOverdue: 0
        }
      };
    });

    return NextResponse.json(creditsWithProgress);
  } catch (error) {
    console.error('Error fetching credits:', error);
    return NextResponse.json({ error: 'Error fetching credits' }, { status: 500 });
  }
}

// POST /api/credits
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      employeeId,
      type,
      loanAmount,
      interestRate,
      durationYears,
      startDate,
      bank,
      accountNumber,
      notes,
      createdBy
    } = body;

    if (!employeeId || !type || !loanAmount || !interestRate || !startDate || !bank) {
      console.log('Missing fields:', {
    employeeId: !employeeId ? 'missing' : employeeId,
    type: !type ? 'missing' : type,
    loanAmount: !loanAmount ? 'missing' : loanAmount,
    interestRate: !interestRate ? 'missing' : interestRate,
    startDate: !startDate ? 'missing' : startDate,
    bank: !bank ? 'missing' : bank
  });
      return NextResponse.json({ error: 'All required fields must be filled' }, { status: 400 });
    }

    const amount = parseFloat(loanAmount);
    const rate = parseFloat(interestRate);
    const duration = parseInt(durationYears) || 1;
    
    if (amount <= 0 || rate < 0 || duration <= 0 || duration > 50) {
      return NextResponse.json({ error: 'Invalid numeric values' }, { status: 400 });
    }

    const monthlyRate = rate / 100 / 12;
    const numberOfInstallments = duration * 12;
    let monthlyPayment;
    
    if (monthlyRate > 0) {
      monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfInstallments)) / 
                  (Math.pow(1 + monthlyRate, numberOfInstallments) - 1);
    } else {
      monthlyPayment = amount / numberOfInstallments;
    }

    const startDateObj = new Date(startDate);
    if (isNaN(startDateObj.getTime())) {
      return NextResponse.json({ error: 'Invalid start date' }, { status: 400 });
    }
    
    const endDate = new Date(startDateObj);
    endDate.setFullYear(endDate.getFullYear() + duration);
    
    if (isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Error calculating end date' }, { status: 400 });
    }

    const insuranceRateValue = 0.809;
    const amortizationSchedule = generateAmortizationTable(
      amount,
      rate,
      numberOfInstallments,
      startDateObj,
      insuranceRateValue
    );

    const newCredit = await prisma.credit.create({
      data: {
        employeeId,
        type,
        loanAmount: parseFloat(loanAmount),
        interestRate: parseFloat(interestRate),
        durationYears: parseInt(durationYears) || 1,
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        startDate: new Date(startDate),
        endDate,
        remainingBalance: parseFloat(loanAmount),
        amountRepaid: 0,
        status: 'ACTIVE',
        bank,
        accountNumber: accountNumber || null,
        notes: notes || null,
        createdBy: createdBy || 'system',
      }
    });

    const credit = await prisma.credit.findUnique({
      where: { id: newCredit.id },
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

    return NextResponse.json(credit, { status: 201 });
  } catch (error) {
    console.error('Error creating credit:', error);
    return NextResponse.json({ error: 'Error creating credit' }, { status: 500 });
  }
}