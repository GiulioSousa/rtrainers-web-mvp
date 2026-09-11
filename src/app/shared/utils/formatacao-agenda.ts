import { Agenda, ChaveAgenda } from '../../models/agenda.model';

/** "07H", "7h", "07:30", "7h30". */
const PADRAO_HORARIO = /^(\d{1,2})(?:[hH:](\d{2})?)?$/;

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

/** "2026-08-06" -> "06/08/2026": o formato que POST /professor/sessao/* exige. */
export function paraDataBr(dataIso: string): string {
  const [ano, mes, dia] = dataIso.split('-');

  if (!ano || !mes || !dia) {
    return dataIso;
  }

  return `${dia}/${mes}/${ano}`;
}

/** "07H" -> "07:00", "7h30" -> "07:30". Fora do padrao, passa intacto. */
export function formatarHorario(horario: string): string {
  const partes = PADRAO_HORARIO.exec(horario.trim());

  if (!partes) {
    return horario;
  }

  return `${partes[1].padStart(2, '0')}:${partes[2] ?? '00'}`;
}

/** Minutos desde a meia-noite. Horario fora do padrao vai para o fim. */
export function minutosDoHorario(horario: string): number {
  const partes = PADRAO_HORARIO.exec(horario.trim());

  if (!partes) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Number(partes[1]) * 60 + Number(partes[2] ?? 0);
}

/**
 * O item da agenda que a rota do Detalhe aponta. O horario compara exato:
 * e o mesmo texto que volta para a API ao gravar PSR/PSE.
 */
export function correspondeAChave(item: Agenda, chave: ChaveAgenda): boolean {
  return paraDataIso(item.data) === chave.data
    && item.horario === chave.horario
    && item.nomeAluno === chave.nomeAluno;
}
