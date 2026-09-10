/** Corpo de POST /auth/login. */
export interface CredenciaisLogin {
  email: string;
  senha: string;
}

/** Resposta 200 de POST /auth/login. */
export interface RespostaLogin {
  token: string;
  nomeProfessor: string;
}

/**
 * Corpo do 403 devolvido por POST /auth/login quando PRIMEIRO_ACESSO=TRUE.
 * Nao e erro: e o sinal para redirecionar ao fluxo de primeiro acesso.
 */
export interface SinalPrimeiroAcesso {
  primeiroAcesso: boolean;
  email: string;
}

/**
 * Corpo de POST /auth/primeiro-acesso.
 * O campo e senhaTmp, nao senhaTemporaria — a documentacao estava errada e foi
 * corrigida; enviar o nome errado resulta em 400 de validacao.
 * novaSenha tem minimo de 8 caracteres validado na API.
 */
export interface DadosPrimeiroAcesso {
  email: string;
  senhaTmp: string;
  novaSenha: string;
}

/**
 * Erros da API, padronizados por TratadorDeExcecoes:
 * - RuntimeException e IOException -> { erro: "mensagem" }
 * - falha de validacao             -> { campo: "mensagem", ... }
 */
export interface RespostaErro {
  erro?: string;
  [campo: string]: string | undefined;
}
