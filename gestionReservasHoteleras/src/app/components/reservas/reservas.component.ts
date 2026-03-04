import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ReservaRequest, ReservaResponse } from '../../models/Reserva.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ReservasService } from '../../services/reservas.service';
import { Roles } from '../../constants/Roles';
import Swal from 'sweetalert2';
import { HuespedResponse } from '../../models/Huesped.model';
import { HabitacionResponse } from '../../models/Habitacion.model';
import { HuespedService } from '../../services/huesped.service';
import { HabitacionService } from '../../services/habitaciones.service';

declare var bootstrap: any;

@Component({
  selector: 'app-reservas',
  standalone: false,
  templateUrl: './reservas.component.html',
  styleUrl: './reservas.component.css'
})
export class ReservasComponent implements OnInit, AfterViewInit {
  listaReservas: ReservaResponse[] = [];
  listaHuespedes: HuespedResponse[] = [];
  listaHabitaciones: HabitacionResponse[] = [];

  isEditMode: boolean = false;
  selectedReserva: ReservaResponse | null = null;
  showActionsAdmin: boolean = false;
  showActionsUser: boolean = false;
  modalText: string = 'Registrar Reserva';
  busquedaPorId: string = '';

  @ViewChild('reservaModalRef')
  reservaModalEl!: ElementRef;
  reservaForm: FormGroup;

  private modalInstance!: any;

  constructor(
    private fb: FormBuilder,
    private reservaService: ReservasService,
    private authService: AuthService,
    private huespedService: HuespedService,
    private habitacionService: HabitacionService
  ) {
    this.reservaForm = this.fb.group({
      id: [null],
      idHuesped: [null, [Validators.required]],
      idHabitacion: [null, [Validators.required]],
      fechaEntrada: ['', [Validators.required]],
      fechaSalida: ['', [Validators.required]],
      idEstadoReserva: [null, [Validators.required]]
    });
  }

  cargarHuespedes(): void {
    this.huespedService.getAll().subscribe({
      next: resp => this.listaHuespedes = resp.filter(hu => hu.estadoRegistro === 'ACTIVO'),
      error: err => console.error('Error al cargar huéspedes', err)
    });
  }

  cargarHabitaciones(): void {
    this.habitacionService.getAll().subscribe({
      next: resp => this.listaHabitaciones = resp.filter(ha => ha.estadoHabitacion === 'DISPONIBLE'),
      error: err => console.error('Error al cargar habitaciones', err)
    });
  }

  ngOnInit(): void {
    this.listarReservas();
    this.cargarHuespedes();
    this.cargarHabitaciones();
    if (this.authService.hasRole(Roles.USER)) {
      this.showActionsUser = true;
    }
    if (this.authService.hasRole(Roles.ADMIN)) {
      this.showActionsUser = true;
      this.showActionsAdmin = true;
    }
  }

  ngAfterViewInit(): void {
    this.modalInstance = new bootstrap.Modal(
      this.reservaModalEl.nativeElement,
      { keyboard: false },
    );
    this.reservaModalEl.nativeElement.addEventListener(
      'hidden.bs.modal',
      () => {
        this.resetForm();
      },
    );
  }

  resetForm(): void {
    this.isEditMode = false;
    this.selectedReserva = null;
    this.reservaForm.reset();
    this.cargarHabitaciones(); // 
  }

  toggleForm(): void {
    this.resetForm();
    this.modalText = 'Registrar Reserva';
    this.modalInstance.show();
  }

  editReserva(reserva: ReservaResponse): void {
    this.isEditMode = true;
    this.selectedReserva = reserva;
    this.modalText = 'Editando Reserva: ' + reserva.id;

    const estadoEncontrado = this.estadosLista.find(e => e.descripcion === reserva.estadoReserva);

    const habitacionEnLista = this.listaHabitaciones.find(h => h.id === reserva.habitacion.id);
    if (!habitacionEnLista) {
      this.listaHabitaciones = [...this.listaHabitaciones, reserva.habitacion as unknown as HabitacionResponse];
    }

    this.reservaForm.patchValue({
      idHuesped: reserva.huesped.id,
      idHabitacion: reserva.habitacion.id,
      fechaEntrada: this.formatarFechaParaInput(reserva.fechaEntrada),
      fechaSalida: this.formatarFechaParaInput(reserva.fechaSalida),
      idEstadoReserva: estadoEncontrado ? estadoEncontrado.id : null
    });
    this.modalInstance.show();
  }

  onSubmit(): void {
    if (this.reservaForm.invalid) {
      this.reservaForm.markAllAsTouched();
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor complete todos los campos correctamente.',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    const reservaData: ReservaRequest = this.reservaForm.value;
    reservaData.fechaEntrada = this.formatarFechaParaBackend(reservaData.fechaEntrada);
    reservaData.fechaSalida = this.formatarFechaParaBackend(reservaData.fechaSalida);

    if (this.isEditMode && this.selectedReserva) {
      this.reservaService.putReserva(reservaData, this.selectedReserva.id).subscribe({
        next: (registro) => {
          this.reservaService.patchReserva(registro.id, reservaData.idEstadoReserva).subscribe({
            next: () => {
              const index: number = this.listaReservas.findIndex(
                p => p.id === this.selectedReserva!.id
              );
              if (index !== -1) this.listaReservas[index] = registro;
              Swal.fire({
                icon: 'success',
                title: 'Actualizado',
                text: 'Reserva actualizada correctamente'
              });
              this.listarReservas();
              this.modalInstance.hide();
            },
            error: (err) => {
              this.manejarErrorEstado(err);
            }
          });
        },
        error: (err) => {
          this.manejarErrorEstado(err);
        }
      });
    } else {
      this.reservaService.postReservas(reservaData).subscribe({
        next: registro => {
          this.listaReservas.push(registro);
          Swal.fire({
            icon: 'success',
            title: 'Registrado',
            text: 'Reserva registrada correctamente'
          });
          this.modalInstance.hide();
        },
        error: (err) => {
          this.manejarErrorEstado(err);
        }
      });
    }
  }

  deleteReserva(idReserva: number): void {

    const reserva = this.listaReservas.find(r => r.id === idReserva);

    if (reserva && (reserva.estadoReserva === 'EN_CURSO' || reserva.estadoReserva === 'CONFIRMADA')) {
      Swal.fire({
        icon: 'error',
        title: 'Acción no permitida',
        html: `No se puede eliminar una reserva con estado <strong>${reserva.estadoReserva}`,
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: 'La reserva será eliminada permanentemente',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then(result => {
      if (result.isConfirmed) {
        this.reservaService.deleteReserva(idReserva).subscribe({
          next: () => {
            this.listaReservas = this.listaReservas.filter((p) => p.id !== idReserva);
            Swal.fire({
              icon: 'success',
              title: 'Eliminada',
              text: 'Reserva eliminada correctamente'
            });
          },
          error: (err) => {
            if (err.status === 403) {
              Swal.fire({
                icon: 'error',
                title: 'Acción no permitida',
                text: 'No se puede eliminar una reserva que está CONFIRMADA o EN CURSO.',
                confirmButtonColor: '#dc3545'
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Ocurrió un error al intentar eliminar la reserva.',
                confirmButtonColor: '#dc3545'
              });
            }
          }
        });
      }
    });
  }

  listarReservas(): void {
    this.reservaService.getReservas().subscribe({
      next: resp => {
        if (this.authService.hasRole(Roles.ADMIN)) {
          this.listaReservas = resp;
        } else {
          this.listaReservas = resp.filter(reserva => reserva.estadoRegistro !== 'ELIMINADO');
        }
      }
    });
  }

  private manejarErrorEstado(err: any): void {
    if (err.status === 409) {

      const mensajeBackend = err.error?.message || err.error?.mensaje || err.error || null;

      const transicionesProhibidas: { [key: string]: string } = {
        'CONFIRMADA_FINALIZADA': 'Una reserva <strong>CONFIRMADA</strong> no puede pasar directamente a <strong>FINALIZADA</strong>. Primero debe estar <strong>EN CURSO</strong>.',
        'FINALIZADA_CANCELADA': 'Una reserva <strong>FINALIZADA</strong> no puede cambiarse a <strong>CANCELADA</strong>.',
        'FINALIZADA_CONFIRMADA': 'Una reserva <strong>FINALIZADA</strong> no puede regresar a <strong>CONFIRMADA</strong>.',
        'FINALIZADA_EN_CURSO': 'Una reserva <strong>FINALIZADA</strong> no puede regresar a <strong>EN CURSO</strong>.',
        'CANCELADA_CONFIRMADA': 'Una reserva <strong>CANCELADA</strong> no puede regresar a <strong>CONFIRMADA</strong>.',
        'CANCELADA_EN_CURSO': 'Una reserva <strong>CANCELADA</strong> no puede regresar a <strong>EN CURSO</strong>.',
      };

      let mensajeMostrar = 'La transición de estado solicitada no está permitida según las reglas de negocio.';

      if (mensajeBackend) {
        const mensajeUpper = String(mensajeBackend).toUpperCase();
        const claveEncontrada = Object.keys(transicionesProhibidas).find(clave =>
          mensajeUpper.includes(clave.replace('_', ' ')) ||
          mensajeUpper.includes(clave)
        );
        if (claveEncontrada) {
          mensajeMostrar = transicionesProhibidas[claveEncontrada];
        } else {
          mensajeMostrar = mensajeBackend;
        }
      }

      Swal.fire({
        icon: 'warning',
        title: 'Transición de estado no permitida',
        html: mensajeMostrar,
        confirmButtonColor: '#f59e0b',
        confirmButtonText: 'Entendido'
      });

    } else if (err.status === 403) {
      Swal.fire({
        icon: 'error',
        title: 'Acción no permitida',
        text: 'No tienes permiso para realizar esta acción.',
        confirmButtonColor: '#dc3545'
      });

    } else if (err.status === 400) {
      Swal.fire({
        icon: 'warning',
        title: 'Datos inválidos',
        text: err.error?.message || 'Revisa los datos ingresados e intenta nuevamente.',
        confirmButtonColor: '#f59e0b'
      });

    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error inesperado',
        text: 'Ocurrió un error al procesar la solicitud. Intenta nuevamente.',
        confirmButtonColor: '#dc3545'
      });
    }
  }

  private formatarFechaParaBackend(fechaIso: string): string {
    if (!fechaIso) return '';
    const d = new Date(fechaIso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  private formatarFechaParaInput(fechaBackend: string): string {
    if (!fechaBackend) return '';
    const [fecha, hora] = fechaBackend.split(' ');
    const [dia, mes, anio] = fecha.split('/');
    return `${anio}-${mes}-${dia}T${hora}`;
  }

  estadosLista = [
    { id: 1, descripcion: 'CONFIRMADA' },
    { id: 2, descripcion: 'EN_CURSO' },
    { id: 3, descripcion: 'FINALIZADA' },
    { id: 4, descripcion: 'CANCELADA' }
  ];
}