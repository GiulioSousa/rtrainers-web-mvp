import { Component, inject } from '@angular/core';

import { AutenticacaoService } from '../../../core/services/autenticacao.service';

/**
 * Cabecalho do App Professor, variante `professor`: marca a esquerda, nome do
 * professor a direita. O nome vem da sessao, e nao de input, porque e o mesmo
 * em todas as telas. A variante com seta de voltar entra com o Detalhe do Aluno.
 */
@Component({
  selector: 'app-cabecalho',
  templateUrl: './cabecalho.html',
  styleUrl: './cabecalho.scss'
})
export class Cabecalho {
  protected readonly nomeProfessor = inject(AutenticacaoService).nomeProfessor;
}
