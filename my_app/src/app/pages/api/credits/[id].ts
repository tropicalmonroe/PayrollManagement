import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'ID invalide' });
  }

  if (req.method === 'GET') {
    try {
      const credit = await prisma.credit.findUnique({
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

      if (!credit) {
        return res.status(404).json({ error: 'Crédit non trouvé' });
      }

      res.status(200).json(credit);
    } catch (error) {
      console.error('Erreur lors de la récupération du crédit:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération du crédit' });
    }
  } else if (req.method === 'PUT') {
    try {
      const {
        employeeId,
        type,
        montantCredit,
        tauxInteret,
        dureeAnnees,
        dateDebut,
        banque,
        numeroCompte,
        notes,
        statut,
        montantRembourse,
        soldeRestant,
        interetsPayes,
        capitalRestant
      } = req.body;

      // Recalcul de la mensualité si les paramètres de base ont changé
      let mensualite;
      if (montantCredit && tauxInteret !== undefined && dureeAnnees) {
        const montant = parseFloat(montantCredit);
        const taux = parseFloat(tauxInteret);
        const duree = parseInt(dureeAnnees);
        
        if (montant > 0 && taux >= 0 && duree > 0) {
          const tauxMensuel = taux / 100 / 12;
          const nombreMensualites = duree * 12;
          
          if (tauxMensuel > 0) {
            mensualite = montant * (tauxMensuel * Math.pow(1 + tauxMensuel, nombreMensualites)) / 
                        (Math.pow(1 + tauxMensuel, nombreMensualites) - 1);
          } else {
            // Si taux = 0, mensualité = montant / nombre de mois
            mensualite = montant / nombreMensualites;
          }
          mensualite = Math.round(mensualite * 100) / 100;
        }
      }

      // Calcul de la date de fin si nécessaire
      let dateFin;
      if (dateDebut && dureeAnnees) {
        const dateDebutObj = new Date(dateDebut);
        const duree = parseInt(dureeAnnees);
        
        // Validation de la date et de la durée
        if (dateDebutObj instanceof Date && !isNaN(dateDebutObj.getTime()) && duree > 0 && duree <= 50) {
          dateFin = new Date(dateDebutObj);
          dateFin.setFullYear(dateFin.getFullYear() + duree);
          
          // Vérifier que la date calculée est valide
          if (isNaN(dateFin.getTime())) {
            dateFin = undefined;
          }
        }
      }

      const updateData: any = {};
      
      if (employeeId !== undefined) updateData.employeeId = employeeId;
      if (type !== undefined) updateData.type = type;
      if (montantCredit !== undefined) updateData.montantCredit = parseFloat(montantCredit);
      if (tauxInteret !== undefined) updateData.tauxInteret = parseFloat(tauxInteret);
      if (dureeAnnees !== undefined) updateData.dureeAnnees = parseInt(dureeAnnees);
      if (mensualite !== undefined) updateData.mensualite = mensualite;
      if (dateDebut !== undefined) updateData.dateDebut = new Date(dateDebut);
      if (dateFin !== undefined) updateData.dateFin = dateFin;
      if (banque !== undefined) updateData.banque = banque;
      if (numeroCompte !== undefined) updateData.numeroCompte = numeroCompte;
      if (notes !== undefined) updateData.notes = notes;
      if (statut !== undefined) updateData.statut = statut;
      if (montantRembourse !== undefined) updateData.montantRembourse = parseFloat(montantRembourse);
      if (soldeRestant !== undefined) updateData.soldeRestant = parseFloat(soldeRestant);
      if (interetsPayes !== undefined) updateData.interetsPayes = parseFloat(interetsPayes);
      if (capitalRestant !== undefined) updateData.capitalRestant = parseFloat(capitalRestant);

      const credit = await prisma.credit.update({
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

      res.status(200).json(credit);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du crédit:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du crédit' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.credit.delete({
        where: { id }
      });

      res.status(200).json({ message: 'Crédit supprimé avec succès' });
    } catch (error) {
      console.error('Erreur lors de la suppression du crédit:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression du crédit' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
