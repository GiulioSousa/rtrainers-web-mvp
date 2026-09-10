import { Component, input } from '@angular/core';

/**
 * Loader de tela cheia (48px, laranja). Ocupa o espaco livre do pai — que
 * precisa ser flex em coluna — e centraliza o spinner nele. O spinner inline
 * de 20px vive dentro do Botao.
 */
@Component({
  selector: 'app-carregando',
  templateUrl: './carregando.html',
  styleUrl: './carregando.scss'
})
export class Carregando {
  /** Anunciado ao leitor de tela: o spinner em si nao tem texto. */
  readonly rotulo = input('Carregando');
}
