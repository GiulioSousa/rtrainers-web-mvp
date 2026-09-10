import { Component, input } from '@angular/core';

/**
 * Container agrupador da Agenda: titulo do turno e os cards de aluno,
 * projetados via ng-content. Cada card projetado deve ter role="listitem".
 */
@Component({
  selector: 'app-card-turno',
  templateUrl: './card-turno.html',
  styleUrl: './card-turno.scss'
})
export class CardTurno {
  /** Formato "dd/MM - Manhã" ou "dd/MM - Tarde/Noite". */
  readonly titulo = input.required<string>();
}
