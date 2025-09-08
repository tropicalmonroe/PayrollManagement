import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getVariableElements(req, res);
      case 'POST':
        return await createVariableElement(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getVariableElements(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { employeeId, mois, annee, type } = req.query;

    const whereClause: any = {};
    
    if (employeeId && typeof employeeId === 'string') {
      whereClause.employeeId = employeeId;
    }
    
    if (mois && typeof mois === 'string') {
      whereClause.mois = mois;
    }
    
    if (annee && typeof annee === 'string') {
      whereClause.annee = annee;
    }
    
    if (type && typeof type === 'string') {
      whereClause.type = type;
    }

    const variableElements = await prisma.variableElement.findMany({
      where: whereClause,
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
      },
      orderBy: [
        { annee: 'desc' },
        { mois: 'desc' },
        { date: 'desc' }
      ]
    });

    return res.status(200).json(variableElements);
  } catch (error) {
    console.error('Error fetching variable elements:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement des éléments variables' });
  }
}

async function createVariableElement(req: NextApiRequest, res: NextApiResponse) {
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

    // Validation
    if (!employeeId || !type || !description || !date || !mois || !annee) {
      return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
    }

    // Vérifier que l'employé existe
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    // Validation selon le type
    if (type === 'HEURES_SUP' && (!heures || !taux)) {
      return res.status(400).json({ error: 'Les heures et le taux sont requis pour les heures supplémentaires' });
    }

    if (type !== 'HEURES_SUP' && !montant) {
      return res.status(400).json({ error: 'Le montant est requis pour ce type d\'élément' });
    }

    // Calculer le montant pour les heures supplémentaires
    let finalMontant = montant || 0;
    if (type === 'HEURES_SUP' && heures && taux) {
      finalMontant = parseFloat(heures) * parseFloat(taux);
    }

    // Créer l'élément variable
    const variableElement = await prisma.variableElement.create({
      data: {
        employeeId,
        type,
        description: description.trim(),
        montant: parseFloat(finalMontant.toString()),
        heures: heures ? parseFloat(heures) : null,
        taux: taux ? parseFloat(taux) : null,
        date: new Date(date),
        mois,
        annee
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

    return res.status(201).json(variableElement);
  } catch (error) {
    console.error('Error creating variable element:', error);
    return res.status(500).json({ error: 'Erreur lors de la création de l\'élément variable' });
  }
}
