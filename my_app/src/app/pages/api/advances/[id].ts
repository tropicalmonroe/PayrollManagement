import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID d\'avance invalide' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getAdvance(req, res, id);
      case 'PUT':
        return await updateAdvance(req, res, id);
      case 'DELETE':
        return await deleteAdvance(req, res, id);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getAdvance(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const advance = await prisma.advance.findUnique({
      where: { id },
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

    if (!advance) {
      return res.status(404).json({ error: 'Avance non trouvée' });
    }

    return res.status(200).json(advance);
  } catch (error) {
    console.error('Error fetching advance:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement de l\'avance' });
  }
}

async function updateAdvance(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const {
      montant,
      dateAvance,
      motif,
      nombreMensualites,
      montantMensualite,
      soldeRestant,
      statut,
      notes
    } = req.body;

    // Check if advance exists
    const existingAdvance = await prisma.advance.findUnique({
      where: { id }
    });

    if (!existingAdvance) {
      return res.status(404).json({ error: 'Avance non trouvée' });
    }

    // Validation
    if (montant !== undefined && montant <= 0) {
      return res.status(400).json({ error: 'Le montant doit être supérieur à 0' });
    }

    if (nombreMensualites !== undefined && (nombreMensualites <= 0 || nombreMensualites > 24)) {
      return res.status(400).json({ error: 'Le nombre de mensualités doit être entre 1 et 24' });
    }

    if (soldeRestant !== undefined && soldeRestant < 0) {
      return res.status(400).json({ error: 'Le solde restant ne peut pas être négatif' });
    }

    // Prepare update data
    const updateData: any = {};
    
    if (montant !== undefined) updateData.montant = parseFloat(montant);
    if (dateAvance !== undefined) updateData.dateAvance = new Date(dateAvance);
    if (motif !== undefined) updateData.motif = motif.trim();
    if (nombreMensualites !== undefined) updateData.nombreMensualites = parseInt(nombreMensualites);
    if (montantMensualite !== undefined) updateData.montantMensualite = parseFloat(montantMensualite);
    if (soldeRestant !== undefined) {
      updateData.soldeRestant = parseFloat(soldeRestant);
      // Auto-update status based on remaining balance
      if (parseFloat(soldeRestant) === 0) {
        updateData.statut = 'REMBOURSE';
        updateData.dateRemboursementComplete = new Date();
      } else if (updateData.statut !== 'ANNULE') {
        updateData.statut = 'EN_COURS';
      }
    }
    if (statut !== undefined) updateData.statut = statut;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;

    // Update advance
    const advance = await prisma.advance.update({
      where: { id },
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

    return res.status(200).json(advance);
  } catch (error) {
    console.error('Error updating advance:', error);
    return res.status(500).json({ error: 'Erreur lors de la modification de l\'avance' });
  }
}

async function deleteAdvance(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // Check if advance exists
    const existingAdvance = await prisma.advance.findUnique({
      where: { id }
    });

    if (!existingAdvance) {
      return res.status(404).json({ error: 'Avance non trouvée' });
    }

    // Delete advance
    await prisma.advance.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'Avance supprimée avec succès' });
  } catch (error) {
    console.error('Error deleting advance:', error);
    return res.status(500).json({ error: 'Erreur lors de la suppression de l\'avance' });
  }
}
