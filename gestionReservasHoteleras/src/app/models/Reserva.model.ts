export interface ReservaRequest {
    idHuesped: number,
    idHabitacion: number,
    fechaEntrada: string,
    fechaSalida: string,
    idEstadoReserva: number
}

export interface DatosHuesped {
    id: number
    nombre: string;
    email: string;
    telefono: string;
    documento: string;
    nacionalidad: string;
}

export interface DatosHabitacion {
    id: number
    numero: number;
    tipo: string;
    precio: number;
    capacidad: number;
}

export interface ReservaResponse {
    id: number;
    huesped: DatosHuesped;
    habitacion: DatosHabitacion;
    fechaEntrada: string;
    fechaSalida: string;
    estadoReserva: string;
}