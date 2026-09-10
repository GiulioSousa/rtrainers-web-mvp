import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Agenda } from '../../models/agenda.model';
import { RegistroSessao } from '../../models/sessao.model';

@Injectable({ providedIn: 'root' })
export class ProfessorService {

  private readonly http = inject(HttpClient);
  private readonly urlBase = environment.urlApi;

  /**
   * A API devolve a janela de 7 dias a partir de hoje (B4), sem agrupar.
   * Agrupar por data e turno e responsabilidade da tela.
   * O nome vai codificado: professores tem espaco e acento no nome.
   */
  buscarAgenda(nomeProfessor: string): Observable<Agenda[]> {
    const caminho = `${this.urlBase}/professor/agenda/${encodeURIComponent(nomeProfessor)}`;
    return this.http.get<Agenda[]>(caminho);
  }

  registrarPsr(registro: RegistroSessao): Observable<void> {
    return this.http.post<void>(`${this.urlBase}/professor/sessao/psr`, null, {
      params: this.montarParametros(registro, 'psr')
    });
  }

  registrarPse(registro: RegistroSessao): Observable<void> {
    return this.http.post<void>(`${this.urlBase}/professor/sessao/pse`, null, {
      params: this.montarParametros(registro, 'pse')
    });
  }

  /** A API recebe por query string (RequestParam), nao em corpo JSON — B6. */
  private montarParametros(registro: RegistroSessao, nomeNota: 'psr' | 'pse'): HttpParams {
    return new HttpParams()
      .set('nomeProfessor', registro.nomeProfessor)
      .set('horario', registro.horario)
      .set('nomeAluno', registro.nomeAluno)
      .set('data', registro.data)
      .set(nomeNota, registro.valor);
  }
}
