import { Agenda } from '../../models/agenda.model';
import { agruparPorTurno } from './agrupar-agenda';

function item(parcial: Partial<Agenda>): Agenda {
  return {
    nomeAluno: 'Aluno',
    nomeProfessor: 'Professor',
    turno: 'manhã',
    horario: '07H',
    diaSemana: '',
    estimuloTreino: '',
    data: '06/08/2026',
    aluno: null,
    psr: null,
    pse: null,
    ...parcial
  };
}

describe('agruparPorTurno', () => {

  it('agrupa por data e turno, com a manha antes da tarde', () => {
    const grupos = agruparPorTurno([
      item({ data: '07/08/2026', turno: 'manhã' }),
      item({ data: '06/08/2026', turno: 'tarde/noite' }),
      item({ data: '06/08/2026', turno: 'manhã' })
    ]);

    expect(grupos.map(grupo => grupo.titulo)).toEqual([
      '06/08 - Manhã',
      '06/08 - Tarde/Noite',
      '07/08 - Manhã'
    ]);
  });

  it('ordena por horario dentro do turno, independente da ordem da planilha', () => {
    const [grupo] = agruparPorTurno([
      item({ nomeAluno: 'C', horario: '10H' }),
      item({ nomeAluno: 'A', horario: '07H' }),
      item({ nomeAluno: 'B', horario: '8H' })
    ]);

    expect(grupo.itens.map(aluno => aluno.nomeAluno)).toEqual(['A', 'B', 'C']);
  });

  it('ordena datas sem zero a esquerda pelo valor, e nao pelo texto', () => {
    // Como texto, "10/8" viria antes de "9/8".
    const grupos = agruparPorTurno([
      item({ data: '10/8/2026' }),
      item({ data: '9/8/2026' })
    ]);

    expect(grupos.map(grupo => grupo.titulo)).toEqual(['09/08 - Manhã', '10/08 - Manhã']);
  });

  it('atravessa a virada do ano na janela de 7 dias', () => {
    const grupos = agruparPorTurno([
      item({ data: '2/1/2027' }),
      item({ data: '30/12/2026' })
    ]);

    expect(grupos.map(grupo => grupo.titulo)).toEqual(['30/12 - Manhã', '02/01 - Manhã']);
  });

  it('junta no mesmo grupo a mesma data escrita com e sem zero a esquerda', () => {
    const grupos = agruparPorTurno([
      item({ data: '6/8/2026' }),
      item({ data: '06/08/2026' })
    ]);

    expect(grupos).toHaveLength(1);
    expect(grupos[0].itens).toHaveLength(2);
  });

  it('devolve lista vazia para agenda vazia', () => {
    expect(agruparPorTurno([])).toEqual([]);
  });
});
