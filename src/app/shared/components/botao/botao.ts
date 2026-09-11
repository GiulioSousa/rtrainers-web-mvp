import { Component, booleanAttribute, input } from '@angular/core';

@Component({
  selector: 'app-botao',
  templateUrl: './botao.html',
  styleUrl: './botao.scss',
  host: {
    '[class.botao--desabilitado]': 'desabilitado()',
    '[class.botao--ativo]': 'ativo()'
  }
})
export class Botao {

  /** Apenas md (48px, App Professor) e xl (64px, Totem) — decisao D4. */
  readonly tamanho = input<'md' | 'xl'>('md');

  readonly tipo = input<'button' | 'submit'>('button');

  /**
   * Carregando NAO e desabilitado: o design system manda manter fill e sombra
   * do default. O botao so deixa de aceitar clique.
   */
  readonly carregando = input(false, { transform: booleanAttribute });

  readonly desabilitado = input(false, { transform: booleanAttribute });

  /** Anunciado a leitores de tela enquanto o spinner ocupa o lugar do texto. */
  readonly textoCarregando = input('Carregando');

  /**
   * Botao de alternancia (PSR e PSE no Detalhe): true/false vira aria-pressed
   * e o estado active persistente. null, o padrao, e um botao comum.
   */
  readonly ativo = input<boolean | null>(null);
}
