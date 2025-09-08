import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        return await getEmployees(req, res)
      case 'POST':
        return await createEmployee(req, res)
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getEmployees(req: NextApiRequest, res: NextApiResponse) {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return res.status(200).json(employees)
  } catch (error) {
    console.error('Error fetching employees:', error)
    return res.status(500).json({ error: 'Failed to fetch employees' })
  }
}

async function createEmployee(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      matricule,
      nom,
      prenom,
      fonction,
      cin,
      cnss,
      situationFamiliale,
      dateNaissance,
      dateEmbauche,
      nbrDeductions,
      nbreJourMois,
      salaireBase,
      indemniteLogement,
      indemnitePanier,
      primeTransport,
      indemniteRepresentation,
      compteBancaire,
      agence,
      telephone,
      email,
      adresse,
      // CNSS Prestations - Part Salariale (optionnelles)
      useCnssPrestation,
      useAmoSalariale,
      useRetraiteSalariale,
      useAssuranceDiversSalariale
    } = req.body

    // Validation des champs obligatoires
    if (!matricule || !nom || !prenom || !fonction || !dateEmbauche || !salaireBase) {
      return res.status(400).json({ 
        error: 'Les champs matricule, nom, prénom, fonction, date d\'embauche et salaire de base sont obligatoires' 
      })
    }

    // Vérifier l'unicité du matricule
    const existingEmployee = await prisma.employee.findUnique({
      where: { matricule }
    })

    if (existingEmployee) {
      return res.status(400).json({ 
        error: 'Un employé avec ce matricule existe déjà' 
      })
    }

    // Vérifier l'unicité du CIN si fourni
    if (cin) {
      const existingCin = await prisma.employee.findUnique({
        where: { cin }
      })

      if (existingCin) {
        return res.status(400).json({ 
          error: 'Un employé avec ce CIN existe déjà' 
        })
      }
    }

    // Vérifier l'unicité du CNSS si fourni
    if (cnss) {
      const existingCnss = await prisma.employee.findUnique({
        where: { cnss }
      })

      if (existingCnss) {
        return res.status(400).json({ 
          error: 'Un employé avec ce numéro CNSS existe déjà' 
        })
      }
    }

    // Calculer l'ancienneté en années
    const dateEmbaucheObj = new Date(dateEmbauche)
    const today = new Date()
    const anciennete = Math.floor((today.getTime() - dateEmbaucheObj.getTime()) / (1000 * 60 * 60 * 24 * 365.25))

    // Calculer le taux d'ancienneté (exemple: 5% par année, max 25%)
    const tauxAnciennete = Math.min(anciennete * 0.05, 0.25)
    const primeAnciennete = salaireBase * tauxAnciennete

    // Calculer le salaire brut
    const salaireBrut = salaireBase + primeAnciennete + (indemniteLogement || 0) + 
                       (indemnitePanier || 0) + (primeTransport || 0) + (indemniteRepresentation || 0)

    const employee = await prisma.employee.create({
      data: {
        matricule,
        nom: nom.toUpperCase(),
        prenom: prenom.charAt(0).toUpperCase() + prenom.slice(1).toLowerCase(),
        fonction,
        cin,
        cnss,
        situationFamiliale: situationFamiliale || 'CELIBATAIRE',
        dateNaissance: dateNaissance ? new Date(dateNaissance) : null,
        dateEmbauche: new Date(dateEmbauche),
        anciennete,
        nbrDeductions: nbrDeductions || 0,
        nbreJourMois: nbreJourMois || 26,
        salaireBase: parseFloat(salaireBase),
        tauxAnciennete,
        primeAnciennete,
        indemniteLogement: parseFloat(indemniteLogement || 0),
        indemnitePanier: parseFloat(indemnitePanier || 0),
        primeTransport: parseFloat(primeTransport || 0),
        indemniteRepresentation: parseFloat(indemniteRepresentation || 0),
        salaireBrut,
        salaireBrutImposable: salaireBrut,
        salaireNet: 0, // Sera calculé lors du calcul de paie
        compteBancaire,
        agence,
        telephone,
        email,
        adresse,
        // CNSS Prestations - Part Salariale (optionnelles)
        useCnssPrestation: useCnssPrestation !== undefined ? useCnssPrestation : true,
        useAmoSalariale: useAmoSalariale !== undefined ? useAmoSalariale : true,
        useRetraiteSalariale: useRetraiteSalariale !== undefined ? useRetraiteSalariale : true,
        useAssuranceDiversSalariale: useAssuranceDiversSalariale !== undefined ? useAssuranceDiversSalariale : true
      }
    })

    return res.status(201).json(employee)
  } catch (error) {
    console.error('Error creating employee:', error)
    return res.status(500).json({ error: 'Failed to create employee' })
  }
}
