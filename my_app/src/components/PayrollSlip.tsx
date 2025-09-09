import { Employee, Credit, Advance, VariableElement } from '@prisma/client'
import { calculerPaieComplete, type CalculPayrollResult } from '../lib/payrollBaseData'

interface PayrollSlipProps {
employee: Employee & {
    credits?: Credit[]
    advances?: Advance[]
    variableElements?: VariableElement[]
}
month: string
year: string
}

export default function PayrollSlip({ employee, month, year }: PayrollSlipProps) {
// Calculer les retenues de crédit depuis la nouvelle table - FILTRER STRICTEMENT PAR EMPLOYÉ
const activeCredits = employee.credits?.filter(credit => 
    credit.statut === 'ACTIF' && credit.employeeId === employee.id
) || []
const totalCreditRetenues = activeCredits.reduce((total, credit) => total + credit.mensualite, 0)

// Calculer les avances actives - FILTRER STRICTEMENT PAR EMPLOYÉ
const activeAdvances = employee.advances?.filter(advance => 
    advance.statut === 'EN_COURS' && advance.employeeId === employee.id
) || []
const totalAdvanceRetenues = activeAdvances.reduce((total, advance) => total + advance.montantMensualite, 0)

// Traiter les éléments variables - FILTRER STRICTEMENT PAR EMPLOYÉ ET PÉRIODE
const variableElements = employee.variableElements?.filter(el => 
    el.employeeId === employee.id && el.mois === month && el.annee === year
) || []
const variableGains = variableElements.filter(el => 
    ['HEURES_SUP', 'PRIME_EXCEPTIONNELLE'].includes(el.type) || 
    (['CONGE', 'AUTRE'].includes(el.type) && el.montant > 0)
)
const variableRetenues = variableElements.filter(el => 
    ['ABSENCE', 'RETARD', 'AVANCE'].includes(el.type) || 
    (['CONGE', 'AUTRE'].includes(el.type) && el.montant < 0)
)

const totalVariableGains = variableGains.reduce((total, el) => total + el.montant, 0)
const totalVariableRetenues = variableRetenues.reduce((total, el) => total + Math.abs(el.montant), 0)

// Calculer les intérêts déductibles (estimation basée sur les notes ou calcul)
const interetsDeductibles = activeCredits.reduce((total, credit) => {
    // Si les notes contiennent les intérêts déductibles, les extraire
    if (credit.notes && credit.notes.includes('Intérêts déductibles:')) {
    const match = credit.notes.match(/Intérêts déductibles:\s*([\d,]+\.?\d*)/);
    if (match) {
        return total + parseFloat(match[1].replace(',', ''));
    }
    }
    // Sinon, estimer les intérêts (environ 44% de la mensualité pour un crédit immobilier)
    return total + (credit.type === 'LOGEMENT' ? credit.mensualite * 0.44 : 0);
}, 0)

// Calculer la paie complète avec toutes les cotisations (crédits + avances + éléments variables)
const totalAutresRetenues = totalCreditRetenues + totalAdvanceRetenues + totalVariableRetenues
const payrollResult: CalculPayrollResult = calculerPaieComplete({
    salaireBase: employee.salaireBase + totalVariableGains, // Ajouter les gains variables au salaire de base
    anciennete: employee.anciennete,
    primeTransport: employee.primeTransport,
    indemniteRepresentation: employee.indemniteRepresentation,
    interetsCredit: interetsDeductibles,
    autresRetenues: totalAutresRetenues,
    joursTravailles: employee.nbreJourMois
})

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

const getMonthName = (monthNum: string) => {
    const months = [
    'JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN',
    'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE'
    ]
    return months[parseInt(monthNum) - 1] || 'JANVIER'
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

return (
    <div className="payroll-slip bg-white p-8 max-w-4xl mx-auto print:p-4" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
    {/* En-tête */}
    <div className="text-center mb-6">
        <h1 className="text-lg font-bold underline">
        Bulletin de paie du mois de {getMonthName(month)} {year}
        </h1>
    </div>

    {/* Informations employé */}
    <div className="mb-6">
        <h2 className="text-base font-bold mb-3">{employee.prenom} {employee.nom}</h2>
        
        <div className="grid grid-cols-2 gap-8 text-xs">
        <div className="space-y-1">
            <div className="flex">
            <span className="w-32">Fonction</span>
            <span className="mr-4">:</span>
            <span>{employee.fonction}</span>
            </div>
            <div className="flex">
            <span className="w-32">Date de naissance</span>
            <span className="mr-4">:</span>
            <span>{employee.dateNaissance ? formatDate(employee.dateNaissance) : 'Non renseigné'}</span>
            </div>
            <div className="flex">
            <span className="w-32">Date d'embauche</span>
            <span className="mr-4">:</span>
            <span>{formatDate(employee.dateEmbauche)}</span>
            </div>
        </div>
        
        <div className="space-y-1">
            <div className="flex">
            <span className="w-32">Matricule</span>
            <span className="mr-4">:</span>
            <span>{employee.matricule}</span>
            </div>
            <div className="flex">
            <span className="w-32">Situation familiale</span>
            <span className="mr-4">:</span>
            <span>{getSituationFamiliale()}</span>
            </div>
            <div className="flex">
            <span className="w-32">Compte bancaire</span>
            <span className="mr-4">:</span>
            <span>{employee.compteBancaire || 'Non renseigné'}</span>
            </div>
            <div className="flex">
            <span className="w-32">CIN</span>
            <span className="mr-4">:</span>
            <span>{employee.cin || 'Non renseigné'}</span>
            </div>
            <div className="flex">
            <span className="w-32">CNSS</span>
            <span className="mr-4">:</span>
            <span>{employee.cnss || 'Non renseigné'}</span>
            </div>
        </div>
        </div>
    </div>

    {/* Tableau de paie */}
    <div className="border-2 border-black text-xs">
        {/* En-tête du tableau */}
        <div className="grid grid-cols-6 border-b-2 border-black bg-gray-100 font-bold">
        <div className="border-r border-black p-1 text-center">Rubrique</div>
        <div className="border-r border-black p-1 text-center">Nb Jours</div>
        <div className="border-r border-black p-1 text-center">Base</div>
        <div className="border-r border-black p-1 text-center">Taux</div>
        <div className="border-r border-black p-1 text-center">Gains</div>
        <div className="p-1 text-center">Retenues</div>
        </div>

        {/* Lignes de gains */}
        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1">Salaire de base</div>
        <div className="border-r border-black p-1 text-center">{employee.nbreJourMois}</div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(payrollResult.salaireBase)}</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(payrollResult.salaireBase)}</div>
        <div className="p-1"></div>
        </div>

        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1">Prime d'ancienneté</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-center">{(employee.tauxAnciennete * 100).toFixed(1)}%</div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(payrollResult.primeAnciennete)}</div>
        <div className="p-1"></div>
        </div>

        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1">Indemnité de logement</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(employee.indemniteLogement)}</div>
        <div className="p-1"></div>
        </div>

        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1">Prime de transport</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(payrollResult.primeTransport)}</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(payrollResult.primeTransport)}</div>
        <div className="p-1"></div>
        </div>

        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1">Indemnité de représentation</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(payrollResult.indemniteRepresentation)}</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(payrollResult.indemniteRepresentation)}</div>
        <div className="p-1"></div>
        </div>

        {/* Éléments variables - Gains */}
        {variableGains.map((element) => (
        <div key={element.id} className="grid grid-cols-6 border-b border-black">
            <div className="border-r border-black p-1">
            {element.type === 'HEURES_SUP' ? 'Heures supplémentaires' :
            element.type === 'PRIME_EXCEPTIONNELLE' ? 'Prime exceptionnelle' :
            element.description}
            </div>
            <div className="border-r border-black p-1 text-center">
            {element.heures ? `${element.heures}h` : ''}
            </div>
            <div className="border-r border-black p-1 text-right">
            {element.taux ? formatCurrency(element.taux) : ''}
            </div>
            <div className="border-r border-black p-1"></div>
            <div className="border-r border-black p-1 text-right">{formatCurrency(element.montant)}</div>
            <div className="p-1"></div>
        </div>
        ))}

        {/* Ligne vide */}
        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="p-1"></div>
        </div>

        {/* Salaire brut */}
        <div className="grid grid-cols-6 border-b border-black font-bold">
        <div className="border-r border-black p-1">Salaire Brut</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(payrollResult.salaireBrut)}</div>
        <div className="p-1"></div>
        </div>

        {/* Salaire brut imposable */}
        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1">Salaire brut imposable</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(payrollResult.salaireBrutImposable)}</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="p-1"></div>
        </div>

        {/* Cotisations salariales */}
        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1">CNSS Prestations - Part Salariale</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(Math.min(payrollResult.salaireBrutImposable, 6000))}</div>
        <div className="border-r border-black p-1 text-center">{tauxCNSS.toFixed(2)}%</div>
        <div className="border-r border-black p-1"></div>
        <div className="p-1 text-right">{formatCurrency(payrollResult.cnssPrestation)}</div>
        </div>

        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1">AMO - Part Salariale</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(payrollResult.salaireBrutImposable)}</div>
        <div className="border-r border-black p-1 text-center">{tauxAMO.toFixed(2)}%</div>
        <div className="border-r border-black p-1"></div>
        <div className="p-1 text-right">{formatCurrency(payrollResult.amoSalariale)}</div>
        </div>

        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1">Cotisation Assurance : Décès</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(payrollResult.salaireBrutImposable)}</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="p-1 text-right">0,00</div>
        </div>

        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1">Cotisation Assurance : Incapacité</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(payrollResult.salaireBrutImposable)}</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="p-1 text-right">0,00</div>
        </div>

        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1">Assurance Divers - Part Salariale</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(payrollResult.salaireBrutImposable)}</div>
        <div className="border-r border-black p-1 text-center">{tauxAssuranceDivers.toFixed(2)}%</div>
        <div className="border-r border-black p-1"></div>
        <div className="p-1 text-right">{formatCurrency(payrollResult.assuranceDiversSalariale)}</div>
        </div>

        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1">Retraite - Part Salariale</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(payrollResult.salaireBrutImposable)}</div>
        <div className="border-r border-black p-1 text-center">{tauxRetraite.toFixed(2)}%</div>
        <div className="border-r border-black p-1"></div>
        <div className="p-1 text-right">{formatCurrency(payrollResult.retraiteSalariale)}</div>
        </div>

        {/* Ligne vide */}
        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="p-1"></div>
        </div>

        {/* IGR */}
        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1">Impôts sur le revenu</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(payrollResult.netNetImposable)}</div>
        <div className="border-r border-black p-1 text-center">37,00%</div>
        <div className="border-r border-black p-1"></div>
        <div className="p-1 text-right">{formatCurrency(payrollResult.igr)}</div>
        </div>

        {/* Ligne vide */}
        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="p-1"></div>
        </div>

        {/* Autres retenues - Crédits actifs */}
        {activeCredits.map((credit, index) => (
        <div key={credit.id} className="grid grid-cols-6 border-b border-black">
            <div className="border-r border-black p-1">
            Remboursement Crédit {credit.type === 'LOGEMENT' ? 'immo' : 'conso'}
            </div>
            <div className="border-r border-black p-1"></div>
            <div className="border-r border-black p-1"></div>
            <div className="border-r border-black p-1"></div>
            <div className="border-r border-black p-1"></div>
            <div className="p-1 text-right">{formatCurrency(credit.mensualite)}</div>
        </div>
        ))}

        {/* Autres retenues - Avances sur salaire actives */}
        {activeAdvances.map((advance, index) => (
        <div key={advance.id} className="grid grid-cols-6 border-b border-black">
            <div className="border-r border-black p-1">
            Remboursement Avance sur salaire
            </div>
            <div className="border-r border-black p-1"></div>
            <div className="border-r border-black p-1"></div>
            <div className="border-r border-black p-1"></div>
            <div className="border-r border-black p-1"></div>
            <div className="p-1 text-right">{formatCurrency(advance.montantMensualite)}</div>
        </div>
        ))}

        {/* Éléments variables - Retenues */}
        {variableRetenues.map((element) => (
        <div key={element.id} className="grid grid-cols-6 border-b border-black">
            <div className="border-r border-black p-1">
            {element.type === 'ABSENCE' ? 'Retenue absence' :
            element.type === 'RETARD' ? 'Retenue retard' :
            element.type === 'AVANCE' ? 'Avance sur salaire' :
            element.description}
            </div>
            <div className="border-r border-black p-1"></div>
            <div className="border-r border-black p-1"></div>
            <div className="border-r border-black p-1"></div>
            <div className="border-r border-black p-1"></div>
            <div className="p-1 text-right">{formatCurrency(Math.abs(element.montant))}</div>
        </div>
        ))}

        {/* Ligne vide */}
        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="p-1"></div>
        </div>

        {/* Totaux */}
        <div className="grid grid-cols-6 border-b-2 border-black font-bold">
        <div className="border-r border-black p-1">Totaux</div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1 text-right">{formatCurrency(payrollResult.salaireBrut)}</div>
        <div className="p-1 text-right">{formatCurrency(payrollResult.totalRetenues)}</div>
        </div>

        {/* Ligne vide */}
        <div className="grid grid-cols-6 border-b border-black">
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="border-r border-black p-1"></div>
        <div className="p-1"></div>
        </div>

        {/* Net à payer */}
        <div className="grid grid-cols-6 font-bold text-base">
        <div className="border-r border-black p-2">Net à payer</div>
        <div className="border-r border-black p-2"></div>
        <div className="border-r border-black p-2"></div>
        <div className="border-r border-black p-2"></div>
        <div className="border-r border-black p-2 text-right">{formatCurrency(payrollResult.salaireNetAPayer)}</div>
        <div className="p-2"></div>
        </div>
    </div>

    {/* Boutons d'action pour l'impression */}
    <div className="mt-6 text-center print:hidden">
        <button
        onClick={() => window.print()}
        className="payroll-button mr-4"
        >
        Imprimer
        </button>
        <button
        onClick={() => {
            const element = document.querySelector('.payroll-slip')
            if (element) {
            const printWindow = window.open('', '_blank')
            if (printWindow) {
                printWindow.document.write(`
                <html>
                    <head>
                    <title>Bulletin de paie - ${employee.prenom} ${employee.nom}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .payroll-slip { max-width: none; }
                        table { border-collapse: collapse; width: 100%; }
                        td, th { border: 1px solid black; padding: 4px; text-align: left; }
                        .text-right { text-align: right; }
                        .text-center { text-align: center; }
                        .font-bold { font-weight: bold; }
                        .underline { text-decoration: underline; }
                    </style>
                    </head>
                    <body>
                    ${element.innerHTML}
                    </body>
                </html>
                `)
                printWindow.document.close()
                printWindow.print()
            }
            }
        }}
        className="payroll-button-secondary"
        >
        Télécharger PDF
        </button>
    </div>
    </div>
)
}
