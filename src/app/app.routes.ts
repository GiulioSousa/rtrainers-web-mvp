import { Routes } from '@angular/router';

import { autenticacaoGuard } from './core/guards/autenticacao.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then(m => m.PaginaLogin)
  },
  {
    path: 'primeiro-acesso',
    loadComponent: () =>
      import('./features/primeiro-acesso/primeiro-acesso').then(m => m.PaginaPrimeiroAcesso)
  },
  {
    path: 'agenda',
    canActivate: [autenticacaoGuard],
    loadComponent: () => import('./features/agenda/agenda').then(m => m.PaginaAgenda)
  },
  {
    /*
     * Provisorio: gravar PSR/PSE exige nomeAluno, horario, data e
     * nomeProfessor — o nome sozinho nao basta. Como passar o resto e decisao
     * da tela de Detalhe.
     */
    path: 'aluno/:nomeAluno',
    canActivate: [autenticacaoGuard],
    loadComponent: () =>
      import('./features/detalhe-aluno/detalhe-aluno').then(m => m.PaginaDetalheAluno)
  },
  { path: '**', redirectTo: 'login' }
];
