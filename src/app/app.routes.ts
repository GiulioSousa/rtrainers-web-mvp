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
     * A chave inteira do aluno na agenda vai na URL: gravar PSR/PSE exige
     * data, horario e nome (o professor vem da sessao), e o Detalhe precisa
     * se reconstruir quando a pagina e recarregada. Data em ISO, sem barras.
     */
    path: 'agenda/:data/:horario/:nomeAluno',
    canActivate: [autenticacaoGuard],
    loadComponent: () =>
      import('./features/detalhe-aluno/detalhe-aluno').then(m => m.PaginaDetalheAluno)
  },
  { path: '**', redirectTo: 'login' }
];
