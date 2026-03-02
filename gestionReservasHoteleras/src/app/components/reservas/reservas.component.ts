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
  showActions: boolean = false;
  modalText: string = 'Registrar Reserva';

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
    if (this.authService.hasRole(Roles.ADMIN)) {
      this.showActions = true;
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
      idHuesped: reserva.huesped.id, // O el ID/Documento si es un select
      idHabitacion: reserva.habitacion.id,
      //fechaEntrada: this.formatToISODate(reserva.fechaEntrada),
      //fechaSalida: this.formatToISODate(reserva.fechaSalida),
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
        this.listaReservas = resp;
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
