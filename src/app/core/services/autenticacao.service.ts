import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CredenciaisLogin, DadosPrimeiroAcesso, RespostaLogin } from '../../models/autenticacao.model';

const CHAVE_TOKEN = 'rtrainers.token';
const CHAVE_PROFESSOR = 'rtrainers.professor';

@Injectable({ providedIn: 'root' })
export class AutenticacaoService {

  private readonly http = inject(HttpClient);
  private readonly urlBase = environment.urlApi;

  /** Nome exibido no cabecalho e usado na rota da agenda. */
  readonly nomeProfessor = signal<string | null>(localStorage.getItem(CHAVE_PROFESSOR));

  /**
   * Sucesso devolve token e nome. O 403 com { primeiroAcesso: true } NAO e
   * tratado aqui: chega como erro e cabe a tela de Login redirecionar.
   */
  entrar(credenciais: CredenciaisLogin): Observable<RespostaLogin> {
    return this.http
      .post<RespostaLogin>(`${this.urlBase}/auth/login`, credenciais)
      .pipe(tap(resposta => this.guardarSessao(resposta)));
  }

  /** Nao autentica: apos o sucesso a tela precisa chamar entrar(). */
  definirPrimeiraSenha(dados: DadosPrimeiroAcesso): Observable<void> {
    return this.http.post<void>(`${this.urlBase}/auth/primeiro-acesso`, dados);
  }

  obterToken(): string | null {
    return localStorage.getItem(CHAVE_TOKEN);
  }

  estaAutenticado(): boolean {
    return this.obterToken() !== null;
  }

  encerrarSessao(): void {
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_PROFESSOR);
    this.nomeProfessor.set(null);
  }

  private guardarSessao(resposta: RespostaLogin): void {
    localStorage.setItem(CHAVE_TOKEN, resposta.token);
    localStorage.setItem(CHAVE_PROFESSOR, resposta.nomeProfessor);
    this.nomeProfessor.set(resposta.nomeProfessor);
  }
}
