/**
 * PRODUCAO. Atencao a inversao: o fileReplacements do angular.json esta na
 * configuracao "development", entao ESTE arquivo e o de producao e e
 * substituido por environment.development.ts durante o build de dev.
 */
export const environment = {
  producao: true,
  /*
   * Vazio = mesma origem, caminho relativo. O Nginx e proxy reverso e serve o
   * build Angular junto da API. O dominio da API em producao nunca foi
   * definido na especificacao — confirmar na Etapa 15.
   */
  urlApi: ''
};
