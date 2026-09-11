import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';

import { PaginaPrimeiroAcesso } from './primeiro-acesso';

/*
 * O caminho 403 -> Primeiro Acesso -> Agenda so roda no navegador com um
 * professor de teste preparado na planilha. Este spec cobre o encadeamento e o
 * mapeamento de erros sem depender dela.
 */

const DADOS = { email: 'prof@teste.com', senhaTmp: 'tmp-123', novaSenha: 'nova-senha-1' };

type CampoFormulario = keyof typeof DADOS;

interface CasoErro {
  caso: string;
  status: number;
  corpo: object | null;
  texto: string;
  campo: CampoFormulario | null;
}

describe('PaginaPrimeiroAcesso', () => {
  let fixture: ComponentFixture<PaginaPrimeiroAcesso>;
  let pagina: PaginaPrimeiroAcesso;
  let http: HttpTestingController;
  let roteador: Router;

  function montar(queryParams: Record<string, string> = {}): void {
    TestBed.configureTestingModule({
      imports: [PaginaPrimeiroAcesso],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } }
        }
      ]
    });

    roteador = TestBed.inject(Router);
    vi.spyOn(roteador, 'navigate').mockResolvedValue(true);
    http = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(PaginaPrimeiroAcesso);
    pagina = fixture.componentInstance;
    fixture.detectChanges();
  }

  function enviar(dados = DADOS): void {
    pagina.formulario.setValue(dados);
    pagina.enviar();
  }

  function esperarCriacao(): TestRequest {
    return http.expectOne(requisicao => requisicao.url.endsWith('/auth/primeiro-acesso'));
  }

  function esperarLogin(): TestRequest {
    return http.expectOne(requisicao => requisicao.url.endsWith('/auth/login'));
  }

  function responder(requisicao: TestRequest, status: number, corpo: object | null): void {
    if (status === 0) {
      requisicao.error(new ProgressEvent('error'));
      return;
    }

    requisicao.flush(corpo, { status, statusText: 'Erro' });
  }

  function mensagemNaTela(): string | null {
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('.erro')?.textContent.trim() ?? null;
  }

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('preenche o e-mail que veio do Login', () => {
    montar({ email: DADOS.email });

    expect(pagina.formulario.controls.email.value).toBe(DADOS.email);
  });

  it('começa com o e-mail vazio quando chega pelo link do Login', () => {
    montar();

    expect(pagina.formulario.controls.email.value).toBe('');
  });

  it('mostra a regra dos 8 caracteres antes do envio', () => {
    montar();

    expect(fixture.nativeElement.textContent).toContain('Mínimo de 8 caracteres.');
  });

  it('não envia nova senha com menos de 8 caracteres', () => {
    montar();

    enviar({ ...DADOS, novaSenha: '1234567' });

    http.expectNone(() => true);
    expect(pagina.formulario.controls.novaSenha.touched).toBe(true);
  });

  it('cria a senha, entra com ela e segue para a Agenda', () => {
    montar();
    enviar();

    const criacao = esperarCriacao();
    expect(criacao.request.body).toEqual(DADOS);
    criacao.flush(null);

    const login = esperarLogin();
    expect(login.request.body).toEqual({ email: DADOS.email, senha: DADOS.novaSenha });
    login.flush({ token: 'token-de-teste', nomeProfessor: 'Professor Teste' });

    expect(roteador.navigate).toHaveBeenCalledWith(['/agenda']);
  });

  it('leva ao Login quando a senha foi criada mas a entrada falhou', () => {
    montar();
    enviar();

    esperarCriacao().flush(null);
    responder(esperarLogin(), 0, null);

    expect(roteador.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { senhaCriada: true } });
    expect(mensagemNaTela()).toBeNull();
  });

  describe('erros da API', () => {
    const casos: CasoErro[] = [
      {
        caso: 'sem conexão',
        status: 0,
        corpo: null,
        texto: 'Não foi possível conectar ao servidor.',
        campo: null
      },
      {
        caso: 'planilha indisponível',
        status: 503,
        corpo: { erro: 'Serviço temporariamente indisponível' },
        texto: 'Serviço temporariamente indisponível.',
        campo: null
      },
      {
        caso: 'senha temporária inválida',
        status: 400,
        corpo: { erro: 'Senha temporária inválida' },
        texto: 'Senha temporária inválida.',
        campo: 'senhaTmp'
      },
      {
        caso: 'professor não encontrado',
        status: 400,
        corpo: { erro: 'Professor não encontrado' },
        texto: 'E-mail não cadastrado.',
        campo: 'email'
      },
      {
        caso: 'professor inativo',
        status: 400,
        corpo: { erro: 'Professor inativo' },
        texto: 'Cadastro inativo. Procure a coordenação.',
        campo: 'email'
      },
      {
        caso: 'primeiro acesso já concluído',
        status: 400,
        corpo: { erro: 'Operação não permitida' },
        texto: 'Este primeiro acesso já foi concluído. Entre com sua senha.',
        campo: null
      },
      {
        caso: 'validação por campo',
        status: 400,
        corpo: { novaSenha: 'Nova senha obrigatória' },
        texto: 'Nova senha obrigatória.',
        campo: 'novaSenha'
      },
      {
        caso: 'mensagem desconhecida',
        status: 400,
        corpo: { erro: 'Aba de professores vazia' },
        texto: 'Aba de professores vazia.',
        campo: null
      },
      {
        caso: 'resposta sem corpo',
        status: 400,
        corpo: null,
        texto: 'Não foi possível criar a senha.',
        campo: null
      }
    ];

    it.each(casos)('$caso', ({ status, corpo, texto, campo }) => {
      montar();
      enviar();

      responder(esperarCriacao(), status, corpo);

      expect(mensagemNaTela()).toBe(texto);
      expect(fixture.nativeElement.textContent).not.toContain('E-mail ou senha incorretos');
      expect(roteador.navigate).not.toHaveBeenCalled();

      if (campo) {
        expect(pagina.formulario.controls[campo].hasError('api')).toBe(true);
      } else {
        expect(pagina.formulario.valid).toBe(true);
      }
    });
  });

  it('libera o campo marcado assim que o usuário o corrige', () => {
    montar();
    enviar();

    responder(esperarCriacao(), 400, { erro: 'Senha temporária inválida' });
    pagina.formulario.controls.senhaTmp.setValue('outra-tmp');

    expect(pagina.formulario.controls.senhaTmp.hasError('api')).toBe(false);
  });
});
