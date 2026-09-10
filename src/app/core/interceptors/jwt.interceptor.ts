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
       * Sessao ausente ou expirada em rota protegida.
       * A API devolve 403 — confirmado contra a API em execucao (B9). O 401
       * segue tratado de proposito: se um dia o SegurancaConfig declarar um
       * entry point de 401, este interceptor continua correto sem mudanca.
       * Rotas /auth/ ficam de fora de proposito — la o 403 tem outro
       * significado: e o sinal de primeiro acesso.
       * Depende do CORS na cadeia do Spring Security (B11): sem ele o 403
       * chegava aqui como status 0 e nenhum redirecionamento acontecia.
       */
      if (!ehRotaPublica && (erro.status === 401 || erro.status === 403)) {
        autenticacao.encerrarSessao();
        roteador.navigate(['/login'], { queryParams: { sessaoExpirada: true } });
      }
      return throwError(() => erro);
    })
  );
};
