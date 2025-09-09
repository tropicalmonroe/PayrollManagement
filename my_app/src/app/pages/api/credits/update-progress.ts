import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { creditId, montantRembourse } = req.body;

      if (!creditId || montantRembourse === undefined) {
        return res.status(400).json({ error: 'ID du crédit et montant remboursé requis' });
      }

      const montant = parseFloat(montantRembourse);
      if (montant < 0) {
        return res.status(400).json({ error: 'Le montant remboursé ne peut pas être négatif' });
      }

      // Récupérer le crédit pour validation
      const credit = await prisma.credit.findUnique({
        where: { id: creditId }
      });

      if (!credit) {
        return res.status(404).json({ error: 'Crédit non trouvé' });
      }

      if (montant > credit.montantCredit) {
        return res.status(400).json({ error: 'Le montant remboursé ne peut pas dépasser le montant du crédit' });
      }

      // Calculer le nouveau solde restant
      const nouveauSoldeRestant = Math.max(0, credit.montantCredit - montant);
      
      // Déterminer le nouveau statut
      let nouveauStatut = credit.statut;
      if (montant >= credit.montantCredit) {
        nouveauStatut = 'SOLDE';
      } else {
        const now = new Date();
        if (now > credit.dateFin) {
          nouveauStatut = 'SUSPENDU';
        } else {
          nouveauStatut = 'ACTIF';
        }
      }

      // Mettre à jour le crédit
      const creditMisAJour = await prisma.credit.update({
        where: { id: creditId },
        data: {
          montantRembourse: montant,
          soldeRestant: nouveauSoldeRestant,
          statut: nouveauStatut,
          capitalRestant: nouveauSoldeRestant
        },
        include: {
          employee: {
            select: {
              id: true,
              matricule: true,
              nom: true,
              prenom: true,
              fonction: true
            }
          }
        }
      });

      res.status(200).json(creditMisAJour);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du crédit:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du crédit' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
