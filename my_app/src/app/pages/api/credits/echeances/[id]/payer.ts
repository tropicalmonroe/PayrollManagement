import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'POST') {
    try {
      const { montantPaye, datePaiement, notes } = req.body;

      // Validation des données
      if (!montantPaye || montantPaye <= 0) {
        return res.status(400).json({ error: 'Le montant payé doit être supérieur à 0' });
      }

      // Récupérer l'échéance
      const echeance = await prisma.creditEcheance.findUnique({
        where: { id: id as string },
        include: {
          credit: true
        }
      });

      if (!echeance) {
        return res.status(404).json({ error: 'Échéance non trouvée' });
      }

      if (echeance.statut === 'PAYEE') {
        return res.status(400).json({ error: 'Cette échéance a déjà été payée' });
      }

      // Mettre à jour l'échéance
      const echeanceUpdated = await prisma.$transaction(async (prisma) => {
        // Marquer l'échéance comme payée
        const updatedEcheance = await prisma.creditEcheance.update({
          where: { id: id as string },
          data: {
            statut: 'PAYEE',
            datePaiement: datePaiement ? new Date(datePaiement) : new Date(),
            montantPaye: parseFloat(montantPaye),
            notes: notes || null
          }
        });

        // Mettre à jour le crédit
        const montantRemboursePrecedent = echeance.credit.montantRembourse;
        const nouveauMontantRembourse = montantRemboursePrecedent + parseFloat(montantPaye);
        const nouveauSoldeRestant = Math.max(0, echeance.credit.montantCredit - nouveauMontantRembourse);

        // Déterminer le nouveau statut du crédit
        let nouveauStatut = echeance.credit.statut;
        if (nouveauSoldeRestant <= 0) {
          nouveauStatut = 'SOLDE';
        }

        await prisma.credit.update({
          where: { id: echeance.creditId },
          data: {
            montantRembourse: nouveauMontantRembourse,
            soldeRestant: nouveauSoldeRestant,
            statut: nouveauStatut,
            interetsPayes: echeance.credit.interetsPayes + echeance.interetsHT
          }
        });

        return updatedEcheance;
      });

      res.status(200).json(echeanceUpdated);
    } catch (error) {
      console.error('Erreur lors du paiement de l\'échéance:', error);
      res.status(500).json({ error: 'Erreur lors du paiement de l\'échéance' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
