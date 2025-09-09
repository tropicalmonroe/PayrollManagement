import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
if (req.method === 'GET') {
    try {
    const { id } = req.query;

    // Récupérer le document
    const document = await prisma.document.findUnique({
        where: { id: id as string },
        include: {
        employee: true
        }
    });

    if (!document) {
        return res.status(404).json({ error: 'Document non trouvé' });
    }

    // Générer le HTML de l'attestation de salaire
    const html = generateSalaryCertificateHTML(document);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
    } catch (error) {
    console.error('Error generating salary certificate view:', error);
    res.status(500).json({ error: 'Erreur lors de la génération de l\'attestation' });
    }
} else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
}

function generateSalaryCertificateHTML(document: any) {
const employee = document.employee;
const metadata = document.metadata as any;

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
    }).format(amount)
}

const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
    }).format(new Date(date))
}

const getSituationFamiliale = () => {
    switch (employee.situationFamiliale) {
    case 'CELIBATAIRE': return 'Célibataire'
    case 'MARIE': return 'Marié(e)'
    case 'DIVORCE': return 'Divorcé(e)'
    case 'VEUF': return 'Veuf/Veuve'
    default: return employee.situationFamiliale
    }
}

const today = new Date();

return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Attestation de Salaire - ${employee.prenom} ${employee.nom}</title>
    <style>
        @page {
            size: A4;
            margin: 2cm;
        }
        
        body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 0;
            background-color: white;
            font-size: 12pt;
            line-height: 1.4;
            color: #000;
        }
        
        .certificate-container {
            width: 21cm;
            height: 29.7cm;
            margin: 0 auto;
            padding: 1cm;
            background: white;
            box-sizing: border-box;
            position: relative;
        }
        
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .underline { text-decoration: underline; }
        
        .header {
            margin-bottom: 0.8cm;
            height: 1.5cm;
        }
        
        .logo {
            float: left;
            max-width: 2cm;
            height: auto;
        }
        
        .company-info {
            text-align: right;
            margin-top: 0.2cm;
            font-size: 10pt;
        }
        
        .document-title {
            clear: both;
            text-align: center;
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0.6cm 0 0.6cm 0;
            text-decoration: underline;
        }
        
        .content {
            text-align: justify;
            margin-bottom: 0.5cm;
        }
        
        .content p {
            margin: 0.3cm 0;
        }
        
        .employee-details {
            margin: 0.5cm 0;
            padding: 0.4cm;
            border: 1px solid #000;
        }
        
        .detail-line {
            margin: 0.1cm 0;
            display: flex;
        }
        
        .detail-label {
            width: 4.5cm;
            font-weight: bold;
            font-size: 11pt;
        }
        
        .detail-value {
            flex: 1;
            font-size: 11pt;
        }
        
        .signature-section {
            margin-top: 0.8cm;
            display: flex;
            justify-content: space-between;
        }
        
        .signature-block {
            width: 5cm;
            text-align: center;
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            height: 1cm;
            margin: 0.5cm 0 0.2cm 0;
        }
        
        .footer {
            position: absolute;
            bottom: 0.3cm;
            left: 1cm;
            right: 1cm;
            text-align: center;
            font-size: 8pt;
            border-top: 1px solid #000;
            padding-top: 0.2cm;
        }
        
        @media print {
            body { 
                margin: 0;
                padding: 0;
            }
            .certificate-container {
                width: 100%;
                min-height: 100vh;
                margin: 0;
                padding: 2cm;
            }
        }
        
        @media screen {
            body {
                background: #f0f0f0;
                padding: 1cm;
            }
            .certificate-container {
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
        }
    </style>
</head>
<body>
    <div class="certificate-container">
        <!-- En-tête -->
        <div class="header">
            <img src="/image001.png" alt="ADACPITAL Logo" class="logo" />
            <div class="company-info">
                <strong>ADACPITAL</strong><br>
                Société de Gestion<br>
                Casablanca, Maroc
            </div>
        </div>

        <!-- Titre du document -->
        <h1 class="document-title">Attestation de Salaire</h1>

        <!-- Contenu -->
        <div class="content">
            <p>Je soussigné(e), Directeur des Ressources Humaines de la société ADACPITAL,</p>
            
            <p><strong>Atteste par la présente que :</strong></p>

            <!-- Informations employé -->
            <div class="employee-details">
                <div class="detail-line">
                    <span class="detail-label">Nom et Prénom :</span>
                    <span class="detail-value"><strong>${employee.prenom} ${employee.nom}</strong></span>
                </div>
                <div class="detail-line">
                    <span class="detail-label">Matricule :</span>
                    <span class="detail-value">${employee.matricule}</span>
                </div>
                <div class="detail-line">
                    <span class="detail-label">CIN :</span>
                    <span class="detail-value">${employee.cin || 'Non renseigné'}</span>
                </div>
                <div class="detail-line">
                    <span class="detail-label">Fonction :</span>
                    <span class="detail-value">${employee.fonction}</span>
                </div>
                <div class="detail-line">
                    <span class="detail-label">Date d'embauche :</span>
                    <span class="detail-value">${formatDate(employee.dateEmbauche)}</span>
                </div>
                <div class="detail-line">
                    <span class="detail-label">Ancienneté :</span>
                    <span class="detail-value">${employee.anciennete} ans</span>
                </div>
                <div class="detail-line">
                    <span class="detail-label">Situation familiale :</span>
                    <span class="detail-value">${getSituationFamiliale()}</span>
                </div>
                <div class="detail-line">
                    <span class="detail-label">Salaire mensuel brut :</span>
                    <span class="detail-value"><strong>${formatCurrency(employee.salaireBase)} DH</strong></span>
                </div>
                ${employee.primeTransport > 0 ? `
                <div class="detail-line">
                    <span class="detail-label">Prime de transport :</span>
                    <span class="detail-value">${formatCurrency(employee.primeTransport)} DH</span>
                </div>
                ` : ''}
                ${employee.indemniteRepresentation > 0 ? `
                <div class="detail-line">
                    <span class="detail-label">Indemnité de représentation :</span>
                    <span class="detail-value">${formatCurrency(employee.indemniteRepresentation)} DH</span>
                </div>
                ` : ''}
                ${employee.indemniteLogement > 0 ? `
                <div class="detail-line">
                    <span class="detail-label">Indemnité de logement :</span>
                    <span class="detail-value">${formatCurrency(employee.indemniteLogement)} DH</span>
                </div>
                ` : ''}
                <div class="detail-line">
                    <span class="detail-label">CNSS :</span>
                    <span class="detail-value">${employee.cnss || 'Non renseigné'}</span>
                </div>
            </div>

            <p>Est employé(e) dans notre société en qualité de <strong>${employee.fonction}</strong> depuis le <strong>${formatDate(employee.dateEmbauche)}</strong>.</p>

            <p>Son salaire mensuel brut s'élève à <strong>${formatCurrency(employee.salaireBase)} DH</strong>${employee.primeTransport > 0 || employee.indemniteRepresentation > 0 || employee.indemniteLogement > 0 ? ', auquel s\'ajoutent les indemnités et primes mentionnées ci-dessus' : ''}.</p>

            <p>L'intéressé(e) est affilié(e) à la Caisse Nationale de Sécurité Sociale sous le numéro <strong>${employee.cnss || '[À COMPLÉTER]'}</strong>.</p>

            <p>Cette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.</p>

            <div class="text-right">
                <p><strong>Fait à Casablanca, le ${formatDate(today)}</strong></p>
            </div>
        </div>

        <!-- Signatures -->
        <div class="signature-section">
            <div class="signature-block">
                <p><strong>L'Employé(e)</strong></p>
                <div class="signature-line"></div>
                <p>${employee.prenom} ${employee.nom}</p>
            </div>
            
            <div class="signature-block">
                <p><strong>Le Directeur RH</strong></p>
                <div class="signature-line"></div>
                <p>ADACPITAL</p>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>ADACPITAL - Société de Gestion | Casablanca, Maroc</p>
        </div>
    </div>
</body>
</html>
`;
}
