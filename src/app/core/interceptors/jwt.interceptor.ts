import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AutenticacaoService } from '../services/autenticacao.service';

export const jwtInterceptor: HttpInterceptorFn = (requisicao, proximo) => {
  const autenticacao = inject(AutenticacaoService);
  const roteador = inject(Router);

  const ehRotaPublica = requisicao.url.includes('/auth/');
  const token = autenticacao.obterToken();

  const requisicaoFinal = !ehRotaPublica && token
    ? requisicao.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : requisicao;

  return proximo(requisicaoFinal).pipe(
    catchError((erro: HttpErrorResponse) => {
      /*
       * 401 e 403 em rota protegida significam sessao ausente ou expirada.
       * Trata os dois porque o status real ainda nao foi confirmado no Postman
       * (B9): o SegurancaConfig nao declara exceptionHandling.
       * Rotas /auth/ ficam de fora de proposito — la o 403 tem outro
       * significado: e o sinal de primeiro acesso.
       */
      if (!ehRotaPublica && (erro.status === 401 || erro.status === 403)) {
        autenticacao.encerrarSessao();
        roteador.navigate(['/login'], { queryParams: { sessaoExpirada: true } });
      }
      return throwError(() => erro);
    })
  );
};
