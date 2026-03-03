import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ReservaRequest, ReservaResponse } from '../../models/Reserva.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ReservasService } from '../../services/reservas.service';
import { Roles } from '../../constants/Roles';
import Swal from 'sweetalert2';

declare var bootstrap: any;

@Component({
  selector: 'app-reservas',
  standalone: false,
  templateUrl: './reservas.component.html',
  styleUrl: './reservas.component.css'
})
export class ReservasComponent implements OnInit, AfterViewInit {
  listaReservas: ReservaResponse[] = [];

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

  constructor(private fb: FormBuilder, private reservaService: ReservasService, private authService: AuthService) {
    this.reservaForm = this.fb.group({
      id: [null],
      idHuesped: [null, [Validators.required]],
      idHabitacion: [null, [Validators.required]],
      fechaEntrada: ['', [Validators.required, Validators.pattern(/^([0-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/\d{4} ([0-1][0-9]|2[0-3]):[0-5][0-9]$/)]],
      fechaSalida: ['', [Validators.required, Validators.pattern(/^([0-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/\d{4} ([0-1][0-9]|2[0-3]):[0-5][0-9]$/)]],
      idEstadoReserva: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.listarReservas();
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

    this.reservaForm.patchValue({
      idHuesped: reserva.huesped.id,
      idHabitacion: reserva.habitacion.id,
      fechaEntrada: reserva.fechaEntrada,
      fechaSalida: reserva.fechaSalida,
      idEstadoReserva: estadoEncontrado ? estadoEncontrado.id : null
    });
    this.modalInstance.show();
  }

  onSubmit():void {
    if (this.reservaForm.invalid) return;
    
    const reservaData: ReservaRequest = this.reservaForm.value;
    
    if (this.isEditMode && this.selectedReserva){
      this.reservaService.putReserva(reservaData, this.selectedReserva.id).subscribe({
        next: (registro) => {
          this.reservaService.patchReserva(registro.id, reservaData.idEstadoReserva).subscribe({
            next: () => {
              const index: number = this.listaReservas.findIndex(
                p => p.id === this.selectedReserva!.id
              );
              if (index !== -1) this.listaReservas[index] = registro;
              Swal.fire('Actualizado', 'Reserva actualizada correctamente', 'success');
              this.listarReservas();
              this.modalInstance.hide();
            }
          });
        }
      });
    } else {
      this.reservaService.postReservas(reservaData).subscribe({
        next: registro => {
          this.listaReservas.push(registro);
          Swal.fire('Registrado', 'Reserva registrada correctamente', 'success');
          this.modalInstance.hide();
        }
      });
    }
  }

  deleteReserva(idReserva: number): void {
    Swal.fire({
      title: '¿Estas seguro?',
      text: 'La reserva será eliminada permanentemente',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.reservaService.deleteReserva(idReserva).subscribe({
          next: () => {
            this.listaReservas = this.listaReservas.filter((p) => p.id != idReserva);
            Swal.fire('Eliminada', 'Reserva eliminada correctamente', 'success');
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

  buscarReservaPorId(): void {
  const id = parseInt(this.busquedaPorId, 10);
  if (!id) {
    this.listarReservas();
    return;
  }
  
  this.reservaService.getById(id).subscribe({
    next: resp => {
      const isAdmin = this.authService.hasRole(Roles.ADMIN);
      const isEliminado = resp.estadoRegistro === 'ELIMINADO';

      if (!isAdmin && isEliminado) {
        Swal.fire('No encontrado', 'La reserva no existe o ha sido eliminada', 'info');
        this.listaReservas = [];
      } else {
        this.listaReservas = [resp];
      }
    },
    error: () => {
      Swal.fire('Error', 'No se encontró la reserva con ID ' + id, 'error');
    }
  });
}

  // Dentro de tu clase ReservasComponent
  estadosLista = [
    { id: 1, descripcion: 'CONFIRMADA' },
    { id: 2, descripcion: 'EN_CURSO' },
    { id: 3, descripcion: 'FINALIZADA' },
    { id: 4, descripcion: 'CANCELADA' }
  ];

}
