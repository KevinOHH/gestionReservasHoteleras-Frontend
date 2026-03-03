import { DatosHabitacion } from "./DatosHabitacion.model";
import { DatosHuesped } from "./DatosHuesped.model";

export interface ReservaRequest {
    idHuesped: number,
    idHabitacion: number,
    fechaEntrada: string,
    fechaSalida: string,
    idEstadoReserva: number
}

export interface ReservaResponse {
    id: number;
    huesped: DatosHuesped;
    habitacion: DatosHabitacion;
    fechaEntrada: string;
    fechaSalida: string;
    estadoReserva: string;
    estadoRegistro: string;
}