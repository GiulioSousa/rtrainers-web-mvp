/**
 * Dados para gravar PSR ou PSE.
 * A API recebe estes valores por QUERY STRING (@RequestParam), nao em corpo
 * JSON — ver B6. O nome do parametro da nota muda conforme o endpoint
 * (psr ou pse), por isso aqui ele e generico.
 */
export interface RegistroSessao {
  nomeProfessor: string;
  nomeAluno: string;
  /** Exatamente como veio na Agenda, ex: "07H". */
  horario: string;
  /** Formato dd/MM/yyyy. */
  data: string;
  /** Nota de 1 a 10. */
  valor: number;
}
