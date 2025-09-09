import { PDFGenerator, formatCurrency, formatDate } from '../pdfGenerator';

export interface PayslipData {
employee: {
    matricule: string;
    nom: string;
    prenom: string;
    fonction: string;
    dateEmbauche: Date | string;
    anciennete: number;
    situationFamiliale: string;
    cin: string;
    cnss: string;
};
payroll: {
    mois: number;
    annee: string;
    salaireBase: number;
    primeAnciennete: number;
    indemniteLogement: number;
    indemnitePanier: number;
    primeTransport: number;
    indemniteRepresentation: number;
    heuresSupplementaires: number;
    primesExceptionnelles: number;
    autresGains: number;
    totalGains: number;
    cnssPrestations: number;
    amo: number;
    retraite: number;
    assuranceDivers: number;
    impotRevenu: number;
    absences: number;
    retards: number;
    avances: number;
    autresRetenues: number;
    totalRetenues: number;
    salaireNetAPayer: number;
    cnssPatronale: number;
    allocationsFamiliales: number;
    taxeFormationProf: number;
    amoPatronale: number;
    accidentTravail: number;
    totalCotisationsPatronales: number;
    fraisProfessionnels: number;
    netImposable: number;
};
}

export async function generatePayslipPDF(data: PayslipData): Promise<Buffer> {
const pdf = new PDFGenerator();

// Header
const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const monthName = monthNames[data.payroll.mois - 1];
const title = 'BULLETIN DE PAIE';
const subtitle = `${monthName} ${data.payroll.annee}`;

pdf.addHeader(title, subtitle);

// Employee Information Section
pdf.addSectionTitle('INFORMATIONS SALARIÉ');

pdf.addKeyValue('Matricule', data.employee.matricule);
pdf.addKeyValue('Nom et Prénom', `${data.employee.prenom} ${data.employee.nom}`);
pdf.addKeyValue('Fonction', data.employee.fonction);
pdf.addKeyValue('Date d\'embauche', formatDate(data.employee.dateEmbauche));
pdf.addKeyValue('Ancienneté', `${data.employee.anciennete} ans`);
pdf.addKeyValue('Situation familiale', data.employee.situationFamiliale);
pdf.addKeyValue('CIN', data.employee.cin);
pdf.addKeyValue('N° CNSS', data.employee.cnss);

pdf.addSpace(10);

// Earnings Section
pdf.addSectionTitle('GAINS ET AVANTAGES');

const gainsHeaders = ['Désignation', 'Montant (MAD)'];
const gainsRows: (string | number)[][] = [
    ['Salaire de base', formatCurrency(data.payroll.salaireBase)],
    ['Prime d\'ancienneté', formatCurrency(data.payroll.primeAnciennete)],
    ['Indemnité de logement', formatCurrency(data.payroll.indemniteLogement)],
    ['Indemnité panier', formatCurrency(data.payroll.indemnitePanier)],
    ['Prime de transport', formatCurrency(data.payroll.primeTransport)],
    ['Indemnité de représentation', formatCurrency(data.payroll.indemniteRepresentation)]
];

if (data.payroll.heuresSupplementaires > 0) {
    gainsRows.push(['Heures supplémentaires', formatCurrency(data.payroll.heuresSupplementaires)]);
}

if (data.payroll.primesExceptionnelles > 0) {
    gainsRows.push(['Primes exceptionnelles', formatCurrency(data.payroll.primesExceptionnelles)]);
}

if (data.payroll.autresGains > 0) {
    gainsRows.push(['Autres gains', formatCurrency(data.payroll.autresGains)]);
}

pdf.addTable(gainsHeaders, gainsRows, {
    alternateRowColor: '#f8fafc'
});

pdf.addSpace(5);

// Deductions Section
pdf.addSectionTitle('RETENUES ET COTISATIONS');

const retenuesHeaders = ['Désignation', 'Montant (MAD)'];
const retenuesRows: (string | number)[][] = [
    ['CNSS (Prestations)', formatCurrency(data.payroll.cnssPrestations)],
    ['AMO', formatCurrency(data.payroll.amo)]
];

if (data.payroll.retraite > 0) {
    retenuesRows.push(['Retraite', formatCurrency(data.payroll.retraite)]);
}

if (data.payroll.assuranceDivers > 0) {
    retenuesRows.push(['Assurance divers', formatCurrency(data.payroll.assuranceDivers)]);
}

if (data.payroll.impotRevenu > 0) {
    retenuesRows.push(['Impôt sur le revenu', formatCurrency(data.payroll.impotRevenu)]);
}

if (data.payroll.absences > 0) {
    retenuesRows.push(['Absences', formatCurrency(data.payroll.absences)]);
}

if (data.payroll.retards > 0) {
    retenuesRows.push(['Retards', formatCurrency(data.payroll.retards)]);
}

if (data.payroll.avances > 0) {
    retenuesRows.push(['Avances', formatCurrency(data.payroll.avances)]);
}

if (data.payroll.autresRetenues > 0) {
    retenuesRows.push(['Autres retenues', formatCurrency(data.payroll.autresRetenues)]);
}

pdf.addTable(retenuesHeaders, retenuesRows, {
    alternateRowColor: '#f8fafc'
});

pdf.addSpace(10);

// Summary Section
pdf.addSummaryBox('RÉCAPITULATIF', [
    { label: 'Total des gains', value: formatCurrency(data.payroll.totalGains) },
    { label: 'Total des retenues', value: formatCurrency(data.payroll.totalRetenues) },
    { label: 'Salaire net à payer', value: formatCurrency(data.payroll.salaireNetAPayer), highlight: true }
]);

pdf.addSpace(10);

// Employer Contributions Section
pdf.addSectionTitle('COTISATIONS PATRONALES');

const cotisationsHeaders = ['Désignation', 'Montant (MAD)'];
const cotisationsRows: (string | number)[][] = [
    ['CNSS Patronale', formatCurrency(data.payroll.cnssPatronale)],
    ['Allocations familiales', formatCurrency(data.payroll.allocationsFamiliales)],
    ['Taxe formation professionnelle', formatCurrency(data.payroll.taxeFormationProf)],
    ['AMO Patronale', formatCurrency(data.payroll.amoPatronale)],
    ['Accident de travail', formatCurrency(data.payroll.accidentTravail)]
];

pdf.addTable(cotisationsHeaders, cotisationsRows, {
    alternateRowColor: '#f8fafc'
});

pdf.addSpace(5);

pdf.addSummaryBox('TOTAL COTISATIONS PATRONALES', [
    { label: 'Total', value: formatCurrency(data.payroll.totalCotisationsPatronales), highlight: true }
]);

pdf.addSpace(10);

// Tax Information
pdf.addSectionTitle('INFORMATIONS FISCALES');

pdf.addKeyValue('Frais professionnels', formatCurrency(data.payroll.fraisProfessionnels));
pdf.addKeyValue('Net imposable', formatCurrency(data.payroll.netImposable));

pdf.addSpace(15);

// Legal Notice
pdf.addParagraph(
    'Ce bulletin de paie est établi conformément à la législation marocaine en vigueur. ' +
    'Il doit être conservé sans limitation de durée.',
    { fontSize: 8, align: 'center', color: '#64748b' }
);

return pdf.getBuffer();
}
