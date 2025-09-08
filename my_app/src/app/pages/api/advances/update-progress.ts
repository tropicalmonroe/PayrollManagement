import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const { advanceId, soldeRestant } = req.body;

    // Validation
    if (!advanceId) {
      return res.status(400).json({ error: 'ID d\'avance requis' });
    }

    if (soldeRestant === undefined || soldeRestant < 0) {
      return res.status(400).json({ error: 'Le solde restant doit être un nombre positif ou zéro' });
    }

    // Check if advance exists
    const existingAdvance = await prisma.advance.findUnique({
      where: { id: advanceId },
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

    if (!existingAdvance) {
      return res.status(404).json({ error: 'Avance non trouvée' });
    }

    // Validate that the new remaining balance doesn't exceed the original amount
    if (parseFloat(soldeRestant) > existingAdvance.montant) {
      return res.status(400).json({ 
        error: 'Le solde restant ne peut pas être supérieur au montant initial de l\'avance' 
      });
    }

    // Prepare update data
    const updateData: any = {
      soldeRestant: parseFloat(soldeRestant)
    };

    // Auto-update status based on remaining balance
    if (parseFloat(soldeRestant) === 0) {
      updateData.statut = 'REMBOURSE';
      updateData.dateRemboursementComplete = new Date();
    } else if (existingAdvance.statut !== 'ANNULE') {
      updateData.statut = 'EN_COURS';
      updateData.dateRemboursementComplete = null;
    }

    // Update advance
    const updatedAdvance = await prisma.advance.update({
      where: { id: advanceId },
      data: updateData,
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

    // Calculate progress information
    const montantRembourse = updatedAdvance.montant - updatedAdvance.soldeRestant;
    const progressionPourcentage = (montantRembourse / updatedAdvance.montant) * 100;

    // Calculate expected progress based on time elapsed
    const dateDebut = new Date(updatedAdvance.dateAvance);
    const now = new Date();
    const monthsElapsed = Math.floor((now.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const expectedProgress = Math.min(100, (monthsElapsed / updatedAdvance.nombreMensualites) * 100);
    const isLate = progressionPourcentage < expectedProgress && updatedAdvance.statut === 'EN_COURS';

    const response = {
      ...updatedAdvance,
      progressionCalculee: {
        progressionPourcentage: Math.round(progressionPourcentage * 100) / 100,
        montantRembourse: montantRembourse,
        enRetard: isLate,
        mensualitesEcoulees: monthsElapsed,
        progressionAttendue: Math.round(expectedProgress * 100) / 100
      }
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error updating advance progress:', error);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour de la progression' });
  }
}
