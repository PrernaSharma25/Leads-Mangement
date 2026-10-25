import { Request, Response, NextFunction } from 'express';
import { LeadsService, leadsService } from './leads.service';

export class LeadsController {
  constructor(private readonly service: LeadsService = leadsService) {}

  getLeads = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.getLeads(req.query);
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  getLeadById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const lead = await this.service.getLeadById(id);
      res.status(200).json({
        success: true,
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  };

  createLead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lead = await this.service.createLead(req.body);
      res.status(201).json({
        success: true,
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  };

  updateLead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const lead = await this.service.updateLead(id, req.body);
      res.status(200).json({
        success: true,
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteLead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      await this.service.deleteLead(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

export const leadsController = new LeadsController();
