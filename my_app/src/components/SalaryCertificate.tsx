import React from 'react';
import { Printer } from 'lucide-react';

interface Employee {
id: string;
employeeId: string; // Previously matricule
lastName: string; // Previously nom
firstName: string; // Previously prenom
position: string; // Previously fonction
hireDate: string; // Previously dateEmbauche
seniority: number; // Previously anciennete
baseSalary: number; // Previously salaireBase
transportAllowance: number; // Previously primeTransport
representationAllowance: number; // Previously indemniteRepresentation
housingAllowance: number; // Previously indemniteLogement
maritalStatus: string; // Previously situationFamiliale
idNumber?: string; // Previously cin
nssfNumber?: string; // Previously cnss
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
    if (!amount || isNaN(amount)) return '0.00';
    
    return new Intl.NumberFormat('en-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
    }).format(amount);
};

const formatDate = (date: string | Date) => {
    if (!date) return 'Not specified'; // Translated Non renseigné
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
    return 'Invalid date'; // Translated Date invalide
    }
    
    return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
    }).format(dateObj);
};

const getMaritalStatus = () => {
    switch (employee.maritalStatus) {
    case 'SINGLE': return 'Single'; // Translated Célibataire, aligned with MaritalStatus.SINGLE
    case 'MARRIED': return 'Married'; // Translated Marié(e), aligned with MaritalStatus.MARRIED
    case 'DIVORCED': return 'Divorced'; // Translated Divorcé(e), aligned with MaritalStatus.DIVORCED
    case 'WIDOWED': return 'Widowed'; // Translated Veuf/Veuve, aligned with MaritalStatus.WIDOWED
    default: return employee.maritalStatus;
    }
};

const handlePrint = () => {
    window.print();
};

const today = new Date();

return (
    <div className="bg-white">
    {/* Print button (hidden during printing) */}
    {showPrintButton && (
        <div className="print:hidden mb-4 flex justify-end">
        <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
            <Printer className="w-4 h-4" />
            Print {/* Translated Imprimer */}
        </button>
        </div>
    )}

    {/* Salary certificate document */}
    <div className="certificate-container bg-white p-8 max-w-4xl mx-auto border border-zinc-300 print:border-0 print:p-6 print:max-w-none print:mx-0">
        {/* Header */}
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
            <div>Management Company</div> {/* Translated Société de Gestion */}
            <div>Casablanca, Morocco</div> {/* Translated Casablanca, Maroc */}
        </div>
        </div>

        {/* Title */}
        <div className="document-title text-center mb-6 print:mb-4">
        <h1 className="text-xl font-bold uppercase underline print:text-lg">
            Salary Certificate {/* Translated Attestation de Salaire */}
        </h1>
        </div>

        {/* Content */}
        <div className="content space-y-4 text-sm print:text-xs print:space-y-2">
        <p>
            I, the undersigned, Human Resources Director of ADACPITAL, {/* Translated Je soussigné(e), Directeur des Ressources Humaines de la société ADACPITAL */}
        </p>
        
        <p className="font-semibold">
            Hereby certify that: {/* Translated Atteste par la présente que : */}
        </p>

        {/* Employee details */}
        <div className="employee-details border border-black p-4 print:p-2 my-4 print:my-2">
            <div className="grid grid-cols-1 gap-2 print:gap-1">
            <div className="detail-line flex">
                <span className="detail-label font-semibold w-40 print:w-32">Full Name:</span> {/* Translated Nom et Prénom */}
                <span className="detail-value font-semibold">{employee.firstName} {employee.lastName}</span>
            </div>
            <div className="detail-line flex">
                <span className="detail-label font-semibold w-40 print:w-32">Employee ID:</span> {/* Translated Matricule */}
                <span className="detail-value">{employee.employeeId}</span>
            </div>
            <div className="detail-line flex">
                <span className="detail-label font-semibold w-40 print:w-32">ID Number:</span> {/* Translated CIN */}
                <span className="detail-value">{employee.idNumber || 'Not specified'}</span> {/* Translated Non renseigné */}
            </div>
            <div className="detail-line flex">
                <span className="detail-label font-semibold w-40 print:w-32">Position:</span> {/* Translated Fonction */}
                <span className="detail-value">{employee.position}</span>
            </div>
            <div className="detail-line flex">
                <span className="detail-label font-semibold w-40 print:w-32">Hire Date:</span> {/* Translated Date d'embauche */}
                <span className="detail-value">{formatDate(employee.hireDate)}</span>
            </div>
            <div className="detail-line flex">
                <span className="detail-label font-semibold w-40 print:w-32">Seniority:</span> {/* Translated Ancienneté */}
                <span className="detail-value">{employee.seniority} years</span> {/* Translated ans */}
            </div>
            <div className="detail-line flex">
                <span className="detail-label font-semibold w-40 print:w-32">Marital Status:</span> {/* Translated Situation familiale */}
                <span className="detail-value">{getMaritalStatus()}</span>
            </div>
            <div className="detail-line flex">
                <span className="detail-label font-semibold w-40 print:w-32">Monthly Gross Salary:</span> {/* Translated Salaire mensuel brut */}
                <span className="detail-value font-semibold">{formatCurrency(employee.baseSalary)} MAD</span> {/* Changed DH to MAD for Moroccan Dirham */}
            </div>
            {employee.transportAllowance > 0 && (
                <div className="detail-line flex">
                <span className="detail-label font-semibold w-40 print:w-32">Transport Allowance:</span> {/* Translated Prime de transport */}
                <span className="detail-value">{formatCurrency(employee.transportAllowance)} MAD</span>
                </div>
            )}
            {employee.representationAllowance > 0 && (
                <div className="detail-line flex">
                <span className="detail-label font-semibold w-40 print:w-32">Representation Allowance:</span> {/* Translated Indemnité de représentation */}
                <span className="detail-value">{formatCurrency(employee.representationAllowance)} MAD</span>
                </div>
            )}
            {employee.housingAllowance > 0 && (
                <div className="detail-line flex">
                <span className="detail-label font-semibold w-40 print:w-32">Housing Allowance:</span> {/* Translated Indemnité de logement */}
                <span className="detail-value">{formatCurrency(employee.housingAllowance)} MAD</span>
                </div>
            )}
            <div className="detail-line flex">
                <span className="detail-label font-semibold w-40 print:w-32">NSSF Number:</span> {/* Translated CNSS, aligned with nssfNumber */}
                <span className="detail-value">{employee.nssfNumber || 'Not specified'}</span> {/* Translated Non renseigné */}
            </div>
            </div>
        </div>

        <p>
            Is employed by our company as a <span className="font-semibold">{employee.position}</span> since <span className="font-semibold">{formatDate(employee.hireDate)}</span>. {/* Translated Est employé(e) dans notre société en qualité de ... depuis le ... */}
        </p>

        <p>
            Their monthly gross salary amounts to <span className="font-semibold">{formatCurrency(employee.baseSalary)} MAD</span>
            {(employee.transportAllowance > 0 || employee.representationAllowance > 0 || employee.housingAllowance > 0) && 
            ', plus the allowances and bonuses mentioned above'}. {/* Translated Son salaire mensuel brut s'élève à ... auquel s'ajoutent les indemnités et primes mentionnées ci-dessus */}
        </p>

        <p>
            The individual is affiliated with the National Social Security Fund under number <span className="font-semibold">{employee.nssfNumber || '[TO BE COMPLETED]'}</span>. {/* Translated L'intéressé(e) est affilié(e) à la Caisse Nationale de Sécurité Sociale sous le numéro ... [À COMPLÉTER] */}
        </p>

        <p>
            This certificate is issued to the individual for all legal purposes. {/* Translated Cette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit */}
        </p>

        <div className="text-right mt-6 print:mt-4">
            <p className="font-semibold">
            Issued in Casablanca, on {formatDate(today)} {/* Translated Fait à Casablanca, le ... */}
            </p>
        </div>
        </div>

        {/* Signatures */}
        <div className="signature-section flex justify-between mt-8 print:mt-6">
        <div className="signature-block text-center w-48">
            <p className="font-semibold mb-2">The Employee</p> {/* Translated L'Employé(e) */}
            <div className="signature-line border-b border-black h-16 print:h-12 mb-2"></div>
            <p className="text-sm print:text-xs">{employee.firstName} {employee.lastName}</p>
        </div>
        
        <div className="signature-block text-center w-48">
            <p className="font-semibold mb-2">The HR Director</p> {/* Translated Le Directeur RH */}
            <div className="signature-line border-b border-black h-16 print:h-12 mb-2"></div>
            <p className="text-sm print:text-xs">ADACPITAL</p>
        </div>
        </div>

        {/* Footer */}
        <div className="footer text-center mt-8 print:mt-4 pt-4 print:pt-2 border-t border-black">
        <p className="text-xs print:text-[10px] text-zinc-600">
            ADACPITAL - Management Company | Casablanca, Morocco {/* Translated ADACPITAL - Société de Gestion | Casablanca, Maroc */}
        </p>
        </div>
    </div>

    {/* Print styles */}
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
        
        /* Hide all elements except the certificate */
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
        
        /* Hide sidebar and navigation */
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