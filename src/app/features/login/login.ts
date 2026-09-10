import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AutenticacaoService } from '../../core/services/autenticacao.service';
import { SinalPrimeiroAcesso } from '../../models/autenticacao.model';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class PaginaLogin {

  private readonly construtorFormulario = inject(FormBuilder);
  private readonly autenticacao = inject(AutenticacaoService);
  private readonly roteador = inject(Router);
  private readonly rota = inject(ActivatedRoute);

  readonly formulario = this.construtorFormulario.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required]]
  });

  readonly carregando = signal(false);
  readonly mensagemErro = signal<string | null>(null);
  readonly senhaVisivel = signal(false);

  /** Vem do jwtInterceptor quando a sessao expira em rota protegida — B9. */
  readonly sessaoExpirada = signal(
    this.rota.snapshot.queryParamMap.get('sessaoExpirada') === 'true'
  );

  alternarVisibilidadeSenha(): void {
    this.senhaVisivel.update(visivel => !visivel);
  }

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
    this.sessaoExpirada.set(false);

    this.autenticacao.entrar(this.formulario.getRawValue()).subscribe({
      next: () => {
        this.carregando.set(false);
        this.roteador.navigate(['/agenda']);
      },
      error: (erro: HttpErrorResponse) => {
        this.carregando.set(false);
        this.tratarErro(erro);
      }
    });
  }

  private tratarErro(erro: HttpErrorResponse): void {
    const corpo = erro.error as SinalPrimeiroAcesso | undefined;

    /*
     * 403 AQUI NAO E SESSAO EXPIRADA: e o sinal de primeiro acesso.
     * Por isso o jwtInterceptor ignora rotas /auth/ de proposito.
     */
    if (erro.status === 403 && corpo?.primeiroAcesso) {
      this.roteador.navigate(['/primeiro-acesso'], { queryParams: { email: corpo.email } });
      return;
    }

    if (erro.status === 0) {
      this.mensagemErro.set('Nao foi possivel conectar ao servidor.');
      return;
    }

    if (erro.status === 503) {
      this.mensagemErro.set('Servico temporariamente indisponivel.');
      return;
    }

    // A API unifica as falhas de credencial para nao permitir enumerar usuarios.
    this.mensagemErro.set('E-mail ou senha incorretos');
  }
}
