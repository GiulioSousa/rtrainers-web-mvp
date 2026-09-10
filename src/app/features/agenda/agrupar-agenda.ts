import { Agenda } from '../../models/agenda.model';

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

/** "07H", "7h", "07:30", "7h30". */
const PADRAO_HORARIO = /^(\d{1,2})(?:[hH:](\d{2})?)?$/;

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

/**
 * "6/8/2026" ou "06/08/2026" -> "2026-08-06". ISO ordena como texto, junta as
 * duas grafias da mesma data e vai para a URL sem barras.
 */
export function paraDataIso(data: string): string {
  const [dia, mes, ano] = data.trim().split('/');

  if (!dia || !mes || !ano) {
    return data;
  }

  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

/** "07H" -> "07:00", "7h30" -> "07:30". Fora do padrao, passa intacto. */
export function formatarHorario(horario: string): string {
  const partes = PADRAO_HORARIO.exec(horario.trim());

  if (!partes) {
    return horario;
  }

  return `${partes[1].padStart(2, '0')}:${partes[2] ?? '00'}`;
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

/** Horario fora do padrao vai para o fim do turno. */
function minutosDoHorario(horario: string): number {
  const partes = PADRAO_HORARIO.exec(horario.trim());

  if (!partes) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Number(partes[1]) * 60 + Number(partes[2] ?? 0);
}
