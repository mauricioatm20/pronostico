import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
export interface Match {
  home_team: string;
  away_team: string;
}
export interface Prediction {
  HomeTeam: string;
  AwayTeam: string;
  Prediccion: string;
  Prob_Victoria_local: number;
  Prob_Empate: number;
  Prob_Victoria_visitante: number;
  Goles_Esperados_Local: number;
  Goles_Esperados_Visitante: number;
  Total_Goles_Esperados: number;
}
@Injectable({
  providedIn: 'root'
})

export class PredictionService {
  private apiUrl = 'http://localhost:8000/api/predict-multiple/'; // Ajusta según tu backend
  private matchesUrl = 'http://localhost:8000/api/matches/latest';

  constructor(private http: HttpClient) {}

  predict(matches: Match[]): Observable<{ predicciones: Prediction[] }> {
    return this.http.post<{ predicciones: Prediction[] }>(this.apiUrl, { matches });
  }
   getLastMatches(team: string): Observable<any> {
    return this.http.get<any>(`${this.matchesUrl}${team}/`);
  }
}
