import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import { DocumentType, DocumentStatus } from '@prisma/client';
import { generateFinalSettlementPDF, FinalSettlementData } from '../../../../../lib/pdfGenerators/finalSettlementPDF';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { 
        employeeId, 
        dateFin, 
        motifDepart, 
        congesNonPris, 
        indemniteDepart, 
        autresIndemnites,
        retenues 
      } = req.body;

      if (!employeeId || !dateFin || !motifDepart) {
        return res.status(400).json({ 
          error: 'Les paramètres employeeId, dateFin et motifDepart sont requis' 
        });
      }

      // Vérifier si l'employé existe
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId }
      });

      if (!employee) {
        return res.status(404).json({ error: 'Employé non trouvé' });
      }

      // Récupérer le dernier calcul de paie
      const lastPayrollCalculation = await prisma.payrollCalculation.findFirst({
        where: { employeeId },
        orderBy: { createdAt: 'desc' }
      });

      // Récupérer les avances non remboursées
      const unpaidAdvances = await prisma.advance.findMany({
        where: {
          employeeId,
          statut: 'EN_COURS'
        }
      });

      // Récupérer les crédits actifs
      const activeCredits = await prisma.credit.findMany({
        where: {
          employeeId,
          statut: 'ACTIF'
        }
      });

      // Calculer les montants
      const salaireBase = employee.salaireBase;
      const congesNonPrisAmount = parseFloat(congesNonPris) || 0;
      const indemniteAmount = parseFloat(indemniteDepart) || 0;
      const autresIndemniteAmount = parseFloat(autresIndemnites) || 0;
      const retenuesAmount = parseFloat(retenues) || 0;

      // Calculer le total des avances à déduire
      const totalAvances = unpaidAdvances.reduce((sum, advance) => sum + advance.soldeRestant, 0);

      // Calculer le total des crédits à déduire
      const totalCredits = activeCredits.reduce((sum, credit) => sum + credit.soldeRestant, 0);

      // Calculs du solde
      const totalGains = salaireBase + congesNonPrisAmount + indemniteAmount + autresIndemniteAmount;
      const totalRetenues = retenuesAmount + totalAvances + totalCredits;
      const soldeNet = totalGains - totalRetenues;

      const periode = new Date(dateFin).toLocaleDateString('fr-FR');

      // Préparer les données pour le PDF
      const settlementData: FinalSettlementData = {
        employee: {
          matricule: employee.matricule,
          nom: employee.nom,
          prenom: employee.prenom,
          fonction: employee.fonction,
          dateEmbauche: employee.dateEmbauche,
          anciennete: employee.anciennete
        },
        settlement: {
          dateFin: new Date(dateFin),
          motifDepart,
          salaireBase,
          congesNonPris: congesNonPrisAmount,
          indemniteDepart: indemniteAmount,
          autresIndemnites: autresIndemniteAmount,
          retenues: retenuesAmount,
          totalAvances,
          totalCredits,
          totalGains,
          totalRetenues,
          soldeNet
        },
        avancesNonRemboursees: unpaidAdvances.map(advance => ({
          id: advance.id,
          montant: advance.montant,
          dateOctroi: advance.dateAvance,
          soldeRestant: advance.soldeRestant
        })),
        creditsActifs: activeCredits.map(credit => ({
          id: credit.id,
          montant: credit.montantCredit,
          dateOctroi: credit.dateDebut,
          soldeRestant: credit.soldeRestant
        }))
      };

      // Générer le PDF
      const pdfBuffer = await generateFinalSettlementPDF(settlementData);

      // Créer le document solde de tout compte
      const document = await prisma.document.create({
        data: {
          type: DocumentType.SOLDE_COMPTE,
          title: `Solde de tout compte - ${employee.prenom} ${employee.nom}`,
          description: `Solde de tout compte suite à ${motifDepart}`,
          employeeId,
          periode,
          generatedBy: 'system', // À remplacer par l'ID de l'utilisateur connecté
          fileSize: pdfBuffer.length,
          status: DocumentStatus.GENERATED,
          metadata: {
            dateFin,
            motifDepart,
            salaireBase,
            congesNonPris: congesNonPrisAmount,
            indemniteDepart: indemniteAmount,
            autresIndemnites: autresIndemniteAmount,
            retenues: retenuesAmount,
            totalAvances,
            totalCredits,
            totalGains,
            totalRetenues,
            soldeNet,
            dateEmbauche: employee.dateEmbauche,
            anciennete: employee.anciennete,
            fonction: employee.fonction
          }
        },
        include: {
          employee: {
            select: {
              id: true,
              matricule: true,
              nom: true,
              prenom: true,
              fonction: true,
              dateEmbauche: true,
              anciennete: true
            }
          }
        }
      });

      // Retourner le PDF directement
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="solde-tout-compte-${employee.matricule}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.status(200).send(pdfBuffer);
    } catch (error) {
      console.error('Error generating final settlement:', error);
      res.status(500).json({ error: 'Erreur lors de la génération du solde de tout compte' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
