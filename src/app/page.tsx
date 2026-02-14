"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DashboardData {
  habitaciones_disponibles: number;
  habitaciones_ocupadas: number;
  reservas_activas: number;
  ingresos_hoy: number;
  ingresos_mes: number;
  habitaciones_por_estado: { estado: string; cantidad: number }[];
  ultimas_reservas: any[];
}

interface Habitacion {
  id: number;
  numero: string;
  tipo: string;
  precio_hora: number;
  precio_noche: number;
  estado: string;
  activa: boolean;
}

export default function Home() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [reservasActivas, setReservasActivas] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [historialLimpieza, setHistorialLimpieza] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [jornadaActiva, setJornadaActiva] = useState<any>(null);
  const [loadingJornada, setLoadingJornada] = useState(true);

  useEffect(() => {
    // Verificar autenticación
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
    
    fetchDashboard();
    fetchHabitaciones();
    fetchReservasActivas();
    fetchHistorialLimpieza();
    
    // Check if jornada is active
    const checkJornadaActiva = async () => {
      try {
        const response = await fetch('/api/jornada');
        const result = await response.json();
        setJornadaActiva(result.jornada);
      } catch (error) {
        console.error('Error checking jornada:', error);
      } finally {
        setLoadingJornada(false);
      }
    };
    checkJornadaActiva();

    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  const fetchReservasActivas = async () => {
    try {
      const response = await fetch('/api/reservas?estado=activa');
      const result = await response.json();
      if (result.success) {
        setReservasActivas(result.data);
      }
    } catch (error) {
      console.error('Error cargando reservas activas:', error);
    }
  };

  const fetchHistorialLimpieza = async () => {
    try {
      const response = await fetch('/api/limpieza');
      const result = await response.json();
      if (result.success) {
        setHistorialLimpieza(result.data);
      }
    } catch (error) {
      console.error('Error cargando historial de limpieza:', error);
    }
  };

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/dashboard');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHabitaciones = async () => {
    try {
      const response = await fetch('/api/habitaciones');
      const result = await response.json();
      if (result.success) {
        setHabitaciones(result.data);
      }
    } catch (error) {
      console.error('Error cargando habitaciones:', error);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Disponible':
        return 'bg-green-500';
      case 'Ocupada':
        return 'bg-red-500';
      case 'Mantenimiento':
        return 'bg-yellow-500';
      case 'Limpieza':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEstadoEmoji = (estado: string) => {
    switch (estado) {
      case 'Disponible':
        return '✅';
      case 'Ocupada':
        return '🔴';
      case 'Mantenimiento':
        return '🔧';
      case 'Limpieza':
        return '🧹';
      default:
        return '⚪';
    }
  };

  const getReservaActiva = (habitacionId: number) => {
    return reservasActivas.find(r => r.habitacion_id === habitacionId);
  };

  const handleCheckIn = (habitacion: Habitacion) => {
    // Check if jornada is active
    if (!jornadaActiva) {
      alert('Debe iniciar una jornada de trabajo antes de realizar check-in');
      return;
    }
    router.push(`/reservas/nueva?habitacion=${habitacion.id}`);
  };

  const handleCheckOut = async (habitacionId: number) => {
    // Check if jornada is active
    if (!jornadaActiva) {
      alert('Debe iniciar una jornada de trabajo antes de realizar check-out');
      return;
    }

    const reserva = getReservaActiva(habitacionId);
    if (!reserva) {
      alert('No hay reserva activa para esta habitación');
      return;
    }
    
    if (!confirm('¿Confirmar check-out de esta habitación?')) {
      return;
    }
    
    setProcessingId(habitacionId);
    try {
      const response = await fetch(`/api/reservas/${reserva.id}/checkout`, {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        alert('Check-out realizado con éxito');
        fetchHabitaciones();
        fetchReservasActivas();
        fetchDashboard();
      } else {
        alert('Error en check-out: ' + result.error);
      }
    } catch (error) {
      console.error('Error en check-out:', error);
      alert('Error realizando check-out');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCambiarEstado = async (habitacionId: number, nuevoEstado: string) => {
    if (!confirm(`¿Cambiar estado a "${nuevoEstado}"?`)) {
      return;
    }
    
    setProcessingId(habitacionId);
    try {
      const response = await fetch(`/api/habitaciones/${habitacionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const result = await response.json();
      
      if (result.success) {
        fetchHabitaciones();
        fetchDashboard();
      } else {
        alert('Error cambiando estado: ' + result.error);
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error cambiando estado');
    } finally {
      setProcessingId(null);
    }
  };

  // Get the active cleaning/maintenance record for a room
  const getHistorialActivo = (habitacionId: number) => {
    return historialLimpieza.find(
      h => h.habitacion_id === habitacionId && h.fecha_fin === null
    );
  };

  // Calculate elapsed time for mantenimiento
  const getElapsedTime = (fechaInicio: string) => {
    const start = new Date(fechaInicio);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
    
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle starting limpieza or mantenimiento
  const handleIniciarLimpiezaMantenimiento = async (habitacionId: number, tipo: 'Limpieza' | 'Mantenimiento') => {
    // Check if jornada is active
    if (!jornadaActiva) {
      alert('Debe iniciar una jornada de trabajo antes de iniciar limpieza o mantenimiento');
      return;
    }

    if (!confirm(`¿Iniciar ${tipo} para esta habitación?`)) {
      return;
    }
    
    setProcessingId(habitacionId);
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      // Send local time from the client (browser/PC time)
      const fechaInicio = new Date().toISOString();
      
      const response = await fetch('/api/limpieza', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'iniciar',
          habitacion_id: habitacionId,
          tipo_accion: tipo,
          usuario_id: user?.id || null,
          fecha_inicio: fechaInicio
        }),
      });
      const result = await response.json();
      
      if (result.success) {
        fetchHabitaciones();
        fetchHistorialLimpieza();
        fetchDashboard();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error iniciando ' + tipo + ':', error);
      alert('Error iniciando ' + tipo);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle finishing limpieza
  const handleFinalizarLimpieza = async (habitacionId: number) => {
    if (!confirm('¿Confirmar limpieza realizada? La habitación pasará a estar disponible.')) {
      return;
    }
    
    setProcessingId(habitacionId);
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await fetch('/api/limpieza', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'finalizar',
          habitacion_id: habitacionId,
          usuario_id: user?.id || null
        }),
      });
      const result = await response.json();
      
      if (result.success) {
        fetchHabitaciones();
        fetchHistorialLimpieza();
        fetchDashboard();
        alert(`Limpieza finalizada. Duración: ${result.duracion_minutos} minutos`);
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error finalizando limpieza:', error);
      alert('Error finalizando limpieza');
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">
                🏨 Lobby - Motel
              </h1>
              {user && (
                <p className="text-sm text-gray-400 mt-1">
                  Bienvenido, <span className="text-blue-400 font-medium">{user.nombre}</span> ({user.rol})
                </p>
              )}
            </div>
            <div className="flex gap-3 items-center">
              <Link
                href="/habitaciones"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Gestión
              </Link>
              <Link
                href="/reservas"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Reservas
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
              >
                <span>🚪</span>
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-600/20 backdrop-blur-sm border border-green-500/30 rounded-lg p-4">
            <div className="text-green-400 text-sm font-medium">Disponibles</div>
            <div className="text-3xl font-bold text-white mt-1">
              {data?.habitaciones_disponibles || 0}
            </div>
          </div>
          <div className="bg-red-600/20 backdrop-blur-sm border border-red-500/30 rounded-lg p-4">
            <div className="text-red-400 text-sm font-medium">Ocupadas</div>
            <div className="text-3xl font-bold text-white mt-1">
              {data?.habitaciones_ocupadas || 0}
            </div>
          </div>
          <div className="bg-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-lg p-4">
            <div className="text-blue-400 text-sm font-medium">Reservas</div>
            <div className="text-3xl font-bold text-white mt-1">
              {data?.reservas_activas || 0}
            </div>
          </div>
          <div className="bg-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-lg p-4">
            <div className="text-purple-400 text-sm font-medium">Ingresos Hoy</div>
            <div className="text-2xl font-bold text-white mt-1">
              ${data?.ingresos_hoy.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>

        {/* Habitaciones Grid con Scroll */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Habitaciones</h2>
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {habitaciones
                .filter(h => h.activa !== false)
                .sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }))
                .map((habitacion) => {
                  const reserva = getReservaActiva(habitacion.id);
                  const isProcessing = processingId === habitacion.id;
                  const historialActivo = getHistorialActivo(habitacion.id);
                  
                  return (
                    <div
                      key={habitacion.id}
                      className={`
                        aspect-square rounded-xl p-3 flex flex-col items-center justify-between
                        transition-all duration-200 border-2 relative overflow-hidden
                        ${habitacion.estado === 'Disponible'
                          ? 'bg-green-600/20 border-green-500/50 hover:border-green-400 hover:scale-105'
                          : habitacion.estado === 'Ocupada'
                          ? 'bg-red-600/20 border-red-500/50'
                          : habitacion.estado === 'Limpieza'
                          ? 'bg-blue-600/20 border-blue-500/50'
                          : 'bg-yellow-600/20 border-yellow-500/50'
                        }
                      `}
                    >
                      {/* Status Icon */}
                      <div className="text-3xl mb-1">{getEstadoEmoji(habitacion.estado)}</div>
                      
                      {/* Room Number */}
                      <div className="text-2xl font-bold text-white">{habitacion.numero}</div>
                      <div className="text-xs text-gray-300">{habitacion.tipo}</div>
                      
                      {/* Price */}
                      <div className="text-sm font-semibold text-white">
                        ${habitacion.precio_hora}/hr
                      </div>
                      
                      {/* Status Badge */}
                      <div className={`
                        text-xs px-2 py-0.5 rounded-full
                        ${habitacion.estado === 'Disponible' ? 'bg-green-500/30 text-green-200' : ''}
                        ${habitacion.estado === 'Ocupada' ? 'bg-red-500/30 text-red-200' : ''}
                        ${habitacion.estado === 'Limpieza' ? 'bg-blue-500/30 text-blue-200' : ''}
                        ${habitacion.estado === 'Mantenimiento' ? 'bg-yellow-500/30 text-yellow-200' : ''}
                      `}>
                        {habitacion.estado}
                      </div>
                      
                      {/* Timer for Mantenimiento/Limpieza */}
                      {(habitacion.estado === 'Mantenimiento' || habitacion.estado === 'Limpieza') && historialActivo && (
                        <div className={`mt-1 p-1 rounded text-center ${habitacion.estado === 'Mantenimiento' ? 'bg-yellow-500/20' : 'bg-blue-500/20'}`}>
                          <div className={`text-xs ${habitacion.estado === 'Mantenimiento' ? 'text-yellow-300' : 'text-blue-300'}`}>
                            {habitacion.estado === 'Mantenimiento' ? '⏱️' : '🧹'} {getElapsedTime(historialActivo.fecha_inicio)}
                          </div>
                          <div className={`text-xs ${habitacion.estado === 'Mantenimiento' ? 'text-yellow-300' : 'text-blue-300'}`}>
                            {new Date(historialActivo.fecha_inicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      )}
                      
                      {/* Operation Buttons */}
                      <div className="mt-2 w-full">
                        {habitacion.estado === 'Disponible' && (
                          <>
                            <button
                              onClick={() => handleCheckIn(habitacion)}
                              className="w-full py-1.5 px-2 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                              📥 Check-in
                            </button>
                            <div className="flex gap-1 mt-1">
                              <button
                                onClick={() => handleIniciarLimpiezaMantenimiento(habitacion.id, 'Limpieza')}
                                disabled={isProcessing}
                                className="flex-1 py-1 px-1 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                                title="Limpieza"
                              >
                                🧹
                              </button>
                              <button
                                onClick={() => handleIniciarLimpiezaMantenimiento(habitacion.id, 'Mantenimiento')}
                                disabled={isProcessing}
                                className="flex-1 py-1 px-1 bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                                title="Mantenimiento"
                              >
                                🔧
                              </button>
                            </div>
                          </>
                        )}
                        
                        {habitacion.estado === 'Ocupada' && (
                          <button
                            onClick={() => handleCheckOut(habitacion.id)}
                            disabled={isProcessing}
                            className="w-full py-1.5 px-2 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isProcessing ? '⏳' : '📤'} Check-out
                          </button>
                        )}
                        
                        {habitacion.estado === 'Limpieza' && (
                          <button
                            onClick={() => handleFinalizarLimpieza(habitacion.id)}
                            disabled={isProcessing}
                            className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isProcessing ? '⏳' : '✅'} Limpieza Realizada
                          </button>
                        )}
                        
                        {habitacion.estado === 'Mantenimiento' && (
                          <button
                            onClick={() => handleCambiarEstado(habitacion.id, 'Disponible')}
                            disabled={isProcessing}
                            className="w-full py-1.5 px-2 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isProcessing ? '⏳' : '🔧'} Liberar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </main>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.8);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.9);
        }
      `}</style>
    </div>
  );
}
