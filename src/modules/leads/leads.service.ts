import { Lead } from '@prisma/client';
import { ConflictError, NotFoundError } from '../../errors/app-error';
import { LeadsRepository, leadsRepository } from './leads.repository';
import { CreateLeadDto, LeadFilterQuery, PaginationMeta, UpdateLeadDto } from './leads.types';

export class LeadsService {
  constructor(private readonly repo: LeadsRepository = leadsRepository) {}

  async getLeads(query: LeadFilterQuery): Promise<{ data: Lead[]; pagination: PaginationMeta }> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(100, query.limit ?? 10));
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.repo.count(query),
      this.repo.findMany(query, skip, limit),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async getLeadById(id: number): Promise<Lead> {
    const lead = await this.repo.findById(id);
    if (!lead) {
      throw new NotFoundError(`Lead with ID ${id} not found`);
    }
    return lead;
  }

  async createLead(dto: CreateLeadDto): Promise<Lead> {
    const existing = await this.repo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError(`A lead with email '${dto.email}' already exists`);
    }

    return this.repo.create(dto);
  }

  async updateLead(id: number, dto: UpdateLeadDto): Promise<Lead> {
    const current = await this.repo.findById(id);
    if (!current) {
      throw new NotFoundError(`Lead with ID ${id} not found`);
    }

    if (dto.email && dto.email !== current.email) {
      const existingEmailLead = await this.repo.findByEmail(dto.email);
      if (existingEmailLead && existingEmailLead.id !== id) {
        throw new ConflictError(`Email '${dto.email}' is already in use by another lead`);
      }
    }

    return this.repo.update(id, dto);
  }

  async deleteLead(id: number): Promise<void> {
    const current = await this.repo.findById(id);
    if (!current) {
      throw new NotFoundError(`Lead with ID ${id} not found`);
    }

    await this.repo.delete(id);
  }
}

export const leadsService = new LeadsService();
