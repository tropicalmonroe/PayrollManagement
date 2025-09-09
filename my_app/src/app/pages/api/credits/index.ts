import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { generateAmortizationTable } from '../../../../lib/creditCalculations';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { employeeId } = req.query;
      
      // Construire la requête avec ou sans filtre par employé
      const whereClause = employeeId ? { employeeId: employeeId as string } : {};
      
      const credits = await prisma.credit.findMany({
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

      // Calculer automatiquement les remboursements basés sur le temps écoulé
      const creditsWithProgress = credits.map(credit => {
        const now = new Date();
        const debut = new Date(credit.dateDebut);
        
        // Calcul des mois écoulés depuis le début du crédit
        let moisEcoules = 0;
        if (debut <= now) {
          const diffTime = now.getTime() - debut.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          moisEcoules = Math.floor(diffDays / 30.44); // Moyenne de jours par mois
          
          // Limiter au nombre total de mensualités du crédit
          const totalMensualites = credit.dureeAnnees * 12;
          moisEcoules = Math.max(0, Math.min(moisEcoules, totalMensualites));
        }
        
        // Calcul du montant qui devrait être remboursé automatiquement
        const montantRembourseDu = moisEcoules * credit.mensualite;
        
        // Utiliser le montant remboursé automatique si le montant en base est 0 ou inférieur
        const montantRembourseFinal = credit.montantRembourse > 0 ? 
          credit.montantRembourse : 
          Math.min(montantRembourseDu, credit.montantCredit);
        
        // Calcul de la progression basée sur le montant remboursé final
        const progressionPourcentage = Math.min(100, (montantRembourseFinal / credit.montantCredit) * 100);
        
        // Calcul du solde restant
        const soldeRestantCalcule = Math.max(0, credit.montantCredit - montantRembourseFinal);
        
        // Déterminer le statut
        let newStatus = credit.statut;
        if (montantRembourseFinal >= credit.montantCredit) {
          newStatus = 'SOLDE';
        } else if (now > new Date(credit.dateFin) && montantRembourseFinal < credit.montantCredit) {
          newStatus = 'SUSPENDU';
        } else {
          newStatus = 'ACTIF';
        }

        return {
          ...credit,
          montantRembourse: montantRembourseFinal,
          soldeRestant: soldeRestantCalcule,
          statut: newStatus,
          progressionCalculee: {
            mensualitesEcoulees: moisEcoules,
            montantRembourseDu: Math.round(montantRembourseDu * 100) / 100,
            progressionPourcentage: Math.round(progressionPourcentage * 100) / 100,
            enRetard: false, // Pas de retard si on suppose tous les paiements effectués
            moisRetard: 0
          }
        };
      });

      res.status(200).json(creditsWithProgress);
    } catch (error) {
      console.error('Erreur lors de la récupération des crédits:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des crédits' });
    }
  } else if (req.method === 'POST') {
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
        createdBy
      } = req.body;

      // Validation des données
      if (!employeeId || !type || !montantCredit || !tauxInteret || !dateDebut || !banque) {
        return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
      }

      // Validation et conversion des données
      const montant = parseFloat(montantCredit);
      const taux = parseFloat(tauxInteret);
      const duree = parseInt(dureeAnnees) || 1;
      
      if (montant <= 0 || taux < 0 || duree <= 0 || duree > 50) {
        return res.status(400).json({ error: 'Valeurs numériques invalides' });
      }

      // Calcul de la mensualité (formule d'amortissement)
      const tauxMensuel = taux / 100 / 12;
      const nombreMensualites = duree * 12;
      let mensualite;
      
      if (tauxMensuel > 0) {
        mensualite = montant * (tauxMensuel * Math.pow(1 + tauxMensuel, nombreMensualites)) / 
                    (Math.pow(1 + tauxMensuel, nombreMensualites) - 1);
      } else {
        // Si taux = 0, mensualité = montant / nombre de mois
        mensualite = montant / nombreMensualites;
      }

      // Calcul de la date de fin
      const dateDebutObj = new Date(dateDebut);
      if (isNaN(dateDebutObj.getTime())) {
        return res.status(400).json({ error: 'Date de début invalide' });
      }
      
      const dateFin = new Date(dateDebutObj);
      dateFin.setFullYear(dateFin.getFullYear() + duree);
      
      if (isNaN(dateFin.getTime())) {
        return res.status(400).json({ error: 'Erreur de calcul de la date de fin' });
      }

      // Générer l'échéancier complet
      const tauxAssuranceValue = 0.809; // Défaut 0.809%
      const amortizationSchedule = generateAmortizationTable(
        montant,
        taux,
        nombreMensualites,
        dateDebutObj,
        tauxAssuranceValue
      );

      // Créer le crédit
      const newCredit = await prisma.credit.create({
        data: {
          employeeId,
          type,
          montantCredit: parseFloat(montantCredit),
          tauxInteret: parseFloat(tauxInteret),
          dureeAnnees: parseInt(dureeAnnees) || 1,
          mensualite: Math.round(mensualite * 100) / 100,
          dateDebut: new Date(dateDebut),
          dateFin,
          soldeRestant: parseFloat(montantCredit),
          montantRembourse: 0,
          statut: 'ACTIF',
          banque,
          numeroCompte: numeroCompte || null,
          notes: notes || null,
          interetsPayes: 0,
          capitalRestant: parseFloat(montantCredit),
          createdBy: createdBy || 'system'
        }
      });

      // Retourner le crédit avec les informations de l'employé
      const credit = await prisma.credit.findUnique({
        where: { id: newCredit.id },
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

      res.status(201).json(credit);
    } catch (error) {
      console.error('Erreur lors de la création du crédit:', error);
      res.status(500).json({ error: 'Erreur lors de la création du crédit' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
