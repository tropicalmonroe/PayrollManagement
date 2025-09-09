import { PDFGenerator, formatCurrency, formatDate } from '../pdfGenerator';

export interface SalaryCertificateData {
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
    salaireBase: number;
    primeTransport: number;
    indemniteRepresentation: number;
    indemniteLogement: number;
};
certificate: {
    typeAttestation: string;
    dateDebut: Date | string;
    dateFin: Date | string;
    motif?: string;
    salaireBrutMoyen: number;
    salaireNetMoyen: number;
    nombreMoisCalcules: number;
};
}

export async function generateSalaryCertificatePDF(data: SalaryCertificateData): Promise<Buffer> {
const pdf = new PDFGenerator();

// Header
const title = 'ATTESTATION DE SALAIRE';
const subtitle = data.certificate.typeAttestation;

pdf.addHeader(title, subtitle);

pdf.addSpace(20);

// Certificate content
pdf.addParagraph(
    'Je soussigné, représentant légal de la société AD Capital, certifie par la présente que :',
    { fontSize: 12 }
);

pdf.addSpace(15);

// Employee Information Section
pdf.addSectionTitle('INFORMATIONS DU SALARIÉ');

pdf.addKeyValue('Nom et Prénom', `${data.employee.prenom} ${data.employee.nom}`);
pdf.addKeyValue('Matricule', data.employee.matricule);
pdf.addKeyValue('Fonction', data.employee.fonction);
pdf.addKeyValue('Date d\'embauche', formatDate(data.employee.dateEmbauche));
pdf.addKeyValue('Ancienneté', `${data.employee.anciennete} ans`);
pdf.addKeyValue('Situation familiale', data.employee.situationFamiliale);
pdf.addKeyValue('CIN', data.employee.cin);
pdf.addKeyValue('N° CNSS', data.employee.cnss);

pdf.addSpace(15);

// Period Information
pdf.addSectionTitle('PÉRIODE CONCERNÉE');

pdf.addKeyValue('Date de début', formatDate(data.certificate.dateDebut));
pdf.addKeyValue('Date de fin', formatDate(data.certificate.dateFin));
pdf.addKeyValue('Nombre de mois calculés', data.certificate.nombreMoisCalcules.toString());

if (data.certificate.motif) {
    pdf.addKeyValue('Motif', data.certificate.motif);
}

pdf.addSpace(15);

// Salary Information
pdf.addSectionTitle('INFORMATIONS SALARIALES');

// Current salary breakdown
pdf.addParagraph('Composition du salaire actuel :', { fontSize: 11 });
pdf.addSpace(5);

const salaryHeaders = ['Élément', 'Montant (MAD)'];
const salaryRows: (string | number)[][] = [
    ['Salaire de base', formatCurrency(data.employee.salaireBase)],
    ['Prime de transport', formatCurrency(data.employee.primeTransport)],
    ['Indemnité de représentation', formatCurrency(data.employee.indemniteRepresentation)],
    ['Indemnité de logement', formatCurrency(data.employee.indemniteLogement)]
];

pdf.addTable(salaryHeaders, salaryRows, {
    alternateRowColor: '#f8fafc'
});

pdf.addSpace(10);

// Average salary information
pdf.addSummaryBox('SALAIRES MOYENS SUR LA PÉRIODE', [
    { label: 'Salaire brut moyen', value: formatCurrency(data.certificate.salaireBrutMoyen) },
    { label: 'Salaire net moyen', value: formatCurrency(data.certificate.salaireNetMoyen), highlight: true }
]);

pdf.addSpace(20);

// Certification text
pdf.addParagraph(
    `Cette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.`,
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
    'Cette attestation est établie conformément à la législation marocaine en vigueur. ' +
    'Elle ne peut être utilisée à des fins autres que celles pour lesquelles elle a été demandée.',
    { fontSize: 8, align: 'center', color: '#64748b' }
);

return pdf.getBuffer();
}
