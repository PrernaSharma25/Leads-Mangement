import { Note } from '@prisma/client';
import { prisma } from '../../database/prisma';

export class NotesRepository {
  async leadExists(leadId: number): Promise<boolean> {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true },
    });
    return lead !== null;
  }

  async findManyByLeadId(leadId: number): Promise<Note[]> {
    return prisma.note.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(leadId: number, content: string): Promise<Note> {
    return prisma.note.create({
      data: {
        leadId,
        content,
      },
    });
  }
}

export const notesRepository = new NotesRepository();
