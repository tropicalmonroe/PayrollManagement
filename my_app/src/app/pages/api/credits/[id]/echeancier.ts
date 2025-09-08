import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      // Récupérer l'échéancier complet du crédit
      const echeancier = await prisma.creditEcheance.findMany({
        where: {
          creditId: id as string
        },
        orderBy: {
          numeroEcheance: 'asc'
        }
      });

      if (!echeancier.length) {
        return res.status(404).json({ error: 'Échéancier non trouvé' });
      }

      // Calculer les statistiques de l'échéancier
      const now = new Date();
      const stats = {
        totalEcheances: echeancier.length,
        echeancesPayees: echeancier.filter(e => e.statut === 'PAYEE').length,
        echeancesEnRetard: echeancier.filter(e => 
          e.statut === 'EN_ATTENTE' && new Date(e.dateEcheance) < now
        ).length,
        prochainePaiement: echeancier.find(e => e.statut === 'EN_ATTENTE'),
        montantTotalPaye: echeancier
          .filter(e => e.statut === 'PAYEE')
          .reduce((sum, e) => sum + (e.montantPaye || e.mensualiteTTC), 0),
        montantTotalRestant: echeancier
          .filter(e => e.statut === 'EN_ATTENTE')
          .reduce((sum, e) => sum + e.mensualiteTTC, 0)
      };

      res.status(200).json({
        echeancier,
        stats
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'échéancier:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération de l\'échéancier' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
