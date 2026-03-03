import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CUsuarioService } from '../../services/cusuario.service';
import { CUsuarioResponse } from '../../models/CUsuario.model';
import Swal from 'sweetalert2';

type Vista = 'lista' | 'formulario';

@Component({
  selector: 'app-cusuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cusuario.component.html',
  styleUrls: ['./cusuario.component.css']
})
export class CUsuarioComponent implements OnInit {

  vista: Vista = 'lista';
  isEditing = false;
  usuarioId?: number;

  usuarios: CUsuarioResponse[] = [];
  form!: FormGroup;
  loading = false;
  submitting = false;

  roles = [
    { value: 'ROLE_ADMIN', label: 'Administrador' },
    { value: 'ROLE_USER',  label: 'Usuario' }
  ];

  constructor(
    private fb: FormBuilder,
    private cUsuarioService: CUsuarioService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.cargarLista();
  }

  buildForm(): void {
    this.form = this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(20)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-zA-Z])(?=.*\d).+$/)
      ]],
      rol: ['', Validators.required]
    });
  }

  cargarLista(): void {
    this.loading = true;
    this.cUsuarioService.getAll().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        Swal.fire({ icon: 'error', title: 'Error al cargar', text: this.resolverError(err), confirmButtonColor: '#2563eb' });
      }
    });
  }

  irALista(): void {
    this.vista = 'lista';
    this.form.reset();
    this.isEditing = false;
    this.usuarioId = undefined;
  }

  irANuevo(): void {
    this.form.reset();
    this.isEditing = false;
    this.usuarioId = undefined;
    this.vista = 'formulario';
  }

  irAEditar(u: CUsuarioResponse): void {
    if (u.estadoRegistro === 'ELIMINADO') {
      Swal.fire({
        icon: 'warning',
        title: 'Accion no permitida',
        text: 'No es posible interactuar con un usuario eliminado',
        confirmButtonColor: '#2563eb'
      });
      return;
    }
    this.isEditing = true;
    this.usuarioId = u.id;
    this.form.patchValue({
      username: u.username,
      password: '',
      rol: u.roles[0] ?? ''
    });

    this.form.get('password')?.clearValidators();
    this.form.get('password')?.setValidators([
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-zA-Z])(?=.*\d).+$/)
    ]);
    this.form.get('password')?.updateValueAndValidity();
    this.vista = 'formulario';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      Swal.fire({ icon: 'warning', title: 'Formulario incompleto', text: 'Complete todos los campos correctamente.', confirmButtonColor: '#2563eb' });
      return;
    }

    this.submitting = true;
    const { username, password, rol } = this.form.value;
    const payload = { username, password, roles: [rol] };

    const op = this.isEditing
      ? this.cUsuarioService.update(this.usuarioId!, payload)
      : this.cUsuarioService.create(payload);

    op.subscribe({
      next: () => {
        this.submitting = false;
        Swal.fire({
          icon: 'success',
          title: this.isEditing ? '¡Actualizado!' : '¡Creado!',
          text: this.isEditing ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.',
          confirmButtonColor: '#2563eb',
          timer: 2000,
          timerProgressBar: true
        }).then(() => { this.cargarLista(); this.irALista(); });
      },
      error: (err) => {
        this.submitting = false;
        Swal.fire({ icon: 'error', title: 'Error', text: this.resolverError(err), confirmButtonColor: '#2563eb' });
      }
    });
  }

  eliminar(u: CUsuarioResponse): void {
    if (u.estadoRegistro === 'ELIMINADO') {
      Swal.fire({
        icon: 'warning',
        title: 'Accion no permitida',
        text: 'No es posible interactuar con un usuario eliminado',
        confirmButtonColor: '#2563eb'
      });
      return;
    }
    Swal.fire({
      title: '¿Eliminar usuario?',
      text: `"${u.username}" será marcado como eliminado.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.cUsuarioService.delete(u.id).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Eliminado', text: 'Usuario eliminado correctamente.', confirmButtonColor: '#2563eb', timer: 2000, timerProgressBar: true });
          this.cargarLista();
        },
        error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: this.resolverError(err), confirmButtonColor: '#2563eb' })
      });
    });
  }

  isInvalid(campo: string): boolean {
    const c = this.form.get(campo);
    return !!(c && c.invalid && c.touched);
  }

  rolLabel(roles: string[]): string {
    if (!roles || roles.length === 0) return '-';
    return roles[0] === 'ROLE_ADMIN' ? 'Administrador' : 'Usuario';
  }

  private resolverError(err: any): string {
    switch (err.status) {
      case 400: return 'Datos inválidos. Revise los campos.';
      case 401: return 'No autorizado. Inicie sesión nuevamente.';
      case 403: return 'No tiene permisos para esta acción.';
      case 404: return 'Usuario no encontrado.';
      case 409: return err.error?.message || 'Ya existe un usuario activo con ese username.';
      default:  return 'Error interno del servidor.';
    }
  }
}