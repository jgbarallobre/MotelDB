"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Habitacion } from '@/types';

export default function HabitacionesPage() {
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('');

  useEffect(() => {
    fetchHabitaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Disponible':
        return 'bg-green-100 text-green-800';
      case 'Ocupada':
        return 'bg-red-100 text-red-800';
      case 'Limpieza':
        return 'bg-yellow-100 text-yellow-800';
      case 'Mantenimiento':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando habitaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
                ← Volver al Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestión de Habitaciones
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFiltroEstado('')}
              className={`px-4 py-2 rounded-lg transition ${
                filtroEstado === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFiltroEstado('Disponible')}
              className={`px-4 py-2 rounded-lg transition ${
                filtroEstado === 'Disponible'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Disponibles
            </button>
            <button
              onClick={() => setFiltroEstado('Ocupada')}
              className={`px-4 py-2 rounded-lg transition ${
                filtroEstado === 'Ocupada'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Ocupadas
            </button>
            <button
              onClick={() => setFiltroEstado('Limpieza')}
              className={`px-4 py-2 rounded-lg transition ${
                filtroEstado === 'Limpieza'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En Limpieza
            </button>
            <button
              onClick={() => setFiltroEstado('Mantenimiento')}
              className={`px-4 py-2 rounded-lg transition ${
                filtroEstado === 'Mantenimiento'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mantenimiento
            </button>
          </div>
        </div>

        {/* Grid de Habitaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {habitaciones.map((habitacion) => (
            <div
              key={habitacion.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Habitación {habitacion.numero}
                    </h3>
                    <p className="text-gray-600">{habitacion.tipo}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getEstadoColor(
                      habitacion.estado
                    )}`}
                  >
                    {habitacion.estado}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Por Hora:</span>
                    <span className="font-semibold">${habitacion.precio_hora}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Por Noche:</span>
                    <span className="font-semibold">${habitacion.precio_noche}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacidad:</span>
                    <span className="font-semibold">{habitacion.capacidad} personas</span>
                  </div>
                </div>

                {habitacion.descripcion && (
                  <p className="text-sm text-gray-600 mb-4">{habitacion.descripcion}</p>
                )}

                {/* Acciones */}
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-500 mb-2">Cambiar estado:</p>
                  <div className="flex gap-2 flex-wrap">
                    {habitacion.estado !== 'Disponible' && (
                      <button
                        onClick={() => cambiarEstado(habitacion.id, 'Disponible')}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition"
                      >
                        Disponible
                      </button>
                    )}
                    {habitacion.estado !== 'Limpieza' && habitacion.estado !== 'Ocupada' && (
                      <button
                        onClick={() => cambiarEstado(habitacion.id, 'Limpieza')}
                        className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200 transition"
                      >
                        Limpieza
                      </button>
                    )}
                    {habitacion.estado !== 'Mantenimiento' && habitacion.estado !== 'Ocupada' && (
                      <button
                        onClick={() => cambiarEstado(habitacion.id, 'Mantenimiento')}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition"
                      >
                        Mantenimiento
                      </button>
                    )}
                  </div>
                </div>

                {/* Botón Check-in */}
                {habitacion.estado === 'Disponible' && (
                  <Link
                    href={`/reservas/nueva?habitacion=${habitacion.id}`}
                    className="mt-4 block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Hacer Check-in
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {habitaciones.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No hay habitaciones con este estado</p>
          </div>
        )}
      </main>
    </div>
  );
}
