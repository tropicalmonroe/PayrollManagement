// Système de calcul de paie conforme aux données de base centralisées
// Basé sur la réglementation marocaine en vigueur et les données de référence

import {
  DONNEES_BASE_REFERENCE,
  TAUX_COTISATIONS,
  BAREME_ANCIENNETE,
  BAREME_IGR,
  calculerPaieComplete,
  calculerFraisProfessionnels,
  calculerNetImposable,
  type CalculPayrollParams,
  type CalculPayrollResult
} from './payrollBaseData';

export interface PayrollConfig {
  tauxCNSS: {
    prestationsSalariale: number;
    prestationsPatronale: number;
    allocationsFamiliales: number;
    taxeFormation: number;
  };
  tauxAMO: {
    salariale: number;
    patronale: number;
    participation: number;
  };
  tauxAssurance: {
    diversSalariale: number;
    diversPatronale: number;
    accidentTravail: number;
  };
  tauxRetraite: {
    salariale: number;
    patronale: number;
  };
  plafonds: {
    cnssPlafond: number;
    fraisProfessionnels: number;
  };
}

// Configuration basée sur les données de base centralisées
export const PAYROLL_CONFIG: PayrollConfig = {
  tauxCNSS: {
    prestationsSalariale: TAUX_COTISATIONS.cnssPrestation.taux,
    prestationsPatronale: TAUX_COTISATIONS.cnssPatronale,
    allocationsFamiliales: TAUX_COTISATIONS.allocationsFamiliales,
    taxeFormation: TAUX_COTISATIONS.taxeFormationProfessionnelle,
  },
  tauxAMO: {
    salariale: TAUX_COTISATIONS.amoSalariale,
    patronale: TAUX_COTISATIONS.amoPatronale,
    participation: TAUX_COTISATIONS.participationAMO,
  },
  tauxAssurance: {
    diversSalariale: TAUX_COTISATIONS.assuranceDiversSalariale.taux,
    diversPatronale: TAUX_COTISATIONS.assuranceDiversPatronale.taux,
    accidentTravail: TAUX_COTISATIONS.accidentTravail,
  },
  tauxRetraite: {
    salariale: TAUX_COTISATIONS.retraiteSalariale.taux,
    patronale: TAUX_COTISATIONS.retraitePatronale.taux,
  },
  plafonds: {
    cnssPlafond: TAUX_COTISATIONS.cnssPrestation.plafond,
    fraisProfessionnels: TAUX_COTISATIONS.fraisProfessionnels.montantApplique,
  }
};

// Barème IGR progressif (tranches mensuelles)
export interface TrancheIGR {
  min: number;
  max: number;
  taux: number;
  deduction: number;
}

// Export des barèmes depuis les données de base
export { BAREME_IGR };

// Valeurs par défaut pour les CNSS Prestations - Part Salariale
export const CNSS_PRESTATIONS_DEFAULTS = {
  cnssPrestation: 268.80,
  amoSalariale: 180.16,
  retraiteSalariale: 478.29,
  assuranceDiversSalariale: 100.14
};

// Barème prime d'ancienneté
export interface TrancheAnciennete {
  min: number;
  max: number;
  taux: number;
}

// Export du barème d'ancienneté depuis les données de base
export { BAREME_ANCIENNETE };

// Types d'assurances optionnelles
export interface AssurancesOptionnelles {
  assuranceMaladieComplementaire: boolean; // 2.5%
  assuranceMaladieEtranger: boolean;       // 0.5%
  assuranceInvaliditeRenforcee: boolean;   // 0.316%
}

export const TAUX_ASSURANCES_OPTIONNELLES = {
  assuranceMaladieComplementaire: 0.025,   // 2.5%
  assuranceMaladieEtranger: 0.005,         // 0.5%
  assuranceInvaliditeRenforcee: 0.00316,   // 0.316%
};

// Plafonds des indemnités
export const PLAFONDS_INDEMNITES = {
  logement: {
    pourcentageMax: 0.20,    // 20% du salaire
    plafondAbsolu: 5000,     // 5000 MAD max
  },
  representation: {
    pourcentageMax: 0.10,    // 10% du salaire
    plafondAbsolu: 3000,     // 3000 MAD max
  },
  panier: 750,               // 750 MAD standard
  transport: [500, 1000],    // Options 500 ou 1000 MAD
};

// Interface pour les éléments variables
export interface VariableElement {
  id: string;
  type: 'HEURES_SUP' | 'ABSENCE' | 'PRIME_EXCEPTIONNELLE' | 'CONGE' | 'RETARD' | 'AVANCE' | 'AUTRE';
  description: string;
  montant: number;
  heures?: number;
  taux?: number;
  date: Date;
  mois: string;
  annee: string;
}

// Interface pour les données de calcul
export interface EmployeePayrollData {
  // Données personnelles
  nom: string;
  prenom: string;
  matricule: string;
  cin: string;
  cnss: string;
  situationFamiliale: 'CELIBATAIRE' | 'MARIE' | 'DIVORCE' | 'VEUF';
  dateNaissance: Date;
  dateEmbauche: Date;
  anciennete: number;
  nbrDeductions: number; // Enfants à charge
  nbreJourMois: number;
  
  // Salaire et indemnités
  salaireBase: number;
  indemniteLogement: number;
  indemnitePanier: number;
  primeTransport: number;
  indemniteRepresentation: number;
  
  // Assurances optionnelles
  assurances: AssurancesOptionnelles;
  
  // Crédits et avances
  creditImmobilier?: {
    montantMensuel: number;
    interets: number;
  };
  creditConsommation?: {
    montantMensuel: number;
  };
  avanceSalaire?: {
    montantMensuel: number;
  };
  
  // Éléments variables (optionnel pour compatibilité)
  variableElements?: VariableElement[];
  
  // Banque
  compteBancaire: string;
  agence: string;
  
  // CNSS Prestations - Part Salariale (optionnelles)
  useCnssPrestation?: boolean;
  useAmoSalariale?: boolean;
  useRetraiteSalariale?: boolean;
  useAssuranceDiversSalariale?: boolean;
}

// Résultat du calcul de paie
export interface PayrollResult {
  // Gains
  gains: {
    salaireBase: number;
    primeAnciennete: number;
    indemniteLogement: number;
    indemnitePanier: number;
    primeTransport: number;
    indemniteRepresentation: number;
    heuresSupplementaires?: number;
    primesExceptionnelles?: number;
    autresGains?: number;
    totalGains: number;
  };
  
  // Salaires bruts
  salaireBrut: number;
  salaireBrutImposable: number;
  
  // Cotisations salariales
  cotisationsSalariales: {
    cnssPrestation: number;
    amoSalariale: number;
    retraiteSalariale: number;
    assuranceDiversSalariale: number;
    assurancesOptionnelles: number;
    totalCotisationsSalariales: number;
  };
  
  // Cotisations patronales
  cotisationsPatronales: {
    cnssPrestation: number;
    allocationsFamiliales: number;
    taxeFormation: number;
    amoPatronale: number;
    participationAMO: number;
    accidentTravail: number;
    retraitePatronale: number;
    assuranceDiversPatronale: number;
    totalCotisationsPatronales: number;
  };
  
  // Calcul IGR
  calculIGR: {
    fraisProfessionnels: number;
    netImposable: number;
    netNetImposable: number;
    igrTheorique: number;
    impotSurRevenu: number;
  };
  
  // Autres retenues
  autresRetenues: {
    creditImmobilier: number;
    creditConsommation: number;
    avanceSalaire: number;
    totalAutresRetenues: number;
  };
  
  // Résultat final
  totalRetenues: number;
  salaireNetAPayer: number;
  coutTotalEmployeur: number;
}

/**
 * Calcule la prime d'ancienneté selon le barème progressif
 */
export function calculerPrimeAnciennete(salaireBase: number, anciennete: number): number {
  const tranche = BAREME_ANCIENNETE.find((t: TrancheAnciennete) => anciennete >= t.min && anciennete < t.max);
  return tranche ? salaireBase * tranche.taux : 0;
}

/**
 * Calcule l'indemnité de logement avec plafond
 */
export function calculerIndemniteLogement(salaireBase: number, montantDemande: number): number {
  const plafondPourcentage = salaireBase * PLAFONDS_INDEMNITES.logement.pourcentageMax;
  const plafondAbsolu = PLAFONDS_INDEMNITES.logement.plafondAbsolu;
  const plafondEffectif = Math.min(plafondPourcentage, plafondAbsolu);
  
  return Math.min(montantDemande, plafondEffectif);
}

/**
 * Calcule l'indemnité de représentation avec plafond
 */
export function calculerIndemniteRepresentation(salaireBase: number, montantDemande: number): number {
  const plafondPourcentage = salaireBase * PLAFONDS_INDEMNITES.representation.pourcentageMax;
  const plafondAbsolu = PLAFONDS_INDEMNITES.representation.plafondAbsolu;
  const plafondEffectif = Math.min(plafondPourcentage, plafondAbsolu);
  
  return Math.min(montantDemande, plafondEffectif);
}

/**
 * Calcule les cotisations CNSS avec plafond
 */
export function calculerCotisationsCNSS(salaireBrut: number, salaireBrutImposable: number): {
  cnssPrestation: number;
  allocationsFamiliales: number;
  taxeFormation: number;
} {
  const assietteCNSS = Math.min(salaireBrut, PAYROLL_CONFIG.plafonds.cnssPlafond);
  
  return {
    cnssPrestation: assietteCNSS * PAYROLL_CONFIG.tauxCNSS.prestationsSalariale,
    allocationsFamiliales: salaireBrutImposable * PAYROLL_CONFIG.tauxCNSS.allocationsFamiliales,
    taxeFormation: salaireBrutImposable * PAYROLL_CONFIG.tauxCNSS.taxeFormation,
  };
}

/**
 * Calcule les cotisations AMO
 */
export function calculerCotisationsAMO(salaireBrutImposable: number): {
  amoSalariale: number;
  amoPatronale: number;
  participationAMO: number;
} {
  return {
    amoSalariale: salaireBrutImposable * PAYROLL_CONFIG.tauxAMO.salariale,
    amoPatronale: salaireBrutImposable * PAYROLL_CONFIG.tauxAMO.patronale,
    participationAMO: salaireBrutImposable * PAYROLL_CONFIG.tauxAMO.participation,
  };
}

/**
 * Calcule les cotisations retraite (seulement pour salaires > 6000 MAD)
 */
export function calculerCotisationsRetraite(salaireBrutImposable: number): {
  retraiteSalariale: number;
  retraitePatronale: number;
} {
  // Pas de cotisation retraite pour les salaires <= 6000 MAD
  if (salaireBrutImposable <= TAUX_COTISATIONS.retraiteSalariale.seuilMinimum) {
    return { retraiteSalariale: 0, retraitePatronale: 0 };
  }
  
  return {
    retraiteSalariale: salaireBrutImposable * PAYROLL_CONFIG.tauxRetraite.salariale,
    retraitePatronale: salaireBrutImposable * PAYROLL_CONFIG.tauxRetraite.patronale,
  };
}

/**
 * Calcule les assurances diverses
 * Formule: salaire brut imposable * 1.26% (taux standard sans ajustement)
 * IMPORTANT: Maintient la précision complète sans arrondi intermédiaire
 */
export function calculerAssurancesDiverses(salaireBrutImposable: number): {
  assuranceDiversSalariale: number;
  assuranceDiversPatronale: number;
  accidentTravail: number;
} {
  return {
    assuranceDiversSalariale: salaireBrutImposable * PAYROLL_CONFIG.tauxAssurance.diversSalariale,
    assuranceDiversPatronale: salaireBrutImposable * PAYROLL_CONFIG.tauxAssurance.diversPatronale,
    accidentTravail: salaireBrutImposable * PAYROLL_CONFIG.tauxAssurance.accidentTravail,
  };
}

/**
 * Calcule les assurances optionnelles
 */
export function calculerAssurancesOptionnelles(
  salaireBrutImposable: number, 
  assurances: AssurancesOptionnelles
): number {
  let total = 0;
  
  if (assurances.assuranceMaladieComplementaire) {
    total += salaireBrutImposable * TAUX_ASSURANCES_OPTIONNELLES.assuranceMaladieComplementaire;
  }
  
  if (assurances.assuranceMaladieEtranger) {
    total += salaireBrutImposable * TAUX_ASSURANCES_OPTIONNELLES.assuranceMaladieEtranger;
  }
  
  if (assurances.assuranceInvaliditeRenforcee) {
    total += salaireBrutImposable * TAUX_ASSURANCES_OPTIONNELLES.assuranceInvaliditeRenforcee;
  }
  
  return total;
}

/**
 * Calcule l'IGR selon le barème progressif avec proratisation et nouvelle formule de déductions
 * Formule IGR théorique: ((net net imposable * taux) - déduction) * (nb jours mois / 26)
 * Formule finale: IF((IGR théorique-(500/12*Nbr déductions))<=0;0;IGR théorique-(500/12*Nbr déductions))
 * IMPORTANT: Maintient la précision complète dans tous les calculs intermédiaires
 */
export function calculerIGR(
  netImposable: number, 
  interetsCredit: number = 0,
  situationFamiliale: string,
  nbrDeductions: number,
  nbreJourMois: number = 26
): {
  netImposable: number;
  netNetImposable: number;
  igrTheorique: number;
  impotSurRevenu: number;
} {
  // Calcul du net net imposable (après déduction des intérêts de crédit)
  // Maintenir la précision complète sans arrondi
  const deductionMax = netImposable * 0.10; // 10% du net imposable
  const deductionAppliquee = Math.min(interetsCredit, deductionMax);
  const netNetImposable = netImposable - deductionAppliquee;
  
  // Recherche de la tranche applicable
  const tranche = BAREME_IGR.find((t: TrancheIGR) => netNetImposable >= t.min && netNetImposable <= t.max);
  
  if (!tranche) {
    return {
      netImposable,
      netNetImposable,
      igrTheorique: 0,
      impotSurRevenu: 0
    };
  }
  
  // Calcul IGR théorique avec proratisation selon le nombre de jours travaillés
  // Formule: ((net net imposable * taux) - déduction) * (nb jours mois / 26)
  // Maintenir la précision complète dans tous les calculs
  const igrMensuelComplet = Math.max(0, (netNetImposable * tranche.taux) - tranche.deduction);
  const igrTheorique = igrMensuelComplet * (nbreJourMois / 26);
  
  // Application de la nouvelle formule de déductions pour charges de famille
  // Formule: IF((IGR théorique-(500/12*Nbr déductions))<=0;0;IGR théorique-(500/12*Nbr déductions))
  // Maintenir la précision complète: 500/12 = 41.666666666666664
  const deductionMensuelle = (500 / 12) * nbrDeductions;
  const impotApresDeduction = igrTheorique - deductionMensuelle;
  
  // Si le résultat est <= 0, alors l'impôt = 0, sinon on applique la déduction
  // Maintenir la précision complète jusqu'au résultat final
  const impotSurRevenu = Math.max(0, impotApresDeduction);
  
  return {
    netImposable,
    netNetImposable,
    igrTheorique,
    impotSurRevenu
  };
}

/**
 * Traite les éléments variables pour le calcul de paie
 */
export function traiterElementsVariables(variableElements: VariableElement[] = []): {
  heuresSupplementaires: number;
  primesExceptionnelles: number;
  absences: number;
  retards: number;
  avancesVariables: number;
  autresGains: number;
  autresRetenues: number;
} {
  let heuresSupplementaires = 0;
  let primesExceptionnelles = 0;
  let absences = 0;
  let retards = 0;
  let avancesVariables = 0;
  let autresGains = 0;
  let autresRetenues = 0;

  variableElements.forEach(element => {
    switch (element.type) {
      case 'HEURES_SUP':
        heuresSupplementaires += element.montant;
        break;
      case 'PRIME_EXCEPTIONNELLE':
        primesExceptionnelles += element.montant;
        break;
      case 'ABSENCE':
        absences += element.montant; // Montant négatif (retenue)
        break;
      case 'RETARD':
        retards += element.montant; // Montant négatif (retenue)
        break;
      case 'AVANCE':
        avancesVariables += element.montant; // Montant négatif (retenue)
        break;
      case 'CONGE':
        // Les congés peuvent être payés ou non payés selon le contexte
        if (element.montant > 0) {
          autresGains += element.montant;
        } else {
          autresRetenues += Math.abs(element.montant);
        }
        break;
      case 'AUTRE':
        // Autres éléments peuvent être des gains ou des retenues
        if (element.montant > 0) {
          autresGains += element.montant;
        } else {
          autresRetenues += Math.abs(element.montant);
        }
        break;
    }
  });

  return {
    heuresSupplementaires,
    primesExceptionnelles,
    absences: Math.abs(absences), // Convertir en positif pour les retenues
    retards: Math.abs(retards),
    avancesVariables: Math.abs(avancesVariables),
    autresGains,
    autresRetenues
  };
}

/**
 * Fonction principale de calcul de paie
 * IMPORTANT: Maintient la précision complète dans tous les calculs intermédiaires
 * Les arrondis ne sont appliqués qu'au niveau de l'affichage final
 */
export function calculerPaie(employee: EmployeePayrollData): PayrollResult {
  // 0. Traitement des éléments variables
  const elementsVariables = traiterElementsVariables(employee.variableElements);

  // 1. Calcul des gains
  const primeAnciennete = calculerPrimeAnciennete(employee.salaireBase, employee.anciennete);
  const indemniteLogement = calculerIndemniteLogement(employee.salaireBase, employee.indemniteLogement);
  const indemniteRepresentation = calculerIndemniteRepresentation(employee.salaireBase, employee.indemniteRepresentation);
  
  const gains = {
    salaireBase: employee.salaireBase,
    primeAnciennete,
    indemniteLogement,
    indemnitePanier: employee.indemnitePanier,
    primeTransport: employee.primeTransport,
    indemniteRepresentation,
    // Ajout des éléments variables positifs
    heuresSupplementaires: elementsVariables.heuresSupplementaires,
    primesExceptionnelles: elementsVariables.primesExceptionnelles,
    autresGains: elementsVariables.autresGains,
    totalGains: employee.salaireBase + primeAnciennete + indemniteLogement + 
                employee.indemnitePanier + employee.primeTransport + indemniteRepresentation +
                elementsVariables.heuresSupplementaires + elementsVariables.primesExceptionnelles + 
                elementsVariables.autresGains
  };
  
  // 2. Calcul des salaires bruts
  const salaireBrut = gains.totalGains;
  const salaireBrutImposable = salaireBrut - employee.primeTransport - employee.indemniteRepresentation; // Transport et représentation non imposables
  
  // 3. Calcul des cotisations salariales
  const cotisationsCNSS = calculerCotisationsCNSS(salaireBrut, salaireBrutImposable);
  const cotisationsAMO = calculerCotisationsAMO(salaireBrutImposable);
  const cotisationsRetraite = calculerCotisationsRetraite(salaireBrutImposable);
  const assurancesDiverses = calculerAssurancesDiverses(salaireBrutImposable);
  const assurancesOptionnelles = calculerAssurancesOptionnelles(salaireBrutImposable, employee.assurances);
  
  // Utiliser les valeurs par défaut si les checkboxes sont cochées, sinon calculer
  const cotisationsSalariales = {
    cnssPrestation: employee.useCnssPrestation ? CNSS_PRESTATIONS_DEFAULTS.cnssPrestation : cotisationsCNSS.cnssPrestation,
    amoSalariale: employee.useAmoSalariale ? CNSS_PRESTATIONS_DEFAULTS.amoSalariale : cotisationsAMO.amoSalariale,
    retraiteSalariale: employee.useRetraiteSalariale ? CNSS_PRESTATIONS_DEFAULTS.retraiteSalariale : cotisationsRetraite.retraiteSalariale,
    assuranceDiversSalariale: employee.useAssuranceDiversSalariale ? CNSS_PRESTATIONS_DEFAULTS.assuranceDiversSalariale : assurancesDiverses.assuranceDiversSalariale,
    assurancesOptionnelles,
    totalCotisationsSalariales: 0 // Calculé ci-dessous
  };
  
  // Calculer le total des cotisations salariales
  cotisationsSalariales.totalCotisationsSalariales = 
    cotisationsSalariales.cnssPrestation + cotisationsSalariales.amoSalariale + 
    cotisationsSalariales.retraiteSalariale + cotisationsSalariales.assuranceDiversSalariale + 
    cotisationsSalariales.assurancesOptionnelles;
  
  // 4. Calcul des cotisations patronales
  const cotisationsPatronales = {
    cnssPrestation: Math.min(salaireBrut, PAYROLL_CONFIG.plafonds.cnssPlafond) * PAYROLL_CONFIG.tauxCNSS.prestationsPatronale,
    allocationsFamiliales: cotisationsCNSS.allocationsFamiliales,
    taxeFormation: cotisationsCNSS.taxeFormation,
    amoPatronale: cotisationsAMO.amoPatronale,
    participationAMO: cotisationsAMO.participationAMO,
    accidentTravail: assurancesDiverses.accidentTravail,
    retraitePatronale: cotisationsRetraite.retraitePatronale,
    assuranceDiversPatronale: assurancesDiverses.assuranceDiversPatronale,
    totalCotisationsPatronales: 0 // Calculé ci-dessous
  };
  
  cotisationsPatronales.totalCotisationsPatronales = 
    cotisationsPatronales.cnssPrestation + cotisationsPatronales.allocationsFamiliales +
    cotisationsPatronales.taxeFormation + cotisationsPatronales.amoPatronale +
    cotisationsPatronales.participationAMO + cotisationsPatronales.accidentTravail +
    cotisationsPatronales.retraitePatronale + cotisationsPatronales.assuranceDiversPatronale;
  
  // 5. Calcul des frais professionnels et du net imposable selon la nouvelle formule
  const fraisProfessionnels = calculerFraisProfessionnels(salaireBrutImposable);
  const netImposable = calculerNetImposable(
    salaireBrutImposable,
    cotisationsSalariales.cnssPrestation,
    cotisationsSalariales.amoSalariale,
    cotisationsSalariales.retraiteSalariale,
    fraisProfessionnels,
    cotisationsSalariales.assuranceDiversSalariale
  );
  
  // 6. Calcul IGR avec proratisation selon le nombre de jours travaillés
  const interetsCredit = employee.creditImmobilier?.interets || 0;
  const calculIGR = calculerIGR(netImposable, interetsCredit, employee.situationFamiliale, employee.nbrDeductions, employee.nbreJourMois);
  
  // 7. Autres retenues
  const autresRetenues = {
    creditImmobilier: employee.creditImmobilier?.montantMensuel || 0,
    creditConsommation: employee.creditConsommation?.montantMensuel || 0,
    avanceSalaire: employee.avanceSalaire?.montantMensuel || 0,
    totalAutresRetenues: (employee.creditImmobilier?.montantMensuel || 0) + 
                        (employee.creditConsommation?.montantMensuel || 0) + 
                        (employee.avanceSalaire?.montantMensuel || 0)
  };
  
  // 8. Calcul final
  const totalRetenues = cotisationsSalariales.totalCotisationsSalariales + calculIGR.impotSurRevenu + autresRetenues.totalAutresRetenues;
  const salaireNetAPayer = salaireBrut - totalRetenues;
  const coutTotalEmployeur = salaireBrut + cotisationsPatronales.totalCotisationsPatronales;
  
  return {
    gains,
    salaireBrut,
    salaireBrutImposable,
    cotisationsSalariales,
    cotisationsPatronales,
    calculIGR: {
      fraisProfessionnels,
      ...calculIGR
    },
    autresRetenues,
    totalRetenues,
    salaireNetAPayer,
    coutTotalEmployeur
  };
}
