import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AutenticacaoService } from '../../../core/services/autenticacao.service';

/**
 * Cabecalho do App Professor: marca a esquerda, nome do professor a direita.
 * Com rotaVoltar vira a variante `professor--voltar`, com a seta antes da marca.
 * O nome vem da sessao, e nao de input, porque e o mesmo em todas as telas.
 */
@Component({
  selector: 'app-cabecalho',
  imports: [RouterLink],
  templateUrl: './cabecalho.html',
  styleUrl: './cabecalho.scss'
})
export class Cabecalho {
  readonly rotaVoltar = input<string | null>(null);

  protected readonly nomeProfessor = inject(AutenticacaoService).nomeProfessor;
}
