import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      // Récupérer tous les crédits actifs de l'employé
      const credits = await prisma.credit.findMany({
        where: {
          employeeId: id as string,
          statut: 'ACTIF'
        }
      });

      // Calculer les déductions mensuelles
      const deductions = {
        creditLogement: {
          montantMensuel: 0,
          interets: 0
        },
        creditConsommation: {
          montantMensuel: 0
        },
        totalDeductions: 0
      };

      credits.forEach(credit => {
        if (credit.type === 'LOGEMENT') {
          deductions.creditLogement.montantMensuel += credit.mensualite;
          // Calculer les intérêts approximatifs basés sur le taux et le capital restant
          const tauxMensuel = credit.tauxInteret / 100 / 12;
          const interetsApproximatifs = credit.capitalRestant * tauxMensuel;
          deductions.creditLogement.interets += interetsApproximatifs;
        } else if (credit.type === 'CONSOMMATION') {
          deductions.creditConsommation.montantMensuel += credit.mensualite;
        }
      });

      deductions.totalDeductions = deductions.creditLogement.montantMensuel + 
                                  deductions.creditConsommation.montantMensuel;

      res.status(200).json({
        credits,
        deductions
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des crédits de l\'employé:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des crédits' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
