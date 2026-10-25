import { Request, Response, NextFunction } from 'express';
import { NotesService, notesService } from './notes.service';

export class NotesController {
  constructor(private readonly service: NotesService = notesService) {}

  getNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const leadId = Number(req.params.id);
      const notes = await this.service.getNotesByLeadId(leadId);
      res.status(200).json({
        success: true,
        data: notes,
      });
    } catch (error) {
      next(error);
    }
  };

  createNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const leadId = Number(req.params.id);
      const note = await this.service.createNote(leadId, req.body);
      res.status(201).json({
        success: true,
        data: note,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const notesController = new NotesController();
