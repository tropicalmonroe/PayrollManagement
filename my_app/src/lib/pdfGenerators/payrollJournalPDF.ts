import { PDFGenerator, formatCurrency, formatDate } from '../pdfGenerator';

export interface PayrollJournalData {
  periode: {
    mois: number;
    annee: string;
  };
  employees: Array<{
    matricule: string;
    nom: string;
    prenom: string;
    fonction: string;
    salaireBase: number;
    totalGains: number;
    totalRetenues: number;
    salaireNet: number;
    cnssPatronale: number;
    allocationsFamiliales: number;
    taxeFormationProf: number;
    amoPatronale: number;
    accidentTravail: number;
    totalCotisationsPatronales: number;
  }>;
  totaux: {
    totalSalaireBase: number;
    totalGains: number;
    totalRetenues: number;
    totalSalaireNet: number;
    totalCnssPatronale: number;
    totalAllocationsFamiliales: number;
    totalTaxeFormationProf: number;
    totalAmoPatronale: number;
    totalAccidentTravail: number;
    totalCotisationsPatronales: number;
  };
}

export async function generatePayrollJournalPDF(data: PayrollJournalData): Promise<Buffer> {
  const pdf = new PDFGenerator();
  
  // Header
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  const monthName = monthNames[data.periode.mois - 1];
  const title = 'JOURNAL DE PAIE';
  const subtitle = `${monthName} ${data.periode.annee}`;
  
  pdf.addHeader(title, subtitle);

  // Period Information
  pdf.addSectionTitle('PÉRIODE');
  pdf.addKeyValue('Mois', monthName);
  pdf.addKeyValue('Année', data.periode.annee);
  pdf.addKeyValue('Nombre d\'employés', data.employees.length.toString());

  pdf.addSpace(15);

  // Employee Details Table
  pdf.addSectionTitle('DÉTAIL PAR EMPLOYÉ');
  
  const headers = [
    'Matricule',
    'Nom & Prénom',
    'Fonction',
    'Salaire Base',
    'Total Gains',
    'Total Retenues',
    'Salaire Net'
  ];

  const rows: (string | number)[][] = data.employees.map(emp => [
    emp.matricule,
    `${emp.prenom} ${emp.nom}`,
    emp.fonction,
    formatCurrency(emp.salaireBase),
    formatCurrency(emp.totalGains),
    formatCurrency(emp.totalRetenues),
    formatCurrency(emp.salaireNet)
  ]);

  pdf.addTable(headers, rows, {
    alternateRowColor: '#f8fafc'
  });

  pdf.addSpace(15);

  // Check if we need a new page for the summary
  pdf.checkPageBreak(80);

  // Summary Section
  pdf.addSummaryBox('RÉCAPITULATIF GÉNÉRAL', [
    { label: 'Total Salaire de Base', value: formatCurrency(data.totaux.totalSalaireBase) },
    { label: 'Total des Gains', value: formatCurrency(data.totaux.totalGains) },
    { label: 'Total des Retenues', value: formatCurrency(data.totaux.totalRetenues) },
    { label: 'Total Salaire Net', value: formatCurrency(data.totaux.totalSalaireNet), highlight: true }
  ]);

  pdf.addSpace(15);

  // Employer Contributions Summary
  pdf.addSectionTitle('COTISATIONS PATRONALES');
  
  const cotisationsHeaders = ['Désignation', 'Montant (MAD)'];
  const cotisationsRows: (string | number)[][] = [
    ['CNSS Patronale', formatCurrency(data.totaux.totalCnssPatronale)],
    ['Allocations Familiales', formatCurrency(data.totaux.totalAllocationsFamiliales)],
    ['Taxe Formation Professionnelle', formatCurrency(data.totaux.totalTaxeFormationProf)],
    ['AMO Patronale', formatCurrency(data.totaux.totalAmoPatronale)],
    ['Accident de Travail', formatCurrency(data.totaux.totalAccidentTravail)]
  ];

  pdf.addTable(cotisationsHeaders, cotisationsRows, {
    alternateRowColor: '#f8fafc'
  });

  pdf.addSpace(10);

  pdf.addSummaryBox('TOTAL COTISATIONS PATRONALES', [
    { label: 'Total', value: formatCurrency(data.totaux.totalCotisationsPatronales), highlight: true }
  ]);

  pdf.addSpace(15);

  // Cost Summary
  pdf.addSummaryBox('COÛT TOTAL DE LA MASSE SALARIALE', [
    { label: 'Salaires nets versés', value: formatCurrency(data.totaux.totalSalaireNet) },
    { label: 'Cotisations patronales', value: formatCurrency(data.totaux.totalCotisationsPatronales) },
    { 
      label: 'COÛT TOTAL', 
      value: formatCurrency(data.totaux.totalSalaireNet + data.totaux.totalCotisationsPatronales), 
      highlight: true 
    }
  ]);

  pdf.addSpace(20);

  // Legal Notice
  pdf.addParagraph(
    'Ce journal de paie récapitule l\'ensemble des éléments de rémunération et des charges sociales ' +
    'pour la période indiquée. Il constitue un document comptable et social de référence.',
    { fontSize: 8, align: 'center', color: '#64748b' }
  );

  return pdf.getBuffer();
}
