import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get current month and year
    const now = new Date()
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0')
    const currentYear = now.getFullYear().toString()

    // Get total active employees
    const totalEmployees = await prisma.employee.count({
      where: {
        status: 'ACTIF'
      }
    })

    // Get payroll calculations for current month
    const currentMonthPayrolls = await prisma.payrollCalculation.count({
      where: {
        mois: currentMonth,
        annee: currentYear
      }
    })

    // Get total documents generated this month
    const documentsThisMonth = await prisma.document.count({
      where: {
        dateGeneration: {
          gte: new Date(parseInt(currentYear), parseInt(currentMonth) - 1, 1),
          lt: new Date(parseInt(currentYear), parseInt(currentMonth), 1)
        }
      }
    })

    // Calculate total payroll amount for current month
    const payrollSum = await prisma.payrollCalculation.aggregate({
      where: {
        mois: currentMonth,
        annee: currentYear
      },
      _sum: {
        salaireNetAPayer: true
      }
    })

    const totalPayrollAmount = payrollSum._sum.salaireNetAPayer || 0

    // Get advances statistics
    const advances = await prisma.advance.findMany({
      include: {
        employee: true
      }
    })

    const advancesStats = {
      total: advances.length,
      enCours: advances.filter(a => a.statut === 'EN_COURS').length,
      rembourses: advances.filter(a => a.statut === 'REMBOURSE').length,
      montantTotal: advances.reduce((sum, a) => sum + a.montant, 0),
      soldeRestantTotal: advances.reduce((sum, a) => sum + a.soldeRestant, 0)
    }

    // Get credits statistics
    const credits = await prisma.credit.findMany({
      include: {
        employee: true
      }
    })

    const creditsStats = {
      total: credits.length,
      actifs: credits.filter(c => c.statut === 'ACTIF').length,
      soldes: credits.filter(c => c.statut === 'SOLDE').length,
      montantTotal: credits.reduce((sum, c) => sum + c.montantCredit, 0),
      soldeRestantTotal: credits.reduce((sum, c) => sum + c.soldeRestant, 0)
    }

    // Get recent activities (last 5 employees added)
    const recentEmployees = await prisma.employee.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        fonction: true,
        createdAt: true
      }
    })

    // Get monthly payroll trend (last 6 months)
    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear().toString()

      const monthlySum = await prisma.payrollCalculation.aggregate({
        where: {
          mois: month,
          annee: year
        },
        _sum: {
          salaireNetAPayer: true
        }
      })

      monthlyTrend.push({
        month: `${month}/${year}`,
        amount: monthlySum._sum.salaireNetAPayer || 0
      })
    }

    const stats = {
      totalEmployees,
      currentMonthPayrolls,
      documentsThisMonth,
      totalPayrollAmount,
      advancesStats,
      creditsStats,
      recentEmployees,
      monthlyTrend,
      currentPeriod: `${currentMonth}/${currentYear}`
    }

    return res.status(200).json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return res.status(500).json({ error: 'Failed to fetch dashboard statistics' })
  }
}
