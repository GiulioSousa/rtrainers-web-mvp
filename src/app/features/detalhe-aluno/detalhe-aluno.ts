import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChildren
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';

import { AutenticacaoService } from '../../core/services/autenticacao.service';
import { ProfessorService } from '../../core/services/professor.service';
import { Agenda, ChaveAgenda } from '../../models/agenda.model';
import { RegistroSessao } from '../../models/sessao.model';
import { Botao } from '../../shared/components/botao/botao';
import { Cabecalho } from '../../shared/components/cabecalho/cabecalho';
import { Campo } from '../../shared/components/campo/campo';
import { Carregando } from '../../shared/components/carregando/carregando';
import { paraDataBr } from '../../shared/utils/formatacao-agenda';

type Nota = 'psr' | 'pse';
type EstadoDetalhe = 'carregando' | 'pronto' | 'ausente' | 'erro';

/** PSR e PSE gravam em chamadas separadas: uma pode falhar e a outra passar. */
interface ResultadoGravacao {
  nota: Nota;
  valor: number;
  erro: HttpErrorResponse | null;
}

interface Retorno {
  tipo: 'sucesso' | 'erro';
  texto: string;
}

const NOTAS: readonly Nota[] = ['psr', 'pse'];

/** Inteiro de 1 a 10. A API nao valida a faixa, entao a barreira e aqui. */
const VALIDADORES_NOTA = [Validators.required, Validators.pattern(/^(10|[1-9])$/)];

@Component({
  selector: 'app-detalhe-aluno',
  imports: [ReactiveFormsModule, RouterLink, Botao, Cabecalho, Campo, Carregando],
  templateUrl: './detalhe-aluno.html',
  styleUrl: './detalhe-aluno.scss'
})
export class PaginaDetalheAluno {

  private readonly professor = inject(ProfessorService);
  private readonly autenticacao = inject(AutenticacaoService);
  private readonly roteador = inject(Router);
  private readonly destruicao = inject(DestroyRef);
  private readonly injetor = inject(Injector);
  private readonly chave = lerChave(inject(ActivatedRoute));

  protected readonly notas = NOTAS;

  readonly estado = signal<EstadoDetalhe>('carregando');
  readonly item = signal<Agenda | null>(null);
  readonly mensagemErro = signal('');

  /** O que esta gravado na planilha: vem do AgendaDTO e muda a cada Salvar. */
  readonly registrado = signal<Record<Nota, number | null>>({ psr: null, pse: null });
  readonly aberto = signal<Record<Nota, boolean>>({ psr: false, pse: false });
  readonly salvando = signal(false);
  readonly retorno = signal<Retorno | null>(null);

  readonly formulario = new FormGroup({
    psr: new FormControl('', { nonNullable: true, validators: VALIDADORES_NOTA }),
    pse: new FormControl('', { nonNullable: true, validators: VALIDADORES_NOTA })
  });

  /** D1: Salvar aparece quando qualquer um dos inputs esta aberto. */
  readonly salvarVisivel = computed(() => this.aberto().psr || this.aberto().pse);

  /** Campos de texto livre, na ordem do doc. Estagio fica de fora: e horizontal. */
  readonly camposFicha = computed(() => {
    const aluno = this.item()?.aluno;

    if (!aluno) {
      return [];
    }

    return [
      { rotulo: 'Lesão', valor: aluno.lesao },
      { rotulo: 'Objetivo', valor: aluno.objetivo },
      { rotulo: 'Preferência', valor: aluno.preferencia },
      { rotulo: 'Observações', valor: aluno.observacoes }
    ];
  });

  private readonly campos = viewChildren(Campo);

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

    // Vindo da Agenda, o item sai da memoria na hora; num recarregamento, busca de novo.
    this.professor.buscarItemDaAgenda(nomeProfessor, this.chave)
      .pipe(takeUntilDestroyed(this.destruicao))
      .subscribe({
        next: item => {
          if (!item) {
            this.estado.set('ausente');
            return;
          }

          this.item.set(item);
          this.registrado.set({ psr: item.psr, pse: item.pse });
          this.estado.set('pronto');
        },
        error: (erro: HttpErrorResponse) => {
          // O jwtInterceptor ja esta levando ao login: manter o spinner evita piscar erro.
          if (erro.status === 401 || erro.status === 403) {
            return;
          }

          this.mensagemErro.set(descreverErroCarga(erro));
          this.estado.set('erro');
        }
      });
  }

  /** PSR e PSE abrem e fecham independentes. Valor ja gravado abre preenchido. */
  alternar(nota: Nota): void {
    if (this.salvando()) {
      return;
    }

    const abrir = !this.aberto()[nota];
    this.aberto.update(atual => ({ ...atual, [nota]: abrir }));
    this.retorno.set(null);

    if (abrir) {
      const valor = this.registrado()[nota];
      this.formulario.controls[nota].reset(valor === null ? '' : String(valor));
      afterNextRender(() => this.focarCampo(nota), { injector: this.injetor });
    }
  }

  /** Grava so os inputs abertos no momento do clique. */
  salvar(): void {
    const item = this.item();
    const nomeProfessor = this.autenticacao.nomeProfessor();

    if (!item || !nomeProfessor || this.salvando()) {
      return;
    }

    const abertas = NOTAS.filter(nota => this.aberto()[nota]);
    const invalidas = abertas.filter(nota => this.formulario.controls[nota].invalid);

    if (invalidas.length > 0) {
      invalidas.forEach(nota => this.formulario.controls[nota].markAsTouched());
      this.retorno.set({ tipo: 'erro', texto: 'Informe um valor de 1 a 10.' });
      return;
    }

    if (abertas.length === 0) {
      return;
    }

    this.salvando.set(true);
    this.retorno.set(null);

    forkJoin(abertas.map(nota => this.gravar(nota, item, nomeProfessor)))
      .pipe(takeUntilDestroyed(this.destruicao))
      .subscribe(resultados => {
        this.salvando.set(false);
        this.aplicarResultados(resultados);
      });
  }

  private gravar(nota: Nota, item: Agenda, nomeProfessor: string): Observable<ResultadoGravacao> {
    const valor = Number(this.formulario.controls[nota].value);
    const registro: RegistroSessao = {
      nomeProfessor,
      nomeAluno: item.nomeAluno,
      horario: item.horario,
      data: paraDataBr(this.chave.data),
      valor
    };

    const envio = nota === 'psr'
      ? this.professor.registrarPsr(registro)
      : this.professor.registrarPse(registro);

    return envio.pipe(
      map((): ResultadoGravacao => ({ nota, valor, erro: null })),
      catchError((erro: HttpErrorResponse) => of<ResultadoGravacao>({ nota, valor, erro }))
    );
  }

  /** O que gravou fecha e vira texto; o que falhou continua aberto para nova tentativa. */
  private aplicarResultados(resultados: ResultadoGravacao[]): void {
    const sucessos = resultados.filter(resultado => resultado.erro === null);
    const falhas = resultados.filter(resultado => resultado.erro !== null);

    this.registrado.update(atual => {
      const novo = { ...atual };
      sucessos.forEach(resultado => (novo[resultado.nota] = resultado.valor));
      return novo;
    });

    this.aberto.update(atual => {
      const novo = { ...atual };
      sucessos.forEach(resultado => (novo[resultado.nota] = false));
      return novo;
    });

    const textoSucesso = sucessos.length > 0
      ? `${listarNotas(sucessos)} ${sucessos.length > 1 ? 'salvos' : 'salvo'}.`
      : '';

    if (falhas.length === 0) {
      this.retorno.set({ tipo: 'sucesso', texto: textoSucesso });
      return;
    }

    // O jwtInterceptor ja esta levando ao login.
    if (falhas.some(falha => falha.erro?.status === 401 || falha.erro?.status === 403)) {
      return;
    }

    const textoFalha = `Não foi possível salvar ${listarNotas(falhas)}. ${descreverErroGravacao(falhas[0].erro!)}`;
    this.retorno.set({ tipo: 'erro', texto: `${textoSucesso} ${textoFalha}`.trim() });
  }

  private focarCampo(nota: Nota): void {
    this.campos().find(campo => campo.rotulo() === nota.toUpperCase())?.focar();
  }
}

function lerChave(rota: ActivatedRoute): ChaveAgenda {
  const parametros = rota.snapshot.paramMap;

  return {
    data: parametros.get('data') ?? '',
    horario: parametros.get('horario') ?? '',
    nomeAluno: parametros.get('nomeAluno') ?? ''
  };
}

function listarNotas(resultados: ResultadoGravacao[]): string {
  return resultados.map(resultado => resultado.nota.toUpperCase()).join(' e ');
}

function descreverErroCarga(erro: HttpErrorResponse): string {
  if (erro.status === 0) {
    return 'Não foi possível conectar ao servidor.';
  }

  if (erro.status === 503) {
    return 'Serviço temporariamente indisponível.';
  }

  return 'Não foi possível carregar o aluno.';
}

function descreverErroGravacao(erro: HttpErrorResponse): string {
  if (erro.status === 0) {
    return 'Sem conexão com o servidor.';
  }

  if (erro.status === 503) {
    return 'Serviço temporariamente indisponível.';
  }

  // A API responde 400 {"erro": "Linha não encontrada ..."} quando a aula sumiu da planilha.
  const mensagemApi = (erro.error as { erro?: string } | null)?.erro ?? '';

  if (mensagemApi.startsWith('Linha não encontrada')) {
    return 'A aula não foi encontrada na planilha.';
  }

  return 'Tente novamente.';
}
