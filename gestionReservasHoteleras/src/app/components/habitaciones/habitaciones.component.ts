import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HabitacionService } from '../../services/habitacion.service';
import { HabitacionResponse } from '../../models/Habitacion.model';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

type Vista = 'lista' | 'formulario' | 'busqueda';

@Component({
  selector: 'app-habitacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './habitaciones.component.html',
  styleUrls: ['./habitaciones.component.css']
})
export class HabitacionesComponent implements OnInit {

  vista: Vista = 'lista';
  isEditing = false;
  habitacionId?: number;

  habitaciones: HabitacionResponse[] = [];

  busquedaId: string = '';
  busquedaResultado?: HabitacionResponse;
  busquedaError: string = '';
  buscando: boolean = false;

  tiposHabitacion = ['SENCILLA', 'DOBLE', 'SUITE'];

  estadosHabitacion = [
    { value: 'DISPONIBLE', descripcion: 'Lista para asignarse' },
    { value: 'OCUPADA', descripcion: 'Asignada a una reserva' },
    { value: 'LIMPIEZA', descripcion: 'En limpieza' },
    { value: 'MANTENIMIENTO', descripcion: 'En reparación' }
  ];

  form!: FormGroup;
  loading = false;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private habitacionService: HabitacionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.cargarLista();
  }

  buildForm(): void {
    this.form = this.fb.group({
      numero: ['', [Validators.required]],
      tipoHabitacion: ['', [Validators.required]],
      precio: ['', [Validators.required]],
      capacidad: ['', [Validators.required]],
      estadoHabitacion: ['', [Validators.required]],
      estado: ['', [Validators.required]]
    });
  }

  cargarLista(): void {
    this.loading = true;
    this.habitacionService.getAll().subscribe({
      next: (data) => {
        this.habitaciones = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar',
          text: this.resolverError(err),
          confirmButtonColor: '#2563eb'
        });
      }
    });
  }

  irALista(): void {
    this.vista = 'lista';
    this.form.reset();
    this.isEditing = false;
    this.habitacionId = undefined;
    this.limpiarBusqueda();
  }

  irANuevo(): void {
    this.form.reset();
    this.isEditing = false;
    this.habitacionId = undefined;
    this.vista = 'formulario';
  }

  irAEditar(h: HabitacionResponse): void {
    this.isEditing = true;
    this.habitacionId = h.id;
    this.form.patchValue({
      numero: h.numero,
      tipoHabitacion: h.tipoHabitacion,
      precio: h.precio,
      capacidad: h.capacidad,
      estadoHabitacion: h.estadoHabitacion,
      estado: h.estado
    });
    this.vista = 'formulario';
  }

  irABusqueda(): void {
    this.limpiarBusqueda();
    this.vista = 'busqueda';
  }

  buscarPorId(): void {
    const id = parseInt(this.busquedaId, 10);
    if (!id || id <= 0) {
      this.busquedaError = 'Ingrese un ID válido (número mayor a 0).';
      return;
    }

    this.buscando = true;
    this.busquedaError = '';
    this.busquedaResultado = undefined;

    this.habitacionService.getByHabitacionId(id).subscribe({
      next: (data) => {
        this.busquedaResultado = data;
        this.buscando = false;
      },
      error: (err) => {
        this.busquedaError = this.resolverError(err);
        this.buscando = false;
      }
    });
  }

  limpiarBusqueda(): void {
    this.busquedaId = '';
    this.busquedaResultado = undefined;
    this.busquedaError = '';
    this.buscando = false;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor complete todos los campos correctamente.',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    this.submitting = true;
    const data = this.form.value;

    const op = this.isEditing
      ? this.habitacionService.update(this.habitacionId!, data)
      : this.habitacionService.create(data);

    op.subscribe({
      next: () => {
        this.submitting = false;
        Swal.fire({
          icon: 'success',
          title: this.isEditing ? '¡Actualizada!' : '¡Registrada!',
          text: this.isEditing
            ? 'La habitación fue actualizada correctamente.'
            : 'La habitación fue registrada correctamente.',
          confirmButtonColor: '#2563eb',
          timer: 2000,
          timerProgressBar: true
        }).then(() => {
          this.cargarLista();
          this.irALista();
        });
      },
      error: (err) => {
        this.submitting = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: this.resolverError(err),
          confirmButtonColor: '#2563eb'
        });
      }
    });
  }

  eliminar(h: HabitacionResponse): void {
    Swal.fire({
      title: '¿Eliminar habitación?',
      text: `La habitación #${h.numero} será eliminada.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.habitacionService.delete(h.id).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Eliminada',
            text: 'La habitación fue eliminada correctamente.',
            confirmButtonColor: '#2563eb',
            timer: 2000,
            timerProgressBar: true
          });
          this.cargarLista();
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'No se pudo eliminar',
            text: this.resolverError(err),
            confirmButtonColor: '#2563eb'
          });
        }
      });
    });
  }

  isAdmin(): boolean {
    return this.authService.hasRole('ROLE_ADMIN');
  }

  isInvalid(campo: string): boolean {
    const c = this.form.get(campo);
    return !!(c && c.invalid && c.touched);
  }

  private resolverError(err: any): string {
    switch (err.status) {
      case 400: return 'Datos inválidos. Revise los campos.';
      case 401: return 'No autorizado. Inicie sesión nuevamente.';
      case 403: return 'No tiene permisos para esta acción.';
      case 404: return 'Habitación no encontrada.';
      case 409: return err.error?.message || 'Ya existe una habitación con ese número.';
      default:  return 'Error interno del servidor. Intente más tarde.';
    }
  }
}
