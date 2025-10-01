import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { DocumentType, DocumentStatus } from '@prisma/client';

// GET /api/documents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const employeeId = searchParams.get('employeeId');
    const period = searchParams.get('period');

    const where: any = {};
    if (type) where.type = type as DocumentType;
    if (employeeId) where.employeeId = employeeId as string;
    if (period) where.period = period as string;

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

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Error fetching documents' }, { status: 500 });
  }
}

// POST /api/documents
export async function POST(request: NextRequest) {
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
    } = await request.json();

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

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json({ error: 'Error creating document' }, { status: 500 });
  }
}