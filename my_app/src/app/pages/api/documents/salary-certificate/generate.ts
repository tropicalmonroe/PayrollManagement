import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { DocumentType, DocumentStatus } from '@prisma/client';
import { generateSalaryCertificatePDF, SalaryCertificateData } from '../../../../lib/pdfGenerators/salaryCertificatePDF';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { employeeId, type, dateDebut, dateFin, motif } = req.body;

      if (!employeeId || !type || !dateDebut || !dateFin) {
        return res.status(400).json({ 
          error: 'Les paramètres employeeId, type, dateDebut et dateFin sont requis' 
        });
      }

      // Vérifier si l'employé existe
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId }
      });

      if (!employee) {
        return res.status(404).json({ error: 'Employé non trouvé' });
      }

      // Calculer la période pour l'attestation
      const startDate = new Date(dateDebut);
      const endDate = new Date(dateFin);
      const periode = `${startDate.toLocaleDateString('fr-FR')} - ${endDate.toLocaleDateString('fr-FR')}`;

      // Récupérer les calculs de paie pour la période demandée
      const payrollCalculations = await prisma.payrollCalculation.findMany({
        where: {
          employeeId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Calculer les moyennes et totaux
      let totalSalaireBrut = 0;
      let totalSalaireNet = 0;
      let nombreMois = payrollCalculations.length;

      payrollCalculations.forEach(calc => {
        totalSalaireBrut += calc.totalGains;
        totalSalaireNet += calc.salaireNetAPayer;
      });

      const salaireBrutMoyen = nombreMois > 0 ? totalSalaireBrut / nombreMois : employee.salaireBase;
      const salaireNetMoyen = nombreMois > 0 ? totalSalaireNet / nombreMois : employee.salaireNet;

      // Préparer les données pour le PDF
      const certificateData: SalaryCertificateData = {
        employee: {
          matricule: employee.matricule,
          nom: employee.nom,
          prenom: employee.prenom,
          fonction: employee.fonction,
          dateEmbauche: employee.dateEmbauche,
          anciennete: employee.anciennete,
          situationFamiliale: employee.situationFamiliale,
          cin: employee.cin || '',
          cnss: employee.cnss || '',
          salaireBase: employee.salaireBase,
          primeTransport: employee.primeTransport,
          indemniteRepresentation: employee.indemniteRepresentation,
          indemniteLogement: employee.indemniteLogement
        },
        certificate: {
          typeAttestation: type,
          dateDebut: startDate,
          dateFin: endDate,
          motif: motif || '',
          salaireBrutMoyen,
          salaireNetMoyen,
          nombreMoisCalcules: nombreMois
        }
      };

      // Générer le PDF
      const pdfBuffer = await generateSalaryCertificatePDF(certificateData);

      // Créer le document attestation de salaire
      const document = await prisma.document.create({
        data: {
          type: DocumentType.ATTESTATION_SALAIRE,
          title: `Attestation de salaire - ${employee.prenom} ${employee.nom}`,
          description: `Attestation de ${type} pour la période ${periode}`,
          employeeId,
          periode,
          generatedBy: 'system', // À remplacer par l'ID de l'utilisateur connecté
          fileSize: pdfBuffer.length,
          status: DocumentStatus.GENERATED,
          metadata: {
            typeAttestation: type,
            dateDebut,
            dateFin,
            motif: motif || '',
            salaireBrutMoyen,
            salaireNetMoyen,
            nombreMoisCalcules: nombreMois,
            dateEmbauche: employee.dateEmbauche,
            fonction: employee.fonction,
            anciennete: employee.anciennete
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
              anciennete: true,
              salaireBase: true,
              primeTransport: true,
              indemniteRepresentation: true,
              indemniteLogement: true,
              situationFamiliale: true,
              cin: true,
              cnss: true
            }
          }
        }
      });

      // Retourner le PDF directement
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="attestation-salaire-${employee.matricule}-${type}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.status(200).send(pdfBuffer);
    } catch (error) {
      console.error('Error generating salary certificate:', error);
      res.status(500).json({ error: 'Erreur lors de la génération de l\'attestation de salaire' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
