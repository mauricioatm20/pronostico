import { ChangeDetectorRef, Component } from '@angular/core';
import { Match, Prediction } from '../../services/prediction.service';
import { PredictionService } from '../../services/prediction.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Equipos } from '../../model/Equipos';
import { forkJoin } from 'rxjs';


@Component({
  selector: 'app-predictions',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './predictions.html',
  styleUrls: ['./predictions.css'],
})
export class Predictions {
  teams: string[] = Equipos; // Lista de equipos disponibles
  homeTeam: string = '';
  awayTeam: string = '';
  matches: Match[] = [];
  predictions: Prediction[] = [];
  matchHistory: Map<string, { home: any[]; away: any[] }> = new Map();
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
        this.predictions = res.predicciones;

        this.loadMatchHistory();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges(); // Forzar detección de cambios
      }
    });
  }
  loadMatchHistory() {
    // Crear array de observables para cargar historial de todos los equipos
    const requests: any[] = [];

    this.predictions.forEach((prediction) => {
      const key = `${prediction.HomeTeam}-${prediction.AwayTeam}`;

      requests.push(
        forkJoin({
          home: this.predictionService.getLastMatches(prediction.HomeTeam),
          away: this.predictionService.getLastMatches(prediction.AwayTeam),
          key: [key] // Para mantener la referencia
        })
      );
    });

    // Ejecutar todas las peticiones en paralelo
    forkJoin(requests).subscribe({
      next: (results) => {
        results.forEach((result: any) => {
          this.matchHistory.set(result.key[0], {
            home: result.home,
            away: result.away
          });
        });
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar historial:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }


  getMatchKey(prediction: Prediction): string {
    return `${prediction.HomeTeam}-${prediction.AwayTeam}`;
  }

  getHistory(prediction: Prediction) {
  const key = this.getMatchKey(prediction);
  const history = this.matchHistory.get(key);
  return history || { home: [], away: [] };
  }


isWin(match: any, team: string): boolean {
  const homeTeam = match.home_team;
  const homeGoals = match.home_goals;
  const awayGoals = match.away_goals;

  if (homeTeam === team) {
    return homeGoals > awayGoals;
  } else {
    return awayGoals > homeGoals;
  }
}

isDraw(match: any): boolean {
  return match.home_goals === match.away_goals;
}

isLoss(match: any, team: string): boolean {
  const homeTeam = match.home_team;
  const homeGoals = match.home_goals;
  const awayGoals = match.away_goals;

  if (homeTeam === team) {
    return homeGoals < awayGoals;
  } else {
    return awayGoals < homeGoals;
  }
}

getResult(match: any, team: string): string {
  if (this.isWin(match, team)) return 'V';
  if (this.isDraw(match)) return 'E';
  return 'D';
}

  clearMatches() {
    this.matches = [];
    this.predictions = [];

  }

}
