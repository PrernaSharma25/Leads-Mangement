import { Note } from '@prisma/client';
import { NotFoundError } from '../../errors/app-error';
import { NotesRepository, notesRepository } from './notes.repository';
import { CreateNoteDto } from './notes.types';

export class NotesService {
  constructor(private readonly repo: NotesRepository = notesRepository) {}

  async getNotesByLeadId(leadId: number): Promise<Note[]> {
    const exists = await this.repo.leadExists(leadId);
    if (!exists) {
      throw new NotFoundError(`Lead with ID ${leadId} not found`);
    }

    return this.repo.findManyByLeadId(leadId);
  }

  async createNote(leadId: number, dto: CreateNoteDto): Promise<Note> {
    const exists = await this.repo.leadExists(leadId);
    if (!exists) {
      throw new NotFoundError(`Lead with ID ${leadId} not found`);
    }

    return this.repo.create(leadId, dto.content);
  }
}

export const notesService = new NotesService();
