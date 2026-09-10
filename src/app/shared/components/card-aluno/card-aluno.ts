import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Card aluno-colapsado da Agenda. Hierarquia da decisao D2: nome em destaque
 * na linha 1; horario e estagio na linha 2. O card inteiro e o link para o
 * Detalhe do Aluno.
 */
@Component({
  selector: 'app-card-aluno',
  imports: [RouterLink],
  templateUrl: './card-aluno.html',
  styleUrl: './card-aluno.scss',
  host: { role: 'listitem' }
})
export class CardAluno {
  readonly nome = input.required<string>();

  /** Ja formatado para exibicao, ex: "07:00". */
  readonly horario = input.required<string>();

  readonly estagio = input.required<string>();

  /** Comandos do routerLink para o Detalhe do Aluno. */
  readonly rota = input.required<readonly unknown[]>();
}
