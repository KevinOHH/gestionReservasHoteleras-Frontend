import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HuespedService } from '../../services/huesped.service';
import { HuespedResponse } from '../../models/Huesped.model';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

type Vista = 'lista' | 'formulario' | 'busqueda';

@Component({
  selector: 'app-huesped',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './huesped.component.html',
  styleUrls: ['./huesped.component.css']
})
export class HuespedComponent implements OnInit {

  vista: Vista = 'lista';
  isEditing = false;
  huespedSeleccionado?: HuespedResponse;
  huespedId?: number;

  huespedes: HuespedResponse[] = [];

  busquedaId: string = '';
  busquedaResultado?: HuespedResponse;
  busquedaError: string = '';
  buscando: boolean = false;

  tiposDocumento = ['INE', 'PASAPORTE', 'LICENCIA'];

  nacionalidades = [
    { value: 'MEXICANA',       label: 'Mexicana' },
    { value: 'ARGENTINA',      label: 'Argentina' },
    { value: 'CHILENA',        label: 'Chilena' },
    { value: 'COLOMBIANA',     label: 'Colombiana' },
    { value: 'PERUANA',        label: 'Peruana' },
    { value: 'ESPAÑOLA',       label: 'Española' },
    { value: 'FRANCESA',       label: 'Francesa' },
    { value: 'ITALIANA',       label: 'Italiana' },
    { value: 'ESTADOUNIDENSE', label: 'Estadounidense' },
    { value: 'CANADIENSE',     label: 'Canadiense' },
  ];

  form!: FormGroup;
  loading = false;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private huespedService: HuespedService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.cargarLista();
  }

  buildForm(): void {
    this.form = this.fb.group({
      nombre:        ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      apellido:      ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email:         ['', [Validators.required, Validators.email]],
      telefono:      ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      tipoDocumento: ['', [Validators.required]],
      nacionalidad:  ['', [Validators.required]]
    });
  }

  cargarLista(): void {
    this.loading = true;
    this.huespedService.getAll().subscribe({
      next: (data) => {
        this.huespedes = data;
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
    this.huespedSeleccionado = undefined;
  }

  irANuevo(): void {
    this.form.reset();
    this.isEditing = false;
    this.huespedId = undefined;
    this.vista = 'formulario';
  }

  irAEditar(h: HuespedResponse): void {
    this.isEditing = true;
    this.huespedId = h.id;
    this.form.patchValue({
      nombre:        h.nombre,
      apellido:      h.apellido,
      email:         h.email,
      telefono:      h.telefono,
      tipoDocumento: h.tipoDocumento,
      nacionalidad:  h.nacionalidad
    });
    this.vista = 'formulario';
  }

  get huespedesFiltrados(): HuespedResponse[] {
  if (this.isAdmin()) {
    return this.huespedes;
  }
  return this.huespedes.filter(h => h.estadoRegistro === 'ACTIVO');
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

    this.huespedService.getByHuespedId(id).subscribe({
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
      ? this.huespedService.update(this.huespedId!, data)
      : this.huespedService.create(data);

    op.subscribe({
      next: () => {
        this.submitting = false;
        Swal.fire({
          icon: 'success',
          title: this.isEditing ? '¡Actualizado!' : '¡Registrado!',
          text: this.isEditing
            ? 'El huésped fue actualizado correctamente.'
            : 'El huésped fue registrado correctamente.',
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

  eliminar(h: HuespedResponse): void {
    Swal.fire({
      title: '¿Eliminar huésped?',
      text: `${h.nombre} ${h.apellido} será marcado como eliminado.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.huespedService.delete(h.id).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'El huésped fue eliminado correctamente.',
            confirmButtonColor: '#2563eb',
            timer: 2000,
            timerProgressBar: true
          });
          this.cargarLista();
          if (this.vista === 'busqueda' && this.busquedaResultado) {
            this.buscarPorId();
          }
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

  iniciales(h: HuespedResponse): string {
    return `${h.nombre.charAt(0)}${h.apellido.charAt(0)}`.toUpperCase();
  }

  private resolverError(err: any): string {
    switch (err.status) {
      case 400: return 'Datos inválidos. Revise los campos.';
      case 401: return 'No autorizado. Inicie sesión nuevamente.';
      case 403: return 'No tiene permisos para esta acción.';
      case 404: return 'Huésped no encontrado.';
      case 409: return err.error?.message || 'Ya existe un huésped activo con ese email, teléfono o documento.';
      default:  return 'Error interno del servidor. Intente más tarde.';
    }
  }
}