import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { HabitacionRequest, HabitacionResponse } from '../models/Habitacion.model';

@Injectable({ providedIn: 'root' })
export class HabitacionService {

  private apiUrl: string = environment.apiUrl.concat('habitaciones');

  constructor(private http: HttpClient) {}

  getAll(): Observable<HabitacionResponse[]> {
    return this.http.get<HabitacionResponse[]>(this.apiUrl).pipe(
      map(habitaciones => habitaciones.sort()),
      catchError(error => {
        console.error('Error al obtener las habitaciones: ', error);
        return of([]);
      })
    );
  }

  getById(id: number): Observable<HabitacionResponse> {
    return this.http.get<HabitacionResponse>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Error al obtener la habitación: ', error);
        throw error;
      })
    );
  }
  

  getByHabitacionId(id: number): Observable<HabitacionResponse> {
    return this.http.get<HabitacionResponse>(`${this.apiUrl}/id-habitacion/${id}`).pipe(
      catchError(error => {
        console.error('Error al obtener la habitación por id-habitacion: ', error);
        throw error;
      })
    );
  }

  create(habitacion: HabitacionRequest): Observable<HabitacionResponse> {
    return this.http.post<HabitacionResponse>(this.apiUrl, habitacion).pipe(
      catchError(error => {
        console.error('Error al registrar la habitación: ', error);
        throw error;
      })
    );
  }

  update(id: number, habitacion: HabitacionRequest): Observable<HabitacionResponse> {
    return this.http.put<HabitacionResponse>(`${this.apiUrl}/${id}`, habitacion).pipe(
      catchError(error => {
        console.error('Error al actualizar la habitación: ', error);
        throw error;
      })
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Error al eliminar la habitación: ', error);
        throw error;
      })
    );
  }
}