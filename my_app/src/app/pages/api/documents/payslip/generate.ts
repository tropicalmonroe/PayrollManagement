import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { DocumentType, DocumentStatus } from '@prisma/client';
import { generatePayslipPDF, PayslipData } from '../../../../lib/pdfGenerators/payslipPDF';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { employeeId, mois, annee } = req.body;

      if (!employeeId || !mois || !annee) {
        return res.status(400).json({ 
          error: 'Les paramètres employeeId, mois et annee sont requis' 
        });
      }

      // Vérifier si l'employé existe
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId }
      });

      if (!employee) {
        return res.status(404).json({ error: 'Employé non trouvé' });
      }

      // Vérifier si le calcul de paie existe pour cette période
      let payrollCalculation = await prisma.payrollCalculation.findFirst({
        where: {
          employeeId,
          mois,
          annee: annee.toString()
        }
      });

      // Si aucun calcul trouvé, créer un calcul de base
      if (!payrollCalculation) {
        const totalGains = employee.salaireBase + employee.primeAnciennete + employee.indemniteLogement + employee.indemnitePanier + employee.primeTransport + employee.indemniteRepresentation;
        const cotisationCNSS = Math.round(totalGains * 0.0448 * 100) / 100;
        const cotisationAMO = Math.round(totalGains * 0.0226 * 100) / 100;
        const totalRetenues = cotisationCNSS + cotisationAMO;
        const salaireNet = totalGains - totalRetenues;

        payrollCalculation = await prisma.payrollCalculation.create({
          data: {
            employeeId,
            mois,
            annee: annee.toString(),
            salaireBase: employee.salaireBase,
            tauxAnciennete: employee.tauxAnciennete,
            primeAnciennete: employee.primeAnciennete,
            indemniteLogement: employee.indemniteLogement,
            indemnitePanier: employee.indemnitePanier,
            primeTransport: employee.primeTransport,
            indemniteRepresentation: employee.indemniteRepresentation,
            heuresSupplementaires: 0,
            primesExceptionnelles: 0,
            autresGains: 0,
            totalGains,
            salaireBrutImposable: totalGains,
            cnssPrestations: cotisationCNSS,
            amo: cotisationAMO,
            retraite: 0,
            assuranceDivers: 0,
            impotRevenu: 0,
            absences: 0,
            retards: 0,
            avances: 0,
            autresRetenues: 0,
            totalRetenues,
            cnssPatronale: Math.round(totalGains * 0.1265 * 100) / 100,
            allocationsFamiliales: Math.round(totalGains * 0.0675 * 100) / 100,
            taxeFormationProf: Math.round(totalGains * 0.016 * 100) / 100,
            amoPatronale: Math.round(totalGains * 0.0226 * 100) / 100,
            participationAMO: 0,
            accidentTravail: Math.round(totalGains * 0.0012 * 100) / 100,
            retraitePatronale: 0,
            assuranceDiversPatronale: 0,
            totalCotisationsPatronales: Math.round((totalGains * 0.1265 + totalGains * 0.0675 + totalGains * 0.016 + totalGains * 0.0226 + totalGains * 0.0012) * 100) / 100,
            fraisProfessionnels: Math.min(totalGains * 0.20, 2500),
            netImposable: totalGains - Math.min(totalGains * 0.20, 2500),
            interetsCredit: 0,
            netNetImposable: totalGains - Math.min(totalGains * 0.20, 2500),
            igrTheorique: 0,
            salaireNetAPayer: salaireNet,
            remboursementCredit: 0,
            creditConso: 0,
            contributionSociale: 0,
            remboursementAvance: 0
          }
        });
      }

      // Vérifier si un bulletin existe déjà pour cette période
      const existingDocument = await prisma.document.findFirst({
        where: {
          type: DocumentType.BULLETIN_PAIE,
          employeeId,
          periode: `${mois} ${annee}`
        }
      });

      if (existingDocument) {
        return res.status(409).json({ 
          error: 'Un bulletin de paie existe déjà pour cette période',
          document: existingDocument
        });
      }

      // Préparer les données pour le PDF
      const payslipData: PayslipData = {
        employee: {
          matricule: employee.matricule,
          nom: employee.nom,
          prenom: employee.prenom,
          fonction: employee.fonction,
          dateEmbauche: employee.dateEmbauche,
          anciennete: employee.anciennete,
          situationFamiliale: employee.situationFamiliale,
          cin: employee.cin || '',
          cnss: employee.cnss || ''
        },
        payroll: {
          mois,
          annee: annee.toString(),
          salaireBase: payrollCalculation.salaireBase,
          primeAnciennete: payrollCalculation.primeAnciennete,
          indemniteLogement: payrollCalculation.indemniteLogement,
          indemnitePanier: payrollCalculation.indemnitePanier,
          primeTransport: payrollCalculation.primeTransport,
          indemniteRepresentation: payrollCalculation.indemniteRepresentation,
          heuresSupplementaires: payrollCalculation.heuresSupplementaires,
          primesExceptionnelles: payrollCalculation.primesExceptionnelles,
          autresGains: payrollCalculation.autresGains,
          totalGains: payrollCalculation.totalGains,
          cnssPrestations: payrollCalculation.cnssPrestations,
          amo: payrollCalculation.amo,
          retraite: payrollCalculation.retraite,
          assuranceDivers: payrollCalculation.assuranceDivers,
          impotRevenu: payrollCalculation.impotRevenu,
          absences: payrollCalculation.absences,
          retards: payrollCalculation.retards,
          avances: payrollCalculation.avances,
          autresRetenues: payrollCalculation.autresRetenues,
          totalRetenues: payrollCalculation.totalRetenues,
          salaireNetAPayer: payrollCalculation.salaireNetAPayer,
          cnssPatronale: payrollCalculation.cnssPatronale,
          allocationsFamiliales: payrollCalculation.allocationsFamiliales,
          taxeFormationProf: payrollCalculation.taxeFormationProf,
          amoPatronale: payrollCalculation.amoPatronale,
          accidentTravail: payrollCalculation.accidentTravail,
          totalCotisationsPatronales: payrollCalculation.totalCotisationsPatronales,
          fraisProfessionnels: payrollCalculation.fraisProfessionnels,
          netImposable: payrollCalculation.netImposable
        }
      };

      // Générer le PDF
      const pdfBuffer = await generatePayslipPDF(payslipData);

      // Créer le document bulletin de paie
      const document = await prisma.document.create({
        data: {
          type: DocumentType.BULLETIN_PAIE,
          title: `Bulletin de paie - ${employee.prenom} ${employee.nom} - ${mois} ${annee}`,
          description: `Bulletin de paie pour la période ${mois} ${annee}`,
          employeeId,
          periode: `${mois} ${annee}`,
          generatedBy: 'system', // À remplacer par l'ID de l'utilisateur connecté
          fileSize: pdfBuffer.length,
          status: DocumentStatus.GENERATED,
          metadata: {
            payrollCalculationId: payrollCalculation.id,
            salaireBrut: payrollCalculation.totalGains,
            salaireNet: payrollCalculation.salaireNetAPayer,
            totalRetenues: payrollCalculation.totalRetenues
          }
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

      // Retourner le PDF directement
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="bulletin-paie-${employee.matricule}-${mois}-${annee}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.status(200).send(pdfBuffer);
    } catch (error) {
      console.error('Error generating payslip:', error);
      res.status(500).json({ error: 'Erreur lors de la génération du bulletin de paie' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
