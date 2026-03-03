export interface HabitacionRequest{
    idHabitacion: number,
    numero: BigInteger,
    capacidad: number,
    tipoHabitacion: tipoHabitacion

}

export interface HabitacionResponse{
    idHabitacion: number,
    numero: BigInteger,
    tipoHabitacion: tipoHabitacion,
    precio: bigdecimal,
    capacidad: BigInteger,
    estadoHabitacion: estadoHabitacion,
}