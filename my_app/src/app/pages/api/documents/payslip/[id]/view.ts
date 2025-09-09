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

    // Récupérer le calcul de paie associé
    const metadata = document.metadata as any;
    const payrollCalculation = await prisma.payrollCalculation.findUnique({
        where: { id: metadata?.payrollCalculationId },
        include: {
        employee: true
        }
    });

    if (!payrollCalculation) {
        return res.status(404).json({ error: 'Calcul de paie non trouvé' });
    }

    // Générer le HTML du bulletin de paie
    const html = generatePayslipHTML(document, payrollCalculation);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
    } catch (error) {
    console.error('Error generating payslip view:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du bulletin' });
    }
} else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
}

function generatePayslipHTML(document: any, payrollCalculation: any) {
const employee = payrollCalculation.employee;
const [monthName, year] = document.periode.split(' ');

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

// Calculer les taux en pourcentage
const tauxCNSS = 4.48
const tauxAMO = 2.26
const tauxAssuranceDivers = 1.26
const tauxRetraite = 6.00

return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bulletin de Paie - ${employee.prenom} ${employee.nom}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: white;
            font-size: 12px;
        }
        .payroll-slip {
            background: white;
            padding: 32px;
            max-width: 1024px;
            margin: 0 auto;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .underline { text-decoration: underline; }
        .mb-6 { margin-bottom: 24px; }
        .mb-3 { margin-bottom: 12px; }
        .text-lg { font-size: 18px; }
        .text-base { font-size: 16px; }
        .text-xs { font-size: 12px; }
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .grid-cols-6 { grid-template-columns: repeat(6, minmax(0, 1fr)); }
        .gap-8 { gap: 32px; }
        .space-y-1 > * + * { margin-top: 4px; }
        .border-2 { border-width: 2px; }
        .border { border-width: 1px; }
        .border-b-2 { border-bottom-width: 2px; }
        .border-b { border-bottom-width: 1px; }
        .border-r { border-right-width: 1px; }
        .border-black { border-color: black; }
        .bg-gray-100 { background-color: #f3f4f6; }
        .p-1 { padding: 4px; }
        .p-2 { padding: 8px; }
        .w-32 { width: 128px; }
        .mr-4 { margin-right: 16px; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .items-start { align-items: flex-start; }
        .flex-1 { flex: 1; }
        
        /* Améliorer la visibilité des lignes du tableau */
        .grid.border-2 { border: 2px solid #000 !important; }
        .border-black { border-color: #000 !important; }
        .border-r { border-right: 1px solid #000 !important; }
        .border-b { border-bottom: 1px solid #000 !important; }
        .border-b-2 { border-bottom: 2px solid #000 !important; }
        
        @media print {
            body { padding: 16px; }
            .payroll-slip { padding: 16px; }
            .border-black { border-color: #000 !important; }
            .border-r { border-right: 1px solid #000 !important; }
            .border-b { border-bottom: 1px solid #000 !important; }
            .border-b-2 { border-bottom: 2px solid #000 !important; }
        }
    </style>
</head>
<body>
    <div class="payroll-slip">
        <!-- En-tête avec logo -->
        <div class="mb-6">
            <div class="mb-4">
                <img src="/image001.png" alt="ADACPITAL Logo" style="max-width: 150px; height: auto;" />
            </div>
            <div class="text-center">
                <h1 class="text-lg font-bold underline">
                    Bulletin de paie du mois de ${monthName.toUpperCase()} ${year}
                </h1>
            </div>
        </div>

        <!-- Informations employé -->
        <div class="mb-6">
            <h2 class="text-base font-bold mb-3">${employee.prenom} ${employee.nom}</h2>
            
            <div class="grid grid-cols-2 gap-8 text-xs">
                <div class="space-y-1">
                    <div class="flex">
                        <span class="w-32">Fonction</span>
                        <span class="mr-4">:</span>
                        <span>${employee.fonction}</span>
                    </div>
                    <div class="flex">
                        <span class="w-32">Date de naissance</span>
                        <span class="mr-4">:</span>
                        <span>${employee.dateNaissance ? formatDate(employee.dateNaissance) : 'Non renseigné'}</span>
                    </div>
                    <div class="flex">
                        <span class="w-32">Date d'embauche</span>
                        <span class="mr-4">:</span>
                        <span>${formatDate(employee.dateEmbauche)}</span>
                    </div>
                </div>
                
                <div class="space-y-1">
                    <div class="flex">
                        <span class="w-32">Matricule</span>
                        <span class="mr-4">:</span>
                        <span>${employee.matricule}</span>
                    </div>
                    <div class="flex">
                        <span class="w-32">Situation familiale</span>
                        <span class="mr-4">:</span>
                        <span>${getSituationFamiliale()}</span>
                    </div>
                    <div class="flex">
                        <span class="w-32">Compte bancaire</span>
                        <span class="mr-4">:</span>
                        <span>${employee.compteBancaire || 'Non renseigné'}</span>
                    </div>
                    <div class="flex">
                        <span class="w-32">CIN</span>
                        <span class="mr-4">:</span>
                        <span>${employee.cin || 'Non renseigné'}</span>
                    </div>
                    <div class="flex">
                        <span class="w-32">CNSS</span>
                        <span class="mr-4">:</span>
                        <span>${employee.cnss || 'Non renseigné'}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tableau de paie -->
        <div class="border-2 border-black text-xs">
            <!-- En-tête du tableau -->
            <div class="grid grid-cols-6 border-b-2 border-black bg-gray-100 font-bold">
                <div class="border-r border-black p-1 text-center">Rubrique</div>
                <div class="border-r border-black p-1 text-center">Nb Jours</div>
                <div class="border-r border-black p-1 text-center">Base</div>
                <div class="border-r border-black p-1 text-center">Taux</div>
                <div class="border-r border-black p-1 text-center">Gains</div>
                <div class="p-1 text-center">Retenues</div>
            </div>

            <!-- Lignes de gains -->
            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1">Salaire de base</div>
                <div class="border-r border-black p-1 text-center">${employee.nbreJourMois}</div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.salaireBase)}</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.salaireBase)}</div>
                <div class="p-1"></div>
            </div>

            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1">Prime d'ancienneté</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-center">${(employee.tauxAnciennete * 100).toFixed(1)}%</div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.primeAnciennete)}</div>
                <div class="p-1"></div>
            </div>

            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1">Indemnité de logement</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.indemniteLogement)}</div>
                <div class="p-1"></div>
            </div>

            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1">Prime de transport</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.primeTransport)}</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.primeTransport)}</div>
                <div class="p-1"></div>
            </div>

            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1">Indemnité de représentation</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.indemniteRepresentation)}</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.indemniteRepresentation)}</div>
                <div class="p-1"></div>
            </div>

            <!-- Ligne vide -->
            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="p-1"></div>
            </div>

            <!-- Salaire brut -->
            <div class="grid grid-cols-6 border-b border-black font-bold">
                <div class="border-r border-black p-1">Salaire Brut</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.totalGains)}</div>
                <div class="p-1"></div>
            </div>

            <!-- Salaire brut imposable -->
            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1">Salaire brut imposable</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.salaireBrutImposable)}</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="p-1"></div>
            </div>

            <!-- Cotisations salariales -->
            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1">CNSS Prestations - Part Salariale</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(Math.min(payrollCalculation.salaireBrutImposable, 6000))}</div>
                <div class="border-r border-black p-1 text-center">${tauxCNSS.toFixed(2)}%</div>
                <div class="border-r border-black p-1"></div>
                <div class="p-1 text-right">${formatCurrency(payrollCalculation.cnssPrestations)}</div>
            </div>

            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1">AMO - Part Salariale</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.salaireBrutImposable)}</div>
                <div class="border-r border-black p-1 text-center">${tauxAMO.toFixed(2)}%</div>
                <div class="border-r border-black p-1"></div>
                <div class="p-1 text-right">${formatCurrency(payrollCalculation.amo)}</div>
            </div>

            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1">Cotisation Assurance : Décès</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.salaireBrutImposable)}</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="p-1 text-right">0,00</div>
            </div>

            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1">Cotisation Assurance : Incapacité</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.salaireBrutImposable)}</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="p-1 text-right">0,00</div>
            </div>

            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1">Assurance Divers - Part Salariale</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.salaireBrutImposable)}</div>
                <div class="border-r border-black p-1 text-center">${tauxAssuranceDivers.toFixed(2)}%</div>
                <div class="border-r border-black p-1"></div>
                <div class="p-1 text-right">${formatCurrency(payrollCalculation.assuranceDivers)}</div>
            </div>

            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1">Retraite - Part Salariale</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.salaireBrutImposable)}</div>
                <div class="border-r border-black p-1 text-center">${tauxRetraite.toFixed(2)}%</div>
                <div class="border-r border-black p-1"></div>
                <div class="p-1 text-right">${formatCurrency(payrollCalculation.retraite)}</div>
            </div>

            <!-- Ligne vide -->
            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="p-1"></div>
            </div>

            <!-- IGR -->
            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1">Impôts sur le revenu</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.netNetImposable)}</div>
                <div class="border-r border-black p-1 text-center">37,00%</div>
                <div class="border-r border-black p-1"></div>
                <div class="p-1 text-right">${formatCurrency(payrollCalculation.impotRevenu)}</div>
            </div>

            <!-- Ligne vide -->
            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="p-1"></div>
            </div>

            ${payrollCalculation.remboursementCredit > 0 ? `
            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1">Remboursement Crédit</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="p-1 text-right">${formatCurrency(payrollCalculation.remboursementCredit)}</div>
            </div>
            ` : ''}

            ${payrollCalculation.avances > 0 ? `
            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1">Remboursement Avance sur salaire</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="p-1 text-right">${formatCurrency(payrollCalculation.avances)}</div>
            </div>
            ` : ''}

            <!-- Ligne vide -->
            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="p-1"></div>
            </div>

            <!-- Totaux -->
            <div class="grid grid-cols-6 border-b-2 border-black font-bold">
                <div class="border-r border-black p-1">Totaux</div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1 text-right">${formatCurrency(payrollCalculation.totalGains)}</div>
                <div class="p-1 text-right">${formatCurrency(payrollCalculation.totalRetenues)}</div>
            </div>

            <!-- Ligne vide -->
            <div class="grid grid-cols-6 border-b border-black">
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="border-r border-black p-1"></div>
                <div class="p-1"></div>
            </div>

            <!-- Net à payer -->
            <div class="grid grid-cols-6 font-bold text-base">
                <div class="border-r border-black p-2">Net à payer</div>
                <div class="border-r border-black p-2"></div>
                <div class="border-r border-black p-2"></div>
                <div class="border-r border-black p-2"></div>
                <div class="border-r border-black p-2 text-right">${formatCurrency(payrollCalculation.salaireNetAPayer)}</div>
                <div class="p-2"></div>
            </div>
        </div>
    </div>
</body>
</html>
`;
}
