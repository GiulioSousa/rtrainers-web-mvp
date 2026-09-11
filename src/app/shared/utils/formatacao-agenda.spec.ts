import { Agenda } from '../../models/agenda.model';
import { correspondeAChave, formatarHorario, paraDataBr, paraDataIso } from './formatacao-agenda';

function item(parcial: Partial<Agenda>): Agenda {
  return {
    nomeAluno: 'João Pedro',
    nomeProfessor: 'Professor',
    turno: 'manhã',
    horario: '07H',
    diaSemana: '',
    estimuloTreino: '',
    data: '6/8/2026',
    aluno: null,
    psr: null,
    pse: null,
    ...parcial
  };
}

describe('formatarHorario', () => {

  it.each([
    ['07H', '07:00'],
    ['7h', '07:00'],
    ['14:30', '14:30'],
    ['7h30', '07:30'],
    ['a combinar', 'a combinar']
  ])('exibe %s como %s', (entrada, esperado) => {
    expect(formatarHorario(entrada)).toBe(esperado);
  });
});

describe('paraDataIso', () => {

  it('completa dia e mes com zero a esquerda', () => {
    expect(paraDataIso('6/8/2026')).toBe('2026-08-06');
  });

  it('mantem a data que ja tem zero a esquerda', () => {
    expect(paraDataIso('06/08/2026')).toBe('2026-08-06');
  });
});

describe('paraDataBr', () => {

  it('converte ISO para dd/MM/yyyy, o formato que a API exige', () => {
    expect(paraDataBr('2026-08-06')).toBe('06/08/2026');
  });
});

describe('correspondeAChave', () => {

  it('reconhece o item mesmo com a data da planilha sem zero a esquerda', () => {
    const chave = { data: '2026-08-06', horario: '07H', nomeAluno: 'João Pedro' };
    expect(correspondeAChave(item({}), chave)).toBe(true);
  });

  it('distingue horarios diferentes no mesmo dia', () => {
    const chave = { data: '2026-08-06', horario: '08H', nomeAluno: 'João Pedro' };
    expect(correspondeAChave(item({}), chave)).toBe(false);
  });
});
