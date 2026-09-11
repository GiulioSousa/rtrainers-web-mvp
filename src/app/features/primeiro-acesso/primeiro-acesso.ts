import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, tap } from 'rxjs';

import { AutenticacaoService } from '../../core/services/autenticacao.service';
import { RespostaErro } from '../../models/autenticacao.model';
import { Botao } from '../../shared/components/botao/botao';
import { Campo } from '../../shared/components/campo/campo';

type CampoFormulario = 'email' | 'senhaTmp' | 'novaSenha';

interface ErroTraduzido {
  texto: string;
  campos: CampoFormulario[];
}

const CAMPOS: readonly CampoFormulario[] = ['email', 'senhaTmp', 'novaSenha'];

/**
 * Mensagens de AutenticacaoService.cadastrarSenha na API, reescritas para quem
 * esta na tela e ligadas ao campo culpado. Mensagem nova ou alterada na API
 * cai no texto cru, em vez de sumir.
 */
const MENSAGENS_API: Record<string, ErroTraduzido> = {
  'Senha temporária inválida': { texto: 'Senha temporária inválida.', campos: ['senhaTmp'] },
  'Professor não encontrado': { texto: 'E-mail não cadastrado.', campos: ['email'] },
  'Professor inativo': { texto: 'Cadastro inativo. Procure a coordenação.', campos: ['email'] },
  // A flag PRIMEIRO_ACESSO ja esta FALSE: a senha foi criada antes.
  'Operação não permitida': {
    texto: 'Este primeiro acesso já foi concluído. Entre com sua senha.',
    campos: []
  }
};

@Component({
  selector: 'app-primeiro-acesso',
  imports: [ReactiveFormsModule, Botao, Campo],
  templateUrl: './primeiro-acesso.html',
  styleUrl: './primeiro-acesso.scss'
})
export class PaginaPrimeiroAcesso {

  private readonly construtorFormulario = inject(FormBuilder);
  private readonly autenticacao = inject(AutenticacaoService);
  private readonly roteador = inject(Router);
  private readonly rota = inject(ActivatedRoute);

  /**
   * O e-mail chega preenchido quando o Login redireciona pelo 403, mas segue
   * editavel: o link "Primeiro acesso" do Login traz o usuario sem ele.
   */
  readonly formulario = this.construtorFormulario.nonNullable.group({
    email: [
      this.rota.snapshot.queryParamMap.get('email') ?? '',
      [Validators.required, Validators.email]
    ],
    senhaTmp: ['', [Validators.required]],
    // Espelha o @Size(min = 8) de PrimeiroAcessoRequestDTO.
    novaSenha: ['', [Validators.required, Validators.minLength(8)]]
  });

  readonly carregando = signal(false);
  readonly mensagemErro = signal<string | null>(null);

  enviar(): void {
    if (this.carregando()) {
      return;
    }

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.carregando.set(true);
    this.mensagemErro.set(null);

    const dados = this.formulario.getRawValue();
    let senhaCriada = false;

    // /auth/primeiro-acesso nao devolve token: e o entrar() com a nova senha que abre a sessao.
    this.autenticacao.definirPrimeiraSenha(dados)
      .pipe(
        tap(() => {
          senhaCriada = true;
        }),
        switchMap(() => this.autenticacao.entrar({ email: dados.email, senha: dados.novaSenha }))
      )
      .subscribe({
        next: () => {
          this.carregando.set(false);
          this.roteador.navigate(['/agenda']);
        },
        error: (erro: HttpErrorResponse) => {
          this.carregando.set(false);

          /*
           * A senha ja foi trocada e so a entrada falhou: reenviar o formulario
           * daria "Operacao nao permitida". O caminho certo agora e o Login.
           */
          if (senhaCriada) {
            this.roteador.navigate(['/login'], { queryParams: { senhaCriada: true } });
            return;
          }

          this.tratarErro(erro);
        }
      });
  }

  private tratarErro(erro: HttpErrorResponse): void {
    const { texto, campos } = traduzirErro(erro);
    this.mensagemErro.set(texto);

    // O Angular descarta este erro sozinho na proxima digitacao, ao revalidar o campo.
    campos.forEach(campo => {
      const controle = this.formulario.controls[campo];
      controle.setErrors({ api: true });
      controle.markAsTouched();
    });
  }
}

/**
 * Nunca devolve "E-mail ou senha incorretos": esta tela nao tem esse modo de
 * falha, e o print que o exibe herdou a mensagem do Login por engano.
 */
function traduzirErro(erro: HttpErrorResponse): ErroTraduzido {
  if (erro.status === 0) {
    return { texto: 'Não foi possível conectar ao servidor.', campos: [] };
  }

  if (erro.status === 503) {
    return { texto: 'Serviço temporariamente indisponível.', campos: [] };
  }

  const corpo: RespostaErro =
    typeof erro.error === 'object' && erro.error !== null ? erro.error : {};

  // RuntimeException da API: { erro: "..." }.
  if (corpo.erro) {
    return MENSAGENS_API[corpo.erro] ?? { texto: comPonto(corpo.erro), campos: [] };
  }

  // Validacao do DTO: { campo: "..." }, podendo vir mais de um.
  const campos = CAMPOS.filter(campo => corpo[campo]);

  if (campos.length > 0) {
    return { texto: campos.map(campo => comPonto(corpo[campo]!)).join(' '), campos };
  }

  return { texto: 'Não foi possível criar a senha.', campos: [] };
}

/** As mensagens da API vem sem ponto final; as da tela terminam com ponto. */
function comPonto(texto: string): string {
  return /[.!?]$/.test(texto) ? texto : `${texto}.`;
}
