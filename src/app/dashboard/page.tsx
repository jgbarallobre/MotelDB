'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Habitacion } from '@/types';

interface User {
  id: number;
  username: string;
  nombre: string;
  rol: string;
}

interface MenuItem {
  label: string;
  icon: string;
  path: string;
  color: string;
}

interface MenuSectionProps {
  title: string;
  items: MenuItem[];
  icon: string;
  onLobbyClick?: () => void;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  trend: string;
  trendUp: boolean | null;
  gradient: string;
  onClick?: () => void;
}

interface ActividadReciente {
  id: number;
  tipo: string;
  titulo: string;
  descripcion: string;
  hora: string;
  habitacion_numero: string;
  fecha_salida: string;
  cliente_nombre: string;
  cliente_apellido: string;
}

interface ActivityItemProps {
  icon: string;
  title: string;
  description: string;
  time: string;
}

const maestroMenu: MenuItem[] = [
  { label: 'Habitaciones', icon: '📋', path: '/habitaciones', color: 'bg-blue-500' },
  { label: 'Tipos de Estadía', icon: '🏨', path: '/tipos-estadia', color: 'bg-indigo-500' },
  { label: 'Días / Jornadas', icon: '⏰', path: '/jornadas', color: 'bg-violet-500' },
  { label: 'Usuarios y Permisos', icon: '👥', path: '/usuarios', color: 'bg-purple-500' },
  { label: 'Configuración', icon: '⚙️', path: '/configuracion', color: 'bg-gray-500' },
  { label: 'Impresoras', icon: '🖨️', path: '/impresoras', color: 'bg-zinc-500' },
  { label: 'Clientes / Huéspedes', icon: '👤', path: '/clientes', color: 'bg-cyan-500' },
  { label: 'Artículos', icon: '📦', path: '/articulos', color: 'bg-amber-500' },
  { label: 'Departamentos', icon: '🏢', path: '/departamentos', color: 'bg-teal-500' },
];

const lobbyMenu: MenuItem[] = [
  { label: 'Ver Habitaciones', icon: '🏨', path: '/lobby', color: 'bg-green-500' },
  { label: 'Reservas', icon: '📅', path: '/reservas', color: 'bg-emerald-500' },
  { label: 'Nueva Estadía', icon: '✅', path: '/reservas/nueva', color: 'bg-lime-500' },
];

const mantenimientoMenu: MenuItem[] = [
  { label: 'Usuarios', icon: '👥', path: '/usuarios', color: 'bg-rose-500' },
  { label: 'Perfiles', icon: '🔐', path: '/perfiles', color: 'bg-pink-500' },
  { label: 'Configuraciones', icon: '⚙️', path: '/configuracion', color: 'bg-orange-500' },
];

function MenuSection({ title, items, icon }: MenuSectionProps) {
  const router = useRouter();
  
  const handleClick = (item: MenuItem) => {
    router.push(item.path);
  };
  
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
        {icon} {title}
      </h3>
      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={item.path}
            onClick={() => handleClick(item)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-200 group"
          >
            <span className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center text-sm shadow-lg group-hover:scale-110 transition-transform`}>
              {item.icon}
            </span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendUp, gradient, onClick }: StatCardProps) {
  return (
    <div 
      className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 hover:bg-white/10 transition-all duration-300 ${onClick ? 'hover:scale-[1.02] hover:shadow-xl cursor-pointer' : ''} group`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        {trendUp !== null && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trendUp 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function ActivityItem({ icon, title, description, time }: ActivityItemProps) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-lg">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{title}</p>
        <p className="text-slate-400 text-sm truncate">{description}</p>
      </div>
      <span className="text-slate-500 text-xs whitespace-nowrap">{time}</span>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true); // Track auth loading state
  const [dbConnected, setDbConnected] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [habitacionesPorVencer, setHabitacionesPorVencer] = useState<ActividadReciente[]>([]);
  const [loadingHabitaciones, setLoadingHabitaciones] = useState(true);
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [loadingHabitacionesLobby, setLoadingHabitacionesLobby] = useState(false);
  const [showLobbyView, setShowLobbyView] = useState(false);
  const [habitacionesStats, setHabitacionesStats] = useState({
    disponibles: 0,
    ocupadas: 0,
    limpieza: 0,
    mantenimiento: 0
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());

  // Estados para gestión de jornadas
  const [jornadas, setJornadas] = useState<any[]>([]);
  const [jornadaActiva, setJornadaActiva] = useState<any>(null);
  const [showModalJornada, setShowModalJornada] = useState(false);
  const [showModalFinalizarJornada, setShowModalFinalizarJornada] = useState(false);
  const [stepJornada, setStepJornada] = useState(1); // 1: credenciales, 2: datos jornada
  const [credencialesJornada, setCredencialesJornada] = useState({ username: '', password: '' });
  const [datosJornada, setDatosJornada] = useState({
    jornada_id: 0,
    fecha_trabajo: new Date().toISOString().split('T')[0],
    monto_bs: 0,
    monto_usd: 0,
    tasa_cambio: 0
  });
  const [datosCierre, setDatosCierre] = useState({
    monto_bs: 0,
    monto_usd: 0,
    observaciones: ''
  });
  const [errorJornada, setErrorJornada] = useState('');
  const [loadingJornada, setLoadingJornada] = useState(false);
  const [ultimaTasa, setUltimaTasa] = useState<number>(0);

  // Hydration fix - set mounted after client-side render
  useEffect(() => {
    setMounted(true);
    // Load user from localStorage on client
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (e) {
          localStorage.removeItem('user');
        }
      }
    }
    // Mark auth check as complete
    setLoadingAuth(false);
  }, []);

  useEffect(() => {
    const checkDbConnection = async () => {
      try {
        const response = await fetch('/api/db-status');
        const result = await response.json();
        setDbConnected(result.success);
      } catch (err) {
        setDbConnected(false);
      }
    };
    checkDbConnection();

    // Actualizar hora cada segundo
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cargar habitaciones por vencer
  useEffect(() => {
    const cargarHabitacionesPorVencer = async () => {
      try {
        const response = await fetch('/api/reservas?por_vencer=true');
        const result = await response.json();
        if (result.success) {
          setHabitacionesPorVencer(result.data);
        }
      } catch (error) {
        console.error('Error cargando habitaciones por vencer:', error);
      } finally {
        setLoadingHabitaciones(false);
      }
    };

    cargarHabitacionesPorVencer();
    // Actualizar cada 30 segundos
    const interval = setInterval(cargarHabitacionesPorVencer, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cargar estadísticas de habitaciones
  useEffect(() => {
    const cargarStatsHabitaciones = async () => {
      try {
        const response = await fetch('/api/habitaciones');
        const result = await response.json();
        if (result.success) {
          const habs = result.data as Habitacion[];
          const stats = {
            disponibles: habs.filter(h => h.estado === 'Disponible' && h.activa !== false).length,
            ocupadas: habs.filter(h => h.estado === 'Ocupada').length,
            limpieza: habs.filter(h => h.estado === 'Limpieza').length,
            mantenimiento: habs.filter(h => h.estado === 'Mantenimiento').length
          };
          setHabitacionesStats(stats);
        }
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
      }
    };

    cargarStatsHabitaciones();
    const interval = setInterval(cargarStatsHabitaciones, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cargar jornadas disponibles y última tasa de cambio
  useEffect(() => {
    const cargarJornadas = async () => {
      try {
        const response = await fetch('/api/jornadas');
        const result = await response.json();
        if (Array.isArray(result)) {
          setJornadas(result.filter((j: any) => j.activo !== false));
        }
      } catch (error) {
        console.error('Error cargando jornadas:', error);
      }
    };

    const cargarTasaCambio = async () => {
      try {
        const response = await fetch('/api/tasas');
        const result = await response.json();
        if (Array.isArray(result) && result.length > 0) {
          setUltimaTasa(result[0].tasa);
          setDatosJornada(prev => ({ ...prev, tasa_cambio: result[0].tasa }));
        }
      } catch (error) {
        console.error('Error cargando tasa de cambio:', error);
      }
    };

    cargarJornadas();
    cargarTasaCambio();
  }, []);

  // Verificar si hay jornada activa
  useEffect(() => {
    const verificarJornadaActiva = async () => {
      try {
        const response = await fetch('/api/jornada'); // Este endpoint devuelve { jornadaActiva: object } o { jornadaActiva: null }
        const result = await response.json();
        if (result.jornadaActiva) {
          setJornadaActiva(result.jornadaActiva);
        }
      } catch (error) {
        console.error('Error verificando jornada:', error);
      }
    };

    verificarJornadaActiva();
  }, []);

  // Cargar habitaciones para Lobby
  const cargarHabitacionesLobby = async () => {
    setLoadingHabitacionesLobby(true);
    setShowLobbyView(true);
    try {
      const response = await fetch('/api/habitaciones');
      const result = await response.json();
      if (result.success) {
        setHabitaciones(result.data);
      }
    } catch (error) {
      console.error('Error cargando habitaciones:', error);
    } finally {
      setLoadingHabitacionesLobby(false);
    }
  };

  // Cambiar estado de habitación
  const cambiarEstadoHabitacion = async (habitacionId: number, nuevoEstado: string) => {
    try {
      const response = await fetch(`/api/habitaciones/${habitacionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      const result = await response.json();
      if (result.success) {
        // Recargar habitaciones
        cargarHabitacionesLobby();
      } else {
        alert(result.error || 'Error al cambiar estado');
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error al cambiar estado');
    }
  };

  // Navegar a lobby con filtro
  const navigateToLobby = (estado: string) => {
    router.push(`/lobby?estado=${estado}`);
  };

  // Redirect to login if not authenticated - only after auth check is complete
  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, router, loadingAuth]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl">🏨</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">MotelDB</h1>
                <p className="text-xs text-slate-400">Sistema de Gestión</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Database Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border ${
              dbConnected 
                ? 'bg-green-500/20 border-green-500/30' 
                : 'bg-red-500/20 border-red-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${dbConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
              <span className={dbConnected ? 'text-green-300' : 'text-red-300'}>
                {dbConnected ? 'Base de datos conectada' : 'Sin conexión'}
              </span>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 bg-white/10 rounded-full px-4 py-1.5">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-white">{user.nombre}</p>
                <p className="text-xs text-slate-400">{user.rol}</p>
              </div>
            </div>

            {/* Clock and Date */}
            <div className="flex flex-col items-end bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl px-4 py-2 border border-white/10">
              <div className="text-2xl font-bold text-white tracking-wider font-mono">
                {currentTime.toLocaleTimeString('es-AR', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit',
                  hour12: true 
                })}
              </div>
              <div className="text-xs text-slate-300 font-medium">
                {currentDate.toLocaleDateString('es-AR', { 
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            </div>

            {/* Botones de Jornada */}
            <div className="flex items-center gap-2">
              {jornadaActiva ? (
                <button
                  onClick={() => {
                    setShowModalFinalizarJornada(true);
                    setCredencialesJornada({ username: '', password: '' });
                    setDatosCierre({ monto_bs: 0, monto_usd: 0, observaciones: '' });
                    setErrorJornada('');
                  }}
                  className="px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white font-medium transition-all flex items-center gap-2"
                >
                  <span>🔴</span>
                  <span className="hidden sm:inline">Finalizar Jornada</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowModalJornada(true);
                    setStepJornada(1);
                    setCredencialesJornada({ username: '', password: '' });
                    setDatosJornada({
                      jornada_id: 0,
                      fecha_trabajo: new Date().toISOString().split('T')[0],
                      monto_bs: 0,
                      monto_usd: 0,
                      tasa_cambio: ultimaTasa || 0
                    });
                    setErrorJornada('');
                  }}
                  className="px-4 py-2 rounded-lg bg-green-500/80 hover:bg-green-500 text-white font-medium transition-all flex items-center gap-2"
                >
                  <span>🟢</span>
                  <span className="hidden sm:inline">Iniciar Jornada</span>
                </button>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-red-200 transition-all"
              title="Cerrar sesión"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Tasa de Cambio Card - Right side */}
      {ultimaTasa > 0 && (
        <div className="absolute right-4 top-20 z-40">
          <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 backdrop-blur-xl rounded-xl border border-amber-500/30 px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-amber-400">💵</span>
              <span className="text-amber-200/80 text-sm font-medium">Tasa del Día:</span>
              <span className="text-amber-400 font-bold text-lg">
                Bs. {ultimaTasa.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden`}>
          <div className="w-72 h-[calc(100vh-64px)] bg-slate-900/50 backdrop-blur-xl border-r border-white/10 p-4 overflow-y-auto">
            <MenuSection title="Maestro" icon="📁" items={maestroMenu} />
            <MenuSection title="Lobby" icon="🏠" items={lobbyMenu} />
            <MenuSection title="Mantenimiento" icon="🔧" items={mantenimientoMenu} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-2xl p-6 mb-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-2">
              ¡Bienvenido de nuevo, {user.nombre}! 👋
            </h2>
            <p className="text-slate-400">
              Aquí está el resumen de tu motel hoy
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
            <StatCard
              title="Disponibles"
              value={String(habitacionesStats.disponibles)}
              icon="🛏️"
              trend="Listas para usar"
              trendUp={null}
              gradient="from-green-500 to-emerald-600"
              onClick={() => navigateToLobby('Disponible')}
            />
            <StatCard
              title="Ocupadas"
              value={String(habitacionesStats.ocupadas)}
              icon="🔒"
              trend="En uso"
              trendUp={null}
              gradient="from-blue-500 to-cyan-600"
              onClick={() => navigateToLobby('Ocupada')}
            />
            <StatCard
              title="Limpieza"
              value={String(habitacionesStats.limpieza)}
              icon="🧹"
              trend="Por limpiar"
              trendUp={null}
              gradient="from-yellow-500 to-orange-600"
              onClick={() => navigateToLobby('Limpieza')}
            />
            <StatCard
              title="Mantenimiento"
              value={String(habitacionesStats.mantenimiento)}
              icon="🔧"
              trend="En reparación"
              trendUp={null}
              gradient="from-red-500 to-pink-600"
              onClick={() => navigateToLobby('Mantenimiento')}
            />
            <StatCard
              title="Por Vencer (5 min)"
              value={String(habitacionesPorVencer.length)}
              icon="⏰"
              trend="Requiere atención"
              trendUp={null}
              gradient="from-red-500 to-orange-600"
              onClick={() => router.push('/reservas?por_vencer=true')}
            />
          </div>

          {/* Habitaciones Por Vencer */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-red-600/20 to-orange-600/20">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                ⏰ Habitaciones por Vencer (menos de 5 min)
              </h3>
            </div>
            <div className="p-6">
              {loadingHabitaciones ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-400 mx-auto mb-3"></div>
                  <p className="text-slate-400">Cargando...</p>
                </div>
              ) : habitacionesPorVencer.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="text-green-400 font-medium">No hay habitaciones por vencer</p>
                  <p className="text-slate-500 text-sm">Todas las habitaciones están fuera de peligro</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {habitacionesPorVencer.map((reserva) => {
                    const fechaSalida = new Date(reserva.fecha_salida);
                    const ahora = new Date();
                    const minutosRestantes = Math.floor((fechaSalida.getTime() - ahora.getTime()) / 60000);
                    
                    return (
                      <div 
                        key={reserva.id}
                        className="bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl border border-red-500/30 p-4 hover:scale-[1.02] hover:shadow-xl transition-all duration-300"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-white">#{reserva.habitacion_numero}</span>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-red-500/30 text-red-300 text-sm font-medium animate-pulse">
                            ⏰ {minutosRestantes} min
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-slate-300">
                            <span>👤</span>
                            <span className="font-medium">{reserva.cliente_nombre} {reserva.cliente_apellido}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400 text-sm">
                            <span>🕐</span>
                            <span>Salida: {fechaSalida.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => router.push(`/reservas/${reserva.id}`)}
                          className="mt-3 w-full py-2 rounded-lg bg-red-500/30 hover:bg-red-500/50 text-red-300 font-medium transition-colors"
                        >
                          Atender
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Actividad Reciente
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <ActivityItem
                  icon="✅"
                  title="Check-in registrado"
                  description="Habitación 101 - Cliente: Juan Pérez"
                  time="Hace 5 minutos"
                />
                <ActivityItem
                  icon="💰"
                  title="Pago recibido"
                  description="Habitación 205 - $450.00"
                  time="Hace 15 minutos"
                />
                <ActivityItem
                  icon="🧹"
                  title="Limpieza completada"
                  description="Habitación 103 lista para出租"
                  time="Hace 30 minutos"
                />
                <ActivityItem
                  icon="📅"
                  title="Nueva reserva"
                  description="Habitación 302 - María García"
                  time="Hace 1 hora"
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Lobby View Modal */}
      {showLobbyView && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-screen p-4">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex justify-between items-center mb-6 mt-4">
                <div>
                  <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <span className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl">
                      🏨
                    </span>
                    Lobby - Vista de Habitaciones
                  </h2>
                  <p className="text-slate-400 mt-1">Gestiona las habitaciones del motel</p>
                </div>
                <button
                  onClick={() => setShowLobbyView(false)}
                  className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2"
                >
                  ✕ Cerrar
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-500/20 rounded-xl p-4 border border-green-500/30">
                  <p className="text-green-400 text-sm">Disponibles</p>
                  <p className="text-2xl font-bold text-white">{habitaciones.filter(h => h.estado === 'Disponible').length}</p>
                </div>
                <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-500/30">
                  <p className="text-blue-400 text-sm">Ocupadas</p>
                  <p className="text-2xl font-bold text-white">{habitaciones.filter(h => h.estado === 'Ocupada').length}</p>
                </div>
                <div className="bg-yellow-500/20 rounded-xl p-4 border border-yellow-500/30">
                  <p className="text-yellow-400 text-sm">Limpieza</p>
                  <p className="text-2xl font-bold text-white">{habitaciones.filter(h => h.estado === 'Limpieza').length}</p>
                </div>
                <div className="bg-red-500/20 rounded-xl p-4 border border-red-500/30">
                  <p className="text-red-400 text-sm">Mantenimiento</p>
                  <p className="text-2xl font-bold text-white">{habitaciones.filter(h => h.estado === 'Mantenimiento').length}</p>
                </div>
              </div>

              {/* Room Grid */}
              {loadingHabitacionesLobby ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                  <p className="mt-4 text-slate-400">Cargando habitaciones...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-8">
                  {habitaciones
                    .filter(h => h.activa !== false)
                    .sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }))
                    .map((habitacion) => (
                      <div
                        key={habitacion.id}
                        className={`rounded-2xl border-2 p-4 transition-all duration-300 hover:scale-105 ${
                          habitacion.estado === 'Disponible' 
                            ? 'bg-green-500/20 border-green-500/40 hover:shadow-green-500/20 hover:shadow-xl'
                            : habitacion.estado === 'Ocupada'
                            ? 'bg-blue-500/20 border-blue-500/40 hover:shadow-blue-500/20 hover:shadow-xl'
                            : habitacion.estado === 'Limpieza'
                            ? 'bg-yellow-500/20 border-yellow-500/40 hover:shadow-yellow-500/20 hover:shadow-xl'
                            : 'bg-red-500/20 border-red-500/40 hover:shadow-red-500/20 hover:shadow-xl'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-2xl font-bold text-white">#{habitacion.numero}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            habitacion.estado === 'Disponible' 
                              ? 'bg-green-500/30 text-green-300'
                              : habitacion.estado === 'Ocupada'
                              ? 'bg-blue-500/30 text-blue-300'
                              : habitacion.estado === 'Limpieza'
                              ? 'bg-yellow-500/30 text-yellow-300'
                              : 'bg-red-500/30 text-red-300'
                          }`}>
                            {habitacion.estado === 'Disponible' ? '🛏️' : habitacion.estado === 'Ocupada' ? '🔒' : habitacion.estado === 'Limpieza' ? '🧹' : '🔧'}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm mb-3">{habitacion.tipo}</p>
                        <div className="space-y-2">
                          {habitacion.estado === 'Disponible' && (
                            <button
                              onClick={() => router.push('/reservas/nueva')}
                              className="w-full py-2 bg-green-500/30 hover:bg-green-500/50 text-green-300 rounded-lg text-sm font-medium transition-colors"
                            >
                              ✅ Check-in
                            </button>
                          )}
                          {habitacion.estado === 'Ocupada' && (
                            <button
                              onClick={() => router.push('/reservas')}
                              className="w-full py-2 bg-blue-500/30 hover:bg-blue-500/50 text-blue-300 rounded-lg text-sm font-medium transition-colors"
                            >
                              📤 Check-out
                            </button>
                          )}
                          {habitacion.estado === 'Disponible' && (
                            <button
                              onClick={() => cambiarEstadoHabitacion(habitacion.id, 'Limpieza')}
                              className="w-full py-2 bg-yellow-500/30 hover:bg-yellow-500/50 text-yellow-300 rounded-lg text-sm font-medium transition-colors"
                            >
                              🧹 Limpieza
                            </button>
                          )}
                          {habitacion.estado === 'Limpieza' && (
                            <button
                              onClick={() => cambiarEstadoHabitacion(habitacion.id, 'Disponible')}
                              className="w-full py-2 bg-green-500/30 hover:bg-green-500/50 text-green-300 rounded-lg text-sm font-medium transition-colors"
                            >
                              ✅ Disponible
                            </button>
                          )}
                          {(habitacion.estado === 'Disponible' || habitacion.estado === 'Limpieza') && (
                            <button
                              onClick={() => cambiarEstadoHabitacion(habitacion.id, 'Mantenimiento')}
                              className="w-full py-2 bg-red-500/30 hover:bg-red-500/50 text-red-300 rounded-lg text-sm font-medium transition-colors"
                            >
                              🔧 Mantenimiento
                            </button>
                          )}
                          {habitacion.estado === 'Mantenimiento' && (
                            <button
                              onClick={() => cambiarEstadoHabitacion(habitacion.id, 'Disponible')}
                              className="w-full py-2 bg-green-500/30 hover:bg-green-500/50 text-green-300 rounded-lg text-sm font-medium transition-colors"
                            >
                              ✅ Disponible
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para Iniciar Jornada */}
      {showModalJornada && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-white/20 w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {stepJornada === 1 ? '🔐 Validar Usuario' : '📋 Iniciar Jornada'}
              </h2>
              <button
                onClick={() => setShowModalJornada(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {errorJornada && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-300 text-sm text-center">{errorJornada}</p>
              </div>
            )}

            {stepJornada === 1 ? (
              // Paso 1: Credenciales
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Usuario</label>
                  <input
                    type="text"
                    value={credencialesJornada.username}
                    onChange={(e) => setCredencialesJornada({ ...credencialesJornada, username: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ingresa tu usuario"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Contraseña</label>
                  <input
                    type="password"
                    value={credencialesJornada.password}
                    onChange={(e) => setCredencialesJornada({ ...credencialesJornada, password: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ingresa tu contraseña"
                    autoComplete="off"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowModalJornada(false)}
                    className="flex-1 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      if (!credencialesJornada.username || !credencialesJornada.password) {
                        setErrorJornada('Por favor ingresa usuario y contraseña');
                        return;
                      }
                      // Validate credentials
                      try {
                        const response = await fetch('/api/auth/login', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(credencialesJornada)
                        });
                        const result = await response.json();
                        if (result.success) {
                          setStepJornada(2);
                          setErrorJornada('');
                        } else {
                          setErrorJornada(result.error || 'Credenciales incorrectas');
                        }
                      } catch (err) {
                        setErrorJornada('Error al validar credenciales');
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                  >
                    Validar
                  </button>
                </div>
              </div>
            ) : (
              // Paso 2: Datos de la jornada
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Jornada a trabajar</label>
                  <select
                    value={datosJornada.jornada_id}
                    onChange={(e) => setDatosJornada({ ...datosJornada, jornada_id: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0} className="text-slate-400">Selecciona una jornada</option>
                    {jornadas.map((j) => (
                      <option key={j.id} value={j.id} className="bg-slate-800">
                        {j.nombre} ({j.hora_inicio} - {j.hora_fin})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Fecha de trabajo</label>
                  <input
                    type="date"
                    value={datosJornada.fecha_trabajo}
                    onChange={(e) => setDatosJornada({ ...datosJornada, fecha_trabajo: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Monto apertura (Bs)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={datosJornada.monto_bs}
                      onChange={(e) => setDatosJornada({ ...datosJornada, monto_bs: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Monto apertura ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={datosJornada.monto_usd}
                      onChange={(e) => setDatosJornada({ ...datosJornada, monto_usd: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tasa de cambio ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={datosJornada.tasa_cambio}
                    onChange={(e) => setDatosJornada({ ...datosJornada, tasa_cambio: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                  {ultimaTasa > 0 && (
                    <p className="text-xs text-slate-400 mt-1">Última tasa registrada: {ultimaTasa} Bs/$</p>
                  )}
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setStepJornada(1)}
                    className="flex-1 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={async () => {
                      if (!datosJornada.jornada_id) {
                        setErrorJornada('Por favor selecciona una jornada');
                        return;
                      }
                      if (!datosJornada.fecha_trabajo) {
                        setErrorJornada('Por favor selecciona una fecha');
                        return;
                      }
                      setLoadingJornada(true);
                      try {
                        const response = await fetch('/api/jornada/iniciar', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            jornada_id: datosJornada.jornada_id,
                            fecha_trabajo: datosJornada.fecha_trabajo,
                            monto_bs: datosJornada.monto_bs,
                            monto_usd: datosJornada.monto_usd,
                            tasa_cambio: datosJornada.tasa_cambio,
                            username: credencialesJornada.username,
                            password: credencialesJornada.password
                          })
                        });
                        const result = await response.json();
                        if (result.success) {
                          setJornadaActiva(result.jornadaActiva);
                          setShowModalJornada(false);
                          alert('Jornada iniciada correctamente');
                        } else {
                          setErrorJornada(result.error || 'Error al iniciar jornada');
                        }
                      } catch (err) {
                        setErrorJornada('Error al iniciar jornada');
                      } finally {
                        setLoadingJornada(false);
                      }
                    }}
                    disabled={loadingJornada}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50"
                  >
                    {loadingJornada ? 'Iniciando...' : 'Aceptar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Finalizar Jornada */}
      {showModalFinalizarJornada && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-white/20 w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">🔴 Finalizar Jornada</h2>
              <button
                onClick={() => setShowModalFinalizarJornada(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {jornadaActiva && (
              <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-xl">
                <p className="text-blue-200"><span className="font-bold">Jornada activa:</span> {jornadaActiva.jornada_nombre}</p>
                <p className="text-blue-200"><span className="font-bold">Usuario:</span> {jornadaActiva.usuario_nombre}</p>
                <p className="text-blue-200"><span className="font-bold">Fecha:</span> {jornadaActiva.fecha_trabajo}</p>
                <p className="text-blue-200"><span className="font-bold">Hora inicio:</span> {jornadaActiva.hora_inicio}</p>
              </div>
            )}

            {errorJornada && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-300 text-sm text-center">{errorJornada}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Monto cierre (Bs)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={datosCierre.monto_bs}
                    onChange={(e) => setDatosCierre({ ...datosCierre, monto_bs: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Monto cierre ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={datosCierre.monto_usd}
                    onChange={(e) => setDatosCierre({ ...datosCierre, monto_usd: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Observaciones</label>
                <textarea
                  value={datosCierre.observaciones}
                  onChange={(e) => setDatosCierre({ ...datosCierre, observaciones: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Observaciones adicionales (opcional)"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModalFinalizarJornada(false)}
                  className="flex-1 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (!jornadaActiva?.id) {
                      setErrorJornada("No hay jornada activa");
                      return;
                    }
                    setLoadingJornada(true);
                    try {
                      const response = await fetch("/api/jornada/finalizar", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          jornada_id: jornadaActiva.id,
                          monto_cierre_bs: datosCierre.monto_bs,
                          monto_cierre_usd: datosCierre.monto_usd,
                          observaciones: datosCierre.observaciones,
                          username: credencialesJornada.username,
                          password: credencialesJornada.password
                        })
                      });
                      const result = await response.json();
                      if (result.success) {
                        setJornadaActiva(null);
                        setShowModalFinalizarJornada(false);
                        alert("Jornada finalizada correctamente");
                      } else {
                        setErrorJornada(result.error || "Error al finalizar jornada");
                      }
                    } catch (err) {
                      setErrorJornada("Error al finalizar jornada");
                    } finally {
                      setLoadingJornada(false);
                    }
                  }}
                  disabled={loadingJornada}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50"
                >
                  {loadingJornada ? "Finalizando..." : "Finalizar Jornada"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
