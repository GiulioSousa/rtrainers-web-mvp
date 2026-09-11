import { Component, ElementRef, computed, forwardRef, input, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let proximoId = 0;

/**
 * Campo de formulario do design system (Input). E um ControlValueAccessor:
 * usa-se direto com formControlName, e o Angular aplica ng-touched e
 * ng-invalid no proprio host — e dai que sai o estado de erro no SCSS.
 *
 * Chama-se Campo, e nao Input, para nao colidir com o decorador @Input do
 * Angular e para seguir a nomenclatura em portugues do projeto.
 */
@Component({
  selector: 'app-campo',
  templateUrl: './campo.html',
  styleUrl: './campo.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Campo), multi: true }
  ]
})
export class Campo implements ControlValueAccessor {

  readonly rotulo = input.required<string>();

  /**
   * 'senha' ganha o botao de alternar visibilidade. 'numerico' (PSR e PSE)
   * nao mostra rotulo — ele vira so o nome acessivel —, centraliza o valor e
   * abre o teclado numerico.
   */
  readonly tipo = input<'texto' | 'email' | 'senha' | 'numerico'>('texto');

  readonly autocomplete = input<string>();

  /** Repassado como inputmode: ajusta o teclado virtual no celular. */
  readonly modoTeclado = input<string>();

  /**
   * Texto de apoio sob a caixa, para regra que o usuario precisa saber antes
   * de errar (ex.: tamanho minimo da senha — D9). Fica vermelho no erro.
   */
  readonly apoio = input<string>();

  protected readonly id = `campo-${++proximoId}`;
  protected readonly idApoio = `${this.id}-apoio`;
  protected readonly valor = signal('');
  protected readonly desabilitado = signal(false);
  protected readonly senhaVisivel = signal(false);

  protected readonly preenchido = computed(() => this.valor() !== '');
  protected readonly numerico = computed(() => this.tipo() === 'numerico');

  protected readonly modoTecladoEfetivo = computed(
    () => this.modoTeclado() ?? (this.numerico() ? 'numeric' : null)
  );

  protected readonly tipoNativo = computed(() => {
    switch (this.tipo()) {
      case 'email':
        return 'email';
      case 'senha':
        return this.senhaVisivel() ? 'text' : 'password';
      default:
        return 'text';
    }
  });

  private readonly entrada = viewChild.required<ElementRef<HTMLInputElement>>('entrada');

  private aoMudar: (valor: string) => void = () => {};
  private aoTocar: () => void = () => {};

  /** Para campos abertos sob demanda: PSR e PSE recebem o foco ao abrir. */
  focar(): void {
    this.entrada().nativeElement.focus();
  }

  writeValue(valor: string | null): void {
    this.valor.set(valor ?? '');
  }

  registerOnChange(funcao: (valor: string) => void): void {
    this.aoMudar = funcao;
  }

  registerOnTouched(funcao: () => void): void {
    this.aoTocar = funcao;
  }

  setDisabledState(desabilitado: boolean): void {
    this.desabilitado.set(desabilitado);
  }

  protected aoDigitar(evento: Event): void {
    const valor = (evento.target as HTMLInputElement).value;
    this.valor.set(valor);
    this.aoMudar(valor);
  }

  /** Marca o controle como tocado ao sair do campo, como o input nativo faria. */
  protected aoSair(): void {
    this.aoTocar();
  }

  protected alternarVisibilidadeSenha(): void {
    this.senhaVisivel.update(visivel => !visivel);
  }
}
