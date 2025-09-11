import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { DocumentType, DocumentStatus } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { type, employeeId, period } = req.query;

      const where: any = {};
      
      if (type) {
        where.type = type as DocumentType;
      }
      
      if (employeeId) {
        where.employeeId = employeeId as string;
      }
      
      if (period) {
        where.period = period as string;
      }

      const documents = await prisma.document.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              employeeId: true,
              lastName: true,
              firstName: true,
              position: true
            }
          }
        },
        orderBy: {
          generationDate: 'desc'
        }
      });

      res.status(200).json(documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ error: 'Error fetching documents' });
    }
  } else if (req.method === 'POST') {
    try {
      const {
        type,
        title,
        description,
        employeeId,
        period,
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
          period,
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
              employeeId: true,
              lastName: true,
              firstName: true,
              position: true
            }
          }
        }
      });

      res.status(201).json(document);
    } catch (error) {
      console.error('Error creating document:', error);
      res.status(500).json({ error: 'Error creating document' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}