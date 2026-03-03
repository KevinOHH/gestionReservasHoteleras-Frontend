import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { HuespedComponent } from './components/huesped/huesped.component';
import { ReservasComponent } from './components/reservas/reservas.component';
import { CUsuarioComponent } from './components/cusuario/cusuario.component';
import { RoleGuard } from './guards/role.guard';
import { AuthGuard } from './guards/auth.guard';
import { Roles } from './constants/Roles';  
import { HabitacionComponent } from './components/habitaciones/habitaciones.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full'},
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard], children: [
    { path: 'huesped', component: HuespedComponent, canActivate: [AuthGuard] },
    { path: 'reservas', component: ReservasComponent, canActivate: [AuthGuard] },
    { path: 'habitaciones', component: HabitacionComponent, canActivate: [AuthGuard] },
    { path: 'usuarios',     component: CUsuarioComponent,   canActivate: [AuthGuard, RoleGuard], data: { role: Roles.ADMIN } },
  ]},
  { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }