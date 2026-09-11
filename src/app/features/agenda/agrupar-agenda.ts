import { Agenda } from '../../models/agenda.model';
import { minutosDoHorario, paraDataIso } from '../../shared/utils/formatacao-agenda';

/** Um Card-Turno da tela: os alunos de uma data num turno. */
export interface GrupoTurno {
  /** Data ISO + turno. Estavel entre recargas: serve de track no @for. */
  chave: string;
  /** Formato "dd/MM - Manhã" ou "dd/MM - Tarde/Noite". */
  titulo: string;
  itens: Agenda[];
}

/** A API grava o turno fixo por aba da planilha: "manhã" ou "tarde/noite". */
const TURNOS: Record<string, { ordem: number; rotulo: string }> = {
  'manhã': { ordem: 0, rotulo: 'Manhã' },
  'tarde/noite': { ordem: 1, rotulo: 'Tarde/Noite' }
};

/**
 * Agrupa por data e turno, com data, turno e horario em ordem crescente.
 * A API devolve as linhas na ordem da planilha, sem agrupar — B4.
 */
export function agruparPorTurno(agenda: readonly Agenda[]): GrupoTurno[] {
  const grupos = new Map<string, GrupoTurno>();

  for (const item of [...agenda].sort(compararItens)) {
    const chave = `${paraDataIso(item.data)}|${normalizarTurno(item.turno)}`;
    let grupo = grupos.get(chave);

    if (!grupo) {
      grupo = { chave, titulo: montarTitulo(item), itens: [] };
      grupos.set(chave, grupo);
    }

    grupo.itens.push(item);
  }

  // Map preserva a ordem de insercao, e a entrada ja veio ordenada.
  return [...grupos.values()];
}

function compararItens(a: Agenda, b: Agenda): number {
  return paraDataIso(a.data).localeCompare(paraDataIso(b.data))
    || ordemDoTurno(a.turno) - ordemDoTurno(b.turno)
    || minutosDoHorario(a.horario) - minutosDoHorario(b.horario)
    || a.nomeAluno.localeCompare(b.nomeAluno, 'pt-BR');
}

function montarTitulo(item: Agenda): string {
  const [, mes, dia] = paraDataIso(item.data).split('-');
  const turno = TURNOS[normalizarTurno(item.turno)]?.rotulo ?? item.turno;
  return `${dia}/${mes} - ${turno}`;
}

function normalizarTurno(turno: string): string {
  return turno.trim().toLowerCase().normalize('NFC');
}

/** Turno desconhecido vai para o fim, sem quebrar a ordenacao. */
function ordemDoTurno(turno: string): number {
  return TURNOS[normalizarTurno(turno)]?.ordem ?? Number.MAX_SAFE_INTEGER;
}
