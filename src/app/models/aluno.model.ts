/** Espelha AlunoDTO da API. Vem aninhado dentro de Agenda. */
export interface Aluno {
  /** A API sempre devolve null: nao existe id no mundo do Google Sheets. */
  id: number | null;
  nome: string;
  estagio: string;
  lesao: string;
  preferencia: string;
  objetivo: string;
  observacoes: string;
}
