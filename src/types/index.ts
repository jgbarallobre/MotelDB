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
  activa?: boolean;
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
  // Campos del JOIN
  habitacion_numero?: string;
  habitacion_tipo?: string;
  cliente_nombre?: string;
  cliente_apellido?: string;
  cliente_documento?: string;
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

// Tipos para Jornadas
export interface Jornada {
  id: number;
  nombre: string;
  descripcion?: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_horas: number;
  activo: boolean;
  es_noche: boolean;
  color: string;
  fecha_creacion: Date;
}

export interface NuevaJornada {
  nombre: string;
  descripcion?: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_horas: number;
  activo?: boolean;
  es_noche?: boolean;
  color?: string;
}

export interface ActualizarJornada {
  nombre?: string;
  descripcion?: string;
  hora_inicio?: string;
  hora_fin?: string;
  duracion_horas?: number;
  activo?: boolean;
  es_noche?: boolean;
  color?: string;
}

// Tipos para Configuración del Motel
export interface ConfiguracionMotel {
  id: number;
  nombre_motel: string;
  direccion: string;
  telefono: string;
  email: string;
  nit: string;
  hora_checkin: string;
  hora_checkout: string;
  moneda: string;
  simbolo_moneda: string;
  tasa_impuesto: number;
  mensaje_recibo: string;
  logo_url: string;
  color_principal: string;
  color_secundario: string;
  fecha_actualizacion: Date;
}

export interface ActualizarConfiguracion {
  nombre_motel?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  nit?: string;
  hora_checkin?: string;
  hora_checkout?: string;
  moneda?: string;
  simbolo_moneda?: string;
  tasa_impuesto?: number;
  mensaje_recibo?: string;
  logo_url?: string;
  color_principal?: string;
  color_secundario?: string;
}

// Tipos para Departamentos
export interface Departamento {
  id: number;
  codigo: string;
  descripcion: string;
  activo: boolean;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

export interface NuevoDepartamento {
  codigo: string;
  descripcion: string;
}

export interface ActualizarDepartamento {
  codigo?: string;
  descripcion?: string;
  activo?: boolean;
}

// Tipos para Tipos de IVA
export interface TipoIva {
  id: number;
  codigo: string;
  descripcion: string;
  valor: number;
  activo: boolean;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

export interface NuevoTipoIva {
  codigo: string;
  descripcion: string;
  valor: number;
}

export interface ActualizarTipoIva {
  codigo?: string;
  descripcion?: string;
  valor?: number;
  activo?: boolean;
}
