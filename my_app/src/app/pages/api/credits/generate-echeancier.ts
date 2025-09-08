import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { generateAmortizationTable } from '../../../lib/creditCalculations';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { creditId } = req.body;

      if (!creditId) {
        return res.status(400).json({ error: 'ID du crédit requis' });
      }

      // Récupérer les informations du crédit
      const credit = await prisma.credit.findUnique({
        where: { id: creditId }
      });

      if (!credit) {
        return res.status(404).json({ error: 'Crédit non trouvé' });
      }

      // Vérifier si l'échéancier existe déjà
      const existingEcheancier = await prisma.creditEcheance.findFirst({
        where: { creditId }
      });

      if (existingEcheancier) {
        return res.status(400).json({ error: 'L\'échéancier existe déjà pour ce crédit' });
      }

      // Générer l'échéancier avec amortissement
      const dureeMois = credit.dureeAnnees * 12;
      const echeancier = generateAmortizationTable(
        credit.montantCredit,
        credit.tauxInteret,
        dureeMois,
        credit.dateDebut,
        credit.tauxAssurance
      );

      // Sauvegarder l'échéancier en base de données
      const echeancesData = echeancier.map(echeance => ({
        creditId,
        numeroEcheance: echeance.numeroEcheance,
        dateEcheance: echeance.dateEcheance,
        mensualiteTTC: echeance.mensualiteTTC,
        amortissement: echeance.amortissement,
        interetsHT: echeance.interetsHT,
        tvaInterets: echeance.tvaInterets,
        assurance: echeance.assurance,
        capitalRestant: echeance.capitalRestant,
        statut: 'EN_ATTENTE' as const
      }));

      await prisma.creditEcheance.createMany({
        data: echeancesData
      });

      // Mettre à jour le crédit avec la mensualité calculée
      await prisma.credit.update({
        where: { id: creditId },
        data: {
          mensualite: echeancier[0]?.mensualiteTTC || 0,
          capitalRestant: credit.montantCredit
        }
      });

      res.status(200).json({
        message: 'Échéancier généré avec succès',
        echeancier: echeancier,
        totalEcheances: echeancier.length,
        mensualite: echeancier[0]?.mensualiteTTC || 0
      });

    } catch (error) {
      console.error('Erreur lors de la génération de l\'échéancier:', error);
      res.status(500).json({ error: 'Erreur lors de la génération de l\'échéancier' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
