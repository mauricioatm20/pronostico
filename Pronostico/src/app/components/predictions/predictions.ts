import { ChangeDetectorRef, Component } from '@angular/core';
import { Match, Prediction } from '../../services/prediction.service';
import { PredictionService } from '../../services/prediction.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Equipos } from '../../model/Equipos';


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
  lastMatches: { home: any[]; away: any[] } = { home: [], away: [] };
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
        this.loading = false;
        this.cdr.detectChanges(); // Forzar detección de cambios
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges(); // Forzar detección de cambios
      }
    });
  }

  clearMatches() {
    this.matches = [];
    this.predictions = [];
    
  }
}
