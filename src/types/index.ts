// Tipos para el sistema de gestión de motel

export interface Habitacion {
  id: number;
  numero: string;
  tipo: string;
  precio_hora: number;
  precio_noche: number;
  estado: 'Disponible' | 'Ocupada' | 'Mantenimiento' | 'Limpieza';
  descripcion?: string;
  capacidad: number;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

export interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  documento: string;
  tipo_documento: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  fecha_registro: Date;
}

export interface Reserva {
  id: number;
  habitacion_id: number;
  cliente_id: number;
  fecha_entrada: Date;
  fecha_salida?: Date;
  tipo_estadia: 'Por Hora' | 'Por Noche';
  horas_contratadas?: number;
  precio_total?: number;
  estado: 'Activa' | 'Finalizada' | 'Cancelada';
  observaciones?: string;
  fecha_creacion: Date;
  // Datos relacionados
  habitacion?: Habitacion;
  cliente?: Cliente;
}

export interface Pago {
  id: number;
  reserva_id: number;
  monto: number;
  metodo_pago: 'Efectivo' | 'Tarjeta' | 'Transferencia';
  fecha_pago: Date;
  comprobante?: string;
  observaciones?: string;
}

export interface ServicioAdicional {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  activo: boolean;
}

export interface ReservaServicio {
  id: number;
  reserva_id: number;
  servicio_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  fecha_agregado: Date;
  servicio?: ServicioAdicional;
}

// Tipos para formularios
export interface NuevaReservaForm {
  habitacion_id: number;
  cliente: {
    nombre: string;
    apellido: string;
    documento: string;
    tipo_documento: string;
    telefono?: string;
  };
  tipo_estadia: 'Por Hora' | 'Por Noche';
  horas_contratadas?: number;
  observaciones?: string;
}

export interface CheckOutForm {
  reserva_id: number;
  servicios_adicionales?: {
    servicio_id: number;
    cantidad: number;
  }[];
  metodo_pago: 'Efectivo' | 'Tarjeta' | 'Transferencia';
}

// Tipos para estadísticas
export interface EstadisticasDashboard {
  habitaciones_disponibles: number;
  habitaciones_ocupadas: number;
  reservas_activas: number;
  ingresos_hoy: number;
  ingresos_mes: number;
}

// Tipos para Usuarios y Permisos
export type RolUsuario = 'Admin' | 'Recepcionista' | 'Gerente';

export interface Usuario {
  id: number;
  username: string;
  nombre: string;
  email?: string;
  rol: RolUsuario;
  activo: boolean;
  fecha_creacion: Date;
  ultimo_acceso?: Date;
}

export interface NuevoUsuario {
  username: string;
  password: string;
  nombre: string;
  email?: string;
  rol: RolUsuario;
}

export interface ActualizarUsuario {
  nombre?: string;
  email?: string;
  rol?: RolUsuario;
  activo?: boolean;
  password?: string; // Opcional, para cambiar contraseña
}
