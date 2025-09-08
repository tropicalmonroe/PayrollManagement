import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID employé requis' })
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getEmployee(id, res)
      case 'PUT':
        return await updateEmployee(id, req, res)
      case 'DELETE':
        return await deleteEmployee(id, res)
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getEmployee(id: string, res: NextApiResponse) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        payrollCalculations: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        advances: {
          where: { statut: 'EN_COURS' }
        },
        credits: {
          where: { statut: 'ACTIF' }
        }
      }
    })

    if (!employee) {
      return res.status(404).json({ error: 'Employé non trouvé' })
    }

    return res.status(200).json(employee)
  } catch (error) {
    console.error('Error fetching employee:', error)
    return res.status(500).json({ error: 'Failed to fetch employee' })
  }
}

async function updateEmployee(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      matricule,
      nom,
      prenom,
      fonction,
      cin,
      cnss,
      situationFamiliale,
      dateNaissance,
      dateEmbauche,
      nbrDeductions,
      nbreJourMois,
      salaireBase,
      indemniteLogement,
      indemnitePanier,
      primeTransport,
      indemniteRepresentation,
      compteBancaire,
      agence,
      telephone,
      email,
      adresse,
      status
    } = req.body

    // Vérifier que l'employé existe
    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    })

    if (!existingEmployee) {
      return res.status(404).json({ error: 'Employé non trouvé' })
    }

    // Vérifier l'unicité du matricule si modifié
    if (matricule && matricule !== existingEmployee.matricule) {
      const duplicateMatricule = await prisma.employee.findUnique({
        where: { matricule }
      })

      if (duplicateMatricule) {
        return res.status(400).json({ 
          error: 'Un employé avec ce matricule existe déjà' 
        })
      }
    }

    // Vérifier l'unicité du CIN si modifié
    if (cin && cin !== existingEmployee.cin) {
      const duplicateCin = await prisma.employee.findUnique({
        where: { cin }
      })

      if (duplicateCin) {
        return res.status(400).json({ 
          error: 'Un employé avec ce CIN existe déjà' 
        })
      }
    }

    // Vérifier l'unicité du CNSS si modifié
    if (cnss && cnss !== existingEmployee.cnss) {
      const duplicateCnss = await prisma.employee.findUnique({
        where: { cnss }
      })

      if (duplicateCnss) {
        return res.status(400).json({ 
          error: 'Un employé avec ce numéro CNSS existe déjà' 
        })
      }
    }

    // Recalculer l'ancienneté si la date d'embauche a changé
    let anciennete = existingEmployee.anciennete
    let tauxAnciennete = existingEmployee.tauxAnciennete
    let primeAnciennete = existingEmployee.primeAnciennete

    if (dateEmbauche && dateEmbauche !== existingEmployee.dateEmbauche.toISOString()) {
      const dateEmbaucheObj = new Date(dateEmbauche)
      const today = new Date()
      anciennete = Math.floor((today.getTime() - dateEmbaucheObj.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
      tauxAnciennete = Math.min(anciennete * 0.05, 0.25)
    }

    // Recalculer la prime d'ancienneté si le salaire de base a changé
    if (salaireBase && salaireBase !== existingEmployee.salaireBase) {
      primeAnciennete = parseFloat(salaireBase) * tauxAnciennete
    }

    // Calculer les valeurs finales pour tous les champs requis
    const finalIndemniteLogement = indemniteLogement !== undefined && indemniteLogement !== null && indemniteLogement !== '' 
      ? parseFloat(indemniteLogement) || 0 
      : existingEmployee.indemniteLogement
    const finalIndemnitePanier = indemnitePanier !== undefined && indemnitePanier !== null && indemnitePanier !== '' 
      ? parseFloat(indemnitePanier) || 0 
      : existingEmployee.indemnitePanier
    const finalPrimeTransport = primeTransport !== undefined && primeTransport !== null && primeTransport !== '' 
      ? parseFloat(primeTransport) || 0 
      : existingEmployee.primeTransport
    const finalIndemniteRepresentation = indemniteRepresentation !== undefined && indemniteRepresentation !== null && indemniteRepresentation !== '' 
      ? parseFloat(indemniteRepresentation) || 0 
      : existingEmployee.indemniteRepresentation

    // Calculer le nouveau salaire brut
    const newSalaireBase = salaireBase !== undefined ? parseFloat(salaireBase) : existingEmployee.salaireBase
    const salaireBrut = newSalaireBase + primeAnciennete + 
                       finalIndemniteLogement + 
                       finalIndemnitePanier + 
                       finalPrimeTransport + 
                       finalIndemniteRepresentation

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        ...(matricule && { matricule }),
        ...(nom && { nom: nom.toUpperCase() }),
        ...(prenom && { prenom: prenom.charAt(0).toUpperCase() + prenom.slice(1).toLowerCase() }),
        ...(fonction && { fonction }),
        ...(cin !== undefined && { cin }),
        ...(cnss !== undefined && { cnss }),
        ...(situationFamiliale && { situationFamiliale }),
        ...(dateNaissance !== undefined && { dateNaissance: dateNaissance ? new Date(dateNaissance) : null }),
        ...(dateEmbauche && { dateEmbauche: new Date(dateEmbauche) }),
        ...(nbrDeductions !== undefined && { nbrDeductions: parseInt(nbrDeductions) }),
        ...(nbreJourMois !== undefined && { nbreJourMois: parseInt(nbreJourMois) }),
        ...(salaireBase !== undefined && { salaireBase: newSalaireBase }),
        anciennete,
        tauxAnciennete,
        primeAnciennete,
        indemniteLogement: finalIndemniteLogement,
        indemnitePanier: finalIndemnitePanier,
        primeTransport: finalPrimeTransport,
        indemniteRepresentation: finalIndemniteRepresentation,
        salaireBrut,
        salaireBrutImposable: salaireBrut - finalPrimeTransport, // Transport non imposable
        ...(compteBancaire !== undefined && { compteBancaire }),
        ...(agence !== undefined && { agence }),
        ...(telephone !== undefined && { telephone }),
        ...(email !== undefined && { email }),
        ...(adresse !== undefined && { adresse }),
        ...(status && { status })
      }
    })

    return res.status(200).json(updatedEmployee)
  } catch (error) {
    console.error('Error updating employee:', error)
    return res.status(500).json({ error: 'Failed to update employee' })
  }
}

async function deleteEmployee(id: string, res: NextApiResponse) {
  try {
    // Vérifier que l'employé existe
    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    })

    if (!existingEmployee) {
      return res.status(404).json({ error: 'Employé non trouvé' })
    }

    // Supprimer l'employé (les relations seront supprimées en cascade)
    await prisma.employee.delete({
      where: { id }
    })

    return res.status(200).json({ message: 'Employé supprimé avec succès' })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return res.status(500).json({ error: 'Failed to delete employee' })
  }
}
