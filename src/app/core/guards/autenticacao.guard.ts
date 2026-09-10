import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AutenticacaoService } from '../services/autenticacao.service';

export const autenticacaoGuard: CanActivateFn = () => {
  const autenticacao = inject(AutenticacaoService);
  const roteador = inject(Router);

  return autenticacao.estaAutenticado() ? true : roteador.createUrlTree(['/login']);
};
