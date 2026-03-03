export interface HabitacionRequest {
  numero: number;
  tipoHabitacion: 'INDIVIDUAL' | 'DOBLE' | 'SUITE';
  precio: number;
  capacidad: number;
}

export interface HabitacionResponse {
  id: number;
  numero: number;
  tipo: 'INDIVIDUAL' | 'DOBLE' | 'SUITE';
  precio: number;
  capacidad: number;
  estadoHabitacion: 'DISPONIBLE' | 'OCUPADA' | 'MANTENIMIENTO';
}

