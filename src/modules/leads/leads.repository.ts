import { Lead, Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { CreateLeadDto, LeadFilterQuery, UpdateLeadDto } from './leads.types';

export class LeadsRepository {
  private buildWhereClause(filters: LeadFilterQuery): Prisma.LeadWhereInput {
    const where: Prisma.LeadWhereInput = {};

    if (filters.search) {
      where.OR = [{ name: { contains: filters.search } }, { email: { contains: filters.search } }];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    return where;
  }

  async findMany(filters: LeadFilterQuery, skip: number, take: number): Promise<Lead[]> {
    return prisma.lead.findMany({
      where: this.buildWhereClause(filters),
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { notes: true },
        },
      },
    });
  }

  async count(filters: LeadFilterQuery): Promise<number> {
    return prisma.lead.count({
      where: this.buildWhereClause(filters),
    });
  }

  async findById(id: number): Promise<(Lead & { notes: unknown[] }) | null> {
    return prisma.lead.findUnique({
      where: { id },
      include: {
        notes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findByEmail(email: string): Promise<Lead | null> {
    return prisma.lead.findUnique({
      where: { email },
    });
  }

  async create(data: CreateLeadDto): Promise<Lead> {
    return prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        status: data.status ?? 'new',
      },
    });
  }

  async update(id: number, data: UpdateLeadDto): Promise<Lead> {
    return prisma.lead.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<Lead> {
    return prisma.lead.delete({
      where: { id },
    });
  }
}

export const leadsRepository = new LeadsRepository();
