export interface HabitacionRequest {
  numero: number;
  tipoHabitacion: 'SENCILLA' | 'DOBLE' | 'SUITE';
  precio: number;
  capacidad: number;
}

export interface HabitacionResponse {
  id: number;
  numero: number;
  tipo: 'SENCILLA' | 'DOBLE' | 'SUITE';
  precio: number;
  capacidad: number;
  estadoHabitacion: 'DISPONIBLE' | 'OCUPADA' | 'LIMPIEZA'|'MANTENIMIENTO';
  estadoRegistro: 'ACTIVO'|'ELIMINADO';
}

