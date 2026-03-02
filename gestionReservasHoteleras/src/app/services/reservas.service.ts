import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { ReservaRequest, ReservaResponse } from '../models/Reserva.model';

@Injectable({
  providedIn: 'root'
})
export class ReservasService {

  private apiUrl: string = environment.apiUrl.concat('reservas');

  constructor(private http: HttpClient) { }

  getReservas(): Observable<ReservaResponse[]> {
    return this.http.get<ReservaResponse[]>(this.apiUrl).pipe(
      map(reservas => reservas.sort()),
      catchError(error => {
        console.error('Error al obtener las reservas: ', error);
        return of([]);
      })
    );
  }

  postReservas(reserva: ReservaRequest): Observable<ReservaResponse>{
    return this.http.post<ReservaResponse>(this.apiUrl, reserva).pipe(
      catchError(error => {
        console.error('Error al registrar la reservación', error);
        throw error;
      })
    );
  }

  putReserva(reserva: ReservaRequest, reservaId: number): Observable<ReservaResponse> {
    return this.http.put<ReservaResponse>(`${this.apiUrl}/${reservaId}`, reserva).pipe(
      catchError(error => {
        console.error('Error al actualizar la reservación', error);
        throw error;
      })
    );
  }

  patchReserva(reservaId: number, idEstadoReserva: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${reservaId}/estado/${idEstadoReserva}`, {})
  }

  deleteReserva(reservaId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${reservaId}`).pipe(
      catchError(error => {
        console.error('Error al eliminar la reservación', error);
        throw error;
      })
    );
  }
}