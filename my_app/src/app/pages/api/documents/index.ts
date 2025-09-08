import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { DocumentType, DocumentStatus } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { type, employeeId, periode } = req.query;

      const where: any = {};
      
      if (type) {
        where.type = type as DocumentType;
      }
      
      if (employeeId) {
        where.employeeId = employeeId as string;
      }
      
      if (periode) {
        where.periode = periode as string;
      }

      const documents = await prisma.document.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              matricule: true,
              nom: true,
              prenom: true,
              fonction: true
            }
          }
        },
        orderBy: {
          dateGeneration: 'desc'
        }
      });

      res.status(200).json(documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des documents' });
    }
  } else if (req.method === 'POST') {
    try {
      const {
        type,
        title,
        description,
        employeeId,
        periode,
        generatedBy,
        fileSize,
        fileUrl,
        metadata
      } = req.body;

      const document = await prisma.document.create({
        data: {
          type: type as DocumentType,
          title,
          description,
          employeeId: employeeId || null,
          periode,
          generatedBy,
          fileSize: fileSize || 0,
          fileUrl,
          metadata,
          status: DocumentStatus.GENERATED
        },
        include: {
          employee: {
            select: {
              id: true,
              matricule: true,
              nom: true,
              prenom: true,
              fonction: true
            }
          }
        }
      });

      res.status(201).json(document);
    } catch (error) {
      console.error('Error creating document:', error);
      res.status(500).json({ error: 'Erreur lors de la création du document' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
