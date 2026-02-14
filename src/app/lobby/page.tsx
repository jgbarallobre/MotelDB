'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Habitacion } from '@/types';

export default function LobbyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [reservasPorVencer, setReservasPorVencer] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [filtroActiva, setFiltroActiva] = useState<string>('');
  const [filtroPorVencer, setFiltroPorVencer] = useState<boolean>(false);
  const [dbConnected, setDbConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reservasActivas, setReservasActivas] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [historialLimpieza, setHistorialLimpieza] = useState<any[]>([]);

  // Get filter from URL params
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    
    // Map filter values to estado values
    if (filterParam) {
      switch (filterParam) {
        case 'disponibles':
          setFiltroEstado('Disponible');
          break;
        case 'ocupadas':
          setFiltroEstado('Ocupada');
          break;
        case 'limpieza':
          setFiltroEstado('Limpieza');
          break;
        case 'mantenimiento':
          setFiltroEstado('Mantenimiento');
          break;
        case 'por_vencer':
          // Handle por_vencer filter - will show expiring reservations
          setFiltroPorVencer(true);
          fetchReservasPorVencer();
          break;
        default:
          setFiltroEstado('');
      }
    }
    
    // Also support legacy 'estado' param for backward compatibility
    const estadoParam = searchParams.get('estado');
    if (estadoParam) {
      setFiltroEstado(estadoParam);
    }
  }, [searchParams]);

  // Check database connection
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
    fetchReservasActivas();
    fetchHistorialLimpieza();
    
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch rooms when filters change
  useEffect(() => {
    if (!filtroPorVencer) {
      fetchHabitaciones();
    }
  }, [filtroEstado, filtroActiva, filtroPorVencer]);

  const fetchHabitaciones = async () => {
    setLoading(true);
    try {
      let url = '/api/habitaciones';
      const params = new URLSearchParams();
      
      if (filtroEstado !== '') {
        params.append('estado', filtroEstado);
      }
      if (filtroActiva !== '') {
        params.append('activa', filtroActiva);
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setHabitaciones(result.data);
      }
    } catch (error) {
      console.error('Error cargando habitaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReservasPorVencer = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reservas?por_vencer=true');
      const result = await response.json();
      
      if (result.success) {
        setReservasPorVencer(result.data);
      }
    } catch (error) {
      console.error('Error cargando reservas por vencer:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Disponible':
        return 'bg-green-500';
      case 'Ocupada':
        return 'bg-blue-500';
      case 'Limpieza':
        return 'bg-yellow-500';
      case 'Mantenimiento':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'Disponible':
        return 'Disponible';
      case 'Ocupada':
        return 'Ocupada';
      case 'Limpieza':
        return 'Limpieza';
      case 'Mantenimiento':
        return 'Mantenimiento';
      default:
        return estado;
    }
  };

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

  const getReservaActiva = (habitacionId: number) => {
    return reservasActivas.find(r => r.habitacion_id === habitacionId);
  };

  const handleCheckIn = (habitacion: Habitacion) => {
    router.push(`/reservas/nueva?habitacion=${habitacion.id}`);
  };

  const handleCheckOut = async (habitacionId: number) => {
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
    if (!confirm(`¿Iniciar ${tipo} para esta habitación?`)) {
      return;
    }
    
    setProcessingId(habitacionId);
    try {
      // Get current user from localStorage
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

  const navigateToLobby = (filter: string) => {
    if (filter === 'all') {
      router.push('/lobby');
    } else {
      router.push(`/lobby?filter=${filter}`);
    }
  };

  // Calculate stats
  const stats = {
    disponibles: habitaciones.filter(h => h.estado === 'Disponible' && h.activa !== false).length,
    ocupadas: habitaciones.filter(h => h.estado === 'Ocupada').length,
    limpieza: habitaciones.filter(h => h.estado === 'Limpieza').length,
    mantenimiento: habitaciones.filter(h => h.estado === 'Mantenimiento').length,
    total: habitaciones.length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Volver al Dashboard"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl">🏨</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Lobby - Habitaciones</h1>
                <p className="text-xs text-slate-400">Vista de habitaciones</p>
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
                {dbConnected ? 'DB' : 'Sin DB'}
              </span>
            </div>

            {/* Clock */}
            <div className="flex flex-col items-end bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl px-4 py-2 border border-white/10">
              <div className="text-xl font-bold text-white tracking-wider font-mono">
                {currentTime.toLocaleTimeString('es-AR', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit',
                  hour12: true 
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => navigateToLobby('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filtroEstado === '' && !filtroPorVencer
                ? 'bg-white text-slate-900'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Todas ({stats.total})
          </button>
          <button
            onClick={() => navigateToLobby('disponibles')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              filtroEstado === 'Disponible'
                ? 'bg-green-500 text-white'
                : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            Disponibles ({stats.disponibles})
          </button>
          <button
            onClick={() => navigateToLobby('ocupadas')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              filtroEstado === 'Ocupada'
                ? 'bg-blue-500 text-white'
                : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            Ocupadas ({stats.ocupadas})
          </button>
          <button
            onClick={() => navigateToLobby('limpieza')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              filtroEstado === 'Limpieza'
                ? 'bg-yellow-500 text-white'
                : 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            Limpieza ({stats.limpieza})
          </button>
          <button
            onClick={() => navigateToLobby('mantenimiento')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              filtroEstado === 'Mantenimiento'
                ? 'bg-red-500 text-white'
                : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            Mantenimiento ({stats.mantenimiento})
          </button>
          <button
            onClick={() => navigateToLobby('por_vencer')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              filtroPorVencer
                ? 'bg-orange-500 text-white'
                : 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
            Por Vencer ({reservasPorVencer.length})
          </button>
        </div>

        {/* Room Grid - Only show regular rooms when not in por_vencer mode */}
        {!filtroPorVencer ? (
          loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : (
            <>
              {habitaciones.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏨</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No hay habitaciones</h3>
                  <p className="text-slate-400">
                    {filtroEstado 
                      ? `No hay habitaciones con estado "${getEstadoLabel(filtroEstado)}"`
                      : 'No hay habitaciones disponibles'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {habitaciones.map((habitacion) => {
                    const reserva = getReservaActiva(habitacion.id);
                    const isProcessing = processingId === habitacion.id;
                    const historialActivo = getHistorialActivo(habitacion.id);
                    
                    return (
                      <div
                        key={habitacion.id}
                        className={`relative bg-white/5 backdrop-blur-xl rounded-2xl border p-4 transition-all duration-300 hover:scale-105 cursor-pointer group aspect-square flex flex-col ${
                          habitacion.estado === 'Disponible' 
                            ? 'border-green-500/30 hover:border-green-400' 
                            : habitacion.estado === 'Ocupada'
                            ? 'border-red-500/30 hover:border-red-400'
                            : habitacion.estado === 'Limpieza'
                            ? 'border-blue-500/30 hover:border-blue-400'
                            : 'border-yellow-500/30 hover:border-yellow-400'
                        } ${habitacion.activa === false ? 'opacity-50' : ''}`}
                      >
                        {/* Room Number */}
                        <div className="text-center mb-2">
                          <span className="text-4xl font-bold text-white">{habitacion.numero}</span>
                        </div>
                        
                        {/* Status Badge */}
                        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium text-white ${getEstadoColor(habitacion.estado)}`}>
                          {getEstadoLabel(habitacion.estado || 'Sin estado')}
                        </div>
                        
                        {/* Room Info */}
                        <div className="text-center mb-2 flex-1">
                          <p className="text-slate-400 text-sm truncate">
                            {habitacion.descripcion || 'Sin descripción'}
                          </p>
                          {habitacion.activa === false && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-red-500/20 text-red-300 text-xs rounded-full">
                              Inactiva
                            </span>
                          )}
                          
                          {/* Timer for Mantenimiento/Limpieza */}
                          {(habitacion.estado === 'Mantenimiento' || habitacion.estado === 'Limpieza') && historialActivo && (
                            <div className={`mt-2 p-2 rounded-lg ${habitacion.estado === 'Mantenimiento' ? 'bg-yellow-500/20' : 'bg-blue-500/20'}`}>
                              <div className={`text-xs ${habitacion.estado === 'Mantenimiento' ? 'text-yellow-300' : 'text-blue-300'} mb-1`}>
                                {habitacion.estado === 'Mantenimiento' ? '⏱️ En mantenimiento' : '🧹 En limpieza'}
                              </div>
                              <div className={`text-xl font-mono font-bold ${habitacion.estado === 'Mantenimiento' ? 'text-yellow-400' : 'text-blue-400'}`}>
                                {getElapsedTime(historialActivo.fecha_inicio)}
                              </div>
                              <div className={`text-xs mt-1 ${habitacion.estado === 'Mantenimiento' ? 'text-yellow-300' : 'text-blue-300'}`}>
                                Inicio: {new Date(historialActivo.fecha_inicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Operation Buttons */}
                        <div className="mt-2 space-y-1">
                          {habitacion.estado === 'Disponible' && (
                            <>
                              <button
                                onClick={() => handleCheckIn(habitacion)}
                                className="w-full py-1.5 px-2 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded-lg transition-colors"
                              >
                                📥 Check-in
                              </button>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleIniciarLimpiezaMantenimiento(habitacion.id, 'Limpieza')}
                                  disabled={isProcessing}
                                  className="flex-1 py-1 px-1 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                                >
                                  🧹
                                </button>
                                <button
                                  onClick={() => handleIniciarLimpiezaMantenimiento(habitacion.id, 'Mantenimiento')}
                                  disabled={isProcessing}
                                  className="flex-1 py-1 px-1 bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
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

                        {/* Hover Effect */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )
        ) : (
          /* Por Vencer View - Show reservations about to expire */
          loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : (
            <>
              {reservasPorVencer.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No hay habitaciones por vencer</h3>
                  <p className="text-slate-400">
                    Todas las habitaciones tienen tiempo suficiente
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {reservasPorVencer.map((reserva) => (
                    <div
                      key={reserva.id}
                      className="relative bg-white/5 backdrop-blur-xl rounded-2xl border border-orange-500/30 p-4 hover:bg-white/10 transition-all duration-300 hover:scale-105 cursor-pointer group"
                    >
                      {/* Room Number */}
                      <div className="text-center mb-3">
                        <span className="text-3xl font-bold text-white">{reserva.habitacion_numero}</span>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium text-white bg-orange-500">
                        Por Vencer
                      </div>
                      
                      {/* Reservation Info */}
                      <div className="text-center">
                        <p className="text-slate-400 text-sm truncate">
                          {reserva.cliente_nombre} {reserva.cliente_apellido}
                        </p>
                        <p className="text-orange-400 text-xs mt-1">
                          Salida: {reserva.fecha_salida}
                        </p>
                      </div>

                      {/* Hover Effect */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}
