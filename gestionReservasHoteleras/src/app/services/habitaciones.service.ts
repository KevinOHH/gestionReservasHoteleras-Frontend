import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { HabitacionRequest, HabitacionResponse } from '../models/Habitacion.models';


@Injectable({ providedIn: 'root' })
export class HabitacionService {

  private apiUrl: string = environment.apiUrl.concat('habitaciones');

  constructor(private http: HttpClient) {}

  // Obtener todas las habitaciones
  getAll(): Observable<HabitacionResponse[]> {
    return this.http.get<HabitacionResponse[]>(this.apiUrl).pipe(
      map(habitaciones => habitaciones.sort((a, b) => a.numero - b.numero)), // Ordena por número
      catchError(error => {
        console.error('Error al obtener las habitaciones: ', error);
        return of([]);
      })
    );
  }

  // Obtener habitación por ID
  getById(id: number): Observable<HabitacionResponse> {
    return this.http.get<HabitacionResponse>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Error al obtener la habitación: ', error);
        throw error;
      })
    );
  }

  // Crear una nueva habitación
  create(habitacion: HabitacionRequest): Observable<HabitacionResponse> {
    return this.http.post<HabitacionResponse>(this.apiUrl, habitacion).pipe(
      catchError(error => {
        console.error('Error al registrar la habitación: ', error);
        throw error;
      })
    );
  }

  // Actualizar una habitación existente
  update(id: number, habitacion: HabitacionRequest): Observable<HabitacionResponse> {
    return this.http.put<HabitacionResponse>(`${this.apiUrl}/${id}`, habitacion).pipe(
      catchError(error => {
        console.error('Error al actualizar la habitación: ', error);
        throw error;
      })
    );
  }

  // Eliminar una habitación
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Error al eliminar la habitación: ', error);
        throw error;
      })
    );
  }

  // Obtener habitaciones por tipo
  getByTipo(tipo: TipoHabitacion): Observable<HabitacionResponse[]> {
    return this.http.get<HabitacionResponse[]>(`${this.apiUrl}/tipo/${tipo}`).pipe(
      map(habitaciones => habitaciones.sort((a, b) => a.numero - b.numero)),
      catchError(error => {
        console.error('Error al obtener habitaciones por tipo: ', error);
        return of([]);
      })
    );
  }

  // Obtener habitaciones disponibles
  getDisponibles(): Observable<HabitacionResponse[]> {
    return this.http.get<HabitacionResponse[]>(`${this.apiUrl}/disponibles`).pipe(
      map(habitaciones => habitaciones.sort((a, b) => a.numero - b.numero)),
      catchError(error => {
        console.error('Error al obtener habitaciones disponibles: ', error);
        return of([]);
      })
    );
  }
}