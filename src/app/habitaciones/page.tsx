"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Habitacion } from '@/types';

export default function HabitacionesPage() {
  const router = useRouter();
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('');

  useEffect(() => {
    fetchHabitaciones();
  }, [filtroEstado]);

  const fetchHabitaciones = async () => {
    try {
      const url = filtroEstado
        ? `/api/habitaciones?estado=${filtroEstado}`
        : '/api/habitaciones';
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

  const cambiarEstado = async (id: number, nuevoEstado: string) => {
    try {
      const response = await fetch(`/api/habitaciones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (response.ok) {
        fetchHabitaciones();
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
    }
  };

  const getEstadoConfig = (estado: string) => {
    switch (estado) {
      case 'Disponible':
        return { 
          bg: 'from-green-500 to-emerald-600', 
          text: 'text-green-400',
          bgLight: 'bg-green-500/10',
          border: 'border-green-500/20',
          icon: '✓'
        };
      case 'Ocupada':
        return { 
          bg: 'from-red-500 to-rose-600', 
          text: 'text-red-400',
          bgLight: 'bg-red-500/10',
          border: 'border-red-500/20',
          icon: '🔒'
        };
      case 'Limpieza':
        return { 
          bg: 'from-yellow-500 to-amber-600', 
          text: 'text-yellow-400',
          bgLight: 'bg-yellow-500/10',
          border: 'border-yellow-500/20',
          icon: '🧹'
        };
      case 'Mantenimiento':
        return { 
          bg: 'from-gray-500 to-slate-600', 
          text: 'text-gray-400',
          bgLight: 'bg-gray-500/10',
          border: 'border-gray-500/20',
          icon: '🔧'
        };
      default:
        return { 
          bg: 'from-gray-500 to-slate-600', 
          text: 'text-gray-400',
          bgLight: 'bg-gray-500/10',
          border: 'border-gray-500/20',
          icon: '?'
        };
    }
  };

  const filtros = [
    { estado: '', label: 'Todas', color: 'from-slate-500 to-slate-600' },
    { estado: 'Disponible', label: 'Disponibles', color: 'from-green-500 to-emerald-600' },
    { estado: 'Ocupada', label: 'Ocupadas', color: 'from-red-500 to-rose-600' },
    { estado: 'Limpieza', label: 'En Limpieza', color: 'from-yellow-500 to-amber-600' },
    { estado: 'Mantenimiento', label: 'Mantenimiento', color: 'from-gray-500 to-slate-600' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Cargando habitaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <Link 
                href="/dashboard" 
                className="text-blue-400 hover:text-blue-300 text-sm mb-2 inline-flex items-center gap-1 transition-colors"
              >
                ← Volver al Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <span className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
                  🏠
                </span>
                Gestión de Habitaciones
              </h1>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Total de habitaciones</p>
              <p className="text-2xl font-bold text-white">{habitaciones.length}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {filtros.map((filtro) => (
              <button
                key={filtro.estado}
                onClick={() => setFiltroEstado(filtro.estado)}
                className={`px-4 py-2 rounded-xl transition-all duration-200 font-medium ${
                  filtroEstado === filtro.estado
                    ? `bg-gradient-to-r ${filtro.color} text-white shadow-lg`
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {filtro.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Habitaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {habitaciones.map((habitacion) => {
            const config = getEstadoConfig(habitacion.estado);
            return (
              <div
                key={habitacion.id}
                className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden hover:bg-white/10 hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 group"
              >
                {/* Header with gradient */}
                <div className={`bg-gradient-to-r ${config.bg} p-4`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-white">#{habitacion.numero}</span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white/20 text-white text-sm font-medium">
                      {config.icon} {habitacion.estado}
                    </span>
                  </div>
                  <p className="text-white/80 text-sm mt-1">{habitacion.tipo}</p>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                      <span className="text-slate-400 text-sm">🕐 Por Hora</span>
                      <span className="font-bold text-white">${habitacion.precio_hora}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                      <span className="text-slate-400 text-sm">🌙 Por Noche</span>
                      <span className="font-bold text-white">${habitacion.precio_noche}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                      <span className="text-slate-400 text-sm">👥 Capacidad</span>
                      <span className="font-bold text-white">{habitacion.capacidad} personas</span>
                    </div>
                  </div>

                  {habitacion.descripcion && (
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">{habitacion.descripcion}</p>
                  )}

                  {/* Acciones */}
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-xs text-slate-500 mb-2">Cambiar estado:</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {habitacion.estado !== 'Disponible' && (
                        <button
                          onClick={() => cambiarEstado(habitacion.id, 'Disponible')}
                          className="px-2.5 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs hover:bg-green-500/40 transition-all"
                        >
                          ✓ Disponible
                        </button>
                      )}
                      {habitacion.estado !== 'Limpieza' && habitacion.estado !== 'Ocupada' && (
                        <button
                          onClick={() => cambiarEstado(habitacion.id, 'Limpieza')}
                          className="px-2.5 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs hover:bg-yellow-500/40 transition-all"
                        >
                          🧹 Limpieza
                        </button>
                      )}
                      {habitacion.estado !== 'Mantenimiento' && habitacion.estado !== 'Ocupada' && (
                        <button
                          onClick={() => cambiarEstado(habitacion.id, 'Mantenimiento')}
                          className="px-2.5 py-1.5 bg-gray-500/20 text-gray-400 rounded-lg text-xs hover:bg-gray-500/40 transition-all"
                        >
                          🔧 Mantenimiento
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Botón Check-in */}
                  {habitacion.estado === 'Disponible' && (
                    <Link
                      href={`/reservas/nueva?habitacion=${habitacion.id}`}
                      className="mt-4 block w-full text-center px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
                    >
                      ✅ Hacer Check-in
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {habitaciones.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🏠</span>
            </div>
            <p className="text-slate-400 text-lg">No hay habitaciones con este estado</p>
            <p className="text-slate-500 text-sm mt-1">Intenta cambiar el filtro para ver más resultados</p>
          </div>
        )}
      </main>
    </div>
  );
}
