import { PDFGenerator, formatCurrency, formatDate } from '../pdfGenerator';

export interface BankTransferData {
  periode: {
    mois: number;
    annee: string;
  };
  employees: Array<{
    matricule: string;
    nom: string;
    prenom: string;
    compteBancaire: string;
    agence: string;
    salaireNet: number;
  }>;
  totaux: {
    totalSalaireNet: number;
    nombreEmployes: number;
  };
}

export async function generateBankTransferPDF(data: BankTransferData): Promise<Buffer> {
  const pdf = new PDFGenerator();
  
  // Header
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  const monthName = monthNames[data.periode.mois - 1];
  const title = 'ORDRE DE VIREMENT MASSE SALARIALE';
  const subtitle = `${monthName} ${data.periode.annee}`;
  
  pdf.addHeader(title, subtitle);

  // Transfer Information
  pdf.addSectionTitle('INFORMATIONS DU VIREMENT');
  pdf.addKeyValue('Période', `${monthName} ${data.periode.annee}`);
  pdf.addKeyValue('Date d\'exécution', formatDate(new Date()));
  pdf.addKeyValue('Nombre de bénéficiaires', data.totaux.nombreEmployes.toString());
  pdf.addKeyValue('Montant total', formatCurrency(data.totaux.totalSalaireNet));

  pdf.addSpace(15);

  // Bank Transfer Details Table
  pdf.addSectionTitle('DÉTAIL DES VIREMENTS');
  
  const headers = [
    'Matricule',
    'Nom & Prénom',
    'Compte Bancaire',
    'Agence',
    'Montant (MAD)'
  ];

  const rows: (string | number)[][] = data.employees.map(emp => [
    emp.matricule,
    `${emp.prenom} ${emp.nom}`,
    emp.compteBancaire || 'Non renseigné',
    emp.agence || 'Non renseignée',
    formatCurrency(emp.salaireNet)
  ]);

  pdf.addTable(headers, rows, {
    alternateRowColor: '#f8fafc'
  });

  pdf.addSpace(15);

  // Summary Section
  pdf.addSummaryBox('RÉCAPITULATIF DU VIREMENT', [
    { label: 'Nombre de virements', value: data.totaux.nombreEmployes.toString() },
    { label: 'Montant total à virer', value: formatCurrency(data.totaux.totalSalaireNet), highlight: true }
  ]);

  pdf.addSpace(20);

  // Instructions
  pdf.addSectionTitle('INSTRUCTIONS BANCAIRES');
  pdf.addParagraph(
    'Veuillez procéder aux virements ci-dessus selon les modalités convenues. ' +
    'Chaque virement doit être effectué sur le compte bancaire indiqué pour chaque bénéficiaire.',
    { fontSize: 11 }
  );

  pdf.addSpace(15);

  // Date and signature section
  const currentDate = new Date();
  pdf.addParagraph(
    `Fait à Casablanca, le ${formatDate(currentDate)}`,
    { fontSize: 11, align: 'right' }
  );

  pdf.addSpace(30);

  pdf.addParagraph(
    'Le Représentant Légal',
    { fontSize: 11, align: 'right' }
  );

  pdf.addSpace(20);

  pdf.addParagraph(
    '________________________',
    { fontSize: 11, align: 'right' }
  );

  pdf.addParagraph(
    'Signature et cachet',
    { fontSize: 9, align: 'right', color: '#64748b' }
  );

  pdf.addSpace(20);

  // Legal notice
  pdf.addParagraph(
    'Ce document constitue un ordre de virement pour le paiement des salaires. ' +
    'Il doit être conservé comme justificatif comptable.',
    { fontSize: 8, align: 'center', color: '#64748b' }
  );

  return pdf.getBuffer();
}
