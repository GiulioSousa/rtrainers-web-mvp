import { Aluno } from './aluno.model';

/** Espelha AgendaDTO da API (GET /professor/agenda/{nomeProfessor}). */
export interface Agenda {
  nomeAluno: string;
  nomeProfessor: string;
  /** "manhã" ou "tarde/noite" — texto cru vindo da planilha. */
  turno: string;
  /** Formato NNH, ex: "07H". Reenviar exatamente assim ao gravar PSR/PSE. */
  horario: string;
  /**
   * Campo morto: a API sempre devolve string vazia.
   * Mantido porque a limpeza do contrato (B3) segue em aberto. Nao usar.
   */
  diaSemana: string;
  estimuloTreino: string;
  /** Formato dd/MM/yyyy. */
  data: string;
  /** null quando o aluno da agenda nao tem ficha na aba de anamnese. */
  aluno: Aluno | null;
  /** null enquanto nao registrado. */
  psr: number | null;
  /** null enquanto nao registrado. */
  pse: number | null;
}
