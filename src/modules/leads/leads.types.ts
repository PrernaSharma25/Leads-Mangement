export const LeadStatus = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  LOST: 'lost',
} as const;

export type LeadStatusType = (typeof LeadStatus)[keyof typeof LeadStatus];

export interface CreateLeadDto {
  name: string;
  email: string;
  phone?: string | null;
  status?: LeadStatusType;
}

export interface UpdateLeadDto {
  name?: string;
  email?: string;
  phone?: string | null;
  status?: LeadStatusType;
}

export interface LeadFilterQuery {
  search?: string;
  status?: LeadStatusType;
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
