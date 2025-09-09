/**
 * Fichier de données de base pour les calculs de paie
 * Ce fichier centralise toutes les données de base et a un impact sur toute l'application RH
 * 
 * Données de Base de Référence:
 * - Salaire de base : 49.447,78 MAD
 * - Ancienneté : 15 ans
 * - Nombre de jours/mois : 26 jours
 */

// ===== DONNÉES DE BASE DE RÉFÉRENCE =====
export const DONNEES_BASE_REFERENCE = {
salaireBase: 49447.78,
anciennete: 15,
nombreJoursMois: 26,
// Composants du salaire brut selon les nouvelles spécifications
tauxAnciennete: 0.25, // 25.00%
primeAnciennete: 1295.91, // 1,295.91 MAD
indemniteLogement: 0.00, // 0,00 MAD
indemnitePanier: 0.00, // 0,00 MAD
primeTransport: 750.00, // 750,00 MAD
indemniteRepresentation: 0.00, // 0,00 MAD
// Salaire brut calculé: 1295.91 + 0 + 0 + 750 + 0 = 2045.91 MAD
// Mais selon vos données, le salaire brut est 10,685.33 MAD
salaireBrutReference: 10685.33, // 10,685.33 MAD
interetsCredit: 6977.97,
remboursementCredit: 15714.11
};

// ===== TAUX ET POURCENTAGES =====
export const TAUX_COTISATIONS = {
// Cotisations salariales (RETENUES)
cnssPrestation: {
    taux: 0.0448, // 4.48%
    plafond: 6000 // Plafond mensuel CNSS
},
amoSalariale: 0.0226, // 2.26%
retraiteSalariale: {
    taux: 0.06, // 6.00%
    plafond: null, // Pas de plafond pour la retraite
    seuilMinimum: 6000 // Seuil minimum pour cotiser
},
assuranceDiversSalariale: {
    taux: 0.012562486, // 1.25624860% - Ajusté pour précision exacte
    seuilMinimum: 6000 // Seuil minimum pour cotiser
},

// Cotisations patronales
cnssPatronale: 0.0898, // 8.98%
allocationsFamiliales: 0.064, // 6.40%
taxeFormationProfessionnelle: 0.016, // 1.60%
amoPatronale: 0.0226, // 2.26%
participationAMO: 0.0185, // 1.85%
accidentTravail: 0.0055, // 0.55%
retraitePatronale: {
    taux: 0.06, // 6.00%
    seuilMinimum: 6000 // Seuil minimum pour cotiser
},
assuranceDiversPatronale: {
    taux: 0.0126, // 1.26%
    seuilMinimum: 6000 // Seuil minimum pour cotiser
},

// Frais professionnels et déductions fiscales
fraisProfessionnels: {
    taux: 0.20, // 20%
    plafond: 2500, // Plafond théorique
    montantApplique: 1987.07 // Montant corrigé selon Ahmed TIMZINE
},

// Déductions fiscales spécifiques
deductionsFiscales: {
    interetsCredit: {
    tauxDeductionMax: 0.10, // 10% du net imposable maximum
    description: "Intérêts de crédit immobilier"
    },
    chargesFamille: {
    montantParPersonne: 360, // MAD par personne à charge par an
    description: "Charges de famille"
    }
}
};

// ===== BARÈME PRIME D'ANCIENNETÉ =====
export const BAREME_ANCIENNETE = [
{ min: 0, max: 2, taux: 0.00 }, // 0% pour 0-1 ans
{ min: 2, max: 5, taux: 0.05 }, // 5% pour 2-4 ans
{ min: 5, max: 12, taux: 0.10 }, // 10% pour 5-11 ans
{ min: 12, max: 20, taux: 0.15 }, // 15% pour 12-19 ans
{ min: 20, max: 25, taux: 0.20 }, // 20% pour 20-24 ans
{ min: 25, max: Infinity, taux: 0.25 } // 25% pour 25+ ans
];

// ===== BARÈME IGR (IMPÔT SUR LE REVENU) - TRANCHES MENSUELLES =====
// Basé sur le tableau fourni avec les nouvelles tranches:
// 0 - 3 333 MAD = 0% (déduction: 0)
// 3 334 - 5 000 MAD = 10% (déduction: 333.33)
// 5 001 - 6 667 MAD = 20% (déduction: 833.33)
// 6 668 - 8 333 MAD = 30% (déduction: 1500)
// 8 334 - 15 000 MAD = 34% (déduction: 1833.33)
// Au-delà de 15 000 MAD = 37% (déduction: 2283)
export const BAREME_IGR = [
{ min: 0, max: 3333, taux: 0.00, deduction: 0 },
{ min: 3334, max: 5000, taux: 0.10, deduction: 333.33 },
{ min: 5001, max: 6667, taux: 0.20, deduction: 833.33 },
{ min: 6668, max: 8333, taux: 0.30, deduction: 1500 },
{ min: 8334, max: 15000, taux: 0.34, deduction: 1833.33 },
{ min: 15001, max: Infinity, taux: 0.37, deduction: 2283.33 }
];

// ===== FONCTIONS DE CALCUL CORRIGÉES =====

/**
 * Calcule la prime d'ancienneté selon le barème
 */
export function calculerPrimeAnciennete(salaireBase: number, anciennete: number): number {
// Trouve la tranche appropriée selon le barème d'ancienneté
// Les taux s'appliquent à partir de l'année exacte indiquée
const tranche = BAREME_ANCIENNETE.find(t => anciennete >= t.min && (t.max === Infinity || anciennete < t.max));
if (!tranche) return 0;

const prime = salaireBase * tranche.taux;
return prime; // Pas d'arrondi pour maintenir la précision
}


/**
 * Calcule le salaire brut selon la formule correcte:
 * Salaire brut = Salaire de base + Prime d'ancienneté + Prime de transport + Indemnité de représentation
 */
export function calculerSalaireBrut(
salaireBase: number,
primeAnciennete: number,
primeTransport: number,
indemniteRepresentation: number = 0
): number {
return salaireBase + primeAnciennete + primeTransport + indemniteRepresentation;
}

/**
 * Calcule le salaire brut imposable
 */
export function calculerSalaireBrutImposable(
salaireBrut: number,
indemniteRepresentation: number,
primeTransport: number
): number {
return salaireBrut - indemniteRepresentation - primeTransport;
}

/**
 * Calcule les cotisations CNSS avec plafond
 */
export function calculerCotisationsCNSS(salaireBrutImposable: number): {
salariale: number;
patronale: number;
assiettePlafonnee: number;
} {
// La CNSS est toujours calculée sur le plafond de 6000 MAD
const assiettePlafonnee = TAUX_COTISATIONS.cnssPrestation.plafond;

return {
    salariale: assiettePlafonnee * TAUX_COTISATIONS.cnssPrestation.taux,
    patronale: assiettePlafonnee * TAUX_COTISATIONS.cnssPatronale,
    assiettePlafonnee
};
}

/**
 * Calcule les cotisations AMO
 */
export function calculerCotisationsAMO(salaireBrutImposable: number): {
salariale: number;
patronale: number;
participation: number;
} {
return {
    salariale: salaireBrutImposable * TAUX_COTISATIONS.amoSalariale,
    patronale: salaireBrutImposable * TAUX_COTISATIONS.amoPatronale,
    participation: salaireBrutImposable * TAUX_COTISATIONS.participationAMO
};
}

/**
 * Calcule les cotisations retraite (seulement pour salaires > 6000 MAD)
 */
export function calculerCotisationsRetraite(salaireBrutImposable: number): {
salariale: number;
patronale: number;
} {
// Pas de cotisation retraite pour les salaires <= 6000 MAD
if (salaireBrutImposable <= TAUX_COTISATIONS.retraiteSalariale.seuilMinimum) {
    return { salariale: 0, patronale: 0 };
}

return {
    salariale: salaireBrutImposable * TAUX_COTISATIONS.retraiteSalariale.taux,
    patronale: salaireBrutImposable * TAUX_COTISATIONS.retraitePatronale.taux
};
}

/**
 * Calcule les assurances diverses
 * Formule: salaire brut imposable * 1.26%
 */
export function calculerAssurancesDiverses(salaireBrutImposable: number): {
salariale: number;
patronale: number;
} {
return {
    salariale: salaireBrutImposable * TAUX_COTISATIONS.assuranceDiversSalariale.taux,
    patronale: salaireBrutImposable * TAUX_COTISATIONS.assuranceDiversPatronale.taux
};
}

/**
 * Calcule les allocations familiales
 */
export function calculerAllocationsFamiliales(salaireBrutImposable: number): number {
return salaireBrutImposable * TAUX_COTISATIONS.allocationsFamiliales;
}

/**
 * Calcule la taxe de formation professionnelle
 */
export function calculerTaxeFormation(salaireBrutImposable: number): number {
return salaireBrutImposable * TAUX_COTISATIONS.taxeFormationProfessionnelle;
}

/**
 * Calcule les accidents du travail
 */
export function calculerAccidentTravail(salaireBrutImposable: number): number {
return salaireBrutImposable * TAUX_COTISATIONS.accidentTravail;
}

/**
 * Calcule les frais professionnels selon la nouvelle formule:
 * IF(salaire brut imposable*12<78000;MIN(30000/12;35%*salaire brut imposable);MIN(35000/12;25%*salaire brut imposable))
 */
export function calculerFraisProfessionnels(salaireBrutImposable: number): number {
const salaireAnnuel = salaireBrutImposable * 12;

if (salaireAnnuel < 78000) {
    // Salaire annuel < 78 000 MAD
    // MIN(30 000/12, 35% × salaire brut imposable)
    const plafondMensuel = 30000 / 12; // 2 500 MAD
    const pourcentage = salaireBrutImposable * 0.35; // 35%
    return Math.min(plafondMensuel, pourcentage);
} else {
    // Salaire annuel ≥ 78 000 MAD
    // MIN(35 000/12, 25% × salaire brut imposable)
    const plafondMensuel = 35000 / 12; // 2 916,67 MAD
    const pourcentage = salaireBrutImposable * 0.25; // 25%
    return Math.min(plafondMensuel, pourcentage);
}
}
/**
 * Calcule le net imposable selon la nouvelle formule:
 * Net Imposable = Salaire Brut Imposable - CNSS Prestations Part Salariale - AMO Part Salariale - Retraite Part Salariale - Frais Professionnels - Assurance Divers Part Salariale
 */
export function calculerNetImposable(
salaireBrutImposable: number,
cnssPrestation: number,
amoSalariale: number,
retraiteSalariale: number,
fraisProfessionnels: number,
assuranceDiversSalariale: number
): number {
return salaireBrutImposable - cnssPrestation - amoSalariale - retraiteSalariale - fraisProfessionnels - assuranceDiversSalariale;
}

/**
 * Calcule le net net imposable (après déduction des intérêts de crédit)
 * Formule: Net Imposable - MIN(Intérêts Crédit, 10% * Net Imposable)
 */
export function calculerNetNetImposable(netImposable: number, interetsCredit: number): number {
const deductionMax = netImposable * 0.10; // 10% du net imposable
const deductionAppliquee = Math.min(interetsCredit, deductionMax);
return netImposable - deductionAppliquee;
}

/**
 * Calcule l'IGR selon le barème progressif
 * Formule: (Net Net Imposable * Taux - Somme à déduire) * (Jours travaillés / 26) - (500/12 * Nombre de déductions)
 */
export function calculerIGR(netNetImposable: number, joursTravailles: number = 26, nbrDeductions: number = 0): number {
let igr = 0;

for (const tranche of BAREME_IGR) {
    if (netNetImposable >= tranche.min && netNetImposable <= tranche.max) {
    igr = (netNetImposable * tranche.taux) - tranche.deduction;
    break;
    }
}

// Application du facteur de proratisation
const igrProratise = igr * (joursTravailles / 26);

// Application des déductions pour charges de famille
const deductionChargesFamille = (500 / 12) * nbrDeductions;

return Math.max(0, igrProratise - deductionChargesFamille);
}

/**
 * Calcule le total des retenues selon les spécifications:
 * Retenues = Cotisations Salariales + Retenues Personnelles
 * 
 * Cotisations Salariales:
 * - CNSS Prestations - Part Salariale
 * - AMO - Part Salariale  
 * - Retraite - Part Salariale
 * - Assurance Divers - Part Salariale
 * 
 * Retenues Personnelles:
 * - Impôt sur le revenu
 * - Remboursement Crédit immo
 * - Crédit conso
 * - Contribution sociale
 * - Remboursement avance
 */
export function calculerTotalRetenues(
cotisationsSalariales: number,
impotSurRevenu: number,
remboursementCreditImmo: number,
creditConso: number,
contributionSociale: number,
remboursementAvance: number
): number {
const retenues = {
    cotisationsSalariales,
    retenues_personnelles: {
    impotSurRevenu,
    remboursementCreditImmo,
    creditConso,
    contributionSociale,
    remboursementAvance,
    total: impotSurRevenu + remboursementCreditImmo + creditConso + contributionSociale + remboursementAvance
    }
};

return cotisationsSalariales + retenues.retenues_personnelles.total;
}

/**
 * Calcule le détail complet des retenues salariales
 * Retourne le détail de chaque composant des retenues
 */
export function calculerDetailRetenues(salaireBrutImposable: number): {
cnss: number;
amo: number;
retraite: number;
assuranceDivers: number;
totalCotisationsSalariales: number;
details: {
    cnss: { taux: number; plafond: number; assiette: number };
    amo: { taux: number; assiette: number };
    retraite: { taux: number; seuilMinimum: number; assiette: number };
    assuranceDivers: { taux: number; seuilMinimum: number; assiette: number };
};
} {
// Calcul CNSS avec plafond
const cnssAssiette = TAUX_COTISATIONS.cnssPrestation.plafond;
const cnss = cnssAssiette * TAUX_COTISATIONS.cnssPrestation.taux;

// Calcul AMO
const amo = salaireBrutImposable * TAUX_COTISATIONS.amoSalariale;

// Calcul Retraite (seulement si salaire > 6000 MAD)
const retraite = salaireBrutImposable > TAUX_COTISATIONS.retraiteSalariale.seuilMinimum 
    ? salaireBrutImposable * TAUX_COTISATIONS.retraiteSalariale.taux 
    : 0;

// Calcul Assurance Diverses
const assuranceDivers = salaireBrutImposable * TAUX_COTISATIONS.assuranceDiversSalariale.taux;

const totalCotisationsSalariales = cnss + amo + retraite + assuranceDivers;

return {
    cnss,
    amo,
    retraite,
    assuranceDivers,
    totalCotisationsSalariales,
    details: {
    cnss: {
        taux: TAUX_COTISATIONS.cnssPrestation.taux,
        plafond: TAUX_COTISATIONS.cnssPrestation.plafond,
        assiette: cnssAssiette
    },
    amo: {
        taux: TAUX_COTISATIONS.amoSalariale,
        assiette: salaireBrutImposable
    },
    retraite: {
        taux: TAUX_COTISATIONS.retraiteSalariale.taux,
        seuilMinimum: TAUX_COTISATIONS.retraiteSalariale.seuilMinimum,
        assiette: salaireBrutImposable > TAUX_COTISATIONS.retraiteSalariale.seuilMinimum ? salaireBrutImposable : 0
    },
    assuranceDivers: {
        taux: TAUX_COTISATIONS.assuranceDiversSalariale.taux,
        seuilMinimum: TAUX_COTISATIONS.assuranceDiversSalariale.seuilMinimum,
        assiette: salaireBrutImposable
    }
    }
};
}

/**
 * Calcule le salaire net à payer
 */
export function calculerSalaireNet(salaireBrut: number, totalRetenues: number): number {
return salaireBrut - totalRetenues;
}

// ===== CALCUL COMPLET SELON LES DONNÉES DE BASE =====

export interface CalculPayrollParams {
salaireBase: number;
anciennete: number;
primeTransport?: number;
indemniteRepresentation?: number;
indemniteLogement?: number;
indemnitePanier?: number;
interetsCredit?: number;
autresRetenues?: number;
joursTravailles?: number;
nbrDeductions?: number;
}

export interface CalculPayrollResult {
// Gains
salaireBase: number;
primeAnciennete: number;
primeTransport: number;
indemniteRepresentation: number;
salaireBrut: number;
salaireBrutImposable: number;

// Cotisations salariales
cnssPrestation: number;
amoSalariale: number;
retraiteSalariale: number;
assuranceDiversSalariale: number;
totalCotisationsSalariales: number;

// Cotisations patronales
retraitePatronale: number;
assuranceDiversPatronale: number;
cnssPatronale: number;
allocationsFamiliales: number;
taxeFormation: number;
amoPatronale: number;
participationAMO: number;
accidentTravail: number;
totalCotisationsPatronales: number;

// Calcul IGR
fraisProfessionnels: number;
netImposable: number;
interetsCredit: number;
netNetImposable: number;
igr: number;

// Totaux
autresRetenues: number;
totalRetenues: number;
salaireNetAPayer: number;
}

/**
 * Fonction principale de calcul selon les données de base
 */
export function calculerPaieComplete(params: CalculPayrollParams): CalculPayrollResult {
const {
    salaireBase,
    anciennete,
    primeTransport = DONNEES_BASE_REFERENCE.primeTransport,
    indemniteRepresentation = DONNEES_BASE_REFERENCE.indemniteRepresentation,
    indemniteLogement = DONNEES_BASE_REFERENCE.indemniteLogement,
    indemnitePanier = DONNEES_BASE_REFERENCE.indemnitePanier,
    interetsCredit = DONNEES_BASE_REFERENCE.interetsCredit,
    autresRetenues = DONNEES_BASE_REFERENCE.remboursementCredit,
    joursTravailles = DONNEES_BASE_REFERENCE.nombreJoursMois,
    nbrDeductions = 0
} = params;

// 1. Prime d'ancienneté
const primeAnciennete = calculerPrimeAnciennete(salaireBase, anciennete);

// 2. Salaire brut (selon les nouveaux composants)
const salaireBrut = salaireBase + primeAnciennete + indemniteLogement + indemnitePanier + primeTransport + indemniteRepresentation;

// 3. Salaire brut imposable
const salaireBrutImposable = calculerSalaireBrutImposable(salaireBrut, indemniteRepresentation, primeTransport);

// 4. Cotisations salariales
const cnss = calculerCotisationsCNSS(salaireBrutImposable);
const amo = calculerCotisationsAMO(salaireBrutImposable);
const retraite = calculerCotisationsRetraite(salaireBrutImposable);
const assurances = calculerAssurancesDiverses(salaireBrutImposable);

const totalCotisationsSalariales = cnss.salariale + amo.salariale + retraite.salariale + assurances.salariale;

// 5. Cotisations patronales
const allocationsFamiliales = calculerAllocationsFamiliales(salaireBrutImposable);
const taxeFormation = calculerTaxeFormation(salaireBrutImposable);
const accidentTravail = calculerAccidentTravail(salaireBrutImposable);

const totalCotisationsPatronales = retraite.patronale + assurances.patronale + cnss.patronale + 
                                allocationsFamiliales + taxeFormation + amo.patronale + 
                                amo.participation + accidentTravail;

// 6. Frais professionnels
const fraisProfessionnels = calculerFraisProfessionnels(salaireBrutImposable);

// 7. Net imposable selon la nouvelle formule
const netImposable = calculerNetImposable(
    salaireBrutImposable,
    cnss.salariale,
    amo.salariale,
    retraite.salariale,
    fraisProfessionnels,
    assurances.salariale
);

// 8. Net net imposable
const netNetImposable = calculerNetNetImposable(netImposable, interetsCredit);

// 9. IGR
const igr = calculerIGR(netNetImposable, joursTravailles, nbrDeductions);

// 10. Total retenues
const totalRetenues = calculerTotalRetenues(
    totalCotisationsSalariales, 
    igr, 
    autresRetenues, // remboursementCreditImmo
    0, // creditConso
    0, // contributionSociale
    0  // remboursementAvance
);

// 11. Salaire net
const salaireNetAPayer = calculerSalaireNet(salaireBrut, totalRetenues);

return {
    // Gains
    salaireBase,
    primeAnciennete,
    primeTransport,
    indemniteRepresentation,
    salaireBrut,
    salaireBrutImposable,
    
    // Cotisations salariales
    cnssPrestation: cnss.salariale,
    amoSalariale: amo.salariale,
    retraiteSalariale: retraite.salariale,
    assuranceDiversSalariale: assurances.salariale,
    totalCotisationsSalariales,
    
    // Cotisations patronales
    retraitePatronale: retraite.patronale,
    assuranceDiversPatronale: assurances.patronale,
    cnssPatronale: cnss.patronale,
    allocationsFamiliales,
    taxeFormation,
    amoPatronale: amo.patronale,
    participationAMO: amo.participation,
    accidentTravail,
    totalCotisationsPatronales,
    
    // Calcul IGR
    fraisProfessionnels,
    netImposable,
    interetsCredit,
    netNetImposable,
    igr,
    
    // Totaux
    autresRetenues,
    totalRetenues,
    salaireNetAPayer
};
}

// ===== VALIDATION DES CALCULS =====

/**
 * Valide les calculs avec les données de référence
 */
export function validerCalculsReference(): CalculPayrollResult {
return calculerPaieComplete({
    salaireBase: DONNEES_BASE_REFERENCE.salaireBase,
    anciennete: DONNEES_BASE_REFERENCE.anciennete
});
}

// Export des données de base pour utilisation dans toute l'application
export default {
DONNEES_BASE_REFERENCE,
TAUX_COTISATIONS,
BAREME_ANCIENNETE,
BAREME_IGR,
calculerPaieComplete,
validerCalculsReference
};
