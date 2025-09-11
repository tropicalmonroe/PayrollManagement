import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { genererEcheancierSimple, type CreditSimple } from '../../../../lib/simplePaymentSchedule';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { creditId, montantMensuel, nombreEcheances, dateDebut } = req.body;

      if (!creditId || !montantMensuel || !nombreEcheances || !dateDebut) {
        return res.status(400).json({ 
          error: 'Paramètres manquants: creditId, montantMensuel, nombreEcheances, dateDebut requis' 
        });
      }

      // Vérifier que le crédit existe
      const credit = await prisma.credit.findUnique({
        where: { id: creditId }
      });

      if (!credit) {
        return res.status(404).json({ error: 'Crédit non trouvé' });
      }

      // Vérifier si un échéancier existe déjà
      const existingEcheancier = await prisma.creditEcheance.findFirst({
        where: { creditId }
      });

      if (existingEcheancier) {
        return res.status(400).json({ 
          error: 'Un échéancier existe déjà pour ce crédit' 
        });
      }

      // Créer le crédit simple pour la génération
      const creditSimple: CreditSimple = {
        montantTotal: montantMensuel * nombreEcheances,
        montantMensuel: montantMensuel,
        nombreEcheances: nombreEcheances,
        dateDebut: new Date(dateDebut)
      };

      // Générer l'échéancier simple
      const echeancier = genererEcheancierSimple(creditSimple);

      // Sauvegarder l'échéancier en base de données
      const echeancesData = echeancier.map(echeance => ({
        creditId,
        numeroEcheance: echeance.numeroEcheance,
        dateEcheance: echeance.dateEcheance,
        mensualiteTTC: echeance.montantAPayer,
        amortissement: echeance.montantAPayer, // Pour la compatibilité
        interetsHT: 0, // Pas d'intérêts dans le mode simple
        tvaInterets: 0,
        assurance: 0,
        capitalRestant: creditSimple.montantTotal - (echeance.numeroEcheance * echeance.montantAPayer),
        statut: echeance.statut,
        notes: echeance.notes || null
      }));

      // Créer toutes les échéances en une seule transaction
      await prisma.creditEcheance.createMany({
        data: echeancesData
      });

      res.status(200).json({
        message: 'Échéancier simple généré avec succès',
        totalEcheances: echeancier.length,
        montantMensuel: montantMensuel,
        montantTotal: creditSimple.montantTotal,
        echeancier: echeancier
      });

    } catch (error) {
      console.error('Erreur lors de la génération de l\'échéancier simple:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la génération de l\'échéancier simple' 
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
