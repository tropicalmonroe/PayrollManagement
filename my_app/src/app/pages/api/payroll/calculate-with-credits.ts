import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { calculerPaie, type EmployeePayrollData } from '../../../lib/payrollCalculations';
import { obtenirEcheanceCourante, calculerStatistiquesEcheancier } from '../../../lib/simpleEcheancier';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { employeeId, mois, annee } = req.body;

      if (!employeeId || !mois || !annee) {
        return res.status(400).json({ error: 'Paramètres manquants: employeeId, mois, annee requis' });
      }

      // Récupérer les données de l'employé
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
          credits: {
            where: { statut: 'ACTIF' },
            include: {
              echeancier: {
                where: { statut: 'EN_ATTENTE' },
                orderBy: { numeroEcheance: 'asc' }
              }
            }
          },
          advances: {
            where: { statut: 'EN_COURS' }
          },
          variableElements: {
            where: {
              mois: mois,
              annee: annee
            }
          }
        }
      });

      if (!employee) {
        return res.status(404).json({ error: 'Employé non trouvé' });
      }

      // Calculer les retenues de crédits pour ce mois
      let totalCreditLogement = 0;
      let totalCreditConsommation = 0;
      let totalInteretsCredit = 0;
      const detailsCredits: any[] = [];

      for (const credit of employee.credits) {
        // Convertir les échéances de la base vers le format SimpleEcheance
        const echeancesSimples = credit.echeancier.map(e => ({
          numeroEcheance: e.numeroEcheance,
          dateEcheance: e.dateEcheance,
          montantAPayer: e.mensualiteTTC, // Conversion du nom de propriété
          statut: e.statut as 'EN_ATTENTE' | 'PAYEE' | 'EN_RETARD' | 'ANNULEE',
          notes: e.notes || undefined
        }));
        
        const echeanceCourante = obtenirEcheanceCourante(echeancesSimples);
        
        if (echeanceCourante) {
          const montantMensuel = echeanceCourante.montantAPayer;
          const echeanceDB = credit.echeancier.find(e => e.numeroEcheance === echeanceCourante.numeroEcheance);
          const interets = echeanceDB?.interetsHT || 0;
          
          if (credit.type === 'LOGEMENT') {
            totalCreditLogement += montantMensuel;
          } else if (credit.type === 'CONSOMMATION') {
            totalCreditConsommation += montantMensuel;
          }
          
          totalInteretsCredit += interets;
          
          detailsCredits.push({
            creditId: credit.id,
            type: credit.type,
            banque: credit.banque,
            mensualite: montantMensuel,
            interets: interets,
            numeroEcheance: echeanceCourante.numeroEcheance,
            dateEcheance: echeanceCourante.dateEcheance,
            capitalRestant: echeanceDB?.capitalRestant || 0
          });
        }
      }

      // Calculer les avances en cours
      let totalAvances = 0;
      const detailsAvances: any[] = [];

      for (const avance of employee.advances) {
        totalAvances += avance.montantMensualite;
        detailsAvances.push({
          avanceId: avance.id,
          montantMensualite: avance.montantMensualite,
          soldeRestant: avance.soldeRestant,
          motif: avance.motif
        });
      }

      // Préparer les données pour le calcul de paie
      const payrollData: EmployeePayrollData = {
        nom: employee.nom,
        prenom: employee.prenom,
        matricule: employee.matricule,
        cin: employee.cin || '',
        cnss: employee.cnss || '',
        situationFamiliale: employee.situationFamiliale,
        dateNaissance: employee.dateNaissance || new Date(),
        dateEmbauche: employee.dateEmbauche,
        anciennete: employee.anciennete,
        nbrDeductions: employee.nbrDeductions,
        nbreJourMois: employee.nbreJourMois,
        salaireBase: employee.salaireBase,
        indemniteLogement: employee.indemniteLogement,
        indemnitePanier: employee.indemnitePanier,
        primeTransport: employee.primeTransport,
        indemniteRepresentation: employee.indemniteRepresentation,
        assurances: {
          assuranceMaladieComplementaire: false,
          assuranceMaladieEtranger: false,
          assuranceInvaliditeRenforcee: false
        },
        creditImmobilier: totalCreditLogement > 0 ? {
          montantMensuel: totalCreditLogement,
          interets: totalInteretsCredit
        } : undefined,
        creditConsommation: totalCreditConsommation > 0 ? {
          montantMensuel: totalCreditConsommation
        } : undefined,
        avanceSalaire: totalAvances > 0 ? {
          montantMensuel: totalAvances
        } : undefined,
        variableElements: employee.variableElements.map(ve => ({
          ...ve,
          heures: ve.heures ?? undefined,
          taux: ve.taux ?? undefined
        })),
        compteBancaire: employee.compteBancaire || '',
        agence: employee.agence || '',
        useCnssPrestation: employee.useCnssPrestation,
        useAmoSalariale: employee.useAmoSalariale,
        useRetraiteSalariale: employee.useRetraiteSalariale,
        useAssuranceDiversSalariale: employee.useAssuranceDiversSalariale
      };

      // Calculer la paie avec les crédits intégrés
      const resultatPaie = calculerPaie(payrollData);

      // Sauvegarder le calcul de paie
      const payrollCalculation = await prisma.payrollCalculation.upsert({
        where: {
          employeeId_mois_annee: {
            employeeId,
            mois,
            annee
          }
        },
        update: {
          salaireBase: resultatPaie.gains.salaireBase,
          primeAnciennete: resultatPaie.gains.primeAnciennete,
          indemniteLogement: resultatPaie.gains.indemniteLogement,
          indemnitePanier: resultatPaie.gains.indemnitePanier,
          primeTransport: resultatPaie.gains.primeTransport,
          indemniteRepresentation: resultatPaie.gains.indemniteRepresentation,
          heuresSupplementaires: resultatPaie.gains.heuresSupplementaires || 0,
          primesExceptionnelles: resultatPaie.gains.primesExceptionnelles || 0,
          autresGains: resultatPaie.gains.autresGains || 0,
          totalGains: resultatPaie.gains.totalGains,
          salaireBrutImposable: resultatPaie.salaireBrutImposable,
          cnssPrestations: resultatPaie.cotisationsSalariales.cnssPrestation,
          amo: resultatPaie.cotisationsSalariales.amoSalariale,
          retraite: resultatPaie.cotisationsSalariales.retraiteSalariale,
          assuranceDivers: resultatPaie.cotisationsSalariales.assuranceDiversSalariale,
          impotRevenu: resultatPaie.calculIGR.impotSurRevenu,
          totalRetenues: resultatPaie.totalRetenues,
          cnssPatronale: resultatPaie.cotisationsPatronales.cnssPrestation,
          allocationsFamiliales: resultatPaie.cotisationsPatronales.allocationsFamiliales,
          taxeFormationProf: resultatPaie.cotisationsPatronales.taxeFormation,
          amoPatronale: resultatPaie.cotisationsPatronales.amoPatronale,
          participationAMO: resultatPaie.cotisationsPatronales.participationAMO,
          accidentTravail: resultatPaie.cotisationsPatronales.accidentTravail,
          retraitePatronale: resultatPaie.cotisationsPatronales.retraitePatronale,
          assuranceDiversPatronale: resultatPaie.cotisationsPatronales.assuranceDiversPatronale,
          totalCotisationsPatronales: resultatPaie.cotisationsPatronales.totalCotisationsPatronales,
          fraisProfessionnels: resultatPaie.calculIGR.fraisProfessionnels,
          netImposable: resultatPaie.calculIGR.netImposable,
          interetsCredit: totalInteretsCredit,
          netNetImposable: resultatPaie.calculIGR.netNetImposable,
          igrTheorique: resultatPaie.calculIGR.igrTheorique,
          salaireNetAPayer: resultatPaie.salaireNetAPayer,
          remboursementCredit: totalCreditLogement + totalCreditConsommation,
          creditConso: totalCreditConsommation,
          remboursementAvance: totalAvances
        },
        create: {
          employeeId,
          mois,
          annee,
          salaireBase: resultatPaie.gains.salaireBase,
          primeAnciennete: resultatPaie.gains.primeAnciennete,
          indemniteLogement: resultatPaie.gains.indemniteLogement,
          indemnitePanier: resultatPaie.gains.indemnitePanier,
          primeTransport: resultatPaie.gains.primeTransport,
          indemniteRepresentation: resultatPaie.gains.indemniteRepresentation,
          heuresSupplementaires: resultatPaie.gains.heuresSupplementaires || 0,
          primesExceptionnelles: resultatPaie.gains.primesExceptionnelles || 0,
          autresGains: resultatPaie.gains.autresGains || 0,
          totalGains: resultatPaie.gains.totalGains,
          salaireBrutImposable: resultatPaie.salaireBrutImposable,
          cnssPrestations: resultatPaie.cotisationsSalariales.cnssPrestation,
          amo: resultatPaie.cotisationsSalariales.amoSalariale,
          retraite: resultatPaie.cotisationsSalariales.retraiteSalariale,
          assuranceDivers: resultatPaie.cotisationsSalariales.assuranceDiversSalariale,
          impotRevenu: resultatPaie.calculIGR.impotSurRevenu,
          totalRetenues: resultatPaie.totalRetenues,
          cnssPatronale: resultatPaie.cotisationsPatronales.cnssPrestation,
          allocationsFamiliales: resultatPaie.cotisationsPatronales.allocationsFamiliales,
          taxeFormationProf: resultatPaie.cotisationsPatronales.taxeFormation,
          amoPatronale: resultatPaie.cotisationsPatronales.amoPatronale,
          participationAMO: resultatPaie.cotisationsPatronales.participationAMO,
          accidentTravail: resultatPaie.cotisationsPatronales.accidentTravail,
          retraitePatronale: resultatPaie.cotisationsPatronales.retraitePatronale,
          assuranceDiversPatronale: resultatPaie.cotisationsPatronales.assuranceDiversPatronale,
          totalCotisationsPatronales: resultatPaie.cotisationsPatronales.totalCotisationsPatronales,
          fraisProfessionnels: resultatPaie.calculIGR.fraisProfessionnels,
          netImposable: resultatPaie.calculIGR.netImposable,
          interetsCredit: totalInteretsCredit,
          netNetImposable: resultatPaie.calculIGR.netNetImposable,
          igrTheorique: resultatPaie.calculIGR.igrTheorique,
          salaireNetAPayer: resultatPaie.salaireNetAPayer,
          remboursementCredit: totalCreditLogement + totalCreditConsommation,
          creditConso: totalCreditConsommation,
          remboursementAvance: totalAvances
        }
      });

      res.status(200).json({
        message: 'Calcul de paie effectué avec succès',
        payrollCalculation,
        resultatPaie,
        detailsCredits,
        detailsAvances,
        resume: {
          totalCreditLogement,
          totalCreditConsommation,
          totalInteretsCredit,
          totalAvances,
          salaireNetAPayer: resultatPaie.salaireNetAPayer,
          totalRetenues: resultatPaie.totalRetenues
        }
      });

    } catch (error) {
      console.error('Erreur lors du calcul de paie avec crédits:', error);
      res.status(500).json({ error: 'Erreur lors du calcul de paie avec crédits' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
