import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID d\'élément variable invalide' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getVariableElement(req, res, id);
      case 'PUT':
        return await updateVariableElement(req, res, id);
      case 'DELETE':
        return await deleteVariableElement(req, res, id);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getVariableElement(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const variableElement = await prisma.variableElement.findUnique({
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

    if (!variableElement) {
      return res.status(404).json({ error: 'Élément variable non trouvé' });
    }

    return res.status(200).json(variableElement);
  } catch (error) {
    console.error('Error fetching variable element:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement de l\'élément variable' });
  }
}

async function updateVariableElement(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const {
      employeeId,
      type,
      description,
      montant,
      heures,
      taux,
      date,
      mois,
      annee
    } = req.body;

    // Vérifier que l'élément existe
    const existingElement = await prisma.variableElement.findUnique({
      where: { id }
    });

    if (!existingElement) {
      return res.status(404).json({ error: 'Élément variable non trouvé' });
    }

    // Validation
    if (employeeId) {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId }
      });

      if (!employee) {
        return res.status(404).json({ error: 'Employé non trouvé' });
      }
    }

    // Validation selon le type
    if (type === 'HEURES_SUP' && (!heures || !taux)) {
      return res.status(400).json({ error: 'Les heures et le taux sont requis pour les heures supplémentaires' });
    }

    if (type && type !== 'HEURES_SUP' && !montant) {
      return res.status(400).json({ error: 'Le montant est requis pour ce type d\'élément' });
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    
    if (employeeId !== undefined) updateData.employeeId = employeeId;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description.trim();
    if (date !== undefined) updateData.date = new Date(date);
    if (mois !== undefined) updateData.mois = mois;
    if (annee !== undefined) updateData.annee = annee;

    // Calculer le montant pour les heures supplémentaires
    if (type === 'HEURES_SUP' && heures && taux) {
      updateData.montant = parseFloat(heures) * parseFloat(taux);
      updateData.heures = parseFloat(heures);
      updateData.taux = parseFloat(taux);
    } else {
      if (montant !== undefined) updateData.montant = parseFloat(montant);
      if (heures !== undefined) updateData.heures = heures ? parseFloat(heures) : null;
      if (taux !== undefined) updateData.taux = taux ? parseFloat(taux) : null;
    }

    // Mettre à jour l'élément variable
    const variableElement = await prisma.variableElement.update({
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

    return res.status(200).json(variableElement);
  } catch (error) {
    console.error('Error updating variable element:', error);
    return res.status(500).json({ error: 'Erreur lors de la modification de l\'élément variable' });
  }
}

async function deleteVariableElement(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // Vérifier que l'élément existe
    const existingElement = await prisma.variableElement.findUnique({
      where: { id }
    });

    if (!existingElement) {
      return res.status(404).json({ error: 'Élément variable non trouvé' });
    }

    // Supprimer l'élément variable
    await prisma.variableElement.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'Élément variable supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting variable element:', error);
    return res.status(500).json({ error: 'Erreur lors de la suppression de l\'élément variable' });
  }
}
