import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { AutenticacaoService } from '../../core/services/autenticacao.service';
import { ProfessorService } from '../../core/services/professor.service';
import { Agenda } from '../../models/agenda.model';
import { Botao } from '../../shared/components/botao/botao';
import { Cabecalho } from '../../shared/components/cabecalho/cabecalho';
import { CardAluno } from '../../shared/components/card-aluno/card-aluno';
import { CardTurno } from '../../shared/components/card-turno/card-turno';
import { Carregando } from '../../shared/components/carregando/carregando';
import { GrupoTurno, agruparPorTurno, formatarHorario, paraDataIso } from './agrupar-agenda';

type EstadoAgenda = 'carregando' | 'pronta' | 'erro';

// Classe prefixada com Pagina para nao colidir com a interface Agenda do model.
@Component({
  selector: 'app-agenda',
  imports: [Botao, Cabecalho, CardAluno, CardTurno, Carregando],
  templateUrl: './agenda.html',
  styleUrl: './agenda.scss'
})
export class PaginaAgenda {

  private readonly professor = inject(ProfessorService);
  private readonly autenticacao = inject(AutenticacaoService);
  private readonly roteador = inject(Router);
  private readonly destruicao = inject(DestroyRef);

  readonly estado = signal<EstadoAgenda>('carregando');
  readonly grupos = signal<GrupoTurno[]>([]);
  readonly mensagemErro = signal('');

  protected readonly formatarHorario = formatarHorario;

  constructor() {
    this.carregar();
  }

  carregar(): void {
    const nomeProfessor = this.autenticacao.nomeProfessor();

    // Token e nome sao gravados e apagados juntos: sem nome, a sessao esta corrompida.
    if (!nomeProfessor) {
      this.autenticacao.encerrarSessao();
      this.roteador.navigate(['/login']);
      return;
    }

    this.estado.set('carregando');

    this.professor.buscarAgenda(nomeProfessor)
      .pipe(takeUntilDestroyed(this.destruicao))
      .subscribe({
        next: agenda => {
          this.grupos.set(agruparPorTurno(agenda));
          this.estado.set('pronta');
        },
        error: (erro: HttpErrorResponse) => {
          // O jwtInterceptor ja esta levando ao login: manter o spinner evita piscar erro.
          if (erro.status === 401 || erro.status === 403) {
            return;
          }

          this.mensagemErro.set(this.descreverErro(erro));
          this.estado.set('erro');
        }
      });
  }

  /** Chave completa do aluno na agenda — ver a rota em app.routes.ts. */
  protected rotaDetalhe(item: Agenda): string[] {
    return ['/agenda', paraDataIso(item.data), item.horario, item.nomeAluno];
  }

  /** Aluno sem ficha na aba de anamnese chega com aluno null. */
  protected estagioDe(item: Agenda): string {
    if (!item.aluno) {
      return 'Sem ficha';
    }

    return item.aluno.estagio || '—';
  }

  private descreverErro(erro: HttpErrorResponse): string {
    if (erro.status === 0) {
      return 'Não foi possível conectar ao servidor.';
    }

    if (erro.status === 503) {
      return 'Serviço temporariamente indisponível.';
    }

    return 'Não foi possível carregar a agenda.';
  }
}
