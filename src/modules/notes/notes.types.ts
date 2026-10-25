export interface CreateNoteDto {
  content: string;
}

export interface NoteResponse {
  id: number;
  leadId: number;
  content: string;
  createdAt: Date;
}
