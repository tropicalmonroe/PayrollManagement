import { PDFGenerator, formatCurrency, formatDate } from '../pdfGenerator';

export interface FinalSettlementData {
employee: {
    matricule: string;
    nom: string;
    prenom: string;
    fonction: string;
    dateEmbauche: Date | string;
    anciennete: number;
};
settlement: {
    dateFin: Date | string;
    motifDepart: string;
    salaireBase: number;
    congesNonPris: number;
    indemniteDepart: number;
    autresIndemnites: number;
    retenues: number;
    totalAvances: number;
    totalCredits: number;
    totalGains: number;
    totalRetenues: number;
    soldeNet: number;
};
avancesNonRemboursees?: Array<{
    id: string;
    montant: number;
    dateOctroi: Date | string;
    soldeRestant: number;
}>;
creditsActifs?: Array<{
    id: string;
    montant: number;
    dateOctroi: Date | string;
    soldeRestant: number;
}>;
}

export async function generateFinalSettlementPDF(data: FinalSettlementData): Promise<Buffer> {
const pdf = new PDFGenerator();

// Header
const title = 'SOLDE DE TOUT COMPTE';
const subtitle = `Fin de contrat - ${formatDate(data.settlement.dateFin)}`;

pdf.addHeader(title, subtitle);

pdf.addSpace(15);

// Employee Information Section
pdf.addSectionTitle('INFORMATIONS DU SALARIÉ');

pdf.addKeyValue('Nom et Prénom', `${data.employee.prenom} ${data.employee.nom}`);
pdf.addKeyValue('Matricule', data.employee.matricule);
pdf.addKeyValue('Fonction', data.employee.fonction);
pdf.addKeyValue('Date d\'embauche', formatDate(data.employee.dateEmbauche));
pdf.addKeyValue('Date de fin de contrat', formatDate(data.settlement.dateFin));
pdf.addKeyValue('Ancienneté', `${data.employee.anciennete} ans`);
pdf.addKeyValue('Motif de départ', data.settlement.motifDepart);

pdf.addSpace(15);

// Earnings Section
pdf.addSectionTitle('ÉLÉMENTS À PAYER');

const gainsHeaders = ['Désignation', 'Montant (MAD)'];
const gainsRows: (string | number)[][] = [
    ['Salaire de base (prorata)', formatCurrency(data.settlement.salaireBase)]
];

if (data.settlement.congesNonPris > 0) {
    gainsRows.push(['Congés non pris', formatCurrency(data.settlement.congesNonPris)]);
}

if (data.settlement.indemniteDepart > 0) {
    gainsRows.push(['Indemnité de départ', formatCurrency(data.settlement.indemniteDepart)]);
}

if (data.settlement.autresIndemnites > 0) {
    gainsRows.push(['Autres indemnités', formatCurrency(data.settlement.autresIndemnites)]);
}

pdf.addTable(gainsHeaders, gainsRows, {
    alternateRowColor: '#f8fafc'
});

pdf.addSpace(10);

// Deductions Section
pdf.addSectionTitle('ÉLÉMENTS À RETENIR');

const retenuesHeaders = ['Désignation', 'Montant (MAD)'];
const retenuesRows: (string | number)[][] = [];

if (data.settlement.retenues > 0) {
    retenuesRows.push(['Retenues diverses', formatCurrency(data.settlement.retenues)]);
}

if (data.settlement.totalAvances > 0) {
    retenuesRows.push(['Total avances non remboursées', formatCurrency(data.settlement.totalAvances)]);
}

if (data.settlement.totalCredits > 0) {
    retenuesRows.push(['Total crédits actifs', formatCurrency(data.settlement.totalCredits)]);
}

if (retenuesRows.length > 0) {
    pdf.addTable(retenuesHeaders, retenuesRows, {
    alternateRowColor: '#f8fafc'
    });
} else {
    pdf.addParagraph('Aucune retenue à effectuer', { fontSize: 10, color: '#64748b' });
}

pdf.addSpace(15);

// Detailed breakdown of advances if any
if (data.avancesNonRemboursees && data.avancesNonRemboursees.length > 0) {
    pdf.addSectionTitle('DÉTAIL DES AVANCES NON REMBOURSÉES');
    
    const avancesHeaders = ['Date d\'octroi', 'Montant initial', 'Solde restant'];
    const avancesRows: (string | number)[][] = data.avancesNonRemboursees.map(avance => [
    formatDate(avance.dateOctroi),
    formatCurrency(avance.montant),
    formatCurrency(avance.soldeRestant)
    ]);

    pdf.addTable(avancesHeaders, avancesRows, {
    alternateRowColor: '#f8fafc'
    });

    pdf.addSpace(10);
}

// Detailed breakdown of credits if any
if (data.creditsActifs && data.creditsActifs.length > 0) {
    pdf.addSectionTitle('DÉTAIL DES CRÉDITS ACTIFS');
    
    const creditsHeaders = ['Date d\'octroi', 'Montant initial', 'Solde restant'];
    const creditsRows: (string | number)[][] = data.creditsActifs.map(credit => [
    formatDate(credit.dateOctroi),
    formatCurrency(credit.montant),
    formatCurrency(credit.soldeRestant)
    ]);

    pdf.addTable(creditsHeaders, creditsRows, {
    alternateRowColor: '#f8fafc'
    });

    pdf.addSpace(10);
}

// Summary Section
pdf.addSummaryBox('RÉCAPITULATIF DU SOLDE', [
    { label: 'Total des éléments à payer', value: formatCurrency(data.settlement.totalGains) },
    { label: 'Total des éléments à retenir', value: formatCurrency(data.settlement.totalRetenues) },
    { 
    label: data.settlement.soldeNet >= 0 ? 'Solde net à payer' : 'Solde net dû par le salarié', 
    value: formatCurrency(Math.abs(data.settlement.soldeNet)), 
    highlight: true 
    }
]);

pdf.addSpace(20);

// Legal text
pdf.addParagraph(
    'Le présent solde de tout compte fait l\'objet d\'un règlement définitif entre les parties. ' +
    'Le salarié reconnaît avoir reçu tous les montants qui lui sont dus au titre de son contrat de travail.',
    { fontSize: 11 }
);

pdf.addSpace(15);

// Signature section
const currentDate = new Date();
pdf.addParagraph(
    `Établi à Casablanca, le ${formatDate(currentDate)}`,
    { fontSize: 11 }
);

pdf.addSpace(20);

// Two column layout for signatures
pdf.addParagraph(
    'L\'EMPLOYEUR                                                    LE SALARIÉ',
    { fontSize: 11 }
);

pdf.addSpace(30);

pdf.addParagraph(
    '________________________                    ________________________',
    { fontSize: 11 }
);

pdf.addParagraph(
    'Signature et cachet                                        Signature précédée de',
    { fontSize: 9, color: '#64748b' }
);

pdf.addParagraph(
    '                                                                    "Lu et approuvé"',
    { fontSize: 9, color: '#64748b' }
);

pdf.addSpace(20);

// Legal notice
pdf.addParagraph(
    'Ce document est établi en deux exemplaires originaux, un pour chaque partie. ' +
    'Il fait foi entre les parties et clôt définitivement les comptes.',
    { fontSize: 8, align: 'center', color: '#64748b' }
);

return pdf.getBuffer();
}
