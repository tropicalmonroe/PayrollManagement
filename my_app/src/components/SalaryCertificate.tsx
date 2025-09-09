import React from 'react';
import { Printer } from 'lucide-react';

interface Employee {
id: string;
matricule: string;
nom: string;
prenom: string;
fonction: string;
dateEmbauche: string;
anciennete: number;
salaireBase: number;
primeTransport: number;
indemniteRepresentation: number;
indemniteLogement: number;
situationFamiliale: string;
cin?: string;
cnss?: string;
}

interface SalaryCertificateProps {
employee: Employee;
metadata?: any;
showPrintButton?: boolean;
}

export const SalaryCertificate: React.FC<SalaryCertificateProps> = ({ 
employee, 
metadata, 
showPrintButton = true 
}) => {
const formatCurrency = (amount: number) => {
    if (!amount || isNaN(amount)) return '0,00';
    
    return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
    }).format(amount);
};

const formatDate = (date: string | Date) => {
    if (!date) return 'Non renseigné';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
    return 'Date invalide';
    }
    
    return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
    }).format(dateObj);
};

const getSituationFamiliale = () => {
    switch (employee.situationFamiliale) {
    case 'CELIBATAIRE': return 'Célibataire';
    case 'MARIE': return 'Marié(e)';
    case 'DIVORCE': return 'Divorcé(e)';
    case 'VEUF': return 'Veuf/Veuve';
    default: return employee.situationFamiliale;
    }
};

const handlePrint = () => {
    window.print();
};

const today = new Date();

return (
    <div className="bg-white">
    {/* Bouton d'impression (masqué à l'impression) */}
    {showPrintButton && (
        <div className="print:hidden mb-4 flex justify-end">
        <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
            <Printer className="w-4 h-4" />
            Imprimer
        </button>
        </div>
    )}

    {/* Document d'attestation */}
    <div className="certificate-container bg-white p-8 max-w-4xl mx-auto border border-gray-300 print:border-0 print:p-6 print:max-w-none print:mx-0">
        {/* En-tête */}
        <div className="header flex justify-between items-start mb-6 print:mb-4">
        <div className="logo">
            <img 
            src="/image001.png" 
            alt="ADACPITAL Logo" 
            className="h-12 w-auto print:h-10"
            />
        </div>
        <div className="company-info text-right text-sm print:text-xs">
            <div className="font-bold">ADACPITAL</div>
            <div>Société de Gestion</div>
            <div>Casablanca, Maroc</div>
        </div>
        </div>

        {/* Titre */}
        <div className="document-title text-center mb-6 print:mb-4">
        <h1 className="text-xl font-bold uppercase underline print:text-lg">
            Attestation de Salaire
        </h1>
        </div>

        {/* Contenu */}
        <div className="content space-y-4 text-sm print:text-xs print:space-y-2">
        <p>
            Je soussigné(e), Directeur des Ressources Humaines de la société ADACPITAL,
        </p>
        
        <p className="font-semibold">
            Atteste par la présente que :
        </p>

        {/* Informations employé */}
        <div className="employee-details border border-black p-4 print:p-2 my-4 print:my-2">
            <div className="grid grid-cols-1 gap-2 print:gap-1">
            <div className="detail-line flex">
                <span className="detail-label font-semibold w-40 print:w-32">Nom et Prénom :</span>
                <span className="detail-value font-semibold">{employee.prenom} {employee.nom}</span>
            </div>
            <div className="detail-line flex">
                <span className="detail-label font-semibold w-40 print:w-32">Matricule :</span>
                <span className="detail-value">{employee.matricule}</span>
            </div>
            <div className="detail-line flex">
                <span className="detail-label font-semibold w-40 print:w-32">CIN :</span>
                <span className="detail-value">{employee.cin || 'Non renseigné'}</span>
            </div>
            <div className="detail-line flex">
                <span className="detail-label font-semibold w-40 print:w-32">Fonction :</span>
                <span className="detail-value">{employee.fonction}</span>
            </div>
            <div className="detail-line flex">
                <span className="detail-label font-semibold w-40 print:w-32">Date d'embauche :</span>
                <span className="detail-value">{formatDate(employee.dateEmbauche)}</span>
            </div>
            <div className="detail-line flex">
                <span className="detail-label font-semibold w-40 print:w-32">Ancienneté :</span>
                <span className="detail-value">{employee.anciennete} ans</span>
            </div>
            <div className="detail-line flex">
                <span className="detail-label font-semibold w-40 print:w-32">Situation familiale :</span>
                <span className="detail-value">{getSituationFamiliale()}</span>
            </div>
            <div className="detail-line flex">
                <span className="detail-label font-semibold w-40 print:w-32">Salaire mensuel brut :</span>
                <span className="detail-value font-semibold">{formatCurrency(employee.salaireBase)} DH</span>
            </div>
            {employee.primeTransport > 0 && (
                <div className="detail-line flex">
                <span className="detail-label font-semibold w-40 print:w-32">Prime de transport :</span>
                <span className="detail-value">{formatCurrency(employee.primeTransport)} DH</span>
                </div>
            )}
            {employee.indemniteRepresentation > 0 && (
                <div className="detail-line flex">
                <span className="detail-label font-semibold w-40 print:w-32">Indemnité de représentation :</span>
                <span className="detail-value">{formatCurrency(employee.indemniteRepresentation)} DH</span>
                </div>
            )}
            {employee.indemniteLogement > 0 && (
                <div className="detail-line flex">
                <span className="detail-label font-semibold w-40 print:w-32">Indemnité de logement :</span>
                <span className="detail-value">{formatCurrency(employee.indemniteLogement)} DH</span>
                </div>
            )}
            <div className="detail-line flex">
                <span className="detail-label font-semibold w-40 print:w-32">CNSS :</span>
                <span className="detail-value">{employee.cnss || 'Non renseigné'}</span>
            </div>
            </div>
        </div>

        <p>
            Est employé(e) dans notre société en qualité de <span className="font-semibold">{employee.fonction}</span> depuis le <span className="font-semibold">{formatDate(employee.dateEmbauche)}</span>.
        </p>

        <p>
            Son salaire mensuel brut s'élève à <span className="font-semibold">{formatCurrency(employee.salaireBase)} DH</span>
            {(employee.primeTransport > 0 || employee.indemniteRepresentation > 0 || employee.indemniteLogement > 0) && 
            ', auquel s\'ajoutent les indemnités et primes mentionnées ci-dessus'}.
        </p>

        <p>
            L'intéressé(e) est affilié(e) à la Caisse Nationale de Sécurité Sociale sous le numéro <span className="font-semibold">{employee.cnss || '[À COMPLÉTER]'}</span>.
        </p>

        <p>
            Cette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.
        </p>

        <div className="text-right mt-6 print:mt-4">
            <p className="font-semibold">
            Fait à Casablanca, le {formatDate(today)}
            </p>
        </div>
        </div>

        {/* Signatures */}
        <div className="signature-section flex justify-between mt-8 print:mt-6">
        <div className="signature-block text-center w-48">
            <p className="font-semibold mb-2">L'Employé(e)</p>
            <div className="signature-line border-b border-black h-16 print:h-12 mb-2"></div>
            <p className="text-sm print:text-xs">{employee.prenom} {employee.nom}</p>
        </div>
        
        <div className="signature-block text-center w-48">
            <p className="font-semibold mb-2">Le Directeur RH</p>
            <div className="signature-line border-b border-black h-16 print:h-12 mb-2"></div>
            <p className="text-sm print:text-xs">ADACPITAL</p>
        </div>
        </div>

        {/* Footer */}
        <div className="footer text-center mt-8 print:mt-4 pt-4 print:pt-2 border-t border-black">
        <p className="text-xs print:text-[10px] text-gray-600">
            ADACPITAL - Société de Gestion | Casablanca, Maroc
        </p>
        </div>
    </div>

    {/* Styles d'impression */}
    <style jsx global>{`
        @media print {
        @page {
            size: A4;
            margin: 1cm;
        }
        
        body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.3;
        }
        
        /* Masquer tous les éléments sauf l'attestation */
        body * {
            visibility: hidden;
        }
        
        .certificate-container,
        .certificate-container * {
            visibility: visible;
        }
        
        .certificate-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            page-break-inside: avoid;
            max-height: none;
            margin: 0;
            padding: 1cm;
            box-sizing: border-box;
        }
        
        .detail-line {
            page-break-inside: avoid;
        }
        
        .signature-section {
            page-break-inside: avoid;
        }
        
        /* Masquer la sidebar et navigation */
        .sidebar,
        .layout-sidebar,
        nav,
        header,
        .print\\:hidden {
            display: none !important;
            visibility: hidden !important;
        }
        }
    `}</style>
    </div>
);
};

export default SalaryCertificate;
