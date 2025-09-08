import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getAdvances(req, res);
      case 'POST':
        return await createAdvance(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getAdvances(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { employeeId } = req.query;

    const whereClause: any = {};
    if (employeeId && typeof employeeId === 'string') {
      whereClause.employeeId = employeeId;
    }

    const advances = await prisma.advance.findMany({
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
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json(advances);
  } catch (error) {
    console.error('Error fetching advances:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement des avances' });
  }
}

async function createAdvance(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      employeeId,
      montant,
      dateAvance,
      motif,
      nombreMensualites,
      montantMensualite,
      soldeRestant,
      notes
    } = req.body;

    // Validation
    if (!employeeId || !montant || !dateAvance || !motif || !nombreMensualites) {
      return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
    }

    if (montant <= 0) {
      return res.status(400).json({ error: 'Le montant doit être supérieur à 0' });
    }

    if (nombreMensualites <= 0 || nombreMensualites > 24) {
      return res.status(400).json({ error: 'Le nombre de mensualités doit être entre 1 et 24' });
    }

    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    // Check if employee has active advances
    const activeAdvances = await prisma.advance.findMany({
      where: {
        employeeId: employeeId,
        statut: 'EN_COURS'
      }
    });

    if (activeAdvances.length > 0) {
      return res.status(400).json({ 
        error: 'Cet employé a déjà une avance en cours. Veuillez d\'abord solder l\'avance existante.' 
      });
    }

    // Create advance
    const advance = await prisma.advance.create({
      data: {
        employeeId,
        montant: parseFloat(montant),
        dateAvance: new Date(dateAvance),
        motif: motif.trim(),
        nombreMensualites: parseInt(nombreMensualites),
        montantMensualite: parseFloat(montantMensualite),
        soldeRestant: parseFloat(soldeRestant),
        statut: 'EN_COURS',
        createdBy: 'admin', // TODO: Get from session
        notes: notes?.trim() || null
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

    return res.status(201).json(advance);
  } catch (error) {
    console.error('Error creating advance:', error);
    return res.status(500).json({ error: 'Erreur lors de la création de l\'avance' });
  }
}
