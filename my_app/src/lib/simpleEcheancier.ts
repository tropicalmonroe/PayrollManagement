// Échéancier simple pour les crédits avec saisie manuelle des montants

export interface SimpleEcheance {
  numeroEcheance: number;
  dateEcheance: Date;
  montantAPayer: number; // Montant simple à payer
  statut: 'EN_ATTENTE' | 'PAYEE' | 'EN_RETARD' | 'ANNULEE';
  notes?: string;
}

export interface CreditSimple {
  montantTotal: number; // Montant total du crédit
  montantMensuel: number; // Montant mensuel fixe à payer
  nombreEcheances: number; // Nombre total d'échéances
  dateDebut: Date;
  description?: string; // Description du crédit
}

/**
 * Génère un échéancier simple avec montants manuels
 */
export function genererEcheancierSimple(credit: CreditSimple): SimpleEcheance[] {
  const {
    montantMensuel,
    nombreEcheances,
    dateDebut
  } = credit;

  const echeancier: SimpleEcheance[] = [];

  for (let i = 1; i <= nombreEcheances; i++) {
    // Date d'échéance
    const dateEcheance = new Date(dateDebut);
    dateEcheance.setMonth(dateEcheance.getMonth() + i);

    echeancier.push({
      numeroEcheance: i,
      dateEcheance,
      montantAPayer: montantMensuel,
      statut: 'EN_ATTENTE'
    });
  }

  return echeancier;
}

/**
 * Crée un échéancier avec des montants personnalisés pour chaque échéance
 */
export function creerEcheancierPersonnalise(
  dateDebut: Date,
  montantsPersonnalises: number[]
): SimpleEcheance[] {
  const echeancier: SimpleEcheance[] = [];

  montantsPersonnalises.forEach((montant, index) => {
    const dateEcheance = new Date(dateDebut);
    dateEcheance.setMonth(dateEcheance.getMonth() + index + 1);

    echeancier.push({
      numeroEcheance: index + 1,
      dateEcheance,
      montantAPayer: montant,
      statut: 'EN_ATTENTE'
    });
  });

  return echeancier;
}

/**
 * Calcule la mensualité d'un crédit (pour intégration dans la paie)
 */
export function calculerMensualiteCredit(credit: CreditSimple): number {
  return credit.montantMensuel;
}

/**
 * Obtient l'échéance courante d'un crédit
 */
export function obtenirEcheanceCourante(
  echeancier: SimpleEcheance[], 
  dateReference: Date = new Date()
): SimpleEcheance | null {
  // Trouve la première échéance non payée dont la date est passée ou proche
  const echeanceEnCours = echeancier.find(e => 
    e.statut === 'EN_ATTENTE' && e.dateEcheance <= dateReference
  );
  
  // Si aucune échéance en retard, prendre la prochaine échéance
  if (!echeanceEnCours) {
    return echeancier.find(e => e.statut === 'EN_ATTENTE') || null;
  }
  
  return echeanceEnCours;
}

/**
 * Met à jour le statut d'une échéance
 */
export function marquerEcheancePayee(
  echeancier: SimpleEcheance[],
  numeroEcheance: number,
  datePaiement: Date,
  montantPaye?: number
): SimpleEcheance[] {
  return echeancier.map(e => {
    if (e.numeroEcheance === numeroEcheance) {
      return {
        ...e,
        statut: 'PAYEE' as const
      };
    }
    return e;
  });
}

/**
 * Calcule les statistiques d'un échéancier
 */
export function calculerStatistiquesEcheancier(echeancier: SimpleEcheance[]) {
  const now = new Date();
  
  const totalEcheances = echeancier.length;
  const echeancesPayees = echeancier.filter(e => e.statut === 'PAYEE').length;
  const echeancesEnRetard = echeancier.filter(e => 
    e.statut === 'EN_ATTENTE' && e.dateEcheance < now
  ).length;
  
  const montantTotalPaye = echeancier
    .filter(e => e.statut === 'PAYEE')
    .reduce((sum, e) => sum + e.montantAPayer, 0);
    
  const montantTotalRestant = echeancier
    .filter(e => e.statut === 'EN_ATTENTE')
    .reduce((sum, e) => sum + e.montantAPayer, 0);
    
  const prochainePaiement = echeancier.find(e => e.statut === 'EN_ATTENTE');
  
  return {
    totalEcheances,
    echeancesPayees,
    echeancesEnRetard,
    montantTotalPaye: Math.round(montantTotalPaye * 100) / 100,
    montantTotalRestant: Math.round(montantTotalRestant * 100) / 100,
    prochainePaiement,
    progressionPourcentage: totalEcheances > 0 ? 
      Math.round((echeancesPayees / totalEcheances) * 100 * 100) / 100 : 0
  };
}

/**
 * Vérifie si un crédit est en retard
 */
export function verifierRetardCredit(echeancier: SimpleEcheance[]): {
  enRetard: boolean;
  nombreEcheancesEnRetard: number;
  montantEnRetard: number;
} {
  const now = new Date();
  const echeancesEnRetard = echeancier.filter(e => 
    e.statut === 'EN_ATTENTE' && e.dateEcheance < now
  );
  
  return {
    enRetard: echeancesEnRetard.length > 0,
    nombreEcheancesEnRetard: echeancesEnRetard.length,
    montantEnRetard: Math.round(
      echeancesEnRetard.reduce((sum, e) => sum + e.montantAPayer, 0) * 100
    ) / 100
  };
}
