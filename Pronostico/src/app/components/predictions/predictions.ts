import { ChangeDetectorRef, Component } from '@angular/core';
import { Match, Prediction } from '../../services/prediction.service';
import { PredictionService } from '../../services/prediction.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Equipos } from '../../model/Equipos';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';


@Component({
  selector: 'app-predictions',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './predictions.html',
  styleUrls: ['./predictions.css'],
})
export class Predictions {
  teams: string[] = Equipos;
  homeTeam = '';
  awayTeam = '';
  matches: Match[] = [];
  predictions: Prediction[] = [];

  // Objeto simple (Angular detecta cambios en objetos mejor que en Map sin estrategias extra)
  matchHistory: { [key: string]: { home: any[]; away: any[] } } = {};

  loading = false;

  constructor(
    private predictionService: PredictionService,
    private cdr: ChangeDetectorRef
  ) {}

  addMatch() {
    if (this.homeTeam && this.awayTeam && this.homeTeam !== this.awayTeam) {
      this.matches.push({ home_team: this.homeTeam, away_team: this.awayTeam });
      this.homeTeam = '';
      this.awayTeam = '';
    } else {
      alert('Selecciona equipos distintos para cada partido.');
    }
  }

  fetchPredictions() {
    if (this.matches.length === 0) {
      alert('Agrega al menos un partido.');
      return;
    }

    this.loading = true;
    console.log('Enviando prediccion', this.matches);

    this.predictionService.predict(this.matches).subscribe({
      next: (res) => {
        console.log('Respuesta del servidor:', res);
        this.predictions = res.predicciones || [];

        // Si no hay predicciones no seguimos
        if (this.predictions.length === 0) {
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        // Cargar historial solo para las predicciones recibidas
        this.loadMatchHistoryForPredictions();
      },
      error: (err) => {
        console.error('Error en predicción:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadMatchHistoryForPredictions() {
    // Construimos un array de observables, cada uno devolviendo { key, home, away }
    const requests: Observable<any>[] = this.predictions.map(pred => {
      const key = `${pred.HomeTeam}-${pred.AwayTeam}`;

      return forkJoin({
        home: this.predictionService.getLastMatches(pred.HomeTeam),
        away: this.predictionService.getLastMatches(pred.AwayTeam)
      }).pipe(
        map((resp) => ({
          key,
          home: resp.home,
          away: resp.away
        }))
      );
    });

    // Ejecutamos todas las peticiones en paralelo
    forkJoin(requests).subscribe({
      next: (results) => {
        // results es un array: [{key, home, away}, ...]
        const historyObj: { [key: string]: { home: any[]; away: any[] } } = {};

        results.forEach((r: any) => {
          historyObj[r.key] = {
            home: r.home || [],
            away: r.away || []
          };
        });

        // Asignación atómica para que Angular detecte el cambio
        this.matchHistory = historyObj;

        console.log('Historial cargado:', this.matchHistory);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar historial:', err);
        // aunque falle una, intentamos mostrar lo que tengamos
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Helpers para template
  getMatchKey(prediction: Prediction): string {
    return `${prediction.HomeTeam}-${prediction.AwayTeam}`;
  }

  getHistory(prediction: Prediction) {
    return this.matchHistory[this.getMatchKey(prediction)] || { home: [], away: [] };
  }

  isWin(match: any, team: string): boolean {
    const home = match.home_team;
    const hg = Number(match.home_goals);
    const ag = Number(match.away_goals);
    return home === team ? hg > ag : ag > hg;
  }

  isDraw(match: any): boolean {
    return Number(match.home_goals) === Number(match.away_goals);
  }

  isLoss(match: any, team: string): boolean {
    const home = match.home_team;
    const hg = Number(match.home_goals);
    const ag = Number(match.away_goals);
    return home === team ? hg < ag : ag < hg;
  }

  getResult(match: any, team: string): string {
    if (this.isWin(match, team)) return 'V';
    if (this.isDraw(match)) return 'E';
    return 'D';
  }

  clearMatches() {
    this.matches = [];
    this.predictions = [];
    this.matchHistory = {};
  }
}
